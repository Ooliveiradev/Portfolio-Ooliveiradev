import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { MaterialIcon } from './MaterialIcon';
import { IslandId } from '../../types';
import { sounds } from '../../audio/soundManager';
import { CinematicDialog } from './narrative/CinematicDialog';
import { useNarrativeMotion } from './narrative/useNarrativeMotion';
import { useI18n } from '../../i18n/I18nProvider';
import { getPortfolioContent } from '../../i18n/portfolio';

interface ChallengeModalProps {
  islandId: IslandId;
  onComplete: (islandId: IslandId) => void;
  onClose: () => void;
  lowPower?: boolean;
}

export const ChallengeModal: React.FC<ChallengeModalProps> = ({
  islandId,
  onComplete,
  onClose,
  lowPower = false,
}) => {
  const { locale } = useI18n();
  const { simple } = useNarrativeMotion(lowPower);
  const milestones = getPortfolioContent(locale).experience.slice(0, 3).map((item, index) => ({ id: index + 1, title: item.company, desc: item.role }));
  const [completed, setCompleted] = useState(false);

  // Challenge 1: Terminal Deploy Pipeline
  const [terminalSteps, setTerminalSteps] = useState<number[]>([]);
  
  // Challenge 2: Skills Resonance
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);

  // Challenge 3: Milestone Synchronization
  const [milestonesSynced, setMilestonesSynced] = useState<number[]>([]);

  // Challenge 4: Quick CS Quiz
  const [quizAnswer1, setQuizAnswer1] = useState<number | null>(null);
  const [quizAnswer2, setQuizAnswer2] = useState<number | null>(null);

  const triggerVictory = () => {
    setCompleted(true);
    sounds.playBadgeUnlocked();
    if (!simple) confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      onComplete(islandId);
    }, 1200);
  };

  return (
    <CinematicDialog titleId="challenge-title" onClose={onClose} layer={60} lowPower={lowPower}
        className="bg-[#0c1017] border border-slate-800/80 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <MaterialIcon name="emoji_events" size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                Desafio Técnico • +150 XP
              </div>
              <h3 id="challenge-title" className="text-xl font-sans font-bold text-slate-100 tracking-tight">
                {islandId === 'projects' && 'Terminal Cósmico de Deploy'}
                {islandId === 'skills' && 'Sintonia de Frequência Tech'}
                {islandId === 'experience' && 'Sincronização de Marcos'}
                {islandId === 'education' && 'Quiz Rápido de Computação'}
                {islandId === 'about' && 'Aperto de Mão Criptográfico'}
              </h3>
            </div>
          </div>
          <button
            aria-label={locale === 'pt' ? 'Fechar desafio' : 'Close challenge'}
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 flex items-center justify-center cursor-pointer transition-colors"
          >
            <MaterialIcon name="close" size={18} />
          </button>
        </div>

        {/* PROJECTS CHALLENGE: PIPELINE DEPLOY */}
        {islandId === 'projects' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-sans">
              Clique nos comandos na ordem correta para compilar e disparar a pipeline de produção:
            </p>

            <div className="bg-[#111622]/60 border border-slate-800/60 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 pb-2 border-b border-slate-800/60">
                <MaterialIcon name="terminal" className="text-sky-400" size={16} />
                <span>ci-cd-runner@production:~#</span>
              </div>
              <div className="space-y-1">
                {terminalSteps.includes(1) && (
                  <div className="text-sky-400">✓ git checkout main &amp;&amp; git pull</div>
                )}
                {terminalSteps.includes(2) && (
                  <div className="text-sky-300">✓ npm run build --release</div>
                )}
                {terminalSteps.includes(3) && (
                  <div className="text-emerald-400">✓ docker deploy --tag=prod-v3 [ONLINE 100%]</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                disabled={terminalSteps.includes(1)}
                onClick={() => {
                  sounds.playClick();
                  setTerminalSteps((prev) => [...prev, 1]);
                }}
                className={`p-3 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                  terminalSteps.includes(1)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700/80'
                }`}
              >
                1. git pull
              </button>

              <button
                disabled={!terminalSteps.includes(1) || terminalSteps.includes(2)}
                onClick={() => {
                  sounds.playClick();
                  setTerminalSteps((prev) => [...prev, 2]);
                }}
                className={`p-3 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                  terminalSteps.includes(2)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : terminalSteps.includes(1)
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700/80'
                    : 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
                }`}
              >
                2. npm run build
              </button>

              <button
                disabled={!terminalSteps.includes(2) || terminalSteps.includes(3)}
                onClick={() => {
                  setTerminalSteps((prev) => [...prev, 3]);
                  triggerVictory();
                }}
                className={`p-3 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                  terminalSteps.includes(3)
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : terminalSteps.includes(2)
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold border-sky-400'
                    : 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800'
                }`}
              >
                3. docker deploy
              </button>
            </div>
          </div>
        )}

        {/* SKILLS CHALLENGE: STACK HARMONY */}
        {islandId === 'skills' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-sans">
              Selecione as 3 tecnologias essenciais para alimentar o reator deste portfólio 3D:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                'Three.js',
                'COBOL',
                'React',
                'TypeScript',
                'Flash 8',
                'Silverlight',
              ].map((tech) => {
                const isSelected = selectedTechs.includes(tech);
                const isCorrect = ['Three.js', 'React', 'TypeScript'].includes(tech);

                return (
                  <button
                    key={tech}
                    onClick={() => {
                      sounds.playClick();
                      if (isSelected) {
                        setSelectedTechs(selectedTechs.filter((t) => t !== tech));
                      } else {
                        const next = [...selectedTechs, tech];
                        setSelectedTechs(next);
                        // Check victory
                        if (
                          next.length === 3 &&
                          next.includes('Three.js') &&
                          next.includes('React') &&
                          next.includes('TypeScript')
                        ) {
                          triggerVictory();
                        }
                      }
                    }}
                    className={`p-3 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? isCorrect
                          ? 'bg-sky-500/20 text-sky-300 border-sky-400 ring-2 ring-sky-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500'
                        : 'bg-[#111622]/60 border-slate-800/60 hover:border-slate-700/80 text-slate-300'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* EXPERIENCE CHALLENGE: MILESTONES */}
        {islandId === 'experience' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 font-sans">
              Ative os 3 relés de telemetria corporativa para sincronizar o histórico profissional:
            </p>

            <div className="space-y-2">
              {milestones.map((item) => {
                const isDone = milestonesSynced.includes(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playClick();
                      if (!isDone) {
                        const next = [...milestonesSynced, item.id];
                        setMilestonesSynced(next);
                        if (next.length === milestones.length) {
                          triggerVictory();
                        }
                      }
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isDone
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                        : 'bg-[#111622]/60 border-slate-800/60 hover:border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{item.title}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <span className="text-xs font-mono font-medium">
                      {isDone ? '✓ Sincronizado' : '[Ativar Relé]'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* EDUCATION CHALLENGE: QUIZ */}
        {islandId === 'education' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-mono text-sky-400 block font-bold">
                Questão 1: Qual é o FPS ideal para experiências 3D fluidas no navegador?
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[24, 60, 15].map((fps) => (
                  <button
                    key={fps}
                    onClick={() => {
                      sounds.playClick();
                      setQuizAnswer1(fps);
                      if (fps === 60 && quizAnswer2 === 1) triggerVictory();
                    }}
                    className={`p-2.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      quizAnswer1 === fps
                        ? fps === 60
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400'
                        : 'bg-[#111622]/60 border-slate-800/60 text-slate-300'
                    }`}
                  >
                    {fps} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-mono text-sky-400 block font-bold">
                Questão 2: Qual estrutura de dados modela a história de commits do Git?
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Árvore Binária Simples', 'DAG (Grafo Acíclico Dirigido)'].map((ans, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sounds.playClick();
                      setQuizAnswer2(idx);
                      if (quizAnswer1 === 60 && idx === 1) triggerVictory();
                    }}
                    className={`p-2.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer ${
                      quizAnswer2 === idx
                        ? idx === 1
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-rose-500/20 text-rose-300 border-rose-400'
                        : 'bg-[#111622]/60 border-slate-800/60 text-slate-300'
                    }`}
                  >
                    {ans}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABOUT CHALLENGE: HANDSHAKE */}
        {islandId === 'about' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-xs text-slate-300 font-sans">
              Transmita uma chave de frequência para abrir o canal seguro direto com Danilo Ribeiro:
            </p>
            <div className="p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 font-mono text-xs text-sky-400">
              HASH-SHA256: 9f8a3c42e5b7190d... [PRONTO PARA ENLACE]
            </div>
            <button
              onClick={() => {
                triggerVictory();
              }}
              className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono font-bold text-xs shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <MaterialIcon name="podcasts" className="animate-pulse" size={18} />
              <span>ESTABELECER CONEXÃO ESPACIAL</span>
            </button>
          </div>
        )}

        {/* Victory Banner */}
        {completed && (
          <motion.div
            initial={{ scale: simple ? 1 : 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center"
          >
            <div className="text-emerald-400 font-sans font-bold text-sm flex items-center justify-center gap-2">
              <MaterialIcon name="check_circle" fill className="text-emerald-400" size={18} />
              <span>Desafio Concluído com Sucesso! (+150 XP)</span>
            </div>
          </motion.div>
        )}
    </CinematicDialog>
  );
};
