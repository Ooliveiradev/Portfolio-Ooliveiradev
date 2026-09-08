import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../audio/soundManager';

interface SpaceVehicleProps {
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  onPositionChange: (pos: [number, number, number]) => void;
  onRotationChange?: (rotY: number) => void;
  isDriving: boolean;
  virtualInput: { x: number; y: number; boost: boolean };
  onClearTargetPosition?: () => void;
}

export const SpaceVehicle: React.FC<SpaceVehicleProps> = ({
  position,
  targetPosition,
  onPositionChange,
  onRotationChange,
  virtualInput,
  onClearTargetPosition,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftEngineRef = useRef<THREE.Mesh>(null);
  const rightEngineRef = useRef<THREE.Mesh>(null);
  const leftInnerFlameRef = useRef<THREE.Mesh>(null);
  const rightInnerFlameRef = useRef<THREE.Mesh>(null);
  const centralEngineRef = useRef<THREE.Mesh>(null);
  const leftStrobeRef = useRef<THREE.MeshBasicMaterial>(null);
  const rightStrobeRef = useRef<THREE.MeshBasicMaterial>(null);

  // Flight physics state
  const pos = useRef(new THREE.Vector3(...position));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationY = useRef(0);
  const targetRotationY = useRef(0);
  const rollZ = useRef(0);
  const pitchX = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      if (e.key === ' ') {
        sounds.playBoost();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const handleBlur = () => {
      keys.current = {};
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Check keyboard or virtual touch inputs
    const forwardKey = Boolean(keys.current['arrowup'] || keys.current['w'] || virtualInput.y < -0.2);
    const backwardKey = Boolean(keys.current['arrowdown'] || keys.current['s'] || virtualInput.y > 0.2);
    const leftKey = Boolean(keys.current['arrowleft'] || keys.current['a'] || virtualInput.x < -0.2);
    const rightKey = Boolean(keys.current['arrowright'] || keys.current['d'] || virtualInput.x > 0.2);
    const isBoosting = Boolean(keys.current[' '] || virtualInput.boost);

    const isManualInput =
      forwardKey ||
      backwardKey ||
      leftKey ||
      rightKey ||
      Math.abs(virtualInput.x) > 0.1 ||
      Math.abs(virtualInput.y) > 0.1;

    // If player uses manual controls, immediately cancel any auto-navigation target
    if (isManualInput && targetPosition) {
      onClearTargetPosition?.();
    }

    // Responsive flight dynamics scaled for expanded galaxy
    const baseSpeed = isBoosting ? 44 : 25;
    const turnSpeed = 3.6;

    let thrust = 0;
    let turn = 0;

    if (forwardKey) thrust += 1;
    if (backwardKey) thrust -= 0.7;
    if (leftKey) turn += 1;
    if (rightKey) turn -= 1;

    // Touch joystick analog influence
    if (Math.abs(virtualInput.x) > 0.1) {
      turn = -virtualInput.x * 1.6;
    }
    if (Math.abs(virtualInput.y) > 0.1) {
      thrust = -virtualInput.y * 1.4;
    }

    // Auto-navigation towards target position
    if (targetPosition && !isManualInput) {
      const targetVec = new THREE.Vector3(...targetPosition);
      const diff = new THREE.Vector3().subVectors(targetVec, pos.current);
      diff.y = 0;
      const dist = diff.length();

      if (dist > 2.2) {
        const desiredAngle = Math.atan2(diff.x, diff.z);
        let angleDiff = desiredAngle - rotationY.current;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        rotationY.current += angleDiff * Math.min(delta * 4.5, 1);
        thrust = Math.min(dist * 0.75, 1.3);

        // Smooth elevation adjust
        pos.current.y = THREE.MathUtils.lerp(pos.current.y, targetPosition[1], delta * 2.8);
      } else {
        onClearTargetPosition?.();
        thrust = 0;
      }
    }

    // Update yaw rotation
    targetRotationY.current += turn * turnSpeed * delta;
    rotationY.current = THREE.MathUtils.lerp(rotationY.current, targetRotationY.current, delta * 9);

    // Dynamic flight banking (roll Z) when turning
    const targetRoll = -turn * 0.52;
    rollZ.current = THREE.MathUtils.lerp(rollZ.current, targetRoll, delta * 9);

    // Dynamic pitch (pitch X) when accelerating/braking
    const targetPitch = thrust * 0.18;
    pitchX.current = THREE.MathUtils.lerp(pitchX.current, targetPitch, delta * 7);

    // Apply thrust along forward vector
    const forward = new THREE.Vector3(
      Math.sin(rotationY.current),
      0,
      Math.cos(rotationY.current)
    );

    if (thrust !== 0) {
      velocity.current.addScaledVector(forward, thrust * baseSpeed * delta);
    } else {
      // Firm braking when throttle released
      velocity.current.multiplyScalar(Math.pow(0.52, delta * 30));
      if (velocity.current.lengthSq() < 0.005) {
        velocity.current.set(0, 0, 0);
      }
    }

    // Space drag
    velocity.current.multiplyScalar(Math.pow(0.89, delta * 30));
    pos.current.addScaledVector(velocity.current, delta);

    // Gentle organic floating hover in space
    const hoverY = Math.sin(Date.now() * 0.0035) * 0.22;
    groupRef.current.position.set(pos.current.x, pos.current.y + hoverY, pos.current.z);
    groupRef.current.rotation.y = rotationY.current;
    groupRef.current.rotation.z = rollZ.current;
    groupRef.current.rotation.x = pitchX.current;

    // Animate plasma engine flares based on acceleration and boost
    const activeThrust = Math.abs(thrust) + (isBoosting ? 2.2 : 0.35);
    const pulseScale = Math.max(0.2, activeThrust * (1 + Math.sin(Date.now() * 0.045) * 0.22));

    if (leftEngineRef.current && rightEngineRef.current && centralEngineRef.current) {
      leftEngineRef.current.scale.set(pulseScale * 0.9, pulseScale * 0.9, pulseScale * 2.2);
      rightEngineRef.current.scale.set(pulseScale * 0.9, pulseScale * 0.9, pulseScale * 2.2);
      centralEngineRef.current.scale.set(pulseScale * 1.25, pulseScale * 1.25, pulseScale * 2.8);
    }
    if (leftInnerFlameRef.current && rightInnerFlameRef.current) {
      leftInnerFlameRef.current.scale.set(pulseScale * 0.5, pulseScale * 0.5, pulseScale * 1.6);
      rightInnerFlameRef.current.scale.set(pulseScale * 0.5, pulseScale * 0.5, pulseScale * 1.6);
    }

    // Animate wingtip strobe navigation lights
    const strobeTime = (Math.sin(Date.now() * 0.008) + 1) * 0.5;
    if (leftStrobeRef.current && rightStrobeRef.current) {
      leftStrobeRef.current.opacity = strobeTime > 0.6 ? 1.0 : 0.3;
      rightStrobeRef.current.opacity = strobeTime > 0.6 ? 1.0 : 0.3;
    }

    // Propagate position and rotation heading to parent
    onPositionChange([pos.current.x, pos.current.y, pos.current.z]);
    onRotationChange?.(rotationY.current);
  });

  return (
    <group ref={groupRef} position={position} dispose={null}>
      {/* ==========================================================
          BRUNO SIMON STYLE HIGH-DETAIL EXPLORATION SPACESHIP
          Modular toy-like aesthetics with crisp materials & bevels
         ========================================================== */}

      {/* 1. LOWER CHASSIS & ARMOR SKIRT (Graphite Titanium) */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.28, 2.7]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* 2. MAIN UPPER FUSELAGE HULL (Ceramic Polar White) */}
      <mesh position={[0, 0.46, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.32, 2.3]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.25} />
      </mesh>

      {/* Racing Tech Stripe down central spine */}
      <mesh position={[0, 0.63, 0.1]}>
        <boxGeometry args={[0.32, 0.04, 2.25]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* 3. SCULPTED AERODYNAMIC NOSE CONE */}
      {/* Upper white nose cone */}
      <mesh position={[0, 0.44, 1.7]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.58, 1.3, 6]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Lower dark intake splitter */}
      <mesh position={[0, 0.25, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.48, 1.1, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Front Nose Radar Sensor Probe */}
      <mesh position={[0, 0.44, 2.42]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Dual Front Headlights / Fog Projectors */}
      <group position={[0, 0.34, 1.95]}>
        <mesh position={[-0.32, 0, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <boxGeometry args={[0.12, 0.1, 0.2]} />
          <meshBasicMaterial color="#e0f2fe" />
        </mesh>
        <pointLight position={[0, 0, 0.5]} color="#bae6fd" intensity={3.0} distance={14} />
      </group>

      {/* 4. CANOPY & DETAILED ASTRONAUT PILOT COCKPIT */}
      {/* Cockpit Interior Tub & Instrument Dash */}
      <group position={[0, 0.62, 0.28]}>
        <mesh position={[0, -0.04, 0]}>
          <boxGeometry args={[0.62, 0.15, 1.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Holographic Instrument Display Panel */}
        <mesh position={[0, 0.08, 0.42]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.4, 0.18]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Adorable Mini Astronaut Pilot */}
        <group position={[0, 0.12, -0.08]}>
          {/* Astronaut Suit Torso */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.26, 0.24, 0.2]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
          </mesh>
          {/* Cyan Suit Collar / Harness */}
          <mesh position={[0, 0.17, 0.02]}>
            <boxGeometry args={[0.22, 0.05, 0.16]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          {/* Astronaut Helmet (Spherical White Dome) */}
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.15} metalness={0.3} />
          </mesh>
          {/* Gold Mirror Visor (Bruno Simon Iconic Reflective Shield) */}
          <mesh position={[0, 0.33, 0.08]} rotation={[0.1, 0, 0]}>
            <sphereGeometry args={[0.11, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.05} metalness={0.95} />
          </mesh>
        </group>
      </group>

      {/* Glass Bubble Canopy (Tinted Polycarbonate Glass) */}
      <mesh position={[0, 0.78, 0.28]} rotation={[-0.14, 0, 0]} castShadow>
        <boxGeometry args={[0.74, 0.38, 1.32]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.06}
          metalness={0.2}
          transparent
          opacity={0.42}
        />
      </mesh>
      {/* Canopy Reflective Glint Highlight Strip */}
      <mesh position={[0, 0.98, 0.28]} rotation={[-0.14, 0, 0]}>
        <planeGeometry args={[0.56, 1.0]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.35} />
      </mesh>

      {/* 5. FORWARD CANARD STABILIZERS (Aerodynamic Dart Fins) */}
      <group position={[0, 0.42, 1.1]}>
        <mesh position={[-0.72, 0, 0]} rotation={[0, -0.25, 0.08]}>
          <boxGeometry args={[0.6, 0.04, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.2} />
        </mesh>
        <mesh position={[0.72, 0, 0]} rotation={[0, 0.25, -0.08]}>
          <boxGeometry args={[0.6, 0.04, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.2} />
        </mesh>
      </group>

      {/* 6. MAIN SWEPT DELTA WINGS WITH WINGLETS & STROBE LIGHTS */}
      {/* Left Main Wing */}
      <group position={[-1.5, 0.38, -0.1]}>
        {/* Main Wing Plane */}
        <mesh rotation={[0, 0.18, 0.04]} castShadow>
          <boxGeometry args={[1.75, 0.07, 1.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
        </mesh>
        {/* Wing Heat Dissipator Vent / Carbon Panel */}
        <mesh position={[0.1, 0.045, -0.2]} rotation={[0, 0.18, 0.04]}>
          <boxGeometry args={[0.8, 0.02, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Angled Winglet Endplate */}
        <mesh position={[-0.92, 0.32, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.07, 0.62, 0.9]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </mesh>
        {/* Left Strobe Beacon (Red Nav Light) */}
        <mesh position={[-0.97, 0.62, 0.18]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial ref={leftStrobeRef} color="#ef4444" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Right Main Wing */}
      <group position={[1.5, 0.38, -0.1]}>
        {/* Main Wing Plane */}
        <mesh rotation={[0, -0.18, -0.04]} castShadow>
          <boxGeometry args={[1.75, 0.07, 1.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
        </mesh>
        {/* Wing Heat Dissipator Vent / Carbon Panel */}
        <mesh position={[-0.1, 0.045, -0.2]} rotation={[0, -0.18, -0.04]}>
          <boxGeometry args={[0.8, 0.02, 0.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        {/* Angled Winglet Endplate */}
        <mesh position={[0.92, 0.32, 0]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.07, 0.62, 0.9]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} />
        </mesh>
        {/* Right Strobe Beacon (Green Nav Light) */}
        <mesh position={[0.97, 0.62, 0.18]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshBasicMaterial ref={rightStrobeRef} color="#10b981" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* 7. TWIN ANGLED DORSAL STABILIZER TAIL FINS */}
      <group position={[0, 0.82, -0.85]}>
        {/* Left Fin */}
        <mesh position={[-0.32, 0, 0]} rotation={[0, 0, -0.22]} castShadow>
          <boxGeometry args={[0.08, 0.78, 0.85]} />
          <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Right Fin */}
        <mesh position={[0.32, 0, 0]} rotation={[0, 0, 0.22]} castShadow>
          <boxGeometry args={[0.08, 0.78, 0.85]} />
          <meshStandardMaterial color="#0369a1" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Warning Hazard Stripe on Tails */}
        <mesh position={[0, 0.15, 0.1]}>
          <boxGeometry args={[0.7, 0.08, 0.5]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.4} />
        </mesh>
      </group>

      {/* 8. DUAL HEAVY ION PROPULSION ENGINES & EXHAUST FLARES */}
      <group position={[0, 0.44, -1.35]}>
        {/* Left Ion Engine Nacelle */}
        <group position={[-0.52, 0, 0]}>
          {/* Outer Housing Cylinder */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.32, 0.68, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Copper Magnetic Compression Ring */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.035, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} />
          </mesh>
          {/* Exhaust Titanium Bell Nozzle */}
          <mesh position={[0, 0, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.29, 0.24, 0.18, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
          {/* Multi-layer Plasma Jet Flare */}
          <mesh ref={leftEngineRef} position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.28, 1.2, 10]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
          </mesh>
          <mesh ref={leftInnerFlameRef} position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.7, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
        </group>

        {/* Right Ion Engine Nacelle */}
        <group position={[0.52, 0, 0]}>
          {/* Outer Housing Cylinder */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.32, 0.68, 12]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Copper Magnetic Compression Ring */}
          <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.28, 0.035, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} />
          </mesh>
          {/* Exhaust Titanium Bell Nozzle */}
          <mesh position={[0, 0, -0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.29, 0.24, 0.18, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
          {/* Multi-layer Plasma Jet Flare */}
          <mesh ref={rightEngineRef} position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.28, 1.2, 10]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
          </mesh>
          <mesh ref={rightInnerFlameRef} position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.7, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
          </mesh>
        </group>

        {/* Central Overdrive Turbo Booster */}
        <group position={[0, 0.1, -0.1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.29, 0.6, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh ref={centralEngineRef} position={[0, 0, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.32, 1.5, 10]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.92} />
          </mesh>
        </group>
      </group>

      {/* 9. HOVER REPULSOR PADS & UNDERGLOW (Anti-Gravity Emitters) */}
      <group position={[0, 0.08, 0]}>
        {/* Front Pad */}
        <mesh position={[0, 0, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Rear Left Pad */}
        <mesh position={[-0.55, 0, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        {/* Rear Right Pad */}
        <mesh position={[0.55, 0, -0.7]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.16, 0.24, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Underglow Flight Lighting */}
      <pointLight position={[0, -0.2, 0]} color="#38bdf8" intensity={2.8} distance={9} />
      <pointLight position={[0, 0.4, -2.1]} color="#60a5fa" intensity={3.5} distance={8} />
    </group>
  );
};
