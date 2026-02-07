import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
// @ts-ignore
import * as random from "maath/random/dist/maath-random.esm";

export function DustParticles() {
  // FIX: Added 'null' inside () to satisfy TypeScript
  const ref = useRef<any>(null); 
  
  // Generate 200 random points inside a sphere of radius 15
  const sphere = random.inSphere(new Float32Array(200 * 3), { radius: 15 });

  useFrame((state, delta) => {
    // Make them rotate slowly
    if (ref.current) {
        ref.current.rotation.x -= delta / 10;
        ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#ffaa00" // Rust colored dust
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  );
}