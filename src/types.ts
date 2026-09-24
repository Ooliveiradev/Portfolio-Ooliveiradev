export type IslandId = 'projects' | 'experience' | 'skills' | 'education' | 'about' | 'analytics';

export type GameMode =
  | 'landing'
  | 'entering'
  | 'driving'
  | 'landing-island'
  | 'inspecting'
  | 'takeoff'
  | 'exiting';

export type GraphicsQuality = 'low' | 'mid' | 'high';

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

/** Keep media local or on an explicitly approved host; test assets stay visibly labelled. */
export interface PortfolioMedia {
  id: string;
  kind: 'image' | 'video';
  src: string;
  thumbnail: string;
  alt: string;
  caption: string;
  testOnly?: boolean;
}

export interface ProjectItem {
  media?: PortfolioMedia[];
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
  readme: string;
  role?: string;
  statusBadge?: string;
  stats?: { label: string; value: string; icon?: string }[];
  highlights?: string[];
  architecture?: {
    overview: string;
    flow: string[];
    database?: string;
    security?: string[];
  };
  quickStart?: {
    cloneCmd: string;
    installCmd: string;
    runCmd: string;
    envExample?: string;
  };
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
  certificates?: PortfolioMedia[];
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

export interface RaceLeaderboardEntry {
  id: string;
  name: string;
  timeSeconds: number;
  formattedTime: string;
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

export type WhisperColor = 'cyan' | 'purple' | 'amber' | 'emerald';

export interface CosmicWhisper {
  id: string;
  author: string;
  avatarIcon?: string;
  origin?: string;
  message: string;
  position: [number, number, number];
  createdAt: string;
  likes: number;
  color: WhisperColor;
}

export interface ProjectVisitMetric {
  projectId: string;
  projectName: string;
  visits: number;
  percentage: number;
}

export interface DayMetric {
  date: string;
  visits: number;
}

export interface HeatmapSample {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

export interface PortfolioAnalyticsData {
  status?: 'available' | 'unavailable';
  totalVisits: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
  topProjects: ProjectVisitMetric[];
  dailyVisits: DayMetric[];
  spatialHeatmap: HeatmapSample[];
  lastUpdated: string;
}

