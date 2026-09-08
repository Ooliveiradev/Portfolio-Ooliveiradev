import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Share2,
  Check,
  Send,
  User,
  X
} from 'lucide-react';
import { LeaderboardEntry, UserStats } from '../../types';
import { INITIAL_LEADERBOARD, PERSONAL_INFO } from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';

interface LeaderboardModalProps {
  stats: UserStats;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  stats,
  onClose,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [saved, setSaved] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Read saved leaderboard from localStorage or default to INITIAL_LEADERBOARD
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const savedData = localStorage.getItem('galactic_portfolio_ranking');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch {
      // fallback
    }
    return INITIAL_LEADERBOARD;
  });

  const getTitle = (xp: number) => {
    if (xp >= 1400) return 'Comandante Supremo';
    if (xp >= 1000) return 'Piloto Estelar';
    if (xp >= 600) return 'Engenheiro Galáctico';
    if (xp >= 300) return 'Navegador Cósmico';
    return 'Cadete Estelar';
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: playerName.trim(),
      score: stats.xp,
      badgesCount: stats.unlockedBadges.length,
      title: getTitle(stats.xp),
      date: 'Hoje',
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updated);
    setSaved(true);
    sounds.playBadgeUnlocked();

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
    });

    try {
      localStorage.setItem('galactic_portfolio_ranking', JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleCopySummary = () => {
    const text = `🚀 Explorei o Portfólio 3D de ${PERSONAL_INFO.name}!
🏆 Pontuação: ${stats.xp} XP (${getTitle(stats.xp)})
🎖️ Badges Desbloqueadas: ${stats.unlockedBadges.length}/6
🌌 Ilhas Visitadas: ${stats.visitedIslands.length}/5
Confira em: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    sounds.playCoin();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-fun font-bold text-white">
                Hall da Fama Galáctico
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Ranking Oficial dos Visitantes & Recrutadores
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

        {/* Current User Score Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 mb-6 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
              Sua Pontuação Atual
            </span>
            <div className="text-2xl font-fun font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>{stats.xp} XP</span>
              <span className="text-xs font-mono font-medium text-slate-400">
                ({getTitle(stats.xp)})
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 block">Conquistas</span>
            <span className="text-sm font-bold text-purple-400">
              {stats.unlockedBadges.length}/6 Badges
            </span>
          </div>
        </div>

        {/* Register Name Form if not saved yet */}
        {!saved ? (
          <form onSubmit={handleSaveScore} className="mb-6 space-y-2">
            <label className="text-xs font-mono text-slate-300 block font-semibold">
              Grave seu nome no Hall da Fama:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Seu nome ou @usuário..."
                maxLength={25}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-fun font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Salvar</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center justify-between">
            <span>✓ Seu recorde foi gravado com sucesso!</span>
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 text-slate-200 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px] cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              <span>{copiedSummary ? 'Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono uppercase text-slate-500 px-3">
            <span>Posição &amp; Piloto</span>
            <span>Título / XP</span>
          </div>

          <div className="space-y-1.5">
            {leaderboard.map((entry, index) => {
              const isTop3 = index < 3;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    entry.name === playerName && saved
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        index === 0
                          ? 'bg-amber-500 text-black'
                          : index === 1
                          ? 'bg-slate-300 text-black'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-fun font-bold text-white flex items-center gap-1.5">
                        <span>{entry.name}</span>
                        {isTop3 && <Medal className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {entry.title}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      {entry.score} XP
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {entry.badgesCount} badges
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Button Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 text-xs font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>{copiedSummary ? 'Relatório Copiado!' : 'Copiar Certificado de Pontos'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-white transition-colors cursor-pointer"
          >
            Continuar Explorando
          </button>
        </div>
      </motion.div>
    </div>
  );
};
