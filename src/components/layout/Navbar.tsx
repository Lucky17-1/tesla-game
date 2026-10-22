import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { SITE } from "@/config/site";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/cars", label: "Cars" },
  { to: "/news", label: "News" },
  { to: "/game", label: "Game" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

function isActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 glass border-b border-border">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"
      >
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span
            aria-hidden
            className="inline-block h-6 w-1.5 rounded-full bg-primary animate-pulse-glow"
          />
          <span className="font-display text-lg font-bold tracking-widest uppercase">
            {SITE.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground ${
                  isActive(pathname, link.to)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/game"
              className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_24px_-4px_var(--primary)]"
            >
              Play now
            </Link>
          </li>
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile panel */}
      {open && (
        <div id="mobile-nav" className="border-t border-border bg-background md:hidden">
          <ul className="space-y-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2.5 text-base font-medium ${
                    isActive(pathname, link.to)
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
