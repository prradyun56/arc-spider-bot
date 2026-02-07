"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { SpiderBot } from "@/components/SpiderBot";
import { VoxelTerrain } from "@/components/VoxelTerrain";
import { DustParticles } from "@/components/DustParticles";

// ✅ UPDATE: This interface now matches the Python backend exactly
interface SpiderData {
  // Legs
  l1_hip: number; l1_knee: number;
  l2_hip: number; l2_knee: number;
  l3_hip: number; l3_knee: number;
  l4_hip: number; l4_knee: number;
  
  // Navigation (The new stuff!)
  x: number;
  z: number;
  rot: number;
  tx: number;
  tz: number;
  
  // Meta
  step: number;
  status: string;
}

export default function Home() {
  const [data, setData] = useState<SpiderData | null>(null);
  const [status, setStatus] = useState("DISCONNECTED 🔴");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      setStatus("ONLINE 🟢");
      console.log("Connected to Neural Net");
    };

    ws.onmessage = (event) => {
      try {
        const brainSignal = JSON.parse(event.data);
        setData(brainSignal);
      } catch (e) {
        console.error("Failed to parse neural signal", e);
      }
    };

    ws.onclose = () => setStatus("OFFLINE 🔴");

    return () => ws.close();
  }, []);

  return (
    <main className="h-screen w-full bg-black relative overflow-hidden">
      
      {/* --- HUD OVERLAY --- */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none font-mono">
        <div className="border-l-4 border-orange-600 pl-4 mb-6">
          <h1 className="text-5xl font-bold text-white tracking-tighter">ARC_SPIDER</h1>
          <p className="text-orange-500 text-sm tracking-widest mt-1">UNIT: MK-IV // MODE: SEEKING</p>
        </div>

        <div className="bg-black/80 backdrop-blur-md p-4 border border-white/10 rounded w-72 shadow-[0_0_15px_rgba(255,85,0,0.15)]">
          <h2 className="text-xs text-gray-500 mb-2 border-b border-gray-700 pb-1 flex justify-between">
            <span>LIVE TELEMETRY</span>
            <span className="text-green-500">CONNECTED</span>
          </h2>
          
          <div className="space-y-1 text-green-400 text-xs font-mono">
             {data ? (
               <>
                 <div className="flex justify-between pb-2 mb-2 border-b border-gray-800">
                    <span className="text-gray-400">TARGET_DIST</span> 
                    {/* Calculate distance to target for the UI */}
                    <span className="text-white font-bold">
                      {Math.sqrt(Math.pow(data.tx - data.x, 2) + Math.pow(data.tz - data.z, 2)).toFixed(2)}m
                    </span>
                 </div>
                 
                 {/* Legs Telemetry */}
                 {[1, 2, 3, 4].map((i) => {
                    const hipKey = `l${i}_hip` as keyof SpiderData;
                    const kneeKey = `l${i}_knee` as keyof SpiderData;
                    return (
                      <div key={i} className="flex justify-between">
                        <span className="text-orange-400/80">SRV_0{i}</span> 
                        <span className="text-gray-500">
                           H:{(data[hipKey] as number)?.toFixed(1)} / K:{(data[kneeKey] as number)?.toFixed(1)}
                        </span>
                      </div>
                    );
                 })}
               </>
             ) : (
               <div className="text-red-500 animate-pulse text-center">NO SIGNAL...</div>
             )}
          </div>
        </div>
      </div>

      {/* --- 3D SCENE --- */}
      <Canvas shadows camera={{ position: [12, 10, 12], fov: 35 }}>
        
        {/* Atmosphere */}
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 8, 35]} />
        
        {/* Lights */}
        <ambientLight intensity={0.2} />
        <spotLight position={[20, 30, 10]} angle={0.25} penumbra={1} intensity={100} castShadow />
        <pointLight position={[-15, 5, -15]} intensity={20} color="#ff6600" distance={40} />
        
        {/* The World Components */}
        <SpiderBot data={data} />
        <VoxelTerrain />
        <DustParticles />
        
        <Environment preset="night" />

        {/* Post-Processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.9} mipmapBlur intensity={1.5} radius={0.6} />
          <Noise opacity={0.1} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        {/* Controls */}
        <OrbitControls maxPolarAngle={Math.PI / 2.2} minDistance={5} maxDistance={40} />
      </Canvas>
    </main>
  );
}