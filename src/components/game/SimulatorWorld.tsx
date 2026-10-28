import { useLayoutEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import oak from "@/assets/simulator/oak.glb.asset.json";
import pine from "@/assets/simulator/pine.glb.asset.json";
import { TRACK, trackPoint } from "@/game/simulator-physics";
import type { SimulatorTheme } from "@/game/simulator-theme";

function surfaceTexture(theme: SimulatorTheme, road: boolean) {
  const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  if (!ctx) return texture;
  ctx.fillStyle = road ? theme.asphalt : theme.ground; ctx.fillRect(0, 0, 256, 512);
  let seed = 42;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 10000; i++) { ctx.globalAlpha = random() * 0.18; ctx.fillStyle = theme.grain; ctx.fillRect(random() * 256, random() * 512, road ? 1 : 3, road ? 1 : 3); }
  ctx.globalAlpha = 1;
  if (road) { ctx.fillStyle = theme.line; ctx.fillRect(9, 0, 2, 512); ctx.fillRect(245, 0, 2, 512); ctx.fillRect(127, 0, 2, 250); }
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  if (!road) texture.repeat.set(100, 100);
  return texture;
}

export function SimulatorWorld({ theme }: { theme: SimulatorTheme }) {
  const road = useMemo(() => {
    const geo = new THREE.BufferGeometry(); const positions: number[] = []; const uvs: number[] = []; const indices: number[] = [];
    const segments = 240;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments * Math.PI * 2;
      for (const [u, lane] of [[0, -TRACK.halfWidth], [1, TRACK.halfWidth]]) {
        if (u === undefined || lane === undefined) continue;
        const p = trackPoint(t, lane); positions.push(p.x, 0.012, p.z); uvs.push(u, i / segments * 110);
      }
      if (i < segments) { const a = i * 2; indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    return geo;
  }, []);
  const asphalt = useMemo(() => surfaceTexture(theme, true), [theme]);
  const grass = useMemo(() => surfaceTexture(theme, false), [theme]);
  useLayoutEffect(() => () => { road.dispose(); asphalt.dispose(); grass.dispose(); }, [road, asphalt, grass]);
  return <>
    <mesh rotation-x={-Math.PI / 2} receiveShadow><planeGeometry args={[1500, 1500]} /><meshStandardMaterial map={grass} roughness={1} /></mesh>
    <mesh geometry={road} receiveShadow><meshStandardMaterial map={asphalt} roughness={0.96} side={THREE.DoubleSide} /></mesh>
    {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[-110 + Math.cos(i * 0.63) * 400, -20, Math.sin(i * 0.63) * 420]} scale={[160, 75 + i % 3 * 25, 150]}><sphereGeometry args={[1, 16, 10]} /><meshStandardMaterial color={theme.hill} roughness={1} /></mesh>)}
  </>;
}

export function Woodland() {
  const oakModel = useGLTF(oak.url); const pineModel = useGLTF(pine.url);
  const parts = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; matrices: THREE.Matrix4[] }[] = [];
    for (const [kind, source] of [oakModel.scene, pineModel.scene].entries()) {
      source.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(source); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
      source.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const matrices: THREE.Matrix4[] = [];
        for (let i = 0; i < 100; i++) {
          const t = i / 100 * Math.PI * 2 + kind * 0.023;
          const side = i % 2 === 0 ? -1 : 1; const p = trackPoint(t, side * (14 + i % 7 * 4));
          const scale = (7 + i % 4 * 1.8) / size.y;
          const normalization = new THREE.Matrix4().makeScale(scale, scale, scale).multiply(new THREE.Matrix4().makeTranslation(-center.x, -bounds.min.y, -center.z));
          const placement = new THREE.Matrix4().compose(new THREE.Vector3(p.x, 0, p.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), i * 1.7), new THREE.Vector3(1, 1, 1));
          matrices.push(placement.multiply(normalization).multiply(node.matrixWorld));
        }
        result.push({ geometry: node.geometry, material: node.material, matrices });
      });
    }
    return result;
  }, [oakModel.scene, pineModel.scene]);
  return <group>{parts.map((part, i) => <instancedMesh key={i} args={[part.geometry, part.material, part.matrices.length]} ref={(mesh) => { if (!mesh) return; part.matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix)); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); }} />)}</group>;
}