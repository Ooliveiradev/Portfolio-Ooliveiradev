import { cameraFraming } from '../../utils/mobileExperience';
import { useTouchLayout } from '../../hooks/useTouchLayout';
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandConfig, IslandId, GameMode } from '../../types';
import { getIslandLivePosition } from '../../utils/celestialCoords';
import { getBoundaryTelemetry } from '../../utils/boundaryTelemetry';

interface CameraControllerProps {
  isRacingCamera?: boolean;
  gameMode: GameMode;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  selectedIslandId: IslandId | null;
  islands: IslandConfig[];
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  sharedVehicleRotation?: React.MutableRefObject<number>;
}

// Scratch objects to eliminate per-frame garbage collection
const _desiredCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _islandPos = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _centerLookAt = new THREE.Vector3(0, 0, 0);
const ISO_OFFSET = new THREE.Vector3(24, 26, 24);
const _raceTargetRotation = new THREE.Quaternion();

const CameraControllerComponent: React.FC<CameraControllerProps> = ({
  isRacingCamera = false,
  gameMode,
  vehiclePos,
  vehicleRotation,
  selectedIslandId,
  islands,
  sharedVehiclePos,
  sharedVehicleRotation,
}) => {
  const { camera, size } = useThree();
  const framing = cameraFraming(size.width, size.height);
  const touchLayout = useTouchLayout();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const landingAngle = useRef(0);
  const isFirstMount = useRef(true);
  const raceRotation = useRef(new THREE.Quaternion());
  const raceEuler = useRef(new THREE.Euler());
  const raceUp = useRef(new THREE.Vector3());
  const wasRacing = useRef(false);

  // Speed estimation & smoothed look-ahead refs
  const prevPos = useRef(new THREE.Vector3(vehiclePos[0], vehiclePos[1], vehiclePos[2]));
  const smoothedSpeed = useRef(0);
  const smoothedLookAhead = useRef(new THREE.Vector3(vehiclePos[0], vehiclePos[1], vehiclePos[2]));

  // Widen portrait framing; size updates also handle device rotation.
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = framing.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, framing.fov]);

  // Initial mount position without hard-snapping on subsequent transitions
  useEffect(() => {
    if (isFirstMount.current && gameMode === 'landing') {
      camera.position.set(38, 42, 38);
      camera.lookAt(0, 0, 0);
      currentLookAt.current.set(0, 0, 0);
      isFirstMount.current = false;
    }
  }, [gameMode, camera]);

  useFrame((_, delta) => {
    delta = Math.min(delta, 0.05);
    // A rotating chase camera makes a held screen-space direction spin in circles.
    // Touch keeps the same stable isometric reference during exploration and races.
    if (isRacingCamera && sharedVehiclePos && !touchLayout) {
      _raceTargetRotation.setFromEuler(raceEuler.current.set(0, sharedVehicleRotation?.current ?? vehicleRotation, 0, 'YXZ'));
      if (!wasRacing.current) raceRotation.current.copy(_raceTargetRotation);
      raceRotation.current.slerp(_raceTargetRotation, 1 - Math.exp(-6 * delta));
      wasRacing.current = true;
      _desiredCamPos.set(0, 7.5 * framing.distance, -16 * framing.distance).applyQuaternion(raceRotation.current).add(sharedVehiclePos.current);
      // A steady follow offset avoids the spring stretching when a portal boosts the ship.
      camera.position.lerp(_desiredCamPos, 1 - Math.exp(-14 * delta));
      _targetLookAt.set(0, 0.4, 10).applyQuaternion(raceRotation.current).add(sharedVehiclePos.current);
      currentLookAt.current.lerp(_targetLookAt, 1 - Math.exp(-14 * delta));
      camera.up.set(0, 1, 0);
      camera.lookAt(currentLookAt.current);
      if (camera instanceof THREE.PerspectiveCamera) {
        const fov = THREE.MathUtils.lerp(camera.fov, framing.raceFov, 1 - Math.exp(-5 * delta));
        if (Math.abs(fov - camera.fov) > 0.001) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
      }
      prevPos.current.copy(sharedVehiclePos.current);
      smoothedLookAhead.current.copy(currentLookAt.current);
      return;
    }
    wasRacing.current = false;
    raceUp.current.set(0, 1, 0);
    camera.up.lerp(raceUp.current, 1 - Math.exp(-6 * delta)).normalize();
    // 1. LANDING & EXITING MODES: Smooth panoramic orbit around the entire solar system
    if (gameMode === 'landing' || gameMode === 'exiting') {
      landingAngle.current += delta * 0.12;
      const radius = 72 * framing.distance;
      const camX = Math.sin(landingAngle.current) * radius;
      const camZ = Math.cos(landingAngle.current) * radius;
      const camY = 54 * framing.distance + Math.sin(landingAngle.current * 0.5) * 3.5;

      _targetPos.set(camX, camY, camZ);
      const lerpFactor = gameMode === 'exiting' ? delta * 2.0 : delta * 2.5;
      camera.position.lerp(_targetPos, lerpFactor);
      currentLookAt.current.lerp(_centerLookAt, delta * 3.5);
      camera.lookAt(currentLookAt.current);

      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - framing.fov) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, delta * 3.0);
        camera.updateProjectionMatrix();
      }
      return;
    }

    // 2. INSPECTING & LANDING-ON-ISLAND MODES: Smooth zoom & focus on selected planetary island with gentle breathing orbit
    if ((gameMode === 'inspecting' || gameMode === 'landing-island') && selectedIslandId) {
      const island = islands.find((i) => i.id === selectedIslandId);
      if (island) {
        const [ix, iy, iz] = getIslandLivePosition(island);
        _islandPos.set(ix, iy, iz);

        // Gentle breathing orbit gives the miniature island life
        const inspectTime = performance.now() * 0.0004;
        const orbitX = Math.sin(inspectTime) * 1.6;
        const orbitZ = Math.cos(inspectTime) * 1.6;

        _desiredCamPos.set(
          _islandPos.x + 17 * framing.distance + orbitX,
          _islandPos.y + 17 * framing.distance,
          _islandPos.z + 19 * framing.distance + orbitZ
        );

        _targetLookAt.set(_islandPos.x, _islandPos.y + 1.8, _islandPos.z + 1.8);

        camera.position.lerp(_desiredCamPos, delta * 3.2);
        currentLookAt.current.lerp(_targetLookAt, delta * 4.0);
        camera.lookAt(currentLookAt.current);

        if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - framing.fov) > 0.05) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, framing.fov, delta * 3.0);
          camera.updateProjectionMatrix();
        }
        return;
      }
    }

    // 3. ENTERING, DRIVING & TAKEOFF MODES:
    // Get live vehicle coordinates from high-speed shared ref or fallback to state
    const vx = sharedVehiclePos ? sharedVehiclePos.current.x : vehiclePos[0];
    const vy = sharedVehiclePos ? sharedVehiclePos.current.y : vehiclePos[1];
    const vz = sharedVehiclePos ? sharedVehiclePos.current.z : vehiclePos[2];

    // Keep the quantum return behind its flash instead of flying across the map.
    if (getBoundaryTelemetry().warp) {
      prevPos.current.set(vx, vy, vz);
      smoothedSpeed.current = 0;
      smoothedLookAhead.current.set(vx, vy + 0.6, vz + 1.2);
      currentLookAt.current.copy(smoothedLookAhead.current);
      camera.position.set(vx + ISO_OFFSET.x * framing.distance, vy + ISO_OFFSET.y * framing.distance, vz + ISO_OFFSET.z * framing.distance);
    }

    // Estimate vehicle speed for dynamic camera responsiveness
    const safeDelta = Math.max(delta, 0.001);
    const instSpeed = Math.hypot(vx - prevPos.current.x, vz - prevPos.current.z) / safeDelta;
    prevPos.current.set(vx, vy, vz);
    smoothedSpeed.current = THREE.MathUtils.lerp(
      smoothedSpeed.current,
      THREE.MathUtils.clamp(instSpeed, 0, 55),
      delta * 5.0
    );

    // Isometric follow with look-ahead and a subtle speed response.
    // Dynamic look-ahead: leads into turns and forward travel direction
    const yaw = sharedVehicleRotation?.current ?? vehicleRotation;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);
    const leadDistance = THREE.MathUtils.lerp(1.2, 4.0, THREE.MathUtils.clamp(smoothedSpeed.current / 35, 0, 1));

    const targetLeadX = vx + forwardX * leadDistance;
    const targetLeadZ = vz + forwardZ * leadDistance;

    smoothedLookAhead.current.x = THREE.MathUtils.lerp(smoothedLookAhead.current.x, targetLeadX, delta * 6.5);
    smoothedLookAhead.current.y = THREE.MathUtils.lerp(smoothedLookAhead.current.y, vy + 0.6, delta * 6.0);
    smoothedLookAhead.current.z = THREE.MathUtils.lerp(smoothedLookAhead.current.z, targetLeadZ, delta * 6.5);

    _targetLookAt.copy(smoothedLookAhead.current);

    // Speed-responsive subtle camera pull-back for high velocity sensation
    const speedOffsetFactor = framing.distance * (1.0 + smoothedSpeed.current / 240);
    _desiredCamPos.set(
      vx + ISO_OFFSET.x * speedOffsetFactor,
      vy + ISO_OFFSET.y * speedOffsetFactor,
      vz + ISO_OFFSET.z * speedOffsetFactor
    );

    // Dynamic FOV kick on high speed & boost
    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = THREE.MathUtils.lerp(
        framing.fov,
        framing.fov + 2.5,
        THREE.MathUtils.clamp((smoothedSpeed.current - 12) / 28, 0, 1)
      );
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 4.0);
        camera.updateProjectionMatrix();
      }
    }

    // Smooth cinematic descent on game entry, responsive follow on driving
    const camFollowSpeed = gameMode === 'entering' ? Math.min(delta * 2.8, 1) : Math.min(delta * 5.2, 1);
    const lookFollowSpeed = gameMode === 'entering' ? Math.min(delta * 3.6, 1) : Math.min(delta * 7.0, 1);

    camera.position.lerp(_desiredCamPos, camFollowSpeed);
    currentLookAt.current.lerp(_targetLookAt, lookFollowSpeed);
    camera.lookAt(currentLookAt.current);
    return;
  });

  return null;
};

export const CameraController = React.memo(CameraControllerComponent);
