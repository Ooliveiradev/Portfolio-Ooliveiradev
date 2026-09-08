import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  Settings,
  FolderGit2,
  Briefcase,
  Cpu,
  GraduationCap,
  UserCheck,
  Zap,
  Home
} from 'lucide-react';
import { IslandConfig, IslandId, UserStats } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';
import { MiniMap } from './MiniMap';

interface HUDProps {
  stats: UserStats;
  islands: IslandConfig[];
  selectedIslandId: IslandId | null;
  onSelectIsland: (id: IslandId) => void;
  onResetVehicle: () => void;
  onReturnToLanding: () => void;
  onOpenSettings?: () => void;
  recentXpGained: number | null;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  islands,
  selectedIslandId,
  onSelectIsland,
  onResetVehicle,
  onReturnToLanding,
  onOpenSettings,
  recentXpGained,
  vehiclePos,
  vehicleRotation,
}) => {
  // Compute level from XP
  const levelTitle =
    stats.xp < 300
      ? 'Cadete Estelar'
      : stats.xp < 700
      ? 'Navegador Cósmico'
      : stats.xp < 1200
      ? 'Engenheiro Galáctico'
      : 'Comandante Supremo';

  const nextLevelThreshold =
    stats.xp < 300 ? 300 : stats.xp < 700 ? 700 : stats.xp < 1200 ? 1200 : 2000;
  const prevLevelThreshold =
    stats.xp < 300 ? 0 : stats.xp < 700 ? 300 : stats.xp < 1200 ? 700 : 1200;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((stats.xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100)
  );

  const getIslandIcon = (id: IslandId) => {
    switch (id) {
      case 'projects':
        return <FolderGit2 className="w-4 h-4" />;
      case 'experience':
        return <Briefcase className="w-4 h-4" />;
      case 'skills':
        return <Cpu className="w-4 h-4" />;
      case 'education':
        return <GraduationCap className="w-4 h-4" />;
      case 'about':
        return <UserCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full max-w-7xl mx-auto pointer-events-auto gap-3">
        {/* Profile & XP Status Widget */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-800/90 p-2 sm:p-2.5 rounded-2xl shadow-xl">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-fun font-bold text-base shadow-md">
              DR
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900 text-[8px] font-bold text-black">
              ✓
            </span>
          </div>

          <div className="flex flex-col min-w-[130px] sm:min-w-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide truncate">
                {PERSONAL_INFO.name}
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-semibold flex items-center gap-0.5">
                <Zap className="w-3 h-3 fill-sky-400" />
                {stats.xp} XP
              </span>
            </div>

            {/* Level Label */}
            <span className="text-[10px] text-slate-400 font-mono -mt-0.5">
              Lv.{stats.level} • {levelTitle}
            </span>

            {/* XP Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Floating XP Notification */}
        <AnimatePresence>
          {recentXpGained !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-fun font-bold text-xs shadow-xl flex items-center gap-1.5 border border-yellow-200"
            >
              <Zap className="w-3.5 h-3.5 fill-black" />
              <span>+{recentXpGained} XP!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimalist Top Right Toolbar: Menu Inicial e Configurações */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            {/* Return to Landing Screen */}
            <button
              onClick={() => {
                sounds.playClick();
                onReturnToLanding();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/70 backdrop-blur-md transition-all cursor-pointer shadow-md"
              title="Menu Inicial / Tela de Entrada"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Central Unified Settings & System Menu Button */}
            {onOpenSettings && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenSettings();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-sky-300 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer shadow-md hover:border-sky-500/50 hover:shadow-sky-500/10 font-mono text-xs font-bold"
                title="Configurações, Câmera, Conquistas & Ranking (ESC)"
              >
                <Settings className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
          </div>

          {/* Tactical Radar MiniMap */}
          <MiniMap
            islands={islands}
            visitedIslands={stats.visitedIslands}
            selectedIslandId={selectedIslandId}
            vehiclePos={vehiclePos}
            vehicleRotation={vehicleRotation}
            onSelectIsland={onSelectIsland}
          />
        </div>
      </div>

      {/* Bottom Island Quick Dock & Utility Controls */}
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto pointer-events-auto gap-2">
        {/* Island Dock */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl bg-slate-950/85 backdrop-blur-lg border border-slate-800 shadow-2xl">
          <span className="hidden md:inline text-[11px] font-mono text-slate-400 px-2 font-semibold">
            VIAJAR:
          </span>
          {islands.map((island) => {
            const isSelected = selectedIslandId === island.id;
            const isVisited = stats.visitedIslands.includes(island.id);

            return (
              <button
                key={island.id}
                onClick={() => {
                  sounds.playClick();
                  onSelectIsland(island.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
              >
                <span style={{ color: isSelected ? '#ffffff' : island.color }}>
                  {getIslandIcon(island.id)}
                </span>
                <span className="font-fun font-semibold">{island.name}</span>
                {isVisited && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 py-0.2 rounded-full font-bold ml-0.5">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Lower helper row (desktop controls note + reset rover position) */}
        <div className="hidden sm:flex items-center justify-between w-full px-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>🎮 <strong>W, A, S, D / Setas</strong>: Pilotar</span>
            <span>🚀 <strong>Espaço</strong>: Turbo</span>
            <span>🖱️ <strong>Clique</strong> na ilha para pousar</span>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onResetVehicle();
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Recentralizar Rover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
