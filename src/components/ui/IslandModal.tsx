import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Github,
  Award,
  Sparkles,
  CheckCircle2,
  Calendar,
  MapPin,
  Mail,
  Linkedin,
  MessageCircle,
  FileText,
  Copy,
  Check,
  Send,
  Code2
} from 'lucide-react';
import {
  IslandConfig,
  IslandId,
  ProjectItem,
  UserStats
} from '../../types';
import {
  PERSONAL_INFO,
  PROJECTS_DATA,
  EXPERIENCE_DATA,
  EDUCATION_DATA,
  SKILLS_DATA,
} from '../../data/portfolioData';
import { sounds } from '../../audio/soundManager';

interface IslandModalProps {
  island: IslandConfig;
  stats: UserStats;
  onClose: () => void;
  onStartChallenge: (islandId: IslandId) => void;
  onInspectProject: (projectId: string) => void;
}

export const IslandModal: React.FC<IslandModalProps> = ({
  island,
  stats,
  onClose,
  onStartChallenge,
  onInspectProject,
}) => {
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const isChallengeDone = stats.completedChallenges.includes(island.id);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PERSONAL_INFO.email);
    setCopiedEmail(true);
    sounds.playCoin();
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setMessageSent(true);
    sounds.playBadgeUnlocked();
    setTimeout(() => {
      setMessageSent(false);
      setContactMessage('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: island.color }}
            >
              <Code2 className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                  {island.id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  +100 XP Coletados
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-fun font-bold text-white leading-tight">
                {island.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {island.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Challenge Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onStartChallenge(island.id);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md ${
                isChallengeDone
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 animate-pulse'
              }`}
            >
              {isChallengeDone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Desafio Concluído</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-black" />
                  <span>Desafio da Ilha (+150 XP)</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar e Retomar Navegação"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Challenge Banner */}
        <div className="sm:hidden px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300 font-mono">Desafio Técnico:</span>
          <button
            onClick={() => onStartChallenge(island.id)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              isChallengeDone
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500 text-black'
            }`}
          >
            {isChallengeDone ? '✓ Concluído' : 'Jogar (+150 XP)'}
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6">
          {/* PROJECTS ISLAND CONTENT */}
          {island.id === 'projects' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROJECTS_DATA.map((project) => {
                  const isViewed = stats.viewedProjects.includes(project.id);

                  return (
                    <div
                      key={project.id}
                      className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold border"
                            style={{
                              borderColor: `${project.accentColor}40`,
                              backgroundColor: `${project.accentColor}15`,
                              color: project.accentColor,
                            }}
                          >
                            {project.category}
                          </span>
                          {project.featured && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                              ★ DESTAQUE
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-fun font-bold text-white group-hover:text-sky-300 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                          {project.shortDesc}
                        </p>

                        {project.metrics && (
                          <div className="mt-3 p-2 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-emerald-400">
                            ⚡ {project.metrics}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mt-3.5">
                          {project.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setSelectedProject(project);
                            onInspectProject(project.id);
                          }}
                          className="text-xs font-mono font-semibold text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1"
                        >
                          <span>{isViewed ? '✓ Inspecionado' : 'Inspecionar (+50 XP)'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
                              title="Repositório GitHub"
                            >
                              <Github className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 transition-colors"
                              title="Ver Online"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EXPERIENCE ISLAND CONTENT */}
          {island.id === 'experience' && (
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-8">
                {EXPERIENCE_DATA.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Glowing Marker */}
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-slate-900 shadow-md" />

                    <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="text-base font-fun font-bold text-white">
                          {item.role}
                        </h3>
                        <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {item.period}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-3">
                        <span className="font-semibold text-sky-400">{item.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-300 mb-4 list-disc list-inside">
                        {item.highlights.map((point, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {point}
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                        {item.techStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-amber-300/80 border border-amber-500/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SKILLS ISLAND CONTENT */}
          {island.id === 'skills' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {SKILLS_DATA.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5"
                  >
                    <h3 className="text-sm font-fun font-bold text-purple-400 mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                      <span>{cat.title}</span>
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </h3>

                    <div className="space-y-3.5">
                      {cat.skills.map((skill, sIdx) => (
                        <div key={sIdx}>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className={skill.highlight ? 'text-white font-semibold' : 'text-slate-300'}>
                              {skill.name}
                            </span>
                            <span className="text-purple-400 font-bold">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-700"
                              style={{ width: `${skill.level}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION ISLAND CONTENT */}
          {island.id === 'education' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                {EDUCATION_DATA.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          {edu.period}
                        </span>
                        {edu.badgeName && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                            ★ {edu.badgeName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-fun font-bold text-white">
                        {edu.degree}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400">
                        {edu.institution}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                        {edu.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {edu.skillsAcquired.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABOUT & CONTACT ISLAND CONTENT */}
          {island.id === 'about' && (
            <div className="space-y-6">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-fun font-bold text-white mb-2">
                  Olá! Eu sou o {PERSONAL_INFO.name} 👋
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  {PERSONAL_INFO.bio}
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{PERSONAL_INFO.availability}</span>
                </div>
              </div>

              {/* Social Channels & Contact Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Email Direto</span>
                      <span className="text-[11px] text-slate-400 font-mono">Copiar endereço</span>
                    </div>
                  </div>
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500 group-hover:text-white" />
                  )}
                </button>

                <a
                  href={PERSONAL_INFO.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <Linkedin className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">LinkedIn</span>
                      <span className="text-[11px] text-slate-400">Conectar perfil</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </a>

                <a
                  href={PERSONAL_INFO.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">WhatsApp</span>
                      <span className="text-[11px] text-slate-400">Conversar agora</span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </a>
              </div>

              {/* Direct Message Transmitter */}
              <form onSubmit={handleSendMessage} className="bg-slate-950/70 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-pink-400" />
                    <span>Terminal de Mensagem Rápida</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Disparo Imediato</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Escreva uma mensagem rápida para Danilo..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-pink-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Enviar</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>

                {messageSent && (
                  <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                    ✓ Sinal galáctico transmitido com sucesso! Retornarei em breve.
                  </p>
                )}
              </form>
            </div>
          )}
        </div>

        {/* Project Detailed Inspection Drawer/Modal if opened */}
        <AnimatePresence>
          {selectedProject && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="text-xs font-mono text-sky-400 font-bold">
                    [TELEMETRIA DO PROJETO]
                  </span>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <h3 className="text-2xl font-fun font-bold text-white mt-4">
                  {selectedProject.title}
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {selectedProject.description}
                </p>

                {selectedProject.metrics && (
                  <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
                    🏆 Impacto Operacional: {selectedProject.metrics}
                  </div>
                )}

                <div className="mt-6">
                  <h4 className="text-xs font-mono text-slate-400 mb-2">Stack Utilizada:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono font-bold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  onClick={() => setSelectedProject(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Voltar à Ilha
                </button>
                {selectedProject.liveUrl && (
                  <a
                    href={selectedProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-fun font-bold flex items-center gap-1.5 shadow-lg"
                  >
                    <span>Abrir Demo</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
