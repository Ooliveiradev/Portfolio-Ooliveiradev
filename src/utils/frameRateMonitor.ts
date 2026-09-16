import type { GraphicsQuality } from '../types';

interface FrameSample {
  fps: number;
  suggestedQuality: GraphicsQuality | null;
}

/** Samples only active frames; callers reset on loading/visibility changes. */
export class FrameRateMonitor {
  private frameCount = 0;
  private slowSamples = 0;
  private sampleStartedAt = 0;
  private evaluateAfter = 0;
  private lastAdjustmentAt = -Infinity;

  constructor(now: number) {
    this.reset(now);
  }

  reset(now: number) {
    this.frameCount = 0;
    this.slowSamples = 0;
    this.sampleStartedAt = now;
    // Skip initial GPU uploads and the first frames after returning to a tab.
    this.evaluateAfter = now + 4000;
  }

  recordFrame(now: number, quality: GraphicsQuality): FrameSample | null {
    this.frameCount++;
    const elapsed = now - this.sampleStartedAt;
    if (elapsed < 1000) return null;

    const fps = Math.round(this.frameCount * 1000 / elapsed);
    this.frameCount = 0;
    this.sampleStartedAt = now;
    let suggestedQuality: GraphicsQuality | null = null;

    if (now >= this.evaluateAfter && now - this.lastAdjustmentAt >= 8000) {
      // Three consecutive slow seconds reject isolated loading/GC spikes.
      this.slowSamples = fps < 48 ? this.slowSamples + 1 : 0;
      if (this.slowSamples >= 3 && quality !== 'low') {
        suggestedQuality = quality === 'high' ? 'mid' : 'low';
        this.lastAdjustmentAt = now;
        this.slowSamples = 0;
      }
    }

    return { fps, suggestedQuality };
  }
}
