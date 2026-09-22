/** Quick turn-in at cruise speed, less twitch at superboost speed. */
export function raceTurnRate(speed: number): number {
  return 2.15 - 0.7 * Math.max(0, Math.min(1, speed / RACE_BOOST_SPEED));
}

/** Brief, frame-rate independent smoothing softens digital steering changes. */
export function smoothRaceSteering(current: number, requested: number, delta: number): number {
  const target = Math.max(-1, Math.min(1, requested));
  return target + (current - target) * Math.exp(-12 * Math.max(0, delta));
}

export const RACE_CRUISE_SPEED = 46;
export const RACE_BOOST_SPEED = 54;

/** Shared arcade drive for Rapier and the fallback: predictable acceleration and braking. */
export function stepRaceDrive(out: { x: number; z: number }, vx: number, vz: number, yaw: number, throttle: number, maxSpeed: number, delta: number) {
  const fx = Math.sin(yaw), fz = Math.cos(yaw);
  const rx = fz, rz = -fx;
  const input = Math.max(-1, Math.min(1, throttle));
  const forward = vx * fx + vz * fz;
  const target = input * (input < 0 ? 9 : maxSpeed);
  const braking = input * forward < 0 || Math.abs(target) < Math.abs(forward);
  const acceleration = input === 0 ? 10 : braking ? 48 : maxSpeed > RACE_CRUISE_SPEED ? 40 : 28;
  const next = forward + Math.max(-acceleration * delta, Math.min(acceleration * delta, target - forward));
  const lateral = (vx * rx + vz * rz) * Math.exp(-8 * delta);
  out.x = fx * next + rx * lateral;
  out.z = fz * next + rz * lateral;
  return out;
}

/** Scale horizontal speed without changing the ship's direction of travel. */
export function raceSpeedScale(x: number, z: number, maxSpeed: number): number {
  const speed = Math.hypot(x, z);
  return speed <= maxSpeed ? 1 : maxSpeed / speed;
}

