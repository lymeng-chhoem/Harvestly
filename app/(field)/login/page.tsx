import { Suspense } from "react";
import { AuthForm } from "../_components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
