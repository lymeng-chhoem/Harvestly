"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeReturnPath } from "@/lib/auth";
import { isValidUsername, normalizeUsername } from "@/lib/profile";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useProduct } from "../state/ProductProvider";

export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnPath = safeReturnPath(searchParams.get("next"));
  const { language, authStatus, profileStatus, refreshProfile, signOut } = useProduct();
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "guest") {
      router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
    } else if (authStatus === "authenticated" && profileStatus === "complete") {
      router.replace(returnPath);
    }
  }, [authStatus, profileStatus, returnPath, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      setMessage(language === "km"
        ? "ឈ្មោះត្រូវមាន 3-24 តួអក្សរ ហើយប្រើតែអក្សរ a-z លេខ ឬសញ្ញា _។"
        : "Use 3-24 lowercase letters, numbers, or underscores only.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(language === "km" ? "មិនអាចរៀបចំគណនីបាននៅពេលនេះទេ។" : "Account setup is unavailable right now.");
      return;
    }

    setPending(true);
    setMessage(null);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
      return;
    }
    const { error } = await supabase.auth.updateUser({
      data: { harvestly_username: normalizedUsername },
    });
    if (error) {
      setMessage(language === "km"
        ? "មិនអាចរក្សាទុកឈ្មោះបានទេ។ សូមព្យាយាមម្ដងទៀត។"
        : "Unable to save your username. Please try again.");
      setPending(false);
      return;
    }

    await refreshProfile();
    router.replace(returnPath);
  }

  async function leaveAccount() {
    await signOut();
    router.replace("/");
  }

  return (
    <section className="auth-card profile-setup-card parchment-panel">
      <p className="eyebrow">{language === "km" ? "រៀបចំគណនី" : "Finish setup"}</p>
      <h1>{language === "km" ? "ជ្រើសឈ្មោះអ្នកប្រើ" : "Choose your username"}</h1>
      <p>
        {language === "km"
          ? "ឈ្មោះនេះនឹងបង្ហាញនៅក្នុង Harvestly និងនៅក្នុងពាក្យស្វាគមន៍របស់អ្នក។"
          : "This username identifies you in Harvestly and appears in your greeting."}
      </p>
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>{language === "km" ? "ឈ្មោះអ្នកប្រើ" : "Username"}</span>
          <input
            autoCapitalize="none"
            autoComplete="username"
            maxLength={24}
            minLength={3}
            pattern="[a-z0-9_]{3,24}"
            placeholder="farmer_sokha"
            required
            spellCheck={false}
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
          />
        </label>
        <p className="username-rules">
          {language === "km" ? "អក្សរ a-z លេខ និង _ តែប៉ុណ្ណោះ; 3-24 តួអក្សរ។" : "Lowercase letters, numbers, and underscores only; 3-24 characters."}
        </p>
        {message && <p className="form-error" role="alert">{message}</p>}
        <button className="rust-button" disabled={pending} type="submit">
          {pending ? (language === "km" ? "កំពុងរក្សាទុក..." : "Saving...") : (language === "km" ? "រក្សាទុក និងបន្ត" : "Save and continue")}
        </button>
      </form>
      <button className="profile-signout" type="button" onClick={() => void leaveAccount()}>
        {language === "km" ? "ចាកចេញពីគណនី" : "Sign out instead"}
      </button>
    </section>
  );
}
