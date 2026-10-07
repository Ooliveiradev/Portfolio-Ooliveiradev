import type { IslandId } from '../types';
import type { Locale } from '../i18n/locale';

/** Text that exists in both languages. An empty side falls back to the other one. */
export interface LocalizedText { pt: string; en: string }
export interface LocalizedList { pt: string[]; en: string[] }

export const CONTENT_SCHEMA_VERSION = 1;

export interface MediaDoc {
  id: string;
  kind: 'image' | 'video';
  src: string;
  /** Optional preview image. Videos without one show a neutral tile. */
  thumbnail: string;
  alt: LocalizedText;
  caption: LocalizedText;
}

export interface ExtraLinkDoc { id: string; label: string; url: string }

export interface ProfileDoc {
  name: string;
  fullName: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  bio: LocalizedText;
  availability: LocalizedText;
  location: LocalizedText;
  email: string;
  phone: string;
  showPhone: boolean;
  github: string;
  linkedin: string;
  links: ExtraLinkDoc[];
  /** Empty keeps the portrait that ships with the site. */
  photo: string;
  resumeUrl: string;
  resumeLabel: LocalizedText;
}

export interface IslandDoc {
  id: IslandId;
  visible: boolean;
  name: LocalizedText;
  tagline: LocalizedText;
  intro: LocalizedText;
  challengeTitle: LocalizedText;
  color: string;
}

export interface StatDoc { id: string; icon: string; label: LocalizedText; value: LocalizedText }

export interface ProjectDoc {
  id: string;
  visible: boolean;
  featured: boolean;
  accentColor: string;
  title: LocalizedText;
  category: LocalizedText;
  role: LocalizedText;
  statusBadge: LocalizedText;
  shortDesc: LocalizedText;
  description: LocalizedText;
  metrics: LocalizedText;
  tags: string[];
  liveUrl: string;
  githubUrl: string;
  stats: StatDoc[];
  highlights: LocalizedList;
  architecture: {
    overview: LocalizedText;
    flow: LocalizedList;
    database: LocalizedText;
    security: LocalizedList;
  };
  quickStart: { cloneCmd: string; installCmd: string; runCmd: string; envExample: string };
  readme: LocalizedText;
  media: MediaDoc[];
}

export interface ExperienceDoc {
  id: string;
  visible: boolean;
  role: LocalizedText;
  company: LocalizedText;
  period: LocalizedText;
  location: LocalizedText;
  highlights: LocalizedList;
  techStack: LocalizedList;
}

export interface EducationDoc {
  id: string;
  visible: boolean;
  degree: LocalizedText;
  institution: LocalizedText;
  period: LocalizedText;
  description: LocalizedText;
  skillsAcquired: LocalizedList;
  badgeName: LocalizedText;
  certificates: MediaDoc[];
}

export interface SkillDoc { id: string; name: string; level: number; highlight: boolean }
export interface SkillCategoryDoc {
  id: string;
  visible: boolean;
  title: LocalizedText;
  icon: string;
  skills: SkillDoc[];
}

export interface BadgeDoc { id: string; title: LocalizedText; description: LocalizedText }

export interface AppearanceDoc {
  /** Replaces the sky-blue accent used across the interface. */
  accentColor: string;
  showCodeStory: boolean;
}

export interface PortfolioDocument {
  schemaVersion: number;
  profile: ProfileDoc;
  islands: IslandDoc[];
  projects: ProjectDoc[];
  experience: ExperienceDoc[];
  education: EducationDoc[];
  skills: SkillCategoryDoc[];
  badges: BadgeDoc[];
  appearance: AppearanceDoc;
  /** Overrides for the copy catalogued in uiTexts.ts. Only changed entries are stored. */
  texts: Record<string, LocalizedText>;
}

export const DEFAULT_ACCENT = '#38bdf8';

export const pick = (value: LocalizedText, locale: Locale): string => {
  const primary = value[locale];
  return primary.trim() ? primary : value[locale === 'pt' ? 'en' : 'pt'];
};

export const pickList = (value: LocalizedList, locale: Locale): string[] => {
  const primary = value[locale].filter(item => item.trim());
  return primary.length ? primary : value[locale === 'pt' ? 'en' : 'pt'].filter(item => item.trim());
};

export const emptyText = (): LocalizedText => ({ pt: '', en: '' });
export const emptyList = (): LocalizedList => ({ pt: [], en: [] });

export const newId = (prefix: string): string =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
