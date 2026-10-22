import { useEffect, useRef } from "react";
import { SITE } from "@/config/site";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Reserved advertising slot. Renders NOTHING until a real AdSense publisher
 * ID is configured in src/config/site.ts — no fake ads, no placeholder
 * "Advertisement" chrome, no fabricated earnings.
 *
 * Once configured: load the AdSense script once per page, then push each
 * slot. Placement rules: never near game controls, no interstitials.
 */
export function AdSlot({
  slotId,
  format = "auto",
  className = "",
  label = "Advertisement",
}: {
  slotId: string;
  format?: string;
  className?: string;
  label?: string;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!SITE.adsenseClient || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script blocked or failed — leave the slot empty.
    }
  }, []);

  if (!SITE.adsenseClient) return null;

  return (
    <aside aria-label={label} className={className}>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={SITE.adsenseClient}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
