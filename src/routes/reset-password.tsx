import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/config/site";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Choose a new password — ${SITE.name}` },
      { name: "description", content: "Set a new password for your VoltEdge owner account." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Reset password — ${SITE.name}` },
      { property: "og:description", content: "Set a new password." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 10) return setMsg("Use at least 10 characters.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setMsg(error.message);
    navigate({ to: "/owner" });
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="New password (10+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-input bg-card px-4 py-2.5 text-sm"
        />
        <button className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground">Save password</button>
      </form>
      {msg && <p role="alert" className="mt-4 text-sm text-destructive">{msg}</p>}
    </main>
  );
}
