import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectItem } from '../../types';
import { MaterialIcon, GithubIcon } from './MaterialIcon';
import { MarkdownViewer } from './MarkdownViewer';
import { sounds } from '../../audio/soundManager';

interface ProjectDetailModalProps {
  project: ProjectItem;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

type ProjectTab = 'readme' | 'overview' | 'architecture' | 'quickstart';

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onPrev,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<ProjectTab>('readme');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(project.readme);
    sounds.playClick();
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2200);
  };

  const handleCopyGitClone = () => {
    const cmd = project.quickStart?.cloneCmd || `git clone ${project.githubUrl}.git`;
    navigator.clipboard.writeText(cmd);
    sounds.playClick();
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2200);
  };

  const readmeLineCount = project.readme.split('\n').length;
  const readmeApproxKb = (new Blob([project.readme]).size / 1024).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-[#070a10]/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 10, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative w-full max-w-5xl h-[92vh] max-h-[880px] bg-[#0d121c] border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* ================= TOP HEADER ================= */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-[#111724]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Project title & badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md"
              style={{ backgroundColor: project.accentColor }}
            >
              <MaterialIcon name="deployed_code" size={22} className="text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold font-sans text-white tracking-tight truncate">
                  {project.title}
                </h2>
                {project.statusBadge && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {project.statusBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span style={{ color: project.accentColor }}>{project.category}</span>
                {project.role && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400">{project.role}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions & Navigation */}
          <div className="flex items-center gap-2">
            {/* Prev / Next switchers */}
            {(onPrev || onNext) && (
              <div className="flex items-center bg-slate-800/60 rounded-xl border border-slate-700/60 p-0.5 mr-1">
                <button
                  onClick={() => {
                    sounds.playClick();
                    onPrev?.();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer"
                  title="Projeto Anterior (Seta Esquerda)"
                >
                  <MaterialIcon name="chevron_left" size={20} />
                </button>
                <div className="w-px h-4 bg-slate-700/80" />
                <button
                  onClick={() => {
                    sounds.playClick();
                    onNext?.();
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-750 transition cursor-pointer"
                  title="Próximo Projeto (Seta Direita)"
                >
                  <MaterialIcon name="chevron_right" size={20} />
                </button>
              </div>
            )}

            {/* GitHub link */}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-mono font-medium flex items-center gap-1.5 transition"
                title="Abrir no Repositório GitHub"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Repositório</span>
              </a>
            )}

            {/* Live demo */}
            {project.liveUrl && project.liveUrl !== '#' && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md transition"
              >
                <span>Live Demo</span>
                <MaterialIcon name="open_in_new" size={14} />
              </a>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 flex items-center justify-center transition cursor-pointer ml-1"
              title="Fechar Inspecionar (ESC)"
            >
              <MaterialIcon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* ================= TABS BAR ================= */}
        <div className="px-5 border-b border-slate-800/80 bg-[#0c1017] flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('readme');
              }}
              className={`px-4 py-2.5 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'readme'
                  ? 'border-sky-400 text-sky-400 bg-sky-500/5 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MaterialIcon name="description" size={16} />
              <span>README.md</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-500/20 text-sky-300">
                Principal
              </span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('overview');
              }}
              className={`px-4 py-2.5 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-sky-400 text-sky-400 bg-sky-500/5 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MaterialIcon name="insights" size={16} />
              <span>Visão Geral & Destaques</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('architecture');
              }}
              className={`px-4 py-2.5 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'architecture'
                  ? 'border-sky-400 text-sky-400 bg-sky-500/5 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MaterialIcon name="schema" size={16} />
              <span>Arquitetura & Fluxo</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('quickstart');
              }}
              className={`px-4 py-2.5 text-xs font-mono font-medium flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'quickstart'
                  ? 'border-sky-400 text-sky-400 bg-sky-500/5 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <MaterialIcon name="terminal" size={16} />
              <span>Terminal & Quickstart</span>
            </button>
          </div>

          {/* Quick copy clone button in tabs bar */}
          <button
            onClick={handleCopyGitClone}
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] font-mono transition cursor-pointer"
            title="Copiar comando de clone git"
          >
            {copiedGit ? (
              <>
                <MaterialIcon name="check" size={13} className="text-emerald-400" />
                <span className="text-emerald-400">git clone copiado!</span>
              </>
            ) : (
              <>
                <MaterialIcon name="content_copy" size={13} />
                <span>Copiar git clone</span>
              </>
            )}
          </button>
        </div>

        {/* ================= MODAL BODY / SCROLL AREA ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: README.MD (The star requested feature) */}
          {activeTab === 'readme' && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* STYLIZED README CONTAINER (A "div bonitinha e estilizada") */}
              <div className="rounded-2xl border border-slate-700/80 bg-[#090d16] shadow-xl overflow-hidden">
                {/* Repositor/File Toolbar (GitHub Dark Style) */}
                <div className="px-4 py-3 bg-[#111724] border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  {/* Left: Breadcrumbs & Branch */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                      <MaterialIcon name="description" size={16} className="text-sky-400" />
                      <span>README.md</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[11px]">
                      <MaterialIcon name="account_tree" size={12} className="text-slate-400" />
                      <span>main</span>
                    </div>

                    <span className="text-slate-500 hidden sm:inline">•</span>

                    <span className="text-slate-400 text-[11px] hidden sm:inline">
                      {readmeLineCount} linhas · {readmeApproxKb} KB
                    </span>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyRaw}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 text-[11px] font-mono transition cursor-pointer"
                      title="Copiar texto markdown completo"
                    >
                      {copiedRaw ? (
                        <>
                          <MaterialIcon name="check" size={14} className="text-emerald-400" />
                          <span className="text-emerald-400">Markdown Copiado!</span>
                        </>
                      ) : (
                        <>
                          <MaterialIcon name="content_copy" size={14} />
                          <span>Copiar Raw</span>
                        </>
                      )}
                    </button>

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1 text-[11px] font-mono transition"
                        title="Ver arquivo original no GitHub"
                      >
                        <span>GitHub</span>
                        <MaterialIcon name="open_in_new" size={12} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Markdown Rendered Content */}
                <div className="p-5 sm:p-8 bg-[#090d16]">
                  <MarkdownViewer content={project.readme} accentColor={project.accentColor} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OVERVIEW & HIGHLIGHTS */}
          {activeTab === 'overview' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Short summary banner */}
              <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-3">
                <h3 className="text-sm font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                  <MaterialIcon name="lightbulb" size={16} />
                  <span>Proposta & Solução</span>
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {project.description}
                </p>
              </div>

              {/* Stats & Key Performance Metrics Bento */}
              {project.stats && project.stats.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-1.5">
                    <MaterialIcon name="speed" size={14} className="text-emerald-400" />
                    <span>Métricas & Indicadores Técnicos</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {project.stats.map((stat, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-4 rounded-xl bg-[#111724]/80 border border-slate-800/80 flex flex-col justify-between"
                      >
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mb-1">
                          {stat.icon && <MaterialIcon name={stat.icon} size={14} className="text-sky-400" />}
                          <span>{stat.label}</span>
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-100 font-sans">
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Highlights List */}
              {project.highlights && project.highlights.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                    <MaterialIcon name="star" size={14} className="text-amber-400" />
                    <span>Destaques de Engenharia</span>
                  </h4>
                  <div className="space-y-2.5">
                    {project.highlights.map((highlight, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                        <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                          <MaterialIcon name="check" size={12} />
                        </div>
                        <span className="flex-1">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack Pills */}
              <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-3">
                <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <MaterialIcon name="layers" size={14} className="text-sky-400" />
                  <span>Stack de Tecnologias Utilizada</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-[#0c1017] border border-slate-700/80 text-sky-300 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & DATA FLOW */}
          {activeTab === 'architecture' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {project.architecture ? (
                <>
                  <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-3">
                    <h3 className="text-sm font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <MaterialIcon name="architecture" size={16} />
                      <span>Visão Arquitetural do Sistema</span>
                    </h3>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {project.architecture.overview}
                    </p>
                  </div>

                  {/* Step by step flow */}
                  <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-4">
                    <h4 className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                      <MaterialIcon name="route" size={14} className="text-emerald-400" />
                      <span>Fluxo Operacional de Dados</span>
                    </h4>
                    <div className="space-y-3">
                      {project.architecture.flow.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-3 p-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-200"
                        >
                          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {sIdx + 1}
                          </div>
                          <div className="flex-1 font-mono leading-relaxed">{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Database & Security */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.architecture.database && (
                      <div className="p-4 rounded-xl bg-[#111724]/70 border border-slate-800/80 space-y-2">
                        <span className="text-xs font-mono text-sky-400 font-bold flex items-center gap-1.5">
                          <MaterialIcon name="database" size={14} />
                          <span>Camada de Banco & Persistência</span>
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {project.architecture.database}
                        </p>
                      </div>
                    )}

                    {project.architecture.security && (
                      <div className="p-4 rounded-xl bg-[#111724]/70 border border-slate-800/80 space-y-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                          <MaterialIcon name="security" size={14} />
                          <span>Segurança & Resiliência</span>
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300 font-sans">
                          {project.architecture.security.map((sec, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <MaterialIcon name="check_circle" size={12} className="text-emerald-400" />
                              <span>{sec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  Detalhes adicionais de arquitetura documentados no README.md.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: QUICKSTART & TERMINAL */}
          {activeTab === 'quickstart' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {project.quickStart ? (
                <>
                  <div className="p-5 rounded-2xl bg-[#111724]/70 border border-slate-800/80 space-y-3">
                    <h3 className="text-sm font-mono font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <MaterialIcon name="terminal" size={16} />
                      <span>Instruções de Inicialização Rápida</span>
                    </h3>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      Siga o passo a passo no terminal para clonar, instalar dependências e inicializar a aplicação localmente.
                    </p>
                  </div>

                  {/* Terminal Box */}
                  <div className="rounded-2xl border border-slate-700/80 bg-[#090d16] overflow-hidden shadow-xl">
                    <div className="px-4 py-2.5 bg-[#111724] border-b border-slate-700/80 flex items-center justify-between text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                        <span className="text-slate-300 ml-1">bash terminal</span>
                      </div>
                      <span className="text-[11px] text-slate-500">Node.js 20+</span>
                    </div>

                    <div className="p-5 font-mono text-xs space-y-4 text-slate-200">
                      <div>
                        <span className="text-slate-500"># 1. Clonar repositório</span>
                        <div className="mt-1 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300">
                          <code>{project.quickStart.cloneCmd}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(project.quickStart!.cloneCmd);
                              sounds.playClick();
                            }}
                            className="text-slate-400 hover:text-white ml-2 p-1"
                            title="Copiar comando"
                          >
                            <MaterialIcon name="content_copy" size={14} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500"># 2. Instalar dependências</span>
                        <div className="mt-1 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-sky-300">
                          <code>{project.quickStart.installCmd}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(project.quickStart!.installCmd);
                              sounds.playClick();
                            }}
                            className="text-slate-400 hover:text-white ml-2 p-1"
                            title="Copiar comando"
                          >
                            <MaterialIcon name="content_copy" size={14} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500"># 3. Rodar servidor em desenvolvimento</span>
                        <div className="mt-1 flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300">
                          <code>{project.quickStart.runCmd}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(project.quickStart!.runCmd);
                              sounds.playClick();
                            }}
                            className="text-slate-400 hover:text-white ml-2 p-1"
                            title="Copiar comando"
                          >
                            <MaterialIcon name="content_copy" size={14} />
                          </button>
                        </div>
                      </div>

                      {project.quickStart.envExample && (
                        <div>
                          <span className="text-slate-500"># 4. Configurar variáveis de ambiente (.env)</span>
                          <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300/90 overflow-x-auto text-[11px]">
                            {project.quickStart.envExample}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-400 font-mono text-xs">
                  Instruções de instalação detalhadas no README.md.
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-[#111724]/90 flex items-center justify-between shrink-0">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetria do Projeto Ativa</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750 text-xs font-mono font-medium transition cursor-pointer"
            >
              Fechar Detalhes
            </button>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-mono font-medium flex items-center gap-1.5 transition"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>Ver Código</span>
              </a>
            )}
            {project.liveUrl && project.liveUrl !== '#' && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-md"
              >
                <span>Demo Online</span>
                <MaterialIcon name="open_in_new" size={14} />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
