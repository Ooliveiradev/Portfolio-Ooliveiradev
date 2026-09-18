import assert from 'node:assert/strict';
import test from 'node:test';
import { PausableClock } from '../src/utils/pausableClock.ts';
import { getIslandLivePosition } from '../src/utils/celestialCoords.ts';
import { ISLANDS_CONFIG } from '../src/data/portfolioData.ts';

test('orbital clock freezes through a long modal and resumes without a position jump', () => {
  let now = 1000;
  const clock = new PausableClock(() => now);
  now += 5000;
  clock.setPaused(true);
  const timeBeforePause = clock.getElapsedSeconds();
  const positionBeforePause = getIslandLivePosition(ISLANDS_CONFIG[0], timeBeforePause);

  now += 120_000;
  assert.equal(clock.getElapsedSeconds(), timeBeforePause);
  assert.deepEqual(getIslandLivePosition(ISLANDS_CONFIG[0], clock.getElapsedSeconds()), positionBeforePause);

  clock.setPaused(false);
  assert.equal(clock.getElapsedSeconds(), timeBeforePause);
  now += 16;
  assert.equal(clock.getElapsedSeconds(), 5.016);
});

test('duplicate pause and resume requests never double-count or reset elapsed time', () => {
  let now = 0;
  const clock = new PausableClock(() => now);
  now = 1000;
  clock.setPaused(false);
  now = 2000;
  clock.setPaused(true);
  now = 6000;
  clock.setPaused(true);
  assert.equal(clock.getElapsedSeconds(), 2);
  clock.setPaused(false);
  now = 7000;
  clock.setPaused(false);
  now = 8000;
  assert.equal(clock.getElapsedSeconds(), 4);
});

test('repeated pause cycles accumulate only active intervals', () => {
  let now = 0;
  const clock = new PausableClock(() => now);
  for (let cycle = 0; cycle < 4; cycle++) {
    now += 1250;
    clock.setPaused(true);
    now += 10_000;
    clock.setPaused(false);
    assert.equal(clock.getElapsedSeconds(), (cycle + 1) * 1.25);
  }
});
