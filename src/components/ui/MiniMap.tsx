import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { IslandConfig, IslandId, CrystalCollectible, CosmicWhisper } from '../../types';
import { sounds } from '../../audio/soundManager';
import { SPEED_RINGS } from '../3d/SpeedRings';
import { getIslandLivePosition } from '../../utils/celestialCoords';
import { getVehiclePosition, getVehicleRotation } from '../../utils/vehicleTelemetry';
import { useVisibleTick } from '../../hooks/useVisibleTick';
import { RADAR_RADIUS, RADAR_SCALE, toRadarPoint, radarHeading } from '../../utils/radar';

interface MiniMapProps {
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  selectedIslandId: IslandId | null;
  onSelectIsland: (id: IslandId) => void;
  crystals?: CrystalCollectible[];
  targetVehiclePos?: [number, number, number] | null;
  isRacing?: boolean;
  currentCheckpoint?: number;
  whispers?: CosmicWhisper[];
}

// Low-poly celestial asteroids in world space
const ASTEROIDS = [
  { x: 16, z: 12, r: 1.8 },
  { x: 18, z: 14, r: 1.4 },
  { x: -22, z: 10, r: 2.1 },
  { x: -24, z: 13, r: 1.6 },
  { x: 10, z: -22, r: 1.9 },
  { x: -14, z: -20, r: 1.7 },
];

export const MiniMap: React.FC<MiniMapProps> = ({
  islands,
  visitedIslands,
  selectedIslandId,
  onSelectIsland,
  crystals,
  targetVehiclePos,
  isRacing = false,
  currentCheckpoint = 0,
  whispers = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLargeSize, setIsLargeSize] = useState(false);
  const [hoveredIsland, setHoveredIsland] = useState<IslandConfig | null>(null);

  // Real-time radar refresh for celestial orbit tracking even when ship is stationary
  const radarTick = useVisibleTick(100, isExpanded);
  const vehiclePos = getVehiclePosition();
  const vehicleRotation = getVehicleRotation();

  const scale = RADAR_SCALE;
  const toSvg = toRadarPoint;
  const clampedShip = toRadarPoint(vehiclePos[0], vehiclePos[2], 8);
  const headingAngleDeg = radarHeading(vehicleRotation);
  const compassHeading = Math.round(headingAngleDeg) % 360;

  // Target trajectory line pointing to live celestial coordinates
  const targetSvg = useMemo(() => {
    if (targetVehiclePos) {
      return toSvg(targetVehiclePos[0], targetVehiclePos[2]);
    }
    if (selectedIslandId) {
      const isl = islands.find((i) => i.id === selectedIslandId);
      if (isl) {
        const [ix, , iz] = getIslandLivePosition(isl);
        return toSvg(ix, iz);
      }
    }
    return null;
  }, [targetVehiclePos, selectedIslandId, islands, radarTick]);

  const visitedCount = visitedIslands.length;

  return (
    <div className="pointer-events-auto flex flex-col items-end select-none">
      {/* Minimized Button */}
      {!isExpanded && (
        <button
          onClick={() => {
            sounds.playClick();
            setIsExpanded(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c1017]/90 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 hover:border-sky-500/40 shadow-xl backdrop-blur-xl transition-all cursor-pointer group font-mono text-xs"
          title="Abrir Mapa"
        >
          <div className="relative">
            <MaterialIcon name="explore" className="text-sky-400 group-hover:rotate-45 transition-transform" size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0c1017]" />
          </div>
          <span className="font-semibold tracking-wider text-slate-200">MAPA</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
            {visitedCount}/5
          </span>
          <MaterialIcon name="expand_more" className="text-slate-400" size={18} />
        </button>
      )}

      {/* Expanded Minimalist Top-Down Map */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`bg-[#0c1017]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2.5 transition-all duration-300 ${
              isLargeSize ? 'w-80 sm:w-92 max-w-[calc(100vw-2rem)]' : 'w-56 sm:w-72'
            }`}
          >
            {/* Minimalist Top Header */}
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-800/80 mb-1.5 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="text-[9px] sm:text-[10px] whitespace-nowrap font-mono font-bold tracking-wider text-slate-300 uppercase">
                  SISTEMA SOLAR
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-800">
                  {compassHeading.toString().padStart(3, '0')}°
                </span>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsLargeSize(!isLargeSize);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                  title={isLargeSize ? 'Reduzir' : 'Expandir'}
                >
                  {isLargeSize ? (
                    <MaterialIcon name="fullscreen_exit" size={16} />
                  ) : (
                    <MaterialIcon name="fullscreen" size={16} />
                  )}
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsExpanded(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                  title="Fechar"
                >
                  <MaterialIcon name="expand_less" size={18} />
                </button>
              </div>
            </div>

            {/* Top-Down Orthographic Visual Canvas */}
            <div className="relative w-full aspect-square bg-[#07090e] rounded-xl border border-slate-800/80 overflow-hidden select-none">
              <svg
                className="w-full h-full"
                viewBox="0 0 200 200"
                style={{ shapeRendering: 'geometricPrecision' }}
              >
                <defs>
                  {/* Subtle Space Vignette */}
                  <radialGradient id="minimapSpaceVignette" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0b1329" stopOpacity="0.8" />
                    <stop offset="70%" stopColor="#070b16" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#03050a" stopOpacity="1" />
                  </radialGradient>

                  {/* Sun Glow Gradient */}
                  <radialGradient id="minimapSunCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
                    <stop offset="40%" stopColor="#f97316" stopOpacity="0.8" />
                    <stop offset="75%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="radarSweepGlow" gradientUnits="userSpaceOnUse" cx="100" cy="100" r={RADAR_RADIUS}>
                    <stop stopColor="#38bdf8" stopOpacity="0.03" />
                    <stop offset="1" stopColor="#38bdf8" stopOpacity="0.2" />
                  </radialGradient>
                </defs>

                {/* 1. Deep Space Cosmic Background */}
                <rect width="200" height="200" fill="url(#minimapSpaceVignette)" />

                {/* One SVG coordinate system: the sweep tip stays at the sun at every size. */}
                <g className="radar-sweep" pointerEvents="none" aria-hidden="true">
                  <path d="M100 100 L100 18 A82 82 0 0 0 29 59 Z" fill="url(#radarSweepGlow)" />
                  <line x1="100" y1="100" x2="100" y2="18" stroke="#7dd3fc" strokeOpacity="0.5" strokeWidth="0.65" />
                </g>

                {/* Subtle Background Starfield Dots */}
                {[
                  [24, 32], [45, 18], [170, 35], [182, 78], [165, 155], [30, 168],
                  [85, 26], [140, 60], [60, 140], [130, 172], [18, 110], [92, 182]
                ].map(([sx, sy], i) => (
                  <circle key={`star-${i}`} cx={sx} cy={sy} r="0.6" fill="#7dd3fc" opacity="0.3" />
                ))}

                {/* 1.5 Retícula Tática Holográfica & Anéis de Alcance */}
                <g opacity="0.35">
                  {/* Linhas cruzadas táticas centralizadas */}
                  <line x1="100" y1="12" x2="100" y2="188" stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="2 3" />
                  <line x1="12" y1="100" x2="188" y2="100" stroke="#38bdf8" strokeWidth="0.4" strokeDasharray="2 3" />

                  {/* Anéis concêntricos de alcance estelar */}
                  {[0.25, 0.5, 0.75, 1.0].map((fraction, idx) => (
                    <circle
                      key={`range-ring-${idx}`}
                      cx="100"
                      cy="100"
                      r={RADAR_RADIUS * fraction}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="0.35"
                      strokeDasharray="1 3"
                    />
                  ))}
                </g>

                {/* Marcadores Cardeais de Bússola Tática */}
                <g className="font-mono text-[6px] fill-sky-400 font-bold select-none" opacity="0.75">
                  <text x="100" y="9" textAnchor="middle">N</text>
                  <text x="100" y="196" textAnchor="middle">S</text>
                  <text x="194" y="102" textAnchor="middle">L</text>
                  <text x="6" y="102" textAnchor="middle">O</text>
                </g>

                {/* 2. Planetary Orbits (Círculos orbitais contínuos e translúcidos o tempo todo) */}
                {islands.map((island) => {
                  const orbitR = island.orbitRadius * scale;
                  const isHovered = hoveredIsland?.id === island.id;
                  const isSelected = selectedIslandId === island.id;

                  return (
                    <circle
                      key={`orbit-${island.id}`}
                      cx="100"
                      cy="100"
                      r={orbitR}
                      fill="none"
                      stroke={island.color}
                      strokeWidth={isSelected || isHovered ? '0.85' : '0.45'}
                      opacity={isSelected ? 0.85 : isHovered ? 0.65 : 0.3}
                    />
                  );
                })}

                {/* 3. Asteroids (Small stone fragments) */}
                {ASTEROIDS.map((ast, i) => {
                  const pos = toSvg(ast.x, ast.z);
                  return (
                    <polygon
                      key={`ast-${i}`}
                      points={`
                        ${pos.x},${pos.y - ast.r}
                        ${pos.x + ast.r},${pos.y - ast.r * 0.3}
                        ${pos.x + ast.r * 0.6},${pos.y + ast.r}
                        ${pos.x - ast.r * 0.8},${pos.y + ast.r * 0.6}
                        ${pos.x - ast.r},${pos.y - ast.r * 0.2}
                      `}
                      fill="#475569"
                      stroke="#334155"
                      strokeWidth="0.3"
                      opacity="0.7"
                    />
                  );
                })}

                {/* 4. Collectible Space Crystals (Tiny glowing diamonds in orbit) */}
                {crystals?.map((c) => {
                  if (c.collected) return null;
                  const pos = toSvg(c.position[0], c.position[2]);
                  return (
                    <polygon
                      key={`crystal-${c.id}`}
                      points={`
                        ${pos.x},${pos.y - 1.4}
                        ${pos.x + 1.1},${pos.y}
                        ${pos.x},${pos.y + 1.4}
                        ${pos.x - 1.1},${pos.y}
                      `}
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="0.3"
                    />
                  );
                })}

                {/* 5. Central Sun (Low-Poly Dodecahedron & Warm Glow) */}
                <g>
                  {/* Heat glow halo */}
                  <circle cx="100" cy="100" r="11" fill="url(#minimapSunCoreGlow)" opacity="0.8" />

                  {/* Danger zone boundary (5.6u world = ~3.9u svg) */}
                  <circle
                    cx="100"
                    cy="100"
                    r={5.6 * scale}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.4"
                    strokeDasharray="1 1.5"
                    opacity="0.6"
                  />

                  {/* Faceted Sun Polygon */}
                  <polygon
                    points="
                      100,97 102.1,97.6 103.1,99.4 102.7,101.3 101.3,102.8
                      98.7,102.8 97.3,101.3 96.9,99.4 97.9,97.6
                    "
                    fill="#fef08a"
                    stroke="#f97316"
                    strokeWidth="0.5"
                  />
                </g>

                {/* 6. Autopilot Trajectory Guide Line */}
                {targetSvg && !isRacing && (
                  <line
                    x1={clampedShip.x}
                    y1={clampedShip.y}
                    x2={targetSvg.x}
                    y2={targetSvg.y}
                    stroke="#38bdf8"
                    strokeWidth="0.75"
                    strokeDasharray="2 2"
                    strokeOpacity="0.7"
                  />
                )}

                {/* 6.5 Speed Rings & Active Race Checkpoint Target */}
                {SPEED_RINGS.map((ring, idx) => {
                  const pos = toSvg(ring.position[0], ring.position[2]);
                  const isCurrentTarget = isRacing && currentCheckpoint === idx;
                  const isStart = ring.id === 0;

                  return (
                    <g key={`minimap-ring-${ring.id}`}>
                      {/* Current Target Animated Pulse Ring */}
                      {isCurrentTarget && (
                        <>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="8.5"
                            fill="none"
                            stroke="#fde047"
                            strokeWidth="0.9"
                            strokeDasharray="2 1.5"
                            opacity="0.9"
                          />
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r="5.5"
                            fill="#fde047"
                            opacity="0.25"
                          />
                        </>
                      )}

                      {/* Speed Ring Body */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isCurrentTarget ? '3.6' : '2.2'}
                        fill="#0b0f19"
                        stroke={isCurrentTarget ? '#fde047' : isStart ? '#fbbf24' : '#38bdf8'}
                        strokeWidth={isCurrentTarget ? '1.2' : '0.6'}
                        opacity={isCurrentTarget ? 1.0 : 0.65}
                      />

                      {/* Inner aperture */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isCurrentTarget ? '1.6' : '0.9'}
                        fill={isCurrentTarget ? '#fde047' : '#0284c7'}
                        opacity={isCurrentTarget ? 0.95 : 0.5}
                      />
                    </g>
                  );
                })}

                {/* Race Flight Corridor Line to Target Ring */}
                {isRacing && SPEED_RINGS[currentCheckpoint] && (
                  <line
                    x1={clampedShip.x}
                    y1={clampedShip.y}
                    x2={toSvg(SPEED_RINGS[currentCheckpoint].position[0], SPEED_RINGS[currentCheckpoint].position[2]).x}
                    y2={toSvg(SPEED_RINGS[currentCheckpoint].position[0], SPEED_RINGS[currentCheckpoint].position[2]).y}
                    stroke="#fde047"
                    strokeWidth="1.1"
                    strokeDasharray="2.5 1.5"
                    strokeOpacity="0.85"
                  />
                )}

                {/* 6.8 Marcadores Secretos e Easter Eggs no Radar */}
                {/* Asteroide Dourado Secreto */}
                {(() => {
                  const aPos = toSvg(62, -58);
                  return (
                    <g opacity="0.85">
                      <circle cx={aPos.x} cy={aPos.y} r="1.4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.4" />
                    </g>
                  );
                })()}

                {/* Ilha Oculta do Vazio (Sinal Anômalo ?) */}
                {(() => {
                  const vPos = toSvg(-105, 88);
                  return (
                    <g opacity="0.9">
                      <circle
                        cx={vPos.x}
                        cy={vPos.y}
                        r="3.5"
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="0.5"
                        strokeDasharray="1.5 1.5"
                      />
                      <circle cx={vPos.x} cy={vPos.y} r="1.6" fill="#a855f7" stroke="#e879f9" strokeWidth="0.4" />
                      <text
                        x={vPos.x}
                        y={vPos.y - 4.5}
                        textAnchor="middle"
                        className="font-mono text-[5px] fill-purple-400 font-bold select-none"
                      >
                        ? SINAL
                      </text>
                    </g>
                  );
                })()}

                {/* 6.9 Sussurros Cósmicos e Sinais Sociais no Radar */}
                {whispers.map((w) => {
                  const wPos = toSvg(w.position[0], w.position[2]);
                  return (
                    <g key={`whisper-marker-${w.id}`} opacity="0.85">
                      <circle
                        cx={wPos.x}
                        cy={wPos.y}
                        r="1.2"
                        fill="#06b6d4"
                        stroke="#67e8f9"
                        strokeWidth="0.3"
                      />
                    </g>
                  );
                })}

                {/* 7. Planetary Islands (Top-Down Diorama Platforms + Bruno Simon Diamond Markers) */}
                {islands.map((island) => {
                  const [ix, , iz] = getIslandLivePosition(island);
                  const pos = toSvg(ix, iz);
                  const isVisited = visitedIslands.includes(island.id);
                  const isSelected = selectedIslandId === island.id;
                  const isHovered = hoveredIsland?.id === island.id;

                  return (
                    <g
                      key={`island-${island.id}`}
                      className="cursor-pointer group"
                      onClick={() => {
                        sounds.playClick();
                        onSelectIsland(island.id);
                      }}
                      onMouseEnter={() => setHoveredIsland(island)}
                      onMouseLeave={() => setHoveredIsland(null)}
                    >
                      {/* Selection / Hover atmospheric glow */}
                      {(isSelected || isHovered) && (
                        <circle
                          cx={pos.x}
                          cy={pos.y}
                          r="7.5"
                          fill="none"
                          stroke={island.color}
                          strokeWidth="0.6"
                          strokeDasharray="1.5 1.5"
                          opacity="0.8"
                        />
                      )}

                      {/* Island Platform Disk (Themed topography) */}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="4.8"
                        fill="#111827"
                        stroke={island.color}
                        strokeWidth={isSelected ? '1.0' : '0.6'}
                      />

                      {/* Internal low-poly relief contour */}
                      <polygon
                        points={`
                          ${pos.x},${pos.y - 2.8}
                          ${pos.x + 2.5},${pos.y - 1.4}
                          ${pos.x + 2.5},${pos.y + 1.4}
                          ${pos.x},${pos.y + 2.8}
                          ${pos.x - 2.5},${pos.y + 1.4}
                          ${pos.x - 2.5},${pos.y - 1.4}
                        `}
                        fill={`${island.color}35`}
                      />

                      {/* BRUNO SIMON SIGNATURE DIAMOND MARKER (White diamond with black outline) */}
                      <g transform={`translate(${pos.x}, ${pos.y})`}>
                        <polygon
                          points="0,-3.2 3.2,0 0,3.2 -3.2,0"
                          fill={isVisited ? '#10b981' : '#ffffff'}
                          stroke="#090d16"
                          strokeWidth="0.9"
                        />
                        {/* Inner accent dot */}
                        <circle
                          cx="0"
                          cy="0"
                          r="0.8"
                          fill={isVisited ? '#ffffff' : island.color}
                        />
                      </g>
                    </g>
                  );
                })}

                {/* 8. THE ROCKET VEHICLE (Real Top-Down Representation + Bruno Simon Corner Brackets) */}
                <g transform={`translate(${clampedShip.x}, ${clampedShip.y})`}>
                  {/* Rocket & Brackets rotating together with vehicleRotation */}
                  <g transform={`rotate(${headingAngleDeg}) scale(0.55)`}>
                    {/* BRUNO SIMON CORNER BRACKETS [  ] (Framing the car/rocket) */}
                    <g stroke="#ffffff" strokeWidth="0.85" strokeLinecap="square" fill="none" opacity="0.9">
                      {/* Top-Left Bracket */}
                      <path d="M -7.5 -11.5 L -10.5 -11.5 L -10.5 -8.5" />
                      {/* Top-Right Bracket */}
                      <path d="M 7.5 -11.5 L 10.5 -11.5 L 10.5 -8.5" />
                      {/* Bottom-Left Bracket */}
                      <path d="M -7.5 11.5 L -10.5 11.5 L -10.5 8.5" />
                      {/* Bottom-Right Bracket */}
                      <path d="M 7.5 11.5 L 10.5 11.5 L 10.5 8.5" />
                    </g>

                    {/* REAL LOW-POLY ROCKET CRAFT (Faithful to SpaceVehicle 3D model) */}
                    {/* Red Swept Aerodynamic Fins (Aletas vermelhas #dc2626) */}
                    {/* Left Wing / Fin */}
                    <polygon
                      points="-2.6,1 -7.8,7.8 -5.8,8.2 -1.8,4.5"
                      fill="#dc2626"
                      stroke="#991b1b"
                      strokeWidth="0.3"
                    />
                    {/* Right Wing / Fin */}
                    <polygon
                      points="2.6,1 7.8,7.8 5.8,8.2 1.8,4.5"
                      fill="#ef4444"
                      stroke="#991b1b"
                      strokeWidth="0.3"
                    />

                    {/* Gunmetal Engine Nozzle Collar at the tail */}
                    <polygon
                      points="-1.8,6.8 1.8,6.8 1.4,8.8 -1.4,8.8"
                      fill="#475569"
                    />

                    {/* White Faceted Fuselage (Bullet body) */}
                    <polygon
                      points="0,-7 2.4,-1 2.2,6.8 -2.2,6.8 -2.4,-1"
                      fill="#f8fafc"
                      stroke="#cbd5e1"
                      strokeWidth="0.4"
                    />
                    {/* Low-poly shaded right facet */}
                    <polygon
                      points="0,-7 2.4,-1 2.2,6.8 0,6.8"
                      fill="#e2e8f0"
                      opacity="0.6"
                    />

                    {/* Red Conical Nose Cone (#dc2626) at the front pointing forward */}
                    <polygon
                      points="0,-12.8 2.0,-6.8 -2.0,-6.8"
                      fill="#dc2626"
                      stroke="#b91c1c"
                      strokeWidth="0.35"
                    />
                    {/* Nose cone facet shading */}
                    <polygon
                      points="0,-12.8 2.0,-6.8 0,-6.8"
                      fill="#b91c1c"
                      opacity="0.4"
                    />

                    {/* Circular Porthole Window (Silver Bezel + Sky-Blue Glass) */}
                    <circle cx="0" cy="-2.5" r="1.7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.3" />
                    <circle cx="0" cy="-2.5" r="1.2" fill="#38bdf8" />
                    <circle cx="-0.3" cy="-2.8" r="0.35" fill="#ffffff" />

                    {/* Center Dorsal Fin Strip */}
                    <line x1="0" y1="0.5" x2="0" y2="6.5" stroke="#dc2626" strokeWidth="0.5" />
                  </g>
                </g>
              </svg>

              {/* Minimalist Hover Tooltip */}
              {hoveredIsland && (
                <div className="absolute bottom-2 left-2 right-2 bg-[#0c1017]/95 border border-slate-700/80 px-2.5 py-1.5 rounded-xl pointer-events-none shadow-xl flex items-center justify-between z-30">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredIsland.color }} />
                    <span className="text-[10px] font-semibold font-mono text-slate-100">
                      {hoveredIsland.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {visitedIslands.includes(hoveredIsland.id) ? 'Visitada ✓' : 'Clique para ir'}
                  </span>
                </div>
              )}
            </div>

            {/* Minimalist Bottom Bar: Progress summary & Telemetry */}
            <div className="flex items-center justify-between px-1.5 pt-1.5 text-[9px] font-mono text-slate-400 border-t border-slate-800/60 mt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {visitedCount}/5 Conhecidas
              </span>
              <span className="text-slate-500 font-mono">
                X:{Math.round(vehiclePos[0])} Z:{Math.round(vehiclePos[2])}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
