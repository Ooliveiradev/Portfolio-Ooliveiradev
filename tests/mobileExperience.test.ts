import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleJoystick, JOYSTICK_RADIUS, screenFlightDirection, stepScreenFlight, faceFlightDirection } from '../src/utils/joystick.ts';
import { PerspectiveCamera, Vector3 } from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { cameraFraming, initialGraphicsQuality } from '../src/utils/mobileExperience.ts';
import { getClamped1080pDpr } from '../src/utils/resolutionLimiter.ts';

test('touch defaults to low, desktop to high, and explicit preferences survive reload', () => {
  assert.equal(initialGraphicsQuality(null, true), 'low');
  assert.equal(initialGraphicsQuality('invalid', true), 'low');
  assert.equal(initialGraphicsQuality(null, false), 'high');
  for (const preset of ['low', 'mid', 'high'] as const) assert.equal(initialGraphicsQuality(preset, true), preset);
});

test('high-density phones never exceed 1.25 DPR even when high quality is selected', () => {
  for (const [width, height] of [[360, 800], [430, 932], [932, 430]]) {
    for (const quality of ['low', 'mid', 'high'] as const) {
      const dpr = getClamped1080pDpr(quality, { width, height, dpr: 3, touch: true });
      assert.ok(dpr <= (quality === 'low' ? 1 : 1.25));
    }
  }
  assert.equal(getClamped1080pDpr('high', { width: 430, height: 932, dpr: 0.75, touch: true }), 0.75);
});

test('portrait opens both camera frustum and follow distance, rotation restores desktop framing', () => {
  for (const width of [360, 390, 430]) {
    const portrait = cameraFraming(width, 844);
    const landscape = cameraFraming(844, width);
    assert.ok(portrait.fov > landscape.fov);
    assert.ok(portrait.distance > landscape.distance);
    assert.ok(portrait.raceFov > landscape.raceFov);
    assert.equal(landscape.fov, 30);
  }
});

test('small involuntary thumb movement stays neutral and invalid input is safe', () => {
  for (const [dx, dy] of [[0, 0], [2, -2], [-3, 3], [NaN, 10], [Infinity, 0]]) {
    const input = sampleJoystick(dx, dy);
    assert.equal(Math.abs(input.x), 0);
    assert.equal(Math.abs(input.y), 0);
  }
});

test('joystick is continuous, proportional and bounded when dragged outside the pad', () => {
  let previous = 0;
  for (let pixels = 0; pixels <= 120; pixels += 0.1) {
    const input = sampleJoystick(pixels, 0);
    assert.ok(input.x >= previous - 1e-10 && input.x <= 1);
    assert.ok(input.x - previous < 0.01, 'no threshold jump');
    assert.ok(input.knobX <= JOYSTICK_RADIUS);
    previous = input.x;
  }
  assert.equal(sampleJoystick(400, 0).x, 1);
  assert.equal(sampleJoystick(0, -400).y, -1);
  assert.ok(sampleJoystick(20, 0).x < .5, 'fine control at half travel');
});

test('all diagonals retain direction and share the same maximum travel and thrust', () => {
  for (const [x, y] of [[100, 100], [-100, 100], [100, -100], [-100, -100]]) {
    const input = sampleJoystick(x, y);
    assert.ok(Math.abs(Math.hypot(input.x, input.y) - 1) < 1e-10);
    assert.ok(Math.abs(Math.hypot(input.knobX, input.knobY) - JOYSTICK_RADIUS) < 1e-10);
    assert.equal(Math.sign(input.x), Math.sign(x));
    assert.equal(Math.sign(input.y), Math.sign(y));
  }
});

test('eight joystick directions project to those same screen directions for any camera heading', () => {
  for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
    for (const angle of [0, Math.PI / 4, Math.PI / 2, Math.PI, -2]) {
      const camera = new PerspectiveCamera(cameraFraming(width, height).fov, width / height, .1, 1000);
      camera.position.set(Math.sin(angle) * 34, 26, Math.cos(angle) * 34);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      const origin = new Vector3().project(camera);
      for (const [x, y] of [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]) {
        const direction = screenFlightDirection({ x: 0, z: 0, strength: 0, yaw: 0 }, x, y, camera.matrixWorld.elements);
        const projected = new Vector3(direction.x, 0, direction.z).project(camera);
        const screenX = (projected.x - origin.x) * width;
        const screenY = -(projected.y - origin.y) * height;
        const length = Math.hypot(screenX, screenY);
        assert.ok(Math.abs(screenX / length - x / Math.hypot(x, y)) < 1e-6);
        assert.ok(Math.abs(screenY / length - y / Math.hypot(x, y)) < 1e-6);
      }
    }
  }
});

test('touch velocity is independent of the nose heading and frame rate; reversal goes toward the finger', () => {
  const direction = { x: 0, z: -1, strength: .5, yaw: Math.PI };
  for (const fps of [30, 60, 144]) {
    const velocity = { x: 20, z: 20 };
    for (let frame = 0; frame < fps; frame++) stepScreenFlight(velocity, velocity.x, velocity.z, direction, 27, 1 / fps);
    assert.ok(Math.abs(velocity.x) < .001);
    assert.ok(Math.abs(velocity.z + 13.5) < .001);
    assert.ok(faceFlightDirection(Math.PI - .01, -Math.PI + .01, 1 / fps) > Math.PI - .01, 'nose takes the short path across PI');
  }
});

test('actual Rapier ship travels down and diagonally as projected on screen at 30/60/144 FPS', async () => {
  await RAPIER.init();
  const camera = new PerspectiveCamera(42, 390 / 844, .1, 1000);
  camera.position.set(24, 26, 24);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  for (const fps of [30, 60, 144]) {
    for (const [x, y] of [[0, 1], [1, -1], [-1, 0]]) {
      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setLinearDamping(1.55));
      world.createCollider(RAPIER.ColliderDesc.cuboid(.9, .9, 1.8), body);
      const direction = screenFlightDirection({ x: 0, z: 0, strength: 0, yaw: 0 }, x, y, camera.matrixWorld.elements);
      const velocity = { x: 0, z: 0 };
      for (let frame = 0; frame < fps; frame++) {
        const current = body.linvel();
        stepScreenFlight(velocity, current.x, current.z, direction, 27, 1 / fps);
        body.setLinvel({ ...velocity, y: 0 }, true);
        world.timestep = 1 / fps;
        world.step();
      }
      const pos = body.translation();
      const projected = new Vector3(pos.x, 0, pos.z).project(camera);
      const dx = projected.x * 390, dy = -projected.y * 844;
      const length = Math.hypot(dx, dy);
      assert.ok(length > 100);
      assert.ok(Math.abs(dx / length - x / Math.hypot(x, y)) < 1e-6);
      assert.ok(Math.abs(dy / length - y / Math.hypot(x, y)) < 1e-6);
      world.free();
    }
  }
});
