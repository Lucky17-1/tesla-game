import { create } from "zustand";

export type GameState = "loading" | "menu" | "playing" | "paused" | "gameover";

const BEST_KEY = "voltedge-best-score";

function loadBest(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
  } catch {
    return 0;
  }
}

interface GameStore {
  state: GameState;
  score: number;
  distance: number;
  speedKmh: number;
  best: number;
  newRecord: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  gameOver: () => void;
  toMenu: () => void;
  /** Called by the scene at most a few times per second, only when values change. */
  setHud: (score: number, distance: number, speedKmh: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: "loading",
  score: 0,
  distance: 0,
  speedKmh: 0,
  best: loadBest(),
  newRecord: false,
  start: () =>
    set({ state: "playing", score: 0, distance: 0, speedKmh: 0, newRecord: false }),
  pause: () => {
    if (get().state === "playing") set({ state: "paused" });
  },
  resume: () => {
    if (get().state === "paused") set({ state: "playing" });
  },
  gameOver: () => {
    const { score, best } = get();
    const newBest = Math.max(best, Math.floor(score));
    const newRecord = Math.floor(score) > 0 && Math.floor(score) > best;
    try {
      localStorage.setItem(BEST_KEY, String(newBest));
    } catch {
      // storage unavailable — best score just won't persist
    }
    set({ state: "gameover", best: newBest, newRecord });
  },
  toMenu: () => set({ state: "menu" }),
  setHud: (score, distance, speedKmh) =>
    set({ score, distance, speedKmh }),
}));

export const markReady = () => {
  if (useGameStore.getState().state === "loading") useGameStore.setState({ state: "menu" });
};
