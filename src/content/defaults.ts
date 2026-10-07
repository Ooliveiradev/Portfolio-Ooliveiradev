import { getPortfolioContent } from '../i18n/portfolio';
import type { IslandId, PortfolioMedia } from '../types';
import {
  CONTENT_SCHEMA_VERSION,
  DEFAULT_ACCENT,
  emptyText,
  type LocalizedList,
  type LocalizedText,
  type MediaDoc,
  type PortfolioDocument,
} from './model';

const text = (pt: string | undefined, en: string | undefined): LocalizedText => ({ pt: pt ?? '', en: en ?? pt ?? '' });
const list = (pt: string[] | undefined, en: string[] | undefined): LocalizedList => ({ pt: [...(pt ?? [])], en: [...(en ?? pt ?? [])] });

const ISLAND_INTRO: Partial<Record<IslandId, LocalizedText>> = {
  projects: {
    pt: 'Da proposta à arquitetura: explore as decisões, o código e os resultados de cada aplicação.',
    en: 'From concept to architecture: explore the decisions, code and results behind each application.',
  },
  experience: {
    pt: 'Da atuação operacional ao desenvolvimento de interfaces: uma trajetória em ordem cronológica, da experiência mais recente às primeiras atividades.',
    en: 'From operations to interface development: a journey from the most recent experience to the earliest roles.',
  },
  skills: {
    pt: 'Interfaces, dados e inteligência artificial conectados na construção dos projetos deste portfólio.',
    en: 'Interfaces, data and artificial intelligence connected across the projects in this portfolio.',
  },
  education: {
    pt: 'Formação acadêmica e cursos que sustentam a prática em desenvolvimento de software.',
    en: 'Academic education and courses supporting hands-on software development.',
  },
};

const mediaDoc = (item: PortfolioMedia): MediaDoc => ({
  id: item.id, kind: item.kind, src: item.src, thumbnail: item.thumbnail ?? '',
  alt: { pt: item.alt, en: item.alt }, caption: { pt: item.caption, en: item.caption },
});

/** The portfolio exactly as it ships in the code. Used until something is published, and as the fallback. */
export function createDefaultDocument(): PortfolioDocument {
  const pt = getPortfolioContent('pt');
  const en = getPortfolioContent('en');
  const ptInfo = pt.personalInfo;
  const enInfo = en.personalInfo;

  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    profile: {
      name: ptInfo.name,
      fullName: ptInfo.fullName,
      title: text(ptInfo.title, enInfo.title),
      subtitle: text(ptInfo.subtitle, enInfo.subtitle),
      bio: text(ptInfo.bio, enInfo.bio),
      availability: text(ptInfo.availability, enInfo.availability),
      location: text(ptInfo.location, enInfo.location),
      email: ptInfo.email,
      phone: ptInfo.phone,
      showPhone: false,
      github: ptInfo.github,
      linkedin: ptInfo.linkedin,
      links: ptInfo.links.map(link => ({ ...link })),
      photo: ptInfo.photo,
      resumeUrl: ptInfo.resumeUrl,
      resumeLabel: text(ptInfo.resumeLabel, enInfo.resumeLabel),
    },
    islands: pt.islands.map((island, index) => ({
      id: island.id,
      visible: true,
      name: text(island.name, en.islands[index].name),
      tagline: text(island.tagline, en.islands[index].tagline),
      intro: ISLAND_INTRO[island.id] ?? emptyText(),
      challengeTitle: text(island.challengeTitle, en.islands[index].challengeTitle),
      color: island.color,
    })),
    projects: pt.projects.map((project, index) => {
      const english = en.projects[index];
      return {
        id: project.id,
        visible: true,
        featured: project.featured,
        accentColor: project.accentColor,
        title: text(project.title, english.title),
        category: text(project.category, english.category),
        role: text(project.role, english.role),
        statusBadge: text(project.statusBadge, english.statusBadge),
        shortDesc: text(project.shortDesc, english.shortDesc),
        description: text(project.description, english.description),
        metrics: text(project.metrics, english.metrics),
        tags: [...project.tags],
        liveUrl: project.liveUrl && project.liveUrl !== '#' ? project.liveUrl : '',
        githubUrl: project.githubUrl ?? '',
        stats: (project.stats ?? []).map((stat, i) => ({
          id: `stat-${i + 1}`, icon: stat.icon ?? '',
          label: text(stat.label, english.stats?.[i]?.label), value: text(stat.value, english.stats?.[i]?.value),
        })),
        highlights: list(project.highlights, english.highlights),
        architecture: {
          overview: text(project.architecture?.overview, english.architecture?.overview),
          flow: list(project.architecture?.flow, english.architecture?.flow),
          database: text(project.architecture?.database, english.architecture?.database),
          security: list(project.architecture?.security, english.architecture?.security),
        },
        quickStart: {
          cloneCmd: project.quickStart?.cloneCmd ?? '',
          installCmd: project.quickStart?.installCmd ?? '',
          runCmd: project.quickStart?.runCmd ?? '',
          envExample: project.quickStart?.envExample ?? '',
        },
        readme: text(project.readme, english.readme),
        media: (project.media ?? []).map(mediaDoc),
      };
    }),
    experience: pt.experience.map((item, index) => {
      const english = en.experience[index];
      return {
        id: item.id,
        visible: true,
        role: text(item.role, english.role),
        company: text(item.company, english.company),
        period: text(item.period, english.period),
        location: text(item.location, english.location),
        highlights: list(item.highlights, english.highlights),
        techStack: list(item.techStack, english.techStack),
      };
    }),
    education: pt.education.map((item, index) => {
      const english = en.education[index];
      return {
        id: item.id,
        visible: true,
        degree: text(item.degree, english.degree),
        institution: text(item.institution, english.institution),
        period: text(item.period, english.period),
        description: text(item.description, english.description),
        skillsAcquired: list(item.skillsAcquired, english.skillsAcquired),
        badgeName: text(item.badgeName, english.badgeName),
        certificates: (item.certificates ?? []).map(mediaDoc),
      };
    }),
    skills: pt.skills.map((category, index) => ({
      id: `skills-${index + 1}`,
      visible: true,
      title: text(category.title, en.skills[index].title),
      icon: category.icon,
      skills: category.skills.map((skill, i) => ({
        id: `skill-${index + 1}-${i + 1}`, name: skill.name, level: skill.level, highlight: Boolean(skill.highlight),
      })),
    })),
    badges: pt.badges.map((badge, index) => ({
      id: badge.id,
      title: text(badge.title, en.badges[index].title),
      description: text(badge.description, en.badges[index].description),
    })),
    appearance: { accentColor: DEFAULT_ACCENT, showCodeStory: true },
    texts: {},
  };
}
