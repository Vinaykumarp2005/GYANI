import React, { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";

function getOceanTurboColor(norm) {
  const t = Math.max(0, Math.min(1, norm));
  // Polynomial approximation of Google Turbo colormap (perceptually uniform)
  const r = Math.min(255, Math.max(0, Math.round(255 * (0.1357 + t * (4.6153 + t * (-42.66 + t * (132.13 + t * (-152.94 + t * 59.28))))))));
  const g = Math.min(255, Math.max(0, Math.round(255 * (0.0914 + t * (2.1941 + t * (4.8418 + t * (-14.185 + t * (4.2773 + t * 2.8295))))))));
  const b = Math.min(255, Math.max(0, Math.round(255 * (0.1067 + t * (12.573 + t * (-86.80 + t * (214.93 + t * (-214.3 + t * 76.5))))))));
  return [r, g, b];
}

export default function DepthLayerMesh({
  layer,
  timeIndex = 0,
  minVal = 10,
  maxVal = 32,
  width = 30,
  depth = 20,
  yPos = 0,
  visible = true,
  opacity = 0.88,
}) {
  const meshRef = useRef();

  // Extract dimensions
  const timeSlices = layer.values_by_time || [];
  const currentGrid = timeSlices[timeIndex] || timeSlices[0] || [[]];
  const rows = currentGrid.length;
  const cols = currentGrid[0] ? currentGrid[0].length : 0;

  // Create or reuse data texture
  const texture = useMemo(() => {
    if (rows === 0 || cols === 0) return null;
    const data = new Uint8Array(cols * rows * 4);
    const tex = new THREE.DataTexture(data, cols, rows, THREE.RGBAFormat);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, [rows, cols]);

  // Update texture data on timeIndex or grid change
  useEffect(() => {
    if (!texture || rows === 0 || cols === 0) return;
    const range = Math.max(0.001, maxVal - minVal);
    const data = texture.image.data;

    let idx = 0;
    // Note: NetCDF latitudes typically descend from top to bottom (North to South)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = currentGrid[r][c];
        if (val === null || val === undefined || isNaN(val)) {
          // Transparent for land/masked values
          data[idx] = 20;
          data[idx + 1] = 24;
          data[idx + 2] = 30;
          data[idx + 3] = 40;
        } else {
          const norm = (val - minVal) / range;
          const [cr, cg, cb] = getOceanTurboColor(norm);
          data[idx] = cr;
          data[idx + 1] = cg;
          data[idx + 2] = cb;
          data[idx + 3] = 240;
        }
        idx += 4;
      }
    }
    texture.needsUpdate = true;
  }, [texture, currentGrid, minVal, maxVal, rows, cols]);

  if (!visible || !texture) return null;

  return (
    <group position={[0, yPos, 0]}>
      {/* Horizontal scientific slice */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth, 1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          opacity={opacity}
          side={THREE.DoubleSide}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Subtle depth border frame */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width, depth)]} />
        <lineBasicMaterial color={layer.depth === 0 ? "#00ffff" : "#4a90e2"} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}
