"use client";

import Link from "next/link";
import { useState } from "react";
import type { Language } from "@/lib/harvestly-content";
import { CropProblemsSummary } from "./_components/home/CropProblemsSummary";
import { FieldNote } from "./_components/home/FieldNote";
import { HeroBanner } from "./_components/home/HeroBanner";
import { HomeUploadArea } from "./_components/home/HomeUploadArea";
import { HowItWorksPanel } from "./_components/home/HowItWorksPanel";
import { RecentAnalysesSummary } from "./_components/home/RecentAnalysesSummary";
import { type AuthStatus, type ProfileStatus, useProduct } from "./_components/state/ProductProvider";

const GREETING_TEMPLATES = {
  en: [
    "Hi, {username}",
    "Welcome back, {username}",
    "Have a nice day, {username}",
    "Ready for the field, {username}?",
  ],
  km: [
    "សួស្តី {username}",
    "ស្វាគមន៍ត្រឡប់មកវិញ {username}",
    "សូមឱ្យមានថ្ងៃល្អ {username}",
    "ត្រៀមពិនិត្យដំណាំហើយឬនៅ {username}?",
  ],
} satisfies Record<Language, string[]>;

export default function HomePage() {
  const { language, authStatus, username, profileStatus } = useProduct();
  const [greetingIndex] = useState(() => Math.floor(Math.random() * GREETING_TEMPLATES.en.length));

  return (
    <div className="dashboard">
      <HomeAuthActions
        authStatus={authStatus}
        greetingIndex={greetingIndex}
        language={language}
        profileStatus={profileStatus}
        username={username}
      />
      <HeroBanner language={language} />
      <div className="action-row">
        <HomeUploadArea language={language} />
        <HowItWorksPanel language={language} />
      </div>
      <div className="summary-row">
        <CropProblemsSummary language={language} />
        <RecentAnalysesSummary language={language} />
      </div>
      <FieldNote language={language} />
    </div>
  );
}

function HomeAuthActions({
  language,
  authStatus,
  greetingIndex,
  profileStatus,
  username,
}: {
  language: Language;
  authStatus: AuthStatus;
  greetingIndex: number | null;
  profileStatus: ProfileStatus;
  username: string | null;
}) {
  const greeting = username && greetingIndex !== null
    ? GREETING_TEMPLATES[language][greetingIndex].replace("{username}", username)
    : null;

  return (
    <div className="home-auth-actions">
      {authStatus === "loading" || (authStatus === "authenticated" && profileStatus === "loading") ? (
        <span className="home-auth-placeholder" aria-hidden="true" />
      ) : authStatus === "authenticated" && profileStatus === "complete" && greeting ? (
        <Link className="paper-button home-greeting" href="/settings" title={greeting} suppressHydrationWarning>
          {greeting}
        </Link>
      ) : authStatus === "authenticated" ? (
        <Link className="paper-button" href="/complete-profile">
          {language === "km" ? "រៀបចំគណនី" : "Finish setup"}
        </Link>
      ) : (
        <>
          <Link className="paper-button" href="/login">
            {language === "km" ? "ចូលគណនី" : "Login"}
          </Link>
          <Link className="rust-button" href="/signup">
            {language === "km" ? "ចុះឈ្មោះ" : "Sign up"}
          </Link>
        </>
      )}
    </div>
  );
}
