import { createFileRoute, Link } from "@tanstack/react-router";
import { CONCEPT_CAR, type SpecStatus } from "@/data/car";
import axionSide from "@/assets/axion-side.jpg";
import axionInterior from "@/assets/axion-interior.jpg";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/cars/volterra-gt-one")({
  head: () => ({
    meta: [
      { title: `Volterra GT-One concept — specs, range & charging | ${SITE.name}` },
      {
        name: "description",
        content:
          "The Volterra GT-One is VoltEdge's original concept car for our site and racing game. Every specification is a labeled design target or estimate — not an official rating.",
      },
      { property: "og:title", content: "Volterra GT-One concept — specs & design" },
      {
        property: "og:description",
        content:
          "Original concept electric grand tourer with clearly labeled estimates for range, charging and performance.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConceptCarPage,
});

const STATUS_META: Record<SpecStatus, { label: string; className: string }> = {
  target: {
    label: "Concept target",
    className: "border-primary/40 bg-primary/10 text-primary",
  },
  estimate: {
    label: "Estimate",
    className: "border-status-estimate/40 bg-status-estimate/10 text-status-estimate",
  },
  rumor: {
    label: "Rumor",
    className: "border-status-rumor/40 bg-status-rumor/10 text-status-rumor",
  },
};

function SpecTable({ title, specs }: { title: string; specs: readonly { label: string; value: string; status: SpecStatus; note?: string }[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Specification</th>
              <th scope="col" className="px-4 py-3">Figure</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {specs.map((spec) => (
              <tr key={spec.label} className="align-top">
                <th scope="row" className="px-4 py-3 font-medium text-foreground">
                  {spec.label}
                  {spec.note && (
                    <p className="mt-1 text-xs font-normal text-muted-foreground">{spec.note}</p>
                  )}
                </th>
                <td className="px-4 py-3 font-display font-bold text-foreground">{spec.value}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[spec.status].className}`}>
                    {STATUS_META[spec.status].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ConceptCarPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link to="/cars" className="hover:text-primary transition-colors">Cars</Link>
        {" / "}{CONCEPT_CAR.name}
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{CONCEPT_CAR.name}</h1>
      <p className="mt-1 font-display text-sm uppercase tracking-[0.25em] text-primary">
        {CONCEPT_CAR.kind}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border">
        <img
          src={axionSide}
          alt="Volterra GT-One concept, side profile with red rocker-panel light line"
          width={1600}
          height={912}
          className="w-full object-cover"
        />
      </div>

      <div className="mt-6 rounded-xl border border-status-estimate/40 bg-status-estimate/5 p-4 text-sm">
        <p className="font-semibold text-status-estimate">Fictional concept — read this first</p>
        <p className="mt-1 text-muted-foreground">{CONCEPT_CAR.intro}</p>
      </div>

      <p className="mt-6 text-muted-foreground">
        {CONCEPT_CAR.intro.length > 0
          ? "Below, every figure carries a status badge so you always know what kind of number you are reading. If a real-world vehicle with this name ever launches, its official specifications will differ from these design studies."
          : ""}
      </p>

      <SpecTable title="Performance" specs={CONCEPT_CAR.specs.performance} />
      <SpecTable title="Battery & range" specs={CONCEPT_CAR.specs.battery} />
      <SpecTable title="Charging" specs={CONCEPT_CAR.specs.charging} />

      <p className="mt-4 text-xs text-muted-foreground">
        Legend: <strong className="text-primary">Concept target</strong> = a goal we
        set when designing the concept;{" "}
        <strong className="text-status-estimate">Estimate</strong> = a figure from our
        own simulated model; <strong className="text-status-rumor">Rumor</strong> =
        unverified third-party claims. None of these are official specifications.
      </p>

      <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border">
          <img
            src={axionInterior}
            alt="Volterra GT-One concept interior with curved display and red ambient lighting"
            loading="lazy"
            width={1600}
            height={912}
            className="w-full object-cover"
          />
        </div>
        <section>
          <h2 className="font-display text-2xl font-bold">Interior & technology</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {CONCEPT_CAR.interior.map((line) => (
              <li key={line} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Exterior design</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {CONCEPT_CAR.exterior.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Technology concepts</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {CONCEPT_CAR.technology.map((line) => (
            <li key={line} className="flex gap-2">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
        <h2 className="font-display text-2xl font-bold">Drive it yourself</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          The GT-One is the hero car of VoltEdge Circuit, our free browser racing
          game — regen braking, energy scoring and all.
        </p>
        <Link
          to="/game"
          className="mt-5 inline-block rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_32px_-6px_var(--primary)]"
        >
          Play now
        </Link>
      </section>
    </main>
  );
}
