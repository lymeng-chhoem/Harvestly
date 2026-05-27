import { Suspense } from "react";
import { CompleteProfileForm } from "../_components/auth/CompleteProfileForm";

export default function CompleteProfilePage() {
  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <CompleteProfileForm />
      </Suspense>
    </div>
  );
}
