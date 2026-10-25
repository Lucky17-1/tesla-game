import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Terms of use — ${SITE.name}` },
      {
        name: "description",
        content: "The terms that apply when you use the VoltEdge website and racing game.",
      },
      { property: "og:title", content: `Terms of use — ${SITE.name}` },
      { property: "og:description", content: "Terms that apply when using VoltEdge." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Terms of use</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 22 October 2026</p>

      <div className="prose-ev mt-6">
        <h2>Acceptance</h2>
        <p>
          By using {SITE.name} (including the VoltEdge Circuit racing game) you
          agree to these terms. If you do not agree, please do not use the site.
        </p>
        <h2>Ownership and use</h2>
        <p>
          Articles, concept designs, artwork and game code on this site are
          original works. You may read, play and share links freely. You may not
          republish substantial portions of the content or present this site's
          material as your own without permission.
        </p>
        <h2>The game</h2>
        <p>
          VoltEdge Circuit is provided for entertainment, "as is", without any
          warranty of availability, fitness or accuracy. Your progress and best
          score are stored only in your own browser and may be lost when you
          clear site data.
        </p>
        <h2>No professional advice</h2>
        <p>
          Content on this site is general information and commentary about
          electric vehicles. It is not purchase, financial or technical advice.
          Always verify figures with official manufacturer sources before making
          decisions.
        </p>
        <h2>Third-party links and services</h2>
        <p>
          We link to external sources for reference and may display advertising
          once properly configured. We do not control third-party services and
          are not responsible for their content or practices.
        </p>
        <h2>Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, {SITE.name} and its operators
          are not liable for indirect or consequential damages arising from your
          use of the site or game.
        </p>
        <h2>Changes</h2>
        <p>
          These terms may be updated; the date above reflects the current
          version. See also our{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link to="/disclaimer" className="text-primary underline underline-offset-2">
            disclaimer
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
