import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

interface SpiderProps {
  data: {
    l1_hip: number; l1_knee: number;
    l2_hip: number; l2_knee: number;
    l3_hip: number; l3_knee: number;
    l4_hip: number; l4_knee: number;
  } | null;
}

export function SpiderBot({ data }: SpiderProps) {
  // We need refs for Hips and Knees separately
  const hipsRef = useRef<(Group | null)[]>([]);
  const kneesRef = useRef<(Group | null)[]>([]);

  useFrame(() => {
    if (!data) return;

    const joints = [
      { h: data.l1_hip, k: data.l1_knee },
      { h: data.l2_hip, k: data.l2_knee },
      { h: data.l3_hip, k: data.l3_knee },
      { h: data.l4_hip, k: data.l4_knee },
    ];

    // Apply rotations
    joints.forEach((joint, i) => {
      if (hipsRef.current[i]) {
        // Hip rotates mostly on X axis (lifting up/down)
        hipsRef.current[i]!.rotation.x = joint.h * 1.5; 
      }
      if (kneesRef.current[i]) {
        // Knee rotates relative to the upper leg
        // We offset it slightly so it bends inward like a spider
        kneesRef.current[i]!.rotation.x = joint.k * 2.0; 
      }
    });
  });

  // Arc Raiders Palette
  const armorColor = "#0a0a0a"; // Deep Black
  const jointColor = "#444";    // Mechanism Grey
  const glowColor = "#ff5500";  // The Orange

  return (
    <group position={[0, 0, 0]}>
      {/* --- CORE --- */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.5, 1.4]} />
        <meshStandardMaterial color={armorColor} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Glowing Brain Core */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[0.5, 0.55, 0.5]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* --- LEGS GENERATOR --- */}
      {[0, 1, 2, 3].map((i) => {
        const isLeft = i % 2 === 0;
        const isFront = i < 2;
        const xBase = isLeft ? -0.7 : 0.7;
        const zBase = isFront ? -0.7 : 0.7;

        return (
          <group 
            key={i} 
            position={[xBase, 1.2, zBase]} 
            rotation={[0, isLeft ? 0 : Math.PI, 0]} // Flip right legs
          >
            {/* --- HIP JOINT (Pivot Point) --- */}
            <group ref={(el) => { hipsRef.current[i] = el; }}>
              
              {/* UPPER LEG (Femur) */}
              {/* It sticks out horizontally first */}
              <group rotation={[0, 0, isLeft ? 0.5 : -0.5]}> 
                <mesh position={[isLeft ? -0.6 : 0.6, 0, 0]} castShadow>
                  <boxGeometry args={[1.2, 0.3, 0.3]} />
                  <meshStandardMaterial color={jointColor} />
                </mesh>

                {/* --- KNEE JOINT --- */}
                {/* Located at the tip of the upper leg */}
                <group 
                  position={[isLeft ? -1.1 : 1.1, 0, 0]} 
                  ref={(el) => { kneesRef.current[i] = el; }}
                >
                  <mesh>
                    <sphereGeometry args={[0.25]} />
                    <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
                  </mesh>

                  {/* LOWER LEG (Tibia) */}
                  {/* Points downwards */}
                  <mesh position={[0, -1.2, 0]} rotation={[0, 0, isLeft ? -0.2 : 0.2]} castShadow>
                     {/* Tapered leg look */}
                    <cylinderGeometry args={[0.08, 0.02, 2.5]} />
                    <meshStandardMaterial color={armorColor} roughness={0.5} />
                  </mesh>

                </group>
              </group>
            </group>
          </group>
        );
      })}
    </group>
  );
}