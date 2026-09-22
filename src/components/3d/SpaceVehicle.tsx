import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { useRapier } from './physics/RapierPhysicsContext';
import { sounds } from '../../audio/soundManager';
import { explosionEvents } from './explosions/explosionEvents';
import { sparkEvents } from './explosions/sparkEvents';
import { COSMIC_BOUNDARY, CosmicBoundaryController } from '../../utils/cosmicBoundary';
import { clearBoundaryTelemetry, publishBoundaryTelemetry } from '../../utils/boundaryTelemetry';
import { RACE_GRID, RaceState } from '../../utils/raceTrack';
import { raceSession, consumeNitro } from '../../utils/raceSession';
import { raceTurnRate, smoothRaceSteering, raceSpeedScale, stepRaceDrive, RACE_CRUISE_SPEED, RACE_BOOST_SPEED } from '../../utils/raceHandling';
import { RaceWallGuide } from '../../utils/raceWallGuide';

import { GraphicsQuality, GameMode, IslandId } from '../../types';
import { getIslandLivePosition } from '../../utils/celestialCoords';
import { ISLANDS_CONFIG } from '../../data/portfolioData';
import { canHandleGameKey, createVehicleInput, isEditableTarget, type VehicleInput } from '../../utils/gameInput';

const MAX_PUFFS_CAP = 24;
const COLOR_YELLOW = new THREE.Color('#fbbf24');
const COLOR_ORANGE = new THREE.Color('#f97316');
const COLOR_WHITE = new THREE.Color('#f1f5f9');
const COLOR_GRAY = new THREE.Color('#94a3b8');
const COLOR_NITRO = new THREE.Color('#38bdf8');
const COLOR_VIOLET = new THREE.Color('#a78bfa');
const NO_INPUT = createVehicleInput();
const DRIVING_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'shift', 'r']);

// Pre-allocated static scratch objects to eliminate per-frame garbage collection
const _localNozzle = new THREE.Vector3();
const _worldNozzleOffset = new THREE.Vector3();
const _localVel = new THREE.Vector3();
const _worldVel = new THREE.Vector3();
const _omega = new THREE.Vector3();
const _vTangential = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const _targetQuat = new THREE.Quaternion();
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _safeQuat = new THREE.Quaternion();
const _shipLinVel = new THREE.Vector3();

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
  _localNozzle.set(
    (Math.random() - 0.5) * 0.08,
    (Math.random() - 0.5) * 0.08,
    -1.95
  );

  // Transform nozzle offset to world space
  _worldNozzleOffset.copy(_localNozzle).applyQuaternion(rocketGroup.quaternion);
  puff.pos.copy(rocketGroup.position).add(_worldNozzleOffset);

  // Slightly different ejection direction from center for dispersion
  const driftAngle = Math.random() * Math.PI * 2;
  const driftSpeed = (isBoosting ? 0.42 : 0.28) + Math.random() * 0.4;
  const localVx = Math.cos(driftAngle) * driftSpeed;
  const localVy = Math.sin(driftAngle) * driftSpeed;

  // Backward ejection velocity along rocket's local -Z
  const exhaustSpeed = isBoosting ? 13.5 : 7.0 + Math.abs(thrust) * 3.5;
  const localVz = -exhaustSpeed * (0.85 + Math.random() * 0.3);

  _localVel.set(localVx, localVy, localVz);
  _worldVel.copy(_localVel).applyQuaternion(rocketGroup.quaternion);

  // 1. Inherit partial linear velocity from the ship (smooth curve momentum)
  _worldVel.addScaledVector(shipLinVel, 0.35);

  // 2. Realistic tangential velocity from yaw rotation (v = omega x r)
  const yawRate = turn * turnSpeed;
  _omega.set(0, yawRate, 0);
  _vTangential.crossVectors(_omega, _worldNozzleOffset);
  _worldVel.addScaledVector(_vTangential, 0.85);

  puff.vel.copy(_worldVel);

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
  raceState?: RaceState;
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  onPositionChange: (pos: [number, number, number]) => void;
  onRotationChange?: (rotY: number) => void;
  isDriving: boolean;
  virtualInput?: VehicleInput;
  virtualInputRef?: React.MutableRefObject<VehicleInput>;
  onClearTargetPosition?: () => void;
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  sharedVehicleRotation?: React.MutableRefObject<number>;
  gameMode?: GameMode;
  selectedIslandId?: IslandId | null;
  onCinematicComplete?: (finishedMode: GameMode) => void;
  visible?: boolean;
  onBoundaryReturn?: () => void;
}

const SpaceVehicleComponent: React.FC<SpaceVehicleProps> = ({
  raceState = 'idle',
  position,
  targetPosition,
  onPositionChange,
  onRotationChange,
  isDriving,
  virtualInput,
  virtualInputRef,
  onClearTargetPosition,
  graphicsQuality = 'mid',
  sharedVehiclePos,
  sharedVehicleRotation,
  gameMode = 'driving',
  selectedIslandId,
  onCinematicComplete,
  visible = true,
  onBoundaryReturn,
}) => {
  const { rapier, world, isReady } = useRapier();
  const controlsEnabled = isDriving && gameMode === 'driving' && visible && raceState !== 'countdown';
  const previousRaceState = useRef<RaceState>('idle');
  const raceWallGuide = useRef(new RaceWallGuide());
  const raceVelocity = useMemo(() => new THREE.Vector3(), []);
  const sparkCooldown = useRef(0);
  const superBoostTime = useRef(0);
  const raceSpeedCap = useRef(RACE_CRUISE_SPEED);
  const wasNitro = useRef(false);
  const raceSteering = useRef(0);
  const eventState = useRef({ isReady, controlsEnabled, virtualInputRef, onPositionChange, onRotationChange });
  eventState.current = { isReady, controlsEnabled, virtualInputRef, onPositionChange, onRotationChange };
  const inputSuspended = useRef(false);
  const boundary = useRef(new CosmicBoundaryController());
  useEffect(() => {
    if (gameMode !== 'driving') {
      boundary.current.reset();
      clearBoundaryTelemetry();
    }
    return clearBoundaryTelemetry;
  }, [gameMode]);

  const groupRef = useRef<THREE.Group>(null);
  const lastAppUpdate = useRef(0);
  const maxPuffs = graphicsQuality === 'low' ? 6 : graphicsQuality === 'high' ? 22 : 15;

  // Cinematic state tracking
  const cinematicTimer = useRef(0);
  const cinematicStartPos = useRef(
    new THREE.Vector3(
      gameMode === 'entering' ? 0 : position[0],
      gameMode === 'entering' ? 24 : position[1],
      gameMode === 'entering' ? -40 : position[2]
    )
  );
  const cinematicStartYaw = useRef(0);
  const prevGameModeRef = useRef<GameMode>(gameMode);
  
  // Dynamic polygonal exhaust pool (starts idle with 0 emission)
  const puffs = useMemo<ExhaustPuff[]>(() =>
    Array.from({ length: MAX_PUFFS_CAP }, () => ({
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
    })), []
  );
  const puffsRef = useRef(puffs);

  const puffMeshesRef = useRef<(THREE.Mesh | null)[]>([]);
  const puffMatsRef = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const spawnTimerRef = useRef(0);

  // RigidBody & Collider
  const rigidBodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);

  // Flight dynamics state
  const pos = useRef(
    new THREE.Vector3(
      gameMode === 'entering' ? 0 : position[0],
      gameMode === 'entering' ? 24 : position[1],
      gameMode === 'entering' ? -40 : position[2]
    )
  );
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotationY = useRef(0);
  const rollZ = useRef(0);
  const rollVelocity = useRef(0);
  const pitchX = useRef(0);
  const pitchVelocity = useRef(0);
  const suspensionY = useRef(0);
  const suspensionVelocity = useRef(0);
  const respawnTimer = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (controlsEnabled) return;
    keys.current = {};
    if (virtualInputRef) Object.assign(virtualInputRef.current, NO_INPUT);
    sounds.stopThrusterSound();
  }, [controlsEnabled, virtualInputRef]);

  // Setup Keyboard inputs
  useEffect(() => {
    const triggerRespawn = () => {
      if (raceSession.active) return;
      const safePos = { x: 0, y: 1.0, z: 34 };
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setTranslation(safePos, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        const safeQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        rigidBodyRef.current.setRotation(safeQuat, true);
      }
      pos.current.set(safePos.x, safePos.y, safePos.z);
      velocity.current.set(0, 0, 0);
      rotationY.current = 0;
      if (groupRef.current) {
        groupRef.current.position.set(safePos.x, safePos.y, safePos.z);
        groupRef.current.rotation.set(0, 0, 0);
      }
      respawnTimer.current = 1.5;
      eventState.current.onPositionChange([safePos.x, safePos.y, safePos.z]);
      eventState.current.onRotationChange?.(0);
      if (sharedVehicleRotation) sharedVehicleRotation.current = 0;
      puffsRef.current.forEach((p) => {
        p.active = false;
        p.life = 1;
      });
      puffMeshesRef.current.forEach((m) => {
        if (m) m.scale.set(0, 0, 0);
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canHandleGameKey(e, eventState.current.controlsEnabled && !inputSuspended.current)) return;
      const key = e.key.toLowerCase();
      if (!DRIVING_KEYS.has(key)) return;
      const wasPressed = keys.current[key];
      keys.current[key] = true;
      if (key.startsWith('arrow') || key === ' ') {
        e.preventDefault();
      }
      if (e.repeat || wasPressed) return;
      if (key === ' ') {
        sounds.playBoost();
      }
      if (key === 'r') {
        triggerRespawn();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    const clearInput = () => {
      keys.current = {};
      if (eventState.current.virtualInputRef) Object.assign(eventState.current.virtualInputRef.current, NO_INPUT);
      sounds.stopThrusterSound();
    };
    const handleBlur = () => {
      inputSuspended.current = true;
      clearInput();
    };
    const handleFocus = () => {
      inputSuspended.current = document.hidden || isEditableTarget(document.activeElement);
      if (inputSuspended.current) clearInput();
    };
    const handleFocusChange = (e: FocusEvent) => {
      inputSuspended.current = document.hidden || isEditableTarget(e.type === 'focusout' ? e.relatedTarget : e.target);
      if (inputSuspended.current) clearInput();
    };

    const handleBoostImpulse = (e: Event) => {
      if (!eventState.current.controlsEnabled || inputSuspended.current) return;
      const custom = e as CustomEvent<{
        direction?: [number, number, number];
        force?: number;
        useRocketFacing?: boolean;
        perfect?: boolean;
      }>;
      const body = rigidBodyRef.current;
      const force = custom.detail?.force ?? 650;
      if (raceSession.running) {
        if (custom.detail?.perfect) raceSession.nitro = Math.min(100, raceSession.nitro + 30);
        superBoostTime.current = custom.detail?.perfect ? 1.1 : 0;
        raceSpeedCap.current = RACE_BOOST_SPEED;
        // Race portals reward precision without snapping the ship's velocity or heading.
        sounds.playBoost();
        return;
      }

      // Calculate current rocket heading (where the rocket is facing)
      let fX = 0;
      let fZ = 1;

      if (body && eventState.current.isReady) {
        const currentRot = body.rotation();
        _tempQuat.set(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
        _tempEuler.setFromQuaternion(_tempQuat, 'YXZ');
        const yaw = _tempEuler.y;
        fX = Math.sin(yaw);
        fZ = Math.cos(yaw);
      } else {
        const yaw = rotationY.current;
        fX = Math.sin(yaw);
        fZ = Math.cos(yaw);
      }

      // Default to the rocket's facing direction unless explicitly overridden
      const shouldUseFacing = custom.detail?.useRocketFacing ?? (!custom.detail?.direction);
      let dirX = fX;
      let dirY = 0;
      let dirZ = fZ;

      if (!shouldUseFacing && custom.detail?.direction) {
        [dirX, dirY, dirZ] = custom.detail.direction;
      }

      if (body && eventState.current.isReady) {
        // Direct the boost cleanly in the direction the rocket is facing!
        const linvel = body.linvel();
        const currentSpeed = Math.hypot(linvel.x, linvel.z);
        // Clean high-speed surge forward in the facing direction
        const boostSpeed = raceSession.running ? RACE_BOOST_SPEED : Math.max(currentSpeed * 0.45 + 38, 52);

        body.setLinvel(
          {
            x: dirX * boostSpeed,
            y: Math.min(Math.max(linvel.y * 0.2, -0.6), 1.2),
            z: dirZ * boostSpeed,
          },
          true
        );

        // Dynamic physical impulse
        if (!raceSession.running) {
          const impulse = custom.detail?.perfect ? force : 180;
          body.applyImpulse({ x: dirX * impulse, y: dirY * impulse, z: dirZ * impulse }, true);
        }
      } else {
        // Kinematic fallback
        const boostSpeed = raceSession.running ? RACE_BOOST_SPEED : 50;
        velocity.current.set(dirX * boostSpeed, 0, dirZ * boostSpeed);
      }

      sounds.playBoost();
      pitchVelocity.current += 0.42;
      suspensionVelocity.current -= 0.32;
    };

    handleFocus();
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('focusin', handleFocusChange);
    document.addEventListener('focusout', handleFocusChange);
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('app:respawn-vehicle', triggerRespawn);
    window.addEventListener('app:boost-vehicle', handleBoostImpulse);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('focusin', handleFocusChange);
      document.removeEventListener('focusout', handleFocusChange);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('app:respawn-vehicle', triggerRespawn);
      window.removeEventListener('app:boost-vehicle', handleBoostImpulse);
      sounds.stopThrusterSound();
    };
  }, []);

  // Initialize Rapier dynamic RigidBody and Collider
  useEffect(() => {
    if (!isReady || !world || !rapier) return;

    // Calibrated cuboid collider encompassing the rocket body and fins
    const initialSpawnX = gameMode === 'entering' ? 0 : position[0];
    const initialSpawnY = gameMode === 'entering' ? 24 : position[1];
    const initialSpawnZ = gameMode === 'entering' ? -40 : position[2];

    const bodyDesc = rapier.RigidBodyDesc.dynamic()
      .setTranslation(initialSpawnX, initialSpawnY, initialSpawnZ)
      .setLinearDamping(1.55)
      .setAngularDamping(3.4)
      .setCcdEnabled(true)
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
  }, [isReady, world, rapier]);

  // Keep the ship in the circuit's plane so collisions cannot lift it over walls.
  useEffect(() => {
    const active = raceState === 'countdown' || raceState === 'racing';
    rigidBodyRef.current?.setEnabledTranslations(true, !active, true, true);
  }, [raceState, isReady]);

  // Frame animation & physics loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // Tab restores and stalled frames must not inject seconds of impulse.
    delta = Math.min(delta, 0.05);
    sparkCooldown.current = Math.max(0, sparkCooldown.current - delta);

    if (gameMode === 'landing' || visible === false) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // Detect cinematic mode transition trigger
    if (gameMode !== prevGameModeRef.current) {
      cinematicTimer.current = 0;
      cinematicStartPos.current.copy(pos.current);
      cinematicStartYaw.current = rotationY.current;

      if (gameMode === 'entering') {
        cinematicStartPos.current.set(0, 24, -40);
        cinematicStartYaw.current = 0;
        pos.current.set(0, 24, -40);
        rotationY.current = 0;
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setTranslation({ x: 0, y: 24, z: -40 }, true);
          rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
        sounds.playWarpEntry();
      } else if (gameMode === 'takeoff') {
        sounds.playLiftoff();
      } else if (gameMode === 'exiting') {
        sounds.playWarpExit();
      }
      prevGameModeRef.current = gameMode;
    }

    const isCinematic =
      gameMode === 'entering' ||
      gameMode === 'landing-island' ||
      gameMode === 'inspecting' ||
      gameMode === 'takeoff' ||
      gameMode === 'exiting';

    let thrust = 0;
    let turn = 0;
    let isBoosting = false;
    let turnSpeed = 3.6;
    const body = rigidBodyRef.current;

    if (raceState === 'countdown') {
      if (previousRaceState.current !== 'countdown') {
        keys.current = {};
        velocity.current.set(0, 0, 0);
        rollZ.current = pitchX.current = rollVelocity.current = pitchVelocity.current = 0;
        suspensionY.current = suspensionVelocity.current = 0;
        respawnTimer.current = superBoostTime.current = 0;
        raceSpeedCap.current = RACE_CRUISE_SPEED;
        raceWallGuide.current.reset();
        raceSteering.current = 0;
        boundary.current.reset();
        clearBoundaryTelemetry();
        puffsRef.current.forEach(p => { p.active = false; });
      }
      pos.current.set(...RACE_GRID.position);
      rotationY.current = RACE_GRID.yaw;
      _tempEuler.set(0, RACE_GRID.yaw, 0);
      _targetQuat.setFromEuler(_tempEuler);
      if (body) {
        body.setTranslation(pos.current, true);
        body.setRotation(_targetQuat, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      groupRef.current.position.copy(pos.current);
      groupRef.current.position.y += Math.sin(performance.now() * 0.06) * 0.025;
      groupRef.current.rotation.set(0, RACE_GRID.yaw, 0);
      sharedVehiclePos?.current.copy(pos.current);
      if (sharedVehicleRotation) sharedVehicleRotation.current = RACE_GRID.yaw;
      onPositionChange([...RACE_GRID.position]);
      onRotationChange?.(RACE_GRID.yaw);
      thrust = 0.08;
      sounds.updateThrusterSound(thrust, false);
    } else if (isCinematic) {
      cinematicTimer.current += delta;

      let cX = pos.current.x;
      let cY = pos.current.y;
      let cZ = pos.current.z;
      let cYaw = rotationY.current;
      let cPitch = 0;
      let cRoll = 0;

      if (gameMode === 'entering') {
        const progress = Math.min(cinematicTimer.current / 1.6, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        cX = THREE.MathUtils.lerp(cinematicStartPos.current.x, 0, ease);
        cY = THREE.MathUtils.lerp(cinematicStartPos.current.y, 1.0, ease) + Math.sin(progress * Math.PI) * 1.8;
        cZ = THREE.MathUtils.lerp(cinematicStartPos.current.z, 16, ease);
        cYaw = 0;
        cPitch = THREE.MathUtils.lerp(-0.22, 0, ease);
        cRoll = 0;

        thrust = progress < 0.85 ? 1.0 : 0.15;
        isBoosting = progress < 0.7;
        sounds.updateThrusterSound(thrust, isBoosting);

        if (progress >= 1 && cinematicTimer.current >= 1.6) {
          onCinematicComplete?.('entering');
        }
      } else if (gameMode === 'landing-island') {
        const progress = Math.min(cinematicTimer.current / 2.0, 1);
        const island = ISLANDS_CONFIG.find((i) => i.id === selectedIslandId) || ISLANDS_CONFIG[0];
        const [ix, iy, iz] = getIslandLivePosition(island);

        // Heliponto tártil proeminente posicionado em [0, 0.30, 3.5] relativo à ilha
        const landX = ix;
        const landZ = iz + 3.5;
        const landY = iy + 2.16; // Assenta o bico/aletas perfeitamente sobre a superfície do heliponto

        // Fase 1 (0-60%): Curva de aproximação aerodinâmica e inclinação para atitude vertical
        // Fase 2 (60-100%): Descida vertical precisa e desaceleração suave sobre o heliponto
        const phase1End = 0.6;

        if (progress < phase1End) {
          const p1 = progress / phase1End;
          const easeP1 = p1 < 0.5 ? 2 * p1 * p1 : 1 - Math.pow(-2 * p1 + 2, 2) / 2;

          // Aproximação XZ em direção ao heliponto
          cX = THREE.MathUtils.lerp(cinematicStartPos.current.x, landX, easeP1);
          cZ = THREE.MathUtils.lerp(cinematicStartPos.current.z, landZ, easeP1);

          // Elevação suave até o teto de descida vertical acima do heliponto
          const approachY = landY + 6.5;
          cY = THREE.MathUtils.lerp(cinematicStartPos.current.y, approachY, easeP1);

          // Inclina gradualmente o nariz para cima (pitch de horizontal até -PI/2 em pé)
          cPitch = THREE.MathUtils.lerp(0, -Math.PI / 2, easeP1);
          cYaw = THREE.MathUtils.lerp(cinematicStartYaw.current, 0, easeP1);
          cRoll = 0;

          thrust = 0.55;
        } else {
          const p2 = (progress - phase1End) / (1.0 - phase1End);
          const easeP2 = p2 * p2 * (3 - 2 * p2); // smoothstep

          // Mantém tracking do heliponto em tempo real com a órbita da ilha
          cX = landX;
          cZ = landZ;

          // Descida vertical suave até tocar o heliponto
          const hoverY = landY + 6.5;
          cY = THREE.MathUtils.lerp(hoverY, landY, easeP2);

          // Estritamente em pé
          cPitch = -Math.PI / 2;
          cYaw = 0;
          cRoll = 0;

          thrust = Math.max(0.02, 0.35 * (1 - p2));
        }

        sounds.updateThrusterSound(thrust, false);

        if (progress >= 1 && cinematicTimer.current >= 2.0) {
          sounds.playTouchdown();
          onCinematicComplete?.('landing-island');
        }
      } else if (gameMode === 'inspecting') {
        const island = ISLANDS_CONFIG.find((i) => i.id === selectedIslandId) || ISLANDS_CONFIG[0];
        const [ix, iy, iz] = getIslandLivePosition(island);
        cX = ix;
        cY = iy + 2.16;
        cZ = iz + 3.5;
        cYaw = 0;
        cPitch = -Math.PI / 2; // Em pé orgulhosamente no centro do heliponto [H]
        cRoll = 0;
        thrust = 0;
        sounds.updateThrusterSound(0, false);
      } else if (gameMode === 'takeoff') {
        const progress = Math.min(cinematicTimer.current / 1.4, 1);
        const island = ISLANDS_CONFIG.find((i) => i.id === selectedIslandId) || ISLANDS_CONFIG[0];
        const [ix, iy, iz] = getIslandLivePosition(island);

        const launchX = ix;
        const launchZ = iz + 3.5;
        const launchY = iy + 2.16;

        // Fase 1 (0-50%): Lançamento vertical direto do heliponto
        // Fase 2 (50-100%): Transição de atitude vertical para horizontal em direção ao cruzeiro
        const phase1End = 0.5;

        if (progress < phase1End) {
          const p1 = progress / phase1End;
          const easeP1 = 1 - Math.pow(1 - p1, 2);

          cX = launchX;
          cZ = launchZ;
          cY = THREE.MathUtils.lerp(launchY, launchY + 8.5, easeP1);
          cPitch = -Math.PI / 2; // Sobe em pé
          cYaw = 0;
          cRoll = 0;
        } else {
          const p2 = (progress - phase1End) / (1.0 - phase1End);
          const easeP2 = p2 * p2 * (3 - 2 * p2);

          cX = launchX;
          cZ = THREE.MathUtils.lerp(launchZ, launchZ + 8.0, easeP2);
          cY = THREE.MathUtils.lerp(launchY + 8.5, 1.0, easeP2);
          cPitch = THREE.MathUtils.lerp(-Math.PI / 2, 0, easeP2);
          cYaw = 0;
          cRoll = 0;
        }

        thrust = 0.85;
        isBoosting = true;
        sounds.updateThrusterSound(0.85, true);

        if (progress >= 1 && cinematicTimer.current >= 1.4) {
          onCinematicComplete?.('takeoff');
        }
      } else if (gameMode === 'exiting') {
        const progress = Math.min(cinematicTimer.current / 1.3, 1);
        const accel = progress * progress * 95;
        const fX = Math.sin(cinematicStartYaw.current);
        const fZ = Math.cos(cinematicStartYaw.current);

        cX = cinematicStartPos.current.x + fX * accel;
        cY = cinematicStartPos.current.y + progress * progress * 32;
        cZ = cinematicStartPos.current.z + fZ * accel;

        cYaw = cinematicStartYaw.current;
        cPitch = 0.35;
        cRoll = 0;

        thrust = 1.3;
        isBoosting = true;
        sounds.updateThrusterSound(1.3, true);

        if (progress >= 1 && cinematicTimer.current >= 1.3) {
          onCinematicComplete?.('exiting');
        }
      }

      if (body && isReady) {
        body.setTranslation({ x: cX, y: cY, z: cZ }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        _tempEuler.set(cPitch, cYaw, cRoll, 'YXZ');
        _targetQuat.setFromEuler(_tempEuler);
        body.setRotation(_targetQuat, true);
      }

      groupRef.current.position.set(cX, cY, cZ);
      groupRef.current.rotation.set(cPitch, cYaw, cRoll);

      pos.current.set(cX, cY, cZ);
      rotationY.current = cYaw;
      if (sharedVehicleRotation) sharedVehicleRotation.current = cYaw;
      pitchX.current = cPitch;
      rollZ.current = cRoll;

      if (sharedVehiclePos) {
        sharedVehiclePos.current.set(cX, cY, cZ);
      }

      const now = performance.now();
      if (now - lastAppUpdate.current > 120) {
        lastAppUpdate.current = now;
        onPositionChange([cX, cY, cZ]);
        onRotationChange?.(cYaw);
      }
    } else {
      // Normal Driving Manual Physics Loop
      const canDrive = controlsEnabled && !inputSuspended.current && boundary.current.frame.recovery === 0;
      const input = canDrive ? (virtualInputRef?.current ?? virtualInput ?? NO_INPUT) : NO_INPUT;
      const forwardKey = canDrive && Boolean(keys.current['arrowup'] || keys.current['w'] || input.y < -0.2);
      const backwardKey = canDrive && Boolean(keys.current['arrowdown'] || keys.current['s'] || input.y > 0.2);
      const leftKey = canDrive && Boolean(keys.current['arrowleft'] || keys.current['a'] || input.x < -0.2);
      const rightKey = canDrive && Boolean(keys.current['arrowright'] || keys.current['d'] || input.x > 0.2);
      const nitroRequested = canDrive && Boolean(keys.current['shift'] || keys.current[' '] || input.boost);
      const nitroActive = nitroRequested && (!raceSession.active || raceSession.nitro > 0);
      if (raceSession.running) raceSession.nitro = consumeNitro(raceSession.nitro, nitroActive, delta);
      superBoostTime.current = raceSession.running ? Math.max(0, superBoostTime.current - delta) : 0;
      isBoosting = nitroActive || (canDrive && superBoostTime.current > 0);
      raceSpeedCap.current = raceSession.running
        ? isBoosting ? RACE_BOOST_SPEED : Math.max(RACE_CRUISE_SPEED, raceSpeedCap.current - 18 * delta)
        : RACE_CRUISE_SPEED;
      if (nitroActive && !wasNitro.current) sounds.playBoost();
      wasNitro.current = nitroActive;

      const isManualInput =
        forwardKey ||
        backwardKey ||
        leftKey ||
        rightKey ||
        Math.abs(input.x) > 0.1 ||
        Math.abs(input.y) > 0.1;

      if (isManualInput && targetPosition) {
        onClearTargetPosition?.();
      }

      const baseSpeed = raceSession.running ? (isBoosting ? 30 : 19) : (isBoosting ? 46 : 27);

      if (forwardKey) thrust += 1;
      if (backwardKey) thrust -= 0.75;
      if (raceSession.running && isBoosting && !backwardKey) thrust = Math.max(thrust, 1);
      if (leftKey) turn += 1;
      if (rightKey) turn -= 1;

      if (Math.abs(input.x) > 0.1) turn = -input.x * 1.6;
      if (Math.abs(input.y) > 0.1) thrust = -input.y * (raceSession.running ? 1 : 1.4);

      if (raceSession.running) {
        const currentVelocity = body && isReady ? body.linvel() : velocity.current;
        turnSpeed = raceTurnRate(Math.hypot(currentVelocity.x, currentVelocity.z));
        raceSteering.current = smoothRaceSteering(raceSteering.current, turn, delta);
        turn = raceSteering.current;
      } else {
        raceSteering.current = 0;
      }

      if (body && isReady) {
        const currentTranslation = body.translation();
        const currentRot = body.rotation();

        _tempQuat.set(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
        _tempEuler.setFromQuaternion(_tempQuat, 'YXZ');
        let yaw = _tempEuler.y;

        // Auto-navigation towards target island
        if (canDrive && targetPosition && !isManualInput) {
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

            // Smooth elevation matching to target docking height
            const newY = THREE.MathUtils.lerp(currentTranslation.y, targetPosition[1], delta * 3.0);
            body.setTranslation({ x: currentTranslation.x, y: newY, z: currentTranslation.z }, true);
          } else {
            onClearTargetPosition?.();
            thrust = 0;
          }
        }

        // Update yaw steering
        yaw += turn * turnSpeed * delta * (1 - boundary.current.frame.strength * 0.5);

        // Directional vectors
        const forwardX = Math.sin(yaw);
        const forwardZ = Math.cos(yaw);
        const rightX = Math.cos(yaw);
        const rightZ = -Math.sin(yaw);

        // Current Rapier linear velocity
        const linvel = body.linvel();
        const vLateral = linvel.x * rightX + linvel.z * rightZ;

        // Apply forward / reverse impulse
        if (raceSession.running) {
          stepRaceDrive(raceVelocity, linvel.x, linvel.z, yaw, thrust, raceSpeedCap.current, delta);
          body.setLinvel({ x: raceVelocity.x, y: linvel.y, z: raceVelocity.z }, true);
        } else {
          if (thrust !== 0) {
            const forceMagnitude = thrust * baseSpeed * 36;
            body.applyImpulse(
              {
                x: forwardX * forceMagnitude * delta,
                y: 0,
                z: forwardZ * forceMagnitude * delta,
              },
              true
            );
          }

          // Tactile Bruno Simon Lateral Drift & Grip Dynamics:
          // Lateral friction corrects sideways velocity, giving that crisp toy car handling.
          // During boost or sharp turns, grip allows a controlled centrifugal drift!
          const gripCoeff = isBoosting ? 0.68 : 0.88;
          const lateralCorrection = -vLateral * gripCoeff;
          const mass = 14.0;
          const gripResponse = 14;
          const lateralImpulseMag = lateralCorrection * mass * Math.min(delta * gripResponse, 1.0);
          body.applyImpulse(
            {
              x: rightX * lateralImpulseMag,
              y: 0,
              z: rightZ * lateralImpulseMag,
            },
            true
          );
        }

        if (raceSession.running) {
          const moving = body.linvel();
          const scale = raceSpeedScale(moving.x, moving.z, raceSpeedCap.current);
          const wall = raceWallGuide.current.step(currentTranslation.x, currentTranslation.z,
            moving.x * scale, moving.z * scale, yaw, thrust, delta);
          body.setLinvel({ x: wall.vx, y: moving.y, z: wall.vz }, true);
          if (wall.x !== currentTranslation.x || wall.z !== currentTranslation.z) {
            body.setTranslation({ x: wall.x, y: currentTranslation.y, z: wall.z }, true);
          }
          yaw = wall.yaw;
        }

        // Smooth procedural thruster sound (gentle plasma hiss & sub-bass weight)
        sounds.updateThrusterSound(thrust, isBoosting);

        // Gentle zero-G celestial elevation stabilization (Cruising level = 1.0)
        const targetElevation = canDrive && targetPosition ? targetPosition[1] : 1.0;
        const elevDiff = targetElevation - currentTranslation.y;
        body.applyImpulse({ x: 0, y: elevDiff * 9.0 * delta, z: 0 }, true);

        // Update orientation
        _tempEuler.set(0, yaw, 0, 'YXZ');
        _targetQuat.setFromEuler(_tempEuler);
        body.setRotation(
          {
            x: _targetQuat.x,
            y: _targetQuat.y,
            z: _targetQuat.z,
            w: _targetQuat.w,
          },
          true
        );

        // Aerodynamic banking roll, pitch recoil, and suspension spring dynamics
        const targetRoll = -turn * (raceSession.running ? 0.32 : 0.44) - Math.max(-0.25, Math.min(0.25, vLateral * 0.025));
        const targetPitch = thrust * 0.18 + (isBoosting ? 0.08 : 0);
        const targetSuspension = isBoosting ? -0.06 : (thrust !== 0 ? -0.03 : 0);

        const dt = Math.min(delta, 0.05);

        // Roll spring
        const rollStiffness = 140;
        const rollDamping = 18;
        const rollForce = -rollStiffness * (rollZ.current - targetRoll) - rollDamping * rollVelocity.current;
        rollVelocity.current += rollForce * dt;
        rollZ.current += rollVelocity.current * dt;

        // Pitch spring
        const pitchStiffness = 130;
        const pitchDamping = 17;
        const pitchForce = -pitchStiffness * (pitchX.current - targetPitch) - pitchDamping * pitchVelocity.current;
        pitchVelocity.current += pitchForce * dt;
        pitchX.current += pitchVelocity.current * dt;

        // Suspension bounce spring
        const suspStiffness = 150;
        const suspDamping = 18;
        const suspForce = -suspStiffness * (suspensionY.current - targetSuspension) - suspDamping * suspensionVelocity.current;
        suspensionVelocity.current += suspForce * dt;
        suspensionY.current += suspensionVelocity.current * dt;

        // High-speed engine shudder / micro-vibration
        const engineJitter = isBoosting
          ? Math.sin(Date.now() * 0.08) * 0.022
          : (thrust !== 0 ? Math.sin(Date.now() * 0.045) * 0.007 : 0);

        const finalPos = body.translation();
        const hoverY = Math.sin(Date.now() * 0.0032) * 0.15 + suspensionY.current + engineJitter;

        groupRef.current.position.set(finalPos.x, finalPos.y + hoverY, finalPos.z);
        groupRef.current.rotation.set(pitchX.current, yaw, rollZ.current);

        pos.current.set(finalPos.x, finalPos.y, finalPos.z);
        rotationY.current = yaw;
        if (sharedVehicleRotation) sharedVehicleRotation.current = yaw;

        if (sharedVehiclePos) {
          sharedVehiclePos.current.set(finalPos.x, finalPos.y, finalPos.z);
        }

        // Throttle React root state updates to ~20 FPS for MiniMap / HUD
        const now = performance.now();
        if (now - lastAppUpdate.current > 50) {
          lastAppUpdate.current = now;
          onPositionChange([finalPos.x, finalPos.y, finalPos.z]);
          onRotationChange?.(yaw);
        }
      } else {
        // Kinematic fallback with drift & spring banking
        rotationY.current += turn * turnSpeed * delta * (1 - boundary.current.frame.strength * 0.5);
        const fX = Math.sin(rotationY.current);
        const fZ = Math.cos(rotationY.current);
        const rX = Math.cos(rotationY.current);
        const rZ = -Math.sin(rotationY.current);

        const vL = velocity.current.x * rX + velocity.current.z * rZ;

        if (raceSession.running) {
          stepRaceDrive(raceVelocity, velocity.current.x, velocity.current.z, rotationY.current,
            thrust, raceSpeedCap.current, delta);
          velocity.current.x = raceVelocity.x;
          velocity.current.z = raceVelocity.z;
        } else {
          if (thrust !== 0) {
            velocity.current.x += fX * thrust * baseSpeed * delta;
            velocity.current.z += fZ * thrust * baseSpeed * delta;
          }

          // Lateral damping
          const kGrip = isBoosting ? 0.72 : 0.88;
          const lateralDamp = Math.pow(1.0 - kGrip, delta * 20);
          velocity.current.x -= rX * vL * (1.0 - lateralDamp);
          velocity.current.z -= rZ * vL * (1.0 - lateralDamp);
          velocity.current.multiplyScalar(Math.pow(0.92, delta * 30));
        }
        if (raceSession.running) {
          const scale = raceSpeedScale(velocity.current.x, velocity.current.z, raceSpeedCap.current);
          velocity.current.x *= scale;
          velocity.current.z *= scale;
        }
        pos.current.addScaledVector(velocity.current, delta);
        if (raceSession.running) {
          const wall = raceWallGuide.current.step(pos.current.x, pos.current.z,
            velocity.current.x, velocity.current.z, rotationY.current, thrust, delta);
          pos.current.set(wall.x, 1, wall.z);
          velocity.current.set(wall.vx, 0, wall.vz);
          rotationY.current = wall.yaw;
        }

        const targetRoll = -turn * (raceSession.running ? 0.32 : 0.44) - Math.max(-0.25, Math.min(0.25, vL * 0.025));
        const targetPitch = thrust * 0.18 + (isBoosting ? 0.08 : 0);
        const targetSuspension = isBoosting ? -0.06 : (thrust !== 0 ? -0.03 : 0);

        const dt = Math.min(delta, 0.05);
        const rollForce = -140 * (rollZ.current - targetRoll) - 18 * rollVelocity.current;
        rollVelocity.current += rollForce * dt;
        rollZ.current += rollVelocity.current * dt;

        const pitchForce = -130 * (pitchX.current - targetPitch) - 17 * pitchVelocity.current;
        pitchVelocity.current += pitchForce * dt;
        pitchX.current += pitchVelocity.current * dt;

        const suspForce = -150 * (suspensionY.current - targetSuspension) - 18 * suspensionVelocity.current;
        suspensionVelocity.current += suspForce * dt;
        suspensionY.current += suspensionVelocity.current * dt;

        const engineJitter = isBoosting
          ? Math.sin(Date.now() * 0.08) * 0.022
          : (thrust !== 0 ? Math.sin(Date.now() * 0.045) * 0.007 : 0);

        const hoverY = Math.sin(Date.now() * 0.0032) * 0.15 + suspensionY.current + engineJitter;
        groupRef.current.position.set(pos.current.x, pos.current.y + hoverY, pos.current.z);
        groupRef.current.rotation.set(pitchX.current, rotationY.current, rollZ.current);
        if (sharedVehicleRotation) sharedVehicleRotation.current = rotationY.current;

        if (sharedVehiclePos) {
          sharedVehiclePos.current.set(pos.current.x, pos.current.y, pos.current.z);
        }

        const now = performance.now();
        if (now - lastAppUpdate.current > 120) {
          lastAppUpdate.current = now;
          onPositionChange([pos.current.x, pos.current.y, pos.current.z]);
          onRotationChange?.(rotationY.current);
        }
      }
  }

    previousRaceState.current = raceState;
    if (raceSession.running) {
      const wall = raceWallGuide.current.frame;
      const speed = Math.hypot(wall.vx, wall.vz);
      if (wall.impact) sounds.playKineticImpact(Math.min(0.6, speed / 40));
      if (wall.touching && speed > 2 && sparkCooldown.current === 0) {
        sparkEvents.emit([wall.sparkX, 0.8, wall.sparkZ], Math.min(0.65, speed / 32));
        sparkCooldown.current = 0.075;
      }
    }

    // Apply the same boundary constraint to Rapier and the kinematic fallback.
    // This runs before rendering, so a warp synchronizes physics, camera and HUD together.
    if (gameMode === 'driving' && isDriving) {
      const flightVelocity = body && isReady ? body.linvel() : velocity.current;
      _forwardVec.set(Math.sin(rotationY.current) * thrust, 0, Math.cos(rotationY.current) * thrust);
      const field = boundary.current.step(pos.current, flightVelocity, _forwardVec, delta);
      if (body && isReady) {
        body.setLinearDamping(raceSession.running ? 0 : field.linearDamping);
        body.setAngularDamping(field.angularDamping);
        if (field.warning) {
          const mass = body.mass();
          body.applyImpulse({ x: field.impulseX * mass, y: field.impulseY * mass, z: field.impulseZ * mass }, true);
        }
      } else if (field.warning) {
        velocity.current.x += field.impulseX;
        velocity.current.y += field.impulseY;
        velocity.current.z += field.impulseZ;
        velocity.current.multiplyScalar(Math.exp(-field.strength * 5 * delta));
      }
      if (field.beep) sounds.playBoundaryWarning();
      if (field.warp) {
        const safe = COSMIC_BOUNDARY.safePosition;
        if (body && isReady) {
          body.setTranslation(safe, true);
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
          _safeQuat.set(0, 0, 0, 1);
          body.setRotation(_safeQuat, true);
          body.setLinearDamping(1.55);
          body.setAngularDamping(3.4);
        }
        pos.current.set(safe.x, safe.y, safe.z);
        velocity.current.set(0, 0, 0);
        rotationY.current = rollZ.current = pitchX.current = 0;
        rollVelocity.current = pitchVelocity.current = suspensionVelocity.current = suspensionY.current = 0;
        groupRef.current.position.copy(pos.current);
        groupRef.current.rotation.set(0, 0, 0);
        if (sharedVehiclePos) sharedVehiclePos.current.copy(pos.current);
        if (sharedVehicleRotation) sharedVehicleRotation.current = 0;
        onPositionChange([safe.x, safe.y, safe.z]);
        onRotationChange?.(0);
        keys.current = {};
        if (virtualInputRef) Object.assign(virtualInputRef.current, NO_INPUT);
        onClearTargetPosition?.();
        puffsRef.current.forEach(puff => { puff.active = false; puff.life = 1; });
        puffMeshesRef.current.forEach(mesh => mesh?.scale.setScalar(0));
        spawnTimerRef.current = 0;
        isBoosting = false;
        thrust = 0;
        sounds.stopThrusterSound();
        sounds.playWarpEntry();
        onBoundaryReturn?.();
      }
      publishBoundaryTelemetry(field);
    }

    // Handle respawn invulnerability and visual blinking
    if (respawnTimer.current > 0) {
      respawnTimer.current -= delta;
      if (respawnTimer.current > 1.4) {
        // Disintegrate / hide during the initial blast
        groupRef.current.visible = false;
      } else {
        // Blinking invulnerability
        groupRef.current.visible = Math.floor(Date.now() / 70) % 2 === 0;
      }
      if (respawnTimer.current <= 0) {
        groupRef.current.visible = true;
      }
    }

    // Check Sun Collision (Sun is located at [0, 0, 0] with danger boundary ~5.5)
    const currentX = pos.current.x;
    const currentY = pos.current.y;
    const currentZ = pos.current.z;
    const distToSunSq = currentX * currentX + currentY * currentY + currentZ * currentZ;

    if (!isCinematic && distToSunSq < 5.6 * 5.6 && respawnTimer.current <= 0) {
      // 1. Emit Bruno Simon Low-Poly Explosion at impact point
      explosionEvents.emit([currentX, currentY, currentZ], 1.6);

      // 2. Start respawn & invulnerability timer
      respawnTimer.current = 2.2;

      // 3. Teleport rocket safely outside the sun to outer orbit
      const safeRespawnPos = { x: 0, y: 1.2, z: 34 };

      if (body && isReady) {
        body.setTranslation(safeRespawnPos, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        _safeQuat.set(0, 0, 0, 1);
        body.setRotation(_safeQuat, true);
      } else {
        pos.current.set(safeRespawnPos.x, safeRespawnPos.y, safeRespawnPos.z);
        velocity.current.set(0, 0, 0);
        rotationY.current = 0;
      }

      groupRef.current.position.set(safeRespawnPos.x, safeRespawnPos.y, safeRespawnPos.z);
      groupRef.current.rotation.set(0, 0, 0);
      onPositionChange([safeRespawnPos.x, safeRespawnPos.y, safeRespawnPos.z]);
      onRotationChange?.(0);

      // Clear exhaust puffs so smoke doesn't streak across the solar system
      puffsRef.current.forEach((p) => {
        p.active = false;
        p.life = 1;
      });
      puffMeshesRef.current.forEach((m) => {
        if (m) m.scale.set(0, 0, 0);
      });
    }

    // Determine if rocket is actively moving or thrusting
    if (body && isReady) {
      const linvel = body.linvel();
      _shipLinVel.set(linvel.x, linvel.y, linvel.z);
    } else {
      _shipLinVel.copy(velocity.current);
    }
    const shipLinVel = _shipLinVel;
    const bodySpeedSq = shipLinVel.x * shipLinVel.x + shipLinVel.z * shipLinVel.z;
    raceSession.speed = Math.sqrt(bodySpeedSq);
    raceSession.pitch = pitchX.current;
    raceSession.yaw = rotationY.current;
    raceSession.roll = rollZ.current;
    raceSession.boosting = isBoosting;
    raceSession.record(pos.current.x, pos.current.y, pos.current.z, pitchX.current, rotationY.current, rollZ.current);
    const isMoving = boundary.current.frame.recovery > 0 || isBoosting || Math.abs(thrust) > 0.05 || bodySpeedSq > 0.35 * 0.35;

    // Dynamic polygonal exhaust jet animation in world space:
    // When the ship is stopped, NOTHING comes out.
    // When accelerating or moving, separate polygons shoot out in world space,
    // curving naturally with turn physics when steering with A/D, shrinking gradually, and disappearing.
    if (isMoving) {
      const spawnInterval = isBoosting ? 0.024 : 0.038;
      spawnTimerRef.current += delta;

      while (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current -= spawnInterval;

        // Find an inactive or finished puff within maxPuffs pool
        let availablePuff: ExhaustPuff | undefined;
        for (let i = 0; i < maxPuffs; i++) {
          if (!puffsRef.current[i].active || puffsRef.current[i].life >= 1) {
            availablePuff = puffsRef.current[i];
            break;
          }
        }

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
          if (raceSession.active) availablePuff.initialScale *= 0.4;
        } else {
          // Do not accumulate missed emissions while the pool is full.
          spawnTimerRef.current = 0;
          break;
        }
      }
    } else {
      spawnTimerRef.current = 0;
    }

    // Update the puffs in world space
    for (let i = 0; i < MAX_PUFFS_CAP; i++) {
      const puff = puffsRef.current[i];
      const mesh = puffMeshesRef.current[i];
      const mat = puffMatsRef.current[i];

      if (i >= maxPuffs || !puff.active) {
        if (mesh && mesh.scale.x > 0) mesh.scale.set(0, 0, 0);
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
        if (raceSession.active && isBoosting) {
          mat.color.lerpColors(COLOR_NITRO, COLOR_VIOLET, progress);
        } else if (progress < 0.22) {
          mat.color.lerpColors(COLOR_YELLOW, COLOR_ORANGE, progress / 0.22);
        } else if (progress < 0.55) {
          mat.color.lerpColors(COLOR_ORANGE, COLOR_WHITE, (progress - 0.22) / 0.33);
        } else {
          mat.color.lerpColors(COLOR_WHITE, COLOR_GRAY, (progress - 0.55) / 0.45);
        }
      }
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
      <group ref={groupRef} position={position}>
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
          color="#ef4444"
          roughness={0.32}
          metalness={0.15}
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
            color="#f8fafc"
            roughness={0.34}
            metalness={0.12}
            flatShading
          />
        </mesh>

        {/* Mid Fuselage: widest central cylindrical core (r = 0.84) */}
        <mesh position={[0, 0, 0.025]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.84, 0.84, 0.75, 10]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.34}
            metalness={0.12}
            flatShading
          />
        </mesh>

        {/* Lower Fuselage: radiusTop (front) = 0.84, radiusBottom (rear) = 0.48 */}
        <mesh position={[0, 0, -0.90]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.84, 0.48, 1.10, 10]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.34}
            metalness={0.12}
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
            roughness={0.28}
            metalness={0.45}
            flatShading
          />
        </mesh>

        {/* Inner Window Recess */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.31, 0.31, 0.08, 10]} />
          <meshStandardMaterial
            color="#334155"
            roughness={0.35}
            metalness={0.30}
            flatShading
          />
        </mesh>

        {/* Faceted Sky-Blue Porthole Glass Dome */}
        <mesh position={[0, 0.07, 0]} castShadow>
          <sphereGeometry args={[0.29, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.3}
            roughness={0.12}
            metalness={0.20}
            flatShading
          />
        </mesh>

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
              color="#ef4444"
              roughness={0.32}
              metalness={0.15}
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
            roughness={0.32}
            metalness={0.65}
            flatShading
          />
        </mesh>

        {/* Flared Exhaust Bell: radiusTop (front) = 0.38, radiusBottom (rear) = 0.44 */}
        <mesh position={[0, 0, -1.81]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.44, 0.22, 10]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.30}
            metalness={0.70}
            flatShading
          />
        </mesh>

        {/* Glowing Inner Thrust Chamber */}
        <mesh position={[0, 0, -1.86]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.05, 10]} />
          <meshStandardMaterial
            color="#ffedd5"
            emissive="#ea580c"
            emissiveIntensity={2.6}
            roughness={0.20}
            metalness={0.10}
            flatShading
          />
        </mesh>
      </group>

    </group>

    {/* -----------------------------------------------------------------
        7. DYNAMIC POLYGONAL EXHAUST JET (WORLD SPACE)
           Independent low-poly figures simulated in world space coordinates.
           Curving with authentic turn physics when steering with A/D,
           gradually shrinking and disappearing.
           Completely cuts off when the ship is stopped!
       ----------------------------------------------------------------- */}
    <group>
      {puffs.map((_, idx) => (
        <mesh
          key={`exhaust-puff-${idx}`}
          ref={(el) => {
            puffMeshesRef.current[idx] = el;
          }}
          scale={[0, 0, 0]}
          visible={idx < maxPuffs}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            ref={(el) => {
              puffMatsRef.current[idx] = el;
            }}
            color="#fbbf24"
            roughness={0.35}
            metalness={0.05}
            flatShading
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
    </group>
  </>
);
};

export const SpaceVehicle = React.memo(SpaceVehicleComponent);
