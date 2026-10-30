import { describe, expect, it } from "vitest";
import { DEFAULT_MUSIC, FIRST_VIDEO, nextTrack, parseYouTubeLink } from "@/game/music";
import { makeDrivingPhysics, roadOffset } from "@/game/simulator-physics";
import { CAMERA_VIEWS, useSimulator } from "@/game/simulator-store";
import { readDrivingInput } from "@/game/simulator-input";
import { adjustCameraLook, cameraLook, isInteriorCamera, resetCameraLook, VEHICLES } from "@/game/simulator-vehicles";
import { STREET_START, canRenderGoogleMaps } from "@/game/simulator-location";

describe("Personalized simulator", () => {
  it("starts with the family MPV and allows luxury vehicle exchange with a fresh run", () => {
    expect(VEHICLES.map((v) => v.id)).toEqual(["mpv", "luxury"]);
    useSimulator.setState({ vehicle: "mpv", runId: 10, speed: 30, distance: 150 });
    expect(useSimulator.getState().vehicle).toBe("mpv");
    useSimulator.getState().setVehicle("luxury");
    expect(useSimulator.getState().vehicle).toBe("luxury"); expect(useSimulator.getState().runId).toBe(11);
    expect(useSimulator.getState().speed).toBe(0); expect(useSimulator.getState().distance).toBe(0);
    useSimulator.getState().setVehicle("mpv");
  });
  it("keeps the user's exact Google start location and panorama", () => {
    expect(STREET_START.position).toEqual({ lat: 25.4290781, lng: 81.9138727 });
    expect(STREET_START.pano).toBe("LQiadkCkvnZ9-7CjwRK4IQ");
    expect(STREET_START.pov).toEqual({ heading: 90.42963437957803, pitch: 14.849397644948823 });
  });
  it("supports full horizontal 360 looking and rear-seat cabin view", () => {
    resetCameraLook(); adjustCameraLook(400, 400);
    expect(cameraLook.yaw).toBeCloseTo(2 * Math.PI - 2); expect(cameraLook.pitch).toBe(1.1);
    expect(CAMERA_VIEWS).toContain("Rear seat"); expect(CAMERA_VIEWS).toContain("Orbit 360");
    expect(isInteriorCamera("Rear seat")).toBe(true); expect(isInteriorCamera("Orbit 360")).toBe(false);
    resetCameraLook(); expect(cameraLook.yaw).toBe(0); expect(cameraLook.pitch).toBe(0);
  });
  it("never loads Maps in the sandbox or credential-bearing preview hostnames", () => {
    expect(canRenderGoogleMaps("localhost")).toBe(false);
    expect(canRenderGoogleMaps("a-devserver-key.lovableproject.com")).toBe(false);
    expect(canRenderGoogleMaps("tesla-game.lovable.app")).toBe(true);
  });
  it("starts music with the user's exact requested video", () => {
    expect(FIRST_VIDEO).toBe("vf-XIsSWiGA");
    expect(DEFAULT_MUSIC[0]).toBe("vf-XIsSWiGA");
    expect(parseYouTubeLink("https://youtu.be/vf-XIsSWiGA?list=RDBHlCNUyu5EU")).toEqual({ videoId: "vf-XIsSWiGA", playlistId: "RDBHlCNUyu5EU" });
  });
  it("advances automatically and loops the queue", () => { expect(nextTrack(0, 3)).toBe(1); expect(nextTrack(2, 3)).toBe(0); });
  it("rejects non-YouTube links", () => { expect(parseYouTubeLink("https://evil.test/watch?v=vf-XIsSWiGA")).toBeNull(); expect(parseYouTubeLink("javascript:alert(1)")).toBeNull(); });
  it("cycles all driving camera angles", () => {
    useSimulator.setState({ camera: "Chase" });
    for (const camera of CAMERA_VIEWS.slice(1)) { useSimulator.getState().nextCamera(); expect(useSimulator.getState().camera).toBe(camera); }
    useSimulator.getState().nextCamera(); expect(useSimulator.getState().camera).toBe("Chase");
  });
  it("drives forwards on throttle and slows on brake", () => {
    const sim = makeDrivingPhysics();
    for (let i = 0; i < 90; i++) sim.step({ throttle: false, brake: false, steer: 0, handbrake: false, drift: false }, 1 / 60);
    let result = sim.step({ throttle: true, brake: false, steer: 0, handbrake: false, drift: false }, 1 / 60);
    for (let i = 0; i < 120; i++) result = sim.step({ throttle: true, brake: false, steer: 0, handbrake: false, drift: false }, 1 / 60);
    expect(result.speed).toBeGreaterThan(2); expect(sim.body.position.z).toBeLessThan(-1);
    const speed = result.speed;
    for (let i = 0; i < 100; i++) result = sim.step({ throttle: false, brake: true, steer: 0, handbrake: false, drift: false }, 1 / 60);
    expect(result.speed).toBeLessThan(speed);
    sim.reset(); expect(sim.body.position.z).toBe(0); expect(sim.body.velocity.length()).toBe(0);
  });
  it("recognizes the road and grass", () => { expect(roadOffset(0, 0)).toBe(0); expect(roadOffset(20, 0)).toBe(20); });
  it("physically turns left and right with matching keyboard and touch signs", () => {
    const idle = { throttle: false, brake: false, steer: 0, handbrake: false, drift: false };
    for (const steer of [1, -1]) {
      const sim = makeDrivingPhysics();
      for (let i = 0; i < 90; i++) sim.step(idle, 1 / 60);
      for (let i = 0; i < 100; i++) sim.step({ ...idle, throttle: true }, 1 / 60);
      for (let i = 0; i < 60; i++) sim.step({ ...idle, throttle: true, steer }, 1 / 60);
      if (steer === 1) expect(sim.body.position.x).toBeLessThan(2.6);
      else expect(sim.body.position.x).toBeGreaterThan(2.6);
    }
  });
  it("scores an on-road handbrake drift", () => {
    const idle = { throttle: false, brake: false, steer: 0, handbrake: false, drift: false };
    const sim = makeDrivingPhysics();
    for (let i = 0; i < 90; i++) sim.step(idle, 1 / 60);
    for (let i = 0; i < 160; i++) sim.step({ ...idle, throttle: true }, 1 / 60);
    let result = sim.step({ ...idle, throttle: true, steer: 0.8, handbrake: true, drift: true }, 1 / 60);
    for (let i = 1; i < 60; i++) result = sim.step({ ...idle, throttle: true, steer: 0.8, handbrake: true, drift: true }, 1 / 60);
    expect(result.driftScore).toBeGreaterThan(50);
    expect(result.offroad).toBe(false);
  });
  it("collides with traffic rather than passing through", () => {
    const idle = { throttle: false, brake: false, steer: 0, handbrake: false, drift: false };
    const sim = makeDrivingPhysics();
    const traffic = sim.traffic[0];
    if (!traffic) throw new Error("Traffic pool missing");
    traffic.position.set(2.6, 0.65, -12); traffic.aabbNeedsUpdate = true;
    let hits = 0;
    sim.body.addEventListener("collide", () => { hits++; });
    for (let i = 0; i < 90; i++) sim.step(idle, 1 / 60);
    for (let i = 0; i < 150; i++) sim.step({ ...idle, throttle: true }, 1 / 60);
    expect(hits).toBeGreaterThan(0);
    expect(sim.body.position.z).toBeGreaterThan(-12);
  });
  it("keeps all four suspension wheels in contact with the rotated ground", () => {
    const sim = makeDrivingPhysics();
    for (let i = 0; i < 120; i++) sim.step({ throttle: false, brake: false, steer: 0, handbrake: false, drift: false }, 1 / 60);
    expect(sim.vehicle.wheelInfos.map((wheel) => wheel.isInContact)).toEqual([true, true, true, true]);
  });
  it("maps left and right consistently for keyboard and touch", () => {
    const touch = { left: false, right: false, throttle: false, brake: false, handbrake: false };
    expect(readDrivingInput(new Set(["KeyA"]), touch, false).steer).toBe(1);
    expect(readDrivingInput(new Set(), { ...touch, left: true }, false).steer).toBe(1);
    expect(readDrivingInput(new Set(["KeyD"]), touch, false).steer).toBe(-1);
    expect(readDrivingInput(new Set(), { ...touch, right: true }, false).steer).toBe(-1);
  });
});