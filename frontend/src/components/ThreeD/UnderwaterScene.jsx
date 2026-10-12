import React, { useState, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import DepthLayerMesh from "./DepthLayerMesh";
import { Layers, RotateCcw, Maximize2, Eye, EyeOff } from "lucide-react";

function UnderwaterBoundingBox({ width, length, height, coords }) {
  const minLat = coords?.lats?.[0] ?? 5;
  const maxLat = coords?.lats?.[coords.lats.length - 1] ?? 25;
  const minLon = coords?.lons?.[0] ?? 55;
  const maxLon = coords?.lons?.[coords.lons.length - 1] ?? 85;

  return (
    <group>
      {/* Wireframe box showing ocean volume extent */}
      <mesh position={[0, -height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshBasicMaterial wireframe color="#1e3a5f" transparent opacity={0.35} />
      </mesh>

      {/* Surface rim highlight */}
      <lineSegments position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, length)]} />
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.7} />
      </lineSegments>

      {/* Axis annotations */}
      <Text position={[-width / 2, 0.4, length / 2]} fontSize={0.65} color="#00e5ff" anchorX="center" anchorY="bottom">
        {`${minLon}°E, ${minLat}°N`}
      </Text>
      <Text position={[width / 2, 0.4, length / 2]} fontSize={0.65} color="#00e5ff" anchorX="center" anchorY="bottom">
        {`${maxLon}°E, ${minLat}°N`}
      </Text>
      <Text position={[-width / 2, 0.4, -length / 2]} fontSize={0.65} color="#00e5ff" anchorX="center" anchorY="bottom">
        {`${minLon}°E, ${maxLat}°N`}
      </Text>
      <Text position={[width / 2, 0.4, -length / 2]} fontSize={0.65} color="#00e5ff" anchorX="center" anchorY="bottom">
        {`${maxLon}°E, ${maxLat}°N`}
      </Text>

      {/* Depth indicators */}
      <Text position={[-width / 2 - 1.2, 0, length / 2]} fontSize={0.55} color="#38bdf8" anchorX="right">
        Surface (0m)
      </Text>
      <Text position={[-width / 2 - 1.2, -height, length / 2]} fontSize={0.55} color="#38bdf8" anchorX="right">
        -200m
      </Text>
    </group>
  );
}

export default function UnderwaterScene({
  gridData,
  timeIndex = 0,
}) {
  const controlsRef = useRef();
  const [verticalExaggeration, setVerticalExaggeration] = useState(1);
  const [visibleDepths, setVisibleDepths] = useState({});

  const layers = gridData?.layers || [];
  const coords = gridData?.coordinates || {};
  const bounds = gridData?.value_bounds || { min: 10, max: 32 };

  // Aspect ratio for spatial bounds
  const sceneWidth = 18;
  const sceneLength = 14;
  const maxDepthVal = 200;
  const baseDepthHeight = 7 * verticalExaggeration;

  // Initialize visibility on first load
  const isDepthVisible = (depth) => visibleDepths[depth] !== false;

  const toggleDepth = (depth) => {
    setVisibleDepths((prev) => ({
      ...prev,
      [depth]: prev[depth] === false ? true : false,
    }));
  };

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <div className="three-d-viewport-wrapper">
      {/* 3D Scene Controls HUD */}
      <div className="three-d-hud-panel">
        <div className="hud-title">
          <Layers size={14} className="hud-icon" />
          <span>Underwater Depth Slices</span>
        </div>

        <div className="hud-layer-pills">
          {layers.map((l) => {
            const active = isDepthVisible(l.depth);
            return (
              <button
                key={l.depth}
                type="button"
                onClick={() => toggleDepth(l.depth)}
                className={`depth-pill ${active ? "active" : "inactive"}`}
                title={`Toggle ${l.depth}m layer`}
              >
                {active ? <Eye size={11} /> : <EyeOff size={11} />}
                <span>{l.depth}m</span>
              </button>
            );
          })}
        </div>

        <div className="hud-actions">
          <div className="exaggeration-control">
            <span className="exagg-label">Z-Scale:</span>
            {[1, 1.5, 2].map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setVerticalExaggeration(scale)}
                className={`scale-btn ${verticalExaggeration === scale ? "active" : ""}`}
              >
                {scale}x
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetCamera}
            className="hud-action-btn"
            title="Reset 3D Camera"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* WebGL Canvas */}
      <div className="webgl-canvas-container">
        <Canvas
          camera={{ position: [20, 16, 24], fov: 42, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: true }}
        >
          {/* Oceanic Lighting Setup */}
          <color attach="background" args={["#06111e"]} />
          <ambientLight intensity={0.8} color="#90cdf4" />
          <directionalLight position={[10, 20, 15]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-10, -10, -10]} intensity={0.3} color="#007799" />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minDistance={8}
            maxDistance={70}
          />

          <UnderwaterBoundingBox
            width={sceneWidth}
            length={sceneLength}
            height={baseDepthHeight}
            coords={coords}
          />

          {/* Render Stacked Depth Layers */}
          {layers.map((layer) => {
            const normY = (layer.depth / maxDepthVal) * baseDepthHeight;
            return (
              <DepthLayerMesh
                key={layer.depth}
                layer={layer}
                timeIndex={timeIndex}
                minVal={bounds.min}
                maxVal={bounds.max}
                width={sceneWidth}
                depth={sceneLength}
                yPos={-normY}
                visible={isDepthVisible(layer.depth)}
                opacity={0.85}
              />
            );
          })}
        </Canvas>

        <div className="three-d-hint-tag">
          Drag to orbit · Scroll to zoom · Right-click to pan
        </div>
      </div>
    </div>
  );
}
