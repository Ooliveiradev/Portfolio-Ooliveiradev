import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';

interface CosmicDustProps {
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
}

// Generate a smooth radial glowing particle texture once
function getDustTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const CosmicDust: React.FC<CosmicDustProps> = ({
  sharedVehiclePos,
  graphicsQuality = 'mid',
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const dustTexture = useMemo(() => getDustTexture(), []);

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      dustTexture.dispose();
    };
  }, [dustTexture]);

  // Particle count based on graphics quality tier
  const count = useMemo(() => {
    if (graphicsQuality === 'low') return 250;
    if (graphicsQuality === 'high') return 1200;
    return 600; // mid
  }, [graphicsQuality]);

  // Dimensions of the toroidal volume centered around the ship
  const boxX = 90;
  const boxY = 36;
  const boxZ = 90;
  const halfX = boxX / 2;
  const halfY = boxY / 2;
  const halfZ = boxZ / 2;

  // Initialize buffer attributes and drift velocities
  const { positions, colors, drifts, baseColors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseCol = new Float32Array(count * 3);
    const drf = new Float32Array(count * 3);

    const initialCenter = sharedVehiclePos.current;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Position distributed in box around vehicle
      pos[idx] = initialCenter.x + (Math.random() - 0.5) * boxX;
      pos[idx + 1] = initialCenter.y + (Math.random() - 0.5) * boxY;
      pos[idx + 2] = initialCenter.z + (Math.random() - 0.5) * boxZ;

      // Organic subtle drift velocity (space vacuum sway)
      drf[idx] = (Math.random() - 0.5) * 0.4;
      drf[idx + 1] = (Math.random() - 0.5) * 0.25;
      drf[idx + 2] = (Math.random() - 0.5) * 0.4;

      // Subtle Galactic Minimal palette: Sky Blue (70%), Ice White (20%), Warm Amber (10%)
      const randType = Math.random();
      let r = 0.22, g = 0.74, b = 0.97; // Sky blue (#38bdf8)
      if (randType > 0.88) {
        // Solar warm dust (#fde047)
        r = 0.99; g = 0.88; b = 0.28;
      } else if (randType > 0.68) {
        // Ice crystal white (#f1f5f9)
        r = 0.95; g = 0.96; b = 1.0;
      }

      baseCol[idx] = r;
      baseCol[idx + 1] = g;
      baseCol[idx + 2] = b;

      col[idx] = r;
      col[idx + 1] = g;
      col[idx + 2] = b;
    }

    return {
      positions: pos,
      colors: col,
      drifts: drf,
      baseColors: baseCol,
    };
  }, [count, boxX, boxY, boxZ, sharedVehiclePos]);

  // Frame loop: Continuous toroidal wrapping & micro-twinkle without allocations
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    if (!posAttr || !colAttr) return;

    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const shipPos = sharedVehiclePos.current;
    const sx = shipPos.x;
    const sy = shipPos.y;
    const sz = shipPos.z;

    const time = Date.now() * 0.002;
    const dt = Math.min(delta, 0.1); // clamp delta against frame drops

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // 1. Apply natural Brownian drift
      posArr[idx] += drifts[idx] * dt;
      posArr[idx + 1] += drifts[idx + 1] * dt;
      posArr[idx + 2] += drifts[idx + 2] * dt;

      // 2. Toroidal boundary wrap around the ship
      const dx = posArr[idx] - sx;
      if (dx > halfX) {
        posArr[idx] -= boxX;
      } else if (dx < -halfX) {
        posArr[idx] += boxX;
      }

      const dy = posArr[idx + 1] - sy;
      if (dy > halfY) {
        posArr[idx + 1] -= boxY;
      } else if (dy < -halfY) {
        posArr[idx + 1] += boxY;
      }

      const dz = posArr[idx + 2] - sz;
      if (dz > halfZ) {
        posArr[idx + 2] -= boxZ;
      } else if (dz < -halfZ) {
        posArr[idx + 2] += boxZ;
      }

      // 3. Subtle twinkle/shimmer on mid and high graphics
      if (graphicsQuality !== 'low' && (i % 3 === 0)) {
        const shimmer = 0.75 + Math.sin(time + i * 1.3) * 0.25;
        colArr[idx] = baseColors[idx] * shimmer;
        colArr[idx + 1] = baseColors[idx + 1] * shimmer;
        colArr[idx + 2] = baseColors[idx + 2] * shimmer;
      }
    }

    posAttr.needsUpdate = true;
    if (graphicsQuality !== 'low') {
      colAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={graphicsQuality === 'high' ? 0.9 : 0.8}
        map={dustTexture}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
