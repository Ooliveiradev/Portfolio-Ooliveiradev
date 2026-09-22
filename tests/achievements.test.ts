import assert from 'node:assert/strict';
import test from 'node:test';

import { CRYSTALS_DATA } from '../src/data/portfolioData.ts';
import { hasCollectedAllCrystals } from '../src/utils/achievements.ts';

test('cosmic collector unlocks after collecting every available crystal', () => {
  const allCrystalIds = CRYSTALS_DATA.map(({ id }) => id);

  assert.equal(CRYSTALS_DATA.length, 7);
  assert.equal(hasCollectedAllCrystals(allCrystalIds), true);
  assert.equal(hasCollectedAllCrystals(allCrystalIds.slice(0, -1)), false);
});

test('a removed legacy crystal does not replace a currently available one', () => {
  const currentIdsExceptLast = CRYSTALS_DATA.slice(0, -1).map(({ id }) => id);

  assert.equal(hasCollectedAllCrystals([...currentIdsExceptLast, 8]), false);
});
