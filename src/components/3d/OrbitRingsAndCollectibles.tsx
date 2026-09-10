import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandConfig, CrystalCollectible, GraphicsQuality } from '../../types';
import { sounds } from '../../audio/soundManager';

import { LowPolySun } from './LowPolySun';
import { HolographicMaterial } from './shaders/HolographicMaterial';

interface OrbitRingsAndCollectiblesProps {
  islands?: IslandConfig[];
  crystals: CrystalCollectible[];
  vehiclePos: [number, number, number];
  onCollectCrystal: (id: number) => void;
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
}

export const OrbitRingsAndCollectibles: React.FC<OrbitRingsAndCollectiblesProps> = ({
  crystals,
  vehiclePos,
  onCollectCrystal,
  graphicsQuality = 'mid',
  sharedVehiclePos,
}) => {
  const crystalsGroupRef = useRef<THREE.Group>(null);

  // Starfield particles throughout the solar system scaled by graphics tier
  const [starPositions, starColors] = useMemo(() => {
    const count = graphicsQuality === 'low' ? 600 : graphicsQuality === 'high' ? 2200 : 1400;
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
  }, [graphicsQuality]);

  useFrame(() => {
    // Zero-allocation collision check between vehicle and floating crystals
    const vx = sharedVehiclePos ? sharedVehiclePos.current.x : vehiclePos[0];
    const vy = sharedVehiclePos ? sharedVehiclePos.current.y : vehiclePos[1];
    const vz = sharedVehiclePos ? sharedVehiclePos.current.z : vehiclePos[2];
    const thresholdSq = 3.4 * 3.4;

    for (let i = 0; i < crystals.length; i++) {
      const crystal = crystals[i];
      if (!crystal.collected) {
        const dx = vx - crystal.position[0];
        const dy = vy - crystal.position[1];
        const dz = vz - crystal.position[2];
        if (dx * dx + dy * dy + dz * dz < thresholdSq) {
          sounds.playCoin();
          onCollectCrystal(crystal.id);
        }
      }
    }
  });

  return (
    <group>
      {/* ==========================================================
          CENTRAL STAR / SUN OF THE SOLAR SYSTEM
          Faceted Low-Poly Sun with 36 Erupting Solar Particles & Fiery Glow
         ========================================================== */}
      <LowPolySun graphicsQuality={graphicsQuality} />

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
              graphicsQuality={graphicsQuality}
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
  graphicsQuality?: GraphicsQuality;
}

const SingleCrystal: React.FC<SingleCrystalProps> = ({ position, onCollect, graphicsQuality = 'mid' }) => {
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
        castShadow={graphicsQuality !== 'low'}
        onClick={(e) => {
          e.stopPropagation();
          onCollect();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <octahedronGeometry args={[0.9, 0]} />
        {graphicsQuality === 'low' ? (
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.65}
            roughness={0.7}
            metalness={0.1}
            flatShading
          />
        ) : (
          <HolographicMaterial
            baseColor="#38bdf8"
            fresnelColor="#e879f9"
            fresnelPower={2.5}
            scanlineDensity={26.0}
            iridescenceSpeed={0.9}
            opacity={0.95}
          />
        )}
      </mesh>
      {graphicsQuality !== 'low' && (
        <pointLight color="#38bdf8" intensity={1.5} distance={6} />
      )}
    </group>
  );
};
