import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Home,
  Settings,
  Gamepad2,
  Award,
  Trophy,
  Sparkles,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  ExternalLink,
  Layers,
  Globe,
  Compass,
  Cpu,
  FolderSearch,
  Send,
  Lock,
  Medal,
  Share2,
  UserCheck
} from 'lucide-react';
import { sounds } from '../../audio/soundManager';
import { CameraViewMode, UserStats, CrystalCollectible, LeaderboardEntry } from '../../types';
import { PERSONAL_INFO, BADGES_DATA, INITIAL_LEADERBOARD } from '../../data/portfolioData';

export type SettingsTab = 'home' | 'options' | 'controls' | 'achievements' | 'ranking' | 'behind' | 'about';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  cameraViewMode: CameraViewMode;
  onSelectCameraMode: (mode: CameraViewMode) => void;
  onRespawnVehicle: () => void;
  onResetCrystals?: () => void;
  stats: UserStats;
  crystals: CrystalCollectible[];
  initialTab?: SettingsTab;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onToggleMute,
  cameraViewMode,
  onSelectCameraMode,
  onRespawnVehicle,
  onResetCrystals,
  stats,
  crystals,
  initialTab = 'options',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [controlsSubTab, setControlsSubTab] = useState<'keyboard' | 'touch'>('keyboard');
  const [qualityMode, setQualityMode] = useState<'high' | 'balanced'>('high');

  // Ranking & Leaderboard state
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
        return <Compass className="w-5 h-5" />;
      case 'badge-explorer':
        return <Globe className="w-5 h-5" />;
      case 'badge-coder':
        return <Cpu className="w-5 h-5" />;
      case 'badge-crystal':
        return <Sparkles className="w-5 h-5" />;
      case 'badge-inspector':
        return <FolderSearch className="w-5 h-5" />;
      case 'badge-contact':
        return <Send className="w-5 h-5" />;
      default:
        return <Award className="w-5 h-5" />;
    }
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
💎 Cristais Coletados: ${collectedCount}/8
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
        >
          {/* Top Bar Tabs (Clean Unified Navigation) */}
          <div className="flex items-center bg-zinc-950/95 border border-zinc-800 rounded-t-xl overflow-hidden shadow-xl max-w-full overflow-x-auto shrink-0">
            {/* 1. Home Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('home');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'home'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Home / Universo"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* 2. Options Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('options');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'options'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Opções & Configurações"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* 3. Controls Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('controls');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'controls'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Comandos & Controles"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            {/* 4. Achievements / Badges Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('achievements');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'achievements'
                  ? 'bg-zinc-800 text-purple-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Conquistas & Badges"
            >
              <Award className="w-4 h-4" />
            </button>

            {/* 5. Ranking Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('ranking');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'ranking'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Ranking & Hall da Fama"
            >
              <Trophy className="w-4 h-4" />
            </button>

            {/* 6. Behind the Scene Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('behind');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'behind'
                  ? 'bg-zinc-800 text-sky-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Arquitetura 3D & Bastidores"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* 7. About Developer Tab */}
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('about');
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors border-r border-zinc-800 cursor-pointer shrink-0 ${
                activeTab === 'about'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
              title="Sobre o Desenvolvedor"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* 8. Close Button (Square Red with White X) */}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-10 h-10 bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          {/* Modal Main Body Card (Fixed Dimensions Two Column Split) */}
          <div className="w-full bg-[#141418] border border-zinc-800 rounded-2xl rounded-tr-none shadow-2xl overflow-hidden flex flex-col md:flex-row h-[580px] max-h-[85vh]">
            {/* Left Column: Visual Low-Poly Diorama Showcase */}
            <div className="w-full md:w-[300px] h-40 md:h-full bg-gradient-to-b from-[#1b1a23] to-[#111115] p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800/80 relative overflow-hidden select-none shrink-0">
              {/* Glowing Background Radial Halo */}
              <div className="absolute inset-0 bg-radial from-purple-500/15 via-transparent to-transparent opacity-70 pointer-events-none" />

              {/* Dynamic Diorama Visual per Tab */}
              {activeTab === 'home' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-full border border-purple-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(168,85,247,0.2)] mb-4 relative">
                    <div className="absolute inset-3 rounded-full border border-dashed border-sky-400/40 animate-[spin_40s_linear_infinite]" />
                    <div className="text-6xl filter drop-shadow-[0_8px_16px_rgba(239,68,68,0.4)]">
                      🚀
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">
                    {PERSONAL_INFO.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    Solar System Portfolio
                  </span>
                </div>
              )}

              {activeTab === 'options' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-2xl border border-amber-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(245,158,11,0.2)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)]">
                      ⚙️
                    </div>
                    <div className="absolute top-3 left-4 text-xs font-mono text-amber-400/80">⬡</div>
                    <div className="absolute bottom-4 right-5 text-sm font-mono text-orange-400/80">⬢</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                    Preferências do Jogo
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    Áudio, Câmera & Sistema
                  </span>
                </div>
              )}

              {activeTab === 'controls' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-2xl border border-sky-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(56,189,248,0.2)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(56,189,248,0.5)]">
                      🎮
                    </div>
                    <div className="absolute bottom-3 text-[10px] font-mono text-sky-300/80 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/20">
                      Keyboard & Touch
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-widest">
                    Flight Controls
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    Comandos de Navegação 3D
                  </span>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-2xl border border-purple-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(168,85,247,0.2)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(168,85,247,0.5)]">
                      🎖️
                    </div>
                    <div className="absolute bottom-3 text-[10px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30 font-bold">
                      {stats.unlockedBadges.length} / {BADGES_DATA.length} Badges
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">
                    Conquistas Galácticas
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    {stats.xp} Pontos de XP
                  </span>
                </div>
              )}

              {activeTab === 'ranking' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-2xl border border-amber-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.5)]">
                      🏆
                    </div>
                    <div className="absolute bottom-3 text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                      Top Exploradores
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-widest">
                    Hall da Fama
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    Sua Patente: {getRankTitle(stats.xp)}
                  </span>
                </div>
              )}

              {activeTab === 'behind' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-2xl border border-indigo-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(99,102,241,0.2)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(99,102,241,0.5)]">
                      ⚡
                    </div>
                    <div className="absolute bottom-3 text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                      Three.js & Rapier
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-widest">
                    Creative Dev Stack
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    WebGL 3D Architecture
                  </span>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-44 h-44 rounded-full border border-pink-500/30 flex items-center justify-center bg-zinc-950/60 shadow-[0_0_35px_rgba(236,72,153,0.2)] mb-4 relative">
                    <div className="text-6xl filter drop-shadow-[0_8px_20px_rgba(236,72,153,0.5)]">
                      👨‍💻
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-pink-300 uppercase tracking-widest">
                    {PERSONAL_INFO.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1">
                    {PERSONAL_INFO.title}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column: Fixed Height Tab Content */}
            <div className="flex-1 h-full p-6 md:p-8 flex flex-col justify-between overflow-hidden">
              {/* Scrollable Tab Content Container */}
              <div className="flex-1 overflow-y-auto pr-1 sm:pr-2">
                {/* TAB 1: HOME */}
              {activeTab === 'home' && (
                <div>
                  <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase mb-4 flex items-center gap-2">
                    <span>UNIVERSO 3D INTERATIVO</span>
                  </h2>
                  <div className="space-y-4 text-sm text-zinc-300 leading-relaxed font-sans">
                    <p className="text-base text-zinc-200">
                      Olá e seja muito bem-vindo! 👋
                    </p>
                    <p>
                      Meu nome é <strong className="text-white font-bold">{PERSONAL_INFO.name}</strong>, sou desenvolvedor focado em engenharia de software full-stack e experiências 3D WebGL imersivas.
                    </p>
                    <p>
                      Este portfólio foi concebido como um universo diorama explorável em tempo real: pilote o foguete pelo sistema solar com <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-sky-300">W</kbd> <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-sky-300">A</kbd> <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-sky-300">S</kbd> <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-sky-300">D</kbd>, colete cristais de energia, desbloqueie badges e inspecione cada planeta para descobrir meus projetos, competências e trajetória profissional.
                    </p>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 flex items-center gap-2 mt-2">
                      <span className="text-base">☀️</span>
                      <span>Dica: Aproxime-se dos planetas para atracar e pressione <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-mono text-white text-[10px]">ESPAÇO</kbd> para turbo!</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OPTIONS (Camera, Audio, Respawn, Quality, Reset) */}
              {activeTab === 'options' && (
                <div>
                  <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase mb-6">
                    OPTIONS & CONFIGURAÇÕES
                  </h2>

                  <div className="space-y-3 font-sans">
                    {/* Audio Option */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                      <div>
                        <span className="text-sm font-medium text-zinc-200 font-mono block">
                          Áudio & Efeitos Sonoros
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Síntese de osciladores procedural Web Audio
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onToggleMute();
                        }}
                        className={`w-28 py-1.5 rounded-lg border text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          !isMuted
                            ? 'bg-zinc-800 border-zinc-600 text-white shadow-sm hover:bg-zinc-750'
                            : 'bg-zinc-900 border-zinc-750 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {!isMuted ? (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Ligado</span>
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                            <span>Mudo</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Camera Mode Option */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                      <div>
                        <span className="text-sm font-medium text-zinc-200 font-mono block">
                          Modo de Câmera
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {cameraViewMode === 'iso' ? 'Diorama isométrico 30°' : 'Visão panorâmica angular 55°'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onSelectCameraMode(cameraViewMode === 'iso' ? 'tactical55' : 'iso');
                        }}
                        className="w-28 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-750 text-white text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {cameraViewMode === 'iso' ? (
                          <>
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                            <span>Isométrica</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                            <span>55° Global</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Quality Mode */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                      <div>
                        <span className="text-sm font-medium text-zinc-200 font-mono block">
                          Fidelidade Gráfica
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Taxa de quadros e resolução de render
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setQualityMode(qualityMode === 'high' ? 'balanced' : 'high');
                        }}
                        className="w-28 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-750 text-white text-xs font-mono font-medium transition cursor-pointer"
                      >
                        {qualityMode === 'high' ? 'Alta (60fps)' : 'Balanceada'}
                      </button>
                    </div>

                    {/* I'm stuck! (Respawn) */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                      <div>
                        <span className="text-sm font-medium text-zinc-200 font-mono block">
                          Recuperar Posição
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Teleporta o foguete de volta para órbita segura
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          sounds.playBoost();
                          onRespawnVehicle();
                          onClose();
                        }}
                        className="w-28 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.15)]"
                      >
                        <RotateCcw className="w-3 h-3 text-sky-400" />
                        <span>Respawn</span>
                      </button>
                    </div>

                    {/* Reset Collectibles */}
                    {onResetCrystals && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                        <div>
                          <span className="text-sm font-medium text-zinc-200 font-mono block">
                            Cristais Orbitais
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Reinicia os cristais no espaço ({collectedCount}/8 coletados)
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            sounds.playClick();
                            onResetCrystals();
                          }}
                          className="w-28 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 text-xs font-mono font-medium transition cursor-pointer"
                        >
                          Resetar ({collectedCount}/8)
                        </button>
                      </div>
                    )}

                    {/* Renderer & Status */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-800/40 transition">
                      <div>
                        <span className="text-sm font-medium text-zinc-200 font-mono block">
                          Engine 3D & Status
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          Three.js WebGL + Rapier Physics WASM
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg border border-dashed border-sky-500/40 text-xs font-mono text-sky-400 bg-sky-950/40">
                          Three.js
                        </div>
                        <div className="px-2.5 py-1 rounded-lg border border-dashed border-emerald-500/50 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40">
                          Online
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CONTROLS */}
              {activeTab === 'controls' && (
                <div>
                  <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase mb-4">
                    CONTROLS & COMANDOS
                  </h2>

                  {/* Sub-tabs: Keyboard vs Touch */}
                  <div className="flex items-center gap-2 mb-5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <button
                      onClick={() => setControlsSubTab('keyboard')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        controlsSubTab === 'keyboard'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Teclado & Mouse
                    </button>
                    <button
                      onClick={() => setControlsSubTab('touch')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        controlsSubTab === 'touch'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Touch / Mobile
                    </button>
                  </div>

                  {controlsSubTab === 'keyboard' ? (
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
                        <div className="flex items-center gap-1.5">
                          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold">WASD</kbd>
                          <span className="text-zinc-500">ou</span>
                          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold">SETAS</kbd>
                        </div>
                        <span className="text-zinc-300">Acelerar, ré e curvas A/D</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
                        <kbd className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold">ESPAÇO</kbd>
                        <span className="text-zinc-300">Impulso Turbo (Boost)</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
                        <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold">R</kbd>
                        <span className="text-zinc-300">Respawn de emergência</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
                        <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold">ESC</kbd>
                        <span className="text-zinc-300">Abrir / Fechar este menu</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 border border-zinc-850">
                        <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 font-bold text-[11px]">CLIQUE NO ESPAÇO</span>
                        <span className="text-zinc-300">Atracar em planetas e coletar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 font-sans text-xs text-zinc-300">
                      <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                        <p className="font-bold text-white mb-1 font-mono">Joystick Virtual (Canto Inferior Esquerdo)</p>
                        <p className="text-zinc-400">Arraste o botão analógico em qualquer direção para guiar a proa do foguete.</p>
                      </div>
                      <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                        <p className="font-bold text-white mb-1 font-mono">Botão de Turbo (Canto Inferior Direito)</p>
                        <p className="text-zinc-400">Toque no ícone de relâmpago para ativar a propulsão máxima com partículas estendidas.</p>
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
                      <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase">
                        ACHIEVEMENTS & BADGES
                      </h2>
                      <p className="text-xs text-zinc-400 font-sans">
                        Conquistas acumuladas durante a exploração do sistema
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                      {stats.unlockedBadges.length} / {BADGES_DATA.length} Desbloqueadas
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 mb-4">
                    <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1.5">
                      <span>Progresso Geral</span>
                      <span className="text-purple-400 font-bold">
                        {Math.round((stats.unlockedBadges.length / BADGES_DATA.length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
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
                              ? 'bg-purple-950/20 border-purple-500/40 shadow-sm'
                              : 'bg-zinc-900/40 border-zinc-800/80 opacity-60'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                              isUnlocked
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-zinc-800 text-zinc-600'
                            }`}
                          >
                            {isUnlocked ? getBadgeIcon(badge.id) : <Lock className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-xs font-mono font-bold truncate ${
                                  isUnlocked ? 'text-white' : 'text-zinc-400'
                                }`}
                              >
                                {badge.title}
                              </span>
                              <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                                +{badge.xpReward} XP
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                              {badge.description}
                            </p>
                            <span
                              className={`inline-block text-[9px] font-mono uppercase font-bold mt-1 px-1.5 py-0.5 rounded ${
                                isUnlocked
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-zinc-800 text-zinc-500'
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
                  <div className="mt-4 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-200 block">
                        Cristais Orbitais
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {collectedCount} de 8 coletados no espaço
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-md border text-[9px] flex items-center justify-center font-mono font-bold ${
                            idx < collectedCount
                              ? 'bg-purple-500 border-purple-400 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                          }`}
                        >
                          💎
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: RANKING / HALL DA FAMA (Contained inside Settings!) */}
              {activeTab === 'ranking' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase">
                        RANKING DOS VISITANTES
                      </h2>
                      <p className="text-xs text-zinc-400 font-sans">
                        Quadro de pontuações e melhores navegadores cósmicos
                      </p>
                    </div>
                    <button
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-mono font-medium transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedSummary ? 'Copiado!' : 'Compartilhar'}</span>
                    </button>
                  </div>

                  {/* Player Current Score Badge */}
                  <div className="p-3.5 bg-gradient-to-r from-amber-950/30 to-zinc-900 border border-amber-500/30 rounded-xl mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-base">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-white">
                            Sua Pontuação Atual
                          </span>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                            {getRankTitle(stats.xp)}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 font-sans">
                          {stats.unlockedBadges.length} Conquistas • {collectedCount} Cristais
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-mono font-black text-amber-300 block">
                        {stats.xp}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">XP TOTAL</span>
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
                        className="flex-1 bg-zinc-900/90 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition shadow-md cursor-pointer"
                      >
                        Registrar
                      </button>
                    </form>
                  ) : (
                    <div className="mb-4 p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Sua pontuação foi gravada com sucesso no Ranking!</span>
                    </div>
                  )}

                  {/* Top 10 Leaderboard List */}
                  <div className="space-y-1.5 font-mono text-xs">
                    {leaderboard.map((entry, index) => {
                      const isTop3 = index < 3;
                      return (
                        <div
                          key={entry.id || index}
                          className={`flex items-center justify-between p-2 rounded-xl border transition ${
                            index === 0
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                              : index === 1
                              ? 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                              : index === 2
                              ? 'bg-amber-950/20 border-amber-700/40 text-amber-400/90'
                              : 'bg-zinc-900/30 border-zinc-800 text-zinc-400'
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
                                  : 'text-zinc-600'
                              }`}
                            >
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </span>
                            <div>
                              <span className="font-bold text-zinc-200 block">
                                {entry.name}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {entry.title} • {entry.badgesCount} badges
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-amber-400">
                              {entry.score} XP
                            </span>
                            <span className="text-[10px] text-zinc-600 block">
                              {entry.date}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: BEHIND THE SCENE */}
              {activeTab === 'behind' && (
                <div>
                  <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase mb-4">
                    BEHIND THE SCENE
                  </h2>
                  <div className="space-y-3 text-xs text-zinc-300 leading-relaxed font-sans">
                    <p>
                      Este portfólio une modelagem estilizada em baixa contagem de polígonos (low-poly), simulação física em tempo real e arquitetura moderna:
                    </p>

                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                      <p className="font-bold text-sky-400 font-mono">REACT THREE FIBER & THREE.JS</p>
                      <p className="text-zinc-400 text-[11px]">
                        Renderização WebGL 3D declarativa com câmera isométrica diorama, sombras de baixa complexidade e partículas poliédricas de dispersão.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                      <p className="font-bold text-purple-400 font-mono">RAPIER 3D (WASM ENGINE)</p>
                      <p className="text-zinc-400 text-[11px]">
                        Simulação física de corpo rígido compilada em WebAssembly com inércia, rotação angular suave e detonações ao colidir com o Sol central.
                      </p>
                    </div>

                    <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                      <p className="font-bold text-amber-400 font-mono">PROCEDURAL WEB AUDIO API</p>
                      <p className="text-zinc-400 text-[11px]">
                        Todos os efeitos sonoros (explosões, motor turbo, coleta de cristais e badges) gerados dinamicamente via síntese de ondas sem arquivos pesados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: ABOUT DEVELOPER */}
              {activeTab === 'about' && (
                <div>
                  <h2 className="text-2xl font-black font-mono tracking-wider text-zinc-100 uppercase mb-4">
                    SOBRE O AUTOR
                  </h2>
                  <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
                    <p className="text-sm font-medium text-white">
                      {PERSONAL_INFO.name} — {PERSONAL_INFO.title}
                    </p>
                    <p className="text-zinc-400">
                      {PERSONAL_INFO.bio}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <a
                        href={PERSONAL_INFO.github}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 transition"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>
                      <a
                        href={PERSONAL_INFO.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <span>LinkedIn</span>
                        <ExternalLink className="w-3 h-3 text-white/80" />
                      </a>
                      <a
                        href={`mailto:${PERSONAL_INFO.email}`}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-mono text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <span>Enviar Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {/* Bottom Card Footer - Always pinned at bottom */}
              <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
                <span>Versão 2.5 — Low-Poly 3D Minimal</span>
                <span className="text-zinc-400">Pressione <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-[10px]">ESC</kbd> para fechar</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
