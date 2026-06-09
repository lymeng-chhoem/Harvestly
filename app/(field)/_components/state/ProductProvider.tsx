"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  createStoredScanRecord,
  type Language,
  type StoredScanRecord,
} from "@/lib/harvestly-content";
import {
  parseScanHistory,
  saveScanHistory,
  SCAN_HISTORY_STORAGE_KEY,
  type HistoryFilter,
} from "@/lib/scan-history";
import {
  type AuthenticatedScanState,
  type ScanAllowance,
  readAnonymousAllowance,
} from "@/lib/scan-usage";
import { profileSetupPath } from "@/lib/profile";
import { createFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

type UploadError = "type" | "size" | null;
export type AnalysisStatus = "idle" | "analyzing" | "result" | "error";
export type AnalysisError = "configuration" | "network" | "timeout" | "service" | "invalid_response" | "limit" | null;
export type AuthStatus = "loading" | "guest" | "authenticated";
export type ProfileStatus = "loading" | "guest" | "incomplete" | "complete";

type ProductContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  authStatus: AuthStatus;
  authConfigured: boolean;
  authEmail: string | null;
  username: string | null;
  avatarUrl: string | null;
  profileStatus: ProfileStatus;
  profileComplete: boolean;
  allowance: ScanAllowance | null;
  selectedFile: File | null;
  previewUrl: string | null;
  uploadError: UploadError;
  analysisStatus: AnalysisStatus;
  analysisError: AnalysisError;
  result: StoredScanRecord | null;
  historyRecords: StoredScanRecord[];
  historyFilter: HistoryFilter;
  setHistoryFilter: (filter: HistoryFilter) => void;
  historySaveError: boolean;
  selectImage: (file: File) => boolean;
  clearImage: () => void;
  analyze: () => Promise<void>;
  deleteHistoryRecord: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const LANGUAGE_STORAGE_KEY = "harvestly-language";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const DEMO_ANALYSIS_DELAY_MS = 900;
const ProductContext = createContext<ProductContextValue | null>(null);
const PROFILE_GATE_EXEMPT_PATHS = new Set([
  "/complete-profile",
  "/privacy",
  "/data-deletion",
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password",
  "/settings",
]);
const languageListeners = new Set<() => void>();
const historyListeners = new Set<() => void>();

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "km";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "km";
}

function subscribeLanguage(listener: () => void) {
  languageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getHistorySnapshot() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(SCAN_HISTORY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribeHistory(listener: () => void) {
  historyListeners.add(listener);
  function onStorage(event: StorageEvent) {
    if (event.key === SCAN_HISTORY_STORAGE_KEY) listener();
  }
  window.addEventListener("storage", onStorage);
  return () => {
    historyListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyHistoryChanged() {
  historyListeners.forEach((listener) => listener());
}

function waitForDemoAnalysis(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Analysis cancelled", "AbortError"));
      return;
    }
    const timeoutId = window.setTimeout(resolve, DEMO_ANALYSIS_DELAY_MS);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Analysis cancelled", "AbortError"));
    }, { once: true });
  });
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, (): Language => "km");
  const localHistorySnapshot = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => "");
  const localHistoryRecords = useMemo(() => parseScanHistory(localHistorySnapshot), [localHistorySnapshot]);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [authConfigured, setAuthConfigured] = useState(true);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("loading");
  const [allowance, setAllowance] = useState<ScanAllowance | null>(null);
  const [remoteHistoryRecords, setRemoteHistoryRecords] = useState<StoredScanRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<UploadError>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisError, setAnalysisError] = useState<AnalysisError>(null);
  const [result, setResult] = useState<StoredScanRecord | null>(null);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySaveError, setHistorySaveError] = useState(false);
  const previewRef = useRef<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const historyRecords = authStatus === "authenticated" ? remoteHistoryRecords : localHistoryRecords;

  const refreshProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== "object") {
        setUsername(null);
        setAvatarUrl(null);
        setProfileStatus(response.status === 401 ? "guest" : "incomplete");
        return;
      }
      const profile = "profile" in payload && payload.profile && typeof payload.profile === "object"
        ? payload.profile as { username?: unknown; avatarUrl?: unknown; profileComplete?: unknown }
        : null;
      setUsername(typeof profile?.username === "string" ? profile.username : null);
      setAvatarUrl(typeof profile?.avatarUrl === "string" ? profile.avatarUrl : null);
      setProfileStatus(profile?.profileComplete ? "complete" : "incomplete");
    } catch {
      setUsername(null);
      setAvatarUrl(null);
      setProfileStatus("incomplete");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const auth = createFirebaseAuth();

    async function loadRegisteredState() {
      try {
        const response = await fetch("/api/scans", { cache: "no-store" });
        const payload: unknown = await response.json().catch(() => null);
        if (!active) return;
        if (response.ok && payload && typeof payload === "object" && "records" in payload && "allowance" in payload) {
          const state = payload as AuthenticatedScanState;
          setRemoteHistoryRecords(state.records);
          setAllowance(state.allowance);
          setHistorySaveError(false);
          return;
        }
        setAllowance(null);
        setRemoteHistoryRecords([]);
        setHistorySaveError(true);
      } catch {
        if (!active) return;
        setAllowance(null);
        setRemoteHistoryRecords([]);
        setHistorySaveError(true);
      }
    }

    async function applySession() {
      if (!auth) {
        if (!active) return;
        setAuthConfigured(false);
        setAuthStatus("guest");
        setAuthEmail(null);
        setUsername(null);
        setAvatarUrl(null);
        setProfileStatus("guest");
        setAllowance(readAnonymousAllowance());
        return;
      }
      const firebaseUser = auth.currentUser;
      if (!active) return;
      if (firebaseUser?.emailVerified) {
        const idToken = await firebaseUser.getIdToken();
        const sessionResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!active) return;
        if (!sessionResponse.ok) {
          setAuthStatus("guest");
          setAuthEmail(null);
          setUsername(null);
          setAvatarUrl(null);
          setProfileStatus("guest");
          setRemoteHistoryRecords([]);
          setAllowance(readAnonymousAllowance());
          return;
        }
        setAuthStatus("authenticated");
        setAuthEmail(firebaseUser.email ?? null);
        setAllowance(null);
        setHistorySaveError(false);
        setProfileStatus("loading");
        await refreshProfile();
        if (!active) return;
        await loadRegisteredState();
      } else {
        setAuthStatus("guest");
        setAuthEmail(null);
        setUsername(null);
        setAvatarUrl(null);
        setProfileStatus("guest");
        setRemoteHistoryRecords([]);
        setAllowance(readAnonymousAllowance());
      }
    }

    void applySession();
    const unsubscribe = auth ? onAuthStateChanged(auth, () => {
      void applySession();
    }) : undefined;
    return () => {
      active = false;
      unsubscribe?.();
      activeRequest.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (
      authStatus === "authenticated"
      && profileStatus === "incomplete"
      && !PROFILE_GATE_EXEMPT_PATHS.has(pathname)
    ) {
      router.replace(profileSetupPath(pathname));
    }
  }, [authStatus, pathname, profileStatus, router]);

  function setLanguage(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    languageListeners.forEach((listener) => listener());
  }

  function resetAnalysis() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setAnalysisStatus("idle");
    setAnalysisError(null);
    setResult(null);
    setHistorySaveError(false);
  }

  function selectImage(file: File): boolean {
    setUploadError(null);
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setUploadError("type");
      return false;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("size");
      return false;
    }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    resetAnalysis();
    const nextPreview = URL.createObjectURL(file);
    previewRef.current = nextPreview;
    setSelectedFile(file);
    setPreviewUrl(nextPreview);
    return true;
  }

  function clearImage() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    resetAnalysis();
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  }

  async function analyze() {
    if (!selectedFile || authStatus === "loading") return;

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setAnalysisStatus("analyzing");
    setAnalysisError(null);
    setResult(null);
    setHistorySaveError(false);

    try {
      await waitForDemoAnalysis(controller.signal);
      const record = createStoredScanRecord({
        cropId: "rice",
        conditionCode: "rice_blast",
        confidence: 0.89,
        risk: "high",
      });
      setResult(record);
      setAnalysisStatus("result");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setAnalysisError("network");
      setAnalysisStatus("error");
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  async function deleteHistoryRecord(id: string) {
    if (authStatus === "authenticated") {
      const response = await fetch(`/api/scans/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (response.ok) {
        setRemoteHistoryRecords((records) => records.filter((record) => record.id !== id));
        setHistorySaveError(false);
      } else {
        setHistorySaveError(true);
      }
      return;
    }
    const nextRecords = localHistoryRecords.filter((record) => record.id !== id);
    if (saveScanHistory(nextRecords)) {
      notifyHistoryChanged();
      setHistorySaveError(false);
    } else {
      setHistorySaveError(true);
    }
  }

  async function clearHistory() {
    if (authStatus === "authenticated") {
      const response = await fetch("/api/scans", { method: "DELETE" });
      if (response.ok) {
        setRemoteHistoryRecords([]);
        setHistorySaveError(false);
      } else {
        setHistorySaveError(true);
      }
      return;
    }
    if (saveScanHistory([])) {
      notifyHistoryChanged();
      setHistorySaveError(false);
    } else {
      setHistorySaveError(true);
    }
  }

  async function signOut() {
    const auth = createFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => null);
    setAuthStatus("guest");
    setAuthEmail(null);
    setUsername(null);
    setAvatarUrl(null);
    setProfileStatus("guest");
    setRemoteHistoryRecords([]);
    setAllowance(readAnonymousAllowance());
  }

  return (
    <ProductContext.Provider value={{
      language, setLanguage, authStatus, authConfigured, authEmail, username, avatarUrl,
      profileStatus, profileComplete: profileStatus === "complete", allowance,
      selectedFile, previewUrl, uploadError, analysisStatus, analysisError, result,
      historyRecords, historyFilter, setHistoryFilter, historySaveError,
      selectImage, clearImage, analyze, deleteHistoryRecord, clearHistory, refreshProfile, signOut,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProduct must be used inside ProductProvider");
  return context;
}
