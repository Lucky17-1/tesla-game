import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Privacy policy — ${SITE.name}` },
      {
        name: "description",
        content: "How VoltEdge handles data: what we store locally in your browser, cookies, and third-party services.",
      },
      { property: "og:title", content: `Privacy policy — ${SITE.name}` },
      { property: "og:description", content: "How VoltEdge handles data and cookies." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 30 October 2026</p>

      <div className="prose-ev mt-6">
        <h2>The short version</h2>
        <p>
          Public pages and the racing game do not require an account. Contact
          submissions are stored privately for the site owner. Game scores and
          sound preferences stay in your browser.
        </p>
        <h2>What is stored in your browser</h2>
        <ul>
          <li>
            <strong>Cookie choice</strong> — whether you accepted or limited
            cookies on the notice banner.
          </li>
          <li>
            <strong>Racing game best score</strong> — your personal best in
            VoltEdge Circuit, kept on your device.
          </li>
          <li>
            <strong>Sound preference</strong> — whether you muted the game.
          </li>
        </ul>
        <p>
          You can erase all of this at any time by clearing this site's data in
          your browser settings.
        </p>
        <p>
          The owner dashboard uses a secure, HttpOnly session cookie after the
          owner password is verified. The session expires after eight hours;
          locking the dashboard clears it.
        </p>
        <h2>Third-party services</h2>
        <p>
          This site loads web fonts from Google Fonts. Starting the driving
          simulator loads a YouTube player, which may set cookies, show ads,
          and process information under Google's privacy policy. Selecting Map
          or Street View loads Google Maps, which processes usage and device
          information under <a href="https://policies.google.com/privacy" className="text-primary underline">Google's privacy policy</a>.
          We do not track your physical location. If site advertising is enabled in
          the future (for example Google AdSense), it will only load after we
          configure it and, where required by law, after your consent via the
          cookie notice. Its providers would then set their own cookies under
          their own policies.
        </p>
        <h2>Contact form</h2>
        <p>
          The form sends your name, email, subject, message and submission time
          to our backend. Only the site owner can read the stored submissions.
          A hashed network identifier is used for spam protection. Email alerts
          are not active until a sending service is configured and tested.
        </p>
        <h2>Children</h2>
        <p>
          This site is not directed at children under 13 and we do not
          knowingly collect their data.
        </p>
        <h2>Changes</h2>
        <p>
          If this policy changes, the updated date above will change with it.
          Questions? Use the{" "}
          <Link to="/contact" className="text-primary underline underline-offset-2">
            contact page
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
