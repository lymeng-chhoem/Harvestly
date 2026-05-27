"use client";

import Link from "next/link";
import { useProduct } from "../state/ProductProvider";

export function CommunityContent({ authenticated }: { authenticated: boolean }) {
  const { language } = useProduct();
  return (
    <div className="route-page centered-page">
      <section className="community-card parchment-panel">
        <div className="community-mark" aria-hidden="true">
          <svg viewBox="0 0 72 72"><path d="M23 35a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm26 0a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM7 58c1-12 10-18 20-18 5 0 9 2 12 5m-2 13c1-12 10-18 20-18 5 0 9 2 12 5" /></svg>
        </div>
        <p className="eyebrow">{language === "km" ? "សហគមន៍" : "Community"}</p>
        {authenticated ? (
          <>
            <h1>{language === "km" ? "បណ្តាញជំនួយនៅមូលដ្ឋាននឹងមកដល់ឆាប់ៗ" : "Local support network coming soon"}</h1>
            <p>{language === "km" ? "យើងកំពុងរៀបចំការតភ្ជាប់ទៅមន្ត្រីកសិកម្ម និងកសិករជិតខាងដែលអាចជួយពិនិត្យបញ្ហានៅវាល។" : "We are preparing connections to agricultural officers and nearby farmers who can help verify field problems."}</p>
          </>
        ) : (
          <>
            <h1>{language === "km" ? "បង្កើតគណនីដើម្បីចូលសហគមន៍" : "Sign up to access community support"}</h1>
            <p>{language === "km" ? "សមាជិកនឹងអាចភ្ជាប់ទៅជំនួយក្នុងតំបន់នៅពេលមុខងារនេះរួចរាល់។" : "Registered members will be able to reach local support as this feature becomes available."}</p>
            <div className="access-links">
              <Link className="rust-button" href="/signup?next=/community">{language === "km" ? "បង្កើតគណនី" : "Sign up"}</Link>
              <Link className="paper-button" href="/login?next=/community">{language === "km" ? "ចូលគណនី" : "Login"}</Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
