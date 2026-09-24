import type {
  DayMetric,
  HeatmapSample,
  PortfolioAnalyticsData,
} from '../types';

export type AnalyticsTimeframe = '7d' | '30d';

type TelemetryEvent =
  | { kind: 'session_start'; at: number }
  | { kind: 'project_view'; at: number; projectId: string }
  | { kind: 'spatial'; at: number; coords: [number, number, number] }
  | { kind: 'heartbeat'; at: number; durationSeconds: number };

interface RealtimeChannel {
  callbacks: Set<(data: PortfolioAnalyticsData) => void>;
  intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
}

const SESSION_KEY = 'portfolio_analytics_session_v1';
const BATCH_INTERVAL_MS = 20_000;
const SPATIAL_SAMPLE_INTERVAL_MS = 5_000;


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

const isHeatmapSample = (value: unknown): value is HeatmapSample => {
  if (!value || typeof value !== 'object') return false;
  const sample = value as Record<string, unknown>;
  return ['x', 'y', 'z', 'intensity'].every((key) => typeof sample[key] === 'number' && Number.isFinite(sample[key]));
};

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

const isDayMetric = (value: unknown): value is DayMetric => {
  if (!value || typeof value !== 'object') return false;
  const metric = value as Record<string, unknown>;
  return typeof metric.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(metric.date)
    && Number.isFinite(Date.parse(metric.date)) && isCount(metric.visits);
};

type AnalyticsResponse = Omit<PortfolioAnalyticsData, 'topProjects' | 'spatialHeatmap'> & { spatialHeatmap?: HeatmapSample[] };

const isAnalyticsData = (value: unknown): value is AnalyticsResponse => {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return data.status !== 'unavailable'
    && isCount(data.totalVisits)
    && isCount(data.uniqueVisitors)
    && isCount(data.avgDurationSeconds)
    && typeof data.lastUpdated === 'string'
    && Number.isFinite(Date.parse(data.lastUpdated))
    && Array.isArray(data.dailyVisits)
    && data.dailyVisits.every(isDayMetric)
    && (data.spatialHeatmap === undefined || (Array.isArray(data.spatialHeatmap)
      && data.spatialHeatmap.every(isHeatmapSample)));
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
        if (isAnalyticsData(payload)) return { ...payload, status: 'available', topProjects: [], spatialHeatmap: payload.spatialHeatmap ?? [] };
      }
    } catch {
      // Unavailable metrics must never be replaced with fabricated traffic.
    }
  }
  return {
    status: 'unavailable',
    totalVisits: 0,
    uniqueVisitors: 0,
    avgDurationSeconds: 0,
    topProjects: [],
    dailyVisits: [],
    spatialHeatmap: [],
    lastUpdated: '',
  };
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
    // Best-effort telemetry: a delivery failure does not create local metrics.
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
  if (apiUrl() && !telemetryStarted) {
    telemetryStarted = true;
    sessionStartedAt = Date.now();
    lastDurationCheckpointAt = sessionStartedAt;
    eventQueue.push({ kind: 'session_start', at: anonymousTimestamp() });
    startBatching();
  }
  return sessionId;
}

export function trackProjectView(projectId: string): void {
  if (!apiUrl()) return;
  trackSessionStart();
  const safeProjectId = projectId.trim().slice(0, 80);
  if (!safeProjectId) return;
  eventQueue.push({ kind: 'project_view', at: anonymousTimestamp(), projectId: safeProjectId });
}

export function trackSpatialPosition(coords: [number, number, number]): void {
  if (!apiUrl()) return;
  const now = Date.now();
  if (now - lastSpatialSampleAt < SPATIAL_SAMPLE_INTERVAL_MS) return;
  lastSpatialSampleAt = now;
  trackSessionStart();

  const quantized: [number, number, number] = coords.map((value) =>
    Math.round(value / 2) * 2,
  ) as [number, number, number];
  eventQueue.push({ kind: 'spatial', at: anonymousTimestamp(now), coords: quantized });
}
