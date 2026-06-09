"use client";

import { applyActionCode } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { safeReturnPath } from "@/lib/auth";
import { createFirebaseAuth } from "@/lib/firebase/client";

export function FirebaseActionClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Checking your link...");

  useEffect(() => {
    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const returnPath = safeReturnPath(searchParams.get("next"));
    const auth = createFirebaseAuth();

    if (!auth || !mode || !oobCode) {
      router.replace(`/login?error=callback&next=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (mode === "resetPassword") {
      router.replace(`/update-password?oobCode=${encodeURIComponent(oobCode)}&next=${encodeURIComponent(returnPath)}`);
      return;
    }

    if (mode === "verifyEmail") {
      void applyActionCode(auth, oobCode)
        .then(() => {
          setMessage("Email verified. Redirecting...");
          router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
        })
        .catch(() => {
          router.replace(`/login?error=callback&next=${encodeURIComponent(returnPath)}`);
        });
      return;
    }

    router.replace(`/login?error=callback&next=${encodeURIComponent(returnPath)}`);
  }, [router, searchParams]);

  return (
    <section className="auth-card parchment-panel">
      <p className="eyebrow">Account</p>
      <h1>{message}</h1>
    </section>
  );
}
