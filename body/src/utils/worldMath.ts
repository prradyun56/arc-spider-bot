// body/src/utils/worldMath.ts

export function getTerrainHeight(x: number, z: number): number {
    // 1. Base Sine Wave Terrain
    // We use x/8 and z/8 for wider, easier-to-climb hills
    const base = Math.sin(x / 8) * Math.cos(z / 8) * 6;
    
    // 2. Secondary Detail (Small bumps)
    const detail = Math.sin(x / 2) * Math.cos(z / 2) * 0.5;
  
    let y = base + detail;
  
    // 3. The "Clearing" (Flat area at 0,0 so it doesn't spawn inside a wall)
    const dist = Math.sqrt(x * x + z * z);
    if (dist < 8) {
       // Smoothly flatten ground near center
       y = y * (dist / 8); 
    }
    
    // Shift everything down so peaks aren't too high
    return y - 4; 
  }