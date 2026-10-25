import { createFileRoute, redirect } from "@tanstack/react-router";
import { SITE } from "@/config/site";

// Legacy account-recovery URL; owner access now uses a server-side shared password.
export const Route = createFileRoute("/reset-password")({
  beforeLoad: () => { throw redirect({ to: "/owner/login" }); },
  head: () => ({ meta: [
    { title: `Owner access recovery — ${SITE.name}` },
    { name: "description", content: "Return to secure VoltEdge owner access." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: `Owner access recovery — ${SITE.name}` },
    { property: "og:description", content: "Return to VoltEdge owner access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
