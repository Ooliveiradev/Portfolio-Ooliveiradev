import { ISLANDS_CONFIG } from '../data/portfolioData';
import type { Locale } from '../i18n/locale';
import { getPortfolioContent } from '../i18n/portfolio';
import type {
  Badge, EducationItem, ExperienceItem, IslandConfig, PersonalInfo, PortfolioMedia, ProjectItem,
  SkillCategory,
} from '../types';
import { pick, pickList, type AppearanceDoc, type MediaDoc, type PortfolioDocument } from './model';
import { resolveUiText } from './uiTexts';

export interface ResolvedContent {
  personalInfo: PersonalInfo;
  /** Only the islands the owner left visible, in the order the owner chose. */
  islands: IslandConfig[];
  projects: ProjectItem[];
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  badges: Badge[];
  leaderboard: ReturnType<typeof getPortfolioContent>['leaderboard'];
  raceLeaderboard: ReturnType<typeof getPortfolioContent>['raceLeaderboard'];
  appearance: AppearanceDoc;
  /** Per-island opening paragraph; empty when the owner cleared it. */
  islandIntro: Partial<Record<IslandConfig['id'], string>>;
  text: (key: string, values?: Record<string, string>) => string;
}

const nonEmpty = (value: string): string | undefined => (value.trim() ? value : undefined);

const resolveMedia = (items: MediaDoc[], locale: Locale): PortfolioMedia[] => items.map(item => {
  const caption = pick(item.caption, locale);
  return {
    id: item.id,
    kind: item.kind,
    src: item.src,
    thumbnail: nonEmpty(item.thumbnail),
    alt: pick(item.alt, locale) || caption || '',
    caption,
  };
});

export function resolveContent(doc: PortfolioDocument, locale: Locale): ResolvedContent {
  const builtIn = getPortfolioContent(locale);
  const { profile } = doc;
  const geometry = new Map(ISLANDS_CONFIG.map(island => [island.id, island]));

  const personalInfo: PersonalInfo = {
    name: profile.name,
    fullName: profile.fullName,
    title: pick(profile.title, locale),
    subtitle: pick(profile.subtitle, locale),
    bio: pick(profile.bio, locale),
    email: profile.email,
    phone: profile.showPhone ? profile.phone : '',
    location: pick(profile.location, locale),
    github: profile.github,
    linkedin: profile.linkedin,
    availability: pick(profile.availability, locale),
    links: profile.links.map(link => ({ ...link })),
    photo: profile.photo,
    resumeUrl: profile.resumeUrl,
    resumeLabel: pick(profile.resumeLabel, locale),
  };

  const islandIntro: ResolvedContent['islandIntro'] = {};
  const islands: IslandConfig[] = [];
  for (const island of doc.islands) {
    if (!island.visible) continue;
    const base = geometry.get(island.id);
    if (!base) continue;
    islandIntro[island.id] = pick(island.intro, locale);
    islands.push({
      ...base,
      name: pick(island.name, locale),
      tagline: pick(island.tagline, locale),
      challengeTitle: pick(island.challengeTitle, locale),
      color: island.color,
    });
  }

  const projects: ProjectItem[] = doc.projects.filter(project => project.visible).map(project => {
    const stats = project.stats
      .map(stat => ({ label: pick(stat.label, locale), value: pick(stat.value, locale), icon: nonEmpty(stat.icon) }))
      .filter(stat => stat.label || stat.value);
    const highlights = pickList(project.highlights, locale);
    const flow = pickList(project.architecture.flow, locale);
    const security = pickList(project.architecture.security, locale);
    const overview = pick(project.architecture.overview, locale);
    const database = pick(project.architecture.database, locale);
    const { cloneCmd, installCmd, runCmd, envExample } = project.quickStart;
    return {
      id: project.id,
      title: pick(project.title, locale),
      category: pick(project.category, locale),
      role: nonEmpty(pick(project.role, locale)),
      statusBadge: nonEmpty(pick(project.statusBadge, locale)),
      shortDesc: pick(project.shortDesc, locale),
      description: pick(project.description, locale),
      metrics: nonEmpty(pick(project.metrics, locale)),
      tags: project.tags,
      liveUrl: nonEmpty(project.liveUrl),
      githubUrl: nonEmpty(project.githubUrl),
      featured: project.featured,
      accentColor: project.accentColor,
      readme: pick(project.readme, locale),
      stats: stats.length ? stats : undefined,
      highlights: highlights.length ? highlights : undefined,
      architecture: overview || flow.length || database || security.length
        ? { overview, flow, database: nonEmpty(database), security: security.length ? security : undefined }
        : undefined,
      quickStart: cloneCmd || installCmd || runCmd
        ? { cloneCmd, installCmd, runCmd, envExample: nonEmpty(envExample) }
        : undefined,
      media: project.media.length ? resolveMedia(project.media, locale) : undefined,
    };
  });

  const experience: ExperienceItem[] = doc.experience.filter(item => item.visible).map(item => ({
    id: item.id,
    role: pick(item.role, locale),
    company: pick(item.company, locale),
    period: pick(item.period, locale),
    location: pick(item.location, locale),
    highlights: pickList(item.highlights, locale),
    techStack: pickList(item.techStack, locale),
  }));

  const education: EducationItem[] = doc.education.filter(item => item.visible).map(item => ({
    id: item.id,
    degree: pick(item.degree, locale),
    institution: pick(item.institution, locale),
    period: pick(item.period, locale),
    description: pick(item.description, locale),
    skillsAcquired: pickList(item.skillsAcquired, locale),
    badgeName: nonEmpty(pick(item.badgeName, locale)),
    certificates: item.certificates.length ? resolveMedia(item.certificates, locale) : undefined,
  }));

  const skills: SkillCategory[] = doc.skills.filter(category => category.visible).map(category => ({
    title: pick(category.title, locale),
    icon: category.icon,
    skills: category.skills.map(skill => ({ name: skill.name, level: skill.level, highlight: skill.highlight || undefined })),
  }));

  const badgeCopy = new Map(doc.badges.map(badge => [badge.id, badge]));
  const badges: Badge[] = builtIn.badges.map(badge => {
    const copy = badgeCopy.get(badge.id);
    return copy ? { ...badge, title: pick(copy.title, locale), description: pick(copy.description, locale) } : badge;
  });

  return {
    personalInfo,
    islands,
    projects,
    experience,
    education,
    skills,
    badges,
    leaderboard: builtIn.leaderboard,
    raceLeaderboard: builtIn.raceLeaderboard,
    appearance: doc.appearance,
    islandIntro,
    text: (key, values) => resolveUiText(doc.texts, key, locale, {
      name: profile.name,
      firstName: profile.name.split(/\s+/)[0] ?? profile.name,
      email: profile.email,
      ...values,
    }),
  };
}
