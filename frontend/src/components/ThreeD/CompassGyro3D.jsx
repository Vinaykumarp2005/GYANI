import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function GyroRings() {
  const outerRingRef = useRef();
  const midRingRef = useRef();
  const innerRingRef = useRef();
  const needleRef = useRef();

  useFrame((state, delta) => {
    if (outerRingRef.current) outerRingRef.current.rotation.y += delta * 0.7;
    if (midRingRef.current) midRingRef.current.rotation.x += delta * 0.9;
    if (innerRingRef.current) innerRingRef.current.rotation.z += delta * 1.2;
    if (needleRef.current) needleRef.current.rotation.y += delta * 0.3;
  });

  return (
    <group scale={1.3}>
      {/* Outer Gimbal Ring */}
      <mesh ref={outerRingRef}>
        <torusGeometry args={[1.5, 0.06, 16, 48]} />
        <meshStandardMaterial color="#c29b38" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Mid Gimbal Ring */}
      <mesh ref={midRingRef}>
        <torusGeometry args={[1.2, 0.05, 16, 48]} />
        <meshStandardMaterial color="#00e5ff" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Inner Gimbal Ring */}
      <mesh ref={innerRingRef}>
        <torusGeometry args={[0.9, 0.04, 16, 36]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Center Navigational Needle */}
      <group ref={needleRef}>
        <mesh position={[0, 0.4, 0]}>
          <coneGeometry args={[0.15, 0.8, 8]} />
          <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.8, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default function CompassGyro3D() {
  return (
    <div className="compass-gyro-3d-wrapper" title="INCOIS Precision Marine Gyroscope (Interactive 3D)">
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-4, -4, 2]} intensity={0.8} color="#00e5ff" />
        <GyroRings />
      </Canvas>
    </div>
  );
}
