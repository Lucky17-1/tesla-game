import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, Sky } from "@react-three/drei";
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { CarFront, Armchair, DoorOpen, Maximize, Minimize, Play, Square, Volume2, VolumeX, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DriveRoad, PersonalizedCar, useVehiclePalette } from "./PersonalizedCar";
import { ViewerAudio } from "@/lib/viewer-audio";
import cockpit from "@/assets/deshmukh-cockpit-frame.png";
import rearSeats from "@/assets/tesla-rear-seats.png.asset.json";

type View = "exterior" | "interior" | "rear";
const VIDEO_ID = "hxMNYkLN7tI";

class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <div role="alert" className="flex h-full items-center justify-center bg-muted text-muted-foreground">3D view is unavailable on this device.</div> : this.props.children; }
}

function ViewerScene({ interior, running, doorsOpen }: { interior: boolean; running: boolean; doorsOpen: boolean }) {
  const colors = useVehiclePalette();
  useFrame(({ camera }) => { if (interior) camera.lookAt(0, 0.65, -60); });
  return <>
    <color attach="background" args={[colors.sky]} />
    <fog attach="fog" args={[colors.sky, 42, 100]} />
    <ambientLight intensity={0.7} />
    <directionalLight position={[-4, 12, -7]} intensity={2.4} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
    <Sky sunPosition={[70, 35, -90]} turbidity={2} rayleigh={0.6} />
    <Environment resolution={128}>
      <Lightformer intensity={3} position={[0, 6, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
      <Lightformer intensity={2} position={[-6, 3, -3]} scale={[6, 4, 1]} rotation-y={Math.PI / 2} />
    </Environment>
    <DriveRoad running={running} />
    {!interior && <Suspense fallback={null}><PersonalizedCar running={running} doorsOpen={doorsOpen} /></Suspense>}
    {!interior && <OrbitControls target={[0, 0.95, 0]} enablePan={false} minDistance={5.4} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />}
  </>;
}

export default function CarViewer() {
  const [view, setView] = useState<View>("exterior");
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [audioError, setAudioError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const sound = useRef<ViewerAudio | null>(null);
  useEffect(() => {
    sound.current = new ViewerAudio();
    return () => { sound.current?.dispose(); };
  }, []);
  useEffect(() => {
    const listener = () => setExpanded(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", listener);
    return () => document.removeEventListener("fullscreenchange", listener);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setVideoOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  async function toggleDrive() {
    setAudioError("");
    if (running) { sound.current?.stop(); setRunning(false); return; }
    setDoorsOpen(false); setRunning(true);
    try { await sound.current?.start(muted); }
    catch { setAudioError("Sound is unavailable on this device."); }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await container.current?.requestFullscreen();
    } catch { setExpanded((value) => !value); }
  }
  function selectView(next: View) { setVideoOpen(false); setView(next); }
  return <div ref={container} className={`vehicle-viewer bg-background ${expanded ? "vehicle-expanded" : ""}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <div className="flex gap-1" role="group" aria-label="Car view">
        <Button size="sm" variant={view === "exterior" ? "default" : "ghost"} onClick={() => selectView("exterior")} aria-pressed={view === "exterior"}><CarFront />Exterior</Button>
        <Button size="sm" variant={view === "interior" ? "default" : "ghost"} onClick={() => selectView("interior")} aria-pressed={view === "interior"}><Armchair />Interior</Button>
        <Button size="sm" variant={view === "rear" ? "default" : "ghost"} onClick={() => selectView("rear")} aria-pressed={view === "rear"}>Rear seats</Button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" aria-label={muted ? "Unmute car sound" : "Mute car sound"} title={muted ? "Unmute car sound" : "Mute car sound"} onClick={() => { sound.current?.mute(!muted); setMuted(!muted); }}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        <Button size="icon" variant="ghost" onClick={fullscreen} aria-label={expanded ? "Exit full screen" : "Full screen car"} title="Full screen">{expanded ? <Minimize /> : <Maximize />}</Button>
        <Button size="sm" onClick={toggleDrive}>{running ? <Square /> : <Play />}{running ? "Stop" : "Start"}</Button>
      </div>
    </div>
    <div className="vehicle-stage relative overflow-hidden" data-driving={running}>
      {view !== "rear" && <ViewerBoundary><Canvas key={`${view}-${cameraKey}`} shadows dpr={[1, 1.5]} camera={view === "interior" ? { position: [0, 1.6, 1], fov: 66 } : { position: [6.4, 3.1, -7.2], fov: 39 }} onCreated={({ camera }) => { if (view === "interior") camera.lookAt(0, 1.2, -60); }}>
        <ViewerScene interior={view === "interior"} running={running} doorsOpen={doorsOpen} />
      </Canvas></ViewerBoundary>}
      {view === "rear" && <img src={rearSeats.url} alt="Tesla white leather rear seats and center armrest" className="absolute inset-0 h-full w-full object-cover" />}
      {view === "interior" && <>
        <img src={cockpit} alt="Deshmukh in the Tesla-style driver seat, one hand on the steering wheel and the other reaching for the screen" className="pointer-events-none absolute inset-0 h-full w-full object-fill" />
        <Button onClick={() => setVideoOpen(true)} aria-label="Play Aaj Ki Raat on car screen" title="Aaj Ki Raat" className="vehicle-screen absolute flex flex-col gap-1 bg-vehicle-screen text-vehicle-light hover:bg-vehicle-screen">
          <Play className="size-5 sm:size-8" /><span className="hidden text-[10px] sm:block">Aaj Ki Raat</span>
        </Button>
      </>}
      {view === "exterior" && <div className="absolute bottom-4 left-4 flex gap-2 sm:bottom-6 sm:left-6">
        <Button variant="secondary" size="sm" disabled={running} onClick={() => setDoorsOpen(!doorsOpen)} aria-pressed={doorsOpen}><DoorOpen />{doorsOpen ? "Close doors" : "Open doors"}</Button>
        <Button variant="secondary" size="icon" onClick={() => setCameraKey((value) => value + 1)} aria-label="Reset car view" title="Reset view"><RotateCcw /></Button>
      </div>}
      <div className="pointer-events-none absolute bottom-4 right-4 text-right sm:bottom-6 sm:right-6">
        <p className="font-display text-sm font-bold text-vehicle-trim">DESHMUKH</p>
        <p role="status" className="text-xs font-semibold text-vehicle-trim">{running ? "Drive · 50 km/h" : "Parked"}</p>
      </div>
    </div>
    {audioError && <p role="alert" className="px-4 py-2 text-sm text-destructive">{audioError}</p>}
    {videoOpen && <div role="dialog" aria-modal="true" aria-label="Aaj Ki Raat video" className="absolute inset-0 z-30 flex flex-col bg-vehicle-screen text-vehicle-light">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-display text-sm font-semibold">Aaj Ki Raat — Full Song</span>
        <div className="flex gap-2"><Button size="icon" variant="secondary" onClick={fullscreen} aria-label="Full screen video" title="Full screen video"><Maximize /></Button><Button size="icon" variant="secondary" onClick={() => setVideoOpen(false)} aria-label="Close video" title="Close video"><X /></Button></div>
      </div>
      <iframe title="Aaj Ki Raat official full song" src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=0&playsinline=1&rel=0`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="min-h-0 w-full flex-1 border-0" />
      <a href={`https://www.youtube.com/watch?v=${VIDEO_ID}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-center text-xs text-vehicle-light underline">Watch on YouTube</a>
    </div>}
  </div>;
}
