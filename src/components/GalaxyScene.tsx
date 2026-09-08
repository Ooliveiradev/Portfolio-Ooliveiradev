import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceVehicle } from './3d/SpaceVehicle';
import { Islands } from './3d/Islands';
import { OrbitRingsAndCollectibles } from './3d/OrbitRingsAndCollectibles';
import { CameraController } from './3d/CameraController';
import { RapierPhysicsProvider } from './3d/physics/RapierPhysicsContext';
import { PhysicsSpacePlayground } from './3d/physics/PhysicsProps';
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
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: [38, 42, 38], fov: 30, far: 1000 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
          // Technical specifications:
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#070b14']} />
          <fog attach="fog" args={['#070b14', 90, 360]} />

          {/* ==========================================================
              ILUMINAÇÃO E SOMBRAS DE ESTÚDIO SOLAR
             ========================================================== */}
          {/* Luz Ambiente / HemisphereLight suave (céu azulado claro, chão quente) */}
          <hemisphereLight args={['#e0f2fe', '#d97706', 0.6]} />

          {/* Luz Direcional Solar de Estúdio com mapa de sombras 2048x2048 */}
          <directionalLight
            position={[35, 55, 30]}
            intensity={2.2}
            color="#fffdf5"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={5}
            shadow-camera-far={240}
            shadow-camera-left={-75}
            shadow-camera-right={75}
            shadow-camera-top={75}
            shadow-camera-bottom={-75}
            shadow-bias={-0.0001}
          />

          {/* Luz de preenchimento cósmica sutil */}
          <directionalLight position={[-30, 20, -30]} intensity={0.4} color="#38bdf8" />

          {/* Controlador de Câmera em Perspectiva Isométrica (FOV 30°) */}
          <CameraController
            gameMode={gameMode}
            vehiclePos={vehiclePos}
            vehicleRotation={vehicleRotation}
            cameraViewMode={cameraViewMode}
            selectedIslandId={selectedIslandId}
            islands={islands}
          />

          {/* ==========================================================
              MOTOR DE FÍSICA RAPIER 3D (SISTEMA SOLAR CELESTE)
             ========================================================== */}
          <RapierPhysicsProvider gravity={[0, 0, 0]}>
            {/* Asteroides e Balizas Espaciais Interativas com Rapier */}
            <PhysicsSpacePlayground />

            {/* Ilhas Planetárias Flutuantes com Colisores Estáticos */}
            <Islands
              islands={islands}
              visitedIslands={visitedIslands}
              onSelectIsland={onSelectIsland}
              orbitActive={gameMode === 'landing'}
              vehiclePos={vehiclePos}
              isModalOpen={isModalOpen}
            />

            {/* Nave Espacial com Corpo Rígido Dinâmico e Colisor Primitivo */}
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

            {/* Sol Central, Órbitas Planetárias em Profundidade e Cristais */}
            <OrbitRingsAndCollectibles
              islands={islands}
              crystals={crystals}
              vehiclePos={vehiclePos}
              onCollectCrystal={onCollectCrystal}
            />
          </RapierPhysicsProvider>
        </Suspense>
      </Canvas>
    </div>
  );
};
