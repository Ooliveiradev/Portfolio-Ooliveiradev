import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceVehicle } from './3d/SpaceVehicle';
import { Islands } from './3d/Islands';
import { OrbitRingsAndCollectibles } from './3d/OrbitRingsAndCollectibles';
import { CameraController } from './3d/CameraController';
import { IslandConfig, IslandId, CrystalCollectible, CameraViewMode } from '../types';

interface GalaxySceneProps {
  gameMode: 'landing' | 'driving' | 'inspecting';
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  cameraViewMode: CameraViewMode;
  targetVehiclePos: [number, number, number] | null;
  onVehiclePosChange: (pos: [number, number, number]) => void;
  onVehicleRotationChange?: (rot: number) => void;
  onSelectIsland: (id: IslandId) => void;
  selectedIslandId: IslandId | null;
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  crystals: CrystalCollectible[];
  onCollectCrystal: (id: number) => void;
  virtualInput: { x: number; y: number; boost: boolean };
  isModalOpen: boolean;
  onClearTargetPosition?: () => void;
}

export const GalaxyScene: React.FC<GalaxySceneProps> = ({
  gameMode,
  vehiclePos,
  vehicleRotation,
  cameraViewMode,
  targetVehiclePos,
  onVehiclePosChange,
  onVehicleRotationChange,
  onSelectIsland,
  selectedIslandId,
  islands,
  visitedIslands,
  crystals,
  onCollectCrystal,
  virtualInput,
  isModalOpen,
  onClearTargetPosition,
}) => {
  return (
    <div className="w-full h-full absolute inset-0 select-none overflow-hidden bg-[#070b14]">
      <Canvas
        shadows
        camera={{ position: [0, 85, 115], fov: 44, far: 1200 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#070b14']} />
          <fog attach="fog" args={['#070b14', 110, 420]} />

          {/* Bruno Simon Style Lighting: Soft ambient + crisp warm directional sunlight with shadows */}
          <ambientLight intensity={0.7} color="#cbd5e1" />
          <directionalLight
            position={[50, 80, 40]}
            intensity={2.2}
            color="#fffbeb"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={10}
            shadow-camera-far={280}
            shadow-camera-left={-120}
            shadow-camera-right={120}
            shadow-camera-top={120}
            shadow-camera-bottom={-120}
            shadow-bias={-0.0005}
          />
          {/* Subtle blue fill light from deep space */}
          <directionalLight position={[-30, 20, -40]} intensity={0.8} color="#38bdf8" />

          {/* Camera orchestration */}
          <CameraController
            gameMode={gameMode}
            vehiclePos={vehiclePos}
            vehicleRotation={vehicleRotation}
            cameraViewMode={cameraViewMode}
            selectedIslandId={selectedIslandId}
            islands={islands}
          />

          {/* Thematic Islands */}
          <Islands
            islands={islands}
            visitedIslands={visitedIslands}
            onSelectIsland={onSelectIsland}
            orbitActive={gameMode === 'landing'}
            vehiclePos={vehiclePos}
            isModalOpen={isModalOpen}
          />

          {/* Player Rover (visible in driving and inspecting mode) */}
          {gameMode !== 'landing' && (
            <SpaceVehicle
              position={vehiclePos}
              targetPosition={targetVehiclePos}
              onPositionChange={onVehiclePosChange}
              onRotationChange={onVehicleRotationChange}
              isDriving={gameMode === 'driving'}
              virtualInput={virtualInput}
              onClearTargetPosition={onClearTargetPosition}
            />
          )}

          {/* Orbit rings, Starfield and Collectible crystals */}
          <OrbitRingsAndCollectibles
            islands={islands}
            crystals={crystals}
            vehiclePos={vehiclePos}
            onCollectCrystal={onCollectCrystal}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
