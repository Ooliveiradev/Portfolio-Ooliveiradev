import React from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Compass,
  Globe,
  Cpu,
  Sparkles,
  FolderSearch,
  Send,
  Lock,
  CheckCircle2,
  X
} from 'lucide-react';
import { Badge, UserStats } from '../../types';
import { BADGES_DATA } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';

interface BadgesModalProps {
  stats: UserStats;
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ stats, onClose }) => {
  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'badge-ignition':
        return <Compass className="w-6 h-6" />;
      case 'badge-explorer':
        return <Globe className="w-6 h-6" />;
      case 'badge-coder':
        return <Cpu className="w-6 h-6" />;
      case 'badge-crystal':
        return <Sparkles className="w-6 h-6" />;
      case 'badge-inspector':
        return <FolderSearch className="w-6 h-6" />;
      case 'badge-contact':
        return <Send className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-fun font-bold text-white">
                Galeria de Conquistas & Badges
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {stats.unlockedBadges.length} de {BADGES_DATA.length} Desbloqueadas
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-6">
          <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
            <span>Progresso Geral</span>
            <span className="text-purple-400 font-bold">
              {Math.round((stats.unlockedBadges.length / BADGES_DATA.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(stats.unlockedBadges.length / BADGES_DATA.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {BADGES_DATA.map((badge) => {
            const isUnlocked = stats.unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-slate-950/80 border-purple-500/40 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-65'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isUnlocked
                          ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isUnlocked ? getBadgeIcon(badge.id) : <Lock className="w-5 h-5" />}
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                        isUnlocked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? '✓ CONQUISTADA' : 'BLOQUEADA'}
                    </span>
                  </div>

                  <h4
                    className={`text-sm font-fun font-bold ${
                      isUnlocked ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {badge.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-amber-400 font-bold">+{badge.xpReward} XP</span>
                  <span className="text-slate-500">
                    {isUnlocked ? 'Desbloqueada' : 'Aguardando ação'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
