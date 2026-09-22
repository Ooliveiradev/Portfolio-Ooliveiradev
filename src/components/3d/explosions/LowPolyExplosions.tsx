import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { explosionEvents } from './explosionEvents';
import { sounds } from '../../../audio/soundManager';
import { GraphicsQuality } from '../../../types';

const MAX_EXPLOSIONS = 4;
const MAX_SHARDS = 32;
const EXPLOSION_DURATION = 0.9;
const EXPLOSION_PALETTE = ['#ffffff', '#fef08a', '#f97316', '#ef4444', '#94a3b8'];

interface LowPolyExplosionsProps {
  graphicsQuality?: GraphicsQuality;
  enabled?: boolean;
}

/** A fixed pool avoids mounting meshes and changing the scene's light shader on impact. */
export const LowPolyExplosions: React.FC<LowPolyExplosionsProps> = ({ graphicsQuality = 'mid', enabled = true }) => {
  const slots = useMemo(() => Array.from({ length: MAX_EXPLOSIONS }, () => ({
    active: false,
    time: 0,
    count: 0,
    origin: new THREE.Vector3(),
    shards: Array.from({ length: MAX_SHARDS }, () => ({
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      rot: new THREE.Euler(),
      angularVelocity: new THREE.Vector3(),
      scale: 1,
    })),
  })), []);
  const nextSlot = useRef(0);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const shockwaves = useRef<(THREE.Mesh | null)[]>([]);
  const debris = useRef<(THREE.InstancedMesh | null)[]>([]);
  const flashLight = useRef<THREE.PointLight>(null);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const palette = useMemo(() => EXPLOSION_PALETTE.map((color) => new THREE.Color(color).multiplyScalar(1.8)), []);
  const particlesCount = graphicsQuality === 'low' ? 10 : graphicsQuality === 'high' ? 32 : 22;

  useLayoutEffect(() => {
    // Allocate the instanced color buffer before the first impact, including shader warmup.
    debris.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < MAX_SHARDS; i++) mesh.setColorAt(i, palette[i % palette.length]);
      if (mesh.instanceColor) {
        mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
        mesh.instanceColor.needsUpdate = true;
      }
    });
  }, [palette]);

  useEffect(() => explosionEvents.subscribe((position, scale = 1) => {
    if (!enabled) return;
    sounds.playExplosion();
    const index = nextSlot.current;
    nextSlot.current = (index + 1) % MAX_EXPLOSIONS;
    const slot = slots[index];
    slot.origin.set(...position);
    slot.active = true;
    slot.time = 0;
    slot.count = particlesCount;
    const mesh = debris.current[index];
    if (!mesh) return;
    mesh.count = particlesCount;

    for (let i = 0; i < particlesCount; i++) {
      const shard = slot.shards[i];
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = (14 + Math.random() * 22) * scale;
      shard.pos.copy(slot.origin);
      shard.vel.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(speed);
      shard.rot.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      shard.angularVelocity.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
      shard.scale = (0.35 + Math.random() * 0.45) * scale;
      mesh.setColorAt(i, palette[Math.floor(Math.random() * palette.length)]);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }), [slots, particlesCount, palette, enabled]);

  useFrame((_, delta) => {
    if (!enabled) {
      slots.forEach((slot, i) => { slot.active = false; if (groups.current[i]) groups.current[i]!.visible = false; });
      if (flashLight.current) flashLight.current.intensity = 0;
      return;
    }
    const dt = Math.min(delta, 0.1);
    const drag = Math.pow(0.85, dt * 25);
    let brightest = 0;
    let brightestSlot = -1;

    for (let index = 0; index < MAX_EXPLOSIONS; index++) {
      const slot = slots[index];
      const group = groups.current[index];
      const mesh = debris.current[index];
      const shockwave = shockwaves.current[index];
      if (!group || !mesh || !shockwave) continue;
      if (!slot.active) {
        group.visible = false;
        continue;
      }

      slot.time += dt;
      const progress = Math.min(slot.time / EXPLOSION_DURATION, 1);
      if (progress >= 1) {
        slot.active = false;
        group.visible = false;
        continue;
      }
      group.visible = true;
      shockwave.position.copy(slot.origin);
      shockwave.scale.setScalar(progress < 0.4 ? (progress / 0.4) * 6.5 : 6.5 + (progress - 0.4) * 3);
      (shockwave.material as THREE.MeshStandardMaterial).opacity = 0.85 * (1 - progress);
      (mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress * 0.9;

      for (let i = 0; i < slot.count; i++) {
        const shard = slot.shards[i];
        shard.vel.multiplyScalar(drag);
        shard.pos.addScaledVector(shard.vel, dt);
        shard.rot.x += shard.angularVelocity.x * dt;
        shard.rot.y += shard.angularVelocity.y * dt;
        shard.rot.z += shard.angularVelocity.z * dt;
        transform.position.copy(shard.pos);
        transform.rotation.copy(shard.rot);
        transform.scale.setScalar(Math.max(0.001, shard.scale * (1 - progress)));
        transform.updateMatrix();
        mesh.setMatrixAt(i, transform.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      const intensity = Math.max(0, 18 * (1 - progress * 2.5));
      if (intensity > brightest) {
        brightest = intensity;
        brightestSlot = index;
      }
    }

    // Keep one light mounted at all times: adding/removing lights recompiles lit materials.
    if (flashLight.current) {
      flashLight.current.intensity = graphicsQuality === 'low' ? 0 : brightest;
      if (brightestSlot >= 0) flashLight.current.position.copy(slots[brightestSlot].origin);
    }
  });

  return (
    <group>
      <pointLight ref={flashLight} color="#fef08a" intensity={0} distance={45} />
      {slots.map((_, index) => (
        <group key={index} ref={(group) => { groups.current[index] = group; }} visible={false}>
          <mesh ref={(mesh) => { shockwaves.current[index] = mesh; }}>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#f97316" emissive="#ff5500" emissiveIntensity={1.5} roughness={0.6} metalness={0.05} flatShading transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <instancedMesh ref={(mesh) => { debris.current[index] = mesh; }} args={[undefined, undefined, MAX_SHARDS]} frustumCulled={false}>
            <icosahedronGeometry args={[1, 0]} />
            <meshBasicMaterial transparent opacity={0.95} depthWrite={false} />
          </instancedMesh>
        </group>
      ))}
    </group>
  );
};
