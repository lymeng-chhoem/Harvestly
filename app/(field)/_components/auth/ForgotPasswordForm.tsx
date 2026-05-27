"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useProduct } from "../state/ProductProvider";

export function ForgotPasswordForm() {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const nextQuery = returnPath === "/" ? "" : `?next=${encodeURIComponent(returnPath)}`;
  const recoveryLinkError = searchParams.get("error") === "callback" || searchParams.get("error") === "session"
    ? (language === "km" ? "តំណកំណត់ពាក្យសម្ងាត់ថ្មីមិនត្រឹមត្រូវ ឬបានផុតកំណត់។ សូមស្នើតំណថ្មី។" : "That password reset link is invalid or expired. Please request a new one.")
    : null;
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const updatePath = `/update-password?next=${encodeURIComponent(returnPath)}`;
    const redirectTo = `${window.location.origin}/auth/callback?flow=recovery&next=${encodeURIComponent(updatePath)}&returnTo=${encodeURIComponent(returnPath)}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      setMessage(language === "km" ? "មិនអាចផ្ញើអ៊ីមែលស្តារពាក្យសម្ងាត់ឥឡូវនេះបានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to send a recovery email right now. Please try again.");
    } else {
      setSent(true);
    }
    setPending(false);
  }

  if (sent) {
    return (
      <section className="auth-card parchment-panel">
        <p className="eyebrow">{language === "km" ? "ពិនិត្យអ៊ីមែល" : "Check your email"}</p>
        <h1>{language === "km" ? "តំណកំណត់ពាក្យសម្ងាត់បានផ្ញើរួច" : "Password reset link sent"}</h1>
        <p>{language === "km" ? "ប្រសិនបើមានគណនីសម្រាប់អ៊ីមែលនេះ អ្នកនឹងទទួលបានតំណសុវត្ថិភាពដើម្បីកំណត់ពាក្យសម្ងាត់ថ្មី។" : "If an account exists for that email address, you will receive a secure link to set a new password."}</p>
        <Link className="paper-button auth-link" href={`/login${nextQuery}`}>{language === "km" ? "ត្រឡប់ទៅចូលគណនី" : "Return to login"}</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel">
      <p className="eyebrow">{language === "km" ? "ស្តារគណនី" : "Account recovery"}</p>
      <h1>{language === "km" ? "ភ្លេចពាក្យសម្ងាត់?" : "Forgot your password?"}</h1>
      <p>{language === "km" ? "បញ្ចូលអ៊ីមែលរបស់អ្នក ហើយយើងនឹងផ្ញើតំណសម្រាប់កំណត់ពាក្យសម្ងាត់ថ្មី។" : "Enter your email and we will send a link to set a new password."}</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>{language === "km" ? "អ៊ីមែល" : "Email"}</span>
          <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        {(message || recoveryLinkError) && <p className="form-error" role="alert">{message ?? recoveryLinkError}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? (language === "km" ? "កំពុងផ្ញើ..." : "Sending...") : (language === "km" ? "ផ្ញើតំណថ្មី" : "Send reset link")}
        </button>
      </form>
      <p className="auth-switch">
        <Link href={`/login${nextQuery}`}>{language === "km" ? "ត្រឡប់ទៅចូលគណនី" : "Back to login"}</Link>
      </p>
    </section>
  );
}
