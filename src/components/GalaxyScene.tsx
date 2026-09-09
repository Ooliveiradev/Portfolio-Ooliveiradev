import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceVehicle } from './3d/SpaceVehicle';
import { Islands } from './3d/Islands';
import { OrbitRingsAndCollectibles } from './3d/OrbitRingsAndCollectibles';
import { CameraController } from './3d/CameraController';
import { RapierPhysicsProvider } from './3d/physics/RapierPhysicsContext';
import { PhysicsSpacePlayground } from './3d/physics/PhysicsProps';
import { LowPolyExplosions } from './3d/explosions/LowPolyExplosions';
import { CosmicDust } from './3d/CosmicDust';
import { ShootingStars } from './3d/ShootingStars';
import { CelestialHorizon } from './3d/CelestialHorizon';
import { SpeedRings } from './3d/SpeedRings';
import { IslandConfig, IslandId, CrystalCollectible, CameraViewMode, GraphicsQuality, GameMode } from '../types';

interface GalaxySceneProps {
  gameMode: GameMode;
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
  graphicsQuality?: GraphicsQuality;
  isRacing?: boolean;
  currentCheckpoint?: number;
  onReachCheckpoint?: (index: number) => void;
  onNearStartGate?: (isNear: boolean) => void;
  onRecoverCargo?: (id: string) => void;
  onCinematicComplete?: (finishedMode: GameMode) => void;
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
  graphicsQuality = 'mid',
  isRacing = false,
  currentCheckpoint = 0,
  onReachCheckpoint,
  onNearStartGate,
  onRecoverCargo,
  onCinematicComplete,
}) => {
  // Shared ref for 60/120 FPS camera follow and collision checks without triggering React DOM re-renders
  const sharedVehiclePos = useRef<THREE.Vector3>(new THREE.Vector3(...vehiclePos));

  const dprVal: number | [number, number] =
    graphicsQuality === 'low' ? 1 : graphicsQuality === 'high' ? [1, 2] : [1, 1.5];

  return (
    <div className="w-full h-full absolute inset-0 select-none overflow-hidden bg-[#070b14]">
      <Canvas
        key={graphicsQuality}
        shadows={graphicsQuality !== 'low' ? { type: THREE.PCFSoftShadowMap } : false}
        camera={{ position: [38, 42, 38], fov: 30, far: 1000 }}
        dpr={dprVal}
        gl={{
          antialias: graphicsQuality !== 'low',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = graphicsQuality !== 'low';
          if (graphicsQuality !== 'low') {
            gl.shadowMap.type = THREE.PCFSoftShadowMap;
          }
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          const maxDpr = graphicsQuality === 'low' ? 1 : graphicsQuality === 'high' ? 2 : 1.5;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#070b14']} />
          <fog attach="fog" args={['#070b14', 90, 360]} />

          {/* ==========================================================
              ILUMINAÇÃO E SOMBRAS DE ESTÚDIO SOLAR
             ========================================================== */}
          {/* Luz Ambiente / HemisphereLight suave (céu azulado claro, chão quente) */}
          <hemisphereLight args={['#e0f2fe', '#d97706', graphicsQuality === 'low' ? 0.8 : 0.6]} />

          {/* Luz Direcional Solar de Estúdio com mapa de sombras ajustado por perfil */}
          <directionalLight
            position={[35, 55, 30]}
            intensity={2.2}
            color="#fffdf5"
            castShadow={graphicsQuality !== 'low'}
            shadow-mapSize-width={graphicsQuality === 'high' ? 2048 : 1024}
            shadow-mapSize-height={graphicsQuality === 'high' ? 2048 : 1024}
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
            sharedVehiclePos={sharedVehiclePos}
          />

          {/* ==========================================================
              MOTOR DE FÍSICA RAPIER 3D (SISTEMA SOLAR CELESTE)
             ========================================================== */}
          <RapierPhysicsProvider gravity={[0, 0, 0]}>
            {/* Asteroides, Satélites e Caixas de Carga Interativas com Rapier */}
            <PhysicsSpacePlayground
              graphicsQuality={graphicsQuality}
              sharedVehiclePos={sharedVehiclePos}
              onRecoverCargo={onRecoverCargo}
            />

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
                graphicsQuality={graphicsQuality}
                sharedVehiclePos={sharedVehiclePos}
                gameMode={gameMode}
                selectedIslandId={selectedIslandId}
                onCinematicComplete={onCinematicComplete}
              />
            )}

            {/* Sol Central e Cristais */}
            <OrbitRingsAndCollectibles
              islands={islands}
              crystals={crystals}
              vehiclePos={vehiclePos}
              onCollectCrystal={onCollectCrystal}
              graphicsQuality={graphicsQuality}
              sharedVehiclePos={sharedVehiclePos}
            />

            {/* Poeira Estelar Cósmica Dinâmica (Sensação de Voo e Profundidade) */}
            <CosmicDust
              sharedVehiclePos={sharedVehiclePos}
              graphicsQuality={graphicsQuality}
            />

            {/* Estrelas Cadentes & Cometas Periódicos no Horizonte */}
            <ShootingStars graphicsQuality={graphicsQuality} />

            {/* Monumentos do Horizonte Cósmico (Buraco Negro & Planeta com Anéis) */}
            <CelestialHorizon
              graphicsQuality={graphicsQuality}
              sharedVehiclePos={sharedVehiclePos}
            />

            {/* Argolas de Turbo Espacial Interativas (Speed Booster Rings) */}
            <SpeedRings
              sharedVehiclePos={sharedVehiclePos}
              graphicsQuality={graphicsQuality}
              isRacing={isRacing}
              currentCheckpoint={currentCheckpoint}
              onReachCheckpoint={onReachCheckpoint}
              onNearStartGate={onNearStartGate}
            />

            {/* Gerenciador de Explosões Low-Poly estilo Bruno Simon */}
            <LowPolyExplosions graphicsQuality={graphicsQuality} />
          </RapierPhysicsProvider>
        </Suspense>
      </Canvas>
    </div>
  );
};
