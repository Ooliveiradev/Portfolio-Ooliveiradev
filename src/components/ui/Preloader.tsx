import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';
import { PERSONAL_INFO } from '../../data/portfolioData';

interface PreloaderProps {
  isSceneReady: boolean;
  onComplete: () => void;
}

interface SubsystemStatus {
  id: string;
  label: string;
  detail: string;
  isReady: boolean;
  icon: string;
}

export const Preloader: React.FC<PreloaderProps> = ({ isSceneReady, onComplete }) => {
  // Estados de prontidão de cada subsistema
  const isRapierReady = isSceneReady;
  const [isFontsReady, setIsFontsReady] = useState<boolean>(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const isCelestialReady = isSceneReady;

  // Progresso suave interpolado (0% a 100%)
  const isReadyToEnter = isSceneReady;
  const [isExiting, setIsExiting] = useState<boolean>(false);

  // Physics is initialized once by the scene; readiness includes shader compilation.

  // 2. Aguarda carregamento das fontes da página
  useEffect(() => {
    let active = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (active) setIsFontsReady(true);
      }).catch(() => {
        if (active) setIsFontsReady(true);
      });
    } else {
      setIsFontsReady(true);
    }
    return () => {
      active = false;
    };
  }, []);

  // 3. Pré-aquece motor de áudio
  useEffect(() => {
    sounds.warmup().then(() => {
      setIsAudioReady(true);
    });
  }, []);

  // Cálculo da porcentagem alvo baseada nos subsistemas certificados
  const targetProgress = (() => {
    let p = 25; // Base de carregamento do bundle JS React 19
    if (isFontsReady) p += 15;
    if (isAudioReady) p += 15;
    if (isCelestialReady) p += 15;
    if (isRapierReady) p += 15;
    if (isSceneReady) p += 15;
    return Math.min(100, p);
  })();

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Transição automática imediata assim que a calibragem atinge 100%
  useEffect(() => {
    if (isReadyToEnter) {
      setIsExiting(true);
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReadyToEnter]);

  const subsystems: SubsystemStatus[] = [
    {
      id: 'physics',
      label: 'Física Quântica Rapier 3D (WASM)',
      detail: isRapierReady ? 'Mundo Físico Rígido e Colisores Prontos' : 'Compilando binário WebAssembly...',
      isReady: isRapierReady,
      icon: 'blur_on',
    },
    {
      id: 'pipeline',
      label: 'Pipeline Gráfico & Shaders GPU',
      detail: isSceneReady ? 'Shaders Three.js ACES Filmic Pré-aquecidos' : 'Compilando pipelines de materiais...',
      isReady: isSceneReady,
      icon: 'auto_awesome',
    },
    {
      id: 'celestial',
      label: 'Atlas Orbital & Asteroides Instanciados',
      detail: isCelestialReady ? '160 Matrizes de Asteroides e Ilhas Sincronizadas' : 'Calculando órbitas e anéis...',
      isReady: isCelestialReady,
      icon: 'public',
    },
    {
      id: 'fonts',
      label: 'Tipografia HUD & Glifos Orbitais',
      detail: isFontsReady ? 'Fontes Orbitron & Inter em VRAM' : 'Renderizando glifos vetoriais...',
      isReady: isFontsReady,
      icon: 'text_fields',
    },
    {
      id: 'audio',
      label: 'Sintetizador Web Audio & Frequências',
      detail: isAudioReady ? 'Osciladores e Filtros Sintetizados Ativos' : 'Inicializando buffers de áudio...',
      isReady: isAudioReady,
      icon: 'volume_up',
    },
  ];

  const roundedProgress = isSceneReady ? 100 : Math.round(targetProgress);
  const strokeDashoffset = 283 - (283 * roundedProgress) / 100;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 1.05 : 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-[#070b14] overflow-hidden"
    >
      {/* Luzes cósmicas de fundo estilo nebulosa */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Header: Identificação do Sistema */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <MaterialIcon name="rocket_launch" size={18} />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-widest text-sky-400 uppercase">
              DANILO RIBEIRO // PORTFOLIO 3D
            </div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">
              CENTRAL DE TELEMETRIA & CERTIFICAÇÃO DE SISTEMAS
            </div>
          </div>
        </div>

        {/* Hardware Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>WebGL 2.0</span>
        </div>
      </header>

      {/* Centro: Reator de Telemetria e Progresso Circular */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-xl w-full my-auto py-4">
        {/* Instant LCP Title: Paints immediately matching LandingOverlay exact geometry */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
          <h1 className="text-4xl sm:text-6xl font-sans font-bold text-slate-100 tracking-tight leading-none mb-3 drop-shadow-lg">
            {PERSONAL_INFO.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide max-w-lg">
            {PERSONAL_INFO.title}
          </p>
        </div>

        {/* Anel Holográfico de Carregamento */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-6">
          {/* Brilho externo */}
          <div className="absolute inset-0 rounded-full bg-sky-500/15 blur-2xl animate-pulse" />

          {/* SVG Circular Progress Bar */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Círculo base */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#1e293b"
              strokeWidth="3.5"
              strokeDasharray="2 3"
            />
            {/* Círculo de progresso dinâmico */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#preloaderGradient)"
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-150 ease-out"
            />
            <defs>
              <linearGradient id="preloaderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Leitura Central de Porcentagem */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
              {roundedProgress}%
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-sky-400 mt-1 font-semibold">
              {isReadyToEnter ? 'CERTIFICADO' : 'CARREGANDO'}
            </span>
          </div>
        </div>

        {/* Lista de Diagnóstico de Subsistemas em Tempo Real */}
        <div className="w-full space-y-2 bg-[#0c1017]/90 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2 px-1 flex items-center justify-between">
            <span>SUBSISTEMA EM VERIFICAÇÃO</span>
            <span>STATUS</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {subsystems.map((sub) => (
              <div
                key={sub.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-xs font-mono ${
                  sub.isReady
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <MaterialIcon
                    name={sub.isReady ? 'check_circle' : sub.icon}
                    size={16}
                    className={sub.isReady ? 'text-emerald-400' : 'text-sky-400 animate-spin'}
                  />
                  <div className="truncate">
                    <div className={`font-medium ${sub.isReady ? 'text-slate-200' : 'text-slate-300'}`}>
                      {sub.label}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate hidden sm:block">
                      {sub.detail}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      sub.isReady ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-sky-400 animate-ping'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      sub.isReady ? 'text-emerald-400' : 'text-sky-400'
                    }`}
                  >
                    {sub.isReady ? 'OK' : 'CALIBRANDO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Barra de Progresso Linear Holográfica */}
        <div className="w-full mt-4">
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 transition-all duration-150 rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ width: `${roundedProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rodapé: Botão de Ação ou Indicador de Calibragem */}
      <footer className="relative z-10 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        <div className="text-[11px] font-mono text-slate-400 text-center sm:text-left">
          {isReadyToEnter ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              Tudo pronto. Entrando no universo...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              Sincronizando coordenadas celestes e compilando shaders GPU...
            </span>
          )}
        </div>

        {/* Indicador de Status / Calibragem */}
        <div>
          {isReadyToEnter ? (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 font-mono text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
              <span className="font-bold tracking-wider uppercase">Iniciando Universo...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 font-mono text-xs">
              <div className="w-3.5 h-3.5 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" />
              <span>Calibrando Motores...</span>
            </div>
          )}
        </div>
      </footer>
    </motion.div>
  );
};
