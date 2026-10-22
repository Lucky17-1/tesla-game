import { createFileRoute, Link } from "@tanstack/react-router";
import { articles } from "@/data/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { CONCEPT_CAR } from "@/data/car";
import heroCar from "@/assets/hero-car.jpg";
import axionSide from "@/assets/axion-side.jpg";
import nightHighway from "@/assets/night-highway.jpg";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${SITE.name} — Electric Performance News, Reviews & Racing Game` },
      {
        name: "description",
        content:
          "Independent EV news, guides and reviews, plus a free playable browser racing game. Unofficial, original and clearly labeled.",
      },
      { property: "og:title", content: `${SITE.name} — Electric Performance, Decoded` },
      {
        property: "og:description",
        content:
          "Independent EV news, guides and reviews, plus a free playable browser racing game.",
      },
    ],
  }),
  component: HomePage,
});

const HERO_STATS = [
  { label: "0–100 km/h", value: "< 3.0 s" },
  { label: "Range (est.)", value: "520 km" },
  { label: "Peak DC charge", value: "350 kW" },
  { label: "10–80% (est.)", value: "~18 min" },
];

function HomePage() {
  const latest = articles.slice(0, 3);

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroCar}
          alt="Volterra GT-One concept — futuristic black electric sports coupe with a glowing red light blade"
          width={1920}
          height={1088}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div aria-hidden className="absolute inset-0 -z-10 hero-grid" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28">
          <p className="animate-fade-in font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Independent · Unofficial · Original
          </p>
          <h1 className="mt-4 max-w-2xl animate-fade-up font-display text-4xl font-bold leading-tight sm:text-6xl">
            Electric performance,{" "}
            <span className="text-glow text-primary">decoded</span>.
          </h1>
          <p className="mt-4 max-w-xl animate-fade-up text-lg text-muted-foreground">
            Original EV news, guides and concept design — plus{" "}
            <strong className="font-semibold text-foreground">VoltEdge Circuit</strong>,
            a free racing game that runs right in your browser.
          </p>
          <div className="mt-8 flex animate-fade-up flex-wrap gap-3">
            <Link
              to="/game"
              className="rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_32px_-6px_var(--primary)]"
            >
              Play the racing game
            </Link>
            <Link
              to="/cars/volterra-gt-one"
              className="rounded-lg border border-input px-6 py-3 font-display font-semibold text-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              Explore the GT-One concept
            </Link>
          </div>
          <dl className="mt-12 flex animate-fade-up flex-wrap gap-x-8 gap-y-4">
            {HERO_STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </dt>
                <dd className="font-display text-2xl font-bold text-foreground">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Figures above are estimates for our original concept car — not official
            specifications of any real vehicle.
          </p>
        </div>
      </section>

      {/* Concept car */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <img
              src={axionSide}
              alt="Side profile of the Volterra GT-One concept with a red accent light line"
              loading="lazy"
              width={1600}
              height={912}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              Featured concept
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold">
              {CONCEPT_CAR.name}
            </h2>
            <p className="mt-4 text-muted-foreground">{CONCEPT_CAR.intro}</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              {CONCEPT_CAR.exterior.slice(0, 3).map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              to="/cars/volterra-gt-one"
              className="mt-6 inline-block rounded-lg border border-primary/50 px-5 py-2.5 font-display font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Full specifications
            </Link>
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold">Latest from the wire</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Original reporting, dated and sourced.
            </p>
          </div>
          <Link to="/news" className="text-sm font-medium text-primary hover:underline">
            All news →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latest.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      </section>

      {/* Game promo */}
      <section className="mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <img
            src={nightHighway}
            alt="Night highway racing with red and white light trails"
            loading="lazy"
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
          <div className="relative p-8 sm:p-12">
            <h2 className="max-w-md font-display text-3xl font-bold sm:text-4xl">
              VoltEdge Circuit
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Dodge traffic, chase energy cells and beat your personal best in a
              free 3D racing game. Keyboard and touch controls, no download.
            </p>
            <Link
              to="/game"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_32px_-6px_var(--primary)]"
            >
              Start your engine
            </Link>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 rounded-2xl border border-border bg-card p-8 sm:grid-cols-3">
          <div>
            <h3 className="font-display font-semibold text-foreground">Clearly labeled</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Official figures, our own estimates and unverified rumors are always
              separated — you always know what a number is.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Sourced & dated</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Every article lists its publication date and links the sources we
              used. We never invent prices or launch dates.
            </p>
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Independent</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {SITE.name} is unofficial and unaffiliated. No automaker reviews or
              approves what we publish.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
