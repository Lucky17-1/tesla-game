import { describe, expect, it } from "vitest";
import { DEFAULT_MUSIC, FIRST_VIDEO, nextTrack, parseYouTubeLink } from "@/game/music";
import { makeDrivingPhysics, roadOffset } from "@/game/simulator-physics";
import { CAMERA_VIEWS, useSimulator } from "@/game/simulator-store";
import { readDrivingInput } from "@/game/simulator-input";

describe("Personalized simulator", () => {
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