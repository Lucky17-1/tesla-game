import { Canvas } from "@react-three/fiber";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SimulatorScene } from "./SimulatorScene";
import { SimulatorHUD } from "./SimulatorHUD";
import { MusicPanel } from "./SimulatorMusic";
import { getSimulatorTheme, type SimulatorTheme } from "@/game/simulator-theme";
import { clearDriveInput, useSimulator } from "@/game/simulator-store";
import { audio } from "@/game/audio";
import { CarFront, Map, MapPin, RotateCcw } from "lucide-react";
import { SimulatorMaps } from "./SimulatorMaps";
import { adjustCameraLook, cameraLook, isInteriorCamera, resetCameraLook } from "@/game/simulator-vehicles";

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <div className="flex min-h-96 flex-col items-center justify-center gap-4 bg-background p-6 text-center"><p>The driving scene could not load.</p><Button onClick={() => window.location.reload()}>Reload game</Button></div> : this.props.children; }
}

export function DrivingSimulator() {
  const wrapper = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<SimulatorTheme | null>(null);
  const [webgl, setWebgl] = useState(true); const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false); const [fallbackFull, setFallbackFull] = useState(false);
  const [muted, setMuted] = useState(false); const [musicMuted, setMusicMuted] = useState(false); const [music, setMusic] = useState(false); const [musicPanel, setMusicPanel] = useState(false);
  const [view, setView] = useState<"drive" | "street" | "map">("drive");
  const dragging = useRef<{ id: number; x: number; y: number } | null>(null);
  const state = useSimulator((s) => s.state);
  const vehicle = useSimulator((s) => s.vehicle);
  const camera = useSimulator((s) => s.camera);
  useEffect(() => {
    setTheme(getSimulatorTheme()); setMuted(audio.isMuted);
    try { const canvas = document.createElement("canvas"); const ctx = canvas.getContext("webgl2"); setWebgl(Boolean(ctx)); ctx?.getExtension("WEBGL_lose_context")?.loseContext(); } catch { setWebgl(false); }
    try { const best = Number(localStorage.getItem("deshmukh-drift-best")); if (Number.isFinite(best) && best > 0) useSimulator.setState({ best }); } catch { /* storage optional */ }
    const full = () => setExpanded(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", full);
    const hidden = () => { if (document.hidden) { clearDriveInput(); useSimulator.getState().pause(); } };
    document.addEventListener("visibilitychange", hidden);
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement || e.repeat) return;
      const sim = useSimulator.getState();
      if (e.code === "KeyC") sim.nextCamera();
      if (e.code === "Escape" || e.code === "KeyP") { if (sim.state === "driving") sim.pause(); else if (sim.state === "paused") sim.resume(); if (e.code === "Escape") setFallbackFull(false); }
      if (e.code === "Enter" && sim.state === "ready" && wrapper.current?.hasAttribute("data-scene-ready")) begin();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("fullscreenchange", full); document.removeEventListener("visibilitychange", hidden); window.removeEventListener("keydown", onKey); clearDriveInput(); };
  }, []);
  useEffect(() => { if (state === "driving") audio.startEngine(); else { audio.stopEngine(); clearDriveInput(); } }, [state]);
  useEffect(() => { setReady(false); wrapper.current?.removeAttribute("data-scene-ready"); }, [vehicle]);
  useEffect(() => { if (!fallbackFull) return; const old = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = old; }; }, [fallbackFull]);
  function begin() { audio.init(); audio.playUi(); setMusic(true); useSimulator.getState().start(); }
  async function fullscreen() {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    if (fallbackFull) { setFallbackFull(false); return; }
    try { if (!wrapper.current?.requestFullscreen) throw new Error("Unavailable"); await wrapper.current.requestFullscreen(); } catch { setFallbackFull(true); }
  }
  function changeView(next: typeof view) {
    clearDriveInput(); useSimulator.getState().pause(); setMusicPanel(false); setView(next);
  }
  const canLook = isInteriorCamera(camera) || camera === "Orbit 360";
  if (!webgl) return <div className="flex min-h-96 items-center justify-center p-6 text-center text-muted-foreground">This device does not support the 3D driving scene. Open it in a WebGL-enabled browser.</div>;
  return <SceneBoundary><div ref={wrapper} className={`simulator ${fallbackFull ? "sim-expanded" : ""}`}>
    <nav aria-label="Simulator views" className="sim-view-tabs">
      <div className="flex min-w-0 gap-1">{([{ id: "drive", label: "Driving", icon: CarFront }, { id: "street", label: "Street View", icon: MapPin }, { id: "map", label: "Map", icon: Map }] as const).map((item) => <Button key={item.id} size="sm" variant={view === item.id ? "secondary" : "ghost"} aria-pressed={view === item.id} onClick={() => changeView(item.id)} className="px-2 text-xs sm:px-3"><item.icon className="size-4" />{item.label}</Button>)}</div>
      {view === "drive" && canLook && <Button variant="ghost" size="icon" aria-label="Reset camera look" title="Reset camera look" onClick={resetCameraLook}><RotateCcw /></Button>}
    </nav>
    <div className={`sim-driving-view ${view === "drive" ? "" : "sim-view-hidden"}`} aria-hidden={view !== "drive"}
      onPointerDown={(e) => { if (!canLook || !(e.target instanceof HTMLCanvasElement) || dragging.current) return; e.currentTarget.setPointerCapture(e.pointerId); dragging.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { const p = dragging.current; if (!p || p.id !== e.pointerId) return; adjustCameraLook(e.clientX - p.x, e.clientY - p.y); p.x = e.clientX; p.y = e.clientY; }}
      onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }} onLostPointerCapture={() => { dragging.current = null; }}
      onWheel={(e) => { if (camera === "Orbit 360" && e.target instanceof HTMLCanvasElement) cameraLook.distance = Math.max(4, Math.min(16, cameraLook.distance + e.deltaY * 0.008)); }}>
    {theme && <Canvas shadows dpr={[1, 1.25]} frameloop={view === "drive" ? "always" : "never"} camera={{ position: [3, 3.5, 8], fov: 60, near: 0.07, far: 900 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <SimulatorScene theme={theme} music={music} muted={muted || musicMuted} active={view === "drive"} onReady={() => setReady(true)} />
    </Canvas>}
    <SimulatorHUD ready={ready} expanded={expanded || fallbackFull} onFullscreen={() => { void fullscreen(); }} onStart={begin} muted={muted} onMute={() => setMuted(audio.toggleMute())} onMusic={() => { setMusicPanel((v) => !v); useSimulator.getState().setCamera("Cabin"); }} />
    {musicPanel && <MusicPanel onClose={() => setMusicPanel(false)} muted={musicMuted} onMute={() => setMusicMuted((v) => !v)} />}
    </div>
    {view !== "drive" && <SimulatorMaps key={view} view={view} />}
  </div></SceneBoundary>;
}