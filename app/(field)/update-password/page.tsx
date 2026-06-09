import { Suspense } from "react";
import { UpdatePasswordForm } from "../_components/auth/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
