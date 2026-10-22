import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About us — ${SITE.name}` },
      {
        name: "description",
        content:
          "Who we are: an independent, unofficial site covering electric performance cars, with original articles and a free browser racing game.",
      },
      { property: "og:title", content: `About us — ${SITE.name}` },
      {
        property: "og:description",
        content: "An independent, unofficial site covering electric performance cars.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">About {SITE.name}</h1>

      <div className="prose-ev mt-6">
        <p>
          {SITE.name} is an independent fan project about electric performance
          cars. We publish original news, guides and explainers, design an
          original concept car — the Volterra GT-One — and build a free browser
          racing game around it.
        </p>
        <h2>Our independence</h2>
        <p>
          We are <strong>not affiliated with, endorsed by, or connected to any
          vehicle manufacturer</strong>, including any company whose vehicles or
          industry news we cover. Trademarks and vehicle names mentioned in our
          articles belong to their respective owners and are used for
          identification and commentary only.
        </p>
        <h2>How we label information</h2>
        <p>
          Trust requires knowing what kind of number you are reading. That is
          why every figure on this site carries a label:
        </p>
        <ul>
          <li>
            <strong>Official</strong> — published by a manufacturer, with a link
            to the source.
          </li>
          <li>
            <strong>Concept target / Estimate</strong> — designed or simulated
            by us for our original concept car. Never a real product rating.
          </li>
          <li>
            <strong>Rumor</strong> — reported by third parties and clearly
            marked unverified.
          </li>
        </ul>
        <p>
          We never invent prices, launch dates or specifications for real
          vehicles, and we date and source every article.
        </p>
        <h2>The racing game</h2>
        <p>
          VoltEdge Circuit is our free, playable 3D racing game that runs in
          your browser — no downloads, no account, and your best score stays in
          your own browser storage. It exists because electric performance is
          best understood by driving.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Questions, corrections or feedback?
        </p>
        <Link
          to="/contact"
          className="mt-3 inline-block rounded-lg bg-primary px-5 py-2.5 font-display font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Contact us
        </Link>
      </div>
    </main>
  );
}
