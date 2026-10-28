import type { DrivingInput } from "./simulator-physics";

export type HeldInput = { left: boolean; right: boolean; throttle: boolean; brake: boolean; handbrake: boolean };
export function readDrivingInput(keys: Set<string>, touch: HeldInput, drift: boolean): DrivingInput {
  return {
    throttle: touch.throttle || keys.has("KeyW") || keys.has("ArrowUp"),
    brake: touch.brake || keys.has("KeyS") || keys.has("ArrowDown"),
    steer: Number(touch.left || keys.has("KeyA") || keys.has("ArrowLeft")) - Number(touch.right || keys.has("KeyD") || keys.has("ArrowRight")),
    handbrake: touch.handbrake || keys.has("Space"),
    drift,
  };
}