import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { raceSession } from '../../utils/raceSession';
import { HolographicMaterial } from './shaders/HolographicMaterial';

export const GhostRacer = () => {
  const group = useRef<THREE.Group>(null);
  const cursor = useRef(0);
  const rotation = useRef(new THREE.Quaternion());
  const target = useRef(new THREE.Quaternion());
  const euler = useRef(new THREE.Euler());
  useFrame(() => {
    if (!group.current) return;
    const run = raceSession.ghost;
    const t = raceSession.running ? raceSession.elapsed() : 0;
    group.current.visible = Boolean(run && raceSession.active && t <= run.duration);
    if (!run || !group.current.visible) return;
    if (t < run.frames[cursor.current]?.[0]) cursor.current = 0;
    while (cursor.current < run.frames.length - 2 && run.frames[cursor.current + 1][0] < t) cursor.current++;
    const a = run.frames[cursor.current], b = run.frames[cursor.current + 1];
    const alpha = THREE.MathUtils.clamp((t - a[0]) / (b[0] - a[0]), 0, 1);
    group.current.position.set(THREE.MathUtils.lerp(a[1], b[1], alpha), THREE.MathUtils.lerp(a[2], b[2], alpha), THREE.MathUtils.lerp(a[3], b[3], alpha));
    rotation.current.setFromEuler(euler.current.set(a[4], a[5], a[6]));
    target.current.setFromEuler(euler.current.set(b[4], b[5], b[6]));
    group.current.quaternion.copy(rotation.current.slerp(target.current, alpha));
  });
  return <group ref={group} visible={false}>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <capsuleGeometry args={[0.6, 2.2, 4, 8]} />
      <HolographicMaterial baseColor="#22d3ee" fresnelColor="#67e8f9" opacity={0.3} />
    </mesh>
    <mesh position={[0, 0, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.6, 1, 8]} />
      <HolographicMaterial baseColor="#22d3ee" opacity={0.35} />
    </mesh>
    <mesh position={[0, 0, -0.7]} scale={[2.5, 0.12, 0.9]}>
      <octahedronGeometry args={[1]} />
      <HolographicMaterial baseColor="#22d3ee" opacity={0.3} />
    </mesh>
  </group>;
};
