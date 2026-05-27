import Link from "next/link";
import { getPublicSupportEmail } from "@/lib/supabase/config";

export const metadata = {
  title: "Data Deletion | Harvestly",
};

export default function DataDeletionPage() {
  const supportEmail = getPublicSupportEmail();

  return (
    <div className="route-page legal-page">
      <header className="route-header compact">
        <p className="eyebrow">Harvestly</p>
        <h1>Data Deletion Instructions</h1>
        <p>Request removal of your Harvestly account and stored account data.</p>
      </header>
      <article className="parchment-panel legal-document">
        <h2>Request account deletion</h2>
        <ol>
          <li>
            Email{" "}
            {supportEmail ? (
              <a href={`mailto:${supportEmail}?subject=Harvestly%20data%20deletion%20request`}>{supportEmail}</a>
            ) : (
              "the Harvestly support address published with this service"
            )}{" "}
            with the subject line <strong>Harvestly data deletion request</strong>.
          </li>
          <li>Send the request from the email address associated with your Harvestly account.</li>
          <li>We will verify the request and remove the account information and linked stored scan-result metadata.</li>
        </ol>

        <h2>Guest browser data</h2>
        <p>
          Guest scan history and anonymous scan allowance information remain only in browser storage
          on your device. You can delete this information immediately by clearing site data for
          Harvestly in your browser settings.
        </p>

        <h2>Questions</h2>
        <p>
          For questions about deletion or privacy, contact{" "}
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          ) : (
            "the Harvestly support address published with this service"
          )}
          .
        </p>
        <div className="legal-actions">
          <Link className="paper-button" href="/privacy">
            Privacy policy
          </Link>
          <Link className="rust-button" href="/">
            Return to Harvestly
          </Link>
        </div>
      </article>
    </div>
  );
}
