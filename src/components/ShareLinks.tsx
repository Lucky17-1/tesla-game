import { useState } from "react";

/**
 * Share buttons built at click time from the current URL — no SSR
 * dependence, no fabricated counters.
 */
export function ShareLinks({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const build = (base: string, params: Record<string, string>) => {
    const url = window.location.href;
    const query = new URLSearchParams({ url, ...params }).toString();
    return `${base}?${query}`;
  };

  const actions = [
    { label: "Share on X", href: () => build("https://twitter.com/intent/tweet", { text: title }) },
    { label: "Share on Facebook", href: () => build("https://www.facebook.com/sharer/sharer.php", {}) },
    { label: "Share on LinkedIn", href: () => build("https://www.linkedin.com/sharing/share-offsite", {}) },
    { label: "Share by email", href: () => build("mailto:", { subject: title }) },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Share:</span>
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          aria-label={a.label}
          onClick={() => window.open(a.href(), "_blank", "noopener,noreferrer")}
          className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          {a.label.replace("Share on ", "").replace("Share by ", "")}
        </button>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy article link"
        className="rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
