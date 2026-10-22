import { Canvas } from "@react-three/fiber";
import { Component, useEffect, useState, type ReactNode } from "react";
import { Scene } from "./Scene";
import { useGameStore } from "@/game/store";
import { touchInput } from "@/game/input";
import { audio } from "@/game/audio";

class GameErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? <Fallback text="The game hit an error. Please reload the page." /> : this.props.children;
  }
}

function Fallback({ text }: { text: string }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
      {text}
    </div>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function GameCanvas() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [cockpit, setCockpit] = useState(false);
  const [muted, setMuted] = useState(false);
  const { state, score, distance, speedKmh, best, newRecord, start, pause, resume } = useGameStore();

  useEffect(() => {
    setWebgl(hasWebGL());
    setMuted(audio.isMuted);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGameStore.getState();
      if (e.code === "KeyC") setCockpit((c) => !c);
      if (e.code === "Escape" || e.code === "KeyP") {
        if (s.state === "playing") s.pause();
        else if (s.state === "paused") s.resume();
      }
      if ((e.code === "Enter" || e.code === "Space") && (s.state === "menu" || s.state === "gameover")) {
        e.preventDefault();
        begin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pause when tab is hidden
  useEffect(() => {
    const onVis = () => document.hidden && useGameStore.getState().pause();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  function begin() {
    audio.init();
    audio.playUi();
    useGameStore.getState().start();
  }

  if (webgl === false) return <Fallback text="Your browser or device doesn't support WebGL, which the game needs." />;
  if (webgl === null) return <Fallback text="Loading VoltEdge Circuit…" />;

  const hold = (key: keyof typeof touchInput) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      touchInput[key] = true;
    },
    onPointerUp: () => (touchInput[key] = false),
    onPointerLeave: () => (touchInput[key] = false),
    onPointerCancel: () => (touchInput[key] = false),
  });

  return (
    <GameErrorBoundary>
      <div className="relative aspect-[4/5] w-full select-none overflow-hidden rounded-xl border border-border bg-card sm:aspect-video" style={{ touchAction: "none" }}>
        <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, 3.4, 8.5], fov: 62, near: 0.1, far: 400 }}>
          <color attach="background" args={["#a9c7de"]} />
          <fog attach="fog" args={["#a9c7de", 40, 170]} />
          <hemisphereLight args={["#dfefff", "#3d5a34", 0.9]} />
          <directionalLight position={[8, 14, 6]} intensity={1.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <Scene cockpit={cockpit} />
        </Canvas>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 font-display text-sm sm:text-base">
          <div className="rounded-lg bg-background/70 px-3 py-2 backdrop-blur">
            <div className="text-xs text-muted-foreground">SCORE</div>
            <div className="text-xl font-bold text-foreground" data-testid="hud-score">{score}</div>
            <div className="text-xs text-muted-foreground">Best {best}</div>
          </div>
          <div className="rounded-lg bg-background/70 px-3 py-2 text-right backdrop-blur">
            <div className="text-xl font-bold text-primary">{speedKmh} <span className="text-xs">km/h</span></div>
            <div className="text-xs text-muted-foreground">{(distance / 1000).toFixed(2)} km</div>
          </div>
        </div>
        <div className="absolute right-3 top-24 flex flex-col gap-2">
          <button
            className="rounded-md bg-background/70 px-2 py-1 text-xs text-foreground backdrop-blur"
            onClick={() => setMuted(audio.toggleMute())}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
          <button className="rounded-md bg-background/70 px-2 py-1 text-xs text-foreground backdrop-blur" onClick={() => setCockpit((c) => !c)}>
            {cockpit ? "Chase view" : "Cockpit (C)"}
          </button>
          {state === "playing" && (
            <button className="rounded-md bg-background/70 px-2 py-1 text-xs text-foreground backdrop-blur" onClick={pause}>
              Pause
            </button>
          )}
        </div>

        {/* Touch controls */}
        {state === "playing" && (
          <>
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button aria-label="Steer left" className="h-16 w-16 rounded-full bg-background/60 text-2xl text-foreground backdrop-blur active:bg-primary/60" {...hold("left")}>◀</button>
              <button aria-label="Steer right" className="h-16 w-16 rounded-full bg-background/60 text-2xl text-foreground backdrop-blur active:bg-primary/60" {...hold("right")}>▶</button>
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button aria-label="Brake" className="h-16 w-16 rounded-full bg-background/60 text-sm font-bold text-foreground backdrop-blur active:bg-primary/60" {...hold("brake")}>BRK</button>
              <button aria-label="Accelerate" className="h-16 w-16 rounded-full bg-primary/70 text-sm font-bold text-primary-foreground backdrop-blur active:bg-primary" {...hold("accel")}>GO</button>
            </div>
          </>
        )}

        {/* Screens */}
        {state !== "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/55 p-4 backdrop-blur-sm">
            <div className="max-w-sm rounded-xl border border-border bg-card/95 p-6 text-center">
              {state === "loading" && <p className="text-muted-foreground">Loading…</p>}
              {state === "menu" && (
                <>
                  <h2 className="font-display text-2xl font-bold">VoltEdge Circuit</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Dodge traffic, grab energy cells (+100), skim past cars for near-miss bonuses (+25).</p>
                  <button onClick={begin} className="mt-5 rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground">Start race</button>
                  <p className="mt-3 text-xs text-muted-foreground">Enter to start · C for cockpit · Esc to pause</p>
                </>
              )}
              {state === "paused" && (
                <>
                  <h2 className="font-display text-2xl font-bold">Paused</h2>
                  <div className="mt-5 flex justify-center gap-3">
                    <button onClick={resume} className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground">Resume</button>
                    <button onClick={begin} className="rounded-lg border border-border px-5 py-2.5 font-semibold">Restart</button>
                  </div>
                </>
              )}
              {state === "gameover" && (
                <>
                  <h2 className="font-display text-2xl font-bold">Crashed!</h2>
                  <p className="mt-2 text-3xl font-bold text-primary" data-testid="final-score">{score}</p>
                  <p className="text-sm text-muted-foreground">{newRecord ? "New personal best!" : `Best: ${best}`}</p>
                  <button onClick={begin} className="mt-5 rounded-lg bg-primary px-6 py-3 font-display font-semibold text-primary-foreground">Race again</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </GameErrorBoundary>
  );
}
