import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRapierBody } from './useRapierBody';
import { explosionEvents } from '../explosions/explosionEvents';
import { sounds } from '../../../audio/soundManager';
import { GraphicsQuality } from '../../../types';

interface SpaceSatelliteProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
}

export const SpaceSatellite: React.FC<SpaceSatelliteProps> = ({
  position,
  rotation = [0, 0, 0],
  scale = 1.0,
  graphicsQuality = 'mid',
  sharedVehiclePos,
}) => {
  const { ref, bodyRef } = useRapierBody<THREE.Group>({
    type: 'dynamic',
    position,
    rotation,
    shape: {
      type: 'cylinder',
      halfHeight: 0.9 * scale,
      radius: 0.75 * scale,
    },
    mass: 4.5 * scale,
    friction: 0.35,
    restitution: 0.45,
    linearDamping: 0.45,
    angularDamping: 0.35,
  });

  const lastImpactTimeRef = useRef<number>(0);
  const wasCollidingRef = useRef<boolean>(false);
  const beaconLedRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!bodyRef.current) return;

    const t = bodyRef.current.translation();
    const time = Date.now() * 0.003;

    // Blinking telemetry red/cyan LED beacon
    if (beaconLedRef.current) {
      const isLit = Math.sin(time * 6.0) > 0.3;
      const mat = beaconLedRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = isLit ? 1.0 : 0.2;
      }
    }

    // Proximity collision detection with player ship for audio and sparks
    if (sharedVehiclePos) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - t.x;
      const dy = ship.y - t.y;
      const dz = ship.z - t.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      const collisionDist = 2.4 * scale;

      const isColliding = distSq < collisionDist * collisionDist;
      const now = Date.now();

      if (isColliding && !wasCollidingRef.current && now - lastImpactTimeRef.current > 400) {
        lastImpactTimeRef.current = now;
        sounds.playKineticImpact(1.2);
        // Small collision spark puff
        explosionEvents.emit([t.x, t.y, t.z], 0.4 * scale);
      }
      wasCollidingRef.current = isColliding;
    }

    // Solar incineration boundary (dist to sun < 5.5 units)
    const distToSun = Math.hypot(t.x, t.y, t.z);
    if (distToSun < 5.5) {
      explosionEvents.emit([t.x, t.y, t.z], scale * 1.2);
      bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <group ref={ref} scale={[scale, scale, scale]}>
      {/* Central Hexagonal Avionics Chassis */}
      <mesh
        castShadow={graphicsQuality !== 'low'}
        receiveShadow={graphicsQuality !== 'low'}
      >
        <cylinderGeometry args={[0.65, 0.65, 1.4, 6]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.78}
          metalness={0.25}
          flatShading
        />
      </mesh>

      {/* Gold Thermal Foil Insulation Bands */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.67, 0.67, 0.35, 6]} />
        <meshStandardMaterial
          color="#eab308"
          roughness={0.35}
          metalness={0.7}
        />
      </mesh>

      {/* Parabolic Telemetry Dish Antenna (Top) */}
      <group position={[0, 0.85, 0]} rotation={[0.3, 0.4, 0]}>
        {/* Antenna Dish */}
        <mesh castShadow={graphicsQuality !== 'low'}>
          <coneGeometry args={[0.55, 0.35, 12, 1, true]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.65}
            metalness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Dish Sub-reflector Rod */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 6]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {/* Blinking Optical Beacon LED */}
        <mesh ref={beaconLedRef} position={[0, 0.56, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Left Solar Array Wing */}
      <group position={[-1.7, 0, 0]}>
        {/* Truss Mounting Boom */}
        <mesh position={[0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Solar Panel Frame */}
        <mesh castShadow={graphicsQuality !== 'low'}>
          <boxGeometry args={[1.4, 0.85, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
        {/* Photovoltaic Cells (Deep Blue Glow) */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.32, 0.78]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
        <mesh position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.32, 0.78]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
      </group>

      {/* Right Solar Array Wing */}
      <group position={[1.7, 0, 0]}>
        {/* Truss Mounting Boom */}
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Solar Panel Frame */}
        <mesh castShadow={graphicsQuality !== 'low'}>
          <boxGeometry args={[1.4, 0.85, 0.04]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} />
        </mesh>
        {/* Photovoltaic Cells (Deep Blue Glow) */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.32, 0.78]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
        <mesh position={[0, 0, -0.025]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.32, 0.78]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>
      </group>

      {/* Propulsion Engine Thruster (Bottom) */}
      <mesh position={[0, -0.85, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 0.35, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
    </group>
  );
};
