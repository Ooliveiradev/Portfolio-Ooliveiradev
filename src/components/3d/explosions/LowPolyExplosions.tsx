import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { explosionEvents } from './explosionEvents';
import { sounds } from '../../../audio/soundManager';

const PARTICLES_PER_EXPLOSION = 26;
const MAX_EXPLOSIONS = 4;
const EXPLOSION_DURATION = 0.9;

const EXPLOSION_PALETTE = [
  new THREE.Color('#ffffff'), // White hot
  new THREE.Color('#fef08a'), // Solar yellow
  new THREE.Color('#f97316'), // Vibrant orange
  new THREE.Color('#ef4444'), // Fiery red
  new THREE.Color('#94a3b8'), // Smoke slate
];

interface DebrisShard {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Vector3;
  vRot: THREE.Vector3;
  scale: number;
  color: THREE.Color;
}

interface ExplosionInstance {
  id: number;
  origin: THREE.Vector3;
  time: number;
  shards: DebrisShard[];
}

export const LowPolyExplosions: React.FC = () => {
  const [explosions, setExplosions] = useState<ExplosionInstance[]>([]);
  const nextId = useRef(1);

  // Group refs for mesh manipulation
  const shockwaveRefs = useRef<(THREE.Mesh | null)[]>([]);
  const shockwaveMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const flashLights = useRef<(THREE.PointLight | null)[]>([]);
  const shardMeshes = useRef<(THREE.Mesh | null)[][]>([]);
  const shardMats = useRef<(THREE.MeshStandardMaterial | null)[][]>([]);

  useEffect(() => {
    const unsub = explosionEvents.subscribe((pos, scale = 1.0) => {
      // Play audio effect
      sounds.playExplosion();

      const origin = new THREE.Vector3(...pos);
      const shards: DebrisShard[] = [];

      for (let i = 0; i < PARTICLES_PER_EXPLOSION; i++) {
        // Spherical distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = (14 + Math.random() * 22) * scale;
        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        );

        shards.push({
          pos: origin.clone(),
          vel: dir.multiplyScalar(speed),
          rot: new THREE.Vector3(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ),
          vRot: new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12
          ),
          scale: (0.35 + Math.random() * 0.45) * scale,
          color: EXPLOSION_PALETTE[Math.floor(Math.random() * EXPLOSION_PALETTE.length)],
        });
      }

      setExplosions((prev) => [
        ...prev.slice(-MAX_EXPLOSIONS + 1),
        {
          id: nextId.current++,
          origin,
          time: 0,
          shards,
        },
      ]);
    });

    return unsub;
  }, []);

  useFrame((_, delta) => {
    if (explosions.length === 0) return;

    let hasExpired = false;

    explosions.forEach((exp, expIdx) => {
      exp.time += delta;
      const progress = Math.min(exp.time / EXPLOSION_DURATION, 1);

      // 1. Shockwave expansion
      const swMesh = shockwaveRefs.current[expIdx];
      const swMat = shockwaveMats.current[expIdx];
      if (swMesh && swMat) {
        swMesh.position.copy(exp.origin);
        const swScale = progress < 0.4 ? (progress / 0.4) * 6.5 : 6.5 + (progress - 0.4) * 3;
        swMesh.scale.set(swScale, swScale, swScale);
        swMat.opacity = Math.max(0, 0.85 * (1 - progress));
      }

      // 2. Flash light decay
      const light = flashLights.current[expIdx];
      if (light) {
        light.position.copy(exp.origin);
        light.intensity = Math.max(0, 18 * (1 - progress * 2.5));
      }

      // 3. Debris Shards physics
      exp.shards.forEach((shard, shardIdx) => {
        // Space drag
        shard.vel.multiplyScalar(Math.pow(0.85, delta * 25));
        shard.pos.addScaledVector(shard.vel, delta);

        shard.rot.x += shard.vRot.x * delta;
        shard.rot.y += shard.vRot.y * delta;
        shard.rot.z += shard.vRot.z * delta;

        const mesh = shardMeshes.current[expIdx]?.[shardIdx];
        const mat = shardMats.current[expIdx]?.[shardIdx];

        if (mesh && mat) {
          mesh.position.copy(shard.pos);
          mesh.rotation.set(shard.rot.x, shard.rot.y, shard.rot.z);

          // Shrink towards 0 as it burns out
          const currentScale = Math.max(0.001, shard.scale * (1 - progress));
          mesh.scale.set(currentScale, currentScale, currentScale);
          mat.opacity = Math.max(0, 1 - progress * 0.9);
        }
      });

      if (exp.time >= EXPLOSION_DURATION) {
        hasExpired = true;
      }
    });

    if (hasExpired) {
      setExplosions((prev) => prev.filter((e) => e.time < EXPLOSION_DURATION));
    }
  });

  return (
    <group>
      {explosions.map((exp, expIdx) => {
        if (!shardMeshes.current[expIdx]) shardMeshes.current[expIdx] = [];
        if (!shardMats.current[expIdx]) shardMats.current[expIdx] = [];

        return (
          <group key={exp.id}>
            {/* Low-Poly Expanding Blast Shockwave (Faceted Icosahedron Shell) */}
            <mesh
              ref={(el) => {
                shockwaveRefs.current[expIdx] = el;
              }}
              position={exp.origin}
            >
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                ref={(el) => {
                  shockwaveMats.current[expIdx] = el;
                }}
                color="#f97316"
                emissive="#ff5500"
                emissiveIntensity={1.5}
                roughness={0.6}
                metalness={0.05}
                flatShading
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Epicenter Flash Light */}
            <pointLight
              ref={(el) => {
                flashLights.current[expIdx] = el;
              }}
              position={exp.origin}
              color="#fef08a"
              intensity={18}
              distance={45}
            />

            {/* 26 Low-Poly Debris Shards (Faceted icosahedrons just like exhaust puffs) */}
            {exp.shards.map((shard, shardIdx) => (
              <mesh
                key={shardIdx}
                ref={(el) => {
                  if (shardMeshes.current[expIdx]) {
                    shardMeshes.current[expIdx][shardIdx] = el;
                  }
                }}
                position={shard.pos}
              >
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  ref={(el) => {
                    if (shardMats.current[expIdx]) {
                      shardMats.current[expIdx][shardIdx] = el;
                    }
                  }}
                  color={shard.color}
                  emissive={shard.color}
                  emissiveIntensity={0.8}
                  roughness={0.75}
                  metalness={0.05}
                  flatShading
                  transparent
                  opacity={0.95}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
