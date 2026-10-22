import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const COOKIE_KEY = "voltedge-cookie-choice";

/**
 * Privacy notice required before non-essential cookies (e.g. future
 * advertising) are set. Dismissal persists locally. Rendered only after
 * mount so SSR output stays stable.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_KEY)) setVisible(true);
    } catch {
      // storage unavailable — just don't show the banner
    }
  }, []);

  const choose = (choice: "accepted" | "essential") => {
    try {
      localStorage.setItem(COOKIE_KEY, choice);
    } catch {
      // ignore write failures
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie and privacy notice"
      className="fixed inset-x-0 bottom-0 z-50 p-4 animate-fade-up"
    >
      <div className="glass mx-auto flex max-w-3xl flex-col gap-3 rounded-xl border border-border p-4 shadow-2xl sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          We use essential cookies only. Advertising or analytics cookies would
          only ever load after your consent and once configured. See our{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => choose("essential")}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Essential only
          </button>
          <button
            onClick={() => choose("accepted")}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
