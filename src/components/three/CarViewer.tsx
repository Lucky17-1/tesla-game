import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { useState } from "react";
import { CarModel } from "./CarModel";

/** Exterior orbit view + interior cockpit view of the concept car stand-in. */
export default function CarViewer() {
  const [mode, setMode] = useState<"exterior" | "interior">("exterior");
  const interior = mode === "interior";
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-card">
      <Canvas key={mode} dpr={[1, 1.75]} camera={interior ? { position: [-0.4, 1.2, 0.6], fov: 70 } : { position: [5, 2.4, 5.5], fov: 40 }}>
        <color attach="background" args={["#121218"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 4]} intensity={1.4} />
        <Environment>
          <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={1} color="#ff6b6b" position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        </Environment>
        <CarModel showInterior={interior} />
        {!interior && <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.5} far={3} />}
        <OrbitControls
          target={interior ? [-0.4, 1.05, -0.6] : [0, 0.6, 0]}
          enablePan={false}
          minDistance={interior ? 0.1 : 4}
          maxDistance={interior ? 1.2 : 11}
          maxPolarAngle={Math.PI / 2.05}
          autoRotate={!interior}
          autoRotateSpeed={0.8}
        />
      </Canvas>
      <div className="absolute left-3 top-3 flex gap-2">
        {(["exterior", "interior"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize backdrop-blur ${mode === m ? "bg-primary text-primary-foreground" : "bg-background/70 text-foreground"}`}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="absolute bottom-2 right-3 text-[11px] text-muted-foreground">Drag to look around · temporary original model</p>
    </div>
  );
}
