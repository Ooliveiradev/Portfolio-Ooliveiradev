import type { IslandId } from '../types';
import { createDefaultDocument } from './defaults';
import {
  CONTENT_SCHEMA_VERSION,
  DEFAULT_ACCENT,
  emptyList,
  emptyText,
  type AppearanceDoc,
  type BadgeDoc,
  type EducationDoc,
  type ExperienceDoc,
  type IslandDoc,
  type LocalizedList,
  type LocalizedText,
  type MediaDoc,
  type PortfolioDocument,
  type ProfileDoc,
  type ProjectDoc,
  type SkillCategoryDoc,
  type StatDoc,
} from './model';
import { UI_TEXTS } from './uiTexts';
import { isHexColor, isSafeLink, isSafeMediaUrl, trimmed } from './validation';

type Rec = Record<string, unknown>;

export const LIMITS = {
  short: 200,
  medium: 1000,
  long: 6000,
  readme: 60_000,
  items: 60,
  listItems: 40,
  url: 2048,
} as const;

const rec = (value: unknown): Rec => (value && typeof value === 'object' && !Array.isArray(value) ? value as Rec : {});
const arr = (value: unknown, max: number): unknown[] => (Array.isArray(value) ? value.slice(0, max) : []);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
const str = (value: unknown, max: number, fallback = ''): string => (typeof value === 'string' ? trimmed(value, max) : fallback);
const level = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : fallback;
const color = (value: unknown, fallback: string): string => (typeof value === 'string' && isHexColor(value.trim()) ? value.trim().toLowerCase() : fallback);
const link = (value: unknown): string => {
  const candidate = str(value, LIMITS.url);
  return isSafeLink(candidate) ? candidate : '';
};

const text = (value: unknown, max: number, fallback: LocalizedText = emptyText()): LocalizedText => {
  const source = rec(value);
  return { pt: str(source.pt, max, fallback.pt), en: str(source.en, max, fallback.en) };
};

const list = (value: unknown, max: number, fallback: LocalizedList = emptyList()): LocalizedList => {
  const source = rec(value);
  const clean = (input: unknown, base: string[]) =>
    Array.isArray(input) ? input.slice(0, LIMITS.listItems).map(item => str(item, max)).filter(Boolean) : base;
  return { pt: clean(source.pt, fallback.pt), en: clean(source.en, fallback.en) };
};

const plainList = (value: unknown, max: number, fallback: string[] = []): string[] =>
  Array.isArray(value) ? value.slice(0, LIMITS.listItems).map(item => str(item, max)).filter(Boolean) : fallback;

/** Drops repeated ids so React keys and lookups stay unique. */
const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => item.id && !seen.has(item.id) && seen.add(item.id));
};

const id = (value: unknown, prefix: string, index: number): string => str(value, 60) || `${prefix}-${index + 1}`;

const media = (value: unknown): MediaDoc[] => uniqueById(arr(value, LIMITS.items).map((raw, index) => {
  const item = rec(raw);
  return {
    id: id(item.id, 'media', index),
    kind: item.kind === 'video' ? 'video' as const : 'image' as const,
    src: str(item.src, LIMITS.url),
    thumbnail: str(item.thumbnail, LIMITS.url),
    alt: text(item.alt, LIMITS.medium),
    caption: text(item.caption, LIMITS.medium),
  };
})).filter(item => isSafeMediaUrl(item.src)).map(item => (isSafeMediaUrl(item.thumbnail) ? item : { ...item, thumbnail: '' }));

const profile = (value: unknown, base: ProfileDoc): ProfileDoc => {
  const source = rec(value);
  return {
    name: str(source.name, LIMITS.short, base.name) || base.name,
    fullName: str(source.fullName, LIMITS.short, base.fullName),
    title: text(source.title, LIMITS.medium, base.title),
    subtitle: text(source.subtitle, LIMITS.long, base.subtitle),
    bio: text(source.bio, LIMITS.long, base.bio),
    availability: text(source.availability, LIMITS.medium, base.availability),
    location: text(source.location, LIMITS.medium, base.location),
    email: str(source.email, 254, base.email),
    phone: str(source.phone, 40, base.phone),
    showPhone: bool(source.showPhone, base.showPhone),
    github: 'github' in source ? link(source.github) : base.github,
    linkedin: 'linkedin' in source ? link(source.linkedin) : base.linkedin,
    links: uniqueById(arr(source.links, LIMITS.listItems).map((raw, index) => {
      const item = rec(raw);
      return { id: id(item.id, 'link', index), label: str(item.label, LIMITS.short), url: link(item.url) };
    })).filter(item => item.label && item.url),
    photo: isSafeMediaUrl(str(source.photo, LIMITS.url)) ? str(source.photo, LIMITS.url) : '',
    resumeUrl: 'resumeUrl' in source ? link(source.resumeUrl) : base.resumeUrl,
    resumeLabel: text(source.resumeLabel, LIMITS.short, base.resumeLabel),
  };
};

const islands = (value: unknown, base: IslandDoc[]): IslandDoc[] => {
  const byId = new Map(base.map(island => [island.id, island]));
  const seen = new Set<IslandId>();
  const result: IslandDoc[] = [];
  for (const raw of arr(value, 12)) {
    const item = rec(raw);
    const fallback = byId.get(item.id as IslandId);
    if (!fallback || seen.has(fallback.id)) continue;
    seen.add(fallback.id);
    result.push({
      id: fallback.id,
      visible: bool(item.visible, true),
      name: text(item.name, LIMITS.short, fallback.name),
      tagline: text(item.tagline, LIMITS.medium, fallback.tagline),
      intro: text(item.intro, LIMITS.long, fallback.intro),
      challengeTitle: text(item.challengeTitle, LIMITS.short, fallback.challengeTitle),
      color: color(item.color, fallback.color),
    });
  }
  // Islands are part of the 3D world; one that is missing from the data is simply restored.
  for (const island of base) if (!seen.has(island.id)) result.push(island);
  return result.some(island => island.visible) ? result : result.map((island, index) => (index === 0 ? { ...island, visible: true } : island));
};

const stats = (value: unknown): StatDoc[] => uniqueById(arr(value, 12).map((raw, index) => {
  const item = rec(raw);
  return { id: id(item.id, 'stat', index), icon: str(item.icon, 60), label: text(item.label, LIMITS.short), value: text(item.value, LIMITS.medium) };
}));

const projects = (value: unknown): ProjectDoc[] => uniqueById(arr(value, LIMITS.items).map((raw, index) => {
  const item = rec(raw);
  const architecture = rec(item.architecture);
  const quick = rec(item.quickStart);
  return {
    id: id(item.id, 'project', index),
    visible: bool(item.visible, true),
    featured: bool(item.featured, false),
    accentColor: color(item.accentColor, DEFAULT_ACCENT),
    title: text(item.title, LIMITS.short),
    category: text(item.category, LIMITS.short),
    role: text(item.role, LIMITS.short),
    statusBadge: text(item.statusBadge, LIMITS.short),
    shortDesc: text(item.shortDesc, LIMITS.medium),
    description: text(item.description, LIMITS.long),
    metrics: text(item.metrics, LIMITS.medium),
    tags: plainList(item.tags, LIMITS.short),
    liveUrl: link(item.liveUrl),
    githubUrl: link(item.githubUrl),
    stats: stats(item.stats),
    highlights: list(item.highlights, LIMITS.medium),
    architecture: {
      overview: text(architecture.overview, LIMITS.long),
      flow: list(architecture.flow, LIMITS.medium),
      database: text(architecture.database, LIMITS.long),
      security: list(architecture.security, LIMITS.medium),
    },
    quickStart: {
      cloneCmd: str(quick.cloneCmd, LIMITS.medium),
      installCmd: str(quick.installCmd, LIMITS.medium),
      runCmd: str(quick.runCmd, LIMITS.medium),
      envExample: str(quick.envExample, LIMITS.long),
    },
    readme: text(item.readme, LIMITS.readme),
    media: media(item.media),
  };
}));

const experience = (value: unknown): ExperienceDoc[] => uniqueById(arr(value, LIMITS.items).map((raw, index) => {
  const item = rec(raw);
  return {
    id: id(item.id, 'exp', index),
    visible: bool(item.visible, true),
    role: text(item.role, LIMITS.short),
    company: text(item.company, LIMITS.short),
    period: text(item.period, LIMITS.short),
    location: text(item.location, LIMITS.short),
    highlights: list(item.highlights, LIMITS.medium),
    techStack: list(item.techStack, LIMITS.short),
  };
}));

const education = (value: unknown): EducationDoc[] => uniqueById(arr(value, LIMITS.items).map((raw, index) => {
  const item = rec(raw);
  return {
    id: id(item.id, 'edu', index),
    visible: bool(item.visible, true),
    degree: text(item.degree, LIMITS.short),
    institution: text(item.institution, LIMITS.medium),
    period: text(item.period, LIMITS.short),
    description: text(item.description, LIMITS.long),
    skillsAcquired: list(item.skillsAcquired, LIMITS.short),
    badgeName: text(item.badgeName, LIMITS.short),
    certificates: media(item.certificates),
  };
}));

const skills = (value: unknown): SkillCategoryDoc[] => uniqueById(arr(value, LIMITS.items).map((raw, index) => {
  const item = rec(raw);
  return {
    id: id(item.id, 'skills', index),
    visible: bool(item.visible, true),
    title: text(item.title, LIMITS.short),
    icon: str(item.icon, 60) || 'Layers',
    skills: uniqueById(arr(item.skills, LIMITS.items).map((skill, skillIndex) => {
      const entry = rec(skill);
      return { id: id(entry.id, 'skill', skillIndex), name: str(entry.name, LIMITS.short), level: level(entry.level, 80), highlight: bool(entry.highlight, false) };
    })),
  };
}));

const badges = (value: unknown, base: BadgeDoc[]): BadgeDoc[] => {
  const incoming = new Map(arr(value, 40).map(raw => [str(rec(raw).id, 60), rec(raw)]));
  // Badge ids drive the game's achievements: the list is fixed, only the wording changes.
  return base.map(fallback => {
    const item = incoming.get(fallback.id) ?? {};
    return { id: fallback.id, title: text(item.title, LIMITS.short, fallback.title), description: text(item.description, LIMITS.medium, fallback.description) };
  });
};

const appearance = (value: unknown, base: AppearanceDoc): AppearanceDoc => {
  const source = rec(value);
  return { accentColor: color(source.accentColor, base.accentColor), showCodeStory: bool(source.showCodeStory, base.showCodeStory) };
};

const texts = (value: unknown): Record<string, LocalizedText> => {
  const source = rec(value);
  const result: Record<string, LocalizedText> = {};
  for (const key of Object.keys(UI_TEXTS)) {
    if (key in source) result[key] = text(source[key], LIMITS.long);
  }
  return result;
};

/**
 * Turns anything that was stored or typed into a safe, complete document. Unknown fields are dropped,
 * unsafe links are removed and missing pieces fall back to the built-in portfolio.
 */
export function normalizeDocument(raw: unknown, base: PortfolioDocument = createDefaultDocument()): PortfolioDocument {
  const source = rec(raw);
  return {
    schemaVersion: CONTENT_SCHEMA_VERSION,
    profile: profile(source.profile, base.profile),
    islands: islands(source.islands, base.islands),
    projects: Array.isArray(source.projects) ? projects(source.projects) : base.projects,
    experience: Array.isArray(source.experience) ? experience(source.experience) : base.experience,
    education: Array.isArray(source.education) ? education(source.education) : base.education,
    skills: Array.isArray(source.skills) ? skills(source.skills) : base.skills,
    badges: badges(source.badges, base.badges),
    appearance: appearance(source.appearance, base.appearance),
    texts: texts(source.texts),
  };
}

/** The document as it is stored: sanitised, and without copy overrides that merely repeat the built-in text. */
export function prepareForPublish(doc: PortfolioDocument): PortfolioDocument {
  const normalized = normalizeDocument(doc);
  for (const key of Object.keys(normalized.texts)) {
    const entry = UI_TEXTS[key];
    const override = normalized.texts[key];
    if (entry && override.pt === entry.pt && override.en === entry.en) delete normalized.texts[key];
  }
  return normalized;
}
