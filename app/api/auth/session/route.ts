import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createFirebaseAdminAuth, FIREBASE_SESSION_COOKIE, FIREBASE_SESSION_MAX_AGE_SECONDS } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const adminAuth = createFirebaseAdminAuth();
  if (!adminAuth) return Response.json({ error: "auth_not_configured" }, { status: 503 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const idToken = payload && typeof payload === "object" && "idToken" in payload
    ? (payload as { idToken?: unknown }).idToken
    : null;
  if (typeof idToken !== "string") return Response.json({ error: "invalid_request" }, { status: 400 });

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (!decoded.email_verified) return Response.json({ error: "email_not_verified" }, { status: 403 });

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FIREBASE_SESSION_MAX_AGE_SECONDS * 1000,
    });
    (await cookies()).set(FIREBASE_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      maxAge: FIREBASE_SESSION_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "invalid_token" }, { status: 401 });
  }
}

export async function DELETE() {
  (await cookies()).delete(FIREBASE_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
