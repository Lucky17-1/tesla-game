import * as CANNON from "cannon-es";

/** Straight drag-race strip running along -Z; distance along the strip is `s = -z`. */
export const TRACK = { halfWidth: 9, start: -150, end: 1600 };
export const RACE = { length: 1200 };
export const CAR = { mass: 1350, engineForce: 4700, brakeForce: 65, topSpeed: 58 };
export interface DrivingInput { throttle: boolean; brake: boolean; steer: number; handbrake: boolean; drift: boolean }

/** Rival grid: lane x, grid offset (positive = behind the start line), acceleration and top speed in m/s. */
export const RIVALS = [
  { lane: -6.75, grid: 0, accel: 7.2, top: 47 },
  { lane: -2.25, grid: 0, accel: 7.8, top: 51 },
  { lane: 6.75, grid: 0, accel: 6.6, top: 44 },
  { lane: 2.25, grid: 12, accel: 8.2, top: 53 },
] as const;

/** Distance a rival has covered along the strip after `seconds`; rivals coast to a stop after the finish. */
export function rivalDistance(index: number, seconds: number) {
  const r = RIVALS[index]; if (!r) return 0;
  const t = Math.max(0, seconds); const tTop = r.top / r.accel;
  const s = t < tTop ? 0.5 * r.accel * t * t : 0.5 * r.top * tTop + r.top * (t - tTop);
  return Math.min(s, RACE.length + 90) - r.grid;
}

/** Race rank: 1 + rivals ahead of the player's distance. */
export function raceRank(playerDistance: number, rivalDistances: number[]) {
  return 1 + rivalDistances.filter((d) => d > playerDistance).length;
}

export function trackPoint(s: number, lane = 0) { return { x: lane, z: -s, yaw: 0 }; }

export function roadOffset(x: number, _z: number) { return Math.abs(x); }

/** Cannon's suspension, wheel contact, impulses and collision drive the vehicle. */
export function makeDrivingPhysics() {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0) });
  world.broadphase = new CANNON.SAPBroadphase(world);
  const groundMaterial = new CANNON.Material("ground");
  const carMaterial = new CANNON.Material("car");
  world.addContactMaterial(new CANNON.ContactMaterial(groundMaterial, carMaterial, { friction: 0.3, restitution: 0.08 }));
  const ground = new CANNON.Body({ mass: 0, material: groundMaterial, shape: new CANNON.Plane() });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  ground.aabbNeedsUpdate = true;
  world.addBody(ground);
  const body = new CANNON.Body({ mass: CAR.mass, material: carMaterial, position: new CANNON.Vec3(2.6, 0.8, 0) });
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.91, 0.25, 2.1)));
  body.angularDamping = 0.65;
  body.linearDamping = 0.06;
  const vehicle = new CANNON.RaycastVehicle({ chassisBody: body, indexRightAxis: 0, indexUpAxis: 1, indexForwardAxis: 2 });
  const wheelOptions = {
    radius: 0.36, directionLocal: new CANNON.Vec3(0, -1, 0), axleLocal: new CANNON.Vec3(-1, 0, 0),
    suspensionStiffness: 38, suspensionRestLength: 0.32, frictionSlip: 4.6,
    dampingRelaxation: 2.3, dampingCompression: 4.5, maxSuspensionForce: 100000,
    rollInfluence: 0.015, maxSuspensionTravel: 0.2, customSlidingRotationalSpeed: -30, useCustomSlidingRotationalSpeed: true,
  };
  for (const [x, z] of [[-0.92, -1.45], [0.92, -1.45], [-0.92, 1.45], [0.92, 1.45]]) {
    if (x === undefined || z === undefined) continue;
    vehicle.addWheel({ ...wheelOptions, chassisConnectionPointLocal: new CANNON.Vec3(x, -0.1, z) });
  }
  vehicle.addToWorld(world);
  let steering = 0;
  let distance = 0;
  let driftScore = 0;
  const forward = new CANNON.Vec3();
  const traffic: CANNON.Body[] = [];
  for (let i = 0; i < 4; i++) {
    const obstacle = new CANNON.Body({ type: CANNON.Body.KINEMATIC, mass: 0, material: carMaterial, shape: new CANNON.Box(new CANNON.Vec3(0.94, 0.65, 2.3)) });
    obstacle.position.set(-400, 0.65, i * 20);
    world.addBody(obstacle);
    traffic.push(obstacle);
  }
  function reset() {
    body.position.set(2.6, 0.8, 0); body.velocity.setZero(); body.angularVelocity.setZero();
    body.quaternion.set(0, 0, 0, 1); body.force.setZero(); body.torque.setZero();
    body.aabbNeedsUpdate = true;
    steering = 0; distance = 0; driftScore = 0;
    world.accumulator = 0;
  }
  function step(input: DrivingInput, dt: number) {
    const speed = Math.hypot(body.velocity.x, body.velocity.z);
    const offroad = roadOffset(body.position.x, body.position.z) > TRACK.halfWidth;
    const targetSteer = input.steer * (0.44 / (1 + speed * 0.026));
    steering += (targetSteer - steering) * (1 - Math.exp(-7 * dt));
    vehicle.setSteeringValue(steering, 0); vehicle.setSteeringValue(steering, 1);
    const force = input.throttle && speed < CAR.topSpeed ? CAR.engineForce * (offroad ? 0.5 : 1) : 0;
    for (let i = 0; i < 4; i++) {
      vehicle.applyEngineForce(i >= 2 ? force : 0, i);
      vehicle.setBrake(input.brake ? CAR.brakeForce : input.handbrake && i >= 2 ? 24 : 0, i);
      const wheel = vehicle.wheelInfos[i];
      if (wheel) wheel.frictionSlip = offroad ? 1.8 : i >= 2 && (input.handbrake || input.drift) ? 1.05 : 4.6;
    }
    if (offroad) { body.velocity.x *= Math.exp(-0.6 * dt); body.velocity.z *= Math.exp(-0.6 * dt); }
    world.step(1 / 120, dt, 8);
    body.quaternion.vmult(new CANNON.Vec3(0, 0, -1), forward);
    const longitudinal = body.velocity.x * forward.x + body.velocity.z * forward.z;
    const lateral = body.velocity.x * -forward.z + body.velocity.z * forward.x;
    const slip = speed > 2 ? Math.atan2(lateral, Math.abs(longitudinal)) : 0;
    distance += speed * dt;
    if (speed > 6 && Math.abs(slip) > 0.09 && Math.abs(slip) < 1.4 && !offroad) driftScore += Math.abs(slip) * speed * dt * 18;
    if (body.position.y < -5 || Math.abs(body.position.x) > 220 || body.position.z < -(TRACK.end + 150) || body.position.z > 220) reset();
    return { speed, distance, progress: -body.position.z, driftScore, slip, steering, offroad, yaw: Math.atan2(-forward.x, -forward.z) };
  }
  return { world, body, vehicle, traffic, step, reset };
}