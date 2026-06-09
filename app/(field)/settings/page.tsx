"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Language } from "@/lib/harvestly-content";
import {
  PROFILE_AVATAR_MAX_SIZE,
  PROFILE_AVATAR_TYPES,
  isValidUsername,
  normalizeUsername,
} from "@/lib/profile";
import { useProduct } from "../_components/state/ProductProvider";

type UsernameSaveError =
  | "database_not_configured"
  | "invalid_username"
  | "service"
  | "unauthorized"
  | "username_taken";

type AvatarSaveError =
  | "avatar_storage_not_configured"
  | "invalid_photo_size"
  | "invalid_photo_type"
  | "service"
  | "unauthorized";

type UsernameDraft = {
  source: string | null;
  value: string;
};

function readUsernameSaveError(payload: unknown): UsernameSaveError | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return null;
  const error = (payload as { error?: unknown }).error;
  return error === "database_not_configured"
    || error === "invalid_username"
    || error === "service"
    || error === "unauthorized"
    || error === "username_taken"
    ? error
    : null;
}

function readAvatarSaveError(payload: unknown): AvatarSaveError | null {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return null;
  const error = (payload as { error?: unknown }).error;
  return error === "avatar_storage_not_configured"
    || error === "invalid_photo_size"
    || error === "invalid_photo_type"
    || error === "service"
    || error === "unauthorized"
    ? error
    : null;
}

export default function SettingsPage() {
  const {
    language,
    authStatus,
    authConfigured,
    authEmail,
    username,
    avatarUrl,
    profileStatus,
    allowance,
    refreshProfile,
    signOut,
  } = useProduct();
  const [usernameDraft, setUsernameDraft] = useState<UsernameDraft | null>(null);
  const [usernamePending, setUsernamePending] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [avatarPending, setAvatarPending] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const percentage = allowance && allowance.limit > 0
    ? Math.min(100, Math.round((allowance.used / allowance.limit) * 100))
    : null;

  const displayUsername = username ?? (language === "km" ? "គណនីថ្មី" : "New account");
  const avatarInitial = (username ?? authEmail ?? "H").charAt(0).toUpperCase();
  const currentUsernameDraft = usernameDraft?.source === username ? usernameDraft.value : username ?? "";
  const resetLabel = formatResetTime(allowance?.resetsAt, language);

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = normalizeUsername(currentUsernameDraft);
    if (!isValidUsername(normalizedUsername)) {
      setUsernameMessage(usernameErrorText("invalid_username", language));
      return;
    }
    if (normalizedUsername === username) {
      setUsernameMessage(language === "km" ? "ឈ្មោះនេះបានរក្សាទុករួចហើយ។" : "This username is already saved.");
      return;
    }

    setUsernamePending(true);
    setUsernameMessage(null);
    let response: Response;
    let payload: unknown = null;
    try {
      response = await fetch("/api/profile/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedUsername }),
      });
      payload = await response.json().catch(() => null);
    } catch {
      setUsernameMessage(language === "km" ? "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to reach the server. Please try again.");
      setUsernamePending(false);
      return;
    }

    if (response.status === 401) {
      setUsernameMessage(usernameErrorText("unauthorized", language));
      setUsernamePending(false);
      return;
    }
    const error = readUsernameSaveError(payload);
    if (!response.ok || error) {
      setUsernameMessage(usernameErrorText(error ?? "service", language));
      setUsernamePending(false);
      return;
    }

    await refreshProfile();
    setUsernameDraft({ source: normalizedUsername, value: normalizedUsername });
    setUsernameMessage(language === "km" ? "បានរក្សាទុកឈ្មោះអ្នកប្រើ។" : "Username saved.");
    setUsernamePending(false);
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    if (!PROFILE_AVATAR_TYPES.has(file.type)) {
      setAvatarMessage(avatarErrorText("invalid_photo_type", language));
      return;
    }
    if (file.size > PROFILE_AVATAR_MAX_SIZE) {
      setAvatarMessage(avatarErrorText("invalid_photo_size", language));
      return;
    }

    setAvatarPending(true);
    setAvatarMessage(null);
    const data = new FormData();
    data.append("avatar", file, file.name);

    let response: Response;
    let payload: unknown = null;
    try {
      response = await fetch("/api/profile/avatar", { method: "POST", body: data });
      payload = await response.json().catch(() => null);
    } catch {
      setAvatarMessage(language === "km" ? "មិនអាចផ្ទុករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to upload the image. Please try again.");
      setAvatarPending(false);
      return;
    }

    const error = readAvatarSaveError(payload);
    if (!response.ok || error) {
      setAvatarMessage(avatarErrorText(error ?? "service", language));
      setAvatarPending(false);
      return;
    }

    await refreshProfile();
    setAvatarMessage(language === "km" ? "បានរក្សាទុករូបភាពប្រវត្តិរូប។" : "Profile picture saved.");
    setAvatarPending(false);
  }

  async function removeAvatar() {
    setAvatarPending(true);
    setAvatarMessage(null);
    let response: Response;
    let payload: unknown = null;
    try {
      response = await fetch("/api/profile/avatar", { method: "DELETE" });
      payload = await response.json().catch(() => null);
    } catch {
      setAvatarMessage(language === "km" ? "មិនអាចដករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។" : "Unable to remove the image. Please try again.");
      setAvatarPending(false);
      return;
    }

    const error = readAvatarSaveError(payload);
    if (!response.ok || error) {
      setAvatarMessage(avatarErrorText(error ?? "service", language));
      setAvatarPending(false);
      return;
    }

    await refreshProfile();
    setAvatarMessage(language === "km" ? "បានដករូបភាពប្រវត្តិរូប។" : "Profile picture removed.");
    setAvatarPending(false);
  }

  return (
    <div className="route-page settings-page profile-page">
      <header className="route-header compact profile-route-header">
        <p className="eyebrow">{language === "km" ? "គណនី" : "Profile"}</p>
        <h1>{language === "km" ? "ប្រវត្តិរូប និងគម្រោងរបស់អ្នក" : "Your profile and plan"}</h1>
        <p>{language === "km" ? "គ្រប់គ្រងឈ្មោះ រូបភាព និងការប្រើប្រាស់ស្កេនរបស់អ្នក។" : "Manage your name, photo, and scan usage."}</p>
      </header>

      {authStatus === "loading" || (authStatus === "authenticated" && profileStatus === "loading") ? (
        <section className="profile-panel dark-panel">
          <AccountSkeleton />
        </section>
      ) : authStatus === "authenticated" ? (
        <>
        <section className="profile-overview-panel">
          <div className="profile-overview-copy">
            <p className="eyebrow">{language === "km" ? "ប្រវត្តិវាល" : "Field profile"}</p>
            <h2>{displayUsername}</h2>
            <p>
              {language === "km"
                ? "រក្សារូបភាពគណនី ការប្រើស្កេន និងទម្លាប់ថតដំណាំរបស់អ្នកនៅកន្លែងតែមួយ។"
                : "Keep your account photo, scan usage, and crop-photo routine in one place."}
            </p>
            <div className="profile-overview-actions">
              <Link className="rust-button" href="/analyze">{language === "km" ? "ស្កេនដំណាំ" : "Scan crop"}</Link>
              <Link className="paper-button" href="/history">{language === "km" ? "មើលប្រវត្តិ" : "View history"}</Link>
            </div>
          </div>
          <div className="profile-sketch-card" aria-hidden="true">
            <CropSketch />
            <div className="profile-sketch-note">
              <span>{language === "km" ? "ស្កេននៅសល់" : "Weekly scans left"}</span>
              <strong>{allowance ? `${allowance.remaining}/${allowance.limit}` : "--"}</strong>
            </div>
          </div>
        </section>

        <div className="profile-grid">
          <section className="profile-panel parchment-panel profile-identity-panel">
            <button className="profile-signout-inline" type="button" onClick={() => void signOut()}>
              {language === "km" ? "ចាកចេញពីគណនី" : "Sign out"}
            </button>
            <div className="profile-avatar-editor">
              <AvatarPreview avatarUrl={avatarUrl} initial={avatarInitial} />
              <div className="profile-avatar-actions">
                <label className={`rust-button avatar-upload ${avatarPending ? "disabled" : ""}`}>
                  <input accept="image/jpeg,image/png,image/webp" disabled={avatarPending} type="file" onChange={uploadAvatar} />
                  {avatarPending ? (language === "km" ? "កំពុងផ្ទុក..." : "Uploading...") : (language === "km" ? "ប្តូររូបភាព" : "Change photo")}
                </label>
                {avatarUrl && (
                  <button className={`paper-button ${avatarPending ? "is-loading" : ""}`} disabled={avatarPending} type="button" onClick={() => void removeAvatar()}>
                    {language === "km" ? "ដកចេញ" : "Remove"}
                  </button>
                )}
              </div>
              <p className="profile-help">{language === "km" ? "ប្រើ JPG, PNG ឬ WebP តូចជាង 2 MB។" : "Use JPG, PNG, or WebP under 2 MB."}</p>
              {avatarMessage && <p className="profile-form-note" role="status">{avatarMessage}</p>}
            </div>

            <div className="profile-account-summary">
              <span className="plan-chip">{language === "km" ? "គម្រោងឥតគិតថ្លៃ" : "Free plan"}</span>
              <h2>{displayUsername}</h2>
              <p>{authEmail}</p>
            </div>

            <form className="profile-form" onSubmit={saveUsername}>
              <label>
                <span>{language === "km" ? "ឈ្មោះអ្នកប្រើ" : "Username"}</span>
                <input
                  autoCapitalize="none"
                  autoComplete="username"
                  maxLength={24}
                  minLength={3}
                  pattern="[a-z0-9_]{3,24}"
                  required
                  spellCheck={false}
                  type="text"
                  value={currentUsernameDraft}
                  onChange={(event) => setUsernameDraft({ source: username, value: event.target.value.toLowerCase() })}
                />
              </label>
              <p className="profile-help">{language === "km" ? "អក្សរ a-z លេខ និង _ តែប៉ុណ្ណោះ; 3-24 តួអក្សរ។" : "Lowercase letters, numbers, and underscores only; 3-24 characters."}</p>
              {usernameMessage && <p className="profile-form-note" role="status">{usernameMessage}</p>}
              <button className="rust-button" disabled={usernamePending} type="submit">
                {usernamePending ? (language === "km" ? "កំពុងរក្សាទុក..." : "Saving...") : (language === "km" ? "រក្សាទុកឈ្មោះ" : "Save username")}
              </button>
            </form>
          </section>

          <section className="profile-panel dark-panel plan-panel">
            <div className="profile-panel-header">
              <div>
                <p className="eyebrow">{language === "km" ? "គម្រោងបច្ចុប្បន្ន" : "Current plan"}</p>
                <h2>{language === "km" ? "គម្រោងឥតគិតថ្លៃ" : "Free plan"}</h2>
              </div>
              <span className="plan-chip">{language === "km" ? "សកម្ម" : "Active"}</span>
            </div>
            <p className="profile-muted">{language === "km" ? "រួមបញ្ចូលការពិនិត្យដំណាំ 5 ដងក្នុងមួយសប្តាហ៍។" : "Includes 5 crop scans each week."}</p>
            <UsageSummary allowance={allowance} language={language} percentage={percentage} />
            <div className="profile-mini-ledger">
              <div>
                <span>{language === "km" ? "កំណត់ឡើងវិញ" : "Reset"}</span>
                <strong>{resetLabel ?? "--"}</strong>
              </div>
              <div>
                <span>{language === "km" ? "ប្រវត្តិស្កេន" : "Scan history"}</span>
                <strong>{language === "km" ? "រក្សាទុក" : "Synced"}</strong>
              </div>
            </div>
            <button className="paper-button upgrade-button" disabled type="button">
              {language === "km" ? "បន្ថែមគម្រោងនាពេលក្រោយ" : "Upgrade options coming later"}
            </button>
          </section>

          <section className="profile-panel dark-panel profile-crop-panel">
            <div className="profile-panel-header">
              <div>
                <p className="eyebrow">{language === "km" ? "ការថតដំណាំ" : "Crop capture"}</p>
                <h2>{language === "km" ? "រៀបចំរូបថតឲ្យបានច្បាស់" : "Prepare a clean crop photo"}</h2>
              </div>
            </div>
            <ul className="profile-crop-checks">
              <li><span />{language === "km" ? "ថតស្លឹក ឬផ្លែដែលមានរោគសញ្ញាច្បាស់បំផុត។" : "Photograph the clearest affected leaf, stem, or fruit."}</li>
              <li><span />{language === "km" ? "រក្សាពន្លឺឲ្យគ្រប់គ្រាន់ និងកុំឲ្យដៃបាំងរុក្ខជាតិ។" : "Keep enough light and avoid covering the plant with your hand."}</li>
              <li><span />{language === "km" ? "ចែករំលែកទៅសហគមន៍ ប្រសិនបើត្រូវការជំនួយបន្ថែម។" : "Share difficult cases with the community when you need extra help."}</li>
            </ul>
          </section>
        </div>
        </>
      ) : authConfigured ? (
        <div className="profile-guest-grid">
        <section className="profile-panel dark-panel profile-guest-panel">
          <h2>{language === "km" ? "ចូលគណនីដើម្បីរក្សាប្រវត្តិរូប" : "Sign in to manage your profile"}</h2>
          <p>{language === "km" ? "គណនីឥតគិតថ្លៃផ្តល់ការពិនិត្យ 5 ដងក្នុងមួយសប្តាហ៍ និងរក្សាទុកលទ្ធផលរបស់អ្នក។" : "A free account gives you 5 scans per week and keeps your results synchronized."}</p>
          <div className="access-links">
            <Link className="rust-button" href="/signup">{language === "km" ? "បង្កើតគណនី" : "Sign up"}</Link>
            <Link className="paper-button" href="/login">{language === "km" ? "ចូល" : "Login"}</Link>
          </div>
        </section>
        <section className="profile-panel dark-panel profile-crop-panel profile-guest-crop-panel">
          <div className="profile-panel-header">
            <div>
              <p className="eyebrow">{language === "km" ? "ការថតដំណាំ" : "Crop capture"}</p>
              <h2>{language === "km" ? "រៀបចំរូបថតឲ្យបានច្បាស់" : "Prepare a clean crop photo"}</h2>
            </div>
          </div>
          <ul className="profile-crop-checks">
            <li><span />{language === "km" ? "ថតស្លឹក ឬផ្លែដែលមានរោគសញ្ញាច្បាស់បំផុត។" : "Photograph the clearest affected leaf, stem, or fruit."}</li>
            <li><span />{language === "km" ? "រក្សាពន្លឺឲ្យគ្រប់គ្រាន់ និងកុំឲ្យដៃបាំងរុក្ខជាតិ។" : "Keep enough light and avoid covering the plant with your hand."}</li>
            <li><span />{language === "km" ? "ចូលគណនីដើម្បីរក្សាប្រវត្តិស្កេនឆ្លងឧបករណ៍។" : "Sign in to keep scan history synced across devices."}</li>
          </ul>
        </section>
        </div>
      ) : (
        <section className="profile-panel dark-panel">
          <h2>{language === "km" ? "ការចូលគណនីមិនទាន់បានរៀបចំ" : "Authentication is not configured"}</h2>
          <p>{language === "km" ? "ភ្ជាប់ Firebase និង Supabase ដើម្បីប្រើប្រវត្តិរូប និងគម្រោង។" : "Connect Firebase and Supabase to use profiles and plans."}</p>
        </section>
      )}
    </div>
  );
}

function AvatarPreview({ avatarUrl, initial }: { avatarUrl: string | null; initial: string }) {
  return (
    <div className="profile-avatar-preview" aria-label="Profile picture">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public avatar URLs are user uploads outside next/image remote config. */}
      {avatarUrl ? <img alt="" src={avatarUrl} /> : <span>{initial}</span>}
    </div>
  );
}

function CropSketch() {
  return (
    <svg className="profile-crop-sketch" viewBox="0 0 260 190" fill="none" aria-hidden="true">
      <path className="sketch-ground" d="M20 160c36-12 68-13 103-1 39 13 76 12 117-1" />
      <path className="sketch-ground faint" d="M44 174c24-7 48-7 73 0 29 8 57 8 88-1" />
      <path className="sketch-stem" d="M129 160c-2-35-1-73 5-118" />
      <path className="sketch-stem" d="M99 158c-2-30 2-63 11-99" />
      <path className="sketch-stem" d="M162 157c0-29-4-61-14-95" />
      <path className="sketch-leaf" d="M132 99c-27-11-45-29-54-54 29 8 48 24 54 54Z" />
      <path className="sketch-leaf" d="M136 91c26-15 43-36 51-63-29 10-48 29-51 63Z" />
      <path className="sketch-leaf" d="M112 128c-23-6-40-19-53-40 26 1 44 13 53 40Z" />
      <path className="sketch-leaf" d="M150 125c25-7 43-21 56-44-28 3-47 16-56 44Z" />
      <circle className="sketch-dot" cx="96" cy="74" r="4" />
      <circle className="sketch-dot" cx="166" cy="61" r="3.5" />
      <circle className="sketch-dot" cx="184" cy="99" r="3" />
    </svg>
  );
}

function UsageSummary({ allowance, language, percentage }: { allowance: ReturnType<typeof useProduct>["allowance"]; language: Language; percentage: number | null }) {
  return (
    <div className="allowance-summary profile-allowance">
      <div className="allowance-header">
        <div>
          <p className="account-label">{language === "km" ? "ការប្រើប្រាស់ប្រចាំសប្តាហ៍" : "Weekly usage"}</p>
          <strong>{language === "km" ? "ពិនិត្យបាន 5 ដងក្នុងមួយសប្តាហ៍" : "5 scans per week"}</strong>
        </div>
        <strong className="usage-percentage">{percentage === null ? "--" : `${percentage}%`}</strong>
      </div>
      <div
        aria-label={language === "km" ? "ការប្រើប្រាស់ការពិនិត្យ" : "Scan usage"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage ?? 0}
        className="usage-meter"
        role="progressbar"
      >
        <span style={{ width: `${percentage ?? 0}%` }} />
      </div>
      {allowance ? (
        <div className="usage-stats">
          <div>
            <span>{language === "km" ? "បានប្រើ" : "Used"}</span>
            <strong>{allowance.used} / {allowance.limit}</strong>
          </div>
          <div>
            <span>{language === "km" ? "នៅសល់" : "Remaining"}</span>
            <strong>{allowance.remaining}</strong>
          </div>
          <div>
            <span>{language === "km" ? "កំណត់ឡើងវិញ" : "Resets"}</span>
            <strong>{formatResetTime(allowance.resetsAt, language) ?? "--"}</strong>
          </div>
        </div>
      ) : (
        <div className="usage-loading" aria-label={language === "km" ? "កំពុងផ្ទុកការប្រើប្រាស់" : "Loading usage"} />
      )}
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="account-skeleton" aria-label="Loading account">
      <span className="skeleton-avatar" />
      <span className="skeleton-line long" />
      <span className="skeleton-line short" />
      <span className="skeleton-meter" />
    </div>
  );
}

function usernameErrorText(error: UsernameSaveError, language: Language) {
  if (error === "invalid_username") return language === "km"
    ? "ឈ្មោះត្រូវមាន 3-24 តួអក្សរ ហើយប្រើតែអក្សរ a-z លេខ ឬសញ្ញា _។"
    : "Use 3-24 lowercase letters, numbers, or underscores only.";
  if (error === "username_taken") return language === "km"
    ? "ឈ្មោះនេះត្រូវបានប្រើរួចហើយ។ សូមសាកល្បងឈ្មោះផ្សេង។"
    : "That username is already taken. Try another one.";
  if (error === "database_not_configured") return language === "km"
    ? "មូលដ្ឋានទិន្នន័យគណនីមិនទាន់បានរៀបចំទេ។ សូមដំណើរការ migration។"
    : "The account database is not set up yet. Run the Supabase migrations.";
  if (error === "unauthorized") return language === "km"
    ? "សម័យចូលគណនីផុតកំណត់។ សូមចូលម្តងទៀត។"
    : "Your session expired. Please sign in again.";
  return language === "km"
    ? "មិនអាចរក្សាទុកឈ្មោះបានទេ។ សូមព្យាយាមម្តងទៀត។"
    : "Unable to save your username. Please try again.";
}

function avatarErrorText(error: AvatarSaveError, language: Language) {
  if (error === "invalid_photo_type") return language === "km"
    ? "សូមប្រើរូបភាព JPG, PNG ឬ WebP។"
    : "Use a JPG, PNG, or WebP image.";
  if (error === "invalid_photo_size") return language === "km"
    ? "រូបភាពត្រូវតូចជាង 2 MB។"
    : "The image must be smaller than 2 MB.";
  if (error === "avatar_storage_not_configured") return language === "km"
    ? "កន្លែងរក្សារូបភាពប្រវត្តិរូបមិនទាន់បានរៀបចំទេ។ សូមដំណើរការ migration។"
    : "Profile photo storage is not set up yet. Run the Supabase migration.";
  if (error === "unauthorized") return language === "km"
    ? "សម័យចូលគណនីផុតកំណត់។ សូមចូលម្តងទៀត។"
    : "Your session expired. Please sign in again.";
  return language === "km"
    ? "មិនអាចរក្សាទុករូបភាពបានទេ។ សូមព្យាយាមម្តងទៀត។"
    : "Unable to save your photo. Please try again.";
}

function formatResetTime(resetsAt: string | undefined, language: Language) {
  if (!resetsAt) return null;
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Phnom_Penh",
  }).format(new Date(resetsAt));
}
