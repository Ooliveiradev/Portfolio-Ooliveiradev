export type RocketPhase = 'idle' | 'ignition' | 'liftoff' | 'flying' | 'reset';

export const ROCKET_TIMING = { ignition: 1, liftoff: 2, flying: 3, reset: 2, materialize: 0.8 };
const LIFTOFF_END = ROCKET_TIMING.ignition + ROCKET_TIMING.liftoff;
const FLIGHT_END = LIFTOFF_END + ROCKET_TIMING.flying;
const RETURN_START = FLIGHT_END + ROCKET_TIMING.reset;
const RETURN_END = RETURN_START + ROCKET_TIMING.materialize;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** A reusable, allocation-free timeline driven only by active scene frames. */
export class RocketLaunch {
  phase: RocketPhase = 'idle';
  elapsed = 0;
  time = 0;
  x = 0.8;
  y = 2.6;
  z = -1.6;
  tilt = 0;
  roll = 0;
  scale = 1;
  smoke = 1;
  exhaust = 0;
  arm = 0;
  materialize = 0;
  private startY = 2.6;

  get remainingSoundTime() {
    const end = this.phase === 'ignition' ? ROCKET_TIMING.ignition
      : this.phase === 'liftoff' ? LIFTOFF_END : this.phase === 'flying' ? FLIGHT_END : 0;
    return Math.max(0, end - this.elapsed);
  }

  start(): boolean {
    if (this.phase !== 'idle') return false;
    this.startY = this.y;
    this.elapsed = 0;
    this.phase = 'ignition';
    return true;
  }

  update(delta: number) {
    // A resumed background tab must not skip the entire launch.
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    this.time += dt;
    if (this.phase !== 'idle') this.elapsed += dt;
    const t = this.elapsed;
    if (this.phase !== 'idle') {
      this.phase = t < ROCKET_TIMING.ignition ? 'ignition' : t < LIFTOFF_END ? 'liftoff' : t < FLIGHT_END ? 'flying' : t < RETURN_END ? 'reset' : 'idle';
    }
    this.x = 0.8;
    this.z = -1.6;
    this.y = 2.6;
    this.tilt = 0;
    this.roll = 0;
    this.scale = 1;
    this.exhaust = 0;
    this.arm = 0;
    this.materialize = 0;
    this.smoke = 1;

    if (this.phase === 'idle') {
      this.y += Math.sin(this.time * 2.2) * 0.14;
      this.roll = Math.sin(this.time * 1.6) * 0.025;
      this.tilt = Math.sin(this.time * 1.9) * 0.015;
    } else if (this.phase === 'ignition') {
      const progress = t / ROCKET_TIMING.ignition;
      const shake = Math.sin(Math.PI * progress);
      this.x += Math.sin(t * 83) * 0.065 * shake;
      this.y = this.startY + (2.6 - this.startY) * smooth(progress) + Math.sin(t * 71) * 0.045 * shake;
      this.roll = Math.sin(t * 67) * 0.045 * shake;
      this.smoke = 1 + 2.3 * smooth(Math.min(1, progress * 3));
      this.exhaust = progress * 0.45;
    } else if (this.phase === 'liftoff') {
      const u = (t - ROCKET_TIMING.ignition) / ROCKET_TIMING.liftoff;
      this.y += 5 * u * u;
      this.arm = smooth(Math.min(1, u * 4));
      this.exhaust = 0.45 + 0.55 * u;
      this.smoke = 3.3 - 0.8 * u;
    } else if (this.phase === 'flying') {
      const u = t - LIFTOFF_END;
      const progress = u / ROCKET_TIMING.flying;
      this.y += 5 + 5 * u + 12 * u * u;
      this.x -= 1.2 * u * u;
      this.z -= 0.35 * u * u;
      this.roll = 0.13 * smooth(progress);
      this.tilt = -0.04 * smooth(progress);
      this.exhaust = 1 + progress;
      this.arm = 1;
      this.smoke = 1 + 1.5 * (1 - smooth(progress));
    } else {
      const u = Math.max(0, Math.min(1, (t - RETURN_START) / ROCKET_TIMING.materialize));
      this.scale = smooth(u);
      this.y += Math.sin(this.time * 2.2) * 0.14 * this.scale;
      this.roll = Math.sin(this.time * 1.6) * 0.025 * this.scale;
      this.tilt = Math.sin(this.time * 1.9) * 0.015 * this.scale;
      this.arm = 1 - this.scale;
      this.materialize = u > 0 ? Math.sin(Math.PI * u) : 0;
    }
  }
}
