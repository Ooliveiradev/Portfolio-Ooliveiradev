import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { IslandConfig, IslandId, UserStats, CrystalCollectible, CosmicWhisper } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';
import { MiniMap } from './MiniMap';

interface HUDProps {
  stats: UserStats;
  islands: IslandConfig[];
  selectedIslandId: IslandId | null;
  onSelectIsland: (id: IslandId) => void;
  onResetVehicle?: () => void;
  onReturnToLanding: () => void;
  onOpenSettings?: () => void;
  onOpenAchievements?: () => void;
  onAvatarClick?: () => void;
  onOpenDropWhisper?: () => void;
  onOpenWhispersList?: () => void;
  whispers?: CosmicWhisper[];
  presenceCount?: number;
  recentXpGained: number | null;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  crystals?: CrystalCollectible[];
  targetVehiclePos?: [number, number, number] | null;
  isRacing?: boolean;
  currentCheckpoint?: number;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  islands,
  selectedIslandId,
  onSelectIsland,
  onReturnToLanding,
  onOpenSettings,
  onOpenAchievements,
  onAvatarClick,
  onOpenDropWhisper,
  onOpenWhispersList,
  whispers = [],
  presenceCount = 4,
  recentXpGained,
  vehiclePos,
  vehicleRotation,
  crystals,
  targetVehiclePos,
  isRacing = false,
  currentCheckpoint = 0,
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

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="flex items-start justify-between w-full max-w-7xl mx-auto pointer-events-auto gap-3">
        {/* Profile & XP Status Widget */}
        <div className="flex items-center gap-3 bg-[#0c1017]/90 backdrop-blur-xl border border-slate-800/80 p-2 sm:p-2.5 rounded-2xl shadow-2xl">
          <div className="relative">
            <div
              onClick={() => {
                sounds.playClick();
                onAvatarClick?.();
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-md border border-sky-400/30 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Perfil de Danilo Ribeiro (Clique para surpresa!)"
            >
              DR
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-[#0c1017] text-[8px] font-bold text-black">
              ✓
            </span>
          </div>

          <div className="flex flex-col min-w-[130px] sm:min-w-[170px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-100 tracking-wide truncate">
                {PERSONAL_INFO.name}
              </span>
              <span className="text-[10px] font-mono text-sky-400 font-semibold flex items-center gap-0.5">
                <MaterialIcon name="bolt" fill className="text-sky-400" size={14} />
                {stats.xp} XP
              </span>
            </div>

            {/* Level Label */}
            <span className="text-[10px] text-slate-400 font-mono -mt-0.5">
              Lv.{stats.level} • {levelTitle}
            </span>

            {/* XP Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-sky-500 h-full rounded-full transition-all duration-500"
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
              className="px-3.5 py-1.5 rounded-full bg-[#0c1017]/95 border border-amber-400/40 text-amber-300 font-mono text-xs shadow-xl backdrop-blur-md flex items-center gap-1.5"
            >
              <MaterialIcon name="bolt" fill className="text-amber-400" size={15} />
              <span>+{recentXpGained} XP!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Presence Pill: Exploradores Online & Sinais Cósmicos */}
        {onOpenWhispersList && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenWhispersList();
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c1017]/90 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-xl text-xs font-mono text-cyan-300 shadow-xl cursor-pointer transition hover:scale-105"
            title="Rede Social Cósmica & Exploradores Online"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>{presenceCount} no setor</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 flex items-center gap-1">
              <MaterialIcon name="sensors" size={13} className="text-cyan-400" />
              {whispers.length} sinais
            </span>
          </button>
        )}

        {/* Minimalist Top Right Toolbar: Menu Inicial e Configurações */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            {/* Transmit Cosmic Whisper Button */}
            {onOpenDropWhisper && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenDropWhisper();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-cyan-300 hover:text-cyan-200 border border-slate-800/80 hover:border-cyan-500/40 backdrop-blur-xl transition-all cursor-pointer shadow-lg font-mono text-xs font-semibold"
                title="Transmitir Mensagem Cósmica no Espaço (T)"
              >
                <MaterialIcon name="sensors" className="text-cyan-400 animate-pulse" size={18} />
                <span className="hidden sm:inline">Transmitir</span>
                <kbd className="hidden md:inline px-1 py-0.2 bg-cyan-950/80 rounded border border-cyan-500/30 text-[9px] text-cyan-300">
                  T
                </kbd>
              </button>
            )}

            {/* Return to Landing Screen */}
            <button
              onClick={() => {
                sounds.playClick();
                onReturnToLanding();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80 hover:border-sky-500/40 backdrop-blur-xl transition-all cursor-pointer shadow-lg"
              title="Menu Inicial / Tela de Entrada"
            >
              <MaterialIcon name="home" className="text-sky-400" size={18} />
            </button>

            {/* Central Unified Settings & System Menu Button */}
            {onOpenSettings && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenSettings();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80 hover:border-sky-500/40 backdrop-blur-xl transition-all cursor-pointer shadow-lg font-mono text-xs font-medium"
                title="Configurações, Câmera, Conquistas & Ranking (ESC)"
              >
                <MaterialIcon name="settings" className="text-sky-400" size={18} />
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}

            {/* Direct Achievements / Trophy Button */}
            {onOpenAchievements && (
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenAchievements();
                }}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-amber-300 hover:text-amber-200 border border-slate-800/80 hover:border-amber-400/40 backdrop-blur-xl transition-all cursor-pointer shadow-lg font-mono text-xs font-semibold"
                title="Conquistas & Badges Galácticas"
              >
                <MaterialIcon name="military_tech" fill className="text-amber-400" size={18} />
                <span>{stats.unlockedBadges.length}</span>
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
            crystals={crystals}
            targetVehiclePos={targetVehiclePos}
            isRacing={isRacing}
            currentCheckpoint={currentCheckpoint}
            whispers={whispers}
          />
        </div>
      </div>
    </div>
  );
};
