import assert from 'node:assert/strict';
import test from 'node:test';
import RAPIER from '@dimforge/rapier3d-compat';
import { COSMIC_BOUNDARY, CosmicBoundaryController } from '../src/utils/cosmicBoundary.ts';
import { ISLANDS_CONFIG, CRYSTALS_DATA, BADGES_DATA } from '../src/data/portfolioData.ts';

const zero = { x: 0, y: 0, z: 0 };
const forward = { x: 0, y: 0, z: 1 };

test('normal exploration, islands, collectibles and secret island remain inside the warning zone', () => {
  const controller = new CosmicBoundaryController();
  const frame = controller.step({ x: 0, y: 1, z: 16 }, zero, forward, 1 / 60);
  assert.equal(frame.warning, false);
  assert.equal(frame.linearDamping, 1.55);
  assert.equal(frame.impulseZ, 0);
  for (const island of ISLANDS_CONFIG) assert.ok(island.orbitRadius + 12 < COSMIC_BOUNDARY.warningRadius);
  for (const crystal of CRYSTALS_DATA) assert.ok(Math.hypot(...crystal.position) < COSMIC_BOUNDARY.warningRadius);
  assert.ok(Math.hypot(-105, 88) < COSMIC_BOUNDARY.warningRadius);
});

test('repulsion is radial and inward, with progressively stronger damping', () => {
  const controller = new CosmicBoundaryController();
  let previousStrength = 0;
  for (const radius of [151, 155, 165, 175]) {
    const f = controller.step({ x: radius, y: 1, z: 0 }, { x: 30, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, 1 / 60);
    assert.ok(f.strength > previousStrength);
    assert.ok(f.impulseX < 0);
    assert.ok(Math.abs(f.impulseZ) < 1e-12);
    assert.ok(f.linearDamping > 1.55);
    previousStrength = f.strength;
  }
});

test('turning toward home cancels accumulated pressure and restores ordinary damping inside', () => {
  const controller = new CosmicBoundaryController();
  const p = { x: 0, y: 1, z: 170 };
  for (let i = 0; i < 60; i++) controller.step(p, zero, forward, 1 / 60);
  assert.ok(controller.frame.pressure > 0);
  for (let i = 0; i < 60; i++) controller.step(p, zero, { x: 0, y: 0, z: -1 }, 1 / 60);
  assert.equal(controller.frame.pressure, 0);
  assert.equal(controller.frame.warp, false);
  controller.step({ x: 0, y: 1, z: 100 }, zero, zero, 1 / 60);
  assert.equal(controller.frame.warning, false);
  assert.equal(controller.frame.linearDamping, 1.55);
  assert.equal(controller.frame.angularDamping, 3.4);
});

test('crossing the final radius triggers return in every direction, including vertical escapes', () => {
  for (const p of [{ x: 182, y: 1, z: 0 }, { x: 0, y: 183, z: 0 }, { x: 0, y: 1, z: -190 }]) {
    const controller = new CosmicBoundaryController();
    assert.equal(controller.step(p, zero, zero, 1 / 60).warp, true);
    assert.equal(controller.frame.recovery, COSMIC_BOUNDARY.recoverySeconds);
    let warps = 0;
    for (let i = 0; i < 120; i++) {
      if (controller.step(COSMIC_BOUNDARY.safePosition, zero, zero, 1 / 60).warp) warps++;
    }
    assert.equal(warps, 0);
    assert.equal(controller.frame.recovery, 0);
  }
});

test('insisting against the field returns once; warning sounds and ripples are rate limited', () => {
  const controller = new CosmicBoundaryController();
  let warps = 0, beeps = 0, impacts = 0;
  for (let i = 0; i < 600; i++) {
    const f = controller.step(warps ? COSMIC_BOUNDARY.safePosition : { x: 0, y: 1, z: 170 }, zero, forward, 1 / 60);
    warps += Number(f.warp);
    beeps += Number(f.beep);
    impacts += Number(f.impact);
  }
  assert.equal(warps, 1);
  assert.equal(beeps, 1);
  assert.ok(impacts > 0 && impacts <= 3);
});

test('pause and resumed long frames cannot instantly fill the return timer', () => {
  const controller = new CosmicBoundaryController();
  controller.step({ x: 0, y: 1, z: 170 }, zero, forward, 120);
  assert.ok(controller.frame.pressure < 0.02);
  controller.reset();
  assert.equal(controller.frame.pressure, 0);
  assert.equal(controller.frame.recovery, 0);
});

test('event-horizon achievement awards 50 XP with a unique id', () => {
  const badges = BADGES_DATA.filter(b => b.id === 'badge-event-horizon');
  assert.equal(badges.length, 1);
  assert.equal(badges[0].xpReward, 50);
});

test('real Rapier body remains contained under sustained maximum mobile boost at 20, 60 and 144 FPS', async () => {
  await RAPIER.init();
  for (const fps of [20, 60, 144]) {
    const world = new RAPIER.World(zero);
    try {
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 151).setLinearDamping(1.55));
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.9, 0.9, 1.8).setMass(14), body);
      const controller = new CosmicBoundaryController();
      const dt = 1 / fps;
      let warps = 0;
      let maxRadius = 0;
      for (let i = 0; i < fps * 15; i++) {
        world.timestep = dt;
        world.step();
        const p = body.translation();
        maxRadius = Math.max(maxRadius, Math.hypot(p.x, p.z));
        body.applyImpulse({ x: 0, y: 0, z: 1.4 * 46 * 36 * dt }, true);
        const f = controller.step(p, body.linvel(), { x: 0, y: 0, z: 1.4 }, dt);
        body.setLinearDamping(f.linearDamping);
        body.setAngularDamping(f.angularDamping);
        body.applyImpulse({ x: f.impulseX * body.mass(), y: f.impulseY * body.mass(), z: f.impulseZ * body.mass() }, true);
        if (f.warp) {
          warps++;
          body.setTranslation(COSMIC_BOUNDARY.safePosition, true);
          body.setLinvel(zero, true);
        }
      }
      assert.ok(maxRadius < COSMIC_BOUNDARY.returnRadius + 5, `uncontained at ${fps} FPS: ${maxRadius}`);
      assert.ok(warps >= 1, `sustained thrust never triggered return at ${fps} FPS`);
    } finally { world.free(); }
  }
});

test('kinematic fallback also contains sustained boost and allows inward escape from the field', () => {
  const controller = new CosmicBoundaryController();
  const position = { x: 0, y: 1, z: 160 };
  const velocity = { ...zero };
  const dt = 1 / 60;
  for (let i = 0; i < 1200; i++) {
    velocity.z += 1.4 * 46 * dt;
    velocity.z *= Math.pow(0.92, dt * 30);
    position.z += velocity.z * dt;
    const f = controller.step(position, velocity, forward, dt);
    velocity.z = (velocity.z + f.impulseZ) * Math.exp(-f.strength * 5 * dt);
    if (f.warp) Object.assign(position, COSMIC_BOUNDARY.safePosition);
    assert.ok(position.z < COSMIC_BOUNDARY.returnRadius + 2);
  }
  position.z = 170;
  velocity.z = 0;
  for (let i = 0; i < 300; i++) {
    velocity.z -= 27 * dt;
    velocity.z *= Math.pow(0.92, dt * 30);
    position.z += velocity.z * dt;
    const f = controller.step(position, velocity, { x: 0, y: 0, z: -1 }, dt);
    velocity.z = (velocity.z + f.impulseZ) * Math.exp(-f.strength * 5 * dt);
    assert.equal(f.warp, false);
  }
  assert.ok(position.z < COSMIC_BOUNDARY.warningRadius);
});
