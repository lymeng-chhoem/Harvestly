import { Suspense } from "react";
import { AuthForm } from "../_components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <AuthForm mode="signup" />
      </Suspense>
    </div>
  );
}
