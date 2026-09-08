import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandConfig, IslandId, CameraViewMode } from '../../types';

interface CameraControllerProps {
  gameMode: 'landing' | 'driving' | 'inspecting';
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  cameraViewMode: CameraViewMode;
  selectedIslandId: IslandId | null;
  islands: IslandConfig[];
}

export const CameraController: React.FC<CameraControllerProps> = ({
  gameMode,
  vehiclePos,
  vehicleRotation,
  cameraViewMode,
  selectedIslandId,
  islands,
}) => {
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const landingAngle = useRef(0);

  useEffect(() => {
    if (gameMode === 'landing') {
      camera.position.set(0, 95, 125);
      camera.lookAt(0, 0, 0);
    }
  }, [gameMode, camera]);

  useFrame((_, delta) => {
    // 1. LANDING MODE: Smooth panoramic orbit around the entire galaxy
    if (gameMode === 'landing') {
      landingAngle.current += delta * 0.07;
      const radius = 125;
      const camX = Math.sin(landingAngle.current) * radius;
      const camZ = Math.cos(landingAngle.current) * radius;
      const camY = 90 + Math.sin(landingAngle.current * 0.5) * 10;

      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), delta * 2.5);
      currentLookAt.current.lerp(new THREE.Vector3(0, 0, 0), delta * 3);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // 2. INSPECTING MODE: Zoom smoothly on the selected island
    if (gameMode === 'inspecting' && selectedIslandId) {
      const island = islands.find((i) => i.id === selectedIslandId);
      if (island) {
        const targetPos = new THREE.Vector3(
          Math.cos(island.angleOffset) * island.orbitRadius,
          island.elevation,
          Math.sin(island.angleOffset) * island.orbitRadius
        );

        const desiredCamPos = new THREE.Vector3(
          targetPos.x + 9,
          targetPos.y + 12,
          targetPos.z + 14
        );

        camera.position.lerp(desiredCamPos, delta * 2.8);
        currentLookAt.current.lerp(targetPos, delta * 3.2);
        camera.lookAt(currentLookAt.current);
        return;
      }
    }

    // 3. DRIVING MODE: Choice between Chase (Git City) or Tactical 55° Global View
    if (cameraViewMode === 'chase') {
      // MODE 1: Fixed directly behind the vehicle (like Git City / racing games)
      // Follows both vehicle position and yaw rotation strictly from behind
      const sinRot = Math.sin(vehicleRotation);
      const cosRot = Math.cos(vehicleRotation);

      const chaseDist = 13.5;
      const chaseHeight = 5.2;

      const desiredCamPos = new THREE.Vector3(
        vehiclePos[0] - sinRot * chaseDist,
        vehiclePos[1] + chaseHeight,
        vehiclePos[2] - cosRot * chaseDist
      );

      const targetLookAt = new THREE.Vector3(
        vehiclePos[0] + sinRot * 8,
        vehiclePos[1] + 1.2,
        vehiclePos[2] + cosRot * 8
      );

      camera.position.lerp(desiredCamPos, Math.min(delta * 7.5, 1));
      currentLookAt.current.lerp(targetLookAt, Math.min(delta * 8.5, 1));
      camera.lookAt(currentLookAt.current);
    } else {
      // MODE 2: Fixed 55-degree angle where all islands are in field of view 100% of the time
      // tan(55°) ≈ 1.428 -> camY / camZ = 215 / 150 = 1.433 (55.1° tilt)
      const desiredCamPos = new THREE.Vector3(0, 215, 150);
      const centerLookAt = new THREE.Vector3(0, 0, 0);

      camera.position.lerp(desiredCamPos, delta * 3.5);
      currentLookAt.current.lerp(centerLookAt, delta * 4.0);
      camera.lookAt(currentLookAt.current);
    }
  });

  return null;
};
