import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality, GameMode } from '../../types';

interface CosmicDustProps {
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
  gameMode?: GameMode;
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
  gameMode = 'landing',
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const dustTexture = useMemo(() => getDustTexture(), []);
  const dustCenter = useRef<THREE.Vector3>(new THREE.Vector3(0, 4, 0));

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      dustTexture.dispose();
    };
  }, [dustTexture]);

  // Particle count based on graphics quality tier
  const count = useMemo(() => {
    if (graphicsQuality === 'low') return 280;
    if (graphicsQuality === 'high') return 1300;
    return 650; // mid
  }, [graphicsQuality]);

  // Initialize buffer attributes and drift velocities
  const { positions, colors, drifts, baseColors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseCol = new Float32Array(count * 3);
    const drf = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Generous natural distribution throughout the solar system
      pos[idx] = (Math.random() - 0.5) * 160;
      pos[idx + 1] = (Math.random() - 0.5) * 52 + 4;
      pos[idx + 2] = (Math.random() - 0.5) * 160;

      // Organic subtle drift velocity (space vacuum sway)
      drf[idx] = (Math.random() - 0.5) * 0.45;
      drf[idx + 1] = (Math.random() - 0.5) * 0.28;
      drf[idx + 2] = (Math.random() - 0.5) * 0.45;

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
  }, [count]);

  // Frame loop: Continuous toroidal wrapping & micro-twinkle without allocations
  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;
    if (!posAttr || !colAttr) return;

    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const dt = Math.min(delta, 0.1); // clamp delta against frame drops
    const isLanding = gameMode === 'landing' || gameMode === 'exiting';

    // Target center coordinates:
    // In landing or exiting mode, dust centers on the core solar system (0, 4, 0)
    // In active exploration, dust smoothly tracks the ship's live coordinates
    let targetX = 0;
    let targetY = 4;
    let targetZ = 0;

    if (!isLanding && sharedVehiclePos?.current) {
      targetX = sharedVehiclePos.current.x;
      targetY = sharedVehiclePos.current.y;
      targetZ = sharedVehiclePos.current.z;
    }

    // Smooth lerp avoids popping when transitioning between views
    const centerLerp = Math.min(dt * 5.0, 1.0);
    dustCenter.current.x += (targetX - dustCenter.current.x) * centerLerp;
    dustCenter.current.y += (targetY - dustCenter.current.y) * centerLerp;
    dustCenter.current.z += (targetZ - dustCenter.current.z) * centerLerp;

    const sx = dustCenter.current.x;
    const sy = dustCenter.current.y;
    const sz = dustCenter.current.z;

    // Adapt volume size:
    // Landing screen: wide panoramic coverage around the sun and orbiting islands
    // Driving mode: concentrated cloud around the vehicle for speed sensation
    const boxX = isLanding ? 160 : 96;
    const boxY = isLanding ? 54 : 38;
    const boxZ = isLanding ? 160 : 96;
    const halfX = boxX * 0.5;
    const halfY = boxY * 0.5;
    const halfZ = boxZ * 0.5;

    const time = Date.now() * 0.002;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // 1. Natural Brownian drift
      posArr[idx] += drifts[idx] * dt;
      posArr[idx + 1] += drifts[idx + 1] * dt;
      posArr[idx + 2] += drifts[idx + 2] * dt;

      // 2. Modulo toroidal boundary wrap (guarantees all particles stay within box without popping)
      const relX = ((posArr[idx] - sx + halfX) % boxX + boxX) % boxX - halfX;
      posArr[idx] = sx + relX;

      const relY = ((posArr[idx + 1] - sy + halfY) % boxY + boxY) % boxY - halfY;
      posArr[idx + 1] = sy + relY;

      const relZ = ((posArr[idx + 2] - sz + halfZ) % boxZ + boxZ) % boxZ - halfZ;
      posArr[idx + 2] = sz + relZ;

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
        size={graphicsQuality === 'high' ? 0.95 : 0.85}
        map={dustTexture}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
