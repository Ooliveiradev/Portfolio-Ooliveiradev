import { IslandConfig, IslandId } from '../types';
import { ISLANDS_CONFIG } from '../data/portfolioData';
import { PausableClock } from './pausableClock';

// Scene and radar share active time so a modal cannot leave colliders behind
// while their orbital targets advance, then teleport them on the next frame.
const celestialClock = new PausableClock();

export const setCelestialPaused = (paused: boolean): void => {
  celestialClock.setPaused(paused);
};

export const getCelestialTime = (): number => {
  return celestialClock.getElapsedSeconds();
};

// Gentle planetary orbital speed scaling (a full orbit takes ~5 to 9 minutes)
export const ORBIT_SPEED_SCALE = 0.10;

/**
 * Computes the exact real-time 3D coordinate (X, Y, Z) of an island.
 * Both the 3D scene (Islands.tsx) and the SVG radar (MiniMap.tsx) call this identical
 * function to guarantee 100% synchronization at all times.
 */
export const getIslandLivePosition = (
  island: IslandConfig,
  timeSec: number = getCelestialTime()
): [number, number, number] => {
  const angle = island.angleOffset + island.orbitSpeed * timeSec * ORBIT_SPEED_SCALE;
  const x = Math.cos(angle) * island.orbitRadius;
  const z = Math.sin(angle) * island.orbitRadius;
  return [x, island.elevation, z];
};

/**
 * Computes the current orbital angle (radians) of an island in real-time.
 */
export const getIslandLiveAngle = (
  island: IslandConfig,
  timeSec: number = getCelestialTime()
): number => {
  return island.angleOffset + island.orbitSpeed * timeSec * ORBIT_SPEED_SCALE;
};

/**
 * Returns a map of all islands' live coordinates at the given timestamp.
 */
export const getAllLiveIslandPositions = (
  timeSec: number = getCelestialTime()
): Record<IslandId, [number, number, number]> => {
  const map = {} as Record<IslandId, [number, number, number]>;
  for (const isl of ISLANDS_CONFIG) {
    map[isl.id] = getIslandLivePosition(isl, timeSec);
  }
  return map;
};
