import assert from 'node:assert/strict';
import test from 'node:test';
import { getClamped1080pDpr, getClampedResolution } from '../src/utils/resolutionLimiter.ts';
import { FrameRateMonitor } from '../src/utils/frameRateMonitor.ts';
import type { GraphicsQuality } from '../src/types';

test('4K and 8K displays stay inside the physical 1080p budget', () => {
  assert.deepEqual(getClampedResolution('high', { width: 3840, height: 2160, dpr: 2 }), {
    width: 1920, height: 1080, dpr: 0.5,
  });
  assert.deepEqual(getClampedResolution('high', { width: 7680, height: 4320, dpr: 2 }), {
    width: 1920, height: 1080, dpr: 0.25,
  });
});

test('every quality respects both dimensions and aspect ratio on mobile, portrait and ultrawide displays', () => {
  const budgets = { low: [1280, 720], mid: [1600, 900], high: [1920, 1080] };
  const sizes = [[360, 800], [1920, 1080], [1080, 1920], [3440, 1440], [5120, 1440], [7680, 4320]];
  for (const [width, height] of sizes) {
    for (const nativeDpr of [0.75, 1, 1.25, 1.5, 2, 3]) {
      let previousPixels = 0;
      for (const quality of ['low', 'mid', 'high'] as const) {
        const result = getClampedResolution(quality, { width, height, dpr: nativeDpr });
        assert.ok(result.width <= budgets[quality][0]);
        assert.ok(result.height <= budgets[quality][1]);
        assert.ok(result.dpr <= nativeDpr);
        assert.ok(Math.abs(result.width - width * result.dpr) < 1);
        assert.ok(Math.abs(result.height - height * result.dpr) < 1);
        assert.ok(result.width * result.height >= previousPixels);
        previousPixels = result.width * result.height;
      }
    }
  }
});

test('quality reduction actually reduces the GPU pixel count at 1080p', () => {
  const viewport = { width: 1920, height: 1080, dpr: 1 };
  const low = getClampedResolution('low', viewport);
  const mid = getClampedResolution('mid', viewport);
  assert.equal(low.width * low.height, 1280 * 720);
  assert.equal(mid.width * mid.height, 1600 * 900);
  assert.equal(getClamped1080pDpr('high', viewport), 1);
});

test('a collapsed viewport still has valid nonzero buffer dimensions', () => {
  const resolution = getClampedResolution('mid', { width: 0, height: 0, dpr: 1 });
  assert.equal(resolution.width, 1);
  assert.equal(resolution.height, 1);
  assert.ok(Number.isFinite(resolution.dpr));
});

function sampleSecond(monitor: FrameRateMonitor, start: number, fps: number, quality: GraphicsQuality) {
  let sample: ReturnType<FrameRateMonitor['recordFrame']> = null;
  for (let frame = 1; frame <= fps; frame++) {
    sample = monitor.recordFrame(start + frame * 1000 / fps, quality) ?? sample;
  }
  assert.ok(sample, 'one second must produce a frame sample');
  return sample;
}

test('sustained stutter reduces high quality after warmup and three slow samples', () => {
  const monitor = new FrameRateMonitor(0);
  for (let second = 0; second < 5; second++) {
    const sample = sampleSecond(monitor, second * 1000, 40, 'high');
    assert.equal(sample.fps, 40);
    assert.equal(sample.suggestedQuality, null);
  }
  assert.equal(sampleSecond(monitor, 5000, 40, 'high').suggestedQuality, 'mid');
});

test('stable frames and isolated slow seconds preserve the chosen quality', () => {
  for (const fps of [60, 120]) {
    const monitor = new FrameRateMonitor(0);
    for (let second = 0; second < 20; second++) {
      assert.equal(sampleSecond(monitor, second * 1000, fps, 'high').suggestedQuality, null);
    }
  }
  const monitor = new FrameRateMonitor(0);
  for (let second = 0; second < 20; second++) {
    assert.equal(sampleSecond(monitor, second * 1000, second % 2 ? 25 : 60, 'mid').suggestedQuality, null);
  }
});

test('returning from a hidden tab discards stale frame time and slow samples', () => {
  const monitor = new FrameRateMonitor(0);
  for (let second = 0; second < 5; second++) sampleSecond(monitor, second * 1000, 40, 'high');
  monitor.reset(65000);
  for (let second = 0; second < 5; second++) {
    const sample = sampleSecond(monitor, 65000 + second * 1000, 40, 'high');
    assert.equal(sample.fps, 40);
    assert.equal(sample.suggestedQuality, null);
  }
});

test('quality changes preserve cooldown and never downgrade below low', () => {
  const monitor = new FrameRateMonitor(0);
  for (let second = 0; second < 6; second++) sampleSecond(monitor, second * 1000, 40, 'high');
  monitor.reset(6000);
  for (let second = 6; second < 15; second++) {
    assert.equal(sampleSecond(monitor, second * 1000, 40, 'mid').suggestedQuality, null);
  }
  assert.equal(sampleSecond(monitor, 15000, 40, 'mid').suggestedQuality, 'low');
  monitor.reset(16000);
  for (let second = 16; second < 40; second++) {
    assert.equal(sampleSecond(monitor, second * 1000, 20, 'low').suggestedQuality, null);
  }
});
