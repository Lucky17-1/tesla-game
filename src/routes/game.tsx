import { createFileRoute, Link } from "@tanstack/react-router";
import nightHighway from "@/assets/night-highway.jpg";
import { GameCanvas } from "@/components/game/GameCanvas";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/game")({
  // The 3D game must never render on the server.
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `VoltEdge Circuit — free browser racing game | ${SITE.name}` },
      {
        name: "description",
        content:
          "Play VoltEdge Circuit: a free 3D electric racing game in your browser. Dodge traffic, collect energy cells and beat your personal best. Keyboard and touch controls.",
      },
      { property: "og:title", content: "VoltEdge Circuit — free browser racing game" },
      {
        property: "og:description",
        content: "A free 3D electric racing game in your browser. No download, no account.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <GameCanvas />

      <section className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Controls</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-foreground">Keyboard:</strong> steer with A/D
            or ←/→, accelerate with W/↑, brake with S/↓, pause with Esc.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-foreground">Touch:</strong> use the on-screen
            buttons on the left and right edges.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Scoring</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Distance builds your score, glowing energy cells are worth +100 each,
            and a close overtake earns a +25 near-miss bonus. Crashing ends the run.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">The car</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You drive the Volterra GT-One, our original concept EV. Learn more
            about its (fictional, clearly labeled) specifications on the{" "}
            <Link to="/cars/volterra-gt-one" className="text-primary hover:underline">
              concept page
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
