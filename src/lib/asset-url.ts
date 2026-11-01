/**
 * Uploaded assets are served from the Lovable host. The custom domain is
 * hosted elsewhere (Vercel) and returns 404 for /__l5e paths, so always
 * resolve them against the stable Lovable project address (CORS: *).
 */
const ASSET_ORIGIN = "https://project--4a85dbca-fdfe-4838-9c37-c8f7c1c5ea44.lovable.app";
export function assetUrl(url: string) {
  return url.startsWith("/__l5e/") ? ASSET_ORIGIN + url : url;
}
