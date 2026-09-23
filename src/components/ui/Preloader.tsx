import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { sounds } from '../../audio/soundManager';
import './Preloader.css';
import { useI18n } from '../../i18n/I18nProvider';
import { getPortfolioContent } from '../../i18n/portfolio';

interface PreloaderProps {
  isSceneReady: boolean;
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ isSceneReady, onComplete }) => {
  const { locale } = useI18n();
  const PERSONAL_INFO = useMemo(() => getPortfolioContent(locale).personalInfo, [locale]);
  const [fontsReady, setFontsReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let active = true;
    const settleFonts = () => { if (active) setFontsReady(true); };
    const settleAudio = () => { if (active) setAudioReady(true); };
    Promise.resolve(document.fonts?.ready).then(settleFonts, settleFonts);
    sounds.warmup().then(settleAudio, settleAudio);
    return () => { active = false; };
  }, []);

  // Scene readiness includes physics and shaders; optional resources never block entry.
  useEffect(() => {
    if (!isSceneReady) return;
    const timer = setTimeout(() => onCompleteRef.current(), reducedMotion ? 0 : 250);
    return () => clearTimeout(timer);
  }, [isSceneReady, reducedMotion]);

  const stages = [
    { label: 'Interface', ready: fontsReady },
    { label: 'Áudio', ready: audioReady },
    { label: 'Universo 3D', ready: isSceneReady },
  ];

  return (
    <motion.div
      className="launch-screen"
      initial={{ opacity: 1 }}
      animate={{ opacity: isSceneReady ? 0 : 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.25 }}
      aria-label="Carregando portfólio"
      aria-busy={!isSceneReady}
    >
      <header className="launch-header">
        <span className="launch-brand"><span className="launch-monogram">DR<span>.</span></span> PORTFÓLIO INTERATIVO</span>
        <span className="launch-edition">DESENVOLVIMENTO · CRIATIVIDADE · EXPLORAÇÃO</span>
      </header>

      <main className="launch-content">
        <div className="launch-copy">
          <p className="launch-eyebrow"><span /> PREPARANDO SUA EXPLORAÇÃO</p>
          <h1>{PERSONAL_INFO.name}<span>Um universo<br />para descobrir.</span></h1>
          <p className="launch-description">Ideias, projetos e experiências conectados.<br />Seu próximo destino está quase pronto.</p>

          <div className="launch-status" role="status" aria-live="polite">
            <div className="launch-status-heading">
              <span>{isSceneReady ? 'Tudo pronto. Vamos explorar.' : 'Preparando o universo'}</span>
              <span className="launch-status-indicator" aria-hidden="true">{isSceneReady ? '✓' : '···'}</span>
            </div>
            <div className={`launch-progress ${isSceneReady ? 'is-ready' : ''}`} aria-hidden="true"><span /></div>
            <p>{isSceneReady ? 'Boa viagem!' : 'Organizando a cena para uma viagem mais fluida.'}</p>
          </div>

          <ol className="launch-stages" aria-label="Preparação da experiência">
            {stages.map((stage, index) => (
              <li key={stage.label} data-ready={stage.ready}>
                <span aria-hidden="true">{stage.ready ? '✓' : `0${index + 1}`}</span>
                {stage.label}<span className="sr-only">: {stage.ready ? 'pronto' : 'preparando'}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="launch-universe" aria-hidden="true">
          <svg viewBox="0 0 480 480" fill="none">
            <defs>
              <radialGradient id="launch-halo"><stop stopColor="#38bdf8" stopOpacity=".16" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
              <linearGradient id="launch-core" x1="210" y1="205" x2="270" y2="280" gradientUnits="userSpaceOnUse"><stop stopColor="#d9f7ff" /><stop offset=".45" stopColor="#38bdf8" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
            </defs>
            <circle cx="240" cy="240" r="215" fill="url(#launch-halo)" />
            <path d="M240 14V466M14 240H466" stroke="#193045" strokeDasharray="2 8" />
            {[76, 132, 190].map(r => <circle key={r} cx="240" cy="240" r={r} stroke="#264052" strokeOpacity=".75" />)}
            <circle cx="240" cy="240" r="215" stroke="#193045" strokeDasharray="1 10" />
            <g className="launch-orbit">
              <circle cx="240" cy="50" r="6" fill="#a5b4fc" />
              <circle cx="240" cy="50" r="12" stroke="#a5b4fc" strokeOpacity=".3" />
              <circle cx="372" cy="240" r="9" fill="#38bdf8" />
              <circle cx="240" cy="316" r="4" fill="#fbbf24" />
            </g>
            <circle cx="105.65" cy="374.35" r="5" fill="#34d399" />
            <circle cx="240" cy="240" r="38" fill="url(#launch-core)" />
            <ellipse cx="240" cy="240" rx="57" ry="17" stroke="#bae6fd" strokeOpacity=".65" transform="rotate(-30 240 240)" />
            <path d="M35 65V35H65M415 35H445V65M445 415V445H415M65 445H35V415" stroke="#385367" />
            <circle cx="82" cy="146" r="1.5" fill="#e2e8f0" /><circle cx="380" cy="375" r="1.5" fill="#e2e8f0" />
          </svg>
          <span className="launch-chart-label">CADA ÓRBITA, UMA NOVA HISTÓRIA</span>
        </div>
      </main>

      <footer className="launch-footer"><span>{PERSONAL_INFO.title}</span><span>FEITO PARA EXPLORAR <span aria-hidden="true">↗</span></span></footer>
    </motion.div>
  );
};
