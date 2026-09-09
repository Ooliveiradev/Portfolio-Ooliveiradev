import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandId, GraphicsQuality } from '../../../types';

interface IslandLifeProps {
  islandId: IslandId;
  themeColor: string;
  isNear?: boolean;
  graphicsQuality?: GraphicsQuality;
}

export const IslandLife: React.FC<IslandLifeProps> = ({
  islandId,
  themeColor,
  isNear = false,
  graphicsQuality = 'mid',
}) => {
  const droneRef = useRef<THREE.Group>(null);
  const scanConeRef = useRef<THREE.Mesh>(null);
  const radarHeadRef = useRef<THREE.Group>(null);
  const radarLedRef = useRef<THREE.Mesh>(null);
  const runwayLedsRef = useRef<(THREE.Mesh | null)[]>([]);

  // Unique phase offset per island so drones don''t move in lockstep
  const phaseOffset =
    islandId === 'projects'
      ? 0.0
      : islandId === 'experience'
      ? 1.3
      : islandId === 'skills'
      ? 2.6
      : islandId === 'education'
      ? 3.9
      : 5.2;

  useFrame((_, delta) => {
    const time = Date.now() * 0.001;

    // 1. Autonomous Orbiting Scout Drone
    if (droneRef.current) {
      const droneSpeed = 0.55;
      const angle = time * droneSpeed + phaseOffset;
      const orbitR = 5.8 + Math.sin(time * 1.2 + phaseOffset) * 0.35;

      const dx = Math.cos(angle) * orbitR;
      const dz = Math.sin(angle) * orbitR;
      const dy = 1.9 + Math.sin(time * 2.4 + phaseOffset) * 0.25;

      droneRef.current.position.set(dx, dy, dz);

      // Tangent yaw heading (facing forward along orbit)
      const tangentYaw = angle + Math.PI / 2;
      // Gentle banking roll into the curve
      const bankRoll = Math.sin(time * 1.5) * 0.12;
      droneRef.current.rotation.set(bankRoll, -tangentYaw, 0);

      // Oscillating holographic scanner beam
      if (scanConeRef.current) {
        scanConeRef.current.rotation.z = Math.sin(time * 3.5 + phaseOffset) * 0.18;
      }
    }

    // 2. Telemetry Radar Dish Rotation
    if (radarHeadRef.current) {
      radarHeadRef.current.rotation.y += delta * 1.4;
    }
    if (radarLedRef.current) {
      const isBlinking = Math.sin(time * 7.0 + phaseOffset) > 0.2;
      const mat = radarLedRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = isBlinking ? 1.0 : 0.2;
    }

    // 3. Sequenced Approach Runway Lights Chase Wave
    const chaseSpeed = isNear ? 6.5 : 3.8;
    const chaseCycle = (time * chaseSpeed) % 6;

    runwayLedsRef.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const distToPhase = Math.abs(chaseCycle - idx);
      const isLit = distToPhase < 0.95 || Math.abs(chaseCycle - idx - 6) < 0.95;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = isLit ? (isNear ? 1.0 : 0.85) : 0.2;
      }
    });
  });

  return (
    <group>
      {/* ============================================================
          1. AUTONOMOUS SCOUT DRONE WITH HOLOGRAPHIC SCANNER
         ============================================================ */}
      <group ref={droneRef} position={[5.8, 1.9, 0]}>
        {/* Drone Main Aerodynamic Chassis */}
        <mesh castShadow={graphicsQuality !== 'low'}>
          <capsuleGeometry args={[0.18, 0.42, 6, 8]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.75}
            metalness={0.25}
            flatShading
          />
        </mesh>

        {/* Thematic Sensor Visor Strip (Glowing) */}
        <mesh position={[0, 0.05, 0.22]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.3, 0.08, 0.05]} />
          <meshBasicMaterial color={themeColor} />
        </mesh>

        {/* Dual Anti-Gravity Rotor Wings */}
        <mesh position={[-0.32, 0.04, 0]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.26, 0.04, 0.16]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0.32, 0.04, 0]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.26, 0.04, 0.16]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* Anti-Grav Thruster Glow Emitters (Underneath) */}
        <mesh position={[-0.32, -0.02, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.32, -0.02, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Downward Holographic Scanning Beam (Conical Searchlight) */}
        <group position={[0, -0.12, 0]}>
          <mesh
            ref={scanConeRef}
            position={[0, -0.9, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.65, 1.8, 12, 1, true]} />
            <meshBasicMaterial
              color={themeColor}
              transparent
              opacity={0.16}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Subtle Scanning Ground Spot Ring */}
          <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.65, 16]} />
            <meshBasicMaterial
              color={themeColor}
              transparent
              opacity={0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          2. MINI TELEMETRY RADAR TOWER ON PLATFORM EDGE
         ============================================================ */}
      <group position={[-3.6, 0.1, -2.4]}>
        {/* Heavy Mounting Base */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.32, 0.42, 0.3, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Structural Mast */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.7, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>

        {/* Rotating Radar Head & Parabolic Dish */}
        <group ref={radarHeadRef} position={[0, 1.0, 0]}>
          {/* Gimbal Axis */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Angled Parabolic Dish */}
          <group rotation={[0.35, 0, 0]}>
            <mesh position={[0, 0.1, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.34, 0.22, 8, 1, true]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.75}
                metalness={0.25}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Feed Horn */}
            <mesh position={[0, 0.1, 0.34]}>
              <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
              <meshBasicMaterial color="#94a3b8" />
            </mesh>
            {/* Blinking Signal Beacon LED */}
            <mesh ref={radarLedRef} position={[0, 0.1, 0.48]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ============================================================
          3. SEQUENCED APPROACH RUNWAY LIGHTS CHASE WAVE
         ============================================================ */}
      <group position={[0, 0.1, 3.2]}>
        {/* Array of 6 Runway Guidance LEDs lining the approach corridor */}
        {[-1.2, -0.6, 0, 0.6, 1.2, 1.8].map((offsetZ, i) => {
          // Curving approach trajectory
          const lx = (i % 2 === 0 ? -0.85 : 0.85);
          const lz = offsetZ + 1.2;

          return (
            <group key={i} position={[lx, 0, lz]}>
              {/* Pedestal Base */}
              <mesh>
                <cylinderGeometry args={[0.08, 0.11, 0.16, 6]} />
                <meshStandardMaterial color="#334155" roughness={0.85} />
              </mesh>
              {/* Glowing Indicator Bulb */}
              <mesh
                ref={(el) => (runwayLedsRef.current[i] = el)}
                position={[0, 0.12, 0]}
              >
                <sphereGeometry args={[0.075, 8, 8]} />
                <meshBasicMaterial
                  color={themeColor}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};
