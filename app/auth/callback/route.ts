import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeReturnPath } from "@/lib/auth";
import { profileSetupPath, readAccountProfile } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const destination = safeReturnPath(url.searchParams.get("next"));
  const returnPath = safeReturnPath(url.searchParams.get("returnTo"));
  const isRecovery = url.searchParams.get("flow") === "recovery"
    || type === "recovery"
    || destination.startsWith("/update-password");
  const supabase = await createSupabaseServerClient();

  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const nextDestination = await getAuthenticatedDestination(supabase, destination, isRecovery);
      return NextResponse.redirect(new URL(nextDestination, url.origin));
    }
  }
  if (supabase && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const nextDestination = await getAuthenticatedDestination(supabase, destination, isRecovery);
      return NextResponse.redirect(new URL(nextDestination, url.origin));
    }
  }

  const failurePath = isRecovery
    ? `/forgot-password?error=callback&next=${encodeURIComponent(returnPath)}`
    : `/login?error=callback&next=${encodeURIComponent(destination)}`;
  return NextResponse.redirect(new URL(failurePath, url.origin));
}

async function getAuthenticatedDestination(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  destination: string,
  isRecovery: boolean,
) {
  if (isRecovery) return destination;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return destination;
  return readAccountProfile(userData.user).profileComplete ? destination : profileSetupPath(destination);
}
