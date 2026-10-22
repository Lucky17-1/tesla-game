import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/owner/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Owner sign in — ${SITE.name}` },
      { name: "description", content: "Private sign-in for the VoltEdge site owner." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Owner sign in — ${SITE.name}` },
      { property: "og:description", content: "Private owner area." },
    ],
  }),
  component: OwnerLogin,
});

type Mode = "signin" | "setup" | "forgot";

function OwnerLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate({ to: "/owner" });
      } else if (mode === "setup") {
        if (password.length < 10) throw new Error("Use at least 10 characters.");
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/owner/login` },
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: "Check your inbox and click the confirmation link, then sign in here." });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: "If that account exists, a reset link is on its way." });
      }
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60";
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold">
        {mode === "signin" ? "Owner sign in" : mode === "setup" ? "Set your owner password" : "Reset password"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "setup"
          ? "First time only: use the owner email address and choose a password. You'll confirm by email."
          : "Private area for the site owner."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input className={input} type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {mode !== "forgot" && (
          <input className={input} type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "setup" ? "new-password" : "current-password"} />
        )}
        <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "setup" ? "Create owner password" : "Send reset link"}
        </button>
      </form>
      {msg && (
        <p role={msg.kind === "err" ? "alert" : "status"} className={`mt-4 text-sm ${msg.kind === "err" ? "text-destructive" : "text-primary"}`}>
          {msg.text}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
        {mode !== "signin" && <button className="text-left hover:text-primary" onClick={() => setMode("signin")}>Back to sign in</button>}
        {mode !== "setup" && <button className="text-left hover:text-primary" onClick={() => setMode("setup")}>First time? Set your owner password</button>}
        {mode !== "forgot" && <button className="text-left hover:text-primary" onClick={() => setMode("forgot")}>Forgot password?</button>}
      </div>
    </main>
  );
}
