import axionSide from "@/assets/axion-side.jpg";
import axionInterior from "@/assets/axion-interior.jpg";
import heroCar from "@/assets/hero-car.jpg";
import nightHighway from "@/assets/night-highway.jpg";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string };

export interface ArticleSource {
  label: string;
  url: string;
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  readingMinutes: number;
  excerpt: string;
  image: string;
  imageAlt: string;
  body: ArticleBlock[];
  sources: ArticleSource[];
}

export const ARTICLE_CATEGORIES = [
  "All",
  "Batteries",
  "Charging",
  "Guides",
  "Industry",
  "Gaming",
] as const;

export const articles: Article[] = [
  {
    slug: "solid-state-batteries-2026-status",
    title: "Solid-State Batteries in 2026: What's Actually Shipping",
    category: "Batteries",
    date: "2026-10-14",
    readingMinutes: 5,
    excerpt:
      "Solid-state cells keep inching from lab demos toward showrooms. Here is a grounded look at what is real, what is pilot-line, and what is still a slide deck.",
    image: axionSide,
    imageAlt: "Side profile of a dark electric sports coupe concept with red accent lighting",
    body: [
      {
        type: "p",
        text: "Solid-state batteries promise roughly double the energy density of today's lithium-ion cells and no liquid electrolyte to catch fire. That combination — more range, less risk — is why nearly every major automaker has a program. The catch in 2026 is the same as it has been for a decade: manufacturing at scale is brutally hard.",
      },
      { type: "h2", text: "What is genuinely on the road" },
      {
        type: "p",
        text: "Semi-solid and gel-hybrid cells are the first to ship in meaningful volume. They keep a small amount of liquid electrolyte, which makes them far easier to produce, and they already appear in premium vehicles from several Chinese and Japanese manufacturers. True all-solid-state packs remain in pilot production: small batches, built to validate equipment, not to fill order books.",
      },
      { type: "h2", text: "What is still a promise" },
      {
        type: "ul",
        items: [
          "Cycle life at automotive scale — lab cells degrade faster than spec sheets suggest.",
          "Manufacturing yield — separator defects that are tolerable in a coin cell kill a production line.",
          "Cost — most programs still price cells well above mainstream lithium-ion.",
        ],
      },
      { type: "h2", text: "How to read the headlines" },
      {
        type: "p",
        text: "Treat every announcement with three questions: Was the cell tested in a full-size pack? Who ran the test — the maker or an independent lab? And is there a named factory with a date? If any answer is missing, the news is a roadmap, not a product.",
      },
      {
        type: "note",
        text: "VoltEdge is an independent site. We link original sources and date every article. Figures attributed to manufacturers are reported as claims, not verified results.",
      },
    ],
    sources: [
      { label: "Reuters — autos & transportation", url: "https://www.reuters.com/business/autos-transportation/" },
      { label: "IEA — Global EV Outlook", url: "https://www.iea.org/reports/global-ev-outlook-2025" },
    ],
  },
  {
    slug: "800v-charging-explained",
    title: "800-Volt Charging Explained: Why Your Next EV Tops Up in 20 Minutes",
    category: "Charging",
    date: "2026-10-09",
    readingMinutes: 4,
    excerpt:
      "Voltage, not just power, decides how fast an EV charges. We break down what an 800-volt architecture actually buys you at the plug.",
    image: heroCar,
    imageAlt: "Futuristic black electric sports coupe with a glowing red light blade",
    body: [
      {
        type: "p",
        text: "Charging speed is watts, and watts are volts times amps. Most early EVs ran 400-volt systems, so to charge quickly they needed enormous current — thick, heavy, heat-prone cables. Doubling the voltage halves the current for the same power, which is the whole trick behind 800-volt platforms.",
      },
      { type: "h2", text: "The practical benefits" },
      {
        type: "ul",
        items: [
          "Lighter cables and connectors, because less current flows for the same power.",
          "Less waste heat in the car's wiring, so high power can hold for longer.",
          "Faster 10–80% sessions: many 800-volt cars add hundreds of kilometers in 15–20 minutes.",
        ],
      },
      { type: "h2", text: "The catch" },
      {
        type: "p",
        text: "The car is only half the equation. If the charger caps out at 150 kW, an 800-volt vehicle will simply charge at 150 kW — often through an onboard converter. Check the charger's maximum, not just the car's claim. And remember the charging curve: peak power matters far less than how long the car can hold near its peak.",
      },
      {
        type: "note",
        text: "Rule of thumb: compare 10–80% times on the same charger class, not peak-kW headline numbers.",
      },
    ],
    sources: [
      { label: "SAE International — charging standards", url: "https://www.sae.org/standards/" },
      { label: "InsideEVs — charging guides", url: "https://insideevs.com/" },
    ],
  },
  {
    slug: "how-we-estimate-range",
    title: "How EV Range Numbers Work — and Why They Vary",
    category: "Guides",
    date: "2026-10-03",
    readingMinutes: 5,
    excerpt:
      "WLTP, EPA, CLTC — three tests, three answers for the same car. Here is how to translate between them and what real-world range actually depends on.",
    image: axionInterior,
    imageAlt: "Futuristic electric car interior with a curved display and red ambient lighting",
    body: [
      {
        type: "p",
        text: "Every range figure you see is the result of a standardized test cycle, and not all cycles are equally optimistic. CLTC (China) tends to produce the highest numbers, WLTP (Europe) sits in the middle, and EPA (United States) is usually the most conservative.",
      },
      { type: "h2", text: "Quick conversion rules" },
      {
        type: "ul",
        items: [
          "A WLTP figure is typically 10–15% higher than the same car's EPA range.",
          "A CLTC figure can be 20–35% higher than EPA for the same vehicle.",
          "Highway-heavy driving cuts real-world range; city driving with regen often beats the rating.",
        ],
      },
      { type: "h2", text: "What actually moves your range" },
      {
        type: "p",
        text: "Speed dominates: aerodynamic drag grows with the square of velocity, so going from 100 to 130 km/h can cost 15–20% of range. Cold weather is the second-biggest factor — batteries deliver less power when cold and cabin heating draws real energy, though heat pumps recover much of it. Third is payload and wheel choice.",
      },
      {
        type: "note",
        text: "On VoltEdge, our concept car's range figures are explicitly labeled estimates from our own simulated model — never certified ratings.",
      },
    ],
    sources: [
      { label: "IEA — Global EV Outlook", url: "https://www.iea.org/reports/global-ev-outlook-2025" },
      { label: "European Commission — WLTP", url: "https://wltpfacts.eu/" },
    ],
  },
  {
    slug: "used-ev-buying-checklist",
    title: "The Used EV Market Is Maturing: What to Check Before You Buy",
    category: "Guides",
    date: "2026-09-26",
    readingMinutes: 6,
    excerpt:
      "First-generation EVs are now affordable second-hand. Battery health, charge history and software support matter more than mileage — here's your checklist.",
    image: heroCar,
    imageAlt: "Dark premium electric car in a studio with red lighting accents",
    body: [
      {
        type: "p",
        text: "The first wave of mass-market EVs is now five to eight years old, which means genuine bargains — and genuine traps. Unlike combustion cars, an EV's condition is dominated by one component: the battery pack.",
      },
      { type: "h2", text: "The checklist" },
      {
        type: "ul",
        items: [
          "Battery health report: ask for a state-of-health readout, not a dashboard estimate.",
          "DC fast-charge history: a pack that spent its life on high-power chargers may have aged faster.",
          "Software support: confirm the maker still ships updates and that the app account transfers.",
          "Charging hardware: check the port standard and whether adapters are included.",
          "Warranty transfer: many battery warranties follow the car, but confirm in writing.",
        ],
      },
      { type: "h2", text: "Red flags" },
      {
        type: "p",
        text: "A claimed range dramatically below the original rating without a documented pack replacement, warning lights that clear after a restart, and missing service records all deserve a second look — ideally from an independent EV-capable workshop before you sign anything.",
      },
    ],
    sources: [
      { label: "Consumer Reports — EV guidance", url: "https://www.consumerreports.org/cars/electric-ev/" },
      { label: "Reuters — autos & transportation", url: "https://www.reuters.com/business/autos-transportation/" },
    ],
  },
  {
    slug: "gt-racing-goes-electric",
    title: "GT Racing Goes Electric: Why Sim Racing Is the Perfect EV Trial Run",
    category: "Gaming",
    date: "2026-09-18",
    readingMinutes: 4,
    excerpt:
      "Electric touring-car series are growing, and simulators taught a generation how EV torque and energy management feel before they ever drove one.",
    image: nightHighway,
    imageAlt: "Night highway racing scene with red light trails seen from behind a dark sports car",
    body: [
      {
        type: "p",
        text: "Motorsport has always been where new drivetrains prove themselves, and electric racing is no exception. From electric touring series to record-setting hillclimb runs, the racing world is quietly teaching drivers the skills EVs demand: instant torque, heavy regen braking, and energy budgeting as a core racecraft skill.",
      },
      { type: "h2", text: "What translates from sim to street" },
      {
        type: "ul",
        items: [
          "One-pedal driving: modulating regen is a skill, and simulators let you practice it safely.",
          "Energy management: lift-and-coast instead of hard braking saves energy in both worlds.",
          "Throttle discipline: full torque from zero km/h punishes sloppy inputs.",
        ],
      },
      { type: "h2", text: "Try it yourself" },
      {
        type: "p",
        text: "Our own VoltEdge Circuit game is built around exactly these ideas — regen braking, a charging-energy score multiplier, and a powertrain that punishes full throttle the same way a real EV does. It is free, runs in your browser, and no downloads are required.",
      },
    ],
    sources: [
      { label: "Formula E — official site", url: "https://www.fiaformulae.com/" },
      { label: "FIA — electric GT development", url: "https://www.fia.com/" },
    ],
  },
  {
    slug: "charge-curve-vs-peak-power",
    title: "Charge Curve vs. Peak Power: The Number That Matters More",
    category: "Charging",
    date: "2026-09-10",
    readingMinutes: 4,
    excerpt:
      "Two EVs can both claim 250 kW and charge completely differently. The shape of the curve — not the peak — decides your coffee break.",
    image: nightHighway,
    imageAlt: "Motion-blurred night driving scene with red and white light trails",
    body: [
      {
        type: "p",
        text: "Peak charging power is a marketing number; the charge curve is the reality. A car that hits 250 kW for five seconds then collapses to 80 kW can lose a real-world race against a car that holds 180 kW across the whole session.",
      },
      { type: "h2", text: "How to compare honestly" },
      {
        type: "ul",
        items: [
          "Look at 10–80% time on the same charger power class.",
          "Check average power between 10% and 60% — that's where most of the session happens.",
          "Ask about preconditioning: a warm battery can double sustained power in winter.",
        ],
      },
      { type: "h2", text: "Why curves differ" },
      {
        type: "p",
        text: "Manufacturers tune curves to protect the pack. Cell chemistry, cooling capacity, and even warranty targets shape how aggressively a car will pull power. Two cars with identical cells can ship with completely different curves because one maker chose longevity over showroom specs.",
      },
    ],
    sources: [
      { label: "InsideEVs — charging data", url: "https://insideevs.com/" },
      { label: "Electrek — EV charging coverage", url: "https://electrek.co/guides/electric-cars/" },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getRelated(slug: string, count = 3): Article[] {
  const current = getArticle(slug);
  if (!current) return [];
  const sameCategory = articles.filter(
    (a) => a.slug !== slug && a.category === current.category
  );
  const others = articles.filter(
    (a) => a.slug !== slug && a.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, count);
}

export const SITE_LAUNCH_ISO = "2026-09-01";
