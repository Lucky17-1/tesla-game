import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/owner/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Owner dashboard — ${SITE.name}` },
      { name: "description", content: "Private owner dashboard for VoltEdge messages and stats." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Owner dashboard — ${SITE.name}` },
      { property: "og:description", content: "Private owner area." },
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
  const [phase, setPhase] = useState<"loading" | "denied" | "ready">("loading");
  const [userEmail, setUserEmail] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return navigate({ to: "/owner/login", replace: true });
      setUserEmail(data.user.email ?? "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (!roles?.some((r) => r.role === "admin")) return setPhase("denied");
      await load();
      setPhase("ready");
    })();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,subject,message,created_at,is_read,email_status")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) setError(error.message);
    else setMsgs(data ?? []);
  }

  async function toggleRead(m: Msg) {
    await supabase.from("contact_messages").update({ is_read: !m.is_read }).eq("id", m.id);
    setMsgs((all) => all.map((x) => (x.id === m.id ? { ...x, is_read: !x.is_read } : x)));
  }
  async function remove(m: Msg) {
    if (!confirm(`Delete message from ${m.name}?`)) return;
    await supabase.from("contact_messages").delete().eq("id", m.id);
    setMsgs((all) => all.filter((x) => x.id !== m.id));
  }
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/owner/login", replace: true });
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

  if (phase === "loading") return <main className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">Loading…</main>;
  if (phase === "denied")
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-2xl font-bold">No access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {userEmail}. This account isn't the site owner (or its email isn't confirmed yet).
        </p>
        <button onClick={signOut} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm">Sign out</button>
      </main>
    );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Owner dashboard</h1>
          <p className="text-sm text-muted-foreground">Signed in as {userEmail}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/reset-password" className="rounded-lg border border-border px-4 py-2 text-sm">Change password</Link>
          <button onClick={signOut} className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button>
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
                <time className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</time>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{m.subject}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
              <div className="mt-3 flex gap-3 text-xs">
                <button onClick={() => toggleRead(m)} className="hover:text-primary">{m.is_read ? "Mark unread" : "Mark read"}</button>
                <button onClick={() => remove(m)} className="text-destructive hover:underline">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
