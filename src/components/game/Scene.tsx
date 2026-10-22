import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CarModel, Dashboard } from "@/components/three/CarModel";
import { useGameStore, markReady } from "@/game/store";
import { touchInput, useKeyboard } from "@/game/input";
import { audio } from "@/game/audio";

// Feel constants
const ROAD_HALF = 5;
const MAX_X = 3.9;
const MIN_SPEED = 12; // m/s while cruising
const MAX_SPEED = 62;
const ACCEL = 14;
const BRAKE = 30;
const COAST = 4;
const STEER = 9;
const SPAWN_Z = -160;
const LANES = [-3.3, -1.1, 1.1, 3.3];

type Kind = "car" | "cell";
interface Obj {
  id: number;
  kind: Kind;
  x: number;
  z: number;
  speed: number; // own forward speed (cars)
  passed: boolean;
  alive: boolean;
  color: string;
}

const TRAFFIC_COLORS = ["#e0e0e0", "#2a6fd6", "#f0b429", "#3a3a40", "#1f8f5f"];

function makeRoadTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2b2c30";
  g.fillRect(0, 0, 256, 256);
  // asphalt grain
  for (let i = 0; i < 2500; i++) {
    const v = 35 + Math.random() * 25;
    g.fillStyle = `rgb(${v},${v},${v + 3})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 1.5, 1.5);
  }
  // edge lines
  g.fillStyle = "#e8e8e8";
  g.fillRect(6, 0, 5, 256);
  g.fillRect(245, 0, 5, 256);
  // dashed lane markings (3 dividers)
  g.fillStyle = "#f2f2f2";
  for (const x of [64, 128, 192]) g.fillRect(x - 2, 0, 4, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 30);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function Scene({ cockpit }: { cockpit: boolean }) {
  const keys = useKeyboard();
  const { camera } = useThree();
  const roadTex = useMemo(() => makeRoadTexture(), []);
  const player = useRef<THREE.Group>(null);
  const sim = useRef({
    x: 0,
    speed: MIN_SPEED,
    distance: 0,
    score: 0,
    bonus: 0,
    nextSpawn: 0,
    nextCell: 40,
    hudTimer: 0,
    nextId: 1,
    objs: [] as Obj[],
    lean: 0,
  });
  const objGroup = useRef<THREE.Group>(null);
  const scenery = useRef<THREE.Group>(null);
  const state = useGameStore((s) => s.state);

  useEffect(() => {
    markReady();
  }, []);

  // Reset on new run
  useEffect(() => {
    if (state === "playing" && useGameStore.getState().score === 0) {
      const s = sim.current;
      if (s.distance > 0 || s.objs.length) {
        Object.assign(s, { x: 0, speed: MIN_SPEED, distance: 0, score: 0, bonus: 0, nextSpawn: 0, nextCell: 40, objs: [] });
      }
    }
    if (state === "playing") audio.startEngine();
    else audio.stopEngine();
  }, [state]);

  useEffect(() => () => audio.stopEngine(), []);

  // Mesh pools rendered from refs
  const pool = useRef<THREE.Group[]>([]);

  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05);
    const s = sim.current;
    const playing = useGameStore.getState().state === "playing";
    const k = keys.current;
    const left = k.has("ArrowLeft") || k.has("KeyA") || touchInput.left;
    const right = k.has("ArrowRight") || k.has("KeyD") || touchInput.right;
    const up = k.has("ArrowUp") || k.has("KeyW") || touchInput.accel;
    const down = k.has("ArrowDown") || k.has("KeyS") || touchInput.brake;

    if (playing) {
      // Speed
      const difficulty = Math.min(1, s.distance / 6000);
      const floor = MIN_SPEED + difficulty * 14;
      if (up) s.speed += ACCEL * dt;
      else if (down) s.speed -= BRAKE * dt;
      else s.speed += (floor - s.speed) * (1 - Math.exp(-COAST * 0.1 * dt * 10));
      s.speed = THREE.MathUtils.clamp(s.speed, down ? 4 : floor * 0.6, MAX_SPEED);

      // Steering
      const steer = (right ? 1 : 0) - (left ? 1 : 0);
      s.x = THREE.MathUtils.clamp(s.x + steer * STEER * dt * (0.6 + s.speed / MAX_SPEED), -MAX_X, MAX_X);
      s.lean += (steer * 0.12 - s.lean) * (1 - Math.exp(-8 * dt));

      s.distance += s.speed * dt;
      s.score = s.distance * 0.5 + s.bonus;

      // Spawning traffic
      s.nextSpawn -= s.speed * dt;
      if (s.nextSpawn <= 0) {
        const lane = LANES[Math.floor(Math.random() * LANES.length)]!;
        s.objs.push({
          id: s.nextId++, kind: "car", x: lane, z: SPAWN_Z, speed: 8 + Math.random() * 8,
          passed: false, alive: true, color: TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)]!,
        });
        s.nextSpawn = THREE.MathUtils.lerp(55, 22, difficulty) + Math.random() * 20;
      }
      s.nextCell -= s.speed * dt;
      if (s.nextCell <= 0) {
        const lane = LANES[Math.floor(Math.random() * LANES.length)]!;
        s.objs.push({ id: s.nextId++, kind: "cell", x: lane, z: SPAWN_Z, speed: 0, passed: false, alive: true, color: "" });
        s.nextCell = 70 + Math.random() * 60;
      }

      // Move + collide
      for (const o of s.objs) {
        if (!o.alive) continue;
        o.z += (s.speed - o.speed) * dt;
        const dx = Math.abs(o.x - s.x);
        const dz = Math.abs(o.z);
        if (o.kind === "car") {
          if (dx < 1.75 && dz < 4.3) {
            audio.playCrash();
            audio.playGameOver();
            useGameStore.getState().setHud(Math.floor(s.score), Math.floor(s.distance), Math.round(s.speed * 3.6));
            useGameStore.getState().gameOver();
            break;
          }
          if (!o.passed && o.z > 4.3) {
            o.passed = true;
            if (dx < 2.7) {
              s.bonus += 25;
              audio.playNearMiss();
            }
          }
        } else if (dx < 1.4 && dz < 1.8) {
          o.alive = false;
          s.bonus += 100;
          audio.playPickup();
        }
        if (o.z > 15) o.alive = false;
      }
      s.objs = s.objs.filter((o) => o.alive);

      audio.updateEngine(s.speed, up);

      s.hudTimer += dt;
      if (s.hudTimer > 0.1) {
        s.hudTimer = 0;
        useGameStore.getState().setHud(Math.floor(s.score), Math.floor(s.distance), Math.round(s.speed * 3.6));
      }
    }

    // Road scroll: texture moves toward camera (bottom of screen)
    const idleSpeed = playing ? s.speed : useGameStore.getState().state === "menu" ? 10 : 0;
    roadTex.offset.y += (idleSpeed * dt) / 10; // one texture tile = 10 m

    // Scenery wrap
    if (scenery.current) {
      for (const child of scenery.current.children) {
        child.position.z += idleSpeed * dt;
        if (child.position.z > 15) child.position.z -= 180;
      }
    }

    // Sync object meshes
    const g = objGroup.current;
    if (g) {
      for (let i = 0; i < pool.current.length; i++) {
        const mesh = pool.current[i];
        const o = s.objs[i];
        if (!mesh) continue;
        if (o) {
          mesh.visible = true;
          mesh.position.set(o.x, 0, o.z);
          const car = mesh.children[0]!;
          const cell = mesh.children[1]!;
          car.visible = o.kind === "car";
          cell.visible = o.kind === "cell";
          if (o.kind === "car") {
            car.traverse((c) => {
              const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
              if (mat && mat.userData?.['body'] && mat.userData['forId'] !== o.id) {
                mat.color.set(o.color);
                mat.userData['forId'] = o.id;
              }
            });
          } else {
            cell.rotation.y += dt * 3;
            cell.position.y = 0.9 + Math.sin(performance.now() / 250) * 0.15;
          }
        } else mesh.visible = false;
      }
    }

    // Player + camera
    if (player.current) {
      player.current.position.x = s.x;
      player.current.rotation.z = -s.lean;
      player.current.rotation.y = -s.lean * 0.6;
    }
    if (cockpit) {
      camera.position.set(s.x - 0.4, 1.25, 0.35);
      camera.lookAt(s.x - 0.4, 1.1, -20);
    } else {
      camera.position.x += (s.x * 0.7 - camera.position.x) * (1 - Math.exp(-5 * dt));
      camera.position.y = 3.4;
      camera.position.z = 8.5;
      camera.lookAt(camera.position.x * 0.6, 0.8, -12);
    }
  });

  const sceneryItems = useMemo(() => {
    const items: { x: number; z: number; type: "tree" | "lamp"; s: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const z = -i * 7.5;
      items.push({ x: -(ROAD_HALF + 2 + Math.random() * 6), z, type: i % 3 === 0 ? "lamp" : "tree", s: 0.8 + Math.random() * 0.6 });
      items.push({ x: ROAD_HALF + 2 + Math.random() * 6, z: z - 3.7, type: i % 3 === 1 ? "lamp" : "tree", s: 0.8 + Math.random() * 0.6 });
    }
    return items;
  }, []);

  return (
    <>
      {/* Road */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -140]} receiveShadow>
        <planeGeometry args={[ROAD_HALF * 2, 300]} />
        <meshStandardMaterial map={roadTex} roughness={0.9} />
      </mesh>
      {/* Grass verges */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, -140]} receiveShadow>
        <planeGeometry args={[120, 300]} />
        <meshStandardMaterial color="#3d5a34" roughness={1} />
      </mesh>

      <group ref={scenery}>
        {sceneryItems.map((it, i) =>
          it.type === "tree" ? (
            <group key={i} position={[it.x, 0, it.z]} scale={it.s}>
              <mesh position={[0, 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 1.6, 6]} />
                <meshStandardMaterial color="#5b3d25" />
              </mesh>
              <mesh position={[0, 2.4, 0]} castShadow>
                <coneGeometry args={[1.1, 2.6, 7]} />
                <meshStandardMaterial color="#2f6b3a" flatShading />
              </mesh>
            </group>
          ) : (
            <group key={i} position={[it.x, 0, it.z]}>
              <mesh position={[0, 2.5, 0]}>
                <cylinderGeometry args={[0.07, 0.09, 5, 6]} />
                <meshStandardMaterial color="#8a8d94" metalness={0.6} />
              </mesh>
              <mesh position={[it.x < 0 ? 0.6 : -0.6, 4.95, 0]}>
                <boxGeometry args={[1.2, 0.1, 0.25]} />
                <meshStandardMaterial color="#fff6d8" emissive="#ffe9a8" emissiveIntensity={1.5} />
              </mesh>
            </group>
          ),
        )}
      </group>

      {/* Object pool: each slot holds a traffic car and an energy cell */}
      <group ref={objGroup}>
        {Array.from({ length: 24 }).map((_, i) => (
          <group key={i} ref={(el) => { if (el) pool.current[i] = el; }} visible={false}>
            <group rotation-y={0}>
              <TrafficCar />
            </group>
            <mesh position={[0, 0.9, 0]}>
              <octahedronGeometry args={[0.5]} />
              <meshStandardMaterial color="#5ff2ff" emissive="#22d6ff" emissiveIntensity={2.2} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={player}>
        <CarModel />
        {cockpit && (
          <group position={[0, 0.1, 0]}>
            <Dashboard />
          </group>
        )}
      </group>
    </>
  );
}

/** Each traffic car gets its own body material so colors can differ. */
function TrafficCar() {
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#e0e0e0", metalness: 0.5, roughness: 0.35 });
    m.userData['body'] = true;
    return m;
  }, []);
  return (
    <group>
      <group>
        <mesh position={[0, 0.5, 0]} material={mat} castShadow>
          <boxGeometry args={[1.85, 0.6, 4.2]} />
        </mesh>
      </group>
      <mesh position={[0, 1.05, 0.2]}>
        <boxGeometry args={[1.6, 0.5, 2.2]} />
        <meshStandardMaterial color="#141a22" metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.6, 2.11]}>
        <boxGeometry args={[1.6, 0.1, 0.03]} />
        <meshStandardMaterial color="#ff2020" emissive="#ff1010" emissiveIntensity={1.8} />
      </mesh>
      {[[-0.92, -1.3], [0.92, -1.3], [-0.92, 1.3], [0.92, 1.3]].map(([x = 0, z = 0], i) => (
        <mesh key={i} position={[x, 0.34, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.34, 0.34, 0.26, 14]} />
          <meshStandardMaterial color="#151515" />
        </mesh>
      ))}
    </group>
  );
}
