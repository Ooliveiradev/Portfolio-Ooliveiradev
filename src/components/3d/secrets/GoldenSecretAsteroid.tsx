import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';

interface GoldenSecretAsteroidProps {
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  onDiscover: () => void;
}

export const GoldenSecretAsteroid: React.FC<GoldenSecretAsteroidProps> = ({
  sharedVehiclePos,
  onDiscover,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const runesRef = useRef<THREE.Group>(null);
  const [discovered, setDiscovered] = useState(false);

  const position: [number, number, number] = [62, 1.2, -58];

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.4;
      meshRef.current.rotation.x += delta * 0.25;
    }

    if (runesRef.current) {
      runesRef.current.rotation.y -= delta * 0.6;
    }

    // Detecção de colisão / aproximação da nave espacial
    if (!discovered && sharedVehiclePos?.current) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - position[0];
      const dy = ship.y - position[1];
      const dz = ship.z - position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 4.4 * 4.4) {
        setDiscovered(true);
        sounds.playBadgeUnlocked();
        onDiscover();
      }
    }
  });

  return (
    <group position={position}>
      {/* Asteroide Monolítico Dourado Facetado */}
      <mesh
        ref={meshRef}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          setDiscovered(true);
          sounds.playBadgeUnlocked();
          onDiscover();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <dodecahedronGeometry args={[2.2, 0]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#d97706"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.7}
          flatShading
        />
      </mesh>

      {/* Halo de runas orbitais brilhantes */}
      <group ref={runesRef}>
        {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, idx) => (
          <mesh
            key={idx}
            position={[Math.cos(angle) * 3.2, Math.sin(angle * 2) * 0.6, Math.sin(angle) * 3.2]}
            scale={0.35}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.8}
              roughness={0.2}
              metalness={0.4}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Luz dourada estelar misteriosa */}
      <pointLight color="#fde047" intensity={2.8} distance={15} decay={1.5} />
    </group>
  );
};
