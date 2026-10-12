import React, { useRef, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Radio, RotateCcw } from "lucide-react";

// Convert Geographic Coordinates to 3D Cartesian Position on Three.js Sphere
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -radius * Math.cos(theta) * Math.sin(phi);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(theta) * Math.sin(phi);
  return new THREE.Vector3(x, y, z);
}

// Observation Buoy Pin Component with Pulsing Halo
function BuoyStationPin({ station, onSelect, globeRadius = 3.25 }) {
  const [hovered, setHovered] = useState(false);
  const pinRef = useRef();
  const ringRef = useRef();

  const pos = useMemo(() => {
    return latLonToVector3(station.lat, station.lon, globeRadius * 1.01);
  }, [station.lat, station.lon, globeRadius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 2.8 + station.lat;
    if (pinRef.current) {
      const s = 1 + Math.sin(t) * 0.2;
      pinRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      const ringScale = 1 + ((state.clock.elapsedTime * 1.4 + station.lon * 0.1) % 2.2);
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      ringRef.current.material.opacity = Math.max(0, 1 - (ringScale - 1) / 1.2);
    }
  });

  const pinColor =
    station.type === "omni"
      ? "#00ffcc"
      : station.type === "tsunami"
      ? "#ef4444"
      : "#38bdf8";

  return (
    <group position={pos}>
      {/* 3D Station Marker Sphere */}
      <mesh
        ref={pinRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect(station);
        }}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color={pinColor}
          emissive={pinColor}
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>

      {/* Pulsing Beacon Halo Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.085, 0.13, 24]} />
        <meshBasicMaterial
          color={pinColor}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Interactive Telemetry Tooltip */}
      {hovered && (
        <Html distanceFactor={7.8} zIndexRange={[150, 0]}>
          <div className="globe-buoy-tooltip">
            <div className="tooltip-badge">
              {station.type === "omni"
                ? "INCOIS OMNI BUOY"
                : station.type === "tsunami"
                ? "ITEWC TSUNAMI BPR"
                : "ARGO PROFILER CORRIDOR"}
            </div>
            <div className="tooltip-title">{station.name}</div>
            <div className="tooltip-coords">{`${station.lat.toFixed(1)}°N, ${station.lon.toFixed(1)}°E`}</div>
            <div className="tooltip-desc">{station.desc}</div>
            <div className="tooltip-action">⚡ Click to load 3D analysis in GYANI</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Photorealistic NASA Blue Marble Earth Mesh
function EarthSphere({ radius = 3.25 }) {
  const earthMap = useTexture("/textures/earth-blue-marble.jpg");
  earthMap.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={earthMap}
        roughness={0.65}
        metalness={0.08}
      />
    </mesh>
  );
}

// Fallback sphere while texture loads
function FallbackSphere({ radius = 3.25 }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial
        color="#082548"
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

// Revolving Ocean Twin Globe Component
function RealEarthGlobe({ isPaused, onSelectStation }) {
  const globeGroupRef = useRef();
  const radius = 3.25;

  // Real INCOIS Observation Network Stations
  const stations = [
    {
      id: "ad01",
      name: "OMNI AD01 (Arabian Sea)",
      lat: 15.0,
      lon: 69.0,
      type: "omni",
      desc: "Moored met-ocean buoy capturing SST, surface salinity, wave spectra, and ADCP currents.",
      query: "Show 3D temperature profile in Arabian Sea June 2025",
    },
    {
      id: "bd08",
      name: "OMNI BD08 (Bay of Bengal)",
      lat: 18.0,
      lon: 89.5,
      type: "omni",
      desc: "Deep-sea mooring monitoring monsoon depressions, upper ocean heat content, and cyclone tracking.",
      query: "Show SSH evolution in the Bay of Bengal",
    },
    {
      id: "rama01",
      name: "RAMA Array (Equatorial Indian Ocean)",
      lat: 0.0,
      lon: 80.5,
      type: "omni",
      desc: "Research Moored Array for African-Asian-Australian Monsoon Analysis and Prediction (RAMA).",
      query: "Show the current pattern during June 2025",
    },
    {
      id: "lk01",
      name: "Lakshadweep Corridor (Kavaratti)",
      lat: 10.5,
      lon: 72.6,
      type: "argo",
      desc: "High-density robotic Argo hydrographic transect sampling down to 2,000m depth.",
      query: "How did temperature change with depth at 10 N 75 E during June 2025?",
    },
    {
      id: "and01",
      name: "Andaman Sea Station (Port Blair)",
      lat: 11.6,
      lon: 92.7,
      type: "tsunami",
      desc: "Indian Tsunami Early Warning Centre (ITEWC) coastal tide gauge & bottom pressure recorder.",
      query: "Show SSH evolution in the Bay of Bengal",
    },
  ];

  // Smooth revolving rotation around Earth's tilted axial axis
  useFrame((state, delta) => {
    if (globeGroupRef.current && !isPaused) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }
  });

  // Earth's Axial Tilt is 23.4° (0.41 rad); initial Y rotation centers the Indian Ocean Realm (75°E)
  return (
    <group ref={globeGroupRef} rotation={[0.41, 3.40, 0]}>
      {/* 1. Authentic Photographic NASA Blue Marble Planet */}
      <Suspense fallback={<FallbackSphere radius={radius} />}>
        <EarthSphere radius={radius} />
      </Suspense>

      {/* 2. Atmospheric Rayleigh Scattering Rim */}
      <mesh scale={1.018}>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Real INCOIS Observation Network Station Pins */}
      {stations.map((st) => (
        <BuoyStationPin
          key={st.id}
          station={st}
          globeRadius={radius}
          onSelect={onSelectStation}
        />
      ))}
    </group>
  );
}

export default function OceanGlobe3D({ onSelectStationQuery }) {
  const [isInteracting, setIsInteracting] = useState(false);
  const controlsRef = useRef();

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="ocean-globe-3d-card">
      <div className="globe-card-header">
        <div className="globe-header-left">
          <Radio size={14} className="header-icon pulse-icon" />
          <span className="globe-title">INCOIS Digital Ocean Twin (Revolving 3D)</span>
        </div>
        <div className="globe-header-actions">
          <span className="globe-live-tag">NASA Blue Marble · Telemetry Active</span>
          <button
            type="button"
            onClick={handleReset}
            className="globe-reset-btn"
            title="Reset globe view to Indian Ocean"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div
        className="globe-canvas-wrapper"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
      >
        <Canvas
          camera={{ position: [0, 1.0, 7.8], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 2]}
        >
          {/* Natural planetary lighting */}
          <ambientLight intensity={1.1} color="#f0f9ff" />
          <directionalLight position={[10, 12, 10]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-10, -5, -8]} intensity={0.5} color="#007799" />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={4.2}
            maxDistance={14}
            autoRotate={false}
          />

          <RealEarthGlobe
            isPaused={isInteracting}
            onSelectStation={(st) => {
              if (onSelectStationQuery) onSelectStationQuery(st.query);
            }}
          />
        </Canvas>

        {/* Observation Network Color-Coded Legend */}
        <div className="globe-legend-overlay">
          <div className="legend-item">
            <span className="buoy-dot green"></span>
            <span>INCOIS OMNI Moored Buoys</span>
          </div>
          <div className="legend-item">
            <span className="buoy-dot cyan"></span>
            <span>Robotic Argo Hydrographic Transects</span>
          </div>
          <div className="legend-item">
            <span className="buoy-dot red"></span>
            <span>ITEWC Tsunami Bottom Recorders (BPR)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
