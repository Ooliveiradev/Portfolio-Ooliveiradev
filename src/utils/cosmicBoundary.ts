export const COSMIC_BOUNDARY = {
  radius: 175,
  warningRadius: 150,
  returnRadius: 182,
  pressureSeconds: 3,
  recoverySeconds: 1.2,
  safePosition: { x: 0, y: 1, z: 34 },
} as const;

interface Vector { x: number; y: number; z: number }

export const createBoundaryFrame = () => ({
  strength: 0, pressure: 0, recovery: 0,
  nx: 0, ny: 0, nz: 0,
  impulseX: 0, impulseY: 0, impulseZ: 0,
  linearDamping: 1.55, angularDamping: 3.4,
  warning: false, impact: false, warp: false, beep: false,
});
export type BoundaryFrame = ReturnType<typeof createBoundaryFrame>;

/** Stateful O(1) flight constraint. Reuses its output; no per-frame React updates. */
export class CosmicBoundaryController {
  readonly frame = createBoundaryFrame();
  private pressureTime = 0;
  private beepCooldown = 0;
  private impactCooldown = 0;

  reset() {
    Object.assign(this.frame, createBoundaryFrame());
    this.pressureTime = this.beepCooldown = this.impactCooldown = 0;
  }

  step(position: Vector, velocity: Vector, thrust: Vector, delta: number): BoundaryFrame {
    const f = this.frame;
    const dt = Math.max(0, Math.min(delta, 0.05));
    f.warp = f.impact = f.beep = false;
    f.impulseX = f.impulseY = f.impulseZ = 0;
    f.linearDamping = 1.55;
    f.angularDamping = 3.4;
    f.recovery = Math.max(0, f.recovery - dt);
    this.beepCooldown = Math.max(0, this.beepCooldown - dt);
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);

    const y = position.y - 1;
    const radiusSq = position.x ** 2 + y ** 2 + position.z ** 2;
    f.warning = radiusSq > COSMIC_BOUNDARY.warningRadius ** 2;
    if (!f.warning) {
      f.strength = f.pressure = 0;
      f.nx = f.ny = f.nz = 0;
      this.pressureTime = 0;
      return f;
    }

    const radius = Math.sqrt(radiusSq);
    f.nx = position.x / radius;
    f.ny = y / radius;
    f.nz = position.z / radius;
    const outwardThrust = thrust.x * f.nx + thrust.y * f.ny + thrust.z * f.nz;
    const t = Math.min(1, (radius - COSMIC_BOUNDARY.warningRadius) /
      (COSMIC_BOUNDARY.radius - COSMIC_BOUNDARY.warningRadius));
    f.strength = t * t * (3 - 2 * t);
    const outwardSpeed = Math.max(0, velocity.x * f.nx + velocity.y * f.ny + velocity.z * f.nz);
    const impulse = (outwardSpeed * 5 + 60 * f.strength) * f.strength * dt;
    // Velocity delta; multiply by body mass for the equivalent Rapier impulse.
    f.impulseX = -f.nx * impulse;
    f.impulseY = -f.ny * impulse;
    f.impulseZ = -f.nz * impulse;
    f.linearDamping += f.strength * 5;
    f.angularDamping += f.strength * 8;

    if (f.strength >= 0.5 && outwardThrust > 0.3) this.pressureTime += dt;
    else this.pressureTime = Math.max(0, this.pressureTime - dt * 2);
    f.pressure = Math.min(1, this.pressureTime / COSMIC_BOUNDARY.pressureSeconds);
    if (this.beepCooldown === 0) {
      f.beep = true;
      this.beepCooldown = 5;
    }
    if (f.strength > 0.5 && (outwardSpeed > 0.5 || outwardThrust > 0.3) && this.impactCooldown === 0) {
      f.impact = true;
      this.impactCooldown = 1.2;
    }
    if (radiusSq >= COSMIC_BOUNDARY.returnRadius ** 2 || f.pressure >= 1) {
      f.warp = true;
      f.warning = false;
      f.strength = f.pressure = 0;
      f.recovery = COSMIC_BOUNDARY.recoverySeconds;
      this.pressureTime = 0;
    }
    return f;
  }
}
