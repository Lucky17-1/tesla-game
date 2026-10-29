/** User-selected start point. The driving circuit and Google imagery stay independent. */
export const STREET_START = {
  position: { lat: 25.4290781, lng: 81.9138727 },
  pano: "LQiadkCkvnZ9-7CjwRK4IQ",
  pov: { heading: 90.42963437957803, pitch: 14.849397644948823 },
} as const;

export const GOOGLE_MAPS_LINK = "https://www.google.com/maps/@?api=1&map_action=pano&pano=" + STREET_START.pano;

/** Never issue sandbox or credential-bearing-preview Maps requests. */
export function canRenderGoogleMaps(hostname: string) {
  return hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.endsWith(".localhost") && !hostname.includes("-devserver-");
}