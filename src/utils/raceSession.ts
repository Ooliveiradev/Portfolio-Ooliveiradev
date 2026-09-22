import { PausableClock } from './pausableClock';
import { TRACK_VERSION } from './raceTrack';

export const GHOST_KEY = 'galactic_portfolio_bestRunTrajectory';
export const BEST_TIME_KEY = 'galactic_portfolio_best_race_time_v7';
export const RANKING_KEY = 'galactic_portfolio_race_ranking_v7';
export type GhostFrame = [number, number, number, number, number, number, number]; // seconds, xyz, pitch/yaw/roll
export interface GhostRun { version: number; duration: number; frames: GhostFrame[] }
const MAX_FRAMES = 12001; // ten minutes at 20 Hz, bounded storage and memory

export function parseGhost(raw: string | null): GhostRun | null {
  try {
    if (!raw || raw.length > 2500000) return null;
    const run = JSON.parse(raw) as GhostRun;
    if (run.version !== TRACK_VERSION || !Number.isFinite(run.duration) || run.duration <= 0 ||
      !Array.isArray(run.frames) || run.frames.length < 2 || run.frames.length > MAX_FRAMES) return null;
    let previous = -1;
    for (const frame of run.frames) {
      if (!Array.isArray(frame) || frame.length !== 7 || !frame.every(Number.isFinite) ||
        frame[0] <= previous || frame[0] < 0 || frame[0] > run.duration || frame.slice(1).some(n => Math.abs(n) > 10000)) return null;
      previous = frame[0];
    }
    if (run.frames[0][0] !== 0 || run.frames.at(-1)![0] !== run.duration) return null;
    return run;
  } catch { return null; }
}

export function consumeNitro(charge: number, requested: boolean, delta: number) {
  return Math.max(0, Math.min(100, charge - (requested ? 24 * Math.max(0, delta) : 0)));
}

/** Shared transient data; UI samples it without rerendering App every frame. */
export const raceSession = {
  active: false,
  running: false,
  nitro: 100,
  boosting: false,
  speed: 0,
  pitch: 0,
  yaw: 0,
  roll: 0,
  clock: new PausableClock(),
  frames: [] as GhostFrame[],
  ghost: null as GhostRun | null,
  prepare() {
    this.active = true;
    this.running = false;
    this.nitro = 100;
    this.boosting = false;
    this.frames = [];
    try { this.ghost = parseGhost(localStorage.getItem(GHOST_KEY)); } catch { this.ghost = null; }
  },
  start() { this.clock = new PausableClock(); this.running = true; },
  elapsed() { return this.clock.getElapsedSeconds(); },
  record(x: number, y: number, z: number, pitch: number, yaw: number, roll: number, final = false) {
    if (!this.running || this.frames.length >= MAX_FRAMES) return;
    const t = this.frames.length === 0 ? 0 : this.elapsed();
    const last = this.frames.at(-1);
    if (last && (t <= last[0] || (!final && t - last[0] < 0.05))) return;
    this.frames.push([t, x, y, z, pitch, yaw, roll]);
  },
  finish() {
    const duration = this.elapsed();
    const last = this.frames.at(-1);
    if (last && duration > last[0] && this.frames.length < MAX_FRAMES) this.frames.push([duration, ...last.slice(1)] as GhostFrame);
    const run = { version: TRACK_VERSION, duration, frames: this.frames };
    if ((!this.ghost || duration < this.ghost.duration) && parseGhost(JSON.stringify(run))) {
      this.ghost = run;
      try { localStorage.setItem(GHOST_KEY, JSON.stringify(run)); } catch { /* storage is optional */ }
    }
    this.cancel();
    return duration;
  },
  cancel() { this.active = false; this.running = false; this.boosting = false; this.frames = []; },
};
