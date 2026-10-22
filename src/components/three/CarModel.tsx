import { forwardRef } from "react";
import * as THREE from "three";

/**
 * Original procedural stand-in for the Volterra GT-One concept EV.
 * Faces -Z (forward). Roughly 2m wide, 4.6m long. Replace with a licensed
 * GLB later by swapping this component.
 */
export const CarModel = forwardRef<THREE.Group, { color?: string; showInterior?: boolean }>(
  function CarModel({ color = "#d42a2a", showInterior = false }, ref) {
    return (
      <group ref={ref}>
        {/* Lower body */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.9, 0.5, 4.5]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Sloped nose */}
        <mesh position={[0, 0.62, -1.75]} rotation-x={0.18} castShadow>
          <boxGeometry args={[1.86, 0.22, 1.1]} />
          <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Glass cabin */}
        <mesh position={[0, 0.98, 0.25]} castShadow>
          <boxGeometry args={[1.6, 0.55, 2.1]} />
          <meshStandardMaterial
            color="#0d1520"
            metalness={0.9}
            roughness={0.1}
            transparent={showInterior}
            opacity={showInterior ? 0.25 : 1}
          />
        </mesh>
        {/* Rear spoiler */}
        <mesh position={[0, 0.95, 2.1]}>
          <boxGeometry args={[1.8, 0.06, 0.35]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Headlight bar */}
        <mesh position={[0, 0.62, -2.26]}>
          <boxGeometry args={[1.6, 0.06, 0.04]} />
          <meshStandardMaterial color="#e8f4ff" emissive="#cfe8ff" emissiveIntensity={2} />
        </mesh>
        {/* Tail light bar */}
        <mesh position={[0, 0.6, 2.26]}>
          <boxGeometry args={[1.7, 0.08, 0.04]} />
          <meshStandardMaterial color="#ff2020" emissive="#ff1010" emissiveIntensity={2} />
        </mesh>
        {/* Wheels */}
        {[
          [-0.95, -1.45],
          [0.95, -1.45],
          [-0.95, 1.45],
          [0.95, 1.45],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.36, z]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.28, 20]} />
            <meshStandardMaterial color="#151515" roughness={0.8} />
          </mesh>
        ))}
        {showInterior && (
          <group>
            {/* Seats */}
            {[-0.4, 0.4].map((x) => (
              <mesh key={x} position={[x, 0.85, 0.5]}>
                <boxGeometry args={[0.5, 0.6, 0.15]} />
                <meshStandardMaterial color="#2a2a2e" />
              </mesh>
            ))}
            <Dashboard />
          </group>
        )}
      </group>
    );
  },
);

/** Minimal cockpit: dashboard, wheel and a glowing center screen. */
export function Dashboard() {
  return (
    <group>
      <mesh position={[0, 0.88, -0.6]}>
        <boxGeometry args={[1.6, 0.18, 0.5]} />
        <meshStandardMaterial color="#1b1b20" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.02, -0.5]} rotation-x={-0.5}>
        <planeGeometry args={[0.45, 0.28]} />
        <meshStandardMaterial color="#0a1a2a" emissive="#2a7fff" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.4, 1.0, -0.35]} rotation-x={-1.1}>
        <torusGeometry args={[0.17, 0.025, 10, 28]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}
