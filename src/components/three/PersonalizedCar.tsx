import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import driverPhoto from "@/assets/deshmukh-driver.png";

export function useVehiclePalette() {
  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(`--vehicle-${name}`).trim();
    return { paint: token("paint"), glass: token("glass"), trim: token("trim"), seat: token("seat"), alloy: token("alloy"), light: token("light"), tail: token("tail"), sky: token("sky"), road: token("road"), grass: token("grass"), line: token("line"), skin: token("skin") };
  }, []);
}

type Palette = ReturnType<typeof useVehiclePalette>;

function makePanel(points: [number, number, number][]) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function Panel({ points, color, glass = false }: { points: [number, number, number][]; color: string; glass?: boolean }) {
  const geometry = useMemo(() => makePanel(points), [points]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}>
    <meshPhysicalMaterial color={color} metalness={glass ? 0.35 : 0.65} roughness={glass ? 0.08 : 0.27} side={THREE.DoubleSide} transparent={glass} opacity={glass ? 0.76 : 1} depthWrite={!glass} clearcoat={1} />
  </mesh>;
}

function bodyGeometry() {
  // A continuous curved silhouette, wheel arches cut into the body rather than a box stand-in.
  const shape = new THREE.Shape();
  shape.moveTo(-2.42, 0.43);
  shape.bezierCurveTo(-2.44, 0.78, -2.32, 0.94, -2.04, 1.00);
  shape.bezierCurveTo(-1.55, 1.10, -1.15, 1.17, -0.78, 1.11);
  shape.lineTo(1.35, 1.11);
  shape.bezierCurveTo(2.0, 1.12, 2.38, 1.01, 2.4, 0.79);
  shape.lineTo(2.36, 0.43); shape.lineTo(1.99, 0.43);
  shape.absarc(1.47, 0.43, 0.52, 0, Math.PI, false);
  shape.lineTo(-0.95, 0.43);
  shape.absarc(-1.47, 0.43, 0.52, 0, Math.PI, false);
  shape.lineTo(-2.42, 0.43);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 1.85, bevelEnabled: true, bevelSegments: 5, steps: 1, bevelSize: 0.055, bevelThickness: 0.07, curveSegments: 28 });
  // Shape horizontal axis is car length; extrusion is car width.
  geo.rotateY(-Math.PI / 2); geo.translate(0.925, 0, 0);
  geo.computeVertexNormals();
  return geo;
}

function NumberPlate({ rear, palette }: { rear?: boolean; palette: Palette }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = palette.seat; ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = palette.trim; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 504, 120);
      ctx.fillStyle = palette.trim; ctx.font = "bold 69px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Deshmukh", 256, 68);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [palette]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={[0, 0.64, rear ? 2.47 : -2.48]} rotation-y={rear ? 0 : Math.PI}>
    <planeGeometry args={[0.81, 0.21]} /><meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>;
}

function Wheel({ x, z, running, palette }: { x: number; z: number; running: boolean; palette: Palette }) {
  const spinning = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (spinning.current && running) spinning.current.rotation.z -= Math.min(delta, 0.05) * 13; });
  return <group position={[x, 0.47, z]} rotation-y={Math.PI / 2}>
    <mesh castShadow><torusGeometry args={[0.355, 0.112, 14, 40]} /><meshStandardMaterial color={palette.trim} roughness={0.88} /></mesh>
    <group ref={spinning}>
      <mesh rotation-x={Math.PI / 2}><cylinderGeometry args={[0.32, 0.32, 0.24, 36]} /><meshStandardMaterial color={palette.alloy} metalness={0.85} roughness={0.3} /></mesh>
      {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 5) * 0.16, Math.cos(i * Math.PI / 5) * 0.16, x > 0 ? -0.13 : 0.13]} rotation-z={-i * Math.PI / 5}>
        <boxGeometry args={[0.043, 0.27, 0.03]} /><meshStandardMaterial color={palette.trim} metalness={0.7} roughness={0.32} />
      </mesh>)}
      <mesh position-z={x > 0 ? -0.15 : 0.15}><sphereGeometry args={[0.07, 16, 12]} /><meshStandardMaterial color={palette.alloy} metalness={0.9} roughness={0.2} /></mesh>
    </group>
  </group>;
}

function Driver({ palette }: { palette: Palette }) {
  const photo = useTexture(driverPhoto);
  return <group position={[0.44, 0, 0.04]}>
    <mesh position={[0, 1.38, 0.1]} rotation-y={Math.PI}>
      <planeGeometry args={[0.46, 0.61]} /><meshBasicMaterial map={photo} transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
    {[-0.19, 0.19].map((x) => <mesh key={x} position={[x, 1.15, -0.18]} rotation-x={-0.55}><capsuleGeometry args={[0.042, 0.28, 5, 12]} /><meshStandardMaterial color={palette.skin} roughness={0.7} /></mesh>)}
  </group>;
}

export function PersonalizedCar({ running, doorsOpen }: { running: boolean; doorsOpen: boolean }) {
  const palette = useVehiclePalette();
  const body = useMemo(bodyGeometry, []);
  useEffect(() => () => body.dispose(), [body]);
  return <group>
    <mesh geometry={body} castShadow receiveShadow><meshPhysicalMaterial color={palette.paint} metalness={0.5} roughness={0.25} clearcoat={1} clearcoatRoughness={0.12} /></mesh>
    <RoundedBox args={[1.77, 0.1, 4.1]} position={[0, 0.33, 0]} radius={0.045}><meshStandardMaterial color={palette.trim} roughness={0.65} /></RoundedBox>
    <RoundedBox args={[1.44, 0.09, 1.69]} position={[0, 1.83, 0.28]} radius={0.05}><meshPhysicalMaterial color={palette.glass} metalness={0.4} roughness={0.08} clearcoat={1} /></RoundedBox>
    {/* Windshield and rear glass. Transparent enough to reveal white seats and driver. */}
    <Panel color={palette.glass} glass points={[[-0.87, 1.12, -0.92], [0.87, 1.12, -0.92], [0.7, 1.81, -0.57], [-0.7, 1.81, -0.57]]} />
    <Panel color={palette.glass} glass points={[[0.7, 1.8, 1.1], [-0.7, 1.8, 1.1], [-0.9, 1.11, 1.96], [0.9, 1.11, 1.96]]} />
    {[-1, 1].map((side) => <group key={side}>
      {/* A/B/C pillars */}
      <mesh position={[side * 0.79, 1.47, -0.76]} rotation-x={0.47}><boxGeometry args={[0.065, 0.76, 0.065]} /><meshStandardMaterial color={palette.paint} metalness={0.45} /></mesh>
      <mesh position={[side * 0.79, 1.47, 0.46]}><boxGeometry args={[0.05, 0.72, 0.085]} /><meshStandardMaterial color={palette.trim} /></mesh>
      <mesh position={[side * 0.82, 1.47, 1.5]} rotation-x={-0.85}><boxGeometry args={[0.13, 1.1, 0.09]} /><meshStandardMaterial color={palette.paint} metalness={0.45} /></mesh>
      <mesh position={[side * 0.73, 1.8, 0.26]}><boxGeometry args={[0.065, 0.055, 1.72]} /><meshStandardMaterial color={palette.paint} metalness={0.45} /></mesh>
      <Panel color={palette.glass} glass points={[[side * 0.93, 1.15, 0.51], [side * 0.74, 1.79, 0.51], [side * 0.72, 1.78, 1.09], [side * 0.95, 1.15, 1.88]]} />
      <group position={[side * 0.95, 1.06, -0.87]} rotation-y={doorsOpen ? -side * 0.8 : 0}>
        <Panel color={palette.glass} glass points={[[0, 0.04, 0], [0, 0.04, 1.28], [-side * 0.23, 0.73, 1.28], [-side * 0.23, 0.73, 0.31]]} />
        <RoundedBox args={[0.06, 0.48, 1.2]} radius={0.02} position={[0, -0.19, 0.65]}><meshPhysicalMaterial color={palette.paint} roughness={0.24} metalness={0.5} clearcoat={1} /></RoundedBox>
        <mesh position={[side * 0.045, -0.03, 1.06]}><boxGeometry args={[0.025, 0.025, 0.17]} /><meshStandardMaterial color={palette.trim} /></mesh>
        <RoundedBox args={[0.19, 0.1, 0.31]} radius={0.04} position={[side * 0.14, 0.13, 0.13]}><meshStandardMaterial color={palette.paint} metalness={0.55} roughness={0.25} /></RoundedBox>
      </group>
    </group>)}
    {[-0.43, 0.43].map((x) => <group key={x} position={[x, 0.9, 0.23]}>
      <RoundedBox args={[0.54, 0.6, 0.17]} radius={0.07} position-y={0.17} rotation-x={-0.15}><meshStandardMaterial color={palette.seat} roughness={0.85} /></RoundedBox>
      <RoundedBox args={[0.54, 0.12, 0.56]} radius={0.04} position={[0, -0.14, -0.2]}><meshStandardMaterial color={palette.seat} roughness={0.8} /></RoundedBox>
      <RoundedBox args={[0.32, 0.21, 0.14]} radius={0.05} position-y={0.59}><meshStandardMaterial color={palette.seat} roughness={0.8} /></RoundedBox>
    </group>)}
    <RoundedBox args={[1.37, 0.48, 0.2]} radius={0.08} position={[0, 1.09, 1.15]}><meshStandardMaterial color={palette.seat} roughness={0.85} /></RoundedBox>
    <RoundedBox args={[1.6, 0.16, 0.37]} radius={0.045} position={[0, 1.07, -0.71]}><meshStandardMaterial color={palette.trim} roughness={0.5} /></RoundedBox>
    <mesh position={[0.43, 1.24, -0.44]} rotation-x={-0.3}><torusGeometry args={[0.19, 0.021, 12, 36]} /><meshStandardMaterial color={palette.trim} /></mesh>
    <RoundedBox args={[0.43, 0.29, 0.026]} radius={0.015} position={[0, 1.23, -0.6]} rotation-x={-0.15}><meshStandardMaterial color={palette.glass} metalness={0.45} roughness={0.12} /></RoundedBox>
    <Driver palette={palette} />
    <NumberPlate palette={palette} /><NumberPlate palette={palette} rear />
    {[-1.06, 1.06].flatMap((x) => [-1.47, 1.47].map((z) => <Wheel key={`${x}-${z}`} x={x} z={z} running={running} palette={palette} />))}
    <mesh position={[0, 0.89, -2.38]}><boxGeometry args={[1.68, 0.035, 0.06]} /><meshStandardMaterial color={palette.light} emissive={palette.light} emissiveIntensity={2} /></mesh>
    <mesh position={[0, 0.94, 2.37]}><boxGeometry args={[1.72, 0.035, 0.06]} /><meshStandardMaterial color={palette.tail} emissive={palette.tail} emissiveIntensity={1.3} /></mesh>
  </group>;
}

export function DriveRoad({ running }: { running: boolean }) {
  const palette = useVehiclePalette();
  const road = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = palette.road; ctx.fillRect(0, 0, 256, 512);
      for (let i = 0; i < 5000; i++) { ctx.globalAlpha = (i % 3 + 1) * 0.035; ctx.fillStyle = palette.line; ctx.fillRect((i * 73) % 256, (i * 127) % 512, 1, 1); }
      ctx.globalAlpha = 1; ctx.fillStyle = palette.line;
      ctx.fillRect(14, 0, 3, 512); ctx.fillRect(239, 0, 3, 512);
      ctx.fillRect(126, 20, 3, 210);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(1, 14); return texture;
  }, [palette]);
  useFrame((_, delta) => { if (running) road.offset.y += Math.min(delta, 0.05) * 0.8; });
  useEffect(() => () => road.dispose(), [road]);
  return <>
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -22]} receiveShadow><planeGeometry args={[9, 120]} /><meshStandardMaterial map={road} roughness={0.95} /></mesh>
    <mesh rotation-x={-Math.PI / 2} position-y={-0.03}><planeGeometry args={[250, 250]} /><meshStandardMaterial color={palette.grass} roughness={1} /></mesh>
    <Roadside running={running} palette={palette} />
  </>;
}

function Roadside({ running, palette }: { running: boolean; palette: Palette }) {
  const posts = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!running || !posts.current) return;
    posts.current.children.forEach((post) => { post.position.z += Math.min(delta, 0.05) * 14; if (post.position.z > 28) post.position.z -= 120; });
  });
  return <group ref={posts}>{Array.from({ length: 20 }, (_, i) => <group key={i} position={[(i % 2 ? -1 : 1) * 5.8, 0, i * 6 - 92]}>
    <mesh position-y={0.5}><boxGeometry args={[0.13, 1, 0.13]} /><meshStandardMaterial color={palette.seat} roughness={0.8} /></mesh>
    <mesh position-y={0.85}><boxGeometry args={[0.14, 0.18, 0.14]} /><meshStandardMaterial color={palette.tail} roughness={0.5} /></mesh>
  </group>)}</group>;
}