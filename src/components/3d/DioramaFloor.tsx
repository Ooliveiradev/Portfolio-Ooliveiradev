import React from 'react';
import * as THREE from 'three';
import { useRapierBody } from './physics/useRapierBody';

export const DioramaFloor: React.FC = () => {
  // Static Rapier Collider for the main Diorama table floor
  useRapierBody<THREE.Mesh>({
    type: 'fixed',
    position: [0, -0.5, 0],
    shape: {
      type: 'cuboid',
      halfExtents: [95, 0.5, 95],
    },
    friction: 0.8,
    restitution: 0.1,
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. MAIN DIORAMA PLAYFIELD BASE (Matte Toy Finish) */}
      <mesh position={[0, -0.5, 0]} receiveShadow>
        <cylinderGeometry args={[88, 92, 1.0, 48]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {/* Beveled Rim Collar (Poly Bridge wood / plastic edging) */}
      <mesh position={[0, -0.05, 0]}>
        <ringGeometry args={[87.5, 88.6, 48]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.85}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. SUBTLE LOW-POLY TOY GRID / TRACK TILES */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[87.2, 48]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
};
