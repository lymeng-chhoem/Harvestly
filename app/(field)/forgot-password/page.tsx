import { Suspense } from "react";
import { ForgotPasswordForm } from "../_components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
