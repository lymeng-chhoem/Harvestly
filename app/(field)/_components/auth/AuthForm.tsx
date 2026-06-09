"use client";

import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createFirebaseAuth } from "@/lib/firebase/client";
import { profileSetupPath } from "@/lib/profile";
import { getPublicSiteUrl } from "@/lib/supabase/config";
import { useProduct } from "../state/ProductProvider";

type AuthMode = "login" | "signup";

type PasswordRequirement = {
  id: string;
  label: string;
  hint?: string;
  test: (password: string) => boolean;
};

const passwordRequirements: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { id: "number", label: "One number", test: (value) => /\d/.test(value) },
  {
    id: "special",
    label: "One special character",
    hint: "! @ # $ % & * ?",
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

function checkPasswordRequirements(password: string) {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
}

function firebaseMessage(error: unknown, fallback: string) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code.includes("email-already-in-use")) return "This email already has an account. Log in instead, or use Forgot password.";
  if (code.includes("weak-password")) return "Use a stronger password, then try again.";
  if (code.includes("too-many-requests")) return "Too many requests. Wait a few minutes, then try again.";
  if (code.includes("popup")) return "The sign-in window could not be opened. Please try again.";
  return fallback;
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const callbackError = searchParams.get("error") === "callback"
    ? "That sign-in link is invalid or expired. Please try again."
    : null;
  const nextQuery = returnPath === "/" ? "" : `?next=${encodeURIComponent(returnPath)}`;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const isSignup = mode === "signup";
  const passwordChecks = checkPasswordRequirements(password);
  const passwordMeetsRequirements = passwordChecks.every((requirement) => requirement.met);
  const showPasswordRequirements = isSignup && password.length > 0;

  function authActionUrl() {
    const origin = typeof window === "undefined" ? getPublicSiteUrl() : window.location.origin;
    if (!origin) return null;
    return `${origin.replace(/\/+$/, "")}/auth/action?next=${encodeURIComponent(returnPath)}`;
  }

  async function establishSession(user: User) {
    if (!user.emailVerified) return { ok: false as const, error: "email_not_verified" as const };
    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return response.ok
      ? { ok: true as const }
      : { ok: false as const, error: "session" as const };
  }

  async function signedInDestination() {
    const response = await fetch("/api/me", { cache: "no-store" });
    const payload: unknown = await response.json().catch(() => null);
    const profile = response.ok && payload && typeof payload === "object" && "profile" in payload
      ? (payload as { profile?: { profileComplete?: unknown } }).profile
      : null;
    return profile?.profileComplete ? returnPath : profileSetupPath(returnPath);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = createFirebaseAuth();
    if (!auth) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const submittedEmail = email.trim().toLowerCase();

    if (isSignup) {
      if (!passwordMeetsRequirements) {
        setMessage("Meet all password requirements before creating your account.");
        setPending(false);
        return;
      }
      const actionUrl = authActionUrl();
      if (!actionUrl) {
        setMessage("Authentication site URL is not configured yet.");
        setPending(false);
        return;
      }
      try {
        const credential = await createUserWithEmailAndPassword(auth, submittedEmail, password);
        await sendEmailVerification(credential.user, { url: actionUrl });
        setConfirmationEmail(submittedEmail);
        setEmailSent(true);
      } catch (error) {
        setMessage(firebaseMessage(error, "Unable to create your account right now. Check the email address and try again."));
      } finally {
        setPending(false);
      }
      return;
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, submittedEmail, password);
      const session = await establishSession(credential.user);
      if (!session.ok && session.error === "email_not_verified") {
        setConfirmationEmail(credential.user.email ?? submittedEmail);
        setMessage("Verify your email before signing in.");
      } else if (!session.ok) {
        setMessage("Unable to create your session. Please try again.");
      } else {
        window.location.assign(await signedInDestination());
      }
    } catch {
      setMessage("Email or password is incorrect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resendConfirmation() {
    const auth = createFirebaseAuth();
    const actionUrl = authActionUrl();
    if (!auth?.currentUser || !actionUrl || !confirmationEmail) {
      setMessage("Authentication is not available right now.");
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      await sendEmailVerification(auth.currentUser, { url: actionUrl });
      setMessage("Confirmation email sent again. Check your inbox and spam folder.");
    } catch (error) {
      setMessage(firebaseMessage(error, "Unable to send a confirmation email right now. Please try again."));
    } finally {
      setPending(false);
    }
  }

  async function signInWithOAuth(provider: "google" | "facebook") {
    const auth = createFirebaseAuth();
    if (!auth) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const firebaseProvider = provider === "google" ? new GoogleAuthProvider() : new FacebookAuthProvider();
      const credential = await signInWithPopup(auth, firebaseProvider);
      const session = await establishSession(credential.user);
      if (!session.ok) {
        setMessage("Unable to create your session. Please try again.");
        setPending(false);
        return;
      }
      window.location.assign(await signedInDestination());
    } catch (error) {
      const providerName = provider === "google" ? "Google" : "Facebook";
      setMessage(firebaseMessage(error, `${providerName} sign-in could not be started. Please try again.`));
      setPending(false);
    }
  }

  if (emailSent) {
    return (
      <section className="auth-card parchment-panel">
        <p className="eyebrow">Check your email</p>
        <h1>Confirm your account</h1>
        <p>We sent a confirmation link to your email. Open it before using registered features.</p>
        {message && <p className="form-error" role="status">{message}</p>}
        <button className="paper-button auth-link" disabled={pending} type="button" onClick={() => void resendConfirmation()}>
          {pending ? "Sending..." : "Resend confirmation email"}
        </button>
        <Link className="paper-button auth-link" href={`/login${nextQuery}`}>Go to login</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel" lang={language}>
      <p className="eyebrow">{isSignup ? "Create account" : "Login"}</p>
      <h1>{isSignup ? "Get 5 scans each week" : "Welcome back"}</h1>
      <p>Save your crop checks across devices and access the community.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            required
            minLength={isSignup ? 8 : 6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            aria-describedby={isSignup ? "password-requirements" : undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {isSignup && (
          <div
            className={`password-requirements ${showPasswordRequirements ? "is-active" : ""}`}
            id="password-requirements"
            aria-live="polite"
          >
            <p>Password must include:</p>
            <ul>
              {passwordChecks.map((requirement) => (
                <li className={requirement.met ? "met" : ""} key={requirement.id}>
                  <span aria-hidden="true">{requirement.met ? "ok" : "o"}</span>
                  {requirement.label}
                  {requirement.hint && <small>{requirement.hint}</small>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isSignup && (
          <Link className="auth-forgot-link" href={`/forgot-password${nextQuery}`}>
            Forgot password?
          </Link>
        )}
        {(message || callbackError) && <p className="form-error" role="alert">{message ?? callbackError}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? "Working..." : isSignup ? "Sign up" : "Login"}
        </button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <div className="oauth-buttons">
        <button className="google-button" disabled={pending} type="button" onClick={() => void signInWithOAuth("google")}>
          <span aria-hidden="true">G</span>Continue with Google
        </button>
        <button className="google-button facebook-button" disabled={pending} type="button" onClick={() => void signInWithOAuth("facebook")}>
          <span aria-hidden="true">f</span>Continue with Facebook
        </button>
      </div>
      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={`${isSignup ? "/login" : "/signup"}${nextQuery}`}>
          {isSignup ? "Login" : "Sign up"}
        </Link>
      </p>
    </section>
  );
}
