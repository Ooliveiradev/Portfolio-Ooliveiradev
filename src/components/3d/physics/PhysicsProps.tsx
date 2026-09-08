import React from 'react';
import * as THREE from 'three';
import { useRapierBody } from './useRapierBody';

interface PhysicsAsteroidProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

export const PhysicsSpaceAsteroid: React.FC<PhysicsAsteroidProps> = ({
  position,
  scale = 1.0,
  color = '#475569',
}) => {
  const { ref } = useRapierBody<THREE.Mesh>({
    type: 'dynamic',
    position,
    shape: {
      type: 'ball',
      radius: scale * 0.9,
    },
    mass: 2.0 * scale,
    friction: 0.4,
    restitution: 0.6,
    linearDamping: 0.8,
    angularDamping: 0.6,
  });

  return (
    <mesh ref={ref} castShadow receiveShadow scale={[scale, scale, scale]}>
      <dodecahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial
        color={color}
        roughness={0.88}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
};

interface PhysicsBeaconProps {
  position: [number, number, number];
  color?: string;
}

export const PhysicsSpaceBeacon: React.FC<PhysicsBeaconProps> = ({
  position,
  color = '#38bdf8',
}) => {
  const { ref } = useRapierBody<THREE.Group>({
    type: 'dynamic',
    position,
    shape: {
      type: 'cylinder',
      halfHeight: 0.8,
      radius: 0.4,
    },
    mass: 1.5,
    friction: 0.5,
    restitution: 0.4,
    linearDamping: 1.0,
    angularDamping: 0.8,
  });

  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 1.6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.85}
          metalness={0.05}
          flatShading
        />
      </mesh>
      <pointLight position={[0, 0.9, 0]} color={color} intensity={1.5} distance={6} />
    </group>
  );
};

export const PhysicsSpacePlayground: React.FC = () => {
  // Low-poly celestial asteroids and telemetry beacons orbiting in space (Poly Bridge / Bruno Simon style)
  const asteroids = [
    { pos: [16, 0.5, 12] as [number, number, number], scale: 1.2, color: '#64748b' },
    { pos: [18, -0.8, 14] as [number, number, number], scale: 0.9, color: '#475569' },
    { pos: [-22, 1.2, 10] as [number, number, number], scale: 1.4, color: '#64748b' },
    { pos: [-24, 0.2, 13] as [number, number, number], scale: 1.0, color: '#334155' },
    { pos: [10, -0.4, -22] as [number, number, number], scale: 1.3, color: '#475569' },
    { pos: [-14, 0.8, -20] as [number, number, number], scale: 1.1, color: '#64748b' },
  ];

  const beacons = [
    { pos: [12, 0.5, 20] as [number, number, number], color: '#38bdf8' },
    { pos: [-18, 0.5, -16] as [number, number, number], color: '#ec4899' },
    { pos: [22, 0.5, -14] as [number, number, number], color: '#f59e0b' },
  ];

  return (
    <group>
      {asteroids.map((a, i) => (
        <PhysicsSpaceAsteroid key={i} position={a.pos} scale={a.scale} color={a.color} />
      ))}
      {beacons.map((b, i) => (
        <PhysicsSpaceBeacon key={i} position={b.pos} color={b.color} />
      ))}
    </group>
  );
};
