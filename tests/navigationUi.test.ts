import assert from 'node:assert/strict';
import test from 'node:test';
import { RADAR_CENTER, RADAR_RADIUS, RADAR_WORLD_RADIUS, radarHeading, toRadarPoint } from '../src/utils/radar.ts';
import { findNearbyWhisper } from '../src/utils/whisperProximity.ts';
import type { CosmicWhisper } from '../src/types.ts';

test('radar maps the sun to its sweep pivot and cardinal coordinates consistently', () => {
  assert.deepEqual(toRadarPoint(0, 0), { x: RADAR_CENTER, y: RADAR_CENTER });
  assert.deepEqual(toRadarPoint(RADAR_WORLD_RADIUS, 0), { x: 182, y: 100 });
  assert.deepEqual(toRadarPoint(0, -RADAR_WORLD_RADIUS), { x: 100, y: 18 });
});

test('off-map ship stays on the circle with room for its icon and preserves bearing', () => {
  for (const [x, z] of [[1000, 500], [-1000, 500], [1000, -500], [-1000, -500]]) {
    const point = toRadarPoint(x, z, 8);
    const dx = point.x - RADAR_CENTER;
    const dy = point.y - RADAR_CENTER;
    assert.ok(Math.abs(Math.hypot(dx, dy) - (RADAR_RADIUS - 8)) < 1e-10);
    assert.ok(Math.abs(dx / dy - x / z) < 1e-10);
  }
});

test('radar ship nose follows world +Z forward across all quadrants and wrapped yaw', () => {
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 8.1, -12.3]) {
    const heading = radarHeading(yaw) * Math.PI / 180;
    assert.ok(Math.abs(Math.sin(heading) - Math.sin(yaw)) < 1e-10);
    assert.ok(Math.abs(-Math.cos(heading) - Math.cos(yaw)) < 1e-10);
  }
});

const whisper = (id: string, x: number, y = 1): CosmicWhisper => ({
  id, position: [x, y, 0], author: id, origin: 'Earth', message: 'Hello',
  likes: 0, color: 'cyan', createdAt: '2026-09-17',
});

test('transmission is available on the first approach without a prior selection', () => {
  const message = whisper('first', 9);
  assert.equal(findNearbyWhisper([message], { x: 0, y: 1, z: 0 }), message);
  assert.equal(findNearbyWhisper([message], { x: -2, y: 1, z: 0 }), null);
});

test('transmission prompt stays stable at the boundary, leaves and reappears on return', () => {
  const message = whisper('first', 0);
  assert.equal(findNearbyWhisper([message], { x: 11, y: 1, z: 0 }, message.id), message);
  assert.equal(findNearbyWhisper([message], { x: 13, y: 1, z: 0 }, message.id), null);
  assert.equal(findNearbyWhisper([message], { x: 9, y: 1, z: 0 }), message);
});

test('proximity selects the nearest transmission and drops removed or distant messages', () => {
  const first = whisper('first', 9);
  const second = whisper('second', 3);
  const high = whisper('high', 0, 30);
  const position = { x: 0, y: 1, z: 0 };
  assert.equal(findNearbyWhisper([first, second], position, first.id), second);
  assert.equal(findNearbyWhisper([], position, first.id), null);
  assert.equal(findNearbyWhisper([high], position), null);
});
