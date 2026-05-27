"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useProduct } from "../state/ProductProvider";

type AuthMode = "login" | "signup";

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
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`;
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl },
      });
      if (error) {
        setMessage(language === "km" ? "មិនអាចបង្កើតគណនីបានទេ។ សូមពិនិត្យអ៊ីមែល និងពាក្យសម្ងាត់ រួចព្យាយាមម្តងទៀត។" : "Unable to create your account. Check your email and password, then try again.");
      } else if (!data.session) {
        setEmailSent(true);
      } else {
        window.location.assign(returnPath);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(language === "km" ? "អ៊ីមែល ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។" : "Email or password is incorrect. Please try again.");
      else window.location.assign(returnPath);
    }
    setPending(false);
  }

  async function signInWithGoogle() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet.");
      return;
    }

    setPending(true);
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) {
      setMessage(language === "km" ? "មិនអាចចាប់ផ្តើមការចូលជាមួយ Google បានទេ។ សូមព្យាយាមម្តងទៀត។" : "Google sign-in could not be started. Please try again.");
      setPending(false);
    }
  }

  if (emailSent) {
    return (
      <section className="auth-card parchment-panel">
        <p className="eyebrow">{language === "km" ? "ពិនិត្យអ៊ីមែល" : "Check your email"}</p>
        <h1>{language === "km" ? "បញ្ជាក់គណនីរបស់អ្នក" : "Confirm your account"}</h1>
        <p>{language === "km" ? "យើងបានផ្ញើតំណបញ្ជាក់ទៅអ៊ីមែលរបស់អ្នក។ សូមបើកតំណនោះមុនពេលចូលប្រើមុខងារសមាជិក។" : "We sent a confirmation link to your email. Open it before using registered features."}</p>
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
          <input type="password" required minLength={6} autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
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
      <button className="google-button" disabled={pending} type="button" onClick={signInWithGoogle}>
        <span aria-hidden="true">G</span>{language === "km" ? "បន្តជាមួយ Google" : "Continue with Google"}
      </button>
      <p className="auth-switch">
        {isSignup ? (language === "km" ? "មានគណនីរួចហើយ?" : "Already have an account?") : (language === "km" ? "មិនទាន់មានគណនី?" : "Need an account?")}{" "}
        <Link href={`${isSignup ? "/login" : "/signup"}${nextQuery}`}>
          {isSignup ? (language === "km" ? "ចូល" : "Login") : (language === "km" ? "ចុះឈ្មោះ" : "Sign up")}
        </Link>
      </p>
    </section>
  );
}
