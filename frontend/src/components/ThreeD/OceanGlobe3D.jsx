import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { Radio, RotateCcw, MapPin, Sparkles } from "lucide-react";

// Convert Geographic Coordinates to 3D Cartesian Position on a Sphere
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Observation Buoy Pin Component with Pulsing Halo
function BuoyStationPin({ station, onSelect, globeRadius = 3.25 }) {
  const [hovered, setHovered] = useState(false);
  const pinRef = useRef();
  const ringRef = useRef();

  const pos = useMemo(() => {
    return latLonToVector3(station.lat, station.lon, globeRadius);
  }, [station.lat, station.lon, globeRadius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 3 + station.lat;
    if (pinRef.current) {
      const s = 1 + Math.sin(t) * 0.2;
      pinRef.current.scale.set(s, s, s);
    }
    if (ringRef.current) {
      const ringScale = 1 + ((state.clock.elapsedTime * 1.5 + station.lon) % 2);
      ringRef.current.scale.set(ringScale, ringScale, ringScale);
      ringRef.current.material.opacity = Math.max(0, 1 - (ringScale - 1));
    }
  });

  return (
    <group position={pos}>
      {/* Station marker sphere */}
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
          color={station.type === "omni" ? "#00ffcc" : "#38bdf8"}
          emissive={station.type === "omni" ? "#00a896" : "#0284c7"}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Pulsing beacon ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.09, 0.13, 16]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating tooltip */}
      {hovered && (
        <Html distanceFactor={7.5} zIndexRange={[120, 0]}>
          <div className="globe-buoy-tooltip">
            <div className="tooltip-badge">INCOIS BUOY STATION</div>
            <div className="tooltip-title">{station.name}</div>
            <div className="tooltip-coords">{`${station.lat}°N, ${station.lon}°E`}</div>
            <div className="tooltip-desc">{station.desc}</div>
            <div className="tooltip-action">⚡ Click station to explore in 3D</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Procedural Oceanic Globe Core
function GlobeSphere({ isPaused, onSelectStation }) {
  const globeGroupRef = useRef();
  const radius = 3.25;

  const stations = [
    {
      id: "ad01",
      name: "OMNI Buoy AD01 (Arabian Sea)",
      lat: 15.0,
      lon: 69.0,
      type: "omni",
      desc: "Moored met-ocean buoy capturing SST, surface salinity, and acoustic current profiler data.",
      query: "Show 3D temperature profile in Arabian Sea June 2025",
    },
    {
      id: "bd08",
      name: "OMNI Buoy BD08 (Bay of Bengal)",
      lat: 18.0,
      lon: 89.5,
      type: "omni",
      desc: "Deep-sea buoy tracking monsoon circulation and cyclonic storm surges.",
      query: "Show SSH evolution in the Bay of Bengal",
    },
    {
      id: "eq01",
      name: "RAMA / Equatorial Mooring",
      lat: 0.0,
      lon: 80.5,
      type: "omni",
      desc: "Air-sea interaction station monitoring equatorial undercurrents and IOD anomalies.",
      query: "Show the current pattern during June 2025",
    },
    {
      id: "lk01",
      name: "Lakshadweep Hydrographic Transect",
      lat: 10.0,
      lon: 75.0,
      type: "argo",
      desc: "High-resolution vertical thermocline corridor sampled by robotic profiling floats.",
      query: "How did temperature change with depth at 10 N 75 E during June 2025?",
    },
  ];

  const earthTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    // Deep oceanic background
    ctx.fillStyle = "#081b33";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle bathymetric gradient zones
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "rgba(8, 27, 51, 1)");
    grad.addColorStop(0.5, "rgba(11, 38, 72, 1)");
    grad.addColorStop(1, "rgba(8, 27, 51, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Latitude & Longitude Coordinate Lines
    ctx.strokeStyle = "rgba(0, 229, 255, 0.15)";
    ctx.lineWidth = 1.2;

    for (let lat = -90; lat <= 90; lat += 15) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator line
    ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    const toXY = (lat, lon) => [
      ((lon + 180) / 360) * canvas.width,
      ((90 - lat) / 180) * canvas.height,
    ];

    // Landmass rendering (India subcontinent)
    ctx.fillStyle = "rgba(19, 58, 98, 0.95)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
    ctx.lineWidth = 2.5;

    const indiaPoints = [
      [35, 74], [32, 78], [28, 88], [24, 88], [21, 87], [16, 82], [13, 80],
      [8.1, 77.5], [12, 75], [16, 73], [20, 72.8], [24, 69], [25, 68],
      [30, 70], [35, 74]
    ];

    ctx.beginPath();
    indiaPoints.forEach(([lat, lon], idx) => {
      const [x, y] = toXY(lat, lon);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sri Lanka
    const [slX, slY] = toXY(7.5, 80.5);
    ctx.beginPath();
    ctx.ellipse(slX, slY, 18, 28, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Arabian Peninsula
    const arabiaPoints = [
      [30, 35], [30, 48], [24, 56], [22, 59], [17, 54], [13, 45],
      [13, 43], [20, 39], [30, 35]
    ];
    ctx.beginPath();
    arabiaPoints.forEach(([lat, lon], idx) => {
      const [x, y] = toXY(lat, lon);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Water basin labels
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "rgba(56, 189, 248, 0.5)";
    const [ioX, ioY] = toXY(-10, 75);
    ctx.fillText("INDIAN OCEAN", ioX - 85, ioY);

    ctx.font = "20px sans-serif";
    const [asX, asY] = toXY(17, 63);
    ctx.fillText("ARABIAN SEA", asX - 60, asY);

    const [bobX, bobY] = toXY(15, 90);
    ctx.fillText("BAY OF BENGAL", bobX - 65, bobY);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (globeGroupRef.current && !isPaused) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={globeGroupRef} rotation={[0.22, -Math.PI / 1.75, 0]}>
      {/* Ocean Globe Core */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.35}
          metalness={0.15}
          emissive="#031022"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Atmospheric Glow Ring */}
      <mesh scale={1.028}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Buoy Stations */}
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
    if (controlsRef.current) controlsRef.current.reset();
  };

  return (
    <div className="ocean-globe-3d-card">
      <div className="globe-card-header">
        <div className="globe-header-left">
          <Radio size={14} className="header-icon pulse-icon" />
          <span className="globe-title">INCOIS Digital Ocean Twin (Revolving 3D)</span>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="globe-reset-btn"
          title="Reset globe view"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      <div
        className="globe-canvas-wrapper"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
      >
        <Canvas
          camera={{ position: [0, 1.4, 7.6], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[10, 12, 10]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-8, -5, -6]} intensity={0.5} color="#007799" />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={4.5}
            maxDistance={12}
            autoRotate={false}
          />

          <GlobeSphere
            isPaused={isInteracting}
            onSelectStation={(st) => {
              if (onSelectStationQuery) onSelectStationQuery(st.query);
            }}
          />
        </Canvas>

        <div className="globe-legend-overlay">
          <div className="legend-item">
            <span className="buoy-dot green"></span>
            <span>OMNI Moored Buoys</span>
          </div>
          <div className="legend-item">
            <span className="buoy-dot cyan"></span>
            <span>Argo Hydrographic Corridor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
