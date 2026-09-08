import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  Briefcase,
  Cpu,
  GraduationCap,
  UserCheck,
  Check
} from 'lucide-react';
import { IslandConfig, IslandId } from '../../types';
import { sounds } from '../../audio/soundManager';

interface MiniMapProps {
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  selectedIslandId: IslandId | null;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  onSelectIsland: (id: IslandId) => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  islands,
  visitedIslands,
  selectedIslandId,
  vehiclePos,
  vehicleRotation,
  onSelectIsland,
}) => {
  // MiniMap can be expanded or minimized by the player
  const [isExpanded, setIsExpanded] = useState(true);

  // Maximum coordinate radius in Three.js space for the 1.5x-2.0x expanded orbits (outermost orbit is 102)
  const MAX_RADIUS = 118;

  // Transform Three.js world coordinates (X, Z) to Radar percentage (0% to 100%)
  const toMapCoords = (x: number, z: number) => {
    // Center of radar is (50%, 50%)
    // Scale factor: radius of 102 maps to ~39% from center
    const scale = 41 / MAX_RADIUS;
    const px = 50 + x * scale;
    const py = 50 + z * scale;
    return {
      x: Math.max(7, Math.min(93, px)),
      y: Math.max(7, Math.min(93, py)),
    };
  };

  const playerPos = toMapCoords(vehiclePos[0], vehiclePos[2]);

  // Calculate orientation cone angle on screen (in degrees)
  // In Three.js forward is (sin(r), cos(r)) where +Z is down on screen
  const headingAngleDeg =
    (Math.atan2(Math.sin(vehicleRotation), -Math.cos(vehicleRotation)) * 180) / Math.PI;

  const getIslandIcon = (id: IslandId) => {
    switch (id) {
      case 'projects':
        return <FolderGit2 className="w-3.5 h-3.5" />;
      case 'experience':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'skills':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'education':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'about':
        return <UserCheck className="w-3.5 h-3.5" />;
    }
  };

  const visitedCount = visitedIslands.length;

  return (
    <div className="pointer-events-auto flex flex-col items-end">
      {/* Minimized Toggle Button */}
      {!isExpanded && (
        <button
          onClick={() => {
            sounds.playClick();
            setIsExpanded(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/90 shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
          title="Abrir Mapa da Galáxia"
        >
          <div className="relative">
            <Compass className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
            {visitedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            )}
          </div>
          <span className="text-xs font-mono font-bold tracking-wider">MAPA</span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded-full border border-emerald-500/40">
            {visitedCount}/5 ✓
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Expanded Tactical Radar MiniMap */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-56 sm:w-64 bg-slate-950/92 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-200">
                  Radar Cósmico
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  {visitedCount}/5
                </span>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsExpanded(false);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Recolher Mapa"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Radar Canvas Screen */}
            <div className="relative w-full aspect-square bg-[#050914] rounded-2xl border border-slate-800/70 overflow-hidden select-none">
              {/* Star dots background */}
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Concentric Orbital Rings */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                {/* Crosshairs */}
                <line x1="50" y1="4" x2="50" y2="96" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />
                <line x1="4" y1="50" x2="96" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2 2" />

                {/* Concentric rings for expanded orbit radii: 30, 48, 66, 84, 102 */}
                {[30, 48, 66, 84, 102].map((r) => {
                  const svgRadius = (r / MAX_RADIUS) * 41;
                  return (
                    <circle
                      key={r}
                      cx="50"
                      cy="50"
                      r={svgRadius}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="0.5"
                      strokeDasharray="1.5 2"
                      opacity="0.55"
                    />
                  );
                })}
              </svg>

              {/* Radar Sweep Animation */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none animate-spin origin-center"
                style={{
                  animationDuration: '6s',
                  background:
                    'conic-gradient(from 0deg at 50% 50%, rgba(56, 189, 248, 0.15) 0deg, rgba(56, 189, 248, 0.03) 45deg, transparent 90deg)',
                }}
              />

              {/* Galaxy Core Center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/90 ring-4 ring-amber-400/20 shadow-[0_0_8px_#f59e0b]" />
              </div>

              {/* Islands on the Radar */}
              {islands.map((island) => {
                // Approximate coordinate in radar space
                const x = Math.cos(island.angleOffset) * island.orbitRadius;
                const z = Math.sin(island.angleOffset) * island.orbitRadius;
                const coords = toMapCoords(x, z);

                const isVisited = visitedIslands.includes(island.id);
                const isSelected = selectedIslandId === island.id;

                return (
                  <button
                    key={island.id}
                    onClick={() => {
                      sounds.playClick();
                      onSelectIsland(island.id);
                    }}
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10 transition-transform active:scale-95"
                    title={`${island.name} ${isVisited ? '(Visitada ✓)' : ''} - Clique para viajar`}
                  >
                    {/* Outer glow ring for current selected or hovered island */}
                    <div className="relative">
                      {/* Island Icon Button */}
                      <div
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all shadow-md ${
                          isSelected
                            ? 'ring-2 ring-white scale-110'
                            : 'hover:scale-115'
                        }`}
                        style={{
                          backgroundColor: isVisited ? `${island.color}25` : '#0f172a',
                          border: `1.5px solid ${isVisited ? island.color : '#334155'}`,
                          color: isVisited ? island.color : '#94a3b8',
                        }}
                      >
                        {getIslandIcon(island.id)}
                      </div>

                      {/* Visited Checkmark on bottom right */}
                      {isVisited && (
                        <span
                          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-1 ring-slate-950 font-black"
                          style={{ fontSize: '7px' }}
                          title="Visitada"
                        >
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 rounded-md bg-slate-900/95 border border-slate-700 text-[9px] font-mono text-white whitespace-nowrap z-30 shadow-xl pointer-events-none">
                      <span style={{ color: island.color }}>{island.name}</span>
                      {isVisited && <span className="text-emerald-400 ml-1">✓</span>}
                    </div>
                  </button>
                );
              })}

              {/* ====================================================================
                  EXACT USER REQUIREMENT:
                  "quero que a ponta do cone esteja sempre no centro do circulo"
                  The apex of the cone (0, 0) and the circle center (0, 0) are
                  strictly co-located in the same coordinate frame.
                 ==================================================================== */}
              <div
                style={{ left: `${playerPos.x}%`, top: `${playerPos.y}%` }}
                className="absolute pointer-events-none z-20"
              >
                {/* Translucent Orientation Cone: Pivots at (0, 0) where the cone apex starts */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: 0,
                    top: 0,
                    transform: `rotate(${headingAngleDeg}deg)`,
                    transformOrigin: '0px 0px',
                  }}
                >
                  <svg
                    className="overflow-visible pointer-events-none"
                    style={{ position: 'absolute', left: 0, top: 0 }}
                    viewBox="0 0 100 100"
                  >
                    <defs>
                      <radialGradient id="miniMapVisionCone" cx="0" cy="0" r="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                        <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.38" />
                        <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </radialGradient>
                    </defs>

                    {/* Translucent Vision Cone (fanning out ~46 degrees from origin (0, 0) upwards) */}
                    <path
                      d="M 0 0 L -17 -38 A 42 42 0 0 1 17 -38 Z"
                      fill="url(#miniMapVisionCone)"
                      stroke="#7dd3fc"
                      strokeWidth="0.65"
                      strokeOpacity="0.5"
                    />

                    {/* Central Sight Guideline starting directly from the center (0, 0) */}
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="-37"
                      stroke="#bae6fd"
                      strokeWidth="0.85"
                      strokeOpacity="0.8"
                      strokeDasharray="2 2"
                    />
                  </svg>
                </div>

                {/* Player Ship Location Dot (centered strictly at 0, 0) */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                  style={{ left: 0, top: 0, width: '12px', height: '12px' }}
                >
                  <span className="absolute w-5 h-5 rounded-full bg-sky-400/35 animate-ping" />
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white shadow-[0_0_10px_#38bdf8]" />
                </div>
              </div>
            </div>

            {/* Footer helper note */}
            <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                <span className="text-slate-300">Nave + Radar de Projeção</span>
              </span>
              <span className="text-slate-500">Auto-navegar</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
