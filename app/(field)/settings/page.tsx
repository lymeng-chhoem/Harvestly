"use client";

import Link from "next/link";
import { useState } from "react";
import { useProduct } from "../_components/state/ProductProvider";

export default function SettingsPage() {
  const { language, setLanguage, authStatus, authConfigured, authEmail, signOut } = useProduct();
  const [largeText, setLargeText] = useState(true);
  const [strongContrast, setStrongContrast] = useState(true);
  return (
    <div className={`route-page settings-page ${largeText ? "large-copy" : ""} ${strongContrast ? "strong-copy" : ""}`}>
      <header className="route-header compact">
        <p className="eyebrow">{language === "km" ? "ការកំណត់" : "Settings"}</p>
        <h1>{language === "km" ? "ភាសា និងភាពងាយអាន" : "Language and readability"}</h1>
      </header>
      <section className="setting-card dark-panel">
        <h2>{language === "km" ? "គណនី" : "Account"}</h2>
        <div className="account-panel">
          {authStatus === "authenticated" ? (
            <>
              <p>{language === "km" ? "បានចូលជា" : "Signed in as"} <strong>{authEmail}</strong></p>
              <button className="paper-button" type="button" onClick={() => void signOut()}>{language === "km" ? "ចាកចេញ" : "Sign out"}</button>
            </>
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
