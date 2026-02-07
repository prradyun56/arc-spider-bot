import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Vector3, MathUtils, Object3D } from "three";
import { getTerrainHeight } from "../utils/worldMath";

// Fix Type Errors by making all leg props optional
interface SpiderProps {
  data: {
    x: number; z: number; rot: number;
    tx: number; tz: number;
    l1_hip?: number; l1_knee?: number;
    l2_hip?: number; l2_knee?: number;
    l3_hip?: number; l3_knee?: number;
    l4_hip?: number; l4_knee?: number;
  } | null;
}

// CONFIG: "Heavy Industrial" Feel
const LEG_REACH = 2.5;    
const STEP_HEIGHT = 2.2;  
const BODY_HEIGHT = 7.5; 
const SPEED = 2.0;        

export function SpiderBot({ data }: SpiderProps) {
  const bodyRef = useRef<Group>(null);
  
  // Foot State
  const [footTargets] = useState(() => [
    new Vector3(-2, 5, -2), new Vector3(2, 5, -2),
    new Vector3(-2, 5, 2),  new Vector3(2, 5, 2),
  ]);
  
  const [stepProgress] = useState([0, 0, 0, 0]);
  const [stepStart] = useState([new Vector3(), new Vector3(), new Vector3(), new Vector3()]);
  
  const dummyBody = useMemo(() => new Object3D(), []);

  useFrame((state, delta) => {
    if (!data || !bodyRef.current) return;

    // --- 1. HEAVY BODY PHYSICS ---
    const targetX = data.x;
    const targetZ = data.z;
    const targetRot = data.rot;

    // "Drag" Physics - Body lags behind target
    const moveX = (targetX - bodyRef.current.position.x) * 2.0;
    const moveZ = (targetZ - bodyRef.current.position.z) * 2.0;
    
    bodyRef.current.position.x = MathUtils.lerp(bodyRef.current.position.x, targetX, 0.05);
    bodyRef.current.position.z = MathUtils.lerp(bodyRef.current.position.z, targetZ, 0.05);
    bodyRef.current.rotation.y = MathUtils.lerp(bodyRef.current.rotation.y, targetRot, 0.03);

    // Terrain Height + Bobbing
    const groundH = getTerrainHeight(bodyRef.current.position.x, bodyRef.current.position.z);
    
    const time = state.clock.elapsedTime;
    const breathe = Math.sin(time * 2) * 0.05;
    const walkBob = Math.sin(time * 8) * (Math.abs(moveX) + Math.abs(moveZ)) * 0.2;

    const targetY = groundH + BODY_HEIGHT + breathe + walkBob;
    bodyRef.current.position.y = MathUtils.lerp(bodyRef.current.position.y, targetY, 0.1);

    // Tilt into turns
    const tiltX = moveZ * 0.05; 
    const tiltZ = -moveX * 0.05;
    bodyRef.current.rotation.x = MathUtils.lerp(bodyRef.current.rotation.x, tiltX, 0.05);
    bodyRef.current.rotation.z = MathUtils.lerp(bodyRef.current.rotation.z, tiltZ, 0.05);

    // Update Virtual Body
    dummyBody.position.copy(bodyRef.current.position);
    dummyBody.rotation.copy(bodyRef.current.rotation);
    dummyBody.updateMatrixWorld();

    // --- 2. CAMERA CHASE ---
    const camOffset = new Vector3(0, 14, -18);
    camOffset.applyAxisAngle(new Vector3(0, 1, 0), bodyRef.current.rotation.y);
    const camTargetPos = bodyRef.current.position.clone().add(camOffset);
    
    // Camera Shake
    camTargetPos.y += Math.sin(time * 10) * (Math.abs(moveX) + Math.abs(moveZ)) * 0.1;

    state.camera.position.lerp(camTargetPos, 0.02);
    state.camera.lookAt(bodyRef.current.position);

    // --- 3. PROCEDURAL LEGS ---
    const legOffsets = [
      new Vector3(-1.4, 0, 1.4), new Vector3(1.4, 0, 1.4),
      new Vector3(-1.4, 0, -1.4), new Vector3(1.4, 0, -1.4),
    ];

    legOffsets.forEach((offset, i) => {
      const idealPos = offset.clone().applyMatrix4(dummyBody.matrixWorld);
      
      // Raycast to terrain (+5 offset)
      idealPos.y = getTerrainHeight(idealPos.x, idealPos.z) + 5;

      const dist = footTargets[i].distanceTo(idealPos);
      const isOppositeStepping = stepProgress[(i + 1) % 4] > 0;
      
      if (dist > LEG_REACH && stepProgress[i] === 0 && !isOppositeStepping) {
        stepProgress[i] = 0.01; 
        stepStart[i].copy(footTargets[i]); 
      }

      if (stepProgress[i] > 0) {
        stepProgress[i] += delta * SPEED;
        if (stepProgress[i] >= 1) {
          stepProgress[i] = 0;
          footTargets[i].copy(idealPos);
        } else {
          const t = stepProgress[i];
          const easeT = 1 - (1 - t) * (1 - t); // Stomp ease
          footTargets[i].lerpVectors(stepStart[i], idealPos, easeT);
          footTargets[i].y = MathUtils.lerp(stepStart[i].y, idealPos.y, easeT) + Math.sin(t * Math.PI) * STEP_HEIGHT;
        }
      }
    });
  });

  return (
    <group ref={bodyRef}>
      {/* Heavy Industrial Body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.0, 2.4]} />
        <meshStandardMaterial color="#111" roughness={0.7} metalness={0.5} />
      </mesh>
      
      {/* Sensor Array Housing */}
      <mesh position={[0, 0.5, 0.8]}>
        <boxGeometry args={[1.2, 0.4, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* The Red Eye (FIXED: Rotation is on Mesh, not Geometry) */}
      <mesh position={[0, 0.5, 1.1]} rotation={[0, 0, Math.PI / 2]}>
         <cylinderGeometry args={[0.1, 0.1, 1.0, 8]} />
         <meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={3} toneMapped={false} />
      </mesh>

      {/* Legs */}
      {[0, 1, 2, 3].map(i => (
        <IKLeg key={i} index={i} target={footTargets[i]} bodyPos={bodyRef} />
      ))}
    </group>
  );
}

// --- IK LEG COMPONENT ---
function IKLeg({ index, target, bodyPos }: { index: number, target: Vector3, bodyPos: React.MutableRefObject<Group | null> }) {
  const hipRef = useRef<Group>(null);
  const kneeRef = useRef<Group>(null);
  const UPPER_LEN = 1.8; 
  const LOWER_LEN = 2.8;

  useFrame(() => {
    if (!hipRef.current || !bodyPos.current) return;

    const localTarget = target.clone();
    bodyPos.current.worldToLocal(localTarget);
    
    const xMount = index % 2 === 0 ? -1.0 : 1.0; 
    const zMount = index < 2 ? 1.0 : -1.0;
    localTarget.x -= xMount;
    localTarget.z -= zMount;

    const dist = localTarget.length();
    const safeDist = Math.min(dist, UPPER_LEN + LOWER_LEN - 0.01);

    const cosKnee = (safeDist*safeDist - UPPER_LEN*UPPER_LEN - LOWER_LEN*LOWER_LEN) / (2 * UPPER_LEN * LOWER_LEN);
    const kneeAngle = Math.acos(Math.max(-1, Math.min(1, cosKnee)));

    const angleToTarget = Math.atan2(localTarget.y, Math.sqrt(localTarget.x*localTarget.x + localTarget.z*localTarget.z));
    const cosHip = (safeDist*safeDist + UPPER_LEN*UPPER_LEN - LOWER_LEN*LOWER_LEN) / (2 * safeDist * UPPER_LEN);
    const hipAngleOffset = Math.acos(Math.max(-1, Math.min(1, cosHip)));
    const hipPitch = -angleToTarget + hipAngleOffset;
    const hipYaw = Math.atan2(localTarget.z, localTarget.x);

    const baseRot = index % 2 === 0 ? Math.PI : 0; 
    hipRef.current.rotation.y = -hipYaw + baseRot + Math.PI/2; 
    hipRef.current.rotation.x = hipPitch; 
    
    if (kneeRef.current) kneeRef.current.rotation.x = -kneeAngle;
  });

  const isLeft = index % 2 === 0;
  const xMount = isLeft ? -1.0 : 1.0;
  const zMount = index < 2 ? 1.0 : -1.0;

  return (
    <group position={[xMount, 0, zMount]}>
      <group ref={hipRef}>
        <mesh rotation={[0, 0, Math.PI/2]}><sphereGeometry args={[0.4]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh position={[0, 0, -0.9]} rotation={[Math.PI/2, 0, 0]}><boxGeometry args={[0.3, 1.8, 0.3]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
        <group position={[0, 0, -1.8]} ref={kneeRef}>
           <mesh><sphereGeometry args={[0.3]} /><meshStandardMaterial color="#ff3300" /></mesh>
           <mesh position={[0, 0, -1.4]} rotation={[Math.PI/2, 0, 0]}><cylinderGeometry args={[0.15, 0.08, 2.8]} /><meshStandardMaterial color="#111" /></mesh>
           <mesh position={[0, 0, -2.8]}><coneGeometry args={[0.1, 0.3]} /><meshStandardMaterial color="#555" /></mesh>
        </group>
      </group>
    </group>
  );
}