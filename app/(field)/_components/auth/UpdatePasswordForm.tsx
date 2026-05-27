"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useProduct } from "../state/ProductProvider";

export function UpdatePasswordForm() {
  const { language } = useProduct();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage(language === "km" ? "ពាក្យសម្ងាត់ទាំងពីរមិនដូចគ្នាទេ។" : "Passwords do not match.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(language === "km" ? "មិនអាចកំណត់ពាក្យសម្ងាត់ថ្មីបានទេ។ សូមពិនិត្យពាក្យសម្ងាត់ រួចព្យាយាមម្តងទៀត។" : "Unable to set your new password. Check the password and try again.");
    } else {
      setSaved(true);
    }
    setPending(false);
  }

  if (saved) {
    return (
      <section className="auth-card parchment-panel">
        <p className="eyebrow">{language === "km" ? "បានធ្វើបច្ចុប្បន្នភាព" : "Updated"}</p>
        <h1>{language === "km" ? "ពាក្យសម្ងាត់ថ្មីរបស់អ្នករួចរាល់" : "Your new password is ready"}</h1>
        <p>{language === "km" ? "អ្នកបានចូលគណនីហើយ និងអាចបន្តការពិនិត្យដំណាំរបស់អ្នក។" : "You are signed in and can continue with your crop checks."}</p>
        <Link className="rust-button auth-link" href={returnPath}>{language === "km" ? "បន្ត" : "Continue"}</Link>
      </section>
    );
  }

  return (
    <section className="auth-card parchment-panel">
      <p className="eyebrow">{language === "km" ? "សុវត្ថិភាពគណនី" : "Account security"}</p>
      <h1>{language === "km" ? "កំណត់ពាក្យសម្ងាត់ថ្មី" : "Set a new password"}</h1>
      <p>{language === "km" ? "ជ្រើសរើសពាក្យសម្ងាត់ថ្មីដែលមានយ៉ាងតិច ៦ តួអក្សរ។" : "Choose a new password with at least 6 characters."}</p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>{language === "km" ? "ពាក្យសម្ងាត់ថ្មី" : "New password"}</span>
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          <span>{language === "km" ? "បញ្ជាក់ពាក្យសម្ងាត់ថ្មី" : "Confirm new password"}</span>
          <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        </label>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? (language === "km" ? "កំពុងរក្សាទុក..." : "Saving...") : (language === "km" ? "រក្សាទុកពាក្យសម្ងាត់" : "Save password")}
        </button>
      </form>
    </section>
  );
}
