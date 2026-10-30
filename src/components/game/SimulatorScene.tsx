import { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { makeDrivingPhysics, trackPoint, type DrivingInput } from "@/game/simulator-physics";
import { CAMERA_VIEWS, clearDriveInput, driveInput, useSimulator, type CameraView } from "@/game/simulator-store";
import { cameraLook, isInteriorCamera } from "@/game/simulator-vehicles";
import { readDrivingInput } from "@/game/simulator-input";
import type { SimulatorTheme } from "@/game/simulator-theme";
import { audio } from "@/game/audio";
import { SimulatorWorld, Woodland } from "./SimulatorWorld";
import { PersonalizedVehicle, Sedan } from "./SimulatorCar";

type DebugGame = { readonly state: Record<string, unknown>; input: typeof driveInput; sim: (seconds: number) => void; camera: (view: CameraView) => void; start: () => void; restart: () => void; pause: () => void };
declare global { interface Window { __game?: DebugGame } }

export function SimulatorScene({ theme, music, muted, active, onReady }: { theme: SimulatorTheme; music: boolean; muted: boolean; active: boolean; onReady: () => void }) {
  const { camera, gl } = useThree();
  const physics = useMemo(() => makeDrivingPhysics(), []);
  const player = useRef<THREE.Group>(null);
  const cars = useRef<(THREE.Group | null)[]>([]);
  const keys = useRef(new Set<string>());
  const time = useRef(0); const hud = useRef(0); const lastRun = useRef(-1); const impactTime = useRef(0); const ready = useRef(false);
  const cameraView = useSimulator((s) => s.camera);
  const vehicle = useSimulator((s) => s.vehicle);
  const vehicleModel = useRef<THREE.Group>(null);
  const readyVehicle = useRef<string | null>(null);
  const temp = useMemo(() => ({ position: new THREE.Vector3(), target: new THREE.Vector3(), offset: new THREE.Vector3(), look: new THREE.Vector3(), quaternion: new THREE.Quaternion() }), []);
  const telemetry = useRef({ speed: 0, distance: 0, driftScore: 0, slip: 0, steering: 0, offroad: false, yaw: 0 });

  function publish() {
    const r = telemetry.current;
    useSimulator.getState().telemetry({ speed: Math.round(r.speed * 3.6), distance: r.distance, driftScore: Math.floor(r.driftScore), slip: r.slip, steering: r.steering, heading: r.yaw, offroad: r.offroad, impact: impactTime.current > 0 });
  }
  function advance(dt: number, input: DrivingInput) {
    const state = useSimulator.getState();
    if (lastRun.current !== state.runId) { physics.reset(); time.current = 0; lastRun.current = state.runId; impactTime.current = 0; }
    time.current += dt; impactTime.current = Math.max(0, impactTime.current - dt);
    physics.traffic.forEach((body, i) => {
      const t = -0.48 - i * 1.38 - time.current * 0.075; const p = trackPoint(t, -2.7);
      body.position.set(p.x, 0.8, p.z); body.quaternion.setFromEuler(0, p.yaw + Math.PI, 0); body.aabbNeedsUpdate = true;
      body.velocity.set(0, 0, 0);
    });
    telemetry.current = physics.step(input, dt);
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return; if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault(); keys.current.add(e.code); };
    const offKey = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => { keys.current.clear(); clearDriveInput(); };
    window.addEventListener("keydown", onKey); window.addEventListener("keyup", offKey); window.addEventListener("blur", clear);
    const collision = (e: { contact?: { getImpactVelocityAlongNormal: () => number } }) => { if (Math.abs(e.contact?.getImpactVelocityAlongNormal() ?? 0) < 2 || impactTime.current > 0) return; impactTime.current = 1.5; audio.playCrash(); };
    physics.body.addEventListener("collide", collision);
    if (import.meta.env.DEV) {
      const params = new URLSearchParams(window.location.search); const view = params.get("camera");
      if (CAMERA_VIEWS.some((camera) => camera === view)) useSimulator.getState().setCamera(view as CameraView);
      window.__game = {
        get state() { return { ...useSimulator.getState(), position: { x: physics.body.position.x, y: physics.body.position.y, z: physics.body.position.z } }; },
        input: driveInput,
        sim: (seconds) => { for (let i = 0; i < Math.min(seconds, 60) * 60; i++) advance(1 / 60, readDrivingInput(keys.current, driveInput, useSimulator.getState().mode === "Drift")); publish(); },
        camera: (view) => useSimulator.getState().setCamera(view), start: () => useSimulator.getState().start(), restart: () => useSimulator.getState().restart(), pause: () => useSimulator.getState().pause(),
      };
    }
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", offKey); window.removeEventListener("blur", clear); physics.body.removeEventListener("collide", collision); clear(); if (import.meta.env.DEV) delete window.__game; audio.stopEngine(); };
  }, [physics]);

  useFrame((_, raw) => {
    if (!active) return;
    const dt = Math.min(raw, 0.05); const state = useSimulator.getState(); const input = readDrivingInput(keys.current, driveInput, state.mode === "Drift");
    if (state.state === "driving") { advance(dt, input); audio.updateEngine(telemetry.current.speed, input.throttle); hud.current += dt; if (hud.current >= 0.12) { hud.current = 0; publish(); } }
    else if (state.state === "ready") { physics.step({ throttle: false, brake: true, steer: 0, handbrake: false, drift: false }, dt); }
    const b = physics.body;
    if (player.current) { player.current.position.set(b.position.x, b.position.y - 0.58, b.position.z); player.current.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w); }
    physics.traffic.forEach((body, i) => { const group = cars.current[i]; if (!group) return; group.position.set(body.position.x, 0, body.position.z); group.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w); });
    temp.position.set(b.position.x, b.position.y - 0.58, b.position.z); temp.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    const offsets: Record<CameraView, [number, number, number]> = { Chase: [0.4, 3.0, 7.3], Driver: [vehicle === "mpv" ? -0.44 : 0.48, vehicle === "mpv" ? 1.4 : 1.35, -0.35], Cabin: [vehicle === "mpv" ? 0.44 : -0.48, 1.38, -0.05], "Rear seat": [0, 1.39, 1.4], Hood: [0, 1.25, -1.9], Aerial: [0, 30, 12], Front: [4.2, 1.9, -6.9], "Orbit 360": [0, 2.7, cameraLook.distance] };
    const inside = isInteriorCamera(state.camera);
    temp.offset.set(...offsets[state.camera]).applyQuaternion(temp.quaternion).add(temp.position);
    if (state.camera === "Orbit 360") {
      temp.offset.set(Math.sin(cameraLook.yaw) * Math.cos(cameraLook.pitch) * cameraLook.distance, 1.0 + Math.sin(cameraLook.pitch + 0.28) * cameraLook.distance, Math.cos(cameraLook.yaw) * Math.cos(cameraLook.pitch) * cameraLook.distance).applyQuaternion(temp.quaternion).add(temp.position);
      temp.offset.y = Math.max(0.45, temp.offset.y);
    }
    if (inside || state.camera === "Hood") camera.position.copy(temp.offset); else camera.position.lerp(temp.offset, 1 - Math.exp(-5 * dt));
    if (inside) {
      temp.look.set(-Math.sin(cameraLook.yaw) * Math.cos(cameraLook.pitch), -Math.sin(cameraLook.pitch), -Math.cos(cameraLook.yaw) * Math.cos(cameraLook.pitch)).applyQuaternion(temp.quaternion);
      temp.target.copy(camera.position).add(temp.look);
    } else temp.target.set(0, 0.9, state.camera === "Front" || state.camera === "Orbit 360" ? 0 : -8).applyQuaternion(temp.quaternion).add(temp.position);
    camera.lookAt(temp.target);
    if (vehicleModel.current?.children.length && (!ready.current || readyVehicle.current !== state.vehicle)) { ready.current = true; readyVehicle.current = state.vehicle; requestAnimationFrame(() => { gl.domElement.closest(".simulator")?.setAttribute("data-scene-ready", state.vehicle); onReady(); }); }
  });
  return <>
    <color attach="background" args={[theme.sky]} /><fog attach="fog" args={[theme.fog, 70, 310]} />
    <hemisphereLight args={[theme.light, theme.ground, 1.5]} />
    <directionalLight position={[35, 60, -30]} intensity={2.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-bias={-0.0003} />
    <Environment resolution={64}><Lightformer intensity={3} position={[0, 12, 0]} rotation-x={-Math.PI / 2} scale={[25, 25, 1]} color={theme.light} /><Lightformer intensity={2} position={[15, 5, 0]} rotation-y={Math.PI / 2} scale={[25, 6, 1]} color={theme.sky} /></Environment>
    <SimulatorWorld theme={theme} />
    <Suspense fallback={null}><Woodland theme={theme} /></Suspense>
    <group ref={player}><Suspense fallback={null}><group key={vehicle} ref={vehicleModel}><PersonalizedVehicle theme={theme} vehicle={vehicle} cabin={isInteriorCamera(cameraView)} driverView={cameraView === "Driver"} music={music} muted={muted} active={active} /></group></Suspense></group>
    <Suspense fallback={null}>
      {physics.traffic.map((_, i) => <group key={i} ref={(group) => { cars.current[i] = group; }}><Sedan theme={theme} color={i % 2 ? theme.tail : theme.light} /></group>)}
    </Suspense>
  </>;
}