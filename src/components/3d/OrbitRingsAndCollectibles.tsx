import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandConfig, CrystalCollectible } from '../../types';
import { sounds } from '../../audio/soundManager';

interface OrbitRingsAndCollectiblesProps {
  islands: IslandConfig[];
  crystals: CrystalCollectible[];
  vehiclePos: [number, number, number];
  onCollectCrystal: (id: number) => void;
}

export const OrbitRingsAndCollectibles: React.FC<OrbitRingsAndCollectiblesProps> = ({
  islands,
  crystals,
  vehiclePos,
  onCollectCrystal,
}) => {
  const crystalsGroupRef = useRef<THREE.Group>(null);
  const sunRef = useRef<THREE.Mesh>(null);

  // Starfield particles
  const [starPositions, starColors] = useMemo(() => {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 90 + Math.random() * 220;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Star color variation (cool white, cyan, lavender, gold)
      const colorType = Math.random();
      if (colorType > 0.8) {
        // Gold star
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.5;
      } else if (colorType > 0.5) {
        // Cyan star
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1.0;
      } else {
        // White / lavender star
        colors[i * 3] = 0.9;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      }
    }
    return [positions, colors];
  }, []);

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.2;
    }

    // Check collision between vehicle and floating crystals
    const vPos = new THREE.Vector3(...vehiclePos);
    crystals.forEach((crystal) => {
      if (!crystal.collected) {
        const cPos = new THREE.Vector3(...crystal.position);
        if (vPos.distanceTo(cPos) < 3.2) {
          sounds.playCoin();
          onCollectCrystal(crystal.id);
        }
      }
    });
  });

  return (
    <group>
      {/* Central Star / Core Sun */}
      <group position={[0, 0, 0]}>
        <mesh ref={sunRef}>
          <sphereGeometry args={[4.2, 32, 32]} />
          <meshBasicMaterial color="#fde047" />
        </mesh>
        {/* Sun Corona Outer Halo */}
        <mesh>
          <sphereGeometry args={[5.2, 24, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} />
        </mesh>
        <pointLight color="#fef08a" intensity={4} distance={180} />
      </group>

      {/* Orbital Circles for Each Island */}
      {islands.map((island) => (
        <mesh key={island.id} rotation={[-Math.PI / 2, 0, 0]} position={[0, island.elevation, 0]}>
          <ringGeometry args={[island.orbitRadius - 0.08, island.orbitRadius + 0.08, 96]} />
          <meshBasicMaterial
            color={island.color}
            transparent
            opacity={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Starfield Particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
        />
      </points>

      {/* Floating Collectible Space Crystals */}
      <group ref={crystalsGroupRef}>
        {crystals.map((crystal) => {
          if (crystal.collected) return null;
          return (
            <SingleCrystal
              key={crystal.id}
              position={crystal.position}
              onCollect={() => {
                sounds.playCoin();
                onCollectCrystal(crystal.id);
              }}
            />
          );
        })}
      </group>
    </group>
  );
};

interface SingleCrystalProps {
  position: [number, number, number];
  onCollect: () => void;
}

const SingleCrystal: React.FC<SingleCrystalProps> = ({ position, onCollect }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 1.8;
    meshRef.current.rotation.x += delta * 0.9;
    meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003 + position[0]) * 0.4;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onCollect();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      {/* Crystal Glow Light */}
      <pointLight color="#38bdf8" intensity={1.8} distance={6} />
    </group>
  );
};
