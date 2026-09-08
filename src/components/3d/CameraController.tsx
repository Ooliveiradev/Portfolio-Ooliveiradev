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

  // Set perspective camera with low FOV (30 degrees) for miniature diorama effect
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cameraViewMode === 'chase' ? 34 : 30;
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraViewMode]);

  useEffect(() => {
    if (gameMode === 'landing') {
      camera.position.set(38, 42, 38);
      camera.lookAt(0, 0, 0);
      currentLookAt.current.set(0, 0, 0);
    }
  }, [gameMode, camera]);

  useFrame((_, delta) => {
    // 1. LANDING MODE: Smooth panoramic orbit around the entire solar system
    if (gameMode === 'landing') {
      landingAngle.current += delta * 0.12;
      const radius = 72;
      const camX = Math.sin(landingAngle.current) * radius;
      const camZ = Math.cos(landingAngle.current) * radius;
      const camY = 54;

      const targetPos = new THREE.Vector3(camX, camY, camZ);
      camera.position.lerp(targetPos, delta * 2.5);
      currentLookAt.current.lerp(new THREE.Vector3(0, 0, 0), delta * 3.5);
      camera.lookAt(currentLookAt.current);
      return;
    }

    // 2. INSPECTING MODE: Zoom smoothly on selected planetary island
    if (gameMode === 'inspecting' && selectedIslandId) {
      const island = islands.find((i) => i.id === selectedIslandId);
      if (island) {
        const islandPos = new THREE.Vector3(
          Math.cos(island.angleOffset) * island.orbitRadius,
          island.elevation,
          Math.sin(island.angleOffset) * island.orbitRadius
        );

        const desiredCamPos = new THREE.Vector3(
          islandPos.x + 18,
          islandPos.y + 19,
          islandPos.z + 18
        );

        camera.position.lerp(desiredCamPos, delta * 3.2);
        currentLookAt.current.lerp(
          new THREE.Vector3(islandPos.x, islandPos.y + 1.2, islandPos.z),
          delta * 4.0
        );
        camera.lookAt(currentLookAt.current);
        return;
      }
    }

    // 3. DRIVING MODE:
    // MODE A: ATRÁS DA NAVE (Chase Camera) - Fixada rigorosamente atrás da nave acompanhando rumo e curvas
    if (cameraViewMode === 'chase') {
      const sinRot = Math.sin(vehicleRotation);
      const cosRot = Math.cos(vehicleRotation);

      const chaseDist = 13.8;
      const chaseHeight = 5.2;

      const desiredCamPos = new THREE.Vector3(
        vehiclePos[0] - sinRot * chaseDist,
        vehiclePos[1] + chaseHeight,
        vehiclePos[2] - cosRot * chaseDist
      );

      const targetLookAt = new THREE.Vector3(
        vehiclePos[0] + sinRot * 9.5,
        vehiclePos[1] + 1.2,
        vehiclePos[2] + cosRot * 9.5
      );

      camera.position.lerp(desiredCamPos, Math.min(delta * 6.5, 1));
      currentLookAt.current.lerp(targetLookAt, Math.min(delta * 8.0, 1));
      camera.lookAt(currentLookAt.current);
      return;
    }

    // MODE B: VISÃO ISOMÉTRICA (Diorama Diagonal Follow)
    if (cameraViewMode === 'iso') {
      const isoOffset = new THREE.Vector3(24, 26, 24);
      const desiredCamPos = new THREE.Vector3(
        vehiclePos[0] + isoOffset.x,
        vehiclePos[1] + isoOffset.y,
        vehiclePos[2] + isoOffset.z
      );

      const targetLookAt = new THREE.Vector3(
        vehiclePos[0],
        vehiclePos[1] + 0.6,
        vehiclePos[2]
      );

      camera.position.lerp(desiredCamPos, Math.min(delta * 5.0, 1));
      currentLookAt.current.lerp(targetLookAt, Math.min(delta * 6.5, 1));
      camera.lookAt(currentLookAt.current);
      return;
    }

    // MODE C: VISÃO GLOBAL (Panorâmica 55° cobrindo o Sistema Solar)
    if (cameraViewMode === 'tactical55') {
      const desiredCamPos = new THREE.Vector3(0, 140, 110);
      const centerLookAt = new THREE.Vector3(0, 0, 0);

      camera.position.lerp(desiredCamPos, delta * 3.5);
      currentLookAt.current.lerp(centerLookAt, delta * 4.0);
      camera.lookAt(currentLookAt.current);
      return;
    }
  });

  return null;
};
