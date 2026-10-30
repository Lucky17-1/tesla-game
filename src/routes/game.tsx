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
          "Drive a personalized family MPV or luxury sedan on the alpine circuit, with 360 cabin cameras, fullscreen, in-car YouTube and a separate Google Street View at your chosen start location.",
      },
      { property: "og:title", content: "Deshmukh Drive — Alpine driving & drift simulator" },
      {
        property: "og:description",
        content: "Personalized MPV and luxury-sedan driving, eight cameras, cabin YouTube and separate Google Maps and Street View. No download, no account.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  return <main><DrivingSimulator /></main>;
}
