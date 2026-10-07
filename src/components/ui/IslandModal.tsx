import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { MaterialIcon, GithubIcon, LinkedinIcon } from './MaterialIcon';
import { ProjectDetailModal } from './ProjectDetailModal';
import {
  IslandConfig,
  IslandId,
  ProjectItem,
  UserStats
} from '../../types';
import { sounds } from '../../audio/soundManager';
import { useI18n } from '../../i18n/I18nProvider';
import { useContent } from '../../content/ContentProvider';
import { portraitUrl } from '../../assets/portrait';
import { CinematicDialog } from './narrative/CinematicDialog';
import { NarrativeHero } from './narrative/NarrativeHero';
import { MediaGallery } from './narrative/MediaGallery';
import { NarrativeTimeline } from './narrative/NarrativeTimeline';
import { CodeStory } from './narrative/CodeStory';
import clockSource from '../../utils/pausableClock.ts?raw';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface IslandModalProps {
  island: IslandConfig;
  stats: UserStats;
  onClose: () => void;
  onStartChallenge: (islandId: IslandId) => void;
  onInspectProject: (projectId: string) => void;
  lowPower?: boolean;
}

const EmptyIsland = ({ locale }: { locale: string }) => (
  <p className="rounded-xl border border-dashed border-slate-700/80 p-8 text-center text-xs font-mono text-slate-400">
    {locale === 'pt' ? 'Novidades em breve.' : 'More coming soon.'}
  </p>
);

/** Short, readable form of a profile link, e.g. https://github.com/user -> @user. */
const handleOf = (url: string): string => {
  try {
    const { hostname, pathname } = new URL(url);
    const last = pathname.split('/').filter(Boolean).pop();
    return last ? `@${last}` : hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const IslandModal: React.FC<IslandModalProps> = ({
  island,
  stats,
  onClose,
  onStartChallenge,
  onInspectProject,
  lowPower = false,
}) => {
  const { locale } = useI18n();
  const content = useContent();
  const { text } = content;
  const PERSONAL_INFO = content.personalInfo;
  const PROJECTS_DATA = content.projects;
  const EXPERIENCE_DATA = content.experience;
  const EDUCATION_DATA = content.education;
  const SKILLS_DATA = content.skills;
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const currentProjectIndex = selectedProject
    ? PROJECTS_DATA.findIndex((p) => p.id === selectedProject.id)
    : -1;

  const handlePrevProject = () => {
    if (currentProjectIndex > 0) {
      const prev = PROJECTS_DATA[currentProjectIndex - 1];
      setSelectedProject(prev);
      onInspectProject(prev.id);
    } else {
      const prev = PROJECTS_DATA[PROJECTS_DATA.length - 1];
      setSelectedProject(prev);
      onInspectProject(prev.id);
    }
  };

  const handleNextProject = () => {
    if (currentProjectIndex < PROJECTS_DATA.length - 1) {
      const next = PROJECTS_DATA[currentProjectIndex + 1];
      setSelectedProject(next);
      onInspectProject(next.id);
    } else {
      const next = PROJECTS_DATA[0];
      setSelectedProject(next);
      onInspectProject(next.id);
    }
  };

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

    // Dispara abertura no cliente de email para o endereço de Danilo
    const mailtoUrl = `mailto:${PERSONAL_INFO.email}?subject=${encodeURIComponent(text('about.mailSubject'))}&body=${encodeURIComponent(contactMessage)}`;
    window.location.href = mailtoUrl;

    setTimeout(() => {
      setMessageSent(false);
      setContactMessage('');
    }, 3500);
  };

  return (
    <CinematicDialog titleId="island-title" onClose={onClose} lowPower={lowPower}
        className="bg-[#0c1017] border border-slate-800/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90dvh]"
      >
        {/* Modal Header */}
        <div className="island-sheet-header shrink-0 relative p-5 sm:p-6 border-b border-slate-800/80 bg-gradient-to-r from-[#0c1017] via-[#111622] to-[#0c1017] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
              style={{ backgroundColor: island.color }}
            >
              <MaterialIcon name="code" className="text-slate-950" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                  {island.id}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 font-mono">
                  +100 XP Coletados
                </span>
              </div>
              <h2 id="island-title" className="text-xl sm:text-2xl font-sans font-bold text-slate-100 leading-tight">
                {island.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide mt-1 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: island.color, boxShadow: `0 0 8px ${island.color}80` }}
                />
                <span>{island.tagline}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Challenge Button */}
            {island.id !== 'analytics' && <button
              onClick={() => {
                sounds.playClick();
                onStartChallenge(island.id);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer shadow-md ${
                isChallengeDone
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 animate-pulse'
              }`}
            >
              {isChallengeDone ? (
                <>
                  <MaterialIcon name="check_circle" fill size={14} />
                  <span>Desafio Concluído</span>
                </>
              ) : (
                <>
                  <MaterialIcon name="auto_awesome" size={14} />
                  <span>Desafio da Ilha (+150 XP)</span>
                </>
              )}
            </button>}

            {/* Close Button */}
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="modal-close w-11 h-11 shrink-0 rounded-xl bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/50 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar e Retomar Navegação"
              aria-label={locale === 'pt' ? 'Fechar ilha' : 'Close island'}
            >
              <MaterialIcon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Challenge Banner */}
        {island.id !== 'analytics' && <div className="shrink-0 sm:hidden px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300 font-mono">Desafio Técnico:</span>
          <button
            onClick={() => onStartChallenge(island.id)}
            className={`min-h-11 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
              isChallengeDone
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-amber-500 text-black'
            }`}
          >
            {isChallengeDone ? '✓ Concluído' : 'Jogar (+150 XP)'}
          </button>
        </div>}

        {/* Modal Scrollable Body */}
        <div data-narrative-scroll className="p-5 sm:p-8 overflow-y-auto space-y-6 min-h-0">
          {island.id !== 'analytics' && (
            <NarrativeHero
              eyebrow={`${String(['projects', 'experience', 'skills', 'education', 'about', 'analytics'].indexOf(island.id) + 1).padStart(2, '0')} / ${island.name}`}
              title={island.id === 'about' ? PERSONAL_INFO.name : island.tagline}
              description={island.id === 'about' ? PERSONAL_INFO.subtitle : (content.islandIntro[island.id] ?? '')}
              accent={island.color} lowPower={lowPower}
              facts={island.id === 'skills' ? SKILLS_DATA.map(category => category.title).filter(Boolean) : undefined}
              portrait={island.id === 'about' ? { src: PERSONAL_INFO.photo || portraitUrl, alt: PERSONAL_INFO.name } : undefined}
            />
          )}

          {island.id === 'analytics' && <AnalyticsDashboard lowPower={lowPower} />}
          {/* PROJECTS ISLAND CONTENT */}
          {island.id === 'projects' && PROJECTS_DATA.length === 0 && <EmptyIsland locale={locale} />}
          {island.id === 'projects' && PROJECTS_DATA.length > 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROJECTS_DATA.map((project) => {
                  const isViewed = stats.viewedProjects.includes(project.id);

                  return (
                    <div
                      key={project.id}
                      className="bg-[#111622]/60 border border-slate-800/60 hover:border-slate-700/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[11px] font-mono px-2.5 py-0.5 rounded-md font-medium border"
                            style={{
                              borderColor: `${project.accentColor}40`,
                              backgroundColor: `${project.accentColor}15`,
                              color: project.accentColor,
                            }}
                          >
                            {project.category}
                          </span>
                          {project.featured && (
                            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-semibold">
                              {text('islands.featuredBadge')}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base sm:text-lg font-sans font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                          {project.shortDesc}
                        </p>

                        {project.metrics && (
                          <div className="mt-3 p-2 rounded-lg bg-[#07090e]/70 border border-slate-800/80 text-[11px] font-mono text-emerald-400">
                            ⚡ {project.metrics}
                          </div>
                        )}

                        {project.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3.5">
                          {project.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/90 text-slate-400 border border-slate-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setSelectedProject(project);
                            onInspectProject(project.id);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:text-sky-200 text-xs font-mono font-medium cursor-pointer flex items-center gap-1.5 transition shadow-sm"
                        >
                          <MaterialIcon name="description" size={14} className="text-sky-400" />
                          <span>{isViewed ? 'Inspecionar & README' : 'Inspecionar (+50 XP)'}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
                              title="Repositório GitHub"
                            >
                              <GithubIcon className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {project.liveUrl && project.liveUrl !== '#' && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-colors"
                              title="Ver Online"
                            >
                              <MaterialIcon name="open_in_new" size={14} />
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
          {island.id === 'experience' && EXPERIENCE_DATA.length === 0 && <EmptyIsland locale={locale} />}
          {island.id === 'experience' && EXPERIENCE_DATA.length > 0 && (
            <NarrativeTimeline label={text('islands.experienceLabel')} lowPower={lowPower}
              items={EXPERIENCE_DATA.map(item => ({
                id: item.id, date: item.period, title: item.role, subtitle: [item.company, item.location].filter(Boolean).join(' · '),
                content: <>
                  {item.highlights.length > 0 && <ul className="space-y-2 text-xs text-slate-300 mb-4 list-disc list-inside">
                    {item.highlights.map(point => <li key={point} className="leading-relaxed">{point}</li>)}
                  </ul>}
                  {item.techStack.length > 0 && <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                    {item.techStack.map(tech => <span key={tech} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 text-amber-300/80 border border-amber-500/20">{tech}</span>)}
                  </div>}
                </>,
              }))}
            />
          )}

          {/* SKILLS ISLAND CONTENT */}
          {island.id === 'skills' && (
            <div className="space-y-6">
              {content.appearance.showCodeStory && <section className="space-y-3">
                <h3 className="text-sm font-semibold">{text('islands.codeStoryTitle')}</h3>
                <p className="text-xs text-slate-400">src/utils/pausableClock.ts</p>
                <CodeStory code={clockSource.trim()} language="typescript" lineInterval={140} />
              </section>}
              {SKILLS_DATA.length === 0 && <EmptyIsland locale={locale} />}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SKILLS_DATA.map((cat, idx) => (
                  <div
                    key={idx}
                    className="bg-[#111622]/60 border border-slate-800/60 rounded-xl p-5"
                  >
                    <h3 className="text-sm font-sans font-bold text-sky-400 mb-4 pb-2 border-b border-slate-800/80 flex items-center justify-between">
                      <span>{cat.title}</span>
                      <MaterialIcon name="auto_awesome" className="text-sky-400" size={14} />
                    </h3>

                    <div className="space-y-3.5">
                      {cat.skills.map((skill, sIdx) => (
                        <div key={sIdx}>
                          <div className="flex justify-between text-xs font-mono mb-1">
                            <span className={skill.highlight ? 'text-slate-100 font-semibold' : 'text-slate-300'}>
                              {skill.name}
                            </span>
                            <span className="text-sky-400 font-bold">{skill.level}%</span>
                          </div>
                          <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-sky-400 to-sky-500 h-full rounded-full transition-all duration-700"
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
            <div className="space-y-4">
              <MediaGallery items={EDUCATION_DATA.flatMap(edu => edu.certificates ?? [])} lowPower={lowPower} title={text('islands.certificatesTitle')} />
              {EDUCATION_DATA.length === 0 && <EmptyIsland locale={locale} />}
              <div className="grid grid-cols-1 gap-4">
                {EDUCATION_DATA.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-[#111622]/60 border border-slate-800/60 rounded-xl p-5 flex flex-col sm:flex-row items-start justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          {edu.period}
                        </span>
                        {edu.badgeName && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono font-semibold">
                            ★ {edu.badgeName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-sans font-bold text-slate-100">
                        {edu.degree}
                      </h3>
                      <p className="text-xs font-medium text-slate-400">
                        {edu.institution}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-sans">
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
            <div className="space-y-5">
              <div className="bg-[#111622]/60 border border-slate-800/60 rounded-xl p-6">
                <h3 className="text-base sm:text-lg font-sans font-bold text-slate-100 mb-2">
                  {text('about.greeting')}
                </h3>
                {PERSONAL_INFO.bio && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 font-sans whitespace-pre-line">
                    {PERSONAL_INFO.bio}
                  </p>
                )}
                {PERSONAL_INFO.availability && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{PERSONAL_INFO.availability}</span>
                  </div>
                )}
                {PERSONAL_INFO.location && (
                  <p className="mt-3 text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                    <MaterialIcon name="location_on" size={14} className="text-slate-500" />
                    <span>{PERSONAL_INFO.location}</span>
                  </p>
                )}
              </div>

              {/* Social Channels & Contact Action Grid: only what the owner filled in */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {PERSONAL_INFO.github && (
                  <a
                    href={PERSONAL_INFO.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 hover:border-slate-600/80 text-left transition-all group hover:bg-[#151c2c]/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-200 shrink-0">
                        <GithubIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-100 block">GitHub</span>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">{handleOf(PERSONAL_INFO.github)}</span>
                      </div>
                    </div>
                    <MaterialIcon name="open_in_new" className="text-slate-500 group-hover:text-slate-300 shrink-0" size={16} />
                  </a>
                )}

                {PERSONAL_INFO.linkedin && (
                  <a
                    href={PERSONAL_INFO.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 hover:border-sky-500/60 text-left transition-all group hover:bg-[#151c2c]/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-950/60 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                        <LinkedinIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-100 block">LinkedIn</span>
                        <span className="text-[11px] text-slate-400 truncate block">{handleOf(PERSONAL_INFO.linkedin)}</span>
                      </div>
                    </div>
                    <MaterialIcon name="open_in_new" className="text-slate-500 group-hover:text-sky-300 shrink-0" size={16} />
                  </a>
                )}

                {/* Email (opens mailto, with a copy button beside it) */}
                {PERSONAL_INFO.email && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 hover:border-amber-500/50 text-left transition-all group hover:bg-[#151c2c]/70">
                    <a
                      href={`mailto:${PERSONAL_INFO.email}`}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                      title={`Enviar email para ${PERSONAL_INFO.email}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <MaterialIcon name="mail" size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-100 block">{text('about.emailLabel')}</span>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">
                          {PERSONAL_INFO.email}
                        </span>
                      </div>
                    </a>
                    <button
                      onClick={handleCopyEmail}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer shrink-0 ml-1"
                      title="Copiar endereço de email"
                    >
                      {copiedEmail ? (
                        <MaterialIcon name="check" className="text-emerald-400" size={16} />
                      ) : (
                        <MaterialIcon name="content_copy" className="group-hover:text-slate-200" size={16} />
                      )}
                    </button>
                  </div>
                )}

                {PERSONAL_INFO.phone && (
                  <a
                    href={`tel:${PERSONAL_INFO.phone.replace(/[^+\d]/g, '')}`}
                    className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 hover:border-emerald-500/50 transition-all hover:bg-[#151c2c]/70"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <MaterialIcon name="call" size={18} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-100 block">{locale === 'pt' ? 'Telefone' : 'Phone'}</span>
                      <span className="text-[11px] text-slate-400 font-mono truncate block">{PERSONAL_INFO.phone}</span>
                    </div>
                  </a>
                )}

                {PERSONAL_INFO.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#111622]/60 border border-slate-800/60 hover:border-slate-600/80 text-left transition-all group hover:bg-[#151c2c]/70"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-200 shrink-0">
                        <MaterialIcon name="link" size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-100 block truncate">{link.label}</span>
                        <span className="text-[11px] text-slate-400 font-mono truncate block">{handleOf(link.url)}</span>
                      </div>
                    </div>
                    <MaterialIcon name="open_in_new" className="text-slate-500 group-hover:text-slate-300 shrink-0" size={16} />
                  </a>
                ))}

                {PERSONAL_INFO.resumeUrl && (
                  <a
                    href={PERSONAL_INFO.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-400/70 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <MaterialIcon name="description" size={18} />
                      </div>
                      <span className="text-xs font-medium text-slate-100 truncate">{PERSONAL_INFO.resumeLabel || 'CV'}</span>
                    </div>
                    <MaterialIcon name="download" className="text-emerald-400 shrink-0" size={16} />
                  </a>
                )}
              </div>

              {/* Direct Message Transmitter */}
              {PERSONAL_INFO.email && (
                <form onSubmit={handleSendMessage} className="bg-[#111622]/60 border border-slate-800/60 p-5 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-mono font-medium text-slate-200 uppercase flex items-center gap-1.5">
                      <MaterialIcon name="send" className="text-sky-400" size={14} />
                      <span>{text('about.formTitle')}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{text('about.formDestination')}</span>
                      <span className="text-sky-300 underline underline-offset-2">{PERSONAL_INFO.email}</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder={text('about.formPlaceholder')}
                      aria-label={text('about.formPlaceholder')}
                      className="flex-1 bg-[#07090e] border border-slate-700/80 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold font-mono transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      title="Abrir no cliente de email para envio imediato"
                    >
                      <span>{text('about.formButton')}</span>
                      <MaterialIcon name="send" size={14} />
                    </button>
                  </div>

                  {messageSent && (
                    <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      {text('about.formSuccess')}
                    </p>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Project Detailed Inspection Modal with Styled README */}
        <AnimatePresence>
          {selectedProject && (
            <ProjectDetailModal
              project={selectedProject}
              lowPower={lowPower}
              onClose={() => setSelectedProject(null)}
              onPrev={handlePrevProject}
              onNext={handleNextProject}
            />
          )}
        </AnimatePresence>
    </CinematicDialog>
  );
};
