/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MapPin, Navigation, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canRenderGoogleMaps, GOOGLE_MAPS_LINK, STREET_START } from "@/game/simulator-location";

declare global { interface Window { deshmukhMapsReady?: () => void } }
let mapsLoading: Promise<void> | undefined;
function loadMaps() {
  if (typeof google !== "undefined" && google.maps?.StreetViewPanorama) return Promise.resolve();
  if (mapsLoading) return mapsLoading;
  mapsLoading = new Promise<void>((resolve, reject) => {
    const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
    if (!key) { reject(new Error("Google Maps is not connected.")); return; }
    const timeout = setTimeout(() => { script.remove(); reject(new Error("Google Maps loading timed out. Try again.")); }, 20000);
    window.deshmukhMapsReady = () => { clearTimeout(timeout); resolve(); };
    const script = document.createElement("script");
    const channel = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'] || "gmp_lovable_agentskills_v1";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=deshmukhMapsReady&channel=${encodeURIComponent(channel)}&language=en&region=IN`;
    script.async = true;
    script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error("Google Maps could not load. Check your connection.")); };
    document.head.appendChild(script);
  });
  mapsLoading = mapsLoading.catch((error: unknown) => { mapsLoading = undefined; throw error; });
  return mapsLoading;
}

/** Separate, unmodified Google Maps view; no game car or HUD covers imagery/attribution. */
export function SimulatorMaps({ view }: { view: "street" | "map" }) {
  const host = useRef<HTMLDivElement>(null);
  const panorama = useRef<google.maps.StreetViewPanorama | null>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState("Loading Google Maps…");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!canRenderGoogleMaps(window.location.hostname)) { setStatus("Google Maps is available on your published Lovable address."); return; }
    let active = true;
    let instance: google.maps.StreetViewPanorama | google.maps.Map | undefined;
    let marker: google.maps.Marker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setStatus("Loading Google Maps…");
    void loadMaps().then(() => {
      if (!active || !host.current) return;
      timer = setTimeout(() => { if (active) setStatus("Google Maps has not loaded. Check connection or website authorization."); }, 20000);
      if (view === "street") {
        // Source: Google Maps Platform Code Assist
        const options: google.maps.StreetViewPanoramaOptions & { internalUsageAttributionIds: string[] } = {
          pano: STREET_START.pano, pov: STREET_START.pov, visible: true,
          motionTracking: false, motionTrackingControl: true, fullscreenControl: true,
          addressControl: true, linksControl: true, panControl: true, zoomControl: true,
          enableCloseButton: false, internalUsageAttributionIds: ["gmp_lovable_agentskills_v1"],
        };
        const p = new google.maps.StreetViewPanorama(host.current, options);
        instance = p; panorama.current = p;
        const inspectStatus = () => {
          if (!active) return;
          const s = p.getStatus();
          if (s === google.maps.StreetViewStatus.OK) { setStatus(""); if (timer) clearTimeout(timer); }
          else if (s === google.maps.StreetViewStatus.ZERO_RESULTS) setStatus("This saved panorama is unavailable. Try the start location.");
          else if (s === google.maps.StreetViewStatus.UNKNOWN_ERROR) setStatus("Street View could not load. Try again or open Google Maps.");
        };
        p.addListener("status_changed", inspectStatus);
        inspectStatus();
      } else {
        // Source: Google Maps Platform Code Assist
        const m = new google.maps.Map(host.current, {
          center: STREET_START.position, zoom: 17, clickableIcons: false,
          streetViewControl: false, mapTypeControl: true, fullscreenControl: true,
          gestureHandling: "greedy", internalUsageAttributionIds: ["gmp_lovable_agentskills_v1"],
        });
        instance = m; map.current = m;
        marker = new google.maps.Marker({ map: m, position: STREET_START.position, title: "Deshmukh start location" });
        m.addListener("tilesloaded", () => { if (active) { setStatus(""); if (timer) clearTimeout(timer); } });
      }
    }).catch((error: unknown) => { if (active) setStatus(error instanceof Error ? error.message : "Google Maps could not load."); });
    return () => {
      active = false; if (timer) clearTimeout(timer);
      if (instance) google.maps.event.clearInstanceListeners(instance);
      marker?.setMap(null);
      panorama.current?.setVisible(false); panorama.current = null; map.current = null;
    };
  }, [view, attempt]);
  function reset() {
    if (panorama.current) { panorama.current.setPano(STREET_START.pano); panorama.current.setPov(STREET_START.pov); }
    if (map.current) { map.current.setCenter(STREET_START.position); map.current.setZoom(17); }
  }
  return <section className="sim-maps" aria-label={view === "street" ? "Google Street View" : "Google Maps"}>
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-2 sm:px-5">
      <div className="min-w-0"><h2 className="flex items-center gap-2 font-display text-base font-bold"><MapPin className="size-4 text-primary" />{view === "street" ? "Street View · 360°" : "Start location"}</h2><p className="text-xs text-muted-foreground">25.4290781, 81.9138727 · Google Maps</p></div>
      <div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Reset map view" title="Reset view" onClick={reset}><RotateCcw /></Button><Button asChild variant="outline" size="sm"><a href={GOOGLE_MAPS_LINK} target="_blank" rel="noreferrer">Google Maps<ArrowUpRight className="size-4" /></a></Button></div>
    </header>
    <div ref={host} className="sim-map-host" />
    {status && <div className="sim-map-status" role="status"><MapPin className="size-8 text-primary" /><p className="max-w-md text-center text-sm">{status}</p><div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}><RotateCcw />Retry</Button>{view === "street" && <Button variant="outline" size="sm" onClick={() => { panorama.current?.setPosition(STREET_START.position); }}><Navigation />Start location</Button>}</div></div>}
  </section>;
}