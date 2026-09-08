import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Settings } from 'lucide-react';
import { IslandConfig, IslandId } from '../../types';
import { PERSONAL_INFO } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';

interface LandingOverlayProps {
  onStartGame: () => void;
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  onSelectIsland: (id: IslandId) => void;
  onOpenSettings?: () => void;
}

export const LandingOverlay: React.FC<LandingOverlayProps> = ({
  onStartGame,
  islands,
  visitedIslands,
  onSelectIsland,
  onOpenSettings,
}) => {
  const handleStart = () => {
    sounds.startAmbient();
    sounds.playBoost();
    onStartGame();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Minimalist Top Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-between w-full max-w-7xl mx-auto pointer-events-auto"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-xs font-mono tracking-widest uppercase text-slate-300 font-semibold">
            {PERSONAL_INFO.name}
          </span>
        </div>

        {/* Top Right: Single Clean Settings & Menu Button */}
        {onOpenSettings && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80 backdrop-blur-md transition-all cursor-pointer font-mono text-xs font-medium shadow-sm hover:border-sky-500/40"
            title="Menu de Configurações, Áudio & Câmera (ESC)"
          >
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        )}
      </motion.div>

      {/* Minimalist Center Hero */}
      <div className="flex flex-col items-center justify-center max-w-xl mx-auto text-center pointer-events-auto my-auto py-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-sky-400 mb-3 font-medium">
            Creative 3D Portfolio
          </span>

          <h1 className="text-4xl sm:text-6xl font-fun font-bold text-white tracking-tight leading-none mb-3 drop-shadow-lg">
            {PERSONAL_INFO.name}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-light tracking-wide max-w-md mb-6">
            Full Stack &amp; Creative 3D Engineer
          </p>

          {/* Clean Minimalist Explore Action */}
          <button
            onClick={handleStart}
            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-mono text-xs tracking-wider uppercase px-7 py-3.5 rounded-full border border-white/20 hover:border-white/40 backdrop-blur-md transition-all cursor-pointer shadow-2xl"
          >
            <span>Iniciar Exploração com Nave</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Direct Island Access Chips */}
          <div className="mt-7 flex flex-col items-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 tracking-wider uppercase">
              Ou explore clicando direto na ilha:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-lg">
              {islands.map((island) => {
                const isVisited = visitedIslands.includes(island.id);
                return (
                  <button
                    key={island.id}
                    onClick={() => {
                      sounds.playClick();
                      onSelectIsland(island.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium backdrop-blur-md transition-all cursor-pointer border ${
                      isVisited
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-900/75 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: island.color }}
                    />
                    <span>{island.name}</span>
                    {isVisited && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Minimalist Bottom Footnote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="w-full text-center text-[10px] font-mono tracking-widest text-slate-500 uppercase pointer-events-none"
      >
        Clique em qualquer ilha 3D em órbita ou pilote com W, A, S, D
      </motion.div>
    </div>
  );
};

