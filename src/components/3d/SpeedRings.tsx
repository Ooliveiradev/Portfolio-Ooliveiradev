import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../audio/soundManager';
import { GraphicsQuality } from '../../types';

import { SPEED_RINGS, RACE_GATES, RACE_CHECKPOINTS, RACE_CHECKPOINT_HALF_WIDTH, raceCurve, crossGate, RaceState } from '../../utils/raceTrack';
import { createTrackFrame, sampleTrackFrame } from '../../utils/raceWallGuide';
export { SPEED_RINGS } from '../../utils/raceTrack';

interface SpeedRingsProps {
  raceState?: RaceState;
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
  isRacing?: boolean;
  currentCheckpoint?: number;
  onReachCheckpoint?: (index: number) => void;
  onNearStartGate?: (isNear: boolean) => void;
}

const SpeedRingsComponent: React.FC<SpeedRingsProps> = ({
  sharedVehiclePos,
  graphicsQuality = 'mid',
  isRacing = false,
  raceState = 'idle',
  currentCheckpoint = 0,
  onReachCheckpoint,
  onNearStartGate,
}) => {
  const raceActive = raceState === 'countdown' || raceState === 'racing';
  const rings = raceActive ? RACE_GATES : SPEED_RINGS;
  const ringsGroupRef = useRef<THREE.Group>(null);
  const ripplesRef = useRef<(THREE.Mesh | null)[]>([]);
  const fieldMatsRef = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const targetBeaconRef = useRef<THREE.Mesh>(null);
  const targetGroundPingRef = useRef<THREE.Mesh>(null);
  const waypointGroupRef = useRef<THREE.Group>(null);
  const corridorGroupRef = useRef<THREE.Group>(null);
  const trackFrame = useRef(createTrackFrame());
  const markerPoint = useMemo(() => new THREE.Vector3(), []);
  const innerRingsRef = useRef<(THREE.Group | null)[]>([]);

  // State per ring: cooldown & shockwave timer
  const ringStates = useMemo(() => {
    return rings.map(() => ({
      cooldown: 0,
      rippleProgress: 1.0,
    }));
  }, [rings]);

  const wasNearRef = useRef(false);
  const previousShip = useRef(new THREE.Vector3());
  const crossingReady = useRef(false);
  useEffect(() => {
    crossingReady.current = false;
    ringStates.forEach(state => { state.cooldown = 0; });
  }, [raceState, ringStates]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const time = Date.now() * 0.003;
    const ship = sharedVehiclePos.current;
    if (!crossingReady.current) { previousShip.current.copy(ship); crossingReady.current = true; }

    // Counter-rotate mechanical gyro rings inside every jump gate
    innerRingsRef.current.forEach((innerGroup, idx) => {
      if (innerGroup && !raceActive) {
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
    rings.forEach((ring, idx) => {
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

      const isCurrentTarget = isRacing && RACE_CHECKPOINTS[currentCheckpoint]?.id === idx;

      // Ring activation trigger (within 3.2 units of ring center)
      const crossingRadius = crossGate(previousShip.current, ship, ring, isRacing ? RACE_CHECKPOINT_HALF_WIDTH : 3.05);
      const perfect = crossingRadius !== null && crossingRadius <= 2.2;
      const previousDistanceSq = (previousShip.current.x - ring.position[0]) ** 2 +
        (previousShip.current.y - ring.position[1]) ** 2 + (previousShip.current.z - ring.position[2]) ** 2;
      const activated = isRacing ? isCurrentTarget && crossingRadius !== null :
        distSq < 3.2 * 3.2 && previousDistanceSq >= 3.2 * 3.2;
      if (raceState !== 'countdown' && raceState !== 'finished' && activated && state.cooldown <= 0) {
        state.cooldown = 1.8;
        state.rippleProgress = raceActive ? 1 : 0;

        // Sound effect
        sounds.playSpeedRing();

        // Physical boost event for Rapier vehicle: propel in the direction the rocket is facing
        if (!isRacing || perfect) window.dispatchEvent(
          new CustomEvent('app:boost-vehicle', {
            detail: {
              useRocketFacing: !isRacing,
              direction: ring.forward,
              force: perfect ? 420 : 180,
              perfect: isRacing && perfect,
            },
          })
        );

        // Notify race system if racing and hit correct checkpoint
        if (isRacing && RACE_CHECKPOINTS[currentCheckpoint]?.id === idx) {
          onReachCheckpoint?.(currentCheckpoint);
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
        if (raceActive) {
          fieldMat.opacity = 0;
        } else if (isCurrentTarget) {
          // Intense golden/cyan beacon pulse for race target ring
          const activePulse = 0.55 + Math.sin(time * 3.0) * 0.25;
          fieldMat.opacity = activePulse;
        } else {
          const pulse = 0.25 + Math.sin(time + idx * 1.4) * 0.10;
          fieldMat.opacity = state.cooldown > 0 ? 0.7 : pulse;
        }
      }
    });

    previousShip.current.copy(ship);

    // Directional guidance to current target ring (3D Arrow, Runway Corridor, Beacon & Sonar)
    const targetRing = isRacing ? RACE_CHECKPOINTS[currentCheckpoint] : null;
    if (targetRing) {
      const dx = targetRing.position[0] - ship.x;
      const dz = targetRing.position[2] - ship.z;
      const targetAngle = Math.atan2(dx, dz);

      // 1. Waypoint Arrow hovering directly over the vehicle
      if (waypointGroupRef.current) {
        waypointGroupRef.current.visible = false;
        const hoverY = ship.y + 2.0 + Math.sin(time * 3.5) * 0.12;
        waypointGroupRef.current.position.set(ship.x, hoverY, ship.z);
        waypointGroupRef.current.rotation.set(0, targetAngle, 0);
      }

      // 2. Dynamic Runway Guidance Corridor (6 glowing light pulses marching toward the ring)
      if (corridorGroupRef.current) {
        corridorGroupRef.current.visible = true;
        const children = corridorGroupRef.current.children;
        const count = children.length;
        const progress = sampleTrackFrame(ship.x, ship.z, trackFrame.current).distance;

        for (let i = 0; i < count; i++) {
          const marker = children[i] as THREE.Mesh;
          const phase = (i / count + (time * 0.4) % 1.0) % 1.0;
          const t = 0.08 + phase * 0.84;
          raceCurve.getPointAt((progress + (i + 1) * 0.009) % 1, markerPoint);
          marker.position.set(markerPoint.x, -0.05, markerPoint.z);
          const s = 0.28 + Math.sin(t * Math.PI) * 0.35;
          marker.scale.set(s, s, s);
        }
      }

      // 3. Tall sky-piercing beacon column (80u height)
      if (targetBeaconRef.current) {
        targetBeaconRef.current.visible = false;
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
        targetGroundPingRef.current.visible = false;
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

      {rings.map((ring, idx) => {
        const isStartRing = ring.id === 0;
        const isCurrentTarget = isRacing && RACE_CHECKPOINTS[currentCheckpoint]?.id === idx;

        if (raceActive) {
          const color = isCurrentTarget ? '#fbbf24' : isStartRing ? '#fde68a' : '#49889c';
          return <group key={ring.id} position={ring.position} rotation={[0, ring.rotationY, 0]}>
            {[-15.8, 15.8].map(side => <mesh key={side} position={[side, 1.6, 0]}>
              <boxGeometry args={[0.18, 5.5, 0.18]} /><meshBasicMaterial color={color} />
            </mesh>)}
            <mesh position={[0, 4.3, 0]}>
              <boxGeometry args={[31.6, 0.16, 0.16]} /><meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[30, 0.4]} /><meshBasicMaterial color={color} transparent opacity={0.65} />
            </mesh>
            <mesh position={[0, 4.3, 0]}>
              <boxGeometry args={[4.4, 0.3, 0.3]} /><meshBasicMaterial color={isCurrentTarget ? '#fff3ba' : '#77a9b9'} />
            </mesh>
          </group>;
        }

        return (
          <group
            key={ring.id}
            position={ring.position}
            rotation={[0, ring.rotationY, 0]}
            scale={raceActive ? [4.9, 1.3, 1] : [1, 1, 1]}
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
                color={isStartRing || isCurrentTarget ? '#fde047' : '#38bdf8'}
                transparent
                opacity={0.32}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>

            {/* Concentric Inner Energy Vortex Ripple Ring */}
            <mesh rotation={[0, 0, idx * 0.45]} visible={!raceActive}>
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

          </group>
        );
      })}
    </group>
  );
};

export const SpeedRings = React.memo(SpeedRingsComponent);
