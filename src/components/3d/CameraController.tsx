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
  cameraViewMode,
  selectedIslandId,
  islands,
  sharedVehiclePos,
}) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const landingAngle = useRef(0);
  const isFirstMount = useRef(true);

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
      const camY = 54;

      _targetPos.set(camX, camY, camZ);
      const lerpFactor = gameMode === 'exiting' ? delta * 2.0 : delta * 2.5;
      camera.position.lerp(_targetPos, lerpFactor);
      currentLookAt.current.lerp(_centerLookAt, delta * 3.5);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // 2. INSPECTING & LANDING-ON-ISLAND MODES: Smooth zoom & focus on selected planetary island
    if ((gameMode === 'inspecting' || gameMode === 'landing-island') && selectedIslandId) {
      const island = islands.find((i) => i.id === selectedIslandId);
      if (island) {
        const [ix, iy, iz] = getIslandLivePosition(island);
        _islandPos.set(ix, iy, iz);

        _desiredCamPos.set(
          _islandPos.x + 18,
          _islandPos.y + 19,
          _islandPos.z + 18
        );

        _targetLookAt.set(_islandPos.x, _islandPos.y + 1.2, _islandPos.z);

        camera.position.lerp(_desiredCamPos, delta * 3.2);
        currentLookAt.current.lerp(_targetLookAt, delta * 4.0);
        camera.lookAt(currentLookAt.current);
        return;
      }
    }

    // 3. ENTERING, DRIVING & TAKEOFF MODES:
    // Get live vehicle coordinates from high-speed shared ref or fallback to state
    const vx = sharedVehiclePos ? sharedVehiclePos.current.x : vehiclePos[0];
    const vy = sharedVehiclePos ? sharedVehiclePos.current.y : vehiclePos[1];
    const vz = sharedVehiclePos ? sharedVehiclePos.current.z : vehiclePos[2];

    // VISÃO ISOMÉTRICA (Diorama Diagonal Follow - Padrão)
    if (cameraViewMode === 'iso') {
      _desiredCamPos.set(
        vx + ISO_OFFSET.x,
        vy + ISO_OFFSET.y,
        vz + ISO_OFFSET.z
      );

      _targetLookAt.set(vx, vy + 0.6, vz);

      // Smooth cinematic descent on game entry, responsive follow on driving
      const camFollowSpeed = gameMode === 'entering' ? Math.min(delta * 2.8, 1) : Math.min(delta * 5.0, 1);
      const lookFollowSpeed = gameMode === 'entering' ? Math.min(delta * 3.6, 1) : Math.min(delta * 6.5, 1);

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
      return;
    }
  });

  return null;
};
