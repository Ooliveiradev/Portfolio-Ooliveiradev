export type IslandId = 'projects' | 'experience' | 'skills' | 'education' | 'about';

export type CameraViewMode = 'chase' | 'iso' | 'tactical55';

export interface IslandConfig {
  id: IslandId;
  name: string;
  tagline: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  angleOffset: number;
  elevation: number;
  iconName: string;
  challengeTitle: string;
  challengeXp: number;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: string;
  shortDesc: string;
  description: string;
  tags: string[];
  metrics?: string;
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  accentColor: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  location: string;
  highlights: string[];
  techStack: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  period: string;
  description: string;
  skillsAcquired: string[];
  badgeName?: string;
}

export interface SkillCategory {
  title: string;
  icon: string;
  skills: { name: string; level: number; highlight?: boolean }[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface CrystalCollectible {
  id: number;
  position: [number, number, number];
  collected: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  badgesCount: number;
  title: string;
  date: string;
}

export interface UserStats {
  xp: number;
  level: number;
  visitedIslands: IslandId[];
  completedChallenges: IslandId[];
  viewedProjects: string[];
  collectedCrystals: number[];
  unlockedBadges: string[];
}
