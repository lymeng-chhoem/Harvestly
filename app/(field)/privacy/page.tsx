import Link from "next/link";
import { getPublicSupportEmail } from "@/lib/supabase/config";

export const metadata = {
  title: "Privacy Policy | Harvestly",
};

export default function PrivacyPage() {
  const supportEmail = getPublicSupportEmail();

  return (
    <div className="route-page legal-page">
      <header className="route-header compact">
        <p className="eyebrow">Harvestly</p>
        <h1>Privacy Policy</h1>
        <p>How Harvestly handles account information and crop scan activity.</p>
      </header>
      <article className="parchment-panel legal-document">
        <h2>Information we process</h2>
        <p>
          When you create an account or sign in through Google or Facebook, Harvestly uses Firebase
          Authentication to manage your account and session. Your profile may include your email
          address, display name, and profile image supplied by the authentication provider.
        </p>
        <p>
          For signed-in users, Harvestly stores successful scan-result metadata such as crop type,
          detected condition, risk, confidence, and scan time so results can appear across devices.
        </p>

        <h2>Photos and analysis</h2>
        <p>
          Photos selected for analysis are sent to the configured analysis service to produce a
          result. Harvestly does not save uploaded crop photos in scan history. Result metadata may
          be stored for signed-in users as described above.
        </p>

        <h2>Guest use and local storage</h2>
        <p>
          If you use Harvestly without an account, your language preference, scan allowance, and
          recent scan-result history are stored in your browser storage on that device. Clearing
          browser storage removes this locally saved guest information.
        </p>

        <h2>How we use information</h2>
        <ul>
          <li>To sign you in and keep your session secure.</li>
          <li>To provide crop analysis results and show your recent successful results.</li>
          <li>To enforce scan allowances and improve the reliability of the service.</li>
        </ul>

        <h2>Deletion and contact</h2>
        <p>
          You may request deletion of your Harvestly account and associated stored data by following
          our <Link href="/data-deletion">data deletion instructions</Link>.
        </p>
        <p>
          For privacy questions, contact{" "}
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          ) : (
            "the Harvestly support address published with this service"
          )}
          .
        </p>
        <div className="legal-actions">
          <Link className="paper-button" href="/">
            Return to Harvestly
          </Link>
          <Link className="rust-button" href="/data-deletion">
            Data deletion
          </Link>
        </div>
      </article>
    </div>
  );
}
