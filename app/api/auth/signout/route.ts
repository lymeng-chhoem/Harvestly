import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { FIREBASE_SESSION_COOKIE } from "@/lib/firebase/admin";

export async function POST() {
  (await cookies()).delete(FIREBASE_SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
