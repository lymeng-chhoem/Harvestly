"use client";

import Link from "next/link";
import { useState } from "react";
import type { Language } from "@/lib/harvestly-content";
import { useProduct } from "../_components/state/ProductProvider";

export default function SettingsPage() {
  const {
    language,
    setLanguage,
    authStatus,
    authConfigured,
    authEmail,
    username,
    profileStatus,
    allowance,
    signOut,
  } = useProduct();
  const [largeText, setLargeText] = useState(true);
  const [strongContrast, setStrongContrast] = useState(true);
  const percentage = allowance && allowance.limit > 0
    ? Math.min(100, Math.round((allowance.used / allowance.limit) * 100))
    : null;

  return (
    <div className={`route-page settings-page ${largeText ? "large-copy" : ""} ${strongContrast ? "strong-copy" : ""}`}>
      <header className="route-header compact">
        <p className="eyebrow">{language === "km" ? "ការកំណត់" : "Settings"}</p>
        <h1>{language === "km" ? "គណនី និងការអានងាយស្រួល" : "Account and readability"}</h1>
      </header>
      <section className="setting-card dark-panel">
        <h2>{language === "km" ? "គណនី" : "Account"}</h2>
        <div className="account-panel">
          {authStatus === "loading" || (authStatus === "authenticated" && profileStatus === "loading") ? (
            <AccountSkeleton />
          ) : authStatus === "authenticated" && profileStatus === "complete" && username ? (
            <>
              <div className="account-identity">
                <span className="account-avatar" aria-hidden="true">{username.charAt(0).toUpperCase()}</span>
                <div>
                  <p className="account-username">{username}</p>
                  <p className="account-email">{authEmail}</p>
                </div>
                <span className="plan-chip">{language === "km" ? "គម្រោងឥតគិតថ្លៃ" : "Free plan"}</span>
              </div>
              <div className="allowance-summary">
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
                      <span>{language === "km" ? "នៅសល់" : "Remaining tries"}</span>
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
              <div className="account-actions">
                <button className="paper-button" type="button" onClick={() => void signOut()}>
                  {language === "km" ? "ចាកចេញ" : "Sign out"}
                </button>
              </div>
            </>
          ) : authStatus === "authenticated" ? (
            <div className="profile-incomplete">
              <p>{language === "km" ? "សូមជ្រើសឈ្មោះអ្នកប្រើ ដើម្បីបញ្ចប់ការរៀបចំគណនី។" : "Choose a username to finish setting up your account."}</p>
              <Link className="rust-button" href="/complete-profile">{language === "km" ? "បញ្ចប់ការរៀបចំ" : "Finish setup"}</Link>
            </div>
          ) : authConfigured ? (
            <>
              <p>{language === "km" ? "ចូលគណនីដើម្បីទទួលបានការពិនិត្យ ៥ ដងក្នុងមួយសប្តាហ៍។" : "Sign in for 5 scans per week and synchronized results."}</p>
              <div className="access-links">
                <Link className="rust-button" href="/signup">{language === "km" ? "បង្កើតគណនី" : "Sign up"}</Link>
                <Link className="paper-button" href="/login">{language === "km" ? "ចូល" : "Login"}</Link>
              </div>
            </>
          ) : (
            <p>{language === "km" ? "ការចូលគណនីមិនទាន់បានកំណត់រចនាសម្ព័ន្ធទេ។" : "Authentication is not configured yet."}</p>
          )}
        </div>
        <h2>{language === "km" ? "ភាសាបង្ហាញ" : "Display language"}</h2>
        <div className="setting-language" role="group" aria-label={language === "km" ? "ភាសាបង្ហាញ" : "Display language"}>
          <button className={language === "km" ? "selected" : ""} type="button" onClick={() => setLanguage("km")}>ខ្មែរ</button>
          <button className={language === "en" ? "selected" : ""} type="button" onClick={() => setLanguage("en")}>English</button>
        </div>
        <h2>{language === "km" ? "ភាពងាយអាននៅក្រៅផ្ទះ" : "Outdoor readability"}</h2>
        <label className="switch-row">
          <span>{language === "km" ? "អក្សរធំងាយអាន" : "Larger readable text"}</span>
          <input type="checkbox" checked={largeText} onChange={(event) => setLargeText(event.target.checked)} />
        </label>
        <label className="switch-row">
          <span>{language === "km" ? "កម្រិតពណ៌ខ្ពស់" : "Strong contrast"}</span>
          <input type="checkbox" checked={strongContrast} onChange={(event) => setStrongContrast(event.target.checked)} />
        </label>
      </section>
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

function formatResetTime(resetsAt: string | undefined, language: Language) {
  if (!resetsAt) return null;
  return new Intl.DateTimeFormat(language === "km" ? "km-KH" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Phnom_Penh",
  }).format(new Date(resetsAt));
}
