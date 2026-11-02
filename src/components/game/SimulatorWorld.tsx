import { assetUrl } from "@/lib/asset-url";
import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import oak from "@/assets/simulator/oak.glb.asset.json";
import pine from "@/assets/simulator/pine.glb.asset.json";
import { RACE, TRACK, trackPoint } from "@/game/simulator-physics";
import type { SimulatorTheme } from "@/game/simulator-theme";

const ROAD_LENGTH = TRACK.end - TRACK.start;
const ROAD_CENTER_Z = -(TRACK.start + TRACK.end) / 2;

/** Deterministic pseudo-random so scenery is identical on every load (no Math.random at module scope). */
function seeded(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

function surfaceTexture(theme: SimulatorTheme, kind: "road" | "ground") {
  const road = kind === "road";
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;
  ctx.fillStyle = road ? theme.asphalt : theme.ground; ctx.fillRect(0, 0, 256, 512);
  const random = seeded(42);
  for (let i = 0; i < 10000; i++) { ctx.globalAlpha = random() * 0.18; ctx.fillStyle = road ? theme.grain : i % 3 ? theme.grain : theme.sand; ctx.fillRect(random() * 256, random() * 512, road ? 1 : 3, road ? 1 : 3); }
  ctx.globalAlpha = 1;
  if (road) {
    ctx.fillStyle = theme.line;
    ctx.fillRect(6, 0, 4, 512); ctx.fillRect(246, 0, 4, 512); // solid edges
    ctx.fillRect(126, 0, 4, 512); // centre line
    ctx.fillRect(62, 0, 3, 240); ctx.fillRect(191, 0, 3, 240); // dashed lane lines
  }
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  texture.repeat.set(road ? 1 : 120, road ? ROAD_LENGTH / 18 : 120);
  return texture;
}

function checkerTexture(theme: SimulatorTheme) {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (ctx) for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { ctx.fillStyle = (x + y) % 2 ? theme.trim : theme.light; ctx.fillRect(x * 16, y * 16, 16, 16); }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

function bannerTexture(theme: SimulatorTheme, text: string) {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) { ctx.fillStyle = theme.tail; ctx.fillRect(0, 0, 1024, 128); ctx.fillStyle = theme.light; ctx.font = "bold 78px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 512, 68); }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

function Gantry({ theme, at, label }: { theme: SimulatorTheme; at: number; label: string }) {
  const banner = useMemo(() => bannerTexture(theme, label), [theme, label]);
  const checker = useMemo(() => checkerTexture(theme), [theme]);
  useLayoutEffect(() => () => { banner.dispose(); checker.dispose(); }, [banner, checker]);
  const z = -at;
  return <group>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, z]}><planeGeometry args={[TRACK.halfWidth * 2, 2]} /><meshBasicMaterial map={checker} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (TRACK.halfWidth + 0.8), 3.5, z]}><boxGeometry args={[0.5, 7, 0.5]} /><meshStandardMaterial color={theme.metal} metalness={0.6} roughness={0.4} /></mesh>)}
    <mesh position={[0, 7.2, z]}><boxGeometry args={[TRACK.halfWidth * 2 + 2.2, 1.6, 0.4]} /><meshStandardMaterial map={banner} /></mesh>
  </group>;
}

export function SimulatorWorld({ theme }: { theme: SimulatorTheme }) {
  const asphalt = useMemo(() => surfaceTexture(theme, "road"), [theme]);
  const grass = useMemo(() => surfaceTexture(theme, "ground"), [theme]);
  useLayoutEffect(() => () => { asphalt.dispose(); grass.dispose(); }, [asphalt, grass]);
  return <>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[2400, 2400]} /><meshStandardMaterial map={grass} roughness={1} /></mesh>
    {/* sandy shoulders either side of the strip */}
    {[-1, 1].map((side) => <mesh key={side} rotation-x={-Math.PI / 2} position={[side * (TRACK.halfWidth + 3), 0.008, ROAD_CENTER_Z]} receiveShadow><planeGeometry args={[6, ROAD_LENGTH]} /><meshStandardMaterial color={theme.sand} roughness={1} /></mesh>)}
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, ROAD_CENTER_Z]} receiveShadow><planeGeometry args={[TRACK.halfWidth * 2, ROAD_LENGTH]} /><meshStandardMaterial map={asphalt} roughness={0.96} /></mesh>
    {/* ocean ring around the island */}
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}><ringGeometry args={[1150, 2600, 64]} /><meshStandardMaterial color={theme.water} roughness={0.25} metalness={0.2} /></mesh>
    {Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 760, -12, -700 + Math.sin(a) * 900]} scale={[150, 120 + i % 3 * 50, 150]}><coneGeometry args={[1, 2, 11, 3]} /><meshStandardMaterial color={theme.hill} roughness={1} flatShading /></mesh>; })}
    <Gantry theme={theme} at={0} label="START" />
    <Gantry theme={theme} at={RACE.length} label="FINISH" />
  </>;
}

/** Battle-royale island set dressing: container yards, watchtowers, crates and airdrops. Original procedural art, no third-party game assets. */
export function BattleIsland({ theme }: { theme: SimulatorTheme }) {
  const data = useMemo(() => {
    const random = seeded(7);
    const containers: THREE.Matrix4[] = []; const containerColors: THREE.Color[] = [];
    const palette = [theme.container1, theme.container2, theme.container3].map((c) => new THREE.Color(c));
    const crates: THREE.Matrix4[] = []; const towers: THREE.Matrix4[] = []; const sandbags: THREE.Matrix4[] = [];
    const m = (x: number, y: number, z: number, ry = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));
    for (let s = -60; s < TRACK.end; s += 38) {
      for (const side of [-1, 1]) {
        const x = side * (TRACK.halfWidth + 9 + random() * 8); const z = -s - random() * 20;
        const kind = random();
        if (kind < 0.45) {
          const stack = 1 + Math.floor(random() * 3);
          for (let k = 0; k < stack; k++) { containers.push(m(x, 1.3 + k * 2.6, z, Math.PI / 2 + (random() - 0.5) * 0.3)); containerColors.push(palette[Math.floor(random() * palette.length)] ?? palette[0]!); }
        } else if (kind < 0.62) towers.push(m(x + side * 4, 0, z, random() * Math.PI));
        else for (let k = 0; k < 4; k++) crates.push(m(x + (k % 2) * 1.3, 0.6 + Math.floor(k / 2) * 1.2, z + (k % 2) * 0.4, random()));
        if (random() < 0.5) sandbags.push(m(side * (TRACK.halfWidth + 5.5), 0.4, -s - 10, 0));
      }
    }
    const box = (w: number, h: number, d: number, x: number, y: number, z: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
    const towerParts = [
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a = 0, b = 0]) => box(0.3, 9, 0.3, a * 1.4, 4.5, b * 1.4)),
      box(3.6, 0.3, 3.6, 0, 7.5, 0), box(3.6, 1, 0.15, 0, 8.1, 1.75), box(3.6, 1, 0.15, 0, 8.1, -1.75), box(0.15, 1, 3.6, 1.75, 8.1, 0),
      new THREE.ConeGeometry(2.8, 1.6, 4).rotateY(Math.PI / 4).translate(0, 10.8, 0), box(0.2, 2.2, 0.2, -1.5, 9.6, -1.5), box(0.2, 2.2, 0.2, 1.5, 9.6, 1.5),
    ];
    const tower = mergeGeometries(towerParts.map((g) => g.index ? g.toNonIndexed() : g), false); towerParts.forEach((g) => g.dispose());
    return { containers, containerColors, crates, towers, sandbags, tower, container: new THREE.BoxGeometry(6, 2.6, 2.5), crate: new THREE.BoxGeometry(1.2, 1.2, 1.2), sandbag: new THREE.CapsuleGeometry(0.45, 3, 4, 8).rotateZ(Math.PI / 2) };
  }, [theme]);
  useLayoutEffect(() => () => { data.tower?.dispose(); data.container.dispose(); data.crate.dispose(); data.sandbag.dispose(); }, [data]);
  const fill = (list: THREE.Matrix4[], colors?: THREE.Color[]) => (mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return; list.forEach((matrix, i) => { mesh.setMatrixAt(i, matrix); const c = colors?.[i]; if (c) mesh.setColorAt(i, c); });
    mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere();
  };
  return <group>
    {data.containers.length > 0 && <instancedMesh args={[data.container, undefined, data.containers.length]} ref={fill(data.containers, data.containerColors)} castShadow receiveShadow><meshStandardMaterial color={theme.light} roughness={0.6} metalness={0.3} /></instancedMesh>}
    {data.crates.length > 0 && <instancedMesh args={[data.crate, undefined, data.crates.length]} ref={fill(data.crates)} castShadow><meshStandardMaterial color={theme.wood} roughness={0.9} /></instancedMesh>}
    {data.tower && data.towers.length > 0 && <instancedMesh args={[data.tower, undefined, data.towers.length]} ref={fill(data.towers)} castShadow><meshStandardMaterial color={theme.wood} roughness={0.95} /></instancedMesh>}
    {data.sandbags.length > 0 && <instancedMesh args={[data.sandbag, undefined, data.sandbags.length]} ref={fill(data.sandbags)}><meshStandardMaterial color={theme.sand} roughness={1} /></instancedMesh>}
    {/* airdrops drifting down over the strip */}
    {[180, 520, 860, 1150].map((s, i) => <group key={s} position={[(i % 2 ? 1 : -1) * 22, 34 + i * 6, -s]}>
      <mesh position={[0, 6, 0]}><sphereGeometry args={[4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={i % 2 ? theme.container1 : theme.tail} side={THREE.DoubleSide} roughness={0.8} /></mesh>
      <mesh><boxGeometry args={[1.6, 1.6, 1.6]} /><meshStandardMaterial color={theme.container2} roughness={0.7} /></mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a = 0, b = 0]) => <mesh key={`${a}${b}`} position={[a * 1.9, 3.4, b * 1.9]} rotation={[b * 0.45, 0, -a * 0.45]}><cylinderGeometry args={[0.02, 0.02, 5.6]} /><meshBasicMaterial color={theme.trim} /></mesh>)}
    </group>)}
  </group>;
}

export function Woodland({ theme }: { theme: SimulatorTheme }) {
  const oakModel = useGLTF(assetUrl(oak.url)); const pineModel = useGLTF(assetUrl(pine.url));
  const parts = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; matrices: THREE.Matrix4[] }[] = [];
    const count = 180;
    for (const [kind, source] of [oakModel.scene, pineModel.scene].entries()) {
      source.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(source); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
      source.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const matrices: THREE.Matrix4[] = [];
        for (let i = 0; i < count; i++) {
          const s = TRACK.start + (i / count) * (TRACK.end - TRACK.start) + kind * 5;
          const side = i % 2 === 0 ? -1 : 1; const p = trackPoint(s, side * (34 + (i * 7 + kind * 3) % 9 * 5));
          const scale = (8 + i % 4 * 1.8) / size.y;
          const normalization = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
          const placement = new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.7), new THREE.Vector3(1, 1, 1));
          matrices.push(placement.multiply(normalization).multiply(node.matrixWorld));
        }
        const sourceMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
        const material = sourceMaterial?.clone() as THREE.MeshStandardMaterial | undefined;
        if (material) material.color.set(material.name.startsWith("leaf") ? kind === 1 ? theme.ground : theme.hill : theme.trim);
        result.push({ geometry: node.geometry, material: material ?? node.material, matrices });
      });
    }
    return result;
  }, [oakModel.scene, pineModel.scene, theme]);
  return <group>{parts.map((part, i) => <instancedMesh key={i} args={[part.geometry, part.material, part.matrices.length]} ref={(mesh) => { if (!mesh) return; part.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix)); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }} />)}</group>;
}
