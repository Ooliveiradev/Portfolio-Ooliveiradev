import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';

interface ShootingStarsProps {
  graphicsQuality?: GraphicsQuality;
}

interface ActiveStreak {
  active: boolean;
  pos: THREE.Vector3;
  startPos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  length: number;
  progress: number;
  duration: number;
  color: THREE.Color;
  headScale: number;
  maxOpacity: number;
  totalDistance: number;
  isComet: boolean;
}

const POOL_SIZE = 4;
const _forward = new THREE.Vector3(0, 0, 1);
const _quat = new THREE.Quaternion();

export const ShootingStars: React.FC<ShootingStarsProps> = ({
  graphicsQuality = 'mid',
}) => {
  // Spawn countdown timer (in seconds)
  const spawnTimerRef = useRef(3.5); // First star triggers 3.5s after load
  const twinDelayRef = useRef<number | null>(null);

  // Group references for the pooled streaks
  const streakGroupsRef = useRef<(THREE.Group | null)[]>([]);
  const headMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const tailMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const headMaterialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const tailMaterialsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // Pre-allocated state for all 4 pooled streaks
  const streaks = useMemo<ActiveStreak[]>(() => {
    return Array.from({ length: POOL_SIZE }, () => ({
      active: false,
      pos: new THREE.Vector3(),
      startPos: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      speed: 80,
      length: 16,
      progress: 0,
      duration: 1.5,
      color: new THREE.Color('#38bdf8'),
      headScale: 1.0,
      maxOpacity: 0.75,
      totalDistance: 120,
      isComet: false,
    }));
  }, []);

  const spawnStreak = (isTwin = false, baseDir?: THREE.Vector3, baseStart?: THREE.Vector3) => {
    // Find first inactive slot
    const slot = streaks.find((s) => !s.active);
    if (!slot) return;

    const isComet = !isTwin && Math.random() < 0.18;
    slot.isComet = isComet;

    // Pick trajectory
    if (isTwin && baseDir && baseStart) {
      // Twin follows almost parallel course slightly shifted
      slot.dir.copy(baseDir);
      slot.startPos.copy(baseStart).add(new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 8
      ));
      slot.speed = 85 + Math.random() * 20;
      slot.length = 15;
      slot.totalDistance = 140;
      slot.headScale = 0.8;
      slot.maxOpacity = 0.7;
      slot.color.set('#38bdf8');
    } else if (isComet) {
      // Majestic comet: Slower, longer tail, emerald or ice-blue
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 40;
      const startX = Math.cos(angle) * radius;
      const startZ = Math.sin(angle) * radius;
      const startY = 30 + Math.random() * 25;

      slot.startPos.set(startX, startY, startZ);

      // Target across to opposite side with downward slant
      const targetX = -startX * 0.7 + (Math.random() - 0.5) * 40;
      const targetZ = -startZ * 0.7 + (Math.random() - 0.5) * 40;
      const targetY = startY - (15 + Math.random() * 15);

      slot.dir.set(targetX - startX, targetY - startY, targetZ - startZ).normalize();
      slot.totalDistance = slot.startPos.distanceTo(new THREE.Vector3(targetX, targetY, targetZ));
      slot.speed = 48 + Math.random() * 15;
      slot.length = 26;
      slot.headScale = 1.4;
      slot.maxOpacity = 0.85;

      // Comet color: Ice Cyan or Mystic Emerald
      if (Math.random() > 0.5) {
        slot.color.set('#34d399'); // Emerald
      } else {
        slot.color.set('#38bdf8'); // Cyan
      }
    } else {
      // Regular rapid shooting star
      const angle = Math.random() * Math.PI * 2;
      const radius = 90 + Math.random() * 50;
      const startX = Math.cos(angle) * radius;
      const startZ = Math.sin(angle) * radius;
      const startY = 20 + Math.random() * 30;

      slot.startPos.set(startX, startY, startZ);

      // Direction: high speed crossing the upper hemisphere
      const travelAngle = angle + Math.PI * 0.75 + (Math.random() - 0.5) * 0.6;
      const dirX = Math.cos(travelAngle);
      const dirZ = Math.sin(travelAngle);
      const dirY = -(0.2 + Math.random() * 0.35); // Slanting downward

      slot.dir.set(dirX, dirY, dirZ).normalize();
      slot.totalDistance = 110 + Math.random() * 50;
      slot.speed = 90 + Math.random() * 40;
      slot.length = 14 + Math.random() * 8;
      slot.headScale = 0.85;
      slot.maxOpacity = 0.75;

      // Color palette: 70% Sky Blue / White, 20% Solar Gold, 10% Pink/Violet
      const colorRoll = Math.random();
      if (colorRoll > 0.85) {
        slot.color.set('#fbbf24'); // Solar Gold
      } else if (colorRoll > 0.72) {
        slot.color.set('#f472b6'); // Pink/Violet
      } else {
        slot.color.set('#38bdf8'); // Sky Blue
      }
    }

    slot.pos.copy(slot.startPos);
    slot.duration = slot.totalDistance / slot.speed;
    slot.progress = 0;
    slot.active = true;

    return slot;
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // 1. Spawning logic
    if (twinDelayRef.current !== null) {
      twinDelayRef.current -= dt;
      if (twinDelayRef.current <= 0) {
        // Spawn twin star
        const activeStar = streaks.find((s) => s.active && !s.isComet);
        if (activeStar) {
          spawnStreak(true, activeStar.dir, activeStar.startPos);
        }
        twinDelayRef.current = null;
      }
    }

    spawnTimerRef.current -= dt;
    if (spawnTimerRef.current <= 0) {
      const spawned = spawnStreak(false);

      // 15% chance to queue a twin star 0.25s after
      if (spawned && Math.random() < 0.15) {
        twinDelayRef.current = 0.22;
      }

      // Reset timer based on graphics quality
      const baseInterval = graphicsQuality === 'low' ? 12 : 7;
      const variance = graphicsQuality === 'low' ? 8 : 6;
      spawnTimerRef.current = baseInterval + Math.random() * variance;
    }

    // 2. Update active streaks
    for (let i = 0; i < POOL_SIZE; i++) {
      const s = streaks[i];
      const grp = streakGroupsRef.current[i];
      const headMat = headMaterialsRef.current[i];
      const tailMat = tailMaterialsRef.current[i];
      const headMesh = headMeshesRef.current[i];
      const tailMesh = tailMeshesRef.current[i];

      if (!grp || !headMat || !tailMat) continue;

      if (!s.active) {
        grp.visible = false;
        continue;
      }

      s.progress += dt / s.duration;

      if (s.progress >= 1.0) {
        s.active = false;
        grp.visible = false;
        continue;
      }

      grp.visible = true;

      // Position: startPos + dir * (progress * totalDistance)
      const currentDist = s.progress * s.totalDistance;
      s.pos.copy(s.startPos).addScaledVector(s.dir, currentDist);
      grp.position.copy(s.pos);

      // Orientation: align local +Z with direction of travel
      _quat.setFromUnitVectors(_forward, s.dir);
      grp.quaternion.copy(_quat);

      // Opacity envelope: smooth fade-in (15%), sustain, and smooth fade-out (25%)
      let alpha = 1.0;
      if (s.progress < 0.15) {
        alpha = s.progress / 0.15;
      } else if (s.progress > 0.72) {
        alpha = (1.0 - s.progress) / 0.28;
      }

      const opacity = Math.max(0, Math.min(1, alpha * s.maxOpacity));

      // Apply dynamic colors and scales
      headMat.color.copy(s.color);
      headMat.opacity = opacity;

      tailMat.color.copy(s.color);
      tailMat.opacity = opacity * 0.7;

      if (headMesh) {
        headMesh.scale.setScalar(s.headScale);
      }
      if (tailMesh) {
        // Tail stretches backwards from Z=0 to Z=-s.length
        tailMesh.scale.set(1, 1, s.length / 16);
      }
    }
  });

  return (
    <group>
      {Array.from({ length: POOL_SIZE }).map((_, i) => (
        <group
          key={i}
          ref={(el) => (streakGroupsRef.current[i] = el)}
          visible={false}
        >
          {/* Luminous Glowing Head */}
          <mesh
            ref={(el) => (headMeshesRef.current[i] = el)}
            position={[0, 0, 0]}
          >
            <octahedronGeometry args={[0.32, 0]} />
            <meshBasicMaterial
              ref={(el) => (headMaterialsRef.current[i] = el)}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Tapered Luminous Light Tail (Trailing along -Z) */}
          <mesh
            ref={(el) => (tailMeshesRef.current[i] = el)}
            position={[0, 0, -8]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            {/* radiusTop=0.2 (head), radiusBottom=0.01 (tail tip), height=16 */}
            <cylinderGeometry args={[0.22, 0.01, 16, 8]} />
            <meshBasicMaterial
              ref={(el) => (tailMaterialsRef.current[i] = el)}
              transparent
              opacity={0.5}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
