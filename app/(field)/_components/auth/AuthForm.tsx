"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { profileSetupPath, readDatabaseAccountProfile } from "@/lib/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPublicSiteUrl } from "@/lib/supabase/config";
import { useProduct } from "../state/ProductProvider";

type AuthMode = "login" | "signup";

type PasswordRequirement = {
  id: string;
  label: {
    en: string;
    km: string;
  };
  test: (password: string) => boolean;
};

const passwordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: { en: "At least 8 characters", km: "យ៉ាងតិច ៨ តួអក្សរ" },
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: { en: "One uppercase letter", km: "មានអក្សរធំយ៉ាងតិច ១" },
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: { en: "One number", km: "មានលេខយ៉ាងតិច ១" },
    test: (value) => /\d/.test(value),
  },
  {
    id: "special",
    label: { en: "One special character", km: "មានសញ្ញាពិសេសយ៉ាងតិច ១" },
    test: (value) => /[^A-Za-z0-9\s]/.test(value),
  },
];

function checkPasswordRequirements(password: string) {
  return passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const callbackError = searchParams.get("error") === "callback"
    ? (language === "km" ? "តំណចូលគណនីមិនត្រឹមត្រូវ ឬបានផុតកំណត់។ សូមព្យាយាមម្តងទៀត។" : "That sign-in link is invalid or expired. Please try again.")
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

  function authCallbackUrl() {
    const origin = typeof window === "undefined" ? getPublicSiteUrl() : window.location.origin;
    if (!origin) return null;
    return `${origin.replace(/\/+$/, "")}/auth/callback?next=${encodeURIComponent(returnPath)}`;
  }

  function isExistingEmailResponse(user: { identities?: unknown } | null) {
    return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
  }

  function signupErrorMessage(error: { message?: string }) {
    const detail = error.message?.toLowerCase() ?? "";
    if (detail.includes("redirect") || detail.includes("not allowed")) {
      return language === "km"
        ? "Signup redirect is not allowed for this deployment. Add this Vercel URL in Supabase Auth redirect URLs."
        : "Signup redirect is not allowed for this deployment. Add this Vercel URL in Supabase Auth redirect URLs.";
    }
    if (detail.includes("rate") || detail.includes("too many")) {
      return language === "km"
        ? "Too many signup emails were requested. Wait a few minutes, then try again."
        : "Too many signup emails were requested. Wait a few minutes, then try again.";
    }
    if (detail.includes("password")) {
      return language === "km"
        ? "Use a stronger password, then try again."
        : "Use a stronger password, then try again.";
    }
    return language === "km"
      ? "Unable to create your account right now. Check the email address and try again."
      : "Unable to create your account right now. Check the email address and try again.";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    const authClient = supabase;
    setPending(true);
    setMessage(null);
    async function signedInDestination() {
      const { data } = await authClient.auth.getUser();
      if (!data.user) return profileSetupPath(returnPath);
      const { data: profileData } = await authClient
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      return readDatabaseAccountProfile(profileData, data.user).profileComplete
        ? returnPath
        : profileSetupPath(returnPath);
    }
    if (isSignup) {
      const submittedEmail = email.trim().toLowerCase();
      if (!passwordMeetsRequirements) {
        setMessage(language === "km"
          ? "សូមបំពេញលក្ខខណ្ឌពាក្យសម្ងាត់ទាំងអស់ មុនបង្កើតគណនី។"
          : "Meet all password requirements before creating your account.");
        setPending(false);
        return;
      }
      const callbackUrl = authCallbackUrl();
      if (!callbackUrl) {
        setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication site URL is not configured yet.");
        setPending(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: submittedEmail,
        password,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) {
        setMessage(signupErrorMessage(error));
      } else if (isExistingEmailResponse(data.user)) {
        setMessage(language === "km"
          ? "អ៊ីមែលនេះមានគណនីរួចហើយ។ សូមចូល ឬប្រើភ្លេចពាក្យសម្ងាត់។"
          : "This email already has an account. Log in instead, or use Forgot password.");
      } else if (!data.session) {
        setConfirmationEmail(submittedEmail);
        setEmailSent(true);
      } else {
        window.location.assign(await signedInDestination());
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(language === "km" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។" : "Email or password is incorrect. Please try again.");
      else window.location.assign(await signedInDestination());
    }
    setPending(false);
  }

  async function resendConfirmation() {
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = authCallbackUrl();
    if (!supabase || !callbackUrl || !confirmationEmail) {
      setMessage(language === "km" ? "ការចូលគណនីមិនអាចប្រើបាននៅពេលនេះទេ។" : "Authentication is not available right now.");
      return;
    }

    setPending(true);
    setMessage(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: confirmationEmail,
      options: { emailRedirectTo: callbackUrl },
    });
    setMessage(error
      ? (language === "km" ? "មិនអាចផ្ញើអ៊ីមែលបញ្ជាក់ម្តងទៀតបានទេ។" : "Unable to resend the confirmation email right now.")
      : (language === "km" ? "បានផ្ញើអ៊ីមែលបញ្ជាក់ម្តងទៀត។ សូមពិនិត្យប្រអប់ចូល និងសារឥតបានការ។" : "Confirmation email sent again. Check your inbox and spam folder."));
    setPending(false);
  }

  async function signInWithOAuth(provider: "google" | "facebook") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const redirectTo = authCallbackUrl();
    if (!redirectTo) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication site URL is not configured yet.");
      setPending(false);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      const providerName = provider === "google" ? "Google" : "Facebook";
      setMessage(language === "km" ? `មិនអាចចាប់ផ្តើមការចូលជាមួយ ${providerName} បានទេ។ សូមព្យាយាមម្តងទៀត។` : `${providerName} sign-in could not be started. Please try again.`);
      setPending(false);
    }
  }

  if (emailSent) {
    return (
      <section className="auth-card parchment-panel">
        <p className="eyebrow">{language === "km" ? "ពិនិត្យអ៊ីមែល" : "Check your email"}</p>
        <h1>{language === "km" ? "បញ្ជាក់គណនីរបស់អ្នក" : "Confirm your account"}</h1>
        <p>{language === "km" ? "យើងបានផ្ញើតំណបញ្ជាក់ទៅអ៊ីមែលរបស់អ្នក។ សូមបើកតំណនោះមុនពេលចូលប្រើមុខងារសមាជិក។" : "We sent a confirmation link to your email. Open it before using registered features."}</p>
        {message && <p className="form-error" role="status">{message}</p>}
        <button className="paper-button auth-link" disabled={pending} type="button" onClick={() => void resendConfirmation()}>
          {pending ? (language === "km" ? "កំពុងផ្ញើ..." : "Sending...") : (language === "km" ? "ផ្ញើអ៊ីមែលបញ្ជាក់ម្តងទៀត" : "Resend confirmation email")}
        </button>
        <Link className="paper-button auth-link" href={`/login${nextQuery}`}>{language === "km" ? "ទៅទំព័រចូល" : "Go to login"}</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel">
      <p className="eyebrow">{isSignup ? (language === "km" ? "បង្កើតគណនី" : "Create account") : (language === "km" ? "ចូលគណនី" : "Login")}</p>
      <h1>{isSignup ? (language === "km" ? "ទទួលបានការពិនិត្យ ៥ ដងក្នុងមួយសប្តាហ៍" : "Get 5 scans each week") : (language === "km" ? "ស្វាគមន៍ត្រឡប់មកវិញ" : "Welcome back")}</h1>
      <p>{language === "km" ? "រក្សាទុកលទ្ធផលពិនិត្យរបស់អ្នក និងចូលទៅកាន់សហគមន៍។" : "Save your crop checks across devices and access the community."}</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>{language === "km" ? "អ៊ីមែល" : "Email"}</span>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          <span>{language === "km" ? "ពាក្យសម្ងាត់" : "Password"}</span>
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
            <p>{language === "km" ? "ពាក្យសម្ងាត់ត្រូវមាន៖" : "Password must include:"}</p>
            <ul>
              {passwordChecks.map((requirement) => (
                <li className={requirement.met ? "met" : ""} key={requirement.id}>
                  <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>
                  {language === "km" ? requirement.label.km : requirement.label.en}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isSignup && (
          <Link className="auth-forgot-link" href={`/forgot-password${nextQuery}`}>
            {language === "km" ? "ភ្លេចពាក្យសម្ងាត់?" : "Forgot password?"}
          </Link>
        )}
        {(message || callbackError) && <p className="form-error" role="alert">{message ?? callbackError}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? (language === "km" ? "កំពុងដំណើរការ..." : "Working...") : isSignup ? (language === "km" ? "បង្កើតគណនី" : "Sign up") : (language === "km" ? "ចូលគណនី" : "Login")}
        </button>
      </form>
      <div className="auth-divider"><span>{language === "km" ? "ឬ" : "or"}</span></div>
      <div className="oauth-buttons">
        <button className="google-button" disabled={pending} type="button" onClick={() => void signInWithOAuth("google")}>
          <span aria-hidden="true">G</span>{language === "km" ? "បន្តជាមួយ Google" : "Continue with Google"}
        </button>
        <button className="google-button facebook-button" disabled={pending} type="button" onClick={() => void signInWithOAuth("facebook")}>
          <span aria-hidden="true">f</span>{language === "km" ? "បន្តជាមួយ Facebook" : "Continue with Facebook"}
        </button>
      </div>
      <p className="auth-switch">
        {isSignup ? (language === "km" ? "មានគណនីរួចហើយ?" : "Already have an account?") : (language === "km" ? "មិនទាន់មានគណនី?" : "Need an account?")}{" "}
        <Link href={`${isSignup ? "/login" : "/signup"}${nextQuery}`}>
          {isSignup ? (language === "km" ? "ចូល" : "Login") : (language === "km" ? "ចុះឈ្មោះ" : "Sign up")}
        </Link>
      </p>
    </section>
  );
}
