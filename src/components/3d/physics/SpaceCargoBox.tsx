import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRapierBody } from './useRapierBody';
import { explosionEvents } from '../explosions/explosionEvents';
import { sounds } from '../../../audio/soundManager';
import { GraphicsQuality } from '../../../types';

export type CargoType = 'quantum' | 'bio' | 'fuel' | 'salvage';

interface SpaceCargoBoxProps {
  id: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  type?: CargoType;
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  onRecoverCargo?: (id: string) => void;
  isRecovered?: boolean;
}

const TYPE_CONFIG = {
  quantum: {
    accentColor: '#38bdf8',
    emissiveIntensity: 0.6,
    bodyColor: '#0f172a',
  },
  bio: {
    accentColor: '#10b981',
    emissiveIntensity: 0.6,
    bodyColor: '#0c1a1a',
  },
  fuel: {
    accentColor: '#f59e0b',
    emissiveIntensity: 0.6,
    bodyColor: '#1a140c',
  },
  salvage: {
    accentColor: '#fde047',
    emissiveIntensity: 0.9,
    bodyColor: '#1e1b10',
  },
};

export const SpaceCargoBox: React.FC<SpaceCargoBoxProps> = ({
  id,
  position,
  rotation = [0, 0, 0],
  scale = 1.0,
  type = 'quantum',
  graphicsQuality = 'mid',
  sharedVehiclePos,
  onRecoverCargo,
  isRecovered = false,
}) => {
  const [collected, setCollected] = useState(isRecovered);
  const config = TYPE_CONFIG[type];

  const { ref, bodyRef } = useRapierBody<THREE.Group>({
    type: 'dynamic',
    position,
    rotation,
    shape: {
      type: 'cuboid',
      halfExtents: [0.55 * scale, 0.55 * scale, 0.55 * scale],
    },
    mass: (type === 'fuel' ? 4.5 : 3.0) * scale,
    friction: 0.4,
    restitution: 0.55,
    linearDamping: 0.45,
    angularDamping: 0.35,
  });

  const lastImpactTimeRef = useRef<number>(0);
  const wasCollidingRef = useRef<boolean>(false);
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!bodyRef.current) return;
    const t = bodyRef.current.translation();
    const time = Date.now() * 0.003;

    // Salvage beacon pulse animation
    if (beaconRef.current && type === 'salvage' && !collected) {
      const pulse = 0.5 + Math.sin(time * 5.0) * 0.4;
      const mat = beaconRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = pulse;
    }

    // Proximity check with vehicle
    if (sharedVehiclePos) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - t.x;
      const dy = ship.y - t.y;
      const dz = ship.z - t.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const collisionDist = 1.9 * scale;

      const isColliding = distSq < collisionDist * collisionDist;
      const now = Date.now();

      if (isColliding && !wasCollidingRef.current) {
        if (now - lastImpactTimeRef.current > 350) {
          lastImpactTimeRef.current = now;
          sounds.playKineticImpact(1.0);

          // If lost salvage pod and not yet collected: recover!
          if (type === 'salvage' && !collected) {
            setCollected(true);
            sounds.playCargoRecovered();
            explosionEvents.emit([t.x, t.y, t.z], 0.75 * scale);
            onRecoverCargo?.(id);
          }
        }
      }
      wasCollidingRef.current = isColliding;
    }

    // Solar boundary
    const distToSun = Math.hypot(t.x, t.y, t.z);
    if (distToSun < 5.5) {
      explosionEvents.emit([t.x, t.y, t.z], scale * 1.0);
      bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <group ref={ref} scale={[scale, scale, scale]}>
      {/* Main Cargo Container Body */}
      <mesh
        castShadow={graphicsQuality !== 'low'}
        receiveShadow={graphicsQuality !== 'low'}
      >
        <boxGeometry args={[1.05, 1.05, 1.05]} />
        <meshStandardMaterial
          color={collected ? '#334155' : config.bodyColor}
          roughness={0.82}
          metalness={0.2}
          flatShading
        />
      </mesh>

      {/* Reinforced Outer Structural Frame / Edges */}
      <mesh>
        <boxGeometry args={[1.12, 1.12, 0.35]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[1.12, 1.12, 0.35]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Glowing Neon Seam Inset Panels */}
      {!collected && (
        <group>
          {/* Top/Bottom Seams */}
          <mesh position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshBasicMaterial
              color={config.accentColor}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[0, -0.54, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, 0.7]} />
            <meshBasicMaterial
              color={config.accentColor}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Side Emissive Stripes */}
          <mesh position={[0, 0, 0.54]}>
            <planeGeometry args={[0.65, 0.15]} />
            <meshBasicMaterial color={config.accentColor} />
          </mesh>
          <mesh position={[0, 0, -0.54]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.65, 0.15]} />
            <meshBasicMaterial color={config.accentColor} />
          </mesh>
          <mesh position={[0.54, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.65, 0.15]} />
            <meshBasicMaterial color={config.accentColor} />
          </mesh>
          <mesh position={[-0.54, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.65, 0.15]} />
            <meshBasicMaterial color={config.accentColor} />
          </mesh>
        </group>
      )}

      {/* Salvage Beacon Antenna on Top */}
      {type === 'salvage' && !collected && (
        <group position={[0, 0.55, 0]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
          <mesh ref={beaconRef} position={[0, 0.42, 0]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial
              color="#fde047"
              transparent
              opacity={0.9}
            />
          </mesh>
          {graphicsQuality !== 'low' && (
            <pointLight
              color="#fde047"
              intensity={1.2}
              distance={4.5}
              position={[0, 0.45, 0]}
            />
          )}
        </group>
      )}

      {/* Recovered Green Indicator */}
      {collected && (
        <mesh position={[0, 0.56, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.35, 16]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      )}
    </group>
  );
};
