/**
 * Site-wide configuration. Values here are the single source of truth for
 * branding, contact and advertising configuration.
 */
export const SITE = {
  name: "VoltEdge",
  tagline: "Electric performance, decoded.",
  description:
    "VoltEdge is an independent, unofficial site about electric performance cars — original news, guides and reviews, plus a free browser racing game.",
  /**
   * Where the contact form sends composed mail. Replace with your real
   * address before launch — this placeholder is NOT a working inbox.
   */
  contactEmail: "hello@voltedge.example",
  /**
   * Google AdSense publisher ID, e.g. "ca-pub-1234567890123456".
   * Leave empty until you have been approved and configured real ad units.
   * While empty, ad slots render nothing anywhere on the site.
   */
  adsenseClient: "",
  /**
   * Absolute site URL once you publish on a custom domain
   * (e.g. "https://voltedge.com"). Used for the sitemap and canonical
   * links. Leave empty before you have a real domain.
   */
  url: "",
} as const;
