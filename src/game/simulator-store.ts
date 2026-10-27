import { create } from "zustand";

export const CAMERA_VIEWS = ["Chase", "Driver", "Cabin", "Hood", "Aerial", "Front"] as const;
export type CameraView = typeof CAMERA_VIEWS[number];
export type DriveMode = "Touring" | "Drift";
export type SimulatorState = "ready" | "driving" | "paused";

interface SimulatorStore {
  state: SimulatorState;
  camera: CameraView;
  mode: DriveMode;
  runId: number;
  speed: number;
  distance: number;
  driftScore: number;
  slip: number;
  steering: number;
  heading: number;
  offroad: boolean;
  impact: boolean;
  best: number;
  start: () => void;
  restart: () => void;
  pause: () => void;
  resume: () => void;
  nextCamera: () => void;
  setCamera: (camera: CameraView) => void;
  setMode: (mode: DriveMode) => void;
  telemetry: (data: Pick<SimulatorStore, "speed" | "distance" | "driftScore" | "slip" | "steering" | "heading" | "offroad" | "impact">) => void;
}

export const useSimulator = create<SimulatorStore>((set, get) => ({
  state: "ready", camera: "Chase", mode: "Touring", runId: 0,
  speed: 0, distance: 0, driftScore: 0, slip: 0, steering: 0, heading: 0,
  offroad: false, impact: false, best: 0,
  start: () => set({ state: "driving" }),
  restart: () => set((s) => ({ state: "driving", runId: s.runId + 1, speed: 0, distance: 0, driftScore: 0, slip: 0, offroad: false, impact: false })),
  pause: () => {
    const s = get();
    if (s.state !== "driving") return;
    const best = Math.max(s.best, s.driftScore);
    try { localStorage.setItem("deshmukh-drift-best", String(best)); } catch { /* storage optional */ }
    set({ state: "paused", best });
  },
  resume: () => set({ state: "driving" }),
  nextCamera: () => set((s) => ({ camera: CAMERA_VIEWS[(CAMERA_VIEWS.indexOf(s.camera) + 1) % CAMERA_VIEWS.length] ?? "Chase" })),
  setCamera: (camera) => set({ camera }),
  setMode: (mode) => set({ mode }),
  telemetry: (data) => set(data),
}));

export const driveInput = { left: false, right: false, throttle: false, brake: false, handbrake: false };
export function clearDriveInput() {
  for (const key of Object.keys(driveInput) as (keyof typeof driveInput)[]) driveInput[key] = false;
}