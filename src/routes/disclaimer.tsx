import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: `Disclaimer — ${SITE.name}` },
      {
        name: "description",
        content: "VoltEdge is unofficial and unaffiliated with any automaker; our concept car and its specifications are fictional.",
      },
      { property: "og:title", content: `Disclaimer — ${SITE.name}` },
      { property: "og:description", content: "Unofficial status, fictional concept car, and estimate labeling." },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Disclaimer</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 22 October 2026</p>

      <div className="prose-ev mt-6">
        <h2>Unofficial and unaffiliated</h2>
        <p>
          {SITE.name} is an independent fan site. We are not affiliated with,
          endorsed by, sponsored by, or connected to any vehicle manufacturer or
          brand. All trademarks, model names and company names mentioned belong
          to their respective owners and are used for identification and
          editorial commentary only.
        </p>
        <h2>The Volterra GT-One is fictional</h2>
        <p>
          The Volterra GT-One concept car — including its design, renders and
          every specification on its page — is an original creation made for
          this website and its racing game. No such vehicle exists or is planned
          by any manufacturer. All of its figures are clearly labeled as design
          targets or estimates from our own simulations, and none of them are
          official specifications of any real product.
        </p>
        <h2>Estimates, rumors and news</h2>
        <p>
          Where we report industry news, we date every article and link the
          sources consulted. Manufacturer claims are reported as claims. We do
          not invent prices, launch dates or specifications for real vehicles,
          and figures marked "estimate" or "rumor" should never be treated as
          fact.
        </p>
        <h2>Advertising</h2>
        <p>
          This site may display advertising (such as Google AdSense) once the
          publisher has configured it. We do not display fake advertisements or
          fabricated earnings, we do not place ads near game controls, and we
          never encourage visitors to click ads. Approval by any ad network is
          never guaranteed.
        </p>
        <h2>The game</h2>
        <p>
          VoltEdge Circuit is an entertainment product. Any resemblance of its
          gameplay to real-world driving is coincidental; drive real cars
          responsibly and within the law.
        </p>
        <p>
          See also our{" "}
          <Link to="/terms" className="text-primary underline underline-offset-2">
            terms of use
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
