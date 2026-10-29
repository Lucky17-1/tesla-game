export const VEHICLES = [
  { id: "mpv", name: "Family MPV", category: "7-seat · Generic model", length: 4.8 },
  { id: "luxury", name: "Luxury sedan", category: "Premium · Generic model", length: 4.55 },
] as const;
export type VehicleId = typeof VEHICLES[number]["id"];

/** Per-view look is kept outside React so dragging never re-renders the scene. */
export const cameraLook = { yaw: 0, pitch: 0, distance: 7.8 };
export function resetCameraLook() { cameraLook.yaw = 0; cameraLook.pitch = 0; cameraLook.distance = 7.8; }
export function adjustCameraLook(dx: number, dy: number) {
  cameraLook.yaw = ((cameraLook.yaw - dx * 0.005) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
  cameraLook.pitch = Math.max(-1.1, Math.min(1.1, cameraLook.pitch + dy * 0.005));
}