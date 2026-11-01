import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createAvatarDescriptions } from "@/lib/avatars.functions";

const SEATS = ["Driver", "Front passenger", "Rear seat"] as const;
const STORAGE = "deshmukh-rider-avatars";
type Avatar = { seat: string; name: string; look: string; outfit: string; vibe: string };

/** Players describe their riders; the server asks the AI model for avatar descriptions. */
export function RidersPanel() {
  const create = useServerFn(createAvatarDescriptions);
  const [text, setText] = useState<string[]>(["", "", ""]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem(STORAGE) ?? "null"); if (saved?.text) setText(saved.text); if (saved?.avatars) setAvatars(saved.avatars); } catch { /* optional */ } }, []);

  async function submit() {
    const riders = SEATS.map((seat, i) => ({ seat, description: (text[i] ?? "").trim() })).filter((r) => r.description.length >= 3);
    if (!riders.length) { setError("Describe at least one rider (3+ letters)."); return; }
    setBusy(true); setError("");
    try {
      const res = await create({ data: { riders } });
      if (!res.ok) { setError(res.error); return; }
      setAvatars(res.avatars);
      try { localStorage.setItem(STORAGE, JSON.stringify({ text, avatars: res.avatars })); } catch { /* optional */ }
    } catch { setError("Could not reach the server. Try again."); }
    finally { setBusy(false); }
  }

  return <section className="sim-maps overflow-y-auto bg-background p-4 sm:p-6" aria-label="Riders">
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header><h2 className="flex items-center gap-2 font-display text-xl font-bold"><Users className="size-5 text-primary" />Who is riding?</h2>
        <p className="text-sm text-muted-foreground">Describe each person in your car. AI will create an avatar description for each seat.</p></header>
      <div className="grid gap-3 sm:grid-cols-3">
        {SEATS.map((seat, i) => <label key={seat} className="space-y-1 text-sm font-medium">{seat}
          <Textarea value={text[i]} maxLength={400} rows={4} placeholder="e.g. young guy, glasses, black shirt, loves music"
            onChange={(e) => setText((t) => t.map((v, j) => (j === i ? e.target.value : v)))} /></label>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => { void submit(); }} disabled={busy}>{busy && <Loader2 className="animate-spin" />}{busy ? "Creating avatars…" : "Create avatars"}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      {avatars.length > 0 && <div className="grid gap-3 sm:grid-cols-3">
        {avatars.map((a) => <article key={a.seat + a.name} className="rounded-lg border border-border bg-card p-4 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{a.seat}</p>
          <h3 className="font-display text-lg font-bold">{a.name}</h3>
          <p className="mt-2"><span className="font-semibold">Look: </span>{a.look}</p>
          <p className="mt-1"><span className="font-semibold">Outfit: </span>{a.outfit}</p>
          <p className="mt-1"><span className="font-semibold">Vibe: </span>{a.vibe}</p>
        </article>)}
      </div>}
    </div>
  </section>;
}
