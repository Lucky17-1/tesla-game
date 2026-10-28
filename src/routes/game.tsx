import { createFileRoute } from "@tanstack/react-router";
import { DrivingSimulator } from "@/components/game/DrivingSimulator";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/game")({
  // The 3D game must never render on the server.
  ssr: false,
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Deshmukh Drive — Alpine driving & drift simulator | ${SITE.name}` },
      {
        name: "description",
        content:
          "Drive the Deshmukh sedan on a forest mountain circuit. A free 3D driving and drift simulator with cabin cameras, fullscreen and in-car YouTube.",
      },
      { property: "og:title", content: "Deshmukh Drive — Alpine driving & drift simulator" },
      {
        property: "og:description",
        content: "A personalized alpine-road driving simulator with drift mode, six cameras and a cabin YouTube screen. No download, no account.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return <main><DrivingSimulator /></main>;
}
