"use client";

import { sendPasswordResetEmail } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createFirebaseAuth } from "@/lib/firebase/client";
import { getPublicSiteUrl } from "@/lib/supabase/config";
import { useProduct } from "../state/ProductProvider";

export function ForgotPasswordForm() {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const nextQuery = returnPath === "/" ? "" : `?next=${encodeURIComponent(returnPath)}`;
  const recoveryLinkError = searchParams.get("error") === "callback" || searchParams.get("error") === "session"
    ? "That password reset link is invalid or expired. Please request a new one."
    : null;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const auth = createFirebaseAuth();
    if (!auth) {
      setMessage("Authentication is not configured yet.");
      return;
    }

    const siteUrl = getPublicSiteUrl() ?? (typeof window === "undefined" ? null : window.location.origin);
    if (!siteUrl) {
      setMessage("Authentication site URL is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      const url = `${siteUrl.replace(/\/+$/, "")}/auth/action?next=${encodeURIComponent(returnPath)}`;
      await sendPasswordResetEmail(auth, email.trim().toLowerCase(), { url });
      setSent(true);
    } catch {
      setMessage("Unable to send a recovery email right now. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <section className="auth-card parchment-panel" lang={language}>
        <p className="eyebrow">Check your email</p>
        <h1>Password reset link sent</h1>
        <p>If an account exists for that email address, you will receive a secure link to set a new password.</p>
        <Link className="paper-button auth-link" href={`/login${nextQuery}`}>Return to login</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel" lang={language}>
      <p className="eyebrow">Account recovery</p>
      <h1>Forgot your password?</h1>
      <p>Enter your email and we will send a link to set a new password.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {(message || recoveryLinkError) && <p className="form-error" role="alert">{message ?? recoveryLinkError}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="auth-switch">
        <Link href={`/login${nextQuery}`}>Back to login</Link>
      </p>
    </section>
  );
}
