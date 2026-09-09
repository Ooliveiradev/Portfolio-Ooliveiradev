import React from 'react';
import { motion } from 'motion/react';
import { MaterialIcon, GithubIcon, LinkedinIcon } from './MaterialIcon';
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80 hover:border-sky-500/40 backdrop-blur-xl transition-all cursor-pointer font-mono text-xs font-medium shadow-lg"
            title="Menu de Configurações, Áudio & Câmera (ESC)"
          >
            <MaterialIcon name="settings" className="text-sky-400" size={18} />
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
          <h1 className="text-4xl sm:text-6xl font-sans font-bold text-slate-100 tracking-tight leading-none mb-3 drop-shadow-lg">
            {PERSONAL_INFO.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide max-w-lg mb-6">
            {PERSONAL_INFO.title}
          </p>

          {/* Clean Minimalist Explore Action */}
          <button
            onClick={handleStart}
            className="group flex items-center gap-3 bg-sky-500/15 hover:bg-sky-500/25 active:scale-95 text-slate-100 font-mono text-xs tracking-wider uppercase px-7 py-3.5 rounded-xl border border-sky-400/30 hover:border-sky-400/60 backdrop-blur-xl transition-all cursor-pointer shadow-xl"
          >
            <span>Iniciar Exploração com Nave</span>
            <MaterialIcon name="arrow_forward" className="text-sky-400 transition-transform group-hover:translate-x-1" size={18} />
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-medium backdrop-blur-xl transition-all cursor-pointer border ${
                      isVisited
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20'
                        : 'bg-[#0c1017]/80 hover:bg-slate-800/80 text-slate-300 hover:text-white border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: island.color }}
                    />
                    <span>{island.name}</span>
                    {isVisited && (
                      <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center text-[9px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick External Profiles (GitHub, LinkedIn, Email) */}
          <div className="mt-5 flex items-center gap-3">
            <a
              href={PERSONAL_INFO.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1017]/80 hover:bg-slate-800/90 text-slate-300 hover:text-white border border-slate-800/80 hover:border-slate-600 text-xs font-mono transition shadow-sm"
              title="Acessar GitHub de Danilo"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
            <a
              href={PERSONAL_INFO.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400 text-xs font-mono transition shadow-sm"
              title="Acessar LinkedIn de Danilo"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
            <a
              href={`mailto:${PERSONAL_INFO.email}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white border border-amber-500/30 hover:border-amber-400 text-xs font-mono transition shadow-sm"
              title={`Enviar email para ${PERSONAL_INFO.email}`}
            >
              <MaterialIcon name="mail" className="text-amber-400" size={16} />
              <span>Email</span>
            </a>
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

