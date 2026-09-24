import assert from 'node:assert/strict';
import test from 'node:test';
import { RocketLaunch } from '../src/utils/rocketLaunch.ts';

function advance(launch: RocketLaunch, seconds: number, fps = 60) {
  for (let i = 0; i < Math.round(seconds * fps); i++) launch.update(1 / fps);
}

test('launch ignites, disconnects, accelerates out of view, waits and materializes before another launch', () => {
  const launch = new RocketLaunch();
  assert.equal(launch.phase, 'idle');
  assert.equal(launch.start(), true);
  advance(launch, 0.5);
  assert.equal(launch.phase, 'ignition');
  assert.ok(launch.smoke > 3);
  assert.ok(launch.y < 3);
  assert.equal(launch.start(), false);
  advance(launch, 1);
  assert.equal(launch.phase, 'liftoff');
  assert.ok(launch.arm > 0.99);
  assert.ok(launch.exhaust > 0);
  const lowAltitude = launch.y;
  advance(launch, 2);
  assert.equal(launch.phase, 'flying');
  assert.ok(launch.y > lowAltitude + 5);
  advance(launch, 2.4);
  assert.ok(launch.y > 120);
  assert.ok(launch.x < 0);
  advance(launch, 0.2);
  assert.equal(launch.phase, 'reset');
  assert.equal(launch.scale, 0);
  assert.equal(launch.exhaust, 0);
  advance(launch, 1.8);
  assert.equal(launch.scale, 0, 'rocket stays hidden for the two-second delay');
  advance(launch, 0.5);
  assert.ok(launch.scale > 0 && launch.scale < 1);
  assert.ok(launch.materialize > 0);
  assert.equal(launch.start(), false);
  advance(launch, 0.5);
  assert.equal(launch.phase, 'idle');
  assert.equal(launch.scale, 1);
  assert.equal(launch.arm, 0);
  assert.equal(launch.x, 0.8);
  assert.equal(launch.z, -1.6);
  assert.equal(launch.start(), true);
});

test('timeline and flight position agree at 30, 60 and 144 FPS', () => {
  const results = [30, 60, 144].map((fps) => {
    const launch = new RocketLaunch();
    launch.start();
    advance(launch, 4.5, fps);
    return launch;
  });
  for (const launch of results) {
    assert.equal(launch.phase, 'flying');
    assert.ok(Math.abs(launch.y - 42.1) < 1e-8);
    assert.ok(Math.abs(launch.x + 1.9) < 1e-8);
  }
});

test('click spam cannot restart the timer; a background-tab delta cannot skip phases', () => {
  const launch = new RocketLaunch();
  launch.start();
  advance(launch, 0.5);
  for (let i = 0; i < 20; i++) assert.equal(launch.start(), false);
  assert.ok(Math.abs(launch.elapsed - 0.5) < 1e-8);
  launch.update(120);
  assert.equal(launch.phase, 'ignition');
  assert.ok(launch.elapsed < 0.7);
  const time = launch.elapsed;
  launch.update(-1);
  launch.update(Number.NaN);
  assert.equal(launch.elapsed, time);
});

test('flight and materialization boundaries remain continuous', () => {
  for (const boundary of [1, 3, 8.8]) {
    const launch = new RocketLaunch();
    launch.start();
    launch.elapsed = boundary - 0.00001;
    launch.update(0);
    const { x, y, scale } = launch;
    launch.update(0.00002);
    assert.ok(Math.abs(launch.x - x) < 0.001);
    assert.ok(Math.abs(launch.y - y) < 0.001);
    assert.ok(Math.abs(launch.scale - scale) < 0.001);
  }
});
