import { useMemo, useRef, useLayoutEffect } from "react";
import { InstancedMesh, Object3D, Color } from "three";
import { getTerrainHeight } from "../utils/worldMath"; // Import the math

export function VoxelTerrain() {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 60; // Larger world (60x60)
  const size = 2;

  const { particles, colors } = useMemo(() => {
    const tempParticles = [];
    const tempColors = [];
    
    const colorLow = new Color("#050505"); 
    const colorHigh = new Color("#552200"); 

    for (let x = 0; x < count; x++) {
      for (let z = 0; z < count; z++) {
        const xPos = (x - count / 2) * size;
        const zPos = (z - count / 2) * size;
        
        // USE THE SHARED MATH
        const yPos = getTerrainHeight(xPos, zPos);

        tempParticles.push({ x: xPos, y: yPos, z: zPos });

        // Color logic
        const mixedColor = colorLow.clone().lerp(colorHigh, (yPos + 5) / 10);
        tempColors.push(mixedColor.r, mixedColor.g, mixedColor.b);
      }
    }
    return { particles: tempParticles, colors: new Float32Array(tempColors) };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new Object3D();
    
    particles.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(0.95, 1, 0.95);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.array = colors;
        meshRef.current.instanceColor.needsUpdate = true;
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [particles, colors]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count * count]} receiveShadow castShadow>
      <boxGeometry args={[size, size * 5, size]} /> 
      <meshStandardMaterial roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}