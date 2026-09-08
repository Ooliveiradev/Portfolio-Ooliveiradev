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
  const sunRef = useRef<THREE.Group>(null);

  // Starfield particles throughout the solar system
  const [starPositions, starColors] = useMemo(() => {
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 80 + Math.random() * 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const colorType = Math.random();
      if (colorType > 0.75) {
        colors[i * 3] = 0.98;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.5;
      } else if (colorType > 0.45) {
        colors[i * 3] = 0.38;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 0.98;
      } else {
        colors[i * 3] = 0.92;
        colors[i * 3 + 1] = 0.95;
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
        if (vPos.distanceTo(cPos) < 3.4) {
          sounds.playCoin();
          onCollectCrystal(crystal.id);
        }
      }
    });
  });

  return (
    <group>
      {/* ==========================================================
          CENTRAL STAR / SUN OF THE SOLAR SYSTEM
          Stylized Low-Poly Miniature Aesthetics (Bruno Simon Toy Style)
         ========================================================== */}
      <group position={[0, 0, 0]}>
        <group ref={sunRef}>
          {/* Main Solar Core */}
          <mesh>
            <sphereGeometry args={[4.2, 24, 24]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={0.8}
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>

          {/* Low-Poly Corona Ring / Outer Toy Halo */}
          <mesh rotation={[Math.PI / 3, 0, Math.PI / 6]}>
            <torusGeometry args={[5.6, 0.22, 8, 32]} />
            <meshStandardMaterial
              color="#f97316"
              roughness={0.85}
              metalness={0.05}
              transparent
              opacity={0.65}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
            <torusGeometry args={[6.4, 0.16, 8, 32]} />
            <meshStandardMaterial
              color="#fbbf24"
              roughness={0.85}
              metalness={0.05}
              transparent
              opacity={0.45}
            />
          </mesh>
        </group>
        <pointLight color="#fef08a" intensity={3.5} distance={160} />
      </group>

      {/* ==========================================================
          CELESTIAL PLANETARY ORBITAL RINGS
          FIX: Placed safely BELOW the islands (y = -4.0) so they NEVER
          clip or slice through the middle of the planetary island models!
         ========================================================== */}
      {islands.map((island) => (
        <mesh
          key={island.id}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, island.elevation - 4.2, 0]}
        >
          <ringGeometry args={[island.orbitRadius - 0.14, island.orbitRadius + 0.14, 96]} />
          <meshStandardMaterial
            color={island.color}
            roughness={0.85}
            metalness={0.05}
            transparent
            opacity={0.28}
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
          size={1.5}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Floating Collectible Space Crystals in Orbit */}
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
    meshRef.current.rotation.y += delta * 2.0;
    meshRef.current.rotation.x += delta * 1.0;
    meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003 + position[0]) * 0.35;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
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
          emissiveIntensity={0.4}
          roughness={0.85}
          metalness={0.05}
          flatShading
        />
      </mesh>
      <pointLight color="#38bdf8" intensity={1.5} distance={6} />
    </group>
  );
};
