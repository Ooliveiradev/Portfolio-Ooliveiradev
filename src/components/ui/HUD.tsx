import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Award,
  Volume2,
  VolumeX,
  RotateCcw,
  Video,
  ChevronDown,
  Check,
  Navigation,
  Globe,
  Layers,
  FolderGit2,
  Briefcase,
  Cpu,
  GraduationCap,
  UserCheck,
  Zap,
  Home
} from 'lucide-react';
import { IslandConfig, IslandId, UserStats, CameraViewMode } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';
import { MiniMap } from './MiniMap';

interface HUDProps {
  stats: UserStats;
  islands: IslandConfig[];
  selectedIslandId: IslandId | null;
  onSelectIsland: (id: IslandId) => void;
  onOpenBadges: () => void;
  onOpenLeaderboard: () => void;
  onResetVehicle: () => void;
  onReturnToLanding: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraViewMode: CameraViewMode;
  onSelectCameraMode: (mode: CameraViewMode) => void;
  recentXpGained: number | null;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  islands,
  selectedIslandId,
  onSelectIsland,
  onOpenBadges,
  onOpenLeaderboard,
  onResetVehicle,
  onReturnToLanding,
  isMuted,
  onToggleMute,
  cameraViewMode,
  onSelectCameraMode,
  recentXpGained,
  vehiclePos,
  vehicleRotation,
}) => {
  const [showCameraDropdown, setShowCameraDropdown] = useState(false);
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

        {/* Top Right Action Buttons & MiniMap */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="flex items-center gap-2">
            {/* Badges Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenBadges();
              }}
              className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-mono font-medium backdrop-blur-md transition-all shadow-md cursor-pointer"
              title="Ver Badges Desbloqueadas"
            >
              <Award className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-purple-300">{stats.unlockedBadges.length}/6</span>
              <span className="hidden md:inline text-slate-400 text-[11px]">Badges</span>
            </button>

            {/* Leaderboard Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenLeaderboard();
              }}
              className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-mono font-medium backdrop-blur-md transition-all shadow-md cursor-pointer"
              title="Ranking dos Visitantes"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Ranking</span>
            </button>

            {/* Camera Mode Dropdown Button & Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowCameraDropdown(!showCameraDropdown);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer shadow-md text-xs font-mono font-medium ${
                  showCameraDropdown
                    ? 'bg-sky-500/25 border-sky-400 text-white ring-2 ring-sky-500/40'
                    : 'bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                }`}
                title="Modos de Câmera"
              >
                <Video className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline font-bold">
                  {cameraViewMode === 'chase'
                    ? 'Atrás da Nave'
                    : cameraViewMode === 'iso'
                    ? 'Isométrica'
                    : 'Visão Global'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    showCameraDropdown ? 'rotate-180 text-sky-400' : ''
                  }`}
                />
              </button>

              {/* Descending Dropdown List with 3 Modes */}
              <AnimatePresence>
                {showCameraDropdown && (
                  <>
                    {/* Click outside backdrop */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowCameraDropdown(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden p-2 z-40 flex flex-col gap-1.5"
                    >
                      <div className="px-2.5 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          Modos de Câmera
                        </span>
                        <span className="text-[9px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/30">
                          3 Modos
                        </span>
                      </div>

                      {/* Modo 1: Atrás da Nave (Terceira Pessoa) */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectCameraMode('chase');
                          setShowCameraDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          cameraViewMode === 'chase'
                            ? 'bg-sky-500/15 border-sky-500/60 text-white shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                            : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            cameraViewMode === 'chase'
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Navigation className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              Atrás da Nave
                              <span className="text-[10px] text-sky-400 font-mono font-normal">
                                (Chase)
                              </span>
                            </span>
                            {cameraViewMode === 'chase' && (
                              <Check className="w-3.5 h-3.5 text-sky-400 stroke-[3]" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Câmera em terceira pessoa fixada atrás da nave, acompanhando manobras e curvas em tempo real.
                          </p>
                        </div>
                      </button>

                      {/* Modo 2: Visão Isométrica (Diorama) */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectCameraMode('iso');
                          setShowCameraDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          cameraViewMode === 'iso'
                            ? 'bg-purple-500/15 border-purple-500/60 text-white shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                            : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            cameraViewMode === 'iso'
                              ? 'bg-purple-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              Visão Isométrica
                              <span className="text-[10px] text-purple-400 font-mono font-normal">
                                (Diorama)
                              </span>
                            </span>
                            {cameraViewMode === 'iso' && (
                              <Check className="w-3.5 h-3.5 text-purple-400 stroke-[3]" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Enquadramento diagonal de maquete com profundidade comprimida estilo Poly Bridge.
                          </p>
                        </div>
                      </button>

                      {/* Modo 3: Visão Global 55° */}
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectCameraMode('tactical55');
                          setShowCameraDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          cameraViewMode === 'tactical55'
                            ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            cameraViewMode === 'tactical55'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              Visão Global
                              <span className="text-[10px] text-emerald-400 font-mono font-normal">
                                (55°)
                              </span>
                            </span>
                            {cameraViewMode === 'tactical55' && (
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Ângulo tático amplo com todos os planetas do sistema solar visíveis.
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                onToggleMute();
                sounds.playClick();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer shadow-md"
              title={isMuted ? 'Ativar Som' : 'Desativar Som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Return to Landing */}
            <button
              onClick={() => {
                sounds.playClick();
                onReturnToLanding();
              }}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 backdrop-blur-md transition-all cursor-pointer shadow-md"
              title="Menu Inicial"
            >
              <Home className="w-4 h-4" />
            </button>
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
