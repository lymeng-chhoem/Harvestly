"use client";

import { useEffect } from "react";
import { createFirebaseAnalytics } from "@/lib/firebase/client";

export function FirebaseAnalytics() {
  useEffect(() => {
    void createFirebaseAnalytics();
  }, []);

  return null;
}
