import * as CANNON from "cannon-es";

export const TRACK = { centerX: -110, radiusX: 110, radiusZ: 170, halfWidth: 7 };
export const CAR = { mass: 1350, engineForce: 4700, brakeForce: 65, topSpeed: 58 };
export interface DrivingInput { throttle: boolean; brake: boolean; steer: number; handbrake: boolean; drift: boolean }

export function trackPoint(t: number, lane = 0) {
  const x = TRACK.centerX + TRACK.radiusX * Math.cos(t);
  const z = TRACK.radiusZ * Math.sin(t);
  const nx = Math.cos(t) * TRACK.radiusZ;
  const nz = Math.sin(t) * TRACK.radiusX;
  const len = Math.hypot(nx, nz);
  return { x: x + nx / len * lane, z: z + nz / len * lane, yaw: Math.atan2(-TRACK.radiusX * Math.sin(t), TRACK.radiusZ * Math.cos(t)) };
}

export function roadOffset(x: number, z: number) {
  const t = Math.atan2(z / TRACK.radiusZ, (x - TRACK.centerX) / TRACK.radiusX);
  const center = trackPoint(t);
  return Math.hypot(x - center.x, z - center.z);
}

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
    if (body.position.y < -5 || Math.abs(body.position.x) > 600 || Math.abs(body.position.z) > 600) reset();
    return { speed, distance, driftScore, slip, steering, offroad, yaw: Math.atan2(-forward.x, -forward.z) };
  }
  return { world, body, vehicle, traffic, step, reset };
}