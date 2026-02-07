"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { SpiderBot } from "@/components/SpiderBot"; // Import our new robot

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("DISCONNECTED 🔴");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => setStatus("CONNECTED 🟢");
    ws.onmessage = (event) => setData(JSON.parse(event.data));
    ws.onclose = () => setStatus("DISCONNECTED 🔴");

    return () => ws.close();
  }, []);

  return (
    <main className="h-screen w-full bg-black relative overflow-hidden">
      
      {/* --- HUD OVERLAY (The "Hacker" UI) --- */}
      <div className="absolute top-4 left-4 z-10 font-mono text-green-500 pointer-events-none">
        <h1 className="text-4xl font-bold tracking-tighter">ARC_SPIDER_V1</h1>
        <p className="mt-2 text-sm opacity-80">STATUS: {status}</p>
        <div className="mt-4 text-xs space-y-1">
           {data && Object.entries(data).map(([k, v]: any) => (
             <p key={k}>{k.toUpperCase()}: {v.toFixed(3)}</p>
           ))}
        </div>
      </div>

      {/* --- THE 3D WORLD --- */}
      <Canvas shadows camera={{ position: [3, 3, 5], fov: 50 }}>
        {/* 1. Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        {/* 2. Environment (Reflections) */}
        <Environment preset="city" />

        {/* 3. The Robot */}
        <SpiderBot data={data} />

        {/* 4. The Floor */}
        <ContactShadows position={[0, 0, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
        <gridHelper args={[20, 20, "#333", "#111"]} />

        {/* 5. Controls (Mouse Rotate) */}
        <OrbitControls />
      </Canvas>
    </main>
  );
}