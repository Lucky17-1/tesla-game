import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getOwnerMessages, updateOwnerMessage, deleteOwnerMessage, lockOwner } from "@/lib/owner.functions";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/owner/")({
  loader: () => getOwnerMessages(),
  head: () => ({
    meta: [
      { title: `Owner dashboard — ${SITE.name}` },
      { name: "description", content: "Private owner dashboard for VoltEdge messages and stats." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Owner dashboard — ${SITE.name}` },
      { property: "og:description", content: "Private owner area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OwnerDashboard,
});

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  is_read: boolean;
  email_status: string;
}

function OwnerDashboard() {
  const navigate = useNavigate();
  const initial = Route.useLoaderData();
  const update = useServerFn(updateOwnerMessage);
  const deleteMessage = useServerFn(deleteOwnerMessage);
  const lock = useServerFn(lockOwner);
  const [msgs, setMsgs] = useState<Msg[]>(initial.messages);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleRead(m: Msg) {
    setError(""); setBusy(true);
    try {
      await update({ data: { id: m.id, isRead: !m.is_read } });
      setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, is_read: !x.is_read } : x)));
    } catch { setError("Message could not be updated."); }
    finally { setBusy(false); }
  }
  async function remove(m: Msg) {
    if (!confirm(`Delete message from ${m.name}?`)) return;
    setError(""); setBusy(true);
    try {
      await deleteMessage({ data: { id: m.id } });
      setMsgs((all) => all.filter((x) => x.id !== m.id));
    } catch { setError("Message could not be deleted."); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try {
      await lock();
      setMsgs([]);
      await navigate({ to: "/owner/login", replace: true });
    } catch { setError("Could not lock the dashboard. Please try again."); setBusy(false); }
  }

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 864e5;
    const bySubject: Record<string, number> = {};
    for (const m of msgs) bySubject[m.subject] = (bySubject[m.subject] ?? 0) + 1;
    return {
      total: msgs.length,
      unread: msgs.filter((m) => !m.is_read).length,
      week: msgs.filter((m) => new Date(m.created_at).getTime() > weekAgo).length,
      bySubject,
    };
  }, [msgs]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Owner dashboard</h1>
          <p className="text-sm text-muted-foreground">Private owner area</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={signOut}>Lock dashboard</Button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ["Total messages", stats.total],
          ["Unread", stats.unread],
          ["Last 7 days", stats.week],
          ["Top subject", Object.entries(stats.bySubject).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"],
        ].map(([label, v]) => (
          <div key={label as string} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-2xl font-bold">{v}</div>
          </div>
        ))}
      </section>
      <p className="mt-3 text-xs text-muted-foreground">
        Email alerts to akilking.in@gmail.com: not active yet (needs a verified sending domain). Messages are always saved here.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">Messages</h2>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        {msgs.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No messages yet.</p>}
        <ul className="mt-4 space-y-3">
          {msgs.map((m) => (
            <li key={m.id} className={`rounded-xl border p-4 ${m.is_read ? "border-border bg-card" : "border-primary/50 bg-primary/5"}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-semibold">{m.name}</span>{" "}
                  <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline">{m.email}</a>
                </div>
                <time className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</time>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{m.subject}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
              <div className="mt-3 flex gap-3 text-xs">
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleRead(m)}>{m.is_read ? "Mark unread" : "Mark read"}</Button>
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove(m)} className="text-destructive">Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
