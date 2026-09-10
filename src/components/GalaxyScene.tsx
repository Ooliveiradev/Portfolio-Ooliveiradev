import React, { Suspense, useRef, useEffect } from 'react';
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
import { VehicleThrusterTrails } from './3d/VehicleThrusterTrails';
import { PostProcessingPipeline } from './3d/postprocessing/PostProcessingPipeline';
import { GoldenSecretAsteroid } from './3d/secrets/GoldenSecretAsteroid';
import { CosmicRubberDuck } from './3d/secrets/CosmicRubberDuck';
import { SecretVoidIsland } from './3d/secrets/SecretVoidIsland';
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
  onDiscoverSecret?: (type: 'asteroid' | 'void-island' | 'duck') => void;
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
  onDiscoverSecret,
}) => {
  // Shared ref for 60/120 FPS camera follow and collision checks without triggering React DOM re-renders
  const sharedVehiclePos = useRef<THREE.Vector3>(new THREE.Vector3(...vehiclePos));

  // When returning to landing screen, restore shared coordinates to origin so parallax and dust remain centered
  useEffect(() => {
    if (gameMode === 'landing') {
      sharedVehiclePos.current.set(0, 1.0, 16);
    }
  }, [gameMode]);

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
            // Previne o loop contínuo de aviso de depreciação do Three.js r185
            // mantendo a renderização suave com PCFSoftShadowMap sem poluir o console
            let configuredType: THREE.ShadowMapType = THREE.PCFSoftShadowMap;
            Object.defineProperty(gl.shadowMap, 'type', {
              get: () => THREE.PCFShadowMap,
              set: (val: THREE.ShadowMapType) => {
                configuredType = val;
              },
              configurable: true,
              enumerable: true,
            });
          }
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
          const maxDpr = graphicsQuality === 'low' ? 1 : graphicsQuality === 'high' ? 2 : 1.5;
          gl.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#070b14']} />
          <fog attach="fog" args={['#070b14', 50, 210]} />

          {/* ==========================================================
              ILUMINAÇÃO DE ESTÚDIO CÓSMICO (PADRÃO BRUNO SIMON)
              Key Light (Sol) + Cool Fill (Nebulosa) + Rim/Kicker (Bordas)
             ========================================================== */}
          {/* Luz Ambiente / HemisphereLight suave (céu azulado claro, base cósmica índigo profundo) */}
          <hemisphereLight
            args={['#f0fdf4', '#0f172a', graphicsQuality === 'low' ? 0.9 : 0.75]}
          />

          {/* 1. LUZ PRINCIPAL SOLAR (KEY LIGHT) */}
          <directionalLight
            position={[40, 60, 32]}
            intensity={2.6}
            color="#fffdf5"
            castShadow={graphicsQuality !== 'low'}
            shadow-mapSize-width={graphicsQuality === 'high' ? 2048 : 1024}
            shadow-mapSize-height={graphicsQuality === 'high' ? 2048 : 1024}
            shadow-camera-near={8}
            shadow-camera-far={260}
            shadow-camera-left={-85}
            shadow-camera-right={85}
            shadow-camera-top={85}
            shadow-camera-bottom={-85}
            shadow-bias={-0.00008}
            shadow-normalBias={0.03}
          />

          {/* 2. LUZ DE PREENCHIMENTO CÓSMICA (COOL NEBULA FILL LIGHT) */}
          <directionalLight
            position={[-45, 28, -40]}
            intensity={0.7}
            color="#38bdf8"
          />

          {/* 3. LUZ DE BORDA ESTELAR (RIM / KICKER LIGHT) - Realce das facetas chanfradas */}
          <directionalLight
            position={[-25, -12, 45]}
            intensity={0.45}
            color="#a78bfa"
          />

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
              gameMode={gameMode}
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

            {/* Trilhas e Fitas de Plasma Luminescente da Nave (Skidmarks Cósmicos) */}
            {gameMode !== 'landing' && (
              <VehicleThrusterTrails
                sharedVehiclePos={sharedVehiclePos}
                graphicsQuality={graphicsQuality}
              />
            )}

            {/* Gerenciador de Explosões Low-Poly estilo Bruno Simon */}
            <LowPolyExplosions graphicsQuality={graphicsQuality} />

            {/* Regiões Secretas e Easter Eggs Cósmicos */}
            <GoldenSecretAsteroid
              sharedVehiclePos={sharedVehiclePos}
              onDiscover={() => onDiscoverSecret?.('asteroid')}
            />
            <CosmicRubberDuck
              sharedVehiclePos={sharedVehiclePos}
              onDiscover={() => onDiscoverSecret?.('duck')}
            />
            <SecretVoidIsland
              sharedVehiclePos={sharedVehiclePos}
              onEnterSecretIsland={() => onDiscoverSecret?.('void-island')}
            />

            {/* Pipeline de Pós-Processamento Cinematográfico: Unreal Bloom & Aberração Cromática */}
            <PostProcessingPipeline graphicsQuality={graphicsQuality} />
          </RapierPhysicsProvider>
        </Suspense>
      </Canvas>
    </div>
  );
};
