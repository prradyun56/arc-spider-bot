"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { SpiderBot } from "@/components/SpiderBot";

// Define the shape of our new 8-joint data
interface SpiderData {
  l1_hip: number; l1_knee: number;
  l2_hip: number; l2_knee: number;
  l3_hip: number; l3_knee: number;
  l4_hip: number; l4_knee: number;
  step: number;
  status: string;
}

export default function Home() {
  const [data, setData] = useState<SpiderData | null>(null);
  const [status, setStatus] = useState("DISCONNECTED 🔴");

  useEffect(() => {
    // Connect to the Python Brain
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

    // Cleanup on unmount
    return () => ws.close();
  }, []);

  return (
    <main className="h-screen w-full bg-black relative overflow-hidden">
      
      {/* --- HUD OVERLAY (The Hacker UI) --- */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none font-mono">
        {/* Title Block */}
        <div className="border-l-4 border-orange-600 pl-4 mb-6">
          <h1 className="text-5xl font-bold text-white tracking-tighter">ARC_SPIDER</h1>
          <p className="text-orange-500 text-sm tracking-widest mt-1">UNIT: MK-II // STATUS: {status}</p>
        </div>

        {/* Telemetry Block */}
        <div className="bg-black/80 backdrop-blur-md p-4 border border-white/10 rounded w-72 shadow-[0_0_15px_rgba(255,85,0,0.15)]">
          <h2 className="text-xs text-gray-500 mb-2 border-b border-gray-700 pb-1 flex justify-between">
            <span>LIVE TELEMETRY</span>
            <span className="text-orange-500">8-AXIS</span>
          </h2>
          
          <div className="space-y-2 text-green-400 text-xs font-mono">
             {data ? (
               <>
                 <div className="flex justify-between border-b border-green-900/30 pb-1 mb-2">
                    <span className="text-gray-400">STEP_COUNT</span> 
                    <span className="text-white font-bold">{data.step}</span>
                 </div>
                 
                 {/* Dynamic Rows for all 4 Legs */}
                 {[1, 2, 3, 4].map((i) => {
                    // TypeScript trick to access dynamic keys safely
                    const hipKey = `l${i}_hip` as keyof SpiderData;
                    const kneeKey = `l${i}_knee` as keyof SpiderData;
                    const hipVal = (data[hipKey] as number)?.toFixed(2) || "0.00";
                    const kneeVal = (data[kneeKey] as number)?.toFixed(2) || "0.00";

                    return (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-orange-400/80">LEG_0{i}</span> 
                        <div className="flex gap-3">
                           <span className="w-16 text-right"><span className="text-gray-600">H:</span>{hipVal}</span>
                           <span className="w-16 text-right"><span className="text-gray-600">K:</span>{kneeVal}</span>
                        </div>
                      </div>
                    );
                 })}
               </>
             ) : (
               <div className="text-red-500 animate-pulse py-2 text-center border border-red-900/50 bg-red-900/10">
                 NO NEURAL LINK DETECTED...
               </div>
             )}
          </div>
        </div>
      </div>

      {/* --- 3D SCENE --- */}
      <Canvas shadows camera={{ position: [5, 5, 7], fov: 45 }}>
        {/* 1. Lighting Setup (Dark & Cinematic) */}
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        
        <ambientLight intensity={0.4} />
        <spotLight 
          position={[10, 15, 10]} 
          angle={0.3} 
          penumbra={1} 
          intensity={80} 
          castShadow 
          shadow-bias={-0.0001}
        />
        <pointLight position={[-10, -10, -10]} intensity={10} color="#0040ff" />
        
        {/* 2. The Robot (Now accepting the 8-joint data) */}
        <SpiderBot data={data} />

        {/* 3. The Environment */}
        <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.5} far={10} color="#000000" />
        <Grid 
            position={[0, -0.01, 0]} 
            args={[30, 30]} 
            cellColor="#222" 
            sectionColor="#444" 
            fadeDistance={20} 
            infiniteGrid 
        />
        <Environment preset="city" />

        {/* 4. Post-Processing (The Retro Look) */}
        <EffectComposer>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.2} radius={0.5} />
          <Noise opacity={0.06} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

        {/* 5. Controls */}
        <OrbitControls maxPolarAngle={Math.PI / 2} minDistance={3} maxDistance={15} />
      </Canvas>
    </main>
  );
}