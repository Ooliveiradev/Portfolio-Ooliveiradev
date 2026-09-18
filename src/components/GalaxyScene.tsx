import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SpaceVehicle } from './3d/SpaceVehicle';
import { Islands } from './3d/Islands';
import { OrbitRingsAndCollectibles } from './3d/OrbitRingsAndCollectibles';
import { CameraController } from './3d/CameraController';
import { RapierPhysicsProvider, useRapier } from './3d/physics/RapierPhysicsContext';
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
import { CosmicWhispers } from './3d/whispers/CosmicWhispers';
import { CosmicBoundary } from './3d/CosmicBoundary';
import { IslandConfig, IslandId, CrystalCollectible, GraphicsQuality, GameMode, CosmicWhisper } from '../types';
import { getClamped1080pDpr } from '../utils/resolutionLimiter';
import type { VehicleInput } from '../utils/gameInput';
import { SceneDiagnostics } from './3d/SceneDiagnostics';
import { prewarmQualityVariants } from '../utils/prewarmScene';
import { setCelestialPaused } from '../utils/celestialCoords';

interface GalaxySceneProps {
  gameMode: GameMode;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  targetVehiclePos: [number, number, number] | null;
  onVehiclePosChange: (pos: [number, number, number]) => void;
  onVehicleRotationChange?: (rot: number) => void;
  onSelectIsland: (id: IslandId) => void;
  selectedIslandId: IslandId | null;
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  crystals: CrystalCollectible[];
  onCollectCrystal: (id: number) => void;
  virtualInputRef: React.MutableRefObject<VehicleInput>;
  isModalOpen: boolean;
  isPreloading: boolean;
  onClearTargetPosition?: () => void;
  graphicsQuality?: GraphicsQuality;
  isRacing?: boolean;
  currentCheckpoint?: number;
  onReachCheckpoint?: (index: number) => void;
  onNearStartGate?: (isNear: boolean) => void;
  onRecoverCargo?: (id: string) => void;
  onCinematicComplete?: (finishedMode: GameMode) => void;
  onDiscoverSecret?: (type: 'asteroid' | 'void-island' | 'duck') => void;
  whispers?: CosmicWhisper[];
  onInspectWhisper?: (whisper: CosmicWhisper) => void;
  onSceneReady?: () => void;
  onBoundaryReturn?: () => void;
}

/**
 * ScenePrewarmer:
 * Compila os materiais uma vez, após a cena física estar pronta, antes de
 * liberar a entrada no jogo.
 */
function ScenePrewarmer({ onSceneReady, renderReady }: {
  onSceneReady?: () => void;
  renderReady: React.MutableRefObject<boolean>;
}) {
  const { gl, scene, camera, invalidate } = useThree();
  const { isReady } = useRapier();
  const compilation = useRef<Promise<unknown> | null>(null);
  const onReadyRef = useRef(onSceneReady);
  onReadyRef.current = onSceneReady;

  useEffect(() => {
    if (!isReady) return;
    let active = true;

    // compileAsync also visits invisible meshes. Drei's Preload would compile the
    // same scene synchronously and render it six more times with a cube camera.
    if (!compilation.current) {
      const keyLight = scene.getObjectByName('solar-key-light') as THREE.DirectionalLight;
      compilation.current = prewarmQualityVariants(gl, scene, camera, keyLight).catch((error: unknown) => {
        console.warn('GPU pipeline prewarm warning:', error);
      });
    }
    compilation.current.then(() => {
      if (active) {
        renderReady.current = true;
        invalidate();
        onReadyRef.current?.();
      }
    });
    return () => { active = false; };
  }, [gl, scene, camera, isReady, renderReady, invalidate]);

  return null;
}

/** Keep the light outside the ship's hidden/blinking group. Changing the number
 * of visible lights invalidates every lit material's shader program. */
function VehicleFillLight({ position, active }: {
  position: React.RefObject<THREE.Vector3>;
  active: boolean;
}) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (light.current && position.current) {
      light.current.position.copy(position.current);
      light.current.position.y += 1;
    }
  });
  return <pointLight ref={light} color="#bae6fd" intensity={active ? 2.2 : 0} distance={14} />;
}

const GalaxySceneComponent: React.FC<GalaxySceneProps> = ({
  gameMode,
  vehiclePos,
  vehicleRotation,
  targetVehiclePos,
  onVehiclePosChange,
  onVehicleRotationChange,
  onSelectIsland,
  selectedIslandId,
  islands,
  visitedIslands,
  crystals,
  onCollectCrystal,
  virtualInputRef,
  isModalOpen,
  isPreloading,
  onClearTargetPosition,
  graphicsQuality = 'mid',
  isRacing = false,
  currentCheckpoint = 0,
  onReachCheckpoint,
  onNearStartGate,
  onRecoverCargo,
  onCinematicComplete,
  onDiscoverSecret,
  whispers = [],
  onInspectWhisper,
  onSceneReady,
  onBoundaryReturn,
}) => {
  // Shared ref for 60/120 FPS camera follow and collision checks without triggering React DOM re-renders
  const sharedVehiclePos = useRef<THREE.Vector3>(new THREE.Vector3(...vehiclePos));
  const sharedVehicleRotation = useRef(vehicleRotation);
  const renderReady = useRef(false);

  // When returning to landing screen, restore shared coordinates to origin so parallax and dust remain centered
  useEffect(() => {
    if (gameMode === 'landing') {
      sharedVehiclePos.current.set(0, 1.0, 16);
    }
  }, [gameMode]);

  // Trava a resolução física da GPU em no máximo 1080p (Full HD: 1920x1080)
  const [clampedDpr, setClampedDpr] = useState<number>(() => getClamped1080pDpr(graphicsQuality));
  const [isPageVisible, setIsPageVisible] = useState(() => !document.hidden);
  // Keep transitions/prewarm running; a settled modal can reuse the last frame.
  const scenePaused = isModalOpen && !isPreloading && !isRacing &&
    (gameMode === 'landing' || gameMode === 'driving' || gameMode === 'inspecting');

  useEffect(() => {
    setCelestialPaused(scenePaused || !isPageVisible);
    return () => setCelestialPaused(false);
  }, [scenePaused, isPageVisible]);

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    let resizeFrame = 0;
    const handleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => setClampedDpr(getClamped1080pDpr(graphicsQuality)));
    };
    setClampedDpr(getClamped1080pDpr(graphicsQuality));
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [graphicsQuality]);

  return (
    <div className="w-full h-full absolute inset-0 select-none overflow-hidden bg-[#070b14]">
      <Canvas
        frameloop={!isPageVisible ? 'never' : scenePaused ? 'demand' : 'always'}
        shadows={{ enabled: graphicsQuality !== 'low', type: THREE.PCFShadowMap }}
        camera={{ position: [38, 42, 38], fov: 30, far: 1000 }}
        dpr={clampedDpr}
        gl={{
          // The scene renders into the composer's targets on mid/high. Native
          // canvas MSAA does not antialias those targets and only adds overhead.
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <Suspense fallback={null}>
          <SceneDiagnostics />
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
            name="solar-key-light"
            // Three allocates shadow.map on creation; changing mapSize alone
            // leaves the previous GPU target alive. Replace only this light.
            key={graphicsQuality}
            position={[40, 60, 32]}
            intensity={2.6}
            color="#fffdf5"
            castShadow={graphicsQuality !== 'low'}
            shadow-mapSize-width={graphicsQuality === 'high' ? 1024 : 512}
            shadow-mapSize-height={graphicsQuality === 'high' ? 1024 : 512}
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

          <VehicleFillLight position={sharedVehiclePos} active={gameMode !== 'landing'} />

          {/* Controlador de Câmera em Perspectiva Isométrica (FOV 30°) */}
          <CameraController
            gameMode={gameMode}
            vehiclePos={vehiclePos}
            vehicleRotation={vehicleRotation}
            selectedIslandId={selectedIslandId}
            islands={islands}
            sharedVehiclePos={sharedVehiclePos}
            sharedVehicleRotation={sharedVehicleRotation}
          />

          {/* ==========================================================
              MOTOR DE FÍSICA RAPIER 3D (SISTEMA SOLAR CELESTE)
             ========================================================== */}
          <RapierPhysicsProvider gravity={[0, 0, 0]} paused={scenePaused}>
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
              sharedVehiclePos={sharedVehiclePos}
              isModalOpen={isModalOpen}
            />

            {/* Nave Espacial com Corpo Rígido Dinâmico e Colisor Primitivo (Pré-montada e persistente na GPU) */}
            <SpaceVehicle
              onBoundaryReturn={onBoundaryReturn}
              visible={gameMode !== 'landing'}
              position={vehiclePos}
              targetPosition={targetVehiclePos}
              onPositionChange={onVehiclePosChange}
              onRotationChange={onVehicleRotationChange}
              isDriving={gameMode === 'driving' && !isModalOpen}
              virtualInputRef={virtualInputRef}
              onClearTargetPosition={onClearTargetPosition}
              graphicsQuality={graphicsQuality}
              sharedVehiclePos={sharedVehiclePos}
              gameMode={gameMode}
              sharedVehicleRotation={sharedVehicleRotation}
              selectedIslandId={selectedIslandId}
              onCinematicComplete={onCinematicComplete}
            />

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
            <VehicleThrusterTrails
              sharedVehiclePos={sharedVehiclePos}
              graphicsQuality={graphicsQuality}
              visible={gameMode !== 'landing'}
            />

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

            {/* Rede Social Cósmica: Orbes Luminosos de Sussurros Estelares */}
            {whispers.length > 0 && (
              <CosmicWhispers
                whispers={whispers}
                sharedVehiclePos={sharedVehiclePos}
                onInspectWhisper={(w) => onInspectWhisper?.(w)}
              />
            )}

            <CosmicBoundary sharedVehiclePos={sharedVehiclePos} active={gameMode === 'driving' && !isModalOpen} />

            {/* Pipeline de Pós-Processamento Cinematográfico: Unreal Bloom & Aberração Cromática */}
            <PostProcessingPipeline
              graphicsQuality={graphicsQuality}
              renderReady={renderReady}
              prewarming={isPreloading}
            />

            {/* Pré-compilação e Aquecimento de Shaders GPU */}
            <ScenePrewarmer onSceneReady={onSceneReady} renderReady={renderReady} />
          </RapierPhysicsProvider>
        </Suspense>
      </Canvas>
    </div>
  );
};

// App publishes live vehicle telemetry outside React. Compare all remaining
// props so joystick, crystal flags and callbacks cannot silently become stale.
export const GalaxyScene = React.memo(GalaxySceneComponent);
