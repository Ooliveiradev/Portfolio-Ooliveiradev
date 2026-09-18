export const RADAR_CENTER = 100;
export const RADAR_RADIUS = 82;
export const RADAR_WORLD_RADIUS = 150;
export const RADAR_SCALE = RADAR_RADIUS / RADAR_WORLD_RADIUS;

/** Preserve the bearing when a marker leaves the circular map. */
export function toRadarPoint(x: number, z: number, inset = 0) {
  const dx = x * RADAR_SCALE;
  const dy = z * RADAR_SCALE;
  const distance = Math.hypot(dx, dy);
  const radius = Math.max(0, RADAR_RADIUS - inset);
  const factor = distance > radius ? radius / distance : 1;
  return { x: RADAR_CENTER + dx * factor, y: RADAR_CENTER + dy * factor };
}

/** Ship nose is +Z in the world and -Y in the SVG. */
export function radarHeading(yaw: number) {
  return ((180 - yaw * 180 / Math.PI) % 360 + 360) % 360;
}
