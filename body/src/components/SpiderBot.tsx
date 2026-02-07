import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Group } from "three";

interface SpiderProps {
  data: {
    leg1: number;
    leg2: number;
    leg3: number;
    leg4: number;
  } | null;
}

export function SpiderBot({ data }: SpiderProps) {
  // Refs for the 4 legs to animate them directly
  const legsRef = useRef<(Group | null)[]>([]);

  // Animation Loop (60 FPS)
  useFrame(() => {
    if (!data) return;

    // Direct mapping: Backend Angle -> Frontend Rotation
    // We multiply by 1.5 to exaggerate the movement slightly for visual effect
    if (legsRef.current[0]) legsRef.current[0].rotation.x = data.leg1 * 1.5;
    if (legsRef.current[1]) legsRef.current[1].rotation.x = data.leg2 * 1.5;
    if (legsRef.current[2]) legsRef.current[2].rotation.z = data.leg3 * 1.5;
    if (legsRef.current[3]) legsRef.current[3].rotation.z = data.leg4 * 1.5;
  });

  // Arc Raiders Color Palette
  const armorColor = "#1a1a1a"; // Matte Black
  const jointColor = "#444444"; // Dark Grey mechanism
  const glowColor = "#ff5500";  // Radioactive Orange

  return (
    <group position={[0, 0, 0]}>
      {/* --- THE CORE (HEAD) --- */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.6, 1.5]} />
        <meshStandardMaterial 
          color={armorColor} 
          roughness={0.2} 
          metalness={0.8} 
        />
      </mesh>
      
      {/* --- SENSOR ARRAY (Glowing Eye) --- */}
      <mesh position={[0, 1.1, 0.65]}>
        <boxGeometry args={[1.2, 0.15, 0.2]} />
        <meshStandardMaterial 
          color={glowColor} 
          emissive={glowColor} 
          emissiveIntensity={3} 
          toneMapped={false} 
        />
      </mesh>

      {/* --- LEGS --- */}
      {/* We generate 4 legs and position them at the corners */}
      {[0, 1, 2, 3].map((i) => {
        // Calculate corner positions: FL, FR, BL, BR
        const isLeft = i % 2 === 0;
        const isFront = i < 2;
        const xPos = isLeft ? -0.9 : 0.9;
        const zPos = isFront ? -0.9 : 0.9;

        return (
          <group 
            key={i} 
            ref={(el) => { legsRef.current[i] = el; }} 
            position={[xPos, 1, zPos]}
          >
            {/* The Hip Joint (Sphere) */}
            <mesh position={[0, 0, 0]}> 
              <sphereGeometry args={[0.3]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            
            {/* The Leg Strut (Vertical) */}
            <mesh position={[0, -1.2, 0]} castShadow>
              <boxGeometry args={[0.2, 2.5, 0.2]} />
              <meshStandardMaterial color={jointColor} roughness={0.7} />
            </mesh>
            
            {/* The Foot (Contact Point) */}
            <mesh position={[0, -2.5, 0]}>
              <cylinderGeometry args={[0.05, 0.15, 0.5]} />
              <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}