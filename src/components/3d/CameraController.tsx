import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandConfig, IslandId, CameraViewMode, GameMode } from '../../types';
import { getIslandLivePosition } from '../../utils/celestialCoords';

interface CameraControllerProps {
  gameMode: GameMode;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  cameraViewMode: CameraViewMode;
  selectedIslandId: IslandId | null;
  islands: IslandConfig[];
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
}

// Scratch objects to eliminate per-frame garbage collection
const _desiredCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _islandPos = new THREE.Vector3();
const _targetPos = new THREE.Vector3();
const _centerLookAt = new THREE.Vector3(0, 0, 0);
const ISO_OFFSET = new THREE.Vector3(24, 26, 24);

export const CameraController: React.FC<CameraControllerProps> = ({
  gameMode,
  vehiclePos,
  vehicleRotation,
  cameraViewMode,
  selectedIslandId,
  islands,
  sharedVehiclePos,
}) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const landingAngle = useRef(0);
  const isFirstMount = useRef(true);

  // Speed estimation & smoothed look-ahead refs
  const prevPos = useRef(new THREE.Vector3(vehiclePos[0], vehiclePos[1], vehiclePos[2]));
  const smoothedSpeed = useRef(0);
  const smoothedLookAhead = useRef(new THREE.Vector3(vehiclePos[0], vehiclePos[1], vehiclePos[2]));

  // Set perspective camera with low FOV (30 degrees) for miniature diorama effect
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 30;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

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
    // 1. LANDING & EXITING MODES: Smooth panoramic orbit around the entire solar system
    if (gameMode === 'landing' || gameMode === 'exiting') {
      landingAngle.current += delta * 0.12;
      const radius = 72;
      const camX = Math.sin(landingAngle.current) * radius;
      const camZ = Math.cos(landingAngle.current) * radius;
      const camY = 54 + Math.sin(landingAngle.current * 0.5) * 3.5;

      _targetPos.set(camX, camY, camZ);
      const lerpFactor = gameMode === 'exiting' ? delta * 2.0 : delta * 2.5;
      camera.position.lerp(_targetPos, lerpFactor);
      currentLookAt.current.lerp(_centerLookAt, delta * 3.5);
      camera.lookAt(currentLookAt.current);

      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - 30) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 30, delta * 3.0);
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
          _islandPos.x + 17 + orbitX,
          _islandPos.y + 17,
          _islandPos.z + 19 + orbitZ
        );

        _targetLookAt.set(_islandPos.x, _islandPos.y + 1.8, _islandPos.z + 1.8);

        camera.position.lerp(_desiredCamPos, delta * 3.2);
        currentLookAt.current.lerp(_targetLookAt, delta * 4.0);
        camera.lookAt(currentLookAt.current);

        if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - 30) > 0.05) {
          camera.fov = THREE.MathUtils.lerp(camera.fov, 30, delta * 3.0);
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

    // Estimate vehicle speed for dynamic camera responsiveness
    const safeDelta = Math.max(delta, 0.001);
    const instSpeed = Math.hypot(vx - prevPos.current.x, vz - prevPos.current.z) / safeDelta;
    prevPos.current.set(vx, vy, vz);
    smoothedSpeed.current = THREE.MathUtils.lerp(
      smoothedSpeed.current,
      THREE.MathUtils.clamp(instSpeed, 0, 55),
      delta * 5.0
    );

    // VISÃO ISOMÉTRICA (Bruno Simon Dynamic Predictive Follow)
    if (cameraViewMode === 'iso') {
      // Dynamic look-ahead: leads into turns and forward travel direction
      const forwardX = Math.sin(vehicleRotation);
      const forwardZ = Math.cos(vehicleRotation);
      const leadDistance = THREE.MathUtils.lerp(1.2, 4.0, THREE.MathUtils.clamp(smoothedSpeed.current / 35, 0, 1));
      
      const targetLeadX = vx + forwardX * leadDistance;
      const targetLeadZ = vz + forwardZ * leadDistance;

      smoothedLookAhead.current.x = THREE.MathUtils.lerp(smoothedLookAhead.current.x, targetLeadX, delta * 6.5);
      smoothedLookAhead.current.y = THREE.MathUtils.lerp(smoothedLookAhead.current.y, vy + 0.6, delta * 6.0);
      smoothedLookAhead.current.z = THREE.MathUtils.lerp(smoothedLookAhead.current.z, targetLeadZ, delta * 6.5);

      _targetLookAt.copy(smoothedLookAhead.current);

      // Speed-responsive subtle camera pull-back for high velocity sensation
      const speedOffsetFactor = 1.0 + (smoothedSpeed.current / 240);
      _desiredCamPos.set(
        vx + ISO_OFFSET.x * speedOffsetFactor,
        vy + ISO_OFFSET.y * speedOffsetFactor,
        vz + ISO_OFFSET.z * speedOffsetFactor
      );

      // Dynamic FOV kick on high speed & boost
      if (camera instanceof THREE.PerspectiveCamera) {
        const targetFov = THREE.MathUtils.lerp(
          30.0,
          32.5,
          THREE.MathUtils.clamp((smoothedSpeed.current - 12) / 28, 0, 1)
        );
        camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, delta * 4.0);
        camera.updateProjectionMatrix();
      }

      // Smooth cinematic descent on game entry, responsive follow on driving
      const camFollowSpeed = gameMode === 'entering' ? Math.min(delta * 2.8, 1) : Math.min(delta * 5.2, 1);
      const lookFollowSpeed = gameMode === 'entering' ? Math.min(delta * 3.6, 1) : Math.min(delta * 7.0, 1);

      camera.position.lerp(_desiredCamPos, camFollowSpeed);
      currentLookAt.current.lerp(_targetLookAt, lookFollowSpeed);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // MODE C: VISÃO GLOBAL (Panorâmica 55° cobrindo o Sistema Solar)
    if (cameraViewMode === 'tactical55') {
      _desiredCamPos.set(0, 140, 110);

      camera.position.lerp(_desiredCamPos, delta * 3.5);
      currentLookAt.current.lerp(_centerLookAt, delta * 4.0);
      camera.lookAt(currentLookAt.current);

      if (camera instanceof THREE.PerspectiveCamera && Math.abs(camera.fov - 30) > 0.05) {
        camera.fov = THREE.MathUtils.lerp(camera.fov, 30, delta * 3.0);
        camera.updateProjectionMatrix();
      }
      return;
    }
  });

  return null;
};
