export const JOYSTICK_RADIUS = 40;
const DEAD_ZONE = 0.12;

/** Radial dead zone preserves diagonals and reaches full thrust without a jump. */
export function sampleJoystick(dx: number, dy: number) {
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance === 0) return { x: 0, y: 0, knobX: 0, knobY: 0 };
  const travel = Math.min(distance, JOYSTICK_RADIUS);
  const amount = Math.max(0, (travel / JOYSTICK_RADIUS - DEAD_ZONE) / (1 - DEAD_ZONE));
  // Softer near the center; still reaches exactly 1 at the rim.
  const response = amount * amount * (3 - 2 * amount);
  return { x: dx / distance * response, y: dy / distance * response,
    knobX: dx / distance * travel, knobY: dy / distance * travel };
}

export interface ScreenFlightDirection { x: number; z: number; strength: number; yaw: number }

/** Invert the camera's horizontal-plane projection, including foreshortening.
 * A 45-degree thumb drag must also travel diagonally on screen, not in world X/Z.
 * The caller owns `out`, so the render loop creates no garbage.
 */
export function screenFlightDirection(out: ScreenFlightDirection, x: number, y: number, cameraMatrix: ArrayLike<number>) {
  const rightX = cameraMatrix[0], rightZ = cameraMatrix[2];
  const upX = cameraMatrix[4], upZ = cameraMatrix[6];
  const determinant = rightX * upZ - rightZ * upX;
  const strength = Math.min(1, Math.hypot(x, y));
  if (!Number.isFinite(strength) || strength === 0 || Math.abs(determinant) < 1e-6) {
    out.x = out.z = out.strength = out.yaw = 0;
    return out;
  }
  const worldX = (x * upZ + y * rightZ) / determinant;
  const worldZ = (-y * rightX - x * upX) / determinant;
  const length = Math.hypot(worldX, worldZ);
  out.x = worldX / length;
  out.z = worldZ / length;
  out.strength = strength;
  out.yaw = Math.atan2(out.x, out.z);
  return out;
}

/** Framerate-independent response shared by Rapier and the kinematic fallback. */
export function stepScreenFlight(out: { x: number; z: number }, vx: number, vz: number, direction: ScreenFlightDirection, speed: number, delta: number) {
  const response = 1 - Math.exp(-12 * Math.max(0, delta));
  out.x = vx + (direction.x * direction.strength * speed - vx) * response;
  out.z = vz + (direction.z * direction.strength * speed - vz) * response;
}

export function faceFlightDirection(yaw: number, target: number, delta: number) {
  const difference = Math.atan2(Math.sin(target - yaw), Math.cos(target - yaw));
  return yaw + difference * (1 - Math.exp(-14 * Math.max(0, delta)));
}
