import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import { Radio, Compass, Eye } from "lucide-react";

// Convert Geographic Coordinates to 3D Cartesian Position on a Sphere of radius R
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Observation Buoy Pin Component
function BuoyStationPin({ station, onSelect, globeRadius = 3.2 }) {
  const [hovered, setHovered] = useState(false);
  const pinRef = useRef();

  const pos = useMemo(() => {
    return latLonToVector3(station.lat, station.lon, globeRadius);
  }, [station.lat, station.lon, globeRadius]);

  useFrame((state) => {
    if (pinRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4 + station.lat) * 0.25;
      pinRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={pos}>
      {/* Station marker pin */}
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
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={station.type === "tsunami" ? "#ef4444" : "#00ffcc"}
          emissive={station.type === "tsunami" ? "#991b1b" : "#00a896"}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Floating HTML label on hover */}
      {hovered && (
        <Html distanceFactor={8} zIndexRange={[100, 0]}>
          <div className="globe-buoy-tooltip">
            <div className="tooltip-title">{station.name}</div>
            <div className="tooltip-coords">{`${station.lat}°N, ${station.lon}°E`}</div>
            <div className="tooltip-desc">{station.desc}</div>
            <div className="tooltip-click-hint">Click to query this region</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Procedural Oceanic Globe Surface with Lat/Lon Grid
function GlobeSphere({ isPaused, onSelectStation }) {
  const globeGroupRef = useRef();
  const radius = 3.2;

  // Real INCOIS Indian Ocean observation stations
  const stations = [
    {
      id: "ad01",
      name: "OMNI Buoy AD01 (Arabian Sea)",
      lat: 15.0,
      lon: 69.0,
      type: "omni",
      desc: "Moored met-ocean buoy measuring SST, conductivity, and currents",
      query: "Show 3D temperature profile in Arabian Sea June 2025",
    },
    {
      id: "bd08",
      name: "OMNI Buoy BD08 (Bay of Bengal)",
      lat: 18.0,
      lon: 89.5,
      type: "omni",
      desc: "Continuous marine monitoring buoy in northern Bay of Bengal",
      query: "Show SSH evolution in the Bay of Bengal",
    },
    {
      id: "eq01",
      name: "RAMA / Equatorial Mooring",
      lat: 0.0,
      lon: 80.5,
      type: "rama",
      desc: "Deep ocean equatorial air-sea interaction buoy",
      query: "Show the current pattern during June 2025",
    },
    {
      id: "lk01",
      name: "Lakshadweep Sea Hydrographic Station",
      lat: 10.0,
      lon: 75.0,
      type: "argo",
      desc: "Argo float profile & depth transect corridor",
      query: "How did temperature change with depth at 10 N 75 E during June 2025?",
    },
  ];

  // Procedural Canvas Texture for Ocean and Landmasses
  const earthTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    // Deep ocean base
    ctx.fillStyle = "#091c34";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Latitude & Longitude Coordinate Lines
    ctx.strokeStyle = "rgba(0, 229, 255, 0.18)";
    ctx.lineWidth = 1.5;

    // Latitudes (every 15 deg)
    for (let lat = -90; lat <= 90; lat += 15) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Longitudes (every 15 deg)
    for (let lon = -180; lon <= 180; lon += 15) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = "rgba(0, 229, 255, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Stylized schematic landmass representation (Indian subcontinent & surrounding margins)
    ctx.fillStyle = "rgba(16, 50, 85, 0.85)";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 3;

    // Helper to map lat/lon to canvas coordinates
    const toXY = (lat, lon) => [
      ((lon + 180) / 360) * canvas.width,
      ((90 - lat) / 180) * canvas.height,
    ];

    // India triangular peninsula polygon
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

    // Indian Ocean water basin label
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "rgba(0, 229, 255, 0.4)";
    const [ioX, ioY] = toXY(-10, 75);
    ctx.fillText("INDIAN OCEAN", ioX - 80, ioY);

    const [asX, asY] = toXY(17, 63);
    ctx.font = "20px sans-serif";
    ctx.fillText("ARABIAN SEA", asX - 60, asY);

    const [bobX, bobY] = toXY(15, 90);
    ctx.fillText("BAY OF BENGAL", bobX - 65, bobY);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // Smooth continuous auto-rotation
  useFrame((state, delta) => {
    if (globeGroupRef.current && !isPaused) {
      globeGroupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group ref={globeGroupRef} rotation={[0.25, -Math.PI / 1.7, 0]}>
      {/* Ocean Globe Core */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.4}
          metalness={0.2}
          emissive="#041224"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Atmospheric Glow Ring */}
      <mesh scale={1.025}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Observation Station Pins */}
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

  return (
    <div className="ocean-globe-3d-card">
      <div className="globe-card-header">
        <div className="globe-header-left">
          <Radio size={15} className="header-icon pulse-icon" />
          <span className="globe-title">INCOIS Digital Ocean Twin (Revolving 3D)</span>
        </div>
        <span className="globe-hint">Click buoy to query</span>
      </div>

      <div
        className="globe-canvas-wrapper"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
      >
        <Canvas
          camera={{ position: [0, 1.5, 7.8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={1.1} />
          <directionalLight position={[10, 12, 10]} intensity={1.8} color="#ffffff" />
          <directionalLight position={[-8, -5, -6]} intensity={0.5} color="#007799" />

          <OrbitControls
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
            <span>OMNI Buoy Stations</span>
          </div>
          <div className="legend-item">
            <span className="buoy-dot cyan"></span>
            <span>Argo Transect Corridor</span>
          </div>
        </div>
      </div>
    </div>
  );
}
