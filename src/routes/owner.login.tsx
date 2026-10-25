import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { SITE } from "@/config/site";
import { Button } from "@/components/ui/button";
import { getOwnerSession, unlockOwner } from "@/lib/owner.functions";

export const Route = createFileRoute("/owner/login")({
  beforeLoad: async () => {
    if ((await getOwnerSession()).unlocked) throw redirect({ to: "/owner" });
  },
  head: () => ({ meta: [
    { title: `Owner access — ${SITE.name}` },
    { name: "description", content: "Secure password-only access to the VoltEdge owner dashboard." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: `Owner access — ${SITE.name}` },
    { property: "og:description", content: "Private VoltEdge owner access." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: OwnerLogin,
});

function OwnerLogin() {
  const navigate = useNavigate();
  const unlock = useServerFn(unlockOwner);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await unlock({ data: { password } });
      setPassword("");
      if (!result.ok) { setError(result.error ?? "Access denied."); return; }
      await navigate({ to: "/owner", replace: true });
    } catch { setError("Could not open the dashboard. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-sm px-4 py-20">
    <LockKeyhole className="mb-5 size-8 text-primary" />
    <h1 className="font-display text-3xl font-bold">Owner dashboard</h1>
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label htmlFor="owner-password" className="block text-sm font-medium">Owner password</label>
      <input id="owner-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-card px-4 py-3 text-sm" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="h-11 w-full">{busy ? "Opening…" : "Open dashboard"}<ArrowRight /></Button>
    </form>
  </main>;
}
