import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { useRapier } from './physics/RapierPhysicsContext';
import { sounds } from '../../audio/soundManager';

const NUM_PUFFS = 15;
const COLOR_YELLOW = new THREE.Color('#fbbf24');
const COLOR_ORANGE = new THREE.Color('#f97316');
const COLOR_WHITE = new THREE.Color('#f1f5f9');
const COLOR_GRAY = new THREE.Color('#94a3b8');

interface ExhaustPuff {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotX: number;
  rotY: number;
  rotZ: number;
  vRotX: number;
  vRotY: number;
  vRotZ: number;
  life: number;
  maxLife: number;
  initialScale: number;
}

const spawnPuff = (
  puff: ExhaustPuff,
  rocketGroup: THREE.Group,
  shipLinVel: THREE.Vector3,
  turn: number,
  turnSpeed: number,
  isBoosting: boolean,
  thrust: number
) => {
  puff.active = true;
  puff.life = 0;
  puff.maxLife = (isBoosting ? 0.38 : 0.54) + Math.random() * 0.12;

  // Local nozzle exit position (with slight radial jitter)
  const localNozzle = new THREE.Vector3(
    (Math.random() - 0.5) * 0.08,
    (Math.random() - 0.5) * 0.08,
    -1.95
  );

  // Transform nozzle offset to world space
  const worldNozzleOffset = localNozzle.clone().applyQuaternion(rocketGroup.quaternion);
  puff.pos.copy(rocketGroup.position).add(worldNozzleOffset);

  // Slightly different ejection direction from center for dispersion
  const driftAngle = Math.random() * Math.PI * 2;
  const driftSpeed = (isBoosting ? 0.42 : 0.28) + Math.random() * 0.4;
  const localVx = Math.cos(driftAngle) * driftSpeed;
  const localVy = Math.sin(driftAngle) * driftSpeed;

  // Backward ejection velocity along rocket's local -Z
  const exhaustSpeed = isBoosting ? 13.5 : 7.0 + Math.abs(thrust) * 3.5;
  const localVz = -exhaustSpeed * (0.85 + Math.random() * 0.3);

  const localVel = new THREE.Vector3(localVx, localVy, localVz);
  const worldVel = localVel.applyQuaternion(rocketGroup.quaternion);

  // 1. Inherit partial linear velocity from the ship (smooth curve momentum)
  worldVel.addScaledVector(shipLinVel, 0.35);

  // 2. Realistic tangential velocity from yaw rotation (v = omega x r)
  // When turning with A/D, the nozzle swings sideways and flings the exhaust into an authentic curved arc
  const yawRate = turn * turnSpeed;
  const omega = new THREE.Vector3(0, yawRate, 0);
  const vTangential = new THREE.Vector3().crossVectors(omega, worldNozzleOffset);
  worldVel.addScaledVector(vTangential, 0.85);

  puff.vel.copy(worldVel);

  // Random tumbling
  puff.rotX = Math.random() * Math.PI * 2;
  puff.rotY = Math.random() * Math.PI * 2;
  puff.rotZ = Math.random() * Math.PI * 2;
  puff.vRotX = (Math.random() - 0.5) * 5;
  puff.vRotY = (Math.random() - 0.5) * 5;
  puff.vRotZ = (Math.random() - 0.5) * 5;

  puff.initialScale = (isBoosting ? 0.48 : 0.38) + Math.random() * 0.08;
};

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
  const { rapier, world, isReady } = useRapier();

  const groupRef = useRef<THREE.Group>(null);
  
  // Dynamic 15-puff polygonal exhaust pool (starts idle with 0 emission)
  const puffsRef = useRef<ExhaustPuff[]>(
    Array.from({ length: NUM_PUFFS }, () => ({
      active: false,
      pos: new THREE.Vector3(0, 0, 0),
      vel: new THREE.Vector3(0, 0, 0),
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      vRotX: 1,
      vRotY: 1,
      vRotZ: 1,
      life: 1,
      maxLife: 0.5,
      initialScale: 0.40,
    }))
  );

  const puffMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const puffMatsRef = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const spawnTimerRef = useRef(0);

  const flameLightRef = useRef<THREE.PointLight>(null);
  const headlightRef = useRef<THREE.PointLight>(null);

  // RigidBody & Collider
  const rigidBodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  // Flight dynamics state
  const pos = useRef(new THREE.Vector3(...position));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationY = useRef(0);
  const rollZ = useRef(0);
  const pitchX = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});

  // Setup Keyboard inputs
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

  // Initialize Rapier dynamic RigidBody and Collider
  useEffect(() => {
    if (!isReady || !world || !rapier) return;

    // Calibrated cuboid collider encompassing the rocket body and fins
    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(position[0], position[1], position[2])
      .setLinearDamping(1.9)
      .setAngularDamping(3.2)
      .setCanSleep(false);

    // Free yaw rotation around Y, locked X and Z to prevent tumbling upside down
    bodyDesc.enabledRotations(false, true, false);

    const body = world.createRigidBody(bodyDesc);
    rigidBodyRef.current = body;

    const colliderDesc = rapier.ColliderDesc.cuboid(0.9, 0.9, 1.8)
      .setFriction(0.4)
      .setRestitution(0.25)
      .setMass(14.0);

    const collider = world.createCollider(colliderDesc, body);
    colliderRef.current = collider;

    return () => {
      if (world && body) {
        world.removeRigidBody(body);
        rigidBodyRef.current = null;
        colliderRef.current = null;
      }
    };
  }, [isReady]);

  // Frame animation & physics loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;

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

    if (isManualInput && targetPosition) {
      onClearTargetPosition?.();
    }

    const baseSpeed = isBoosting ? 46 : 27;
    const turnSpeed = 3.6;

    let thrust = 0;
    let turn = 0;

    if (forwardKey) thrust += 1;
    if (backwardKey) thrust -= 0.75;
    if (leftKey) turn += 1;
    if (rightKey) turn -= 1;

    if (Math.abs(virtualInput.x) > 0.1) turn = -virtualInput.x * 1.6;
    if (Math.abs(virtualInput.y) > 0.1) thrust = -virtualInput.y * 1.4;

    const body = rigidBodyRef.current;

    if (body && isReady) {
      const currentTranslation = body.translation();
      const currentRot = body.rotation();

      const q = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
      const euler = new THREE.Euler().setFromQuaternion(q, 'YXZ');
      let yaw = euler.y;

      // Auto-navigation towards target island
      if (targetPosition && !isManualInput) {
        const diffX = targetPosition[0] - currentTranslation.x;
        const diffZ = targetPosition[2] - currentTranslation.z;
        const dist = Math.hypot(diffX, diffZ);

        if (dist > 2.5) {
          const desiredAngle = Math.atan2(diffX, diffZ);
          let angleDiff = desiredAngle - yaw;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          yaw += angleDiff * Math.min(delta * 4.5, 1);
          thrust = Math.min(dist * 0.8, 1.3);

          // Smooth elevation matching
          const newY = THREE.MathUtils.lerp(currentTranslation.y, targetPosition[1] + 0.4, delta * 3.0);
          body.setTranslation({ x: currentTranslation.x, y: newY, z: currentTranslation.z }, true);
        } else {
          onClearTargetPosition?.();
          thrust = 0;
        }
      }

      // Update yaw steering
      yaw += turn * turnSpeed * delta;

      // Directional vector
      const forwardX = Math.sin(yaw);
      const forwardZ = Math.cos(yaw);

      // Apply forward / reverse impulse
      if (thrust !== 0) {
        const forceMagnitude = thrust * baseSpeed * 35;
        body.applyImpulse(
          {
            x: forwardX * forceMagnitude * delta,
            y: 0,
            z: forwardZ * forceMagnitude * delta,
          },
          true
        );
      }

      // Gentle zero-G celestial elevation stabilization
      const targetElevation = targetPosition ? targetPosition[1] : 0.5;
      const elevDiff = targetElevation - currentTranslation.y;
      body.applyImpulse({ x: 0, y: elevDiff * 8.5 * delta, z: 0 }, true);

      // Update orientation
      const targetQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, yaw, 0, 'YXZ')
      );
      body.setRotation(
        {
          x: targetQuat.x,
          y: targetQuat.y,
          z: targetQuat.z,
          w: targetQuat.w,
        },
        true
      );

      // Aerodynamic banking roll and pitch
      const targetRoll = -turn * 0.45;
      rollZ.current = THREE.MathUtils.lerp(rollZ.current, targetRoll, delta * 9);
      const targetPitch = thrust * 0.16;
      pitchX.current = THREE.MathUtils.lerp(pitchX.current, targetPitch, delta * 7);

      const finalPos = body.translation();
      const hoverY = Math.sin(Date.now() * 0.0035) * 0.18;

      groupRef.current.position.set(finalPos.x, finalPos.y + hoverY, finalPos.z);
      groupRef.current.rotation.set(pitchX.current, yaw, rollZ.current);
      groupRef.current.updateMatrixWorld();

      pos.current.set(finalPos.x, finalPos.y, finalPos.z);
      rotationY.current = yaw;

      onPositionChange([finalPos.x, finalPos.y, finalPos.z]);
      onRotationChange?.(yaw);
    } else {
      // Kinematic fallback
      rotationY.current += turn * turnSpeed * delta;
      rollZ.current = THREE.MathUtils.lerp(rollZ.current, -turn * 0.45, delta * 9);
      pitchX.current = THREE.MathUtils.lerp(pitchX.current, thrust * 0.16, delta * 7);

      const forward = new THREE.Vector3(
        Math.sin(rotationY.current),
        0,
        Math.cos(rotationY.current)
      );

      if (thrust !== 0) {
        velocity.current.addScaledVector(forward, thrust * baseSpeed * delta);
      } else {
        velocity.current.multiplyScalar(Math.pow(0.5, delta * 30));
      }
      velocity.current.multiplyScalar(Math.pow(0.9, delta * 30));
      pos.current.addScaledVector(velocity.current, delta);

      const hoverY = Math.sin(Date.now() * 0.0035) * 0.18;
      groupRef.current.position.set(pos.current.x, pos.current.y + hoverY, pos.current.z);
      groupRef.current.rotation.set(pitchX.current, rotationY.current, rollZ.current);
      groupRef.current.updateMatrixWorld();

      onPositionChange([pos.current.x, pos.current.y, pos.current.z]);
      onRotationChange?.(rotationY.current);
    }

    // Determine if rocket is actively moving or thrusting
    const bodySpeed = body && isReady ? Math.hypot(body.linvel().x, body.linvel().z) : velocity.current.length();
    const isMoving = isBoosting || Math.abs(thrust) > 0.05 || bodySpeed > 0.35;

    const shipLinVel =
      body && isReady
        ? new THREE.Vector3(body.linvel().x, body.linvel().y, body.linvel().z)
        : velocity.current.clone();

    // Dynamic 15-puff polygonal exhaust jet animation in world space:
    // When the ship is stopped, NOTHING comes out.
    // When accelerating or moving, separate polygons shoot out in world space,
    // curving naturally with turn physics when steering with A/D, shrinking gradually, and disappearing (max 15 active).
    if (isMoving) {
      const spawnInterval = isBoosting ? 0.024 : 0.038;
      spawnTimerRef.current += delta;

      while (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current -= spawnInterval;

        // Find an inactive or finished puff in the 15-puff pool
        const availablePuff = puffsRef.current.find((p) => !p.active || p.life >= 1);
        if (availablePuff) {
          spawnPuff(
            availablePuff,
            groupRef.current,
            shipLinVel,
            turn,
            turnSpeed,
            isBoosting,
            thrust
          );
        } else {
          break; // All 15 currently active
        }
      }
    } else {
      spawnTimerRef.current = 0;
    }

    // Update the 15 puffs in world space
    for (let i = 0; i < NUM_PUFFS; i++) {
      const puff = puffsRef.current[i];
      const mesh = puffMeshesRef.current[i];
      const mat = puffMatsRef.current[i];

      if (!puff.active) {
        if (mesh) mesh.scale.set(0, 0, 0);
        continue;
      }

      puff.life += delta / puff.maxLife;

      // When life ends, deactivate it (won't respawn if stopped!)
      if (puff.life >= 1) {
        puff.active = false;
        if (mesh) mesh.scale.set(0, 0, 0);
        continue;
      }

      // Physics integration: drag decelerates puff smoothly in space
      puff.vel.multiplyScalar(Math.pow(0.86, delta * 25));
      puff.pos.addScaledVector(puff.vel, delta);

      // Tumbling rotation
      puff.rotX += puff.vRotX * delta;
      puff.rotY += puff.vRotY * delta;
      puff.rotZ += puff.vRotZ * delta;

      if (mesh && mat) {
        mesh.position.copy(puff.pos);
        mesh.rotation.set(puff.rotX, puff.rotY, puff.rotZ);

        // Gradually become smaller and disappear
        const progress = Math.min(Math.max(puff.life, 0), 1);
        const currentScale = Math.max(0.001, puff.initialScale * (1 - progress));
        mesh.scale.set(currentScale, currentScale, currentScale);

        // Fade out
        mat.opacity = Math.max(0, 1 - progress * 0.88);

        // Color transition: yellow -> orange -> white -> gray
        if (progress < 0.22) {
          mat.color.lerpColors(COLOR_YELLOW, COLOR_ORANGE, progress / 0.22);
        } else if (progress < 0.55) {
          mat.color.lerpColors(COLOR_ORANGE, COLOR_WHITE, (progress - 0.22) / 0.33);
        } else {
          mat.color.lerpColors(COLOR_WHITE, COLOR_GRAY, (progress - 0.55) / 0.45);
        }
      }
    }

    // Dynamic Fire Lighting Intensity (fades to 0 when stopped!)
    if (flameLightRef.current) {
      const targetIntensity = isMoving ? (isBoosting ? 5.5 : 2.8) : 0;
      flameLightRef.current.intensity = THREE.MathUtils.lerp(
        flameLightRef.current.intensity,
        targetIntensity,
        delta * 10
      );
    }
  });

  // Custom Fin Geometry matching the reference image:
  // Starts on fuselage near mid-body, sweeps OUTWARD and BACKWARD, with rearmost swept tip past the nozzle
  const finShape = useMemo(() => {
    const shape = new THREE.Shape();
    // Coordinates: (radial distance X from center axis, axial position Y along rocket Z)
    shape.moveTo(0.80, 0.25);   // Front root on mid fuselage
    shape.lineTo(1.42, -1.55);  // Swept outer leading edge flaring out and back
    shape.lineTo(1.35, -1.80);  // Sharp swept fin tip extending past the nozzle
    shape.lineTo(0.95, -1.65);  // Cutout notch on trailing edge
    shape.lineTo(0.44, -1.45);  // Lower root attaching to nozzle collar
    shape.lineTo(0.68, -0.60);  // Tapering along lower fuselage
    shape.closePath();
    return shape;
  }, []);

  const finExtrudeSettings = useMemo(
    () => ({
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1, // 1 segment bevel produces a crisp low-poly chamfer!
    }),
    []
  );

  // 4 Symmetrical Fin Angles: Top (0.5 PI), Right (0), Bottom (-0.5 PI), Left (PI)
  const finAngles = useMemo(() => [Math.PI / 2, 0, -Math.PI / 2, Math.PI], []);

  return (
    <>
      <group ref={groupRef} position={position} dispose={null}>
      {/* =========================================================================
          RETRO TOY LOW-POLY ROCKET
          100% Faithful to the Reference Image:
          - Red faceted conical nose cone (pointed forward at +Z)
          - White faceted spindle/bullet fuselage with crisp polygonal faces
          - Circular porthole window with silver bezel and faceted sky-blue glass
          - 4 Swept-back red aerodynamic fins with beveled edges
          - Dynamic 15-puff dispersed polygonal exhaust jet (silent when stopped)
         ========================================================================= */}

      {/* -----------------------------------------------------------------
          1. RED FACETED NOSE CONE (Apex pointing forward at +Z)
         ----------------------------------------------------------------- */}
      <mesh position={[0, 0, 1.925]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.62, 1.35, 10]} />
        <meshStandardMaterial
          color="#dc2626"
          roughness={0.84}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* -----------------------------------------------------------------
          2. WHITE FACETED MAIN FUSELAGE (Spindle / Bullet Body)
             rotation={[Math.PI / 2, 0, 0]} maps Top (+Y) to Front (+Z)
         ----------------------------------------------------------------- */}
      <group>
        {/* Upper Fuselage: radiusTop (front) = 0.62, radiusBottom (rear) = 0.84 */}
        <mesh position={[0, 0, 0.825]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.62, 0.84, 0.85, 10]} />
          <meshStandardMaterial
            color="#f3f4f6"
            roughness={0.85}
            metalness={0.05}
            flatShading
          />
        </mesh>

        {/* Mid Fuselage: widest central cylindrical core (r = 0.84) */}
        <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.84, 0.84, 0.75, 10]} />
          <meshStandardMaterial
            color="#f3f4f6"
            roughness={0.85}
            metalness={0.05}
            flatShading
          />
        </mesh>

        {/* Lower Fuselage: radiusTop (front) = 0.84, radiusBottom (rear) = 0.48 */}
        <mesh position={[0, 0, -0.90]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.84, 0.48, 1.10, 10]} />
          <meshStandardMaterial
            color="#f3f4f6"
            roughness={0.85}
            metalness={0.05}
            flatShading
          />
        </mesh>
      </group>

      {/* -----------------------------------------------------------------
          3. CIRCULAR PORTHOLE WINDOW (Silver Bezel + Faceted Cyan Glass)
             Positioned on the upper fuselage (facing upwards +Y)
         ----------------------------------------------------------------- */}
      <group position={[0, 0.82, 0.42]} rotation={[0.15, 0, 0]}>
        {/* Outer Bezel Frame Ring (Silver / Gray) */}
        <mesh castShadow>
          <cylinderGeometry args={[0.38, 0.42, 0.12, 10]} />
          <meshStandardMaterial
            color="#cbd5e1"
            roughness={0.82}
            metalness={0.08}
            flatShading
          />
        </mesh>

        {/* Inner Window Recess */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.31, 0.31, 0.08, 10]} />
          <meshStandardMaterial
            color="#94a3b8"
            roughness={0.85}
            metalness={0.08}
            flatShading
          />
        </mesh>

        {/* Faceted Sky-Blue Porthole Glass Dome */}
        <mesh position={[0, 0.07, 0]} castShadow>
          <sphereGeometry args={[0.29, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial
            color="#67e8f9"
            roughness={0.25}
            metalness={0.12}
            flatShading
          />
        </mesh>

        {/* Soft Interior Porthole Glow */}
        <pointLight position={[0, 0.15, 0]} color="#a5f3fc" intensity={1.8} distance={5} />
      </group>

      {/* -----------------------------------------------------------------
          4. 4 SWEPT-BACK RED AERODYNAMIC FINS (ALETAS)
             Positioned at 90° intervals around the rocket body.
             Top fin sits directly on the centerline below the porthole window!
         ----------------------------------------------------------------- */}
      {finAngles.map((angle, idx) => (
        <group key={`fin-${idx}`} rotation={[0, 0, angle]}>
          <mesh
            position={[0, 0, -0.04]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <extrudeGeometry args={[finShape, finExtrudeSettings]} />
            <meshStandardMaterial
              color="#dc2626"
              roughness={0.84}
              metalness={0.05}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* -----------------------------------------------------------------
          5. ENGINE NOZZLE (Gunmetal Metallic Collar & Bell)
         ----------------------------------------------------------------- */}
      <group>
        {/* Nozzle Base Collar: radiusTop (front) = 0.48, radiusBottom (rear) = 0.38 */}
        <mesh position={[0, 0, -1.575]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.48, 0.38, 0.25, 10]} />
          <meshStandardMaterial
            color="#475569"
            roughness={0.85}
            metalness={0.15}
            flatShading
          />
        </mesh>

        {/* Flared Exhaust Bell: radiusTop (front) = 0.38, radiusBottom (rear) = 0.44 */}
        <mesh position={[0, 0, -1.81]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.44, 0.22, 10]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.85}
            metalness={0.15}
            flatShading
          />
        </mesh>

        {/* Glowing Inner Thrust Chamber */}
        <mesh position={[0, 0, -1.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.05, 10]} />
          <meshStandardMaterial
            color="#f97316"
            roughness={0.6}
            metalness={0.05}
            flatShading
          />
        </mesh>
      </group>

      {/* -----------------------------------------------------------------
          6. DYNAMIC FLIGHT ILLUMINATION
         ----------------------------------------------------------------- */}
      {/* Warm Engine Exhaust Glow illuminating the space behind */}
      <pointLight
        ref={flameLightRef}
        position={[0, 0, -2.4]}
        color="#f97316"
        intensity={0}
        distance={12}
      />
      {/* Forward Nose Light */}
      <pointLight
        ref={headlightRef}
        position={[0, 0, 2.7]}
        color="#bae6fd"
        intensity={2.5}
        distance={14}
      />
    </group>

    {/* -----------------------------------------------------------------
        7. DYNAMIC 15-PUFF POLYGONAL EXHAUST JET (WORLD SPACE)
           Independent low-poly figures simulated in world space coordinates.
           Curving with authentic turn physics when steering with A/D,
           gradually shrinking and disappearing (max 15 active).
           Completely cuts off when the ship is stopped!
       ----------------------------------------------------------------- */}
    <group>
      {Array.from({ length: NUM_PUFFS }).map((_, idx) => (
        <mesh
          key={`exhaust-puff-${idx}`}
          ref={(el) => {
            puffMeshesRef.current[idx] = el;
          }}
          scale={[0, 0, 0]}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            ref={(el) => {
              puffMatsRef.current[idx] = el;
            }}
            color="#fbbf24"
            roughness={0.8}
            metalness={0.05}
            flatShading
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  </>
);
};
