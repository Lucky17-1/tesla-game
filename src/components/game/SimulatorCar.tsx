import { useEffect, useMemo } from "react";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import sedan from "@/assets/simulator/sedan.glb.asset.json";
import mpv from "@/assets/simulator/mpv-mobile.glb.asset.json";
import face from "@/assets/simulator/driver-face.jpg.asset.json";
import boyFace from "@/assets/simulator/driver-boy.jpg.asset.json";
import girlFace from "@/assets/simulator/passenger-girl.jpg.asset.json";
import { getVehicle, type VehicleId } from "@/game/simulator-vehicles";
import type { SimulatorTheme } from "@/game/simulator-theme";
import { SimulatorMusic } from "./SimulatorMusic";

/** Bake normalization into cloned geometry, then batch by material to keep phones affordable. */
function VehicleModel({ theme, vehicle, color, cabin = false }: { theme: SimulatorTheme; vehicle: VehicleId; color?: string | undefined; cabin?: boolean }) {
  const gltf = useGLTF(vehicle === "mpv" ? mpv.url : sedan.url);
  const model = useMemo(() => {
    const source = gltf.scene.clone(true);
    const normalized = new THREE.Group(); normalized.rotation.y = vehicle === "mpv" ? -Math.PI / 2 : Math.PI; normalized.add(source); normalized.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(normalized); const size = bounds.getSize(new THREE.Vector3()); const center = bounds.getCenter(new THREE.Vector3());
    const scale = getVehicle(vehicle).length / size.z;
    normalized.scale.setScalar(scale); normalized.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale); normalized.updateMatrixWorld(true);
    const batches = new Map<string, { material: THREE.MeshStandardMaterial; geometries: THREE.BufferGeometry[] }>();
    source.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      // The sedan asset is exterior-only; its opaque roof/cab cannot enclose our custom interior.
      if (vehicle === "luxury" && cabin && /cab and roof/i.test(node.name)) return;
      const sourceMaterial = Array.isArray(node.material) ? node.material[0] : node.material;
      if (!(sourceMaterial instanceof THREE.MeshStandardMaterial)) return;
      const name = sourceMaterial.name;
      let batch = batches.get(name);
      if (!batch) {
        const material = sourceMaterial.clone();
        if (["paint", "blue", "white"].includes(name)) { material.color.set(color ?? (vehicle === "mpv" ? theme.carens : theme.paint)); material.metalness = 0.55; material.roughness = 0.28; }
        if (name.includes("glass")) {
          material.color.set(theme.glass); material.transparent = true; material.opacity = cabin ? 0.1 : 0.25; material.depthWrite = false; material.roughness = 0.1; material.side = THREE.DoubleSide;
          if (material instanceof THREE.MeshPhysicalMaterial) material.transmission = 0;
        }
        batch = { material, geometries: [] }; batches.set(name, batch);
      }
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      for (const key of Object.keys(geometry.attributes)) if (key !== "position" && key !== "normal") geometry.deleteAttribute(key);
      if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
      batch.geometries.push(geometry);
    });
    const group = new THREE.Group();
    for (const batch of batches.values()) {
      const geometry = mergeGeometries(batch.geometries, false);
      if (geometry) { const mesh = new THREE.Mesh(geometry, batch.material); mesh.castShadow = !batch.material.transparent; mesh.receiveShadow = true; group.add(mesh); }
      else batch.material.dispose();
      batch.geometries.forEach((geometry) => geometry.dispose());
    }
    return group;
  }, [gltf.scene, theme, vehicle, cabin, color]);
  useEffect(() => () => { model.traverse((node) => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); if (node.material instanceof THREE.Material) node.material.dispose(); } }); }, [model]);
  return <primitive object={model} dispose={null} />;
}

export function Sedan({ theme, color }: { theme: SimulatorTheme; color?: string }) { return <VehicleModel theme={theme} vehicle="luxury" color={color} />; }

function Plate({ theme, vehicle }: { theme: SimulatorTheme; vehicle: VehicleId }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 120;
    const ctx = canvas.getContext("2d"); if (ctx) { ctx.fillStyle = theme.light; ctx.fillRect(0, 0, 512, 120); ctx.fillStyle = theme.trim; ctx.font = "bold 62px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Deshmukh", 256, 62); }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
  }, [theme]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <>{[-1, 1].map((side) => <mesh key={side} position={[0, vehicle === "mpv" ? 0.6 : 0.5, side * (getVehicle(vehicle).length / 2 + 0.006)]} rotation-y={side < 0 ? Math.PI : 0}><planeGeometry args={[0.62, 0.145]} /><meshBasicMaterial map={texture} /></mesh>)}</>;
}

/** Photo-referenced seated avatar, not a reconstructed 3D scan. Blink meshes are driven by the scene stepper. */
function Occupant({ theme, position, name, visible = true, photo = face.url }: { theme: SimulatorTheme; position: [number, number, number]; name: string; visible?: boolean; photo?: string }) {
  const portrait = useTexture(photo);
  useEffect(() => { portrait.colorSpace = THREE.SRGBColorSpace; }, [portrait]);
  return <group position={position} visible={visible}>
    <mesh position={[0, 0.92, 0.05]}><capsuleGeometry args={[0.17, 0.26, 4, 10]} /><meshStandardMaterial color={theme.trim} roughness={0.9} /></mesh>
    <mesh position={[0, 1.31, 0]} scale={[0.135, 0.175, 0.13]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color={theme.skin} roughness={0.9} /></mesh>
    <mesh position={[0, 1.31, -0.125]} rotation-y={Math.PI}><planeGeometry args={[0.25, 0.29]} /><meshBasicMaterial map={portrait} side={THREE.DoubleSide} /></mesh>
    <group name={`portrait-blink-${name}`} position={[0, 1.323, -0.127]} visible={false}>
      {[-0.047, 0.047].map((x) => <mesh key={x} position={[x, 0, 0]}><planeGeometry args={[0.035, 0.011]} /><meshBasicMaterial color={theme.skin} side={THREE.DoubleSide} /></mesh>)}
    </group>
    {[-1, 1].map((side) => <group key={side} position={[side * 0.17, 0.99, -0.2]} rotation-x={0.9} rotation-z={side * 0.18}><mesh><capsuleGeometry args={[0.043, 0.32, 4, 8]} /><meshStandardMaterial color={theme.skin} /></mesh></group>)}
  </group>;
}

function SedanCabin({ theme }: { theme: SimulatorTheme }) {
  return <group>
    {[-0.48, 0.48].map((x) => <group key={x} position={[x, 0, 0.15]}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.61, 0.16, 0.62]} /><meshStandardMaterial color={theme.seat} roughness={0.85} /></mesh>
      <mesh position={[0, 0.9, 0.28]} rotation-x={-0.12}><boxGeometry args={[0.58, 0.65, 0.12]} /><meshStandardMaterial color={theme.seat} roughness={0.85} /></mesh>
    </group>)}
    <mesh position={[0, 0.5, 1.1]}><boxGeometry args={[1.5, 0.18, 0.65]} /><meshStandardMaterial color={theme.seat} /></mesh>
    <mesh position={[0, 0.85, 1.48]}><boxGeometry args={[1.5, 0.6, 0.13]} /><meshStandardMaterial color={theme.seat} /></mesh>
    <mesh position={[0, 0.22, 0]}><boxGeometry args={[1.7, 0.06, 3.6]} /><meshStandardMaterial color={theme.trim} /></mesh>
    <mesh position={[0, 0.78, -1.1]}><boxGeometry args={[1.76, 0.25, 0.6]} /><meshStandardMaterial color={theme.trim} roughness={0.65} /></mesh>
    <mesh position={[0, 0.88, -0.92]}><boxGeometry args={[1.77, 0.045, 0.17]} /><meshStandardMaterial color={theme.seat} /></mesh>
    <mesh position={[0, 0.56, -0.35]}><boxGeometry args={[0.22, 0.3, 1.2]} /><meshStandardMaterial color={theme.trim} /></mesh>
    <group position={[0.48, 0.92, -0.63]} rotation-x={-0.3}>
      <mesh><torusGeometry args={[0.21, 0.025, 8, 30]} /><meshStandardMaterial color={theme.trim} /></mesh>
      <mesh><boxGeometry args={[0.36, 0.055, 0.04]} /><meshStandardMaterial color={theme.metal} /></mesh>
    </group>
  </group>;
}

export function PersonalizedVehicle({ theme, vehicle, cabin, driverView, music, muted, active }: { theme: SimulatorTheme; vehicle: VehicleId; cabin: boolean; driverView: boolean; music: boolean; muted: boolean; active: boolean }) {
  return <>
    <VehicleModel theme={theme} vehicle={vehicle} cabin={cabin} />
    <Plate theme={theme} vehicle={vehicle} />
    {vehicle === "luxury" && <SedanCabin theme={theme} />}
    <Occupant theme={theme} position={[vehicle === "mpv" ? -0.44 : 0.47, 0, 0.02]} name="driver" visible={!driverView} photo={boyFace.url} />
    <Occupant theme={theme} position={[vehicle === "mpv" ? 0.44 : -0.47, 0, 0.02]} name="passenger" photo={girlFace.url} />
    <Occupant theme={theme} position={[vehicle === "mpv" ? -0.44 : 0.44, 0, vehicle === "mpv" ? 0.98 : 1.12]} name="rear" />
    <Html transform position={[vehicle === "mpv" ? 0 : -0.16, vehicle === "mpv" ? 1.12 : 1.02, vehicle === "mpv" ? -1.04 : -0.73]} distanceFactor={0.58} zIndexRange={[20, 10]} className={cabin && active ? "sim-tv-visible" : "sim-tv-hidden"}>
      <SimulatorMusic enabled={music} muted={muted} />
    </Html>
  </>;
}
