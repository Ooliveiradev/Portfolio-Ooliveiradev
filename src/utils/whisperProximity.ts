import type { CosmicWhisper } from '../types';

export const WHISPER_ENTER_DISTANCE = 10;
export const WHISPER_EXIT_DISTANCE = 12;

/** Hysteresis prevents the prompt flickering when the ship hovers on the boundary. */
export function findNearbyWhisper(
  whispers: readonly CosmicWhisper[],
  position: { x: number; y: number; z: number },
  previousId: string | null = null,
): CosmicWhisper | null {
  let closest: CosmicWhisper | null = null;
  let closestDistanceSq = WHISPER_ENTER_DISTANCE ** 2;
  let previous: CosmicWhisper | null = null;
  for (const whisper of whispers) {
    const dx = position.x - whisper.position[0];
    const dy = position.y - whisper.position[1];
    const dz = position.z - whisper.position[2];
    const distanceSq = dx * dx + dy * dy + dz * dz;
    if (whisper.id === previousId && distanceSq <= WHISPER_EXIT_DISTANCE ** 2) previous = whisper;
    if (distanceSq <= closestDistanceSq) {
      closest = whisper;
      closestDistanceSq = distanceSq;
    }
  }
  return closest ?? previous;
}
