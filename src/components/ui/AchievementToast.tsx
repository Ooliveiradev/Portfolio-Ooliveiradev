import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { Badge } from '../../types';
import confetti from 'canvas-confetti';
import { sounds } from '../../audio/soundManager';

interface AchievementToastProps {
  achievement: Badge | null;
  onClose: () => void;
}

/**
 * AchievementToast
 * Notificação cinematográfica suspensa no topo ao desbloquear uma conquista.
 * Inspiração: Folio-2025 e jogos AAA (PlayStation Trophies / Steam Achievements).
 */
export const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  useEffect(() => {
    if (!achievement) return;

    // 1. Som triunfal de desbloqueio
    sounds.playBadgeUnlocked();

    // 2. Disparo de partículas cósmicas douradas
    confetti({
      particleCount: 45,
      spread: 65,
      origin: { y: 0.15 },
      colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#ffffff'],
      disableForReducedMotion: true,
    });

    // 3. Auto-dismiss após 4.5s
    const timer = setTimeout(() => {
      onClose();
    }, 4500);

    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none max-w-sm sm:max-w-md w-full px-4">
      <AnimatePresence>
        {achievement && (
          <motion.div
            initial={{ opacity: 0, y: -35, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="pointer-events-auto relative overflow-hidden bg-[#0a0f18]/95 backdrop-blur-2xl border-2 border-amber-400/70 shadow-[0_0_35px_rgba(245,158,11,0.35)] rounded-2xl p-3 sm:p-3.5 flex items-center gap-3.5"
          >
            {/* Feixe de luz estelar de fundo */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />

            {/* Medalha Holográfica Dourada */}
            <div className="relative shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-lg shadow-amber-500/30">
              <div className="w-full h-full bg-[#0a0f18] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                {/* Brilho giratório sutil */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-400/20 to-transparent animate-[spin_6s_linear_infinite]" />
                <MaterialIcon name="military_tech" fill className="text-amber-300 relative z-10" size={26} />
              </div>
            </div>

            {/* Informações da Conquista */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1">
                  <MaterialIcon name="stars" fill size={12} className="text-amber-400" />
                  CONQUISTA DESBLOQUEADA!
                </span>
              </div>

              <h4 className="text-sm font-sans font-bold text-slate-100 truncate tracking-tight">
                {achievement.title}
              </h4>

              <p className="text-xs text-slate-300 line-clamp-1 font-sans -mt-0.5">
                {achievement.description}
              </p>
            </div>

            {/* Recompensa de XP */}
            <div className="shrink-0 flex flex-col items-end pl-1">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/40 shadow-sm flex items-center gap-0.5">
                <MaterialIcon name="bolt" fill size={13} className="text-emerald-400" />
                +{achievement.xpReward} XP
              </span>
            </div>

            {/* Botão de Fechar */}
            <button
              onClick={onClose}
              className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition cursor-pointer"
              title="Dispensar"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
