import { useMemo } from "react";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import sedan from "@/assets/simulator/sedan.glb.asset.json";
import face from "@/assets/simulator/driver-face.jpg.asset.json";
import type { SimulatorTheme } from "@/game/simulator-theme";
import { SimulatorMusic } from "./SimulatorMusic";

export function Sedan({ theme, color, interior = false }: { theme: SimulatorTheme; color?: string; interior?: boolean }) {
  const gltf = useGLTF(sedan.url);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const rotation = new THREE.Group(); rotation.rotation.y = Math.PI; rotation.add(clone); rotation.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(rotation); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
    const scale = 4.55 / size.z; rotation.scale.setScalar(scale); rotation.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    clone.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.castShadow = true; node.receiveShadow = true;
      if (interior) { node.visible = false; return; }
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const next = materials.map((source) => {
        const mat = source.clone() as THREE.MeshStandardMaterial;
        if (["blue", "white"].includes(source.name)) { mat.color.set(color ?? theme.paint); mat.metalness = 0.65; mat.roughness = 0.24; }
        if (source.name === "glass") { mat.color.set(theme.glass); mat.transparent = true; mat.opacity = 0.4; mat.depthWrite = false; mat.roughness = 0.13; }
        return mat;
      });
      node.material = Array.isArray(node.material) ? next : next[0] ?? node.material;
    });
    return rotation;
  }, [gltf.scene, theme, color, interior]);
  return <primitive object={model} />;
}

function Plate({ theme }: { theme: SimulatorTheme }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 120;
    const ctx = canvas.getContext("2d"); if (ctx) { ctx.fillStyle = theme.light; ctx.fillRect(0, 0, 512, 120); ctx.fillStyle = theme.trim; ctx.font = "bold 62px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Deshmukh", 256, 62); }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [theme]);
  return <mesh position={[0, 0.55, 2.287]}><planeGeometry args={[0.65, 0.16]} /><meshBasicMaterial map={texture} /></mesh>;
}

export function PersonalizedSedan({ theme, cabin, music, muted }: { theme: SimulatorTheme; cabin: boolean; music: boolean; muted: boolean }) {
  const portrait = useTexture(face.url); portrait.colorSpace = THREE.SRGBColorSpace;
  return <>
    <Sedan theme={theme} interior={cabin} />
    <Plate theme={theme} />
    <group>
      {[-0.48, 0.48].map((x) => <group key={x} position={[x, 0, 0.15]}>
        <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.61, 0.16, 0.62]} /><meshStandardMaterial color={theme.seat} roughness={0.85} /></mesh>
        <mesh position={[0, 0.92, 0.28]} rotation-x={-0.12}><boxGeometry args={[0.58, 0.8, 0.12]} /><meshStandardMaterial color={theme.seat} roughness={0.85} /></mesh>
      </group>)}
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[1.7, 0.06, 3.6]} /><meshStandardMaterial color={theme.trim} /></mesh>
      <mesh position={[0, 0.78, -1.1]}><boxGeometry args={[1.76, 0.25, 0.6]} /><meshStandardMaterial color={theme.trim} roughness={0.65} /></mesh>
      <mesh position={[0, 0.88, -0.92]}><boxGeometry args={[1.77, 0.045, 0.17]} /><meshStandardMaterial color={theme.seat} /></mesh>
      <mesh position={[0, 0.56, -0.35]}><boxGeometry args={[0.22, 0.3, 1.2]} /><meshStandardMaterial color={theme.trim} /></mesh>
      <group position={[0.48, 0.92, -0.63]} rotation-x={-0.3}>
        <mesh><torusGeometry args={[0.21, 0.025, 8, 30]} /><meshStandardMaterial color={theme.trim} /></mesh>
        <mesh><boxGeometry args={[0.36, 0.055, 0.04]} /><meshStandardMaterial color={theme.metal} /></mesh>
      </group>
      <mesh position={[0.47, 1.16, 0.08]}><boxGeometry args={[0.39, 0.52, 0.17]} /><meshStandardMaterial color={theme.trim} /></mesh>
      <mesh position={[0.47, 1.5, 0.03]} rotation-y={Math.PI}><planeGeometry args={[0.25, 0.3]} /><meshBasicMaterial map={portrait} side={THREE.DoubleSide} /></mesh>
      {[-1, 1].map((side) => <group key={side} position={[0.47 + side * 0.15, 1.02, -0.26]} rotation-x={0.8} rotation-z={side * 0.15}><mesh><capsuleGeometry args={[0.045, 0.38, 4, 8]} /><meshStandardMaterial color={theme.skin} /></mesh></group>)}
      {cabin && <>
        {[-0.9, 0.9].map((x) => <mesh key={x} position={[x, 0.86, -0.55]} rotation-x={-0.25}><boxGeometry args={[0.05, 1.1, 0.06]} /><meshStandardMaterial color={theme.trim} /></mesh>)}
        <mesh position={[0, 1.67, -0.72]}><boxGeometry args={[1.8, 0.07, 0.4]} /><meshStandardMaterial color={theme.trim} /></mesh>
      </>}
      <Html transform position={[-0.16, 1.02, -0.73]} distanceFactor={0.58} zIndexRange={[20, 10]} style={{ visibility: cabin ? "visible" : "hidden" }}>
        <SimulatorMusic enabled={music} muted={muted} />
      </Html>
    </group>
  </>;
}