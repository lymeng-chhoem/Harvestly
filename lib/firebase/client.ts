"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getPublicFirebaseConfig } from "./public-config";

export function createFirebaseApp() {
  const config = getPublicFirebaseConfig();
  if (!config) return null;

  return getApps()[0] ?? initializeApp(config);
}

export function createFirebaseAuth() {
  const app = createFirebaseApp();
  if (!app) return null;

  return getAuth(app);
}

export async function createFirebaseAnalytics() {
  const config = getPublicFirebaseConfig();
  if (!config?.measurementId || typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  const app = createFirebaseApp();
  return app ? getAnalytics(app) : null;
}
