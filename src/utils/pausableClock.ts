/** Monotonic simulation time that excludes periods when the scene is paused. */
export class PausableClock {
  private elapsedMs = 0;
  private resumedAt: number;
  private paused = false;

  constructor(private readonly now: () => number = () => performance.now()) {
    this.resumedAt = now();
  }

  getElapsedSeconds(): number {
    const runningMs = this.paused ? 0 : Math.max(0, this.now() - this.resumedAt);
    return (this.elapsedMs + runningMs) / 1000;
  }

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    const now = this.now();
    if (paused) {
      this.elapsedMs += Math.max(0, now - this.resumedAt);
    } else {
      this.resumedAt = now;
    }
    this.paused = paused;
  }
}
