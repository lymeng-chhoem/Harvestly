import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirebaseAdminConfig } from "./admin-config";

export const FIREBASE_SESSION_COOKIE = "harvestly_session";
export const FIREBASE_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export function createFirebaseAdminAuth() {
  const config = getFirebaseAdminConfig();
  if (!config) return null;

  const app = getApps()[0] ?? initializeApp({
    credential: cert(config),
  });

  return getAuth(app);
}
