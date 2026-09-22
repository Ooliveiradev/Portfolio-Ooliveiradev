import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from './MaterialIcon';
import { formatRaceTime } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';
import { getVehiclePosition, getVehicleRotation } from '../../utils/vehicleTelemetry';
import { raceSession } from '../../utils/raceSession';
import { useVisibleTick } from '../../hooks/useVisibleTick';
import { canHandleGameKey } from '../../utils/gameInput';

interface RaceOverlayProps {
  controlsEnabled?: boolean;
  isNearStartGate: boolean;
  raceState: 'idle' | 'countdown' | 'racing' | 'finished';
  countdownNumber: number;
  elapsedTime: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  bestTime: number | null;
  targetRingPosition?: [number, number, number];
  onStartRace: () => void;
  onCancelRace: () => void;
  onSaveScore: (pilotName: string) => void;
  onRetryRace: () => void;
  onCloseModal: () => void;
}

export const RaceOverlay: React.FC<RaceOverlayProps> = ({
  controlsEnabled = true,
  isNearStartGate,
  raceState,
  countdownNumber,
  elapsedTime,
  currentCheckpoint,
  totalCheckpoints,
  bestTime,
  targetRingPosition,
  onStartRace,
  onCancelRace,
  onSaveScore,
  onRetryRace,
  onCloseModal,
}) => {
  const [pilotName, setPilotName] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const now = useVisibleTick(50, raceState === 'racing');
  const liveElapsedTime = raceState === 'racing' ? raceSession.elapsed() : elapsedTime;
  const nitro = Math.round(raceSession.nitro);
  const vehiclePos = getVehiclePosition();

  React.useEffect(() => {
    if (raceState === 'countdown') setHasSaved(false);
  }, [raceState]);

  // Distance and compass angle to next target ring
  const navData = useMemo(() => {
    if (!vehiclePos || !targetRingPosition) return null;
    const dx = targetRingPosition[0] - vehiclePos[0];
    const dz = targetRingPosition[2] - vehiclePos[2];
    const distance = Math.round(Math.hypot(dx, dz));
    // Heading relative to the chase camera, whose forward direction is local +Z.
    const angleRad = getVehicleRotation() - Math.atan2(dx, dz);
    const angleDeg = (angleRad * 180) / Math.PI;
    return { distance, angleDeg };
  }, [vehiclePos, targetRingPosition, now]);

  // Keyboard shortcut [E] to start race when near gate
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || !canHandleGameKey(e, controlsEnabled)) return;
      if ((e.key === 'e' || e.key === 'E') && isNearStartGate && raceState === 'idle') {
        e.preventDefault();
        sounds.playClick();
        onStartRace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [controlsEnabled, isNearStartGate, raceState, onStartRace]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotName.trim()) return;
    onSaveScore(pilotName.trim());
    setHasSaved(true);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-4 select-none">
      {(raceState === 'countdown' || raceState === 'racing') && (
        <div className="pointer-events-auto absolute left-3 bottom-3 sm:bottom-6 w-52 rounded-xl border border-cyan-500/30 bg-slate-950/85 p-3 text-xs font-mono">
          <div className="flex justify-between text-cyan-200 mb-2"><span>NITRO · Shift / Turbo</span><span>{nitro}%</span></div>
          <div className="text-slate-300 mb-2">Velocidade · {Math.round(raceSession.speed)} u/s</div>
          <div role="progressbar" aria-label="Carga de nitro" aria-valuemin={0} aria-valuemax={100} aria-valuenow={nitro} className="h-2 rounded bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${nitro}%` }} />
          </div>
          <p className="text-slate-400 mt-2 hidden sm:block">W / ↑ acelerar · S / ↓ frear</p>
          <button onClick={onCancelRace} className="mt-2 text-slate-300 hover:text-white cursor-pointer">Cancelar corrida · Esc</button>
        </div>
      )}
      {/* 1. PROMPT CARD: When player is near Start Gate next to the Sun */}
      <AnimatePresence>
        {controlsEnabled && isNearStartGate && raceState === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute bottom-10 left-1/2 -translate-x-1/2 max-w-sm w-full bg-[#0c1017]/95 border border-slate-800/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <MaterialIcon name="flag" size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-sans font-bold text-slate-100 tracking-tight">
                    Circuito Cósmico
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Contra o Tempo
                  </span>
                </div>
              </div>
              {bestTime !== null && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#111622]/80 border border-slate-800 text-[10px] font-mono text-amber-300">
                  <MaterialIcon name="emoji_events" className="text-amber-400" size={14} />
                  <span>{formatRaceTime(bestTime)}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 font-sans mb-3 leading-relaxed">
              Complete uma volta entre os asteroides e retorne à largada. Use Shift ou Turbo para o nitro; acerte o centro dos anéis para recarregar!
            </p>

            <button
              onClick={() => {
                sounds.playClick();
                onStartRace();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-lg active:scale-98"
            >
              <span>Iniciar Corrida</span>
              <kbd className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/40 text-[10px] text-sky-200">
                E
              </kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. COUNTDOWN OVERLAY: 3... 2... 1... LARGADA! */}
      <AnimatePresence>
        {(raceState === 'countdown' || (raceState === 'racing' && liveElapsedTime < 0.7)) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              key={countdownNumber}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="font-sans font-extrabold text-6xl md:text-7xl tracking-tighter text-sky-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]"
            >
              {raceState === 'countdown' ? countdownNumber : 'LARGADA!'}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. LIVE RACING HUD: Stopwatch & Checkpoint Tracker */}
      <AnimatePresence>
        {raceState === 'racing' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-auto mx-auto mt-2 w-full sm:w-auto flex items-center justify-between gap-1.5 sm:gap-4 bg-[#0c1017]/90 border border-slate-800/80 rounded-2xl px-2 sm:px-4 py-2 shadow-2xl backdrop-blur-xl"
          >
            {/* Live Stopwatch */}
            <div className="flex items-center gap-2">
              <MaterialIcon name="timer" className="text-sky-400 animate-pulse" size={18} />
              <span className="font-mono text-lg font-bold text-sky-400 tracking-wider">
                {formatRaceTime(liveElapsedTime)}
              </span>
            </div>

            <div className="w-px h-5 bg-slate-800" />

            {/* Checkpoints Status */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono text-slate-300 whitespace-nowrap">
                Portal <strong className="text-white font-bold">{currentCheckpoint + 1}</strong> / {totalCheckpoints}
              </span>
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalCheckpoints }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx < currentCheckpoint
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : idx === currentCheckpoint
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Directional Guidance to Next Ring */}
            {navData && (
              <>
                <div className="w-px h-5 bg-slate-800" />
                <div
                  className={`flex items-center gap-1 px-1 sm:px-2.5 py-1 rounded-xl font-mono text-xs whitespace-nowrap transition-colors ${
                    navData.distance < 18
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-400/30'
                  }`}
                  title="Direção e distância até a próxima argola"
                >
                  <div
                    className="w-4 h-4 flex items-center justify-center transition-transform duration-100 ease-out"
                    style={{ transform: `rotate(${navData.angleDeg}deg)` }}
                  >
                    <MaterialIcon name="near_me" size={14} />
                  </div>
                  <span>
                    {navData.distance < 12 ? 'Na Mira!' : `${navData.distance}m`}
                  </span>
                </div>
              </>
            )}

            <div className="w-px h-5 bg-slate-800" />

            {/* Cancel race button */}
            <button
              onClick={() => {
                sounds.playClick();
                onCancelRace();
              }}
              title="Cancelar corrida"
              className="w-6 h-6 rounded-lg bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. RACE FINISHED MODAL: Victory celebration & Save score to ranking */}
      <AnimatePresence>
        {raceState === 'finished' && (
          <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-sm w-full bg-[#0c1017] border border-slate-800/80 rounded-2xl p-6 shadow-2xl text-center"
            >
              {/* Close Modal Button */}
              <button
                onClick={onCloseModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MaterialIcon name="close" size={18} />
              </button>

              {/* Victory Header */}
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-lg">
                <MaterialIcon name="emoji_events" size={26} />
              </div>

              <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-1">
                Circuito Concluído!
              </h2>
              <p className="text-xs text-slate-400 font-sans mb-4">
                Você completou o circuito e cruzou a linha de chegada.
              </p>

              {/* Time Display */}
              <div className="p-3 bg-[#111622]/80 border border-slate-800/80 rounded-xl mb-3">
                <span className="text-[11px] font-mono text-slate-400 block mb-1">
                  Tempo Final
                </span>
                <span className="font-mono text-3xl font-bold text-sky-400 tracking-wider">
                  {formatRaceTime(elapsedTime)}
                </span>
                {bestTime !== null && elapsedTime <= bestTime && (
                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-mono text-emerald-400">
                    <MaterialIcon name="auto_awesome" size={14} />
                    <span>Novo Recorde Pessoal!</span>
                  </div>
                )}
              </div>

              {/* XP Bonus */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium mb-5">
                <MaterialIcon name="auto_awesome" size={16} />
                <span>+200 XP de Piloto Adicionado</span>
              </div>

              {/* Save score to Ranking Form */}
              {!hasSaved ? (
                <form onSubmit={handleSave} className="space-y-3 mb-3">
                  <div className="text-left">
                    <label className="text-[11px] font-mono text-slate-300 block mb-1">
                      Salvar no Ranking de Pilotos:
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      placeholder="Seu nome ou callsign..."
                      value={pilotName}
                      onChange={(e) => setPilotName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#111622]/60 border border-slate-800/80 focus:border-sky-500/60 text-slate-100 font-mono text-xs focus:outline-none transition"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 font-mono text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-98"
                  >
                    <span>Salvar no Ranking</span>
                    <MaterialIcon name="arrow_forward" size={16} />
                  </button>
                </form>
              ) : (
                <div className="p-3 mb-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-300 font-mono text-xs">
                  <MaterialIcon name="check_circle" fill size={18} />
                  <span>Tempo salvo no Ranking com sucesso!</span>
                </div>
              )}

              {/* Retry button */}
              <button
                onClick={() => {
                  setHasSaved(false);
                  onRetryRace();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 font-mono text-xs font-medium transition cursor-pointer"
              >
                <MaterialIcon name="refresh" size={16} />
                <span>Correr Novamente</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
