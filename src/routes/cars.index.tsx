import { createFileRoute, Link } from "@tanstack/react-router";
import { CONCEPT_CAR } from "@/data/car";
import axionSide from "@/assets/axion-side.jpg";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/cars/")({
  head: () => ({
    meta: [
      { title: `Cars — ${SITE.name}` },
      {
        name: "description",
        content:
          "Electric performance car coverage from VoltEdge, including our original Volterra GT-One concept with clearly labeled specifications.",
      },
      { property: "og:title", content: `Cars — ${SITE.name}` },
      {
        property: "og:description",
        content: "Electric performance car coverage and the original Volterra GT-One concept.",
      },
    ],
  }),
  component: CarsIndex,
});

function CarsIndex() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Cars</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Coverage of electric performance cars, plus our own original concept. We
        clearly separate official figures, estimates and rumors on every page.
      </p>

      <Link
        to="/cars/volterra-gt-one"
        className="group mt-10 grid overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:glow-card md:grid-cols-2"
      >
        <div className="aspect-[16/9] overflow-hidden md:aspect-auto">
          <img
            src={axionSide}
            alt="Volterra GT-One concept side profile with red accent lighting"
            loading="lazy"
            width={1600}
            height={912}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-6 sm:p-8">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Original concept
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold">{CONCEPT_CAR.name}</h2>
          <p className="mt-3 text-muted-foreground">{CONCEPT_CAR.intro}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Battery (est.)</dt>
              <dd className="font-display text-lg font-bold">95 kWh</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Range (est.)</dt>
              <dd className="font-display text-lg font-bold">520 km</dd>
            </div>
          </dl>
          <span className="mt-6 inline-block text-sm font-medium text-primary">
            View specifications →
          </span>
        </div>
      </Link>

      <section className="mt-14 rounded-2xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-bold">How we label car figures</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Official</strong> — published by a
            manufacturer and linked to its source.
          </li>
          <li>
            <strong className="text-foreground">Concept target / Estimate</strong> —
            designed or simulated by us for our concept car; never a real product rating.
          </li>
          <li>
            <strong className="text-foreground">Rumor</strong> — reported by third
            parties and clearly marked unverified.
          </li>
        </ul>
      </section>
    </main>
  );
}
