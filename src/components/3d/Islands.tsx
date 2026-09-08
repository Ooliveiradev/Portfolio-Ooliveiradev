import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { IslandConfig, IslandId } from '../../types';
import { sounds } from '../../audio/soundManager';
import { useRapierBody } from './physics/useRapierBody';
import { EducationIsland } from './islands/EducationIsland';
import { SkillsIsland } from './islands/SkillsIsland';
import { ProjectsIsland } from './islands/ProjectsIsland';
import { ExperienceIsland } from './islands/ExperienceIsland';
import { AboutIsland } from './islands/AboutIsland';

interface IslandsProps {
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  onSelectIsland: (id: IslandId) => void;
  orbitActive: boolean;
  vehiclePos: [number, number, number];
  isModalOpen: boolean;
}

export const Islands: React.FC<IslandsProps> = ({
  islands,
  visitedIslands,
  onSelectIsland,
  orbitActive,
  vehiclePos,
  isModalOpen,
}) => {
  return (
    <group>
      {islands.map((island) => (
        <ThematicIsland
          key={island.id}
          config={island}
          isVisited={visitedIslands.includes(island.id)}
          onSelect={() => onSelectIsland(island.id)}
          orbitActive={orbitActive}
          vehiclePos={vehiclePos}
          isModalOpen={isModalOpen}
        />
      ))}
    </group>
  );
};

interface ThematicIslandProps {
  config: IslandConfig;
  isVisited: boolean;
  onSelect: () => void;
  orbitActive: boolean;
  vehiclePos: [number, number, number];
  isModalOpen: boolean;
}

const ThematicIsland: React.FC<ThematicIslandProps> = ({
  config,
  isVisited,
  onSelect,
  orbitActive,
  vehiclePos,
  isModalOpen,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const orbitAngle = useRef(config.angleOffset);

  // Compute fixed station coordinates for Rapier static collider
  const defaultPos: [number, number, number] = useMemo(() => [
    Math.cos(config.angleOffset) * config.orbitRadius,
    config.elevation,
    Math.sin(config.angleOffset) * config.orbitRadius,
  ], [config.angleOffset, config.orbitRadius, config.elevation]);

  // Associate each island platform with a static Rapier cylinder collider
  useRapierBody<THREE.Group>({
    type: 'fixed',
    position: [defaultPos[0], defaultPos[1] - 0.4, defaultPos[2]],
    shape: {
      type: 'cylinder',
      halfHeight: 1.0,
      radius: 6.2,
    },
    friction: 0.8,
    restitution: 0.1,
  });

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (orbitActive) {
      orbitAngle.current += config.orbitSpeed * delta * 0.35;
    }

    const x = Math.cos(orbitAngle.current) * config.orbitRadius;
    const z = Math.sin(orbitAngle.current) * config.orbitRadius;
    const y =
      config.elevation +
      (hovered ? 0.5 : Math.sin(Date.now() * 0.0015 + config.angleOffset) * 0.18);

    groupRef.current.position.set(x, y, z);

    const dist = Math.hypot(vehiclePos[0] - x, vehiclePos[2] - z);
    setIsNear(dist < 16.0);
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
    onSelect();
  };

  const showCard = (isNear || hovered) && !orbitActive && !isModalOpen;

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {/* Dynamic Scale pop on hover */}
      <group scale={hovered ? [1.04, 1.04, 1.04] : [1, 1, 1]}>
        {/* Render the bespoke themed 3D island model */}
        {config.id === 'education' && <EducationIsland />}
        {config.id === 'skills' && <SkillsIsland />}
        {config.id === 'projects' && <ProjectsIsland />}
        {config.id === 'experience' && <ExperienceIsland />}
        {config.id === 'about' && <AboutIsland />}
      </group>

      {/* ===================================================
          AURA & GRAVITY RING (Posicionado abaixo da base da ilha flutuante)
         =================================================== */}
      <mesh position={[0, -2.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.8, 32]} />
        <meshStandardMaterial
          color={config.color}
          roughness={0.85}
          metalness={0.05}
          transparent
          opacity={hovered ? 0.8 : 0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Landing Target Helipad Pad */}
      <group position={[0, 0.05, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 1.25, 24]} />
        <meshStandardMaterial
          color={config.color}
          roughness={0.85}
          metalness={0.05}
          transparent
          opacity={hovered ? 0.95 : 0.65}
        />
        {/* 'H' mark with matte collectible plastic */}
        <mesh position={[-0.35, 0, 0]}>
          <planeGeometry args={[0.12, 0.8]} />
          <meshStandardMaterial color={config.color} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0.35, 0, 0]}>
          <planeGeometry args={[0.12, 0.8]} />
          <meshStandardMaterial color={config.color} roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.7, 0.12]} />
          <meshStandardMaterial color={config.color} roughness={0.85} metalness={0.05} />
        </mesh>
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

      {/* Point Light illuminating this island in its theme color */}
      <pointLight
        position={[0, 3.5, 0]}
        color={config.color}
        intensity={hovered ? 3.8 : 2.2}
        distance={15}
      />
    </group>
  );
};
