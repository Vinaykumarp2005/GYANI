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

    // Deep oceanic background with radial depth
    const oceanGrad = ctx.createRadialGradient(
      canvas.width * 0.72, canvas.height * 0.45, 50,
      canvas.width * 0.72, canvas.height * 0.45, 900
    );
    oceanGrad.addColorStop(0, "#082548");
    oceanGrad.addColorStop(0.5, "#061a33");
    oceanGrad.addColorStop(1, "#030e1d");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Latitude & Longitude Coordinate Lines (Graticule)
    ctx.strokeStyle = "rgba(0, 229, 255, 0.12)";
    ctx.lineWidth = 1;

    for (let lat = -80; lat <= 80; lat += 20) {
      const y = ((90 - lat) / 180) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let lon = -180; lon <= 180; lon += 20) {
      const x = ((lon + 180) / 360) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Equator Line (Prominent)
    ctx.strokeStyle = "rgba(0, 229, 255, 0.35)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    const toXY = (lat, lon) => [
      ((lon + 180) / 360) * canvas.width,
      ((90 - lat) / 180) * canvas.height,
    ];

    // Helper to draw continent polygons
    const drawPolygon = (points, fillColor, strokeColor, strokeWidth = 2) => {
      ctx.beginPath();
      points.forEach(([lat, lon], idx) => {
        const [x, y] = toXY(lat, lon);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    };

    // 1. African Continent & Madagascar
    const africaPoints = [
      [37, 10], [30, 32], [22, 38], [12, 44], [12, 51], [2, 45],
      [-5, 40], [-15, 40], [-25, 34], [-34, 18], [-33, 26], [-28, 32],
      [-20, 35], [-12, 43], [0, 42], [10, 42], [15, 39], [22, 36],
      [31, 32], [37, 10]
    ];
    drawPolygon(africaPoints, "#0c3154", "#00bcd4", 2);

    // Madagascar
    const madagascarPoints = [
      [-12, 49], [-16, 50], [-25, 47], [-25, 44], [-16, 44], [-12, 49]
    ];
    drawPolygon(madagascarPoints, "#0c3154", "#00bcd4", 1.5);

    // 2. Arabian Peninsula
    const arabiaPoints = [
      [30, 35], [30, 48], [26, 51], [24, 56], [22, 59], [17, 54],
      [13, 48], [12, 44], [16, 42], [22, 39], [28, 35], [30, 35]
    ];
    drawPolygon(arabiaPoints, "#0c3154", "#00bcd4", 2);

    // 3. Indian Subcontinent (High visual prominence with Gold border)
    const indiaPoints = [
      [35, 74], [34, 77], [30, 81], [27, 88], [24, 89], [22, 89],
      [21.5, 87], [18, 84], [16, 82], [13, 80.3], [10, 79.8],
      [8.08, 77.55], [9.5, 76.3], [12.5, 75], [15.5, 73.8], [19, 72.8],
      [21, 72.6], [23, 68.5], [24.5, 68.5], [25, 70], [30, 71],
      [33, 72], [35, 74]
    ];
    drawPolygon(indiaPoints, "#103c68", "#facc15", 3);

    // Sri Lanka
    const [slX, slY] = toXY(7.5, 80.7);
    ctx.beginPath();
    ctx.ellipse(slX, slY, 12, 18, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = "#103c68";
    ctx.fill();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Southeast Asia & Sunda Shelf (Sumatra, Java, Malay Peninsula)
    const seAsiaPoints = [
      [23, 89], [22, 92], [16, 96], [10, 99], [3, 101], [1.3, 104],
      [6, 103], [12, 101], [18, 105], [22, 106], [24, 98], [23, 89]
    ];
    drawPolygon(seAsiaPoints, "#0c3154", "#00bcd4", 2);

    // Sumatra
    const sumatraPoints = [
      [5.5, 95.3], [2.5, 99], [-2, 103], [-5.5, 105.5], [-5, 104], [-2, 100], [2, 96], [5.5, 95.3]
    ];
    drawPolygon(sumatraPoints, "#0c3154", "#00bcd4", 1.8);

    // 5. Australia (Northwest Shelf)
    const ausPoints = [
      [-12, 131], [-15, 124], [-20, 119], [-22, 114], [-26, 113],
      [-32, 116], [-35, 118], [-35, 138], [-28, 138], [-12, 131]
    ];
    drawPolygon(ausPoints, "#0c3154", "#00bcd4", 2);

    // 6. Ocean Basin Typography
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
    const [ioX, ioY] = toXY(-8, 77);
    ctx.fillText("INDIAN OCEAN", ioX - 95, ioY);

    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
    const [asX, asY] = toXY(16, 64);
    ctx.fillText("ARABIAN SEA", asX - 65, asY);

    const [bobX, bobY] = toXY(15, 89);
    ctx.fillText("BAY OF BENGAL", bobX - 70, bobY);

    // 7. Dynamic Ocean Current Arcs (Somali Current & Monsoon Drift)
    ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    
    // Somali Current
    ctx.beginPath();
    const [sc1X, sc1Y] = toXY(-5, 42);
    const [sc2X, sc2Y] = toXY(12, 53);
    ctx.moveTo(sc1X, sc1Y);
    ctx.quadraticCurveTo(sc1X + 40, sc1Y - 60, sc2X, sc2Y);
    ctx.stroke();

    // Southwest Monsoon Current
    ctx.beginPath();
    const [mc1X, mc1Y] = toXY(6, 68);
    const [mc2X, mc2Y] = toXY(6, 92);
    ctx.moveTo(mc1X, mc1Y);
    ctx.lineTo(mc2X, mc2Y);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

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
    <group ref={globeGroupRef} rotation={[0.28, -Math.PI / 1.35, 0]}>
      {/* Ocean Globe Core */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.25}
          metalness={0.1}
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
