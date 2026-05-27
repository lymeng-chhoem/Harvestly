import { Suspense } from "react";
import { redirect } from "next/navigation";
import { safeReturnPath } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { UpdatePasswordForm } from "../_components/auth/UpdatePasswordForm";

type UpdatePasswordPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function UpdatePasswordPage({ searchParams }: UpdatePasswordPageProps) {
  const { next } = await searchParams;
  const returnPath = safeReturnPath(Array.isArray(next) ? next[0] : next);
  const { user } = await getAuthenticatedUser();

  if (!user) {
    redirect(`/forgot-password?error=session&next=${encodeURIComponent(returnPath)}`);
  }

  return (
    <div className="route-page centered-page auth-page">
      <Suspense fallback={null}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
