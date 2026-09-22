import { raceCurve, TRACK_HALF_WIDTH, RACE_OBSTACLES } from './raceTrack';
import { RACE_CRUISE_SPEED } from './raceHandling';

// Keep the whole ship inside the visible rock faces, including at an oblique angle.
export const RACE_DRIVE_HALF_WIDTH = TRACK_HALF_WIDTH - 4.2;
const samples = raceCurve.getSpacedPoints(512);
const tangents = samples.map((_, i) => raceCurve.getTangentAt(i / 512));

export const createTrackFrame = () => ({ x: 0, z: 0, tx: 0, tz: 1, nx: 1, nz: 0, offset: 0, distance: 0 });

/** Closest point on the entire closed circuit; normals vary smoothly across rock seams. */
export function sampleTrackFrame(x: number, z: number, out = createTrackFrame()) {
  let best = Infinity;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], b = samples[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz)));
    const px = a.x + dx * t, pz = a.z + dz * t;
    const distance = (x - px) ** 2 + (z - pz) ** 2;
    if (distance >= best) continue;
    best = distance;
    out.x = px; out.z = pz;
    out.tx = tangents[i].x + (tangents[i + 1].x - tangents[i].x) * t;
    out.tz = tangents[i].z + (tangents[i + 1].z - tangents[i].z) * t;
    out.distance = (i + t) / 512;
  }
  const length = Math.hypot(out.tx, out.tz);
  out.tx /= length; out.tz /= length;
  out.nx = out.tz; out.nz = -out.tx;
  out.offset = (x - out.x) * out.nx + (z - out.z) * out.nz;
  return out;
}

/** Continuous arcade contact: one entry penalty, then a stable slide that the driver can steer out of. */
export class RaceWallGuide {
  readonly frame = { x: 0, z: 0, vx: 0, vz: 0, yaw: 0, touching: false, impact: false, sparkX: 0, sparkZ: 0 };
  private track = createTrackFrame();
  private grace = 0;
  private slideSpeed = 0;
  private direction = 1;
  private obstacleId = -1;
  private obstacleGrace = 0;
  private obstacleSpeed = 0;
  private obstacleDirection = 1;

  reset() { this.grace = 0; this.slideSpeed = 0; this.obstacleGrace = 0; this.obstacleId = -1; this.frame.touching = false; }

  step(x: number, z: number, vx: number, vz: number, yaw: number, throttle: number, delta: number) {
    const f = this.stepWall(x, z, vx, vz, yaw, throttle, delta);
    this.obstacleGrace = Math.max(0, this.obstacleGrace - delta);
    for (const obstacle of RACE_OBSTACLES) {
      const dx = f.x - obstacle.position.x, dz = f.z - obstacle.position.z;
      const distance = Math.hypot(dx, dz);
      const radius = obstacle.radius + 2.3;
      if (distance > radius + Math.hypot(f.vx, f.vz) * delta + 0.15) continue;
      const nx = distance > 0.001 ? dx / distance : -Math.sin(yaw);
      const nz = distance > 0.001 ? dz / distance : -Math.cos(yaw);
      const inward = f.vx * nx + f.vz * nz;
      if (distance < radius) {
        f.x = obstacle.position.x + nx * radius;
        f.z = obstacle.position.z + nz * radius;
      }
      if (inward > 0.5 || distance + inward * delta > radius + 0.12) continue;
      const tx = -nz, tz = nx;
      const along = f.vx * tx + f.vz * tz;
      const speed = Math.hypot(f.vx, f.vz);
      if (this.obstacleGrace === 0 || this.obstacleId !== obstacle.id) {
        this.obstacleDirection = Math.sign(Math.abs(along) > 0.1 ? along : Math.sin(yaw) * tx + Math.cos(yaw) * tz) || 1;
        this.obstacleSpeed = speed * 0.65;
        f.impact = speed > 4;
      } else {
        this.obstacleSpeed = Math.max(Math.abs(along), this.obstacleSpeed * Math.exp(-(throttle === 0 ? 2 : 0.5) * delta));
      }
      this.obstacleId = obstacle.id;
      this.obstacleGrace = 0.25;
      f.vx = tx * this.obstacleDirection * this.obstacleSpeed;
      f.vz = tz * this.obstacleDirection * this.obstacleSpeed;
      const target = Math.atan2(tx * this.obstacleDirection, tz * this.obstacleDirection);
      f.yaw += Math.atan2(Math.sin(target - f.yaw), Math.cos(target - f.yaw)) * (1 - Math.exp(-10 * delta));
      f.touching = true;
      f.sparkX = obstacle.position.x + nx * obstacle.radius;
      f.sparkZ = obstacle.position.z + nz * obstacle.radius;
      break;
    }
    return f;
  }

  private stepWall(x: number, z: number, vx: number, vz: number, yaw: number, throttle: number, delta: number) {
    const f = this.frame;
    Object.assign(f, { x, z, vx, vz, yaw, touching: false, impact: false });
    const track = sampleTrackFrame(x, z, this.track);
    const side = Math.sign(track.offset) || 1;
    const nx = track.nx * side, nz = track.nz * side;
    const outward = vx * nx + vz * nz;
    const edge = Math.abs(track.offset);
    this.grace = Math.max(0, this.grace - delta);
    if (edge > RACE_DRIVE_HALF_WIDTH) {
      f.x -= nx * (edge - RACE_DRIVE_HALF_WIDTH);
      f.z -= nz * (edge - RACE_DRIVE_HALF_WIDTH);
    }
    if (edge + Math.max(0, outward) * delta < RACE_DRIVE_HALF_WIDTH - 0.12 || outward < -0.6) return f;

    f.touching = true;
    const along = vx * track.tx + vz * track.tz;
    if (this.grace === 0) {
      f.impact = Math.hypot(vx, vz) > 4;
      this.direction = Math.sign(Math.abs(along) > 0.5 ? along : Math.sin(yaw) * track.tx + Math.cos(yaw) * track.tz) || 1;
      this.slideSpeed = Math.min(RACE_CRUISE_SPEED, Math.max(Math.abs(along) * 0.88, Math.hypot(vx, vz) * 0.65));
    } else {
      const decay = throttle < 0 ? 6 : throttle === 0 ? 1.8 : 0.35;
      this.slideSpeed = Math.min(RACE_CRUISE_SPEED, Math.max(Math.abs(along), this.slideSpeed * Math.exp(-decay * delta)));
    }
    this.grace = 0.25;
    f.vx = track.tx * this.direction * this.slideSpeed + nx * Math.min(0, outward);
    f.vz = track.tz * this.direction * this.slideSpeed + nz * Math.min(0, outward);
    if (Math.sin(yaw) * nx + Math.cos(yaw) * nz > 0.1) {
      const target = Math.atan2(track.tx * this.direction, track.tz * this.direction);
      const difference = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
      f.yaw += difference * (1 - Math.exp(-8 * delta));
    }
    f.sparkX = track.x + nx * (TRACK_HALF_WIDTH - 1.6);
    f.sparkZ = track.z + nz * (TRACK_HALF_WIDTH - 1.6);
    return f;
  }
}
