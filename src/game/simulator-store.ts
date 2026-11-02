import { create } from "zustand";
import { resetCameraLook, type VehicleId } from "./simulator-vehicles";

export const CAMERA_VIEWS = ["Chase", "Driver", "Cabin", "Rear seat", "Hood", "Aerial", "Front", "Orbit 360"] as const;
export type CameraView = typeof CAMERA_VIEWS[number];
export type DriveMode = "Touring" | "Drift";
export type SimulatorState = "ready" | "driving" | "paused" | "finished";

interface SimulatorStore {
  state: SimulatorState;
  camera: CameraView;
  mode: DriveMode;
  vehicle: VehicleId;
  runId: number;
  speed: number;
  distance: number;
  driftScore: number;
  slip: number;
  steering: number;
  heading: number;
  offroad: boolean;
  impact: boolean;
  rank: number;
  raceTime: number;
  progress: number;
  finishTime: number;
  finishRank: number;
  bestTime: number;
  best: number;
  finish: (time: number, rank: number) => void;
  start: () => void;
  restart: () => void;
  pause: () => void;
  resume: () => void;
  nextCamera: () => void;
  setCamera: (camera: CameraView) => void;
  setMode: (mode: DriveMode) => void;
  setVehicle: (vehicle: VehicleId) => void;
  telemetry: (data: Pick<SimulatorStore, "speed" | "distance" | "driftScore" | "slip" | "steering" | "heading" | "offroad" | "impact" | "rank" | "raceTime" | "progress">) => void;
}

export const useSimulator = create<SimulatorStore>((set, get) => ({
  state: "ready", camera: "Chase", mode: "Touring", vehicle: "mpv", runId: 0,
  speed: 0, distance: 0, driftScore: 0, slip: 0, steering: 0, heading: 0,
  offroad: false, impact: false, best: 0,
  rank: 5, raceTime: 0, progress: 0, finishTime: 0, finishRank: 0, bestTime: 0,
  finish: (time, rank) => {
    const s = get(); if (s.state !== "driving") return;
    const bestTime = s.bestTime > 0 ? Math.min(s.bestTime, time) : time;
    try { localStorage.setItem("deshmukh-race-best", String(bestTime)); } catch { /* storage optional */ }
    set({ state: "finished", finishTime: time, finishRank: rank, bestTime });
  },
  start: () => set({ state: "driving" }),
  restart: () => set((s) => ({ state: "driving", runId: s.runId + 1, speed: 0, distance: 0, driftScore: 0, slip: 0, offroad: false, impact: false, rank: 5, raceTime: 0, progress: 0, finishTime: 0, finishRank: 0 })),
  pause: () => {
    const s = get();
    if (s.state !== "driving") return;
    const best = Math.max(s.best, s.driftScore);
    try { localStorage.setItem("deshmukh-drift-best", String(best)); } catch { /* storage optional */ }
    set({ state: "paused", best });
  },
  resume: () => set({ state: "driving" }),
  nextCamera: () => { resetCameraLook(); set((s) => ({ camera: CAMERA_VIEWS[(CAMERA_VIEWS.indexOf(s.camera) + 1) % CAMERA_VIEWS.length] ?? "Chase" })); },
  setCamera: (camera) => { resetCameraLook(); set({ camera }); },
  setMode: (mode) => set({ mode }),
  setVehicle: (vehicle) => { resetCameraLook(); set((s) => ({ vehicle, runId: s.runId + 1, speed: 0, distance: 0, driftScore: 0, impact: false, offroad: false, steering: 0, heading: 0, rank: 5, raceTime: 0, progress: 0, finishTime: 0, finishRank: 0, state: s.state === "finished" ? "ready" : s.state })); },
  telemetry: (data) => set(data),
}));

export const driveInput = { left: false, right: false, throttle: false, brake: false, handbrake: false };
export function clearDriveInput() {
  for (const key of Object.keys(driveInput) as (keyof typeof driveInput)[]) driveInput[key] = false;
}