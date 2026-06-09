"use client";

import { confirmPasswordReset } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createFirebaseAuth } from "@/lib/firebase/client";
import { useProduct } from "../state/ProductProvider";

export function UpdatePasswordForm() {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const oobCode = searchParams.get("oobCode");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(oobCode ? null : "That password reset link is invalid or expired.");
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const auth = createFirebaseAuth();
    if (!auth || !oobCode) {
      setMessage("That password reset link is invalid or expired.");
      return;
    }

    setPending(true);
    setMessage(null);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSaved(true);
    } catch {
      setMessage("Unable to set your new password. Check the link and password, then try again.");
    } finally {
      setPending(false);
    }
  }

  if (saved) {
    return (
      <section className="auth-card parchment-panel" lang={language}>
        <p className="eyebrow">Updated</p>
        <h1>Your new password is ready</h1>
        <p>Sign in with your new password to continue with your crop checks.</p>
        <Link className="rust-button auth-link" href={`/login?next=${encodeURIComponent(returnPath)}`}>Continue</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel" lang={language}>
      <p className="eyebrow">Account security</p>
      <h1>Set a new password</h1>
      <p>Choose a new password with at least 6 characters.</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>New password</span>
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          <span>Confirm new password</span>
          <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="rust-button" disabled={pending || !oobCode} type="submit">
          {pending ? "Saving..." : "Save password"}
        </button>
      </form>
    </section>
  );
}
