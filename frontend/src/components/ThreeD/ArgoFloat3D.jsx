import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Anchor, X, Info } from "lucide-react";

function ArgoFloatModel() {
  const floatGroupRef = useRef();

  useFrame((state, delta) => {
    if (floatGroupRef.current) {
      floatGroupRef.current.rotation.y += delta * 0.75;
      floatGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.12;
      floatGroupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.1) * 0.04;
    }
  });

  return (
    <group ref={floatGroupRef} scale={1.2} position={[0, 0, 0]}>
      {/* 1. Main Yellow Pressure Hull Cylinder */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 2.6, 32]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Identification Bands */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.25, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.56, 0.56, 0.25, 32]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>

      {/* 2. Top Endcap Collar */}
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.45, 0.55, 0.2, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 3. CTD Sensor Unit */}
      <mesh position={[0.2, 1.65, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35, 16]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 4. Satellite Antenna */}
      <mesh position={[-0.15, 1.95, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.95, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.15, 2.45, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </mesh>

      {/* 5. Bottom Buoyancy Bladder Engine */}
      <mesh position={[0, -1.45, 0]}>
        <coneGeometry args={[0.55, 0.35, 32]} rotation={[Math.PI, 0, 0]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -1.75, 0]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.4} roughness={0.3} />
      </mesh>
    </group>
  );
}

export default function ArgoFloat3D({ onClose }) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className="argo-float-modal-overlay" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="3D Argo Profiler Model">
      <div className="argo-float-3d-card" onClick={(e) => e.stopPropagation()}>
        <div className="float-card-header">
          <div className="float-header-title">
            <Anchor size={18} className="header-icon" />
            <span>INCOIS Argo Robotic Profiler (Revolving 3D)</span>
          </div>

          <div className="float-header-actions">
            <span className="float-spec-badge">0m - 2000m Depth Engine</span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="modal-close-btn"
                title="Close 3D Profiler View (Esc)"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="float-canvas-wrapper">
          <Canvas
            camera={{ position: [0, 0.3, 5.0], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
          >
            <ambientLight intensity={1.2} />
            <directionalLight position={[6, 8, 8]} intensity={1.8} color="#ffffff" />
            <directionalLight position={[-6, -4, -4]} intensity={0.4} color="#00e5ff" />
            <ArgoFloatModel />
          </Canvas>

          <div className="float-specs-overlay">
            <div className="spec-pill">
              <span className="spec-dot yellow"></span>
              <span>Aluminum Alloy Pressure Hull</span>
            </div>
            <div className="spec-pill">
              <span className="spec-dot white"></span>
              <span>Conductivity-Temperature-Depth (CTD) Unit</span>
            </div>
            <div className="spec-pill">
              <span className="spec-dot blue"></span>
              <span>Hydraulic Buoyancy Engine (200 Bar)</span>
            </div>
          </div>
        </div>

        <div className="float-info-bar">
          <Info size={16} className="info-icon" />
          <div>
            <strong style={{ color: "#f8fafc", display: "block", marginBottom: "2px" }}>
              10-Day Autonomous Hydrographic Mission Cycle
            </strong>
            <p>
              Argo floats sink to a drift depth of 1,000m for 9-10 days, dive to 2,000m, and record continuous salinity and temperature profiles during ascent before uplinking real-time CTD data to INCOIS via satellite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
