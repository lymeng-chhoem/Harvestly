import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createFirebaseAdminAuth, FIREBASE_SESSION_COOKIE } from "@/lib/firebase/admin";
import { getSupabaseConfig } from "./config";

export type AppUser = {
  id: string;
  firebaseUid: string;
  email: string | null;
  emailVerified: boolean;
};

export function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

type AppUserRow = {
  id: string;
  firebase_uid: string;
  email: string | null;
};

function appUserFromRow(row: AppUserRow, emailVerified: boolean): AppUser {
  return {
    id: row.id,
    firebaseUid: row.firebase_uid,
    email: row.email,
    emailVerified,
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function preferImportedAppUser(rows: AppUserRow[]) {
  return rows.find((row) => row.id === row.firebase_uid && isUuid(row.firebase_uid)) ?? rows[0] ?? null;
}

export async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  if (!supabase) return { supabase: null, user: null };

  const adminAuth = createFirebaseAdminAuth();
  if (!adminAuth) return { supabase, user: null };

  const sessionCookie = (await cookies()).get(FIREBASE_SESSION_COOKIE)?.value;
  if (!sessionCookie) return { supabase, user: null };

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (!decoded.email_verified) return { supabase, user: null };

    const existing = await supabase
      .from("app_users")
      .select("id, firebase_uid, email")
      .eq("firebase_uid", decoded.uid)
      .maybeSingle();

    if (existing.error) return { supabase, user: null };

    if (existing.data) {
      const user = appUserFromRow(
        {
          ...existing.data,
          email: existing.data.email ?? decoded.email ?? null,
        },
        Boolean(decoded.email_verified),
      );
      return { supabase, user };
    }

    const verifiedEmail = decoded.email?.trim();
    if (verifiedEmail) {
      const emailCandidates = Array.from(new Set([verifiedEmail, verifiedEmail.toLowerCase()]));
      const emailMatch = await supabase
        .from("app_users")
        .select("id, firebase_uid, email")
        .in("email", emailCandidates)
        .limit(10);

      if (emailMatch.error) return { supabase, user: null };

      const matchedAppUser = preferImportedAppUser(emailMatch.data ?? []);
      if (matchedAppUser) {
        const user = appUserFromRow(
          {
            ...matchedAppUser,
            email: matchedAppUser.email ?? verifiedEmail,
          },
          Boolean(decoded.email_verified),
        );
        return { supabase, user };
      }
    }

    const inserted = await supabase
      .from("app_users")
      .insert({
        firebase_uid: decoded.uid,
        email: decoded.email ?? null,
      })
      .select("id, firebase_uid, email")
      .single();

    if (inserted.error || !inserted.data) return { supabase, user: null };

    const user = appUserFromRow(
      {
        ...inserted.data,
        email: inserted.data.email ?? decoded.email ?? null,
      },
      Boolean(decoded.email_verified),
    );
    return { supabase, user };
  } catch {
    return { supabase, user: null };
  }
}
