import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { IslandConfig, IslandId } from '../../types';
import { sounds } from '../../audio/soundManager';
import { useRapier } from './physics/RapierPhysicsContext';
import { getIslandLivePosition } from '../../utils/celestialCoords';
import { EducationIsland } from './islands/EducationIsland';
import { SkillsIsland } from './islands/SkillsIsland';
import { ProjectsIsland } from './islands/ProjectsIsland';
import { ExperienceIsland } from './islands/ExperienceIsland';
import { AboutIsland } from './islands/AboutIsland';
import { IslandLife } from './islands/IslandLife';

interface IslandsProps {
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  onSelectIsland: (id: IslandId) => void;
  orbitActive: boolean;
  sharedVehiclePos?: React.RefObject<THREE.Vector3>;
  isModalOpen: boolean;
}

interface ThematicIslandProps {
  config: IslandConfig;
  isVisited: boolean;
  onSelect: (id: IslandId) => void;
  orbitActive: boolean;
  sharedVehiclePos?: React.RefObject<THREE.Vector3>;
  isModalOpen: boolean;
}

const ISLAND_SCALES: Record<string, [number, number, number]> = {
  projects: [1.14, 1.0, 1.14],    // Wide industrial shipyard platform
  experience: [1.06, 1.0, 1.06],  // Metropolitan corporate district
  skills: [1.10, 1.0, 1.10],      // Tech motherboard mainframe
  education: [1.0, 1.0, 1.0],     // Terraced academic knolls
  about: [0.92, 1.0, 0.92],       // Intimate developer workstation
};

const ThematicIslandComponent: React.FC<ThematicIslandProps> = ({
  config,
  isVisited,
  onSelect,
  orbitActive,
  sharedVehiclePos,
  isModalOpen,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const isNearRef = useRef(false);
  const colliderPosition = useRef({ x: 0, y: 0, z: 0 });
  const lastDistCheck = useRef(0);
  const { rapier, world, isReady } = useRapier();
  const rigidBodyRef = useRef<RAPIER.RigidBody | null>(null);

  const baseScale = ISLAND_SCALES[config.id] || [1, 1, 1];
  const currentScale: [number, number, number] = hovered
    ? [baseScale[0] * 1.03, baseScale[1] * 1.03, baseScale[2] * 1.03]
    : baseScale;

  // Initialize Kinematic Rapier Cylinder Collider calibrated to island scale
  useEffect(() => {
    if (!isReady || !world || !rapier) return;

    const initialPos = getIslandLivePosition(config);
    const bodyDesc = rapier.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(initialPos[0], initialPos[1] - 0.4, initialPos[2]);

    const body = world.createRigidBody(bodyDesc);
    rigidBodyRef.current = body;

    const islandColliderRadius = 6.0 * baseScale[0];
    const colliderDesc = rapier.ColliderDesc.cylinder(0.55, islandColliderRadius)
      .setFriction(0.8)
      .setRestitution(0.1);

    world.createCollider(colliderDesc, body);

    return () => {
      if (world && body) {
        world.removeRigidBody(body);
        rigidBodyRef.current = null;
      }
    };
  }, [isReady]);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Retrieve mathematical synchronized real-time position
    const [x, baseY, z] = getIslandLivePosition(config);
    const y =
      baseY +
      (hovered ? 0.5 : Math.sin(state.clock.elapsedTime * 1.5 + config.angleOffset) * 0.18);

    groupRef.current.position.set(x, y, z);

    // Update Kinematic Rapier body position
    if (rigidBodyRef.current) {
      const translation = colliderPosition.current;
      translation.x = x;
      translation.y = baseY - 0.4;
      translation.z = z;
      rigidBodyRef.current.setNextKinematicTranslation(translation);
    }

    // Throttle distance check to every 4th frame to minimize CPU math
    if (state.clock.elapsedTime - lastDistCheck.current > 0.08) {
      lastDistCheck.current = state.clock.elapsedTime;
      const vx = sharedVehiclePos?.current?.x ?? 0;
      const vz = sharedVehiclePos?.current?.z ?? 0;
      const dx = vx - x;
      const dz = vz - z;
      const near = dx * dx + dz * dz < 25 * 25;
      if (near !== isNearRef.current) {
        isNearRef.current = near;
        setIsNear(near);
      }
    }
  });

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    sounds.playClick();
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playIslandEnter();
    onSelect(config.id);
  };

  const showCard = (isNear || hovered) && !orbitActive && !isModalOpen;

  return (
    <group ref={groupRef}>
      {/* Invisible Low-Poly Hit Proxy for Ultra-Fast Raycasting (1 check per island instead of 100s) */}
      <mesh
        position={[0, 1.5, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <cylinderGeometry args={[6.5, 6.5, 4.0, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Dynamic Scale pop on hover with customized island diorama scale */}
      <group scale={currentScale}>
        {config.id === 'education' && <EducationIsland isNear={isNear} />}
        {config.id === 'skills' && <SkillsIsland isNear={isNear} />}
        {config.id === 'projects' && <ProjectsIsland isNear={isNear} />}
        {config.id === 'experience' && <ExperienceIsland isNear={isNear} />}
        {config.id === 'about' && <AboutIsland isNear={isNear} />}

        {/* Autonomous Scout Drones, Telemetry Radar & Approach Runway Lights */}
        {config.id !== 'about' && config.id !== 'education' && config.id !== 'experience' && (
          <IslandLife
            islandId={config.id}
            themeColor={config.color}
            isNear={isNear}
          />
        )}
      </group>

      {/* ===================================================
          AURA & GRAVITY LEVITATION FIELD (BASE FLUTUANTE CÓSMICA)
         =================================================== */}
      <group position={[0, -2.8, 0]} scale={[baseScale[0], 1, baseScale[2]]}>
        {/* Anel de levitação primário com pulso suave */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5.2, 5.8, 36]} />
          <meshStandardMaterial
            color={config.color}
            roughness={0.42}
            metalness={0.12}
            transparent
            opacity={hovered ? 0.85 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Anel interno de energia gravitacional */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <ringGeometry args={[3.6, 3.9, 32]} />
          <meshStandardMaterial
            color={config.color}
            roughness={0.35}
            metalness={0.15}
            transparent
            opacity={hovered ? 0.7 : 0.25}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Fragmentos de rochas flutuantes suspensas no campo de gravidade (todas as 5 ilhas agora possuem quilha escultural exclusiva) */}
        {config.id !== 'projects' && config.id !== 'about' && config.id !== 'skills' && config.id !== 'education' && config.id !== 'experience' &&
          [
            [-3.4, -0.6, 2.2, 0.55],
            [3.2, -0.9, -2.0, 0.65],
            [1.8, -1.2, 3.1, 0.45],
            [-2.6, -1.0, -2.8, 0.5],
          ].map(([rx, ry, rz, s], idx) => (
            <mesh
              key={idx}
              position={[rx, ry, rz]}
              scale={[s, s * 1.2, s]}
              rotation={[idx * 0.7, idx * 1.2, idx * 0.4]}
              castShadow
            >
              <dodecahedronGeometry args={[0.8, 0]} />
              <meshStandardMaterial
                color="#334155"
                roughness={0.65}
                metalness={0.08}
                flatShading
              />
            </mesh>
          ))}
      </group>

      {/* ===================================================
          HELIPORTO TÁTIL PROEMINENTE DE APROXIMAÇÃO & POUSO
          100% Aparente, Elevado e Visível em Todas as Ilhas
         =================================================== */}
      <group position={[0, 0.22, 3.5]}>
        {/* Rampa chanfrada de conexão da praça ao heliponto */}
        <mesh position={[0, -0.05, -1.8]} rotation={[0.1, 0, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.16, 1.0]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.45}
            metalness={0.2}
          />
        </mesh>

        {/* Pedestal chanfrado octogonal reforçado */}
        <mesh receiveShadow castShadow position={[0, -0.04, 0]}>
          <cylinderGeometry args={[2.1, 2.25, 0.20, 8]} />
          <meshStandardMaterial
            color="#0b0f19"
            roughness={0.36}
            metalness={0.28}
            flatShading
          />
        </mesh>

        {/* Faixa perimetral de aviso (Caution Strip) amarela/preta */}
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1.82, 2.05, 32]} />
          <meshStandardMaterial
            color="#facc15"
            roughness={0.35}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Piso principal do heliponto em asfalto texturizado */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[1.8, 1.8, 0.04, 32]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            metalness={0.12}
          />
        </mesh>

        {/* Anel de balizamento neon perimetral com cor da ilha */}
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.52, 1.66, 32]} />
          <meshStandardMaterial
            color={config.color}
            emissive={config.color}
            emissiveIntensity={hovered ? 1.6 : 0.8}
            roughness={0.3}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Círculo guia intermediário */}
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 0.98, 28]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.35}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Marcador [F] monumental em relevo 3D de laca branca (Foguetiponto) */}
        <group position={[0, 0.13, 0]}>
          {/* Coluna vertical esquerda do F */}
          <mesh position={[-0.32, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.22, 0.06, 1.25]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.12} />
          </mesh>
          {/* Braço horizontal superior do F */}
          <mesh position={[0.105, 0, -0.515]} castShadow receiveShadow>
            <boxGeometry args={[0.63, 0.06, 0.22]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.12} />
          </mesh>
          {/* Braço horizontal central do F */}
          <mesh position={[0.035, 0, -0.05]} castShadow receiveShadow>
            <boxGeometry args={[0.49, 0.06, 0.20]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.12} />
          </mesh>
        </group>

        {/* 8 Balizadores luminosos perimetrais */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((bIdx) => {
          const bAngle = (bIdx * Math.PI) / 4;
          const bx = Math.cos(bAngle) * 1.92;
          const bz = Math.sin(bAngle) * 1.92;
          return (
            <group key={`heli-light-${bIdx}`} position={[bx, 0.09, bz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.06, 0.08, 0.16, 8]} />
                <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.5} />
              </mesh>
              <mesh position={[0, 0.1, 0]}>
                <sphereGeometry args={[0.065, 8, 8]} />
                <meshStandardMaterial
                  color={config.color}
                  emissive={config.color}
                  emissiveIntensity={hovered ? 2.2 : 1.2}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        })}

      </group>

      {/* ===================================================
          VISITED BADGE ("CERTINHO") ABOVE ISLAND
         =================================================== */}
      {isVisited && !isModalOpen && (
        <group position={[0, 4.6, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[0.5, 0.8, 32]} />
            <meshStandardMaterial
              color="#10b981"
              roughness={0.85}
              metalness={0.05}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          <Html
            position={[0, 0, 0]}
            center
            distanceFactor={38}
            className="pointer-events-none select-none transition-transform duration-300"
            style={{ zIndex: 12 }}
          >
            <div className="flex flex-col items-center gap-1 group">
              <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-emerald-400 text-white shadow-[0_0_18px_rgba(16,185,129,0.85)] border-2 border-white ring-4 ring-emerald-500/25">
                <svg
                  className="w-5 h-5 drop-shadow"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="3.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-950/90 text-emerald-400 border border-emerald-500/50 backdrop-blur-md shadow-md uppercase whitespace-nowrap">
                Visitada
              </span>
            </div>
          </Html>
        </group>
      )}

      {/* ===================================================
          PROXIMITY-BASED DISCOVERY CARD / LABEL
         =================================================== */}
      {showCard && (
        <Html
          position={[0, 5.2, 0]}
          center
          distanceFactor={38}
          className="pointer-events-none select-none transition-all duration-300"
          style={{ zIndex: 10 }}
        >
          <div
            className={`flex flex-col items-center px-4 py-2.5 rounded-2xl backdrop-blur-md border shadow-2xl transition-all duration-300 ${
              hovered
                ? 'scale-110 bg-slate-900/95 border-white/40 ring-4 ring-white/10'
                : 'scale-100 bg-slate-950/85 border-slate-700/80'
            }`}
            style={{ minWidth: '190px' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-[12px] font-mono font-bold tracking-wider uppercase text-slate-200">
                {config.name}
              </span>
              {isVisited && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                  ✓ VISITADO
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
              {config.tagline}
            </span>
            <div
              className="mt-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10"
              style={{ color: config.color }}
            >
              CLIQUE PARA POUSAR
            </div>
          </div>
        </Html>
      )}

      {/* One permanent fill per island. Decorative glows use emissive materials so
          interactions and quality changes never change the scene's light count. */}
      <pointLight
        position={[0, 3.5, 0]}
        color={config.color}
        intensity={hovered ? 3.6 : (orbitActive ? 1.8 : (isNear ? 2.5 : 1.2))}
        distance={18}
      />
    </group>
  );
};

const ThematicIsland = React.memo(ThematicIslandComponent);

const IslandsComponent: React.FC<IslandsProps> = ({
  islands,
  visitedIslands,
  onSelectIsland,
  orbitActive,
  sharedVehiclePos,
  isModalOpen,
}) => {
  return (
    <group>
      {islands.map((island) => (
        <ThematicIsland
          key={island.id}
          config={island}
          isVisited={visitedIslands.includes(island.id)}
          onSelect={onSelectIsland}
          orbitActive={orbitActive}
          sharedVehiclePos={sharedVehiclePos}
          isModalOpen={isModalOpen}
        />
      ))}
    </group>
  );
};

export const Islands = React.memo(IslandsComponent);
