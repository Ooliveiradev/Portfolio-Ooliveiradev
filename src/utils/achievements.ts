import { CRYSTALS_DATA } from '../data/portfolioData';

/** True when every crystal currently available in the game has been collected. */
export const hasCollectedAllCrystals = (
  collectedCrystalIds: readonly number[],
): boolean =>
  CRYSTALS_DATA.length > 0
  && CRYSTALS_DATA.every(({ id }) => collectedCrystalIds.includes(id));
