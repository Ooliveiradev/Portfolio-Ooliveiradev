import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../audio/soundManager';
import { GraphicsQuality } from '../../types';

export interface SpeedRingDef {
  id: number;
  position: [number, number, number];
  rotationY: number; // yaw angle in radians
  forward: [number, number, number];
}

export const SPEED_RINGS: SpeedRingDef[] = [
  // 0. LARGADA (Ao lado do Sol / Marco Zero)
  {
    id: 0,
    position: [18, 1.0, 18],
    rotationY: 0.78,
    forward: [Math.sin(0.78), 0, Math.cos(0.78)],
  },
  // 1. Corredor Sol -> Ilha dos Projetos (R=48)
  {
    id: 1,
    position: [46, 1.0, -14],
    rotationY: 2.2,
    forward: [Math.sin(2.2), 0, Math.cos(2.2)],
  },
  // 2. Corredor Projetos -> Ilha da Carreira (R=66)
  {
    id: 2,
    position: [34, 1.0, -58],
    rotationY: -2.8,
    forward: [Math.sin(-2.8), 0, Math.cos(-2.8)],
  },
  // 3. Corredor Carreira -> Ilha de Tecnologias (R=84)
  {
    id: 3,
    position: [-36, 1.0, -76],
    rotationY: -1.9,
    forward: [Math.sin(-1.9), 0, Math.cos(-1.9)],
  },
  // 4. Corredor Tecnologias -> Ilha Acadêmica (R=102)
  {
    id: 4,
    position: [-88, 1.0, 38],
    rotationY: -0.6,
    forward: [Math.sin(-0.6), 0, Math.cos(-0.6)],
  },
  // 5. CHEGADA: Slingshot Acadêmica -> Portal do Desenvolvedor / Sol
  {
    id: 5,
    position: [-22, 1.0, 26],
    rotationY: 1.2,
    forward: [Math.sin(1.2), 0, Math.cos(1.2)],
  },
];

interface SpeedRingsProps {
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
  isRacing?: boolean;
  currentCheckpoint?: number;
  onReachCheckpoint?: (index: number) => void;
  onNearStartGate?: (isNear: boolean) => void;
}

export const SpeedRings: React.FC<SpeedRingsProps> = ({
  sharedVehiclePos,
  graphicsQuality = 'mid',
  isRacing = false,
  currentCheckpoint = 0,
  onReachCheckpoint,
  onNearStartGate,
}) => {
  const ringsGroupRef = useRef<THREE.Group>(null);
  const ripplesRef = useRef<(THREE.Mesh | null)[]>([]);
  const fieldMatsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const targetBeaconRef = useRef<THREE.Mesh>(null);
  const targetGroundPingRef = useRef<THREE.Mesh>(null);
  const waypointGroupRef = useRef<THREE.Group>(null);
  const corridorGroupRef = useRef<THREE.Group>(null);
  const innerRingsRef = useRef<(THREE.Group | null)[]>([]);

  // State per ring: cooldown & shockwave timer
  const ringStates = useMemo(() => {
    return SPEED_RINGS.map(() => ({
      cooldown: 0,
      rippleProgress: 1.0,
    }));
  }, []);

  const wasNearRef = useRef(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = Date.now() * 0.003;
    const ship = sharedVehiclePos.current;

    // Counter-rotate mechanical gyro rings inside every jump gate
    innerRingsRef.current.forEach((innerGroup, idx) => {
      if (innerGroup) {
        innerGroup.rotation.z = time * (idx % 2 === 0 ? 0.75 : -0.75);
      }
    });

    // Proximity check to Start Gate (Ring 0 next to the Sun)
    const startRing = SPEED_RINGS[0];
    const distToStartSq =
      Math.pow(ship.x - startRing.position[0], 2) +
      Math.pow(ship.z - startRing.position[2], 2);

    const isNearStart = distToStartSq < 11.0 * 11.0;
    if (isNearStart !== wasNearRef.current) {
      wasNearRef.current = isNearStart;
      onNearStartGate?.(isNearStart);
    }

    // Animate rings, detect crossing and handle shockwaves
    SPEED_RINGS.forEach((ring, idx) => {
      const state = ringStates[idx];
      const rippleMesh = ripplesRef.current[idx];
      const fieldMat = fieldMatsRef.current[idx];

      if (state.cooldown > 0) {
        state.cooldown -= dt;
      }

      // Detection of ship passing through ring
      const dx = ship.x - ring.position[0];
      const dy = ship.y - ring.position[1];
      const dz = ship.z - ring.position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      const isCurrentTarget = isRacing && currentCheckpoint === idx;

      // Ring activation trigger (within 3.2 units of ring center)
      if (distSq < 3.2 * 3.2 && state.cooldown <= 0) {
        state.cooldown = 1.8;
        state.rippleProgress = 0.0;

        // Sound effect
        sounds.playSpeedRing();

        // Physical boost event for Rapier vehicle
        window.dispatchEvent(
          new CustomEvent('app:boost-vehicle', {
            detail: {
              direction: ring.forward,
              force: 650,
            },
          })
        );

        // Notify race system if racing and hit correct checkpoint
        if (isRacing && currentCheckpoint === idx) {
          onReachCheckpoint?.(idx);
        }
      }

      // Shockwave ripple animation on trigger
      if (state.rippleProgress < 1.0) {
        state.rippleProgress += dt * 2.4;
        const p = Math.min(state.rippleProgress, 1.0);
        if (rippleMesh) {
          rippleMesh.visible = true;
          const scale = 1.0 + p * 2.2;
          rippleMesh.scale.set(scale, scale, scale);
          const mat = rippleMesh.material as THREE.MeshBasicMaterial;
          if (mat) {
            mat.opacity = (1.0 - p) * 0.85;
          }
        }
      } else if (rippleMesh) {
        rippleMesh.visible = false;
      }

      // Energy field pulse styling
      if (fieldMat) {
        if (isCurrentTarget) {
          // Intense golden/cyan beacon pulse for race target ring
          const activePulse = 0.55 + Math.sin(time * 3.0) * 0.25;
          fieldMat.opacity = activePulse;
          fieldMat.color.set('#fde047'); // Golden beacon
        } else {
          const pulse = 0.25 + Math.sin(time + idx * 1.4) * 0.10;
          fieldMat.opacity = state.cooldown > 0 ? 0.7 : pulse;
          fieldMat.color.set('#38bdf8'); // Sky blue
        }
      }
    });

    // Directional guidance to current target ring (3D Arrow, Runway Corridor, Beacon & Sonar)
    const targetRing = isRacing ? SPEED_RINGS[currentCheckpoint] : null;
    if (targetRing) {
      const dx = targetRing.position[0] - ship.x;
      const dz = targetRing.position[2] - ship.z;
      const targetAngle = Math.atan2(dx, dz);

      // 1. Waypoint Arrow hovering directly over the vehicle
      if (waypointGroupRef.current) {
        waypointGroupRef.current.visible = true;
        const hoverY = ship.y + 2.0 + Math.sin(time * 3.5) * 0.12;
        waypointGroupRef.current.position.set(ship.x, hoverY, ship.z);
        waypointGroupRef.current.rotation.set(0, targetAngle, 0);
      }

      // 2. Dynamic Runway Guidance Corridor (6 glowing light pulses marching toward the ring)
      if (corridorGroupRef.current) {
        corridorGroupRef.current.visible = true;
        const children = corridorGroupRef.current.children;
        const count = children.length;

        for (let i = 0; i < count; i++) {
          const marker = children[i] as THREE.Mesh;
          const phase = (i / count + (time * 0.4) % 1.0) % 1.0;
          const t = 0.08 + phase * 0.84;
          marker.position.set(
            ship.x + dx * t,
            0.65 + Math.sin(t * Math.PI) * 0.5,
            ship.z + dz * t
          );
          const s = 0.28 + Math.sin(t * Math.PI) * 0.35;
          marker.scale.set(s, s, s);
        }
      }

      // 3. Tall sky-piercing beacon column (80u height)
      if (targetBeaconRef.current) {
        targetBeaconRef.current.visible = true;
        targetBeaconRef.current.position.set(
          targetRing.position[0],
          targetRing.position[1] + 40,
          targetRing.position[2]
        );
        const mat = targetBeaconRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.28 + Math.sin(time * 2.5) * 0.12;
        }
      }

      // 4. Concentric floor sonar wave expanding at the target ring
      if (targetGroundPingRef.current) {
        targetGroundPingRef.current.visible = true;
        targetGroundPingRef.current.position.set(
          targetRing.position[0],
          0.2,
          targetRing.position[2]
        );
        const pingCycle = (time * 1.4) % 1.0;
        const pingScale = 1.0 + pingCycle * 3.8;
        targetGroundPingRef.current.scale.set(pingScale, pingScale, 1);
        const pingMat = targetGroundPingRef.current.material as THREE.MeshBasicMaterial;
        if (pingMat) {
          pingMat.opacity = (1.0 - pingCycle) * 0.65;
        }
      }
    } else {
      if (waypointGroupRef.current) waypointGroupRef.current.visible = false;
      if (corridorGroupRef.current) corridorGroupRef.current.visible = false;
      if (targetBeaconRef.current) targetBeaconRef.current.visible = false;
      if (targetGroundPingRef.current) targetGroundPingRef.current.visible = false;
    }
  });

  return (
    <group ref={ringsGroupRef}>
      {/* 3D Holographic Waypoint Arrow hovering over the ship */}
      <group ref={waypointGroupRef} visible={false}>
        {/* Main sharp directional arrow pointer pointing towards +Z */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.34, 0.8, 4]} />
          <meshBasicMaterial
            color="#fde047"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Left chevron wing */}
        <mesh position={[-0.24, 0, 0.1]} rotation={[0, -0.45, 0]}>
          <boxGeometry args={[0.07, 0.07, 0.5]} />
          <meshBasicMaterial
            color="#fde047"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Right chevron wing */}
        <mesh position={[0.24, 0, 0.1]} rotation={[0, 0.45, 0]}>
          <boxGeometry args={[0.07, 0.07, 0.5]} />
          <meshBasicMaterial
            color="#fde047"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Core trailing pulse orb */}
        <mesh position={[0, 0, -0.15]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Runway Approach Light Corridor (6 floating waypoint markers) */}
      <group ref={corridorGroupRef} visible={false}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i}>
            <octahedronGeometry args={[0.4, 0]} />
            <meshBasicMaterial
              color="#fde047"
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Concentric Sonar Pulse expanding on ground plane at target ring */}
      <mesh
        ref={targetGroundPingRef}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[2.7, 3.1, 32]} />
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Sky-Piercing Beacon Column (80 units tall) */}
      <mesh ref={targetBeaconRef} visible={false}>
        <cylinderGeometry args={[0.45, 3.5, 80, 16, 1, true]} />
        <meshBasicMaterial
          color="#fde047"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {SPEED_RINGS.map((ring, idx) => {
        const isStartRing = ring.id === 0;
        const isCurrentTarget = isRacing && currentCheckpoint === idx;

        return (
          <group
            key={ring.id}
            position={ring.position}
            rotation={[0, ring.rotationY, 0]}
          >
            {/* Outer Heavy Octagonal Jump Gate Chassis (Machined Dark Gunmetal) */}
            <mesh castShadow={graphicsQuality !== 'low'}>
              <torusGeometry args={[3.35, 0.32, 6, 12]} />
              <meshStandardMaterial
                color={isStartRing ? '#334155' : '#1e293b'}
                roughness={0.34}
                metalness={0.65}
                flatShading
              />
            </mesh>

            {/* Heavy Structural Perimeter Lug Clamps (4 Quadrants) */}
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, cIdx) => (
              <group key={`clamp-${cIdx}`} rotation={[0, 0, angle]}>
                <mesh position={[0, 3.42, 0]} castShadow>
                  <boxGeometry args={[0.42, 0.38, 0.52]} />
                  <meshStandardMaterial
                    color={isStartRing ? '#f59e0b' : '#475569'}
                    roughness={0.32}
                    metalness={0.7}
                    flatShading
                  />
                </mesh>
                {/* Luminous Status Diode */}
                <mesh position={[0, 3.42, 0.28]}>
                  <sphereGeometry args={[0.07, 6, 6]} />
                  <meshBasicMaterial
                    color={isStartRing ? '#fde047' : isCurrentTarget ? '#fbbf24' : '#38bdf8'}
                  />
                </mesh>
              </group>
            ))}

            {/* Counter-Rotating Inner Mechanical Gyro Ring */}
            <group ref={(el) => { innerRingsRef.current[idx] = el; }}>
              <mesh>
                <torusGeometry args={[3.08, 0.08, 6, 16]} />
                <meshStandardMaterial
                  color={isStartRing ? '#fde047' : isCurrentTarget ? '#fbbf24' : '#38bdf8'}
                  emissive={isStartRing ? '#eab308' : isCurrentTarget ? '#f59e0b' : '#0284c7'}
                  emissiveIntensity={1.8}
                  roughness={0.25}
                  metalness={0.4}
                  flatShading
                />
              </mesh>
              {/* Internal Gyro Spoke Nodes */}
              {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((sAngle, sIdx) => (
                <group key={`spoke-${sIdx}`} rotation={[0, 0, sAngle]}>
                  <mesh position={[0, 3.08, 0]}>
                    <cylinderGeometry args={[0.04, 0.04, 0.45, 6]} />
                    <meshStandardMaterial
                      color="#64748b"
                      roughness={0.3}
                      metalness={0.8}
                    />
                  </mesh>
                </group>
              ))}
            </group>

            {/* Holographic Checkpoint Plaque / Start Banner */}
            <group position={[0, 4.25, 0]}>
              {/* Base Plaque Frame */}
              <mesh castShadow>
                <boxGeometry args={[2.0, 0.55, 0.1]} />
                <meshStandardMaterial
                  color="#0f172a"
                  roughness={0.32}
                  metalness={0.5}
                  flatShading
                />
              </mesh>
              {/* Holographic Display Face */}
              <mesh position={[0, 0, 0.06]}>
                <planeGeometry args={[1.82, 0.42]} />
                <meshBasicMaterial
                  color={isStartRing ? '#fde047' : isCurrentTarget ? '#fbbf24' : '#38bdf8'}
                  transparent
                  opacity={0.88}
                />
              </mesh>
              {/* Central Glowing Checkpoint Core / Chevron Accent */}
              <mesh position={[0, 0, 0.08]}>
                <boxGeometry args={[0.5, 0.18, 0.02]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>

            {/* Translucent Vortex Energy Field Diaphragm */}
            <mesh>
              <ringGeometry args={[0.25, 3.05, 32]} />
              <meshBasicMaterial
                ref={(el) => (fieldMatsRef.current[idx] = el)}
                color={isStartRing ? '#fde047' : '#38bdf8'}
                transparent
                opacity={0.32}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Concentric Inner Energy Vortex Ripple Ring */}
            <mesh rotation={[0, 0, idx * 0.45]}>
              <ringGeometry args={[1.5, 1.7, 24]} />
              <meshBasicMaterial
                color={isStartRing ? '#fde047' : isCurrentTarget ? '#fbbf24' : '#38bdf8'}
                transparent
                opacity={0.4}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Directional Velocity Chevrons (>> arrow indicators) */}
            <group position={[0, 0, 0.1]}>
              <mesh position={[0, 2.15, 0]} rotation={[0, 0, 0]}>
                <coneGeometry args={[0.32, 0.55, 3]} />
                <meshBasicMaterial color={isStartRing ? '#fde047' : '#38bdf8'} />
              </mesh>
              <mesh position={[0, -2.15, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.32, 0.55, 3]} />
                <meshBasicMaterial color={isStartRing ? '#fde047' : '#38bdf8'} />
              </mesh>
              <mesh position={[-2.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <coneGeometry args={[0.32, 0.55, 3]} />
                <meshBasicMaterial color={isStartRing ? '#fde047' : '#38bdf8'} />
              </mesh>
              <mesh position={[2.15, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.32, 0.55, 3]} />
                <meshBasicMaterial color={isStartRing ? '#fde047' : '#38bdf8'} />
              </mesh>
            </group>

            {/* Shockwave Energy Ripple on Activation (Hyperspace Burst) */}
            <mesh
              ref={(el) => (ripplesRef.current[idx] = el)}
              visible={false}
            >
              <ringGeometry args={[3.0, 3.6, 32]} />
              <meshBasicMaterial
                color={isStartRing ? '#fde047' : '#38bdf8'}
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Dynamic Point Light Glow */}
            {graphicsQuality !== 'low' && (
              <pointLight
                color={isStartRing ? '#fde047' : isCurrentTarget ? '#fbbf24' : '#38bdf8'}
                intensity={isCurrentTarget ? 2.5 : 1.4}
                distance={11}
              />
            )}
          </group>
        );
      })}
    </group>
  );
};
