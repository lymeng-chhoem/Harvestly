import { Suspense } from "react";
import { FirebaseActionClient } from "./FirebaseActionClient";

export default function FirebaseActionPage() {
  return (
    <main className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <FirebaseActionClient />
      </Suspense>
    </main>
  );
}
