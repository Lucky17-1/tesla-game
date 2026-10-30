import { ArrowLeft, ArrowRight, Camera, Expand, Gauge, Hand, ListMusic, Pause, Play, RotateCcw, Shrink, Volume2, VolumeX, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAMERA_VIEWS, driveInput, useSimulator } from "@/game/simulator-store";
import { VEHICLES } from "@/game/simulator-vehicles";

export function SimulatorHUD({ ready, expanded, onFullscreen, onStart, muted, onMute, onMusic }: { ready: boolean; expanded: boolean; onFullscreen: () => void; onStart: () => void; muted: boolean; onMute: () => void; onMusic: () => void }) {
  const sim = useSimulator();
  const hold = (key: keyof typeof driveInput) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); driveInput[key] = true; },
    onPointerUp: () => { driveInput[key] = false; }, onPointerCancel: () => { driveInput[key] = false; }, onLostPointerCapture: () => { driveInput[key] = false; },
  });
  return <div className="pointer-events-none absolute inset-0 z-30 text-foreground">
    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
      <div className="sim-hud rounded-md px-3 py-2">
        <h1 className="font-display text-lg font-bold sm:text-xl">DESHMUKH <span className="text-primary">DRIVE</span></h1>
        <div className="mt-1 flex gap-3 text-[10px] font-semibold uppercase text-muted-foreground"><span>Alpine circuit</span><span>{sim.mode}</span></div>
      </div>
      <div className="sim-hud pointer-events-auto flex gap-1 rounded-md p-1">
        <Button variant="ghost" size="icon" aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"} onClick={onMute}>{muted ? <VolumeX /> : <Volume2 />}</Button>
        <Button variant="ghost" size="icon" aria-label="Cabin YouTube" title="Cabin YouTube" onClick={onMusic}><ListMusic /></Button>
        <Button variant="ghost" size="icon" aria-label={expanded ? "Exit fullscreen" : "Fullscreen"} title={expanded ? "Exit fullscreen" : "Fullscreen"} onClick={onFullscreen}>{expanded ? <Shrink /> : <Expand />}</Button>
        {sim.state === "driving" && <Button variant="ghost" size="icon" aria-label="Pause driving" title="Pause" onClick={sim.pause}><Pause /></Button>}
      </div>
    </div>
    <div className="sim-hud sim-camera-bar pointer-events-auto absolute left-3 right-3 top-24 flex w-fit max-w-[calc(100%-24px)] items-center gap-1 overflow-x-auto rounded-md p-1 sm:left-5 sm:top-24">
      <Camera className="mx-2 hidden size-4 shrink-0 sm:block" />
      {CAMERA_VIEWS.map((camera) => <Button key={camera} size="sm" variant={sim.camera === camera ? "secondary" : "ghost"} aria-pressed={sim.camera === camera} onClick={() => sim.setCamera(camera)} className="shrink-0 px-2 text-xs sm:px-3">{camera}</Button>)}
    </div>
    <div className="sim-hud pointer-events-auto absolute left-3 top-36 flex gap-1 rounded-md p-1 sm:left-5" aria-label="Choose vehicle">
      {VEHICLES.map((vehicle) => <Button key={vehicle.id} size="sm" variant={sim.vehicle === vehicle.id ? "secondary" : "ghost"} aria-pressed={sim.vehicle === vehicle.id} title={vehicle.category} onClick={() => sim.setVehicle(vehicle.id)} className="px-2 text-xs">{vehicle.name}</Button>)}
    </div>
    {sim.state !== "ready" && <div className="sim-hud absolute right-3 top-52 min-w-24 rounded-md px-3 py-2 text-right sm:right-5">
      <div className="font-display text-4xl font-bold tabular-nums" data-testid="sim-speed">{sim.speed}</div><div className="text-[10px] uppercase text-muted-foreground">km/h</div>
      <div className="mt-3 border-t border-border pt-2 font-display text-sm tabular-nums">{(sim.distance / 1000).toFixed(2)} <span className="text-muted-foreground">km</span></div>
      {sim.mode === "Drift" && <div className="mt-2 font-display text-primary" data-testid="drift-score">{sim.driftScore} <span className="text-xs">DRIFT</span></div>}
      {sim.offroad && <div className="mt-2 text-[10px] text-primary">OFF ROAD</div>}{sim.impact && <div className="mt-2 text-xs text-primary">IMPACT</div>}
    </div>}
    {sim.state !== "driving" && <div className="absolute inset-x-4 bottom-24 flex flex-col items-center sm:bottom-32">
      <div className="sim-hud pointer-events-auto flex max-w-full flex-col items-center gap-4 rounded-lg p-5 sm:p-6">
        {sim.state === "ready" ? <>
          <h2 className="font-display text-2xl font-bold">{ready ? "Ready to drive" : "Preparing your car…"}</h2>
          <div className="flex gap-1 rounded-md bg-secondary p-1">{(["Touring", "Drift"] as const).map((mode) => <Button key={mode} variant={sim.mode === mode ? "default" : "ghost"} onClick={() => sim.setMode(mode)}><Gauge className="size-4" />{mode}</Button>)}</div>
          <Button size="lg" onClick={onStart} disabled={!ready}><Play className="size-4" />Start driving</Button>
        </> : <>
          <h2 className="font-display text-2xl font-bold">Drive paused</h2>
          <div className="flex gap-3"><Button onClick={sim.resume}><Play />Resume</Button><Button variant="secondary" onClick={sim.restart}><RotateCcw />Restart</Button></div>
          <div className="text-xs text-muted-foreground">Best drift {sim.best}</div>
        </>}
      </div>
    </div>}
    {sim.state === "driving" && <div className="pointer-events-auto absolute inset-x-3 bottom-4 flex items-end justify-between gap-2 sm:inset-x-5 sm:bottom-5">
      <div className="flex gap-2"><Button className="sim-touch sim-hud" variant="secondary" aria-label="Steer left" title="Steer left" {...hold("left")}><ArrowLeft className="size-6" /></Button><Button className="sim-touch sim-hud" variant="secondary" aria-label="Steer right" title="Steer right" {...hold("right")}><ArrowRight className="size-6" /></Button></div>
      <div className="flex gap-2"><Button className="sim-touch sim-hud" variant="secondary" aria-label="Handbrake" title="Handbrake" {...hold("handbrake")}><Hand className="size-5" /></Button><Button className="sim-touch sim-hud" variant="secondary" aria-label="Brake" title="Brake" {...hold("brake")}><Pause className="size-6" /></Button><Button className="sim-touch" aria-label="Accelerate" title="Accelerate" {...hold("throttle")}><Zap className="size-6" /></Button></div>
    </div>}
  </div>;
}