import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { IslandConfig, IslandId, CrystalCollectible } from '../../types';
import { sounds } from '../../audio/soundManager';
import { SPEED_RINGS } from '../3d/SpeedRings';
import { getIslandLivePosition } from '../../utils/celestialCoords';

interface MiniMapProps {
  islands: IslandConfig[];
  visitedIslands: IslandId[];
  selectedIslandId: IslandId | null;
  vehiclePos: [number, number, number];
  vehicleRotation: number;
  onSelectIsland: (id: IslandId) => void;
  crystals?: CrystalCollectible[];
  targetVehiclePos?: [number, number, number] | null;
  isRacing?: boolean;
  currentCheckpoint?: number;
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
  vehiclePos,
  vehicleRotation,
  onSelectIsland,
  crystals,
  targetVehiclePos,
  isRacing = false,
  currentCheckpoint = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLargeSize, setIsLargeSize] = useState(false);
  const [hoveredIsland, setHoveredIsland] = useState<IslandConfig | null>(null);

  // Real-time radar refresh for celestial orbit tracking even when ship is stationary
  const [, setRadarTick] = useState(0);
  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(() => {
      setRadarTick((t) => (t + 1) % 10000);
    }, 60); // 16 FPS smooth real-time radar tracking
    return () => clearInterval(interval);
  }, [isExpanded]);

  // Maximum coordinate radius in Three.js space (outermost island orbit is 102)
  const MAX_RADIUS = 118;
  const SVG_CENTER = 100;
  const RADAR_RADIUS = 82;
  const scale = RADAR_RADIUS / MAX_RADIUS; // ~0.6949

  // Transform Three.js world coordinates (X, Z) to SVG coordinate space (0 to 200)
  const toSvg = (x: number, z: number) => ({
    x: SVG_CENTER + x * scale,
    y: SVG_CENTER + z * scale,
  });

  const shipSvg = toSvg(vehiclePos[0], vehiclePos[2]);

  // Keep rocket on radar bounds if flying far out
  const clampedShip = {
    x: Math.max(14, Math.min(186, shipSvg.x)),
    y: Math.max(14, Math.min(186, shipSvg.y)),
  };

  // 100% accurate heading angle matching Three.js forward vector (sin(yaw), cos(yaw))
  const headingAngleDeg =
    (Math.atan2(Math.sin(vehicleRotation), -Math.cos(vehicleRotation)) * 180) / Math.PI;

  const compassHeading = Math.round(((headingAngleDeg % 360) + 360) % 360);

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
  }, [targetVehiclePos, selectedIslandId, islands, vehiclePos]);

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
            <Compass className="w-4 h-4 text-sky-400 group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0c1017]" />
          </div>
          <span className="font-semibold tracking-wider text-slate-200">MAPA</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
            {visitedCount}/5
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
              isLargeSize ? 'w-80 sm:w-92' : 'w-64 sm:w-72'
            }`}
          >
            {/* Minimalist Top Header */}
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-800/80 mb-1.5 text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">
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
                  {isLargeSize ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setIsExpanded(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                  title="Fechar"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
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
                </defs>

                {/* 1. Deep Space Cosmic Background */}
                <rect width="200" height="200" fill="url(#minimapSpaceVignette)" />

                {/* Subtle Background Starfield Dots */}
                {[
                  [24, 32], [45, 18], [170, 35], [182, 78], [165, 155], [30, 168],
                  [85, 26], [140, 60], [60, 140], [130, 172], [18, 110], [92, 182]
                ].map(([sx, sy], i) => (
                  <circle key={`star-${i}`} cx={sx} cy={sy} r="0.6" fill="#7dd3fc" opacity="0.3" />
                ))}

                {/* 2. Planetary Orbits (Thin, clean circular tracks) */}
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
                      strokeWidth={isSelected || isHovered ? '0.9' : '0.45'}
                      strokeDasharray={isSelected ? '2 1.5' : '1.5 2.5'}
                      opacity={isSelected ? 0.8 : isHovered ? 0.6 : 0.22}
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
                  <g transform={`rotate(${headingAngleDeg})`}>
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

            {/* Minimalist Bottom Bar: Progress summary */}
            <div className="flex items-center justify-between px-1.5 pt-1.5 text-[9px] font-mono text-slate-400">
              <span>{visitedCount}/5 Conhecidas</span>
              <span className="text-slate-500">Clique nas ilhas para navegar</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
