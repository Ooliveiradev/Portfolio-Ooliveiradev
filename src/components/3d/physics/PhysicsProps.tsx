import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRapierBody } from './useRapierBody';
import { explosionEvents } from '../explosions/explosionEvents';
import { sounds } from '../../../audio/soundManager';
import { GraphicsQuality } from '../../../types';
import { SpaceSatellite } from './SpaceSatellite';
import { SpaceCargoBox, CargoType } from './SpaceCargoBox';

interface PhysicsAsteroidProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
}

export const PhysicsSpaceAsteroid: React.FC<PhysicsAsteroidProps> = ({
  position,
  scale = 1.0,
  color = '#475569',
  graphicsQuality = 'mid',
  sharedVehiclePos,
}) => {
  const { ref, bodyRef } = useRapierBody<THREE.Mesh>({
    type: 'dynamic',
    position,
    shape: {
      type: 'ball',
      radius: scale * 0.9,
    },
    mass: 2.0 * scale,
    friction: 0.4,
    restitution: 0.6,
    linearDamping: 0.6,
    angularDamping: 0.5,
  });

  const lastImpactRef = useRef<number>(0);
  const wasCollidingRef = useRef<boolean>(false);

  useFrame(() => {
    if (!bodyRef.current) return;
    const t = bodyRef.current.translation();

    // Impact audio detection with vehicle
    if (sharedVehiclePos) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - t.x;
      const dy = ship.y - t.y;
      const dz = ship.z - t.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const collisionDist = (scale * 0.9 + 1.2);
      const isColliding = distSq < collisionDist * collisionDist;
      const now = Date.now();

      if (isColliding && !wasCollidingRef.current && now - lastImpactRef.current > 350) {
        lastImpactRef.current = now;
        sounds.playKineticImpact(0.9);
      }
      wasCollidingRef.current = isColliding;
    }

    const distToSun = Math.hypot(t.x, t.y, t.z);
    if (distToSun < 5.5) {
      explosionEvents.emit([t.x, t.y, t.z], scale * 1.2);
      bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <mesh
      ref={ref}
      castShadow={graphicsQuality !== 'low'}
      receiveShadow={graphicsQuality !== 'low'}
      scale={[scale, scale, scale]}
    >
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
  graphicsQuality?: GraphicsQuality;
}

export const PhysicsSpaceBeacon: React.FC<PhysicsBeaconProps> = ({
  position,
  color = '#38bdf8',
  graphicsQuality = 'mid',
}) => {
  const { ref, bodyRef } = useRapierBody<THREE.Group>({
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

  useFrame(() => {
    if (!bodyRef.current) return;
    const t = bodyRef.current.translation();
    const distToSun = Math.hypot(t.x, t.y, t.z);
    if (distToSun < 5.5) {
      explosionEvents.emit([t.x, t.y, t.z], 1.1);
      bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <group ref={ref}>
      <mesh
        castShadow={graphicsQuality !== 'low'}
        receiveShadow={graphicsQuality !== 'low'}
      >
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
      {graphicsQuality === 'high' && (
        <pointLight position={[0, 0.9, 0]} color={color} intensity={1.5} distance={6} />
      )}
    </group>
  );
};

interface PhysicsSpacePlaygroundProps {
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  onRecoverCargo?: (id: string) => void;
}

export const PhysicsSpacePlayground: React.FC<PhysicsSpacePlaygroundProps> = ({
  graphicsQuality = 'mid',
  sharedVehiclePos,
  onRecoverCargo,
}) => {
  // Low-poly celestial asteroids orbiting in space
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

  // Orbital Comms Satellites
  const satellites = [
    {
      id: 'sat-alpha',
      pos: [36, 0.8, 16] as [number, number, number],
      rot: [0.1, 0.4, 0.2] as [number, number, number],
      scale: 1.1,
    },
    {
      id: 'sat-beta',
      pos: [-42, 1.0, -40] as [number, number, number],
      rot: [-0.2, 1.2, 0.1] as [number, number, number],
      scale: 1.0,
    },
    {
      id: 'sat-gamma',
      pos: [-60, 0.6, 50] as [number, number, number],
      rot: [0.3, -0.8, -0.1] as [number, number, number],
      scale: 1.15,
    },
  ];

  // Space Cargo Containers & Physics Stacks
  const cargoCrates: Array<{
    id: string;
    pos: [number, number, number];
    rot?: [number, number, number];
    type: CargoType;
    scale?: number;
  }> = [
    // Cluster 1: Quantum & Bio crates near inner asteroid lane
    { id: 'crate-q1', pos: [22, 0.6, 28], type: 'quantum', scale: 1.0 },
    { id: 'crate-q2', pos: [23.4, 0.6, 28.3], type: 'quantum', scale: 1.0 },
    { id: 'crate-q3', pos: [22.7, 1.8, 28.1], type: 'quantum', scale: 1.0 }, // Stacked on top!
    { id: 'crate-b1', pos: [21.8, 0.6, 29.5], type: 'bio', scale: 1.05 },

    // Cluster 2: Heavy Hyperdrive Fuel depot near outer rim
    { id: 'crate-f1', pos: [-48, 0.6, -22], type: 'fuel', scale: 1.1 },
    { id: 'crate-f2', pos: [-49.4, 0.6, -21.8], type: 'fuel', scale: 1.1 },
    { id: 'crate-f3', pos: [-48.7, 1.8, -21.9], type: 'fuel', scale: 1.1 }, // Stacked on top!

    // Lost Salvage Pods (+35 XP collectible pods)
    { id: 'salvage-1', pos: [58, 0.8, -46], type: 'salvage', scale: 1.15 },
    { id: 'salvage-2', pos: [-74, 0.6, 20], type: 'salvage', scale: 1.15 },
    { id: 'salvage-3', pos: [-14, 0.8, -60], type: 'salvage', scale: 1.15 },
  ];

  return (
    <group>
      {/* Low-Poly Asteroids */}
      {asteroids.map((a, i) => (
        <PhysicsSpaceAsteroid
          key={`ast-${i}`}
          position={a.pos}
          scale={a.scale}
          color={a.color}
          graphicsQuality={graphicsQuality}
          sharedVehiclePos={sharedVehiclePos}
        />
      ))}

      {/* Telemetry Beacons */}
      {beacons.map((b, i) => (
        <PhysicsSpaceBeacon
          key={`beacon-${i}`}
          position={b.pos}
          color={b.color}
          graphicsQuality={graphicsQuality}
        />
      ))}

      {/* Interactive Artificial Comms Satellites with Solar Panels */}
      {satellites.map((sat) => (
        <SpaceSatellite
          key={sat.id}
          position={sat.pos}
          rotation={sat.rot}
          scale={sat.scale}
          graphicsQuality={graphicsQuality}
          sharedVehiclePos={sharedVehiclePos}
        />
      ))}

      {/* Interactive Space Cargo Boxes & Salvage Pods */}
      {cargoCrates.map((crate) => (
        <SpaceCargoBox
          key={crate.id}
          id={crate.id}
          position={crate.pos}
          rotation={crate.rot}
          type={crate.type}
          scale={crate.scale}
          graphicsQuality={graphicsQuality}
          sharedVehiclePos={sharedVehiclePos}
          onRecoverCargo={onRecoverCargo}
        />
      ))}
    </group>
  );
};
