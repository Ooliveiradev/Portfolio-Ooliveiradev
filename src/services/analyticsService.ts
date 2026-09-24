import type {
  DayMetric,
  HeatmapSample,
  PortfolioAnalyticsData,
  ProjectVisitMetric,
} from '../types';

export type AnalyticsTimeframe = '7d' | '30d';

type TelemetryEvent =
  | { kind: 'session_start'; at: number }
  | { kind: 'project_view'; at: number; projectId: string }
  | { kind: 'spatial'; at: number; coords: [number, number, number] }
  | { kind: 'heartbeat'; at: number; durationSeconds: number };

interface MockAnalyticsState {
  createdAt: number;
  totalVisits: number;
  uniqueVisitors: number;
  totalDurationSeconds: number;
  durationSamples: number;
  projectViews: Record<string, number>;
  spatialSamples: HeatmapSample[];
}

interface RealtimeChannel {
  callbacks: Set<(data: PortfolioAnalyticsData) => void>;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

const SESSION_KEY = 'portfolio_analytics_session_v1';
const MOCK_STATE_KEY = 'portfolio_analytics_mock_v1';
const BATCH_INTERVAL_MS = 20_000;
const SPATIAL_SAMPLE_INTERVAL_MS = 5_000;
const MAX_LOCAL_HEATMAP_SAMPLES = 96;

const projectCatalog = [
  { id: 'quantia-mvp', name: 'QuantIA' },
  { id: 'ecofinance', name: 'EcoFinance' },
  { id: 'portfolio-3d', name: 'Portfolio 3D' },
  { id: 'nutrilife', name: 'NutriLife' },
] as const;

const channels = new Map<AnalyticsTimeframe, RealtimeChannel>();
const eventQueue: TelemetryEvent[] = [];

let volatileSessionId: string | null = null;
let sessionStartedAt = Date.now();
let lastDurationCheckpointAt = sessionStartedAt;
let batchingTimer: ReturnType<typeof setInterval> | null = null;
let telemetryStarted = false;
let lastSpatialSampleAt = 0;

const hasWindow = (): boolean => typeof window !== 'undefined';

const anonymousTimestamp = (timestamp = Date.now()): number =>
  Math.floor(timestamp / 60_000) * 60_000;

const safeLocalStorage = (): Storage | null => {
  if (!hasWindow()) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const safeSessionStorage = (): Storage | null => {
  if (!hasWindow()) return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const createSessionId = (): string => {
  const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  if (randomUUID) return randomUUID();
  const randomPart = Math.random().toString(36).slice(2, 14);
  return `session-${Date.now().toString(36)}-${randomPart}`;
};

const getSessionId = (): string => {
  const storage = safeSessionStorage();
  const stored = storage?.getItem(SESSION_KEY);
  if (stored) return stored;
  volatileSessionId ??= createSessionId();
  try {
    storage?.setItem(SESSION_KEY, volatileSessionId);
  } catch {
    // Ephemeral in-memory fallback when browser storage is unavailable.
  }
  return volatileSessionId;
};

export async function hashAnonymousValue(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Deterministic non-cryptographic fallback for runtimes without Web Crypto.
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function calculateAverageDurationSeconds(durations: readonly number[]): number {
  if (durations.length === 0) return 0;
  const safeDurations = durations.filter((value) => Number.isFinite(value) && value >= 0);
  if (safeDurations.length === 0) return 0;
  return Math.round(safeDurations.reduce((sum, value) => sum + value, 0) / safeDurations.length);
}

const defaultMockState = (): MockAnalyticsState => ({
  createdAt: Date.now(),
  totalVisits: 1_284,
  uniqueVisitors: 731,
  totalDurationSeconds: 731 * 196,
  durationSamples: 731,
  projectViews: {
    'quantia-mvp': 462,
    ecofinance: 337,
    'portfolio-3d': 296,
    nutrilife: 189,
  },
  spatialSamples: [],
});

const isHeatmapSample = (value: unknown): value is HeatmapSample => {
  if (!value || typeof value !== 'object') return false;
  const sample = value as Record<string, unknown>;
  return ['x', 'y', 'z', 'intensity'].every((key) => typeof sample[key] === 'number');
};

const readMockState = (): MockAnalyticsState => {
  const storage = safeLocalStorage();
  const raw = storage?.getItem(MOCK_STATE_KEY);
  if (!raw) return defaultMockState();
  try {
    const parsed = JSON.parse(raw) as Partial<MockAnalyticsState>;
    return {
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
      totalVisits: typeof parsed.totalVisits === 'number' ? parsed.totalVisits : 1_284,
      uniqueVisitors: typeof parsed.uniqueVisitors === 'number' ? parsed.uniqueVisitors : 731,
      totalDurationSeconds: typeof parsed.totalDurationSeconds === 'number' ? parsed.totalDurationSeconds : 731 * 196,
      durationSamples: typeof parsed.durationSamples === 'number' ? parsed.durationSamples : 731,
      projectViews: parsed.projectViews && typeof parsed.projectViews === 'object'
        ? parsed.projectViews
        : defaultMockState().projectViews,
      spatialSamples: Array.isArray(parsed.spatialSamples)
        ? parsed.spatialSamples.filter(isHeatmapSample).slice(-MAX_LOCAL_HEATMAP_SAMPLES)
        : [],
    };
  } catch {
    return defaultMockState();
  }
};

const writeMockState = (state: MockAnalyticsState): void => {
  try {
    safeLocalStorage()?.setItem(MOCK_STATE_KEY, JSON.stringify(state));
  } catch {
    // Metrics remain available from the in-memory synthetic generator.
  }
};

const mutateMockState = (mutator: (state: MockAnalyticsState) => void): void => {
  const state = readMockState();
  mutator(state);
  writeMockState(state);
};

const seededNoise = (seed: number): number => {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
};

const dateSeed = (date: Date): number =>
  date.getUTCFullYear() * 10_000 + (date.getUTCMonth() + 1) * 100 + date.getUTCDate();

const buildDailyVisits = (days: number, liveIncrement: number): DayMetric[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - index - 1));
    const seed = dateSeed(date);
    const weeklyWave = Math.sin(index * 0.72) * 7;
    const visits = Math.max(8, Math.round(31 + weeklyWave + seededNoise(seed) * 22));
    return {
      date: date.toISOString().slice(0, 10),
      visits: index === days - 1 ? visits + liveIncrement : visits,
    };
  });
};

const buildProjectRanking = (views: Record<string, number>, liveIncrement: number): ProjectVisitMetric[] => {
  const entries = projectCatalog.map((project, index) => ({
    projectId: project.id,
    projectName: project.name,
    visits: Math.max(1, (views[project.id] ?? 1) + (index === 0 ? liveIncrement : 0)),
  }));
  const total = entries.reduce((sum, entry) => sum + entry.visits, 0);
  return entries
    .map((entry) => ({ ...entry, percentage: Math.round((entry.visits / total) * 100) }))
    .sort((a, b) => b.visits - a.visits);
};

const buildSyntheticHeatmap = (localSamples: readonly HeatmapSample[]): HeatmapSample[] => {
  const synthetic = Array.from({ length: 36 }, (_, index) => {
    const cluster = index % 3;
    const centers = [
      [38, 1, 6],
      [-42, 1, 28],
      [14, 1, -52],
    ] as const;
    const [cx, cy, cz] = centers[cluster];
    const angle = seededNoise(index + 3) * Math.PI * 2;
    const radius = 4 + seededNoise(index + 13) * 17;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + seededNoise(index + 29) * 2.5,
      z: cz + Math.sin(angle) * radius,
      intensity: 0.28 + seededNoise(index + 47) * 0.72,
    };
  });
  return [...synthetic, ...localSamples].slice(-MAX_LOCAL_HEATMAP_SAMPLES);
};

const generateMockMetrics = (timeframe: AnalyticsTimeframe): PortfolioAnalyticsData => {
  const state = readMockState();
  const liveIncrement = Math.max(0, Math.floor((Date.now() - state.createdAt) / 4_000));
  const days = timeframe === '30d' ? 30 : 7;
  const avgDurationSeconds = state.durationSamples > 0
    ? Math.round(state.totalDurationSeconds / state.durationSamples)
    : 0;

  return {
    totalVisits: state.totalVisits + liveIncrement,
    uniqueVisitors: state.uniqueVisitors + Math.floor(liveIncrement / 3),
    avgDurationSeconds,
    topProjects: buildProjectRanking(state.projectViews, Math.floor(liveIncrement / 2)),
    dailyVisits: buildDailyVisits(days, liveIncrement),
    spatialHeatmap: buildSyntheticHeatmap(state.spatialSamples),
    lastUpdated: new Date().toISOString(),
  };
};

const isDayMetric = (value: unknown): value is DayMetric => {
  if (!value || typeof value !== 'object') return false;
  const metric = value as Record<string, unknown>;
  return typeof metric.date === 'string' && typeof metric.visits === 'number';
};

const isProjectMetric = (value: unknown): value is ProjectVisitMetric => {
  if (!value || typeof value !== 'object') return false;
  const metric = value as Record<string, unknown>;
  return typeof metric.projectId === 'string'
    && typeof metric.projectName === 'string'
    && typeof metric.visits === 'number'
    && typeof metric.percentage === 'number';
};

const isAnalyticsData = (value: unknown): value is PortfolioAnalyticsData => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.totalVisits === 'number'
    && typeof data.uniqueVisitors === 'number'
    && typeof data.avgDurationSeconds === 'number'
    && typeof data.lastUpdated === 'string'
    && Array.isArray(data.topProjects)
    && data.topProjects.every(isProjectMetric)
    && Array.isArray(data.dailyVisits)
    && data.dailyVisits.every(isDayMetric)
    && Array.isArray(data.spatialHeatmap)
    && data.spatialHeatmap.every(isHeatmapSample);
};

const apiUrl = (): string => {
  const configured = import.meta.env?.VITE_ANALYTICS_API_URL;
  return typeof configured === 'string' ? configured.trim().replace(/\/$/, '') : '';
};

export async function fetchRealtimeMetrics(
  timeframe: AnalyticsTimeframe = '7d',
): Promise<PortfolioAnalyticsData> {
  const endpoint = apiUrl();
  if (endpoint) {
    try {
      const url = new URL(endpoint, hasWindow() ? window.location.origin : 'http://localhost');
      url.searchParams.set('timeframe', timeframe);
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(3_000),
      });
      if (response.ok) {
        const payload: unknown = await response.json();
        if (isAnalyticsData(payload)) return payload;
      }
    } catch {
      // Offline/invalid API automatically falls through to the privacy-safe mock.
    }
  }
  return generateMockMetrics(timeframe);
}

const emitChannel = async (timeframe: AnalyticsTimeframe): Promise<void> => {
  const channel = channels.get(timeframe);
  if (!channel || channel.callbacks.size === 0) return;
  const data = await fetchRealtimeMetrics(timeframe);
  for (const callback of channel.callbacks) callback(data);
};

const restartChannelTimer = (timeframe: AnalyticsTimeframe, channel: RealtimeChannel): void => {
  if (channel.timer) clearInterval(channel.timer);
  channel.timer = setInterval(() => {
    void emitChannel(timeframe);
  }, channel.intervalMs);
};

export function subscribeToAnalytics(
  callback: (data: PortfolioAnalyticsData) => void,
  intervalMs = 4_000,
  timeframe: AnalyticsTimeframe = '7d',
): () => void {
  const safeInterval = Math.max(50, Math.min(intervalMs, 4_900));
  let channel = channels.get(timeframe);
  if (!channel) {
    channel = { callbacks: new Set(), intervalMs: safeInterval, timer: null };
    channels.set(timeframe, channel);
  }
  channel.callbacks.add(callback);
  if (safeInterval < channel.intervalMs || !channel.timer) {
    channel.intervalMs = safeInterval;
    restartChannelTimer(timeframe, channel);
  }
  void emitChannel(timeframe);

  return () => {
    const current = channels.get(timeframe);
    if (!current) return;
    current.callbacks.delete(callback);
    if (current.callbacks.size === 0) {
      if (current.timer) clearInterval(current.timer);
      channels.delete(timeframe);
    }
  };
}

const flushTelemetry = async (): Promise<void> => {
  if (!telemetryStarted) return;
  const now = Date.now();
  const durationSeconds = Math.max(0, Math.round((now - lastDurationCheckpointAt) / 1_000));
  lastDurationCheckpointAt = now;
  eventQueue.push({ kind: 'heartbeat', at: anonymousTimestamp(), durationSeconds });
  mutateMockState((state) => {
    state.totalDurationSeconds += durationSeconds;
  });

  const batch = eventQueue.splice(0, eventQueue.length);
  const endpoint = apiUrl();
  if (!endpoint || batch.length === 0) return;

  try {
    const sessionHash = await hashAnonymousValue(getSessionId());
    await fetch(`${endpoint}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: sessionHash, events: batch }),
      keepalive: true,
    });
  } catch {
    // The local fallback already mirrors the event, so failed remote delivery is safe to drop.
  }
};

const startBatching = (): void => {
  if (batchingTimer) return;
  batchingTimer = setInterval(() => {
    void flushTelemetry();
  }, BATCH_INTERVAL_MS);

  if (hasWindow()) {
    window.addEventListener('pagehide', () => {
      void flushTelemetry();
    }, { once: true });
  }
};

export function trackSessionStart(): string {
  const sessionId = getSessionId();
  if (!telemetryStarted) {
    telemetryStarted = true;
    sessionStartedAt = Date.now();
    lastDurationCheckpointAt = sessionStartedAt;
    eventQueue.push({ kind: 'session_start', at: anonymousTimestamp() });
    mutateMockState((state) => {
      state.totalVisits += 1;
      state.uniqueVisitors += 1;
      state.durationSamples += 1;
    });
    startBatching();
  }
  return sessionId;
}

export function trackProjectView(projectId: string): void {
  trackSessionStart();
  const safeProjectId = projectId.trim().slice(0, 80);
  if (!safeProjectId) return;
  eventQueue.push({ kind: 'project_view', at: anonymousTimestamp(), projectId: safeProjectId });
  mutateMockState((state) => {
    state.projectViews[safeProjectId] = (state.projectViews[safeProjectId] ?? 0) + 1;
  });
}

export function trackSpatialPosition(coords: [number, number, number]): void {
  const now = Date.now();
  if (now - lastSpatialSampleAt < SPATIAL_SAMPLE_INTERVAL_MS) return;
  lastSpatialSampleAt = now;
  trackSessionStart();

  const quantized: [number, number, number] = coords.map((value) =>
    Math.round(value / 2) * 2,
  ) as [number, number, number];
  eventQueue.push({ kind: 'spatial', at: anonymousTimestamp(now), coords: quantized });
  mutateMockState((state) => {
    state.spatialSamples.push({
      x: quantized[0],
      y: quantized[1],
      z: quantized[2],
      intensity: 0.72,
    });
    state.spatialSamples = state.spatialSamples.slice(-MAX_LOCAL_HEATMAP_SAMPLES);
  });
}
