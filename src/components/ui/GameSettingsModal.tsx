import { RANKING_KEY } from '../../utils/raceSession';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';
import { UserStats, CrystalCollectible, LeaderboardEntry, RaceLeaderboardEntry, GraphicsQuality } from '../../types';
import { PERSONAL_INFO, BADGES_DATA, INITIAL_LEADERBOARD, INITIAL_RACE_LEADERBOARD } from '../../data/portfolioData';
import { detectWebGPUSupport, WebGPUCapability } from '../../utils/webgpuDetector';

export type SettingsTab = 'home' | 'options' | 'controls' | 'achievements' | 'ranking' | 'behind' | 'about';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onRespawnVehicle: () => void;
  onResetCrystals?: () => void;
  stats: UserStats;
  crystals: CrystalCollectible[];
  initialTab?: SettingsTab;
  graphicsQuality?: GraphicsQuality;
  onSelectGraphicsQuality?: (quality: GraphicsQuality) => void;
  onUpdateStats?: (newStats: UserStats) => void;
  onAvatarClick?: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  onRespawnVehicle,
  onResetCrystals,
  stats,
  crystals,
  initialTab = 'options',
  graphicsQuality = 'mid',
  onSelectGraphicsQuality,
  onUpdateStats,
  onAvatarClick,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [controlsSubTab, setControlsSubTab] = useState<'keyboard' | 'touch'>('keyboard');

  // WebGPU & Hardware Telemetry (Issue 16)
  const [gpuCapability, setGpuCapability] = useState<WebGPUCapability | null>(null);

  useEffect(() => {
    detectWebGPUSupport().then(setGpuCapability);
  }, []);

  // Ranking & Leaderboard state
  const [rankingCategory, setRankingCategory] = useState<'xp' | 'race'>('xp');
  const [playerName, setPlayerName] = useState('');
  const [savedScore, setSavedScore] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
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

  const [raceLeaderboard, setRaceLeaderboard] = useState<RaceLeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem(RANKING_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_RACE_LEADERBOARD;
  });

  if (!isOpen) return null;

  const collectedCount = crystals.filter((c) => c.collected).length;

  const getRankTitle = (xp: number) => {
    if (xp >= 1400) return 'Comandante Supremo';
    if (xp >= 1000) return 'Piloto Estelar';
    if (xp >= 600) return 'Engenheiro Galáctico';
    if (xp >= 300) return 'Navegador Cósmico';
    return 'Cadete Estelar';
  };

  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'badge-ignition':
        return <MaterialIcon name="explore" size={20} />;
      case 'badge-explorer':
        return <MaterialIcon name="public" size={20} />;
      case 'badge-coder':
        return <MaterialIcon name="code" size={20} />;
      case 'badge-crystal-novice':
        return <MaterialIcon name="diamond" size={20} />;
      case 'badge-crystal':
        return <MaterialIcon name="auto_awesome" size={20} />;
      case 'badge-inspector':
        return <MaterialIcon name="manage_search" size={20} />;
      case 'badge-contact':
        return <MaterialIcon name="send" size={20} />;
      case 'badge-speedster':
        return <MaterialIcon name="flag" size={20} />;
      case 'badge-supersonic':
        return <MaterialIcon name="bolt" size={20} />;
      case 'badge-boost-master':
        return <MaterialIcon name="rocket_launch" size={20} />;
      case 'badge-orbit-drifter':
        return <MaterialIcon name="wb_sunny" size={20} />;
      case 'badge-easter-asteroid':
        return <MaterialIcon name="filter_drama" size={20} />;
      case 'badge-secret-voyager':
        return <MaterialIcon name="near_me" size={20} />;
      case 'badge-event-horizon':
        return <MaterialIcon name="radar" size={20} />;
      case 'badge-scholar':
        return <MaterialIcon name="school" size={20} />;
      case 'badge-technologist':
        return <MaterialIcon name="terminal" size={20} />;
      case 'badge-perfectionist':
        return <MaterialIcon name="military_tech" size={20} />;
      default:
        return <MaterialIcon name="military_tech" size={20} />;
    }
  };

  const handleExportSaveGame = () => {
    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      stats,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galactic-portfolio-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playCoin();
  };

  const handleImportSaveGame = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && parsed.stats && typeof parsed.stats.xp === 'number') {
          onUpdateStats?.(parsed.stats);
          sounds.playBadgeUnlocked();
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.5 },
          });
          alert('Progresso galáctico restaurado com sucesso!');
        } else {
          alert('Arquivo de save inválido.');
        }
      } catch {
        alert('Erro ao ler arquivo de progresso.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      name: playerName.trim(),
      score: stats.xp,
      badgesCount: stats.unlockedBadges.length,
      title: getRankTitle(stats.xp),
      date: 'Hoje',
    };

    const updated = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updated);
    setSavedScore(true);
    sounds.playBadgeUnlocked();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });

    try {
      localStorage.setItem('galactic_portfolio_ranking', JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleCopySummary = () => {
    const text = `🚀 Explorei o Universo 3D de ${PERSONAL_INFO.name}!
🏆 Pontuação: ${stats.xp} XP (${getRankTitle(stats.xp)})
🎖️ Conquistas Desbloqueadas: ${stats.unlockedBadges.length}/${BADGES_DATA.length}
💎 Cristais Coletados: ${collectedCount}/{crystals.length}
🌌 Ilhas Visitadas: ${stats.visitedIslands.length}/5
Confira em: ${window.location.href}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    sounds.playCoin();
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Outer Container with Top Tab Bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-end max-w-4xl w-full"
          role="dialog"
          aria-modal="true"
          aria-label="Menu do portfólio"
        >
          <div className="max-w-full flex items-center bg-[#0c1017] border border-b-0 border-slate-800/80 rounded-t-2xl overflow-hidden shrink-0">
            <nav className="min-w-0 flex items-center" aria-label="Seções do menu">
              {([
                ['home', 'home', 'Início'],
                ['options', 'settings', 'Configurações'],
                ['controls', 'sports_esports', 'Controles'],
                ['achievements', 'military_tech', 'Conquistas'],
                ['ranking', 'leaderboard', 'Ranking'],
                ['behind', 'code', 'Bastidores'],
                ['about', 'person', 'Sobre mim'],
              ] as const).map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { sounds.playClick(); setActiveTab(id); }}
                  aria-label={label}
                  aria-pressed={activeTab === id}
                  title={label}
                  className={`h-10 w-9 sm:w-10 flex items-center justify-center border-r border-slate-800/80 last:border-r-0 shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-400 ${activeTab === id ? 'bg-slate-800/70 text-sky-400' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'}`}
                >
                  <MaterialIcon name={icon} size={17} />
                </button>
              ))}
            </nav>
            <button type="button" onClick={() => { sounds.playClick(); onClose(); }} className="w-9 sm:w-10 h-10 shrink-0 flex items-center justify-center bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer border-l border-slate-800/80 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-400" aria-label="Fechar menu" title="Fechar (ESC)">
              <MaterialIcon name="close" size={18} />
            </button>
          </div>

          {/* Modal Main Body Card (Fixed Dimensions Two Column Split) */}
          <div className="w-full bg-[#0c1017] border border-slate-800/80 rounded-b-2xl rounded-tl-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[580px] max-h-[calc(100dvh-7rem)]">
            {activeTab === 'about' && (
              <aside className="w-full md:w-64 p-5 md:p-8 flex flex-row md:flex-col items-center justify-center gap-4 md:gap-5 bg-[#101620] border-b md:border-b-0 md:border-r border-slate-800/80 shrink-0" aria-label="Perfil do desenvolvedor">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); onAvatarClick?.(); }}
                  className="w-20 h-20 md:w-40 md:h-40 rounded-full border border-slate-700/80 bg-[#0b1018] overflow-hidden shrink-0 cursor-pointer hover:border-sky-400/60 transition-colors"
                  aria-label="Avatar de Danilo Ribeiro"
                >
                  <img
                    src="assets/danilo-ribeiro.jpg"
                    alt="Danilo Ribeiro"
                    className="h-full w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                  />
                </button>
                <div className="md:text-center">
                  <p className="text-sm font-semibold text-slate-100">{PERSONAL_INFO.name}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{PERSONAL_INFO.title}</p>
                </div>
              </aside>
            )}

            {/* Right Column: Fixed Height Tab Content */}
            <div className="flex-1 min-h-0 min-w-0 p-5 sm:p-8 flex flex-col justify-between overflow-hidden">
              {/* Scrollable Tab Content Container */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2">
                {/* TAB 1: HOME */}
              {activeTab === 'home' && (
                <div>
                  <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                    <span>Universo 3D Interativo</span>
                  </h2>
                  <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-sans">
                    <p className="text-base text-slate-200">
                      Olá e seja muito bem-vindo! 👋
                    </p>
                    <p>
                      Meu nome é <strong className="text-slate-100 font-semibold">{PERSONAL_INFO.name}</strong>, sou desenvolvedor focado em engenharia de software full-stack e experiências 3D WebGL imersivas.
                    </p>
                    <p>
                      Este portfólio foi concebido como um universo diorama explorável em tempo real: pilote o foguete pelo sistema solar com <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded text-xs font-mono text-sky-300">W</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded text-xs font-mono text-sky-300">A</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded text-xs font-mono text-sky-300">S</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded text-xs font-mono text-sky-300">D</kbd>, colete cristais de energia, desbloqueie badges e inspecione cada planeta para descobrir meus projetos, competências e trajetória profissional.
                    </p>
                    <div className="p-3 bg-[#111622]/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 flex items-center gap-2.5 mt-2">
                      <span className="text-sky-400 font-mono text-sm">💡</span>
                      <span>Dica: Aproxime-se dos planetas para atracar e pressione <kbd className="px-1.5 py-0.5 bg-slate-800/90 border border-slate-700/80 rounded font-mono text-sky-300 text-[10px]">ESPAÇO</kbd> para turbo!</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPTIONS */}
              {activeTab === 'options' && (
                <div>
                  <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                    <span>Opções & Configurações</span>
                  </h2>

                  <div className="space-y-2.5 font-sans">
                    {/* Audio Option */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111622]/50 hover:bg-[#111622]/80 border border-slate-800/60 hover:border-slate-700/80 transition">
                      <div>
                        <span className="text-sm font-medium text-slate-200 font-mono block">
                          Áudio & Efeitos Sonoros
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Música ambiente e sons da nave
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onToggleMute();
                        }}
                        className={`w-28 py-1.5 rounded-xl border text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          !isMuted
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {!isMuted ? (
                          <>
                            <MaterialIcon name="volume_up" className="text-emerald-400" size={14} />
                            <span>Ligado</span>
                          </>
                        ) : (
                          <>
                            <MaterialIcon name="volume_off" className="text-rose-400" size={14} />
                            <span>Mudo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quality Mode: Low / Mid / High */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#111622]/50 hover:bg-[#111622]/80 border border-slate-800/60 hover:border-slate-700/80 transition gap-2">
                      <div>
                        <span className="text-sm font-medium text-slate-200 font-mono block">
                          Qualidade gráfica
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {graphicsQuality === 'low'
                            ? 'Prioriza fluidez e reduz os efeitos visuais'
                            : graphicsQuality === 'mid'
                            ? 'Equilíbrio entre detalhes e desempenho'
                            : 'Mais detalhes, sombras e efeitos visuais'}
                        </span>
                      </div>
                      <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5 shrink-0 self-start sm:self-auto">
                        {(['low', 'mid', 'high'] as const).map((tier) => (
                          <button
                            key={tier}
                            aria-pressed={graphicsQuality === tier}
                            onClick={() => {
                              sounds.playClick();
                              onSelectGraphicsQuality?.(tier);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition capitalize cursor-pointer ${
                              graphicsQuality === tier
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200 border border-transparent'
                            }`}
                          >
                            {tier === 'low' ? 'Low' : tier === 'mid' ? 'Mid' : 'High'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* I'm stuck! (Respawn) */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#111622]/50 hover:bg-[#111622]/80 border border-slate-800/60 hover:border-slate-700/80 transition">
                      <div>
                        <span className="text-sm font-medium text-slate-200 font-mono block">
                          Recuperar Posição
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Teleporta o foguete de volta para órbita segura
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playBoost();
                          onRespawnVehicle();
                          onClose();
                        }}
                        className="w-28 py-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-mono font-medium transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <MaterialIcon name="refresh" className="text-sky-400" size={14} />
                        <span>Respawn</span>
                      </button>
                    </div>

                    {/* Reset Collectibles */}
                    {onResetCrystals && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#111622]/50 hover:bg-[#111622]/80 border border-slate-800/60 hover:border-slate-700/80 transition">
                        <div>
                          <span className="text-sm font-medium text-slate-200 font-mono block">
                            Cristais Orbitais
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Reinicia os cristais no espaço ({collectedCount}/{crystals.length} coletados)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onResetCrystals();
                          }}
                          className="w-28 py-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-slate-300 text-xs font-mono font-medium transition cursor-pointer"
                        >
                          Resetar ({collectedCount}/{crystals.length})
                        </button>
                      </div>
                    )}

                    <details className="rounded-xl border border-slate-800/60 text-slate-400">
                      <summary className="px-3 py-3 text-xs cursor-pointer hover:text-slate-200">Informações do dispositivo</summary>
                      <div className="px-3 pb-3">
                    {/* WebGPU & Hardware Telemetry (Issue 16: Future-Proofing) */}
                    <div className="flex flex-col p-3 rounded-xl bg-[#111622]/50 hover:bg-[#111622]/80 border border-slate-800/60 hover:border-slate-700/80 transition gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MaterialIcon name="memory" className="text-purple-400" size={18} />
                          <div>
                            <span className="text-sm font-medium text-slate-200 font-mono block">
                              Pipeline Gráfica & Hardware
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Renderização Three.js com qualidade adaptativa
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                            gpuCapability?.isSupported
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                          }`}
                        >
                          WebGL 2.0 Ativo
                        </span>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col gap-1.5 text-[11px] font-mono">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Adaptador GPU:</span>
                          <span className="text-slate-200 truncate max-w-[220px] text-right font-medium">
                            {gpuCapability?.adapterName || 'Detectando GPU...'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Backend Gráfico:</span>
                          <span className="text-emerald-400 font-medium">
                            WebGL 2.0
                          </span>
                        </div>
                        {gpuCapability?.isSupported && (
                          <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800/50">
                            <span>Compatibilidade WebGPU:</span>
                            <span className="text-purple-300">Disponível no navegador</span>
                          </div>
                        )}
                      </div>
                    </div>
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTROLS */}
              {activeTab === 'controls' && (
                <div>
                  <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-4 flex items-center gap-2">
                    <span>Comandos & Controles</span>
                  </h2>

                  {/* Sub-tabs: Keyboard vs Touch */}
                  <div className="flex items-center gap-2 mb-4 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
                    <button
                      onClick={() => setControlsSubTab('keyboard')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        controlsSubTab === 'keyboard'
                          ? 'bg-slate-800 text-sky-300 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Teclado & Mouse
                    </button>
                    <button
                      onClick={() => setControlsSubTab('touch')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                        controlsSubTab === 'touch'
                          ? 'bg-slate-800 text-sky-300 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Touch / Mobile
                    </button>
                  </div>

                  {controlsSubTab === 'keyboard' ? (
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622]/50 border border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold">WASD</kbd>
                          <span className="text-slate-500">ou</span>
                          <kbd className="px-2 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold">SETAS</kbd>
                        </div>
                        <span className="text-slate-300">Acelerar, ré e curvas A/D</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622]/50 border border-slate-800/60">
                        <kbd className="px-2.5 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold">ESPAÇO</kbd>
                        <span className="text-slate-300">Impulso Turbo (Boost)</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622]/50 border border-slate-800/60">
                        <kbd className="px-2 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold">R</kbd>
                        <span className="text-slate-300">Respawn de emergência</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622]/50 border border-slate-800/60">
                        <kbd className="px-2 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold">ESC</kbd>
                        <span className="text-slate-300">Abrir / Fechar este menu</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111622]/50 border border-slate-800/60">
                        <span className="px-2 py-1 bg-slate-800/90 border border-slate-700/80 rounded text-slate-200 font-bold text-[11px]">CLIQUE NO MAPA / 3D</span>
                        <span className="text-slate-300">Navegar e atracar em ilhas</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 font-sans text-xs text-slate-300">
                      <div className="p-3.5 bg-[#111622]/50 border border-slate-800/60 rounded-xl">
                        <p className="font-bold text-slate-100 mb-1 font-mono">Joystick Virtual (Canto Inferior Esquerdo)</p>
                        <p className="text-slate-400">Arraste o botão analógico em qualquer direção para guiar a proa do foguete.</p>
                      </div>
                      <div className="p-3.5 bg-[#111622]/50 border border-slate-800/60 rounded-xl">
                        <p className="font-bold text-slate-100 mb-1 font-mono">Botão de Turbo (Canto Inferior Direito)</p>
                        <p className="text-slate-400">Toque no ícone de relâmpago para ativar a propulsão máxima com partículas estendidas.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: ACHIEVEMENTS & BADGES (Unified!) */}
              {activeTab === 'achievements' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight">
                        Conquistas & Badges
                      </h2>
                      <p className="text-xs text-slate-400 font-sans">
                        Conquistas acumuladas durante a exploração do sistema
                      </p>
                    </div>
                    <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      {stats.unlockedBadges.length} / {BADGES_DATA.length} Desbloqueadas
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#111622]/50 p-3 rounded-xl border border-slate-800/60 mb-4">
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
                      <span>Progresso Geral</span>
                      <span className="text-emerald-400 font-bold">
                        {Math.round((stats.unlockedBadges.length / BADGES_DATA.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(stats.unlockedBadges.length / BADGES_DATA.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Badges Grid (Mapped from BADGES_DATA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BADGES_DATA.map((badge) => {
                      const isUnlocked = stats.unlockedBadges.includes(badge.id);
                      return (
                        <div
                          key={badge.id}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                            isUnlocked
                              ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                              : 'bg-[#111622]/40 border-slate-800/60 opacity-60'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800/60 text-slate-600'
                            }`}
                          >
                            {isUnlocked ? getBadgeIcon(badge.id) : <MaterialIcon name="lock" size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-mono font-bold truncate ${
                                  isUnlocked ? 'text-slate-100' : 'text-slate-400'
                                }`}
                              >
                                {badge.title}
                              </span>
                              <span className="text-[10px] font-mono text-sky-400 font-semibold shrink-0">
                                +{badge.xpReward} XP
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {badge.description}
                            </p>
                            <span
                              className={`inline-block text-[9px] font-mono uppercase font-medium mt-1 px-1.5 py-0.5 rounded ${
                                isUnlocked
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800/60 text-slate-500'
                              }`}
                            >
                              {isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Crystals Swatch Bar */}
                  <div className="mt-4 p-3 bg-[#111622]/50 border border-slate-800/60 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-medium text-slate-200 block">
                        Cristais Orbitais
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {collectedCount} de 8 coletados no espaço
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-md border text-[9px] flex items-center justify-center font-mono font-bold ${
                            idx < collectedCount
                              ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                              : 'bg-slate-900 border-slate-800 text-slate-600'
                          }`}
                        >
                          💎
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Backup & Save Game Progression (Export/Import) */}
                  <div className="mt-3.5 p-3 bg-[#111622]/50 border border-slate-800/60 rounded-xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-200 block">
                        Backup de Progresso (Save Game)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Exporte ou restaure suas conquistas e XP em qualquer dispositivo
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportSaveGame}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-sky-400/40 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                        title="Baixar arquivo de progresso JSON"
                      >
                        <MaterialIcon name="download" size={15} className="text-sky-400" />
                        <span>Exportar</span>
                      </button>

                      <label className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-emerald-400/40 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <MaterialIcon name="upload" size={15} className="text-emerald-400" />
                        <span>Importar</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportSaveGame}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RANKING / HALL DA FAMA (Contained inside Settings!) */}
              {activeTab === 'ranking' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight">
                        Ranking dos Visitantes
                      </h2>
                      <p className="text-xs text-slate-400 font-sans">
                        Quadro de pontuações e melhores navegadores cósmicos
                      </p>
                    </div>
                    <button
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <MaterialIcon name="share" size={14} />
                      <span>{copiedSummary ? 'Copiado!' : 'Compartilhar'}</span>
                    </button>
                  </div>

                  {/* Ranking Category Switcher */}
                  <div className="flex gap-2 mb-4 p-1 bg-[#0c1017] border border-slate-800/80 rounded-xl font-mono text-xs">
                    <button
                      onClick={() => setRankingCategory('xp')}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer ${
                        rankingCategory === 'xp'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Pontuação Geral (XP)
                    </button>
                    <button
                      onClick={() => setRankingCategory('race')}
                      className={`flex-1 py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        rankingCategory === 'race'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Circuito de Corrida</span>
                      <span>🏁</span>
                    </button>
                  </div>

                  {rankingCategory === 'xp' ? (
                    <>
                      {/* Player Current Score Badge */}
                      <div className="p-3.5 bg-[#111622]/80 border border-slate-800/80 rounded-xl mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-base">
                            ⚡
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-slate-100">
                                Sua Pontuação Atual
                              </span>
                              <span className="text-[10px] font-mono text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                                {getRankTitle(stats.xp)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 font-sans">
                              {stats.unlockedBadges.length} Conquistas • {collectedCount} Cristais
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-mono font-black text-sky-300 block">
                            {stats.xp}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">XP TOTAL</span>
                        </div>
                      </div>

                      {/* Submit Score Form */}
                      {!savedScore ? (
                        <form onSubmit={handleSaveScore} className="mb-4 flex gap-2">
                          <input
                            type="text"
                            placeholder="Digite seu nome para o Hall da Fama..."
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={24}
                            className="flex-1 bg-[#07090e] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition shadow-md cursor-pointer"
                          >
                            Registrar
                          </button>
                        </form>
                      ) : (
                        <div className="mb-4 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300">
                          <MaterialIcon name="check" className="text-emerald-400" size={16} />
                          <span>Sua pontuação foi gravada com sucesso no Ranking!</span>
                        </div>
                      )}

                      {/* Top 10 Leaderboard List */}
                      <div className="space-y-1.5 font-mono text-xs">
                        {leaderboard.map((entry, index) => (
                          <div
                            key={entry.id || index}
                            className={`flex items-center justify-between p-2 rounded-xl border transition ${
                              index === 0
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                                : index === 1
                                ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                                : index === 2
                                ? 'bg-amber-950/20 border-amber-700/40 text-amber-400/90'
                                : 'bg-[#111622]/50 border-slate-800/60 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-6 text-center font-bold ${
                                  index === 0
                                    ? 'text-amber-400 text-sm'
                                    : index === 1
                                    ? 'text-slate-300 text-sm'
                                    : index === 2
                                    ? 'text-amber-600 text-sm'
                                    : 'text-slate-600'
                                }`}
                              >
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                              </span>
                              <div>
                                <span className="font-bold text-slate-200 block">
                                  {entry.name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {entry.title} • {entry.badgesCount} badges
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-sky-400">
                                {entry.score} XP
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {entry.date}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* RACE LEADERBOARD LIST */
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="p-3 bg-[#111622]/60 border border-slate-800/80 rounded-xl mb-3 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Circuito Solar (6 Argolas)</span>
                        <span className="text-amber-400 font-bold">Classificação por Menor Tempo</span>
                      </div>

                      {raceLeaderboard.map((entry, index) => (
                        <div
                          key={entry.id || index}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                            index === 0
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : index === 1
                              ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                              : index === 2
                              ? 'bg-amber-950/20 border-amber-700/40 text-amber-400/90'
                              : 'bg-[#111622]/50 border-slate-800/60 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 text-center font-bold ${
                                index === 0
                                  ? 'text-amber-400 text-sm'
                                  : index === 1
                                  ? 'text-slate-300 text-sm'
                                  : index === 2
                                  ? 'text-amber-600 text-sm'
                                  : 'text-slate-600'
                              }`}
                            >
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                            <div>
                              <span className="font-bold text-slate-200 block">
                                {entry.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                Piloto Cósmico • {entry.date}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sky-400 text-sm">
                              {entry.formattedTime}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              TEMPO TOTAL
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: BEHIND THE SCENE */}
              {activeTab === 'behind' && (
                <div>
                  <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-4">
                    Behind the Scenes & Stack
                  </h2>
                  <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed font-sans">
                    <p>
                      Este portfólio une modelagem estilizada em baixa contagem de polígonos (low-poly), simulação física em tempo real e arquitetura moderna:
                    </p>

                    <div className="p-3 bg-[#111622]/50 border border-slate-800/60 rounded-xl space-y-1">
                      <p className="font-bold text-sky-400 font-mono">REACT THREE FIBER & THREE.JS</p>
                      <p className="text-slate-400 text-[11px]">
                        Renderização WebGL 3D declarativa com câmera isométrica diorama, sombras de baixa complexidade e partículas poliédricas de dispersão.
                      </p>
                    </div>

                    <div className="p-3 bg-[#111622]/50 border border-slate-800/60 rounded-xl space-y-1">
                      <p className="font-bold text-sky-400 font-mono">RAPIER 3D (WASM ENGINE)</p>
                      <p className="text-slate-400 text-[11px]">
                        Simulação física de corpo rígido compilada em WebAssembly com inércia, rotação angular suave e detonações ao colidir com o Sol central.
                      </p>
                    </div>

                    <div className="p-3 bg-[#111622]/50 border border-slate-800/60 rounded-xl space-y-1">
                      <p className="font-bold text-sky-400 font-mono">PROCEDURAL WEB AUDIO API</p>
                      <p className="text-slate-400 text-[11px]">
                        Todos os efeitos sonoros (explosões, motor turbo, coleta de cristais e badges) gerados dinamicamente via síntese de ondas sem arquivos pesados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ABOUT DEVELOPER */}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-xl font-sans font-bold text-slate-100 tracking-tight mb-4">
                    Sobre mim
                  </h2>
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
                    <p className="text-sm font-semibold text-slate-100">
                      {PERSONAL_INFO.name} — {PERSONAL_INFO.title}
                    </p>
                    <p className="text-slate-400">
                      {PERSONAL_INFO.bio}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <a
                        href={PERSONAL_INFO.github}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 rounded-xl font-mono text-xs flex items-center gap-1.5 transition"
                      >
                        <span>GitHub</span>
                        <MaterialIcon name="open_in_new" className="text-slate-400" size={14} />
                      </a>
                      <a
                        href={PERSONAL_INFO.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-sky-600/80 hover:bg-sky-500 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <span>LinkedIn</span>
                        <MaterialIcon name="open_in_new" className="text-white/80" size={14} />
                      </a>
                      <a
                        href={`mailto:${PERSONAL_INFO.email}`}
                        className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-slate-200 rounded-xl font-mono text-xs flex items-center gap-1.5 transition"
                      >
                        <span>Enviar Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* Bottom Card Footer - Always pinned at bottom */}
              <div className="pt-3 mt-4 border-t border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
                <span>Versão 2.5 — Low-Poly 3D Minimal</span>
                <span className="text-slate-400">Pressione <kbd className="px-1.5 py-0.5 bg-slate-800/90 rounded border border-slate-700/80 text-slate-300 text-[10px]">ESC</kbd> para fechar</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
