import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { RACE_CHECKPOINTS, RACE_GRID, RACE_GATES, RACE_OBSTACLES, TRACK_HALF_WIDTH, RACE_CHECKPOINT_HALF_WIDTH, TRACK_VERSION, createTrackRocks, crossGate, raceCurve } from '../src/utils/raceTrack.ts';
import { addRaceBarriers } from '../src/utils/raceTrackPhysics.ts';
import { consumeNitro, parseGhost, raceSession, GHOST_KEY } from '../src/utils/raceSession.ts';
import { RaceWallGuide, RACE_DRIVE_HALF_WIDTH, sampleTrackFrame } from '../src/utils/raceWallGuide.ts';
import { PausableClock } from '../src/utils/pausableClock.ts';
import { COSMIC_BOUNDARY } from '../src/utils/cosmicBoundary.ts';
import { raceTurnRate, smoothRaceSteering, raceSpeedScale, stepRaceDrive, RACE_CRUISE_SPEED, RACE_BOOST_SPEED } from '../src/utils/raceHandling.ts';

test('circuit closes at gate zero and every gate faces the forward tangent', () => {
  assert.deepEqual(RACE_CHECKPOINTS.map(g => g.id), [...RACE_GATES.slice(1).map(g => g.id), 0]);
  assert.ok(raceCurve.getPoint(0).distanceTo(raceCurve.getPoint(1)) < 1e-8);
  for (const gate of RACE_GATES) {
    const center = new THREE.Vector3(...gate.position);
    assert.ok(center.distanceTo(raceCurve.getPointAt(gate.id / RACE_GATES.length)) < 1e-8);
    assert.ok(new THREE.Vector3(...gate.forward).dot(raceCurve.getTangentAt(gate.id / RACE_GATES.length)) > 0.999);
  }
  assert.equal(RACE_GRID.yaw, RACE_GATES[0].rotationY);
});

test('swept gate crossing handles superboost, rejects backwards travel, proximity and misses', () => {
  for (const gate of RACE_GATES) {
    const center = new THREE.Vector3(...gate.position);
    const forward = new THREE.Vector3(...gate.forward);
    const before = center.clone().addScaledVector(forward, -10);
    const after = center.clone().addScaledVector(forward, 10);
    assert.ok(crossGate(before, after, gate)! < 1e-8);
    assert.equal(crossGate(after, before, gate), null);
    assert.equal(crossGate(before, before, gate), null);
    before.y += 4;
    after.y += 4;
    assert.equal(crossGate(before, after, gate), null);
  }
});

test('both asteroid walls are closed without gaps and leave a navigable centerline', () => {
  assert.equal(TRACK_HALF_WIDTH * 2, 36, 'track wall spacing');
  const rocks = createTrackRocks();
  for (const wall of [-1, 1].map(side => rocks.filter(rock => rock.side === side))) {
    for (let i = 0; i < wall.length; i++) {
      const a = wall[i], b = wall[(i + 1) % wall.length];
      assert.ok(a.position.distanceTo(b.position) < a.radius + b.radius, `wall gap at ${i}`);
    }
  }
  for (let i = 0; i < 600; i++) {
    const point = raceCurve.getPointAt(i / 600);
    for (const rock of rocks) assert.ok(point.distanceTo(rock.position) - rock.radius > 15, 'wide centerline clearance');
    assert.ok(Math.hypot(point.x, point.z) > 12, 'sun clearance');
  }
});

test('Rapier barriers keep a high-speed ship inside both sides, then clean up completely', async () => {
  await RAPIER.init();
  const rocks = createTrackRocks();
  for (const side of [-1, 1]) {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    try {
      const barriers = addRaceBarriers(world, rocks);
      const p = raceCurve.getPointAt(0.2);
      const tangent = raceCurve.getTangentAt(0.2);
      const normal = new THREE.Vector3(tangent.z * side, 0, -tangent.x * side);
      const ship = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z)
        .enabledTranslations(true, false, true).enabledRotations(false, false, false).setCcdEnabled(true));
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.9, 0.9, 1.8).setMass(14), ship);
      ship.setLinvel(normal.clone().multiplyScalar(100), true);
      world.timestep = 1 / 30;
      for (let i = 0; i < 12; i++) {
        world.step();
        const translation = ship.translation();
        const displacement = new THREE.Vector3(translation.x, translation.y, translation.z).sub(p).dot(normal);
        assert.ok(displacement < TRACK_HALF_WIDTH, 'ship must remain inside the wall, including at low FPS');
      }
      world.removeRigidBody(barriers);
      assert.equal(world.colliders.len(), 1);
      world.removeRigidBody(ship);
      assert.equal(world.colliders.len(), 0);
    } finally { world.free(); }
  }
});

test('outer circuit covers the map, alternates bends smoothly, and stays inside the cosmic boundary', () => {
  const length = raceCurve.getLength();
  assert.ok(length > 730 && length < 850, `lap length: ${length}`);
  const samples = raceCurve.getSpacedPoints(800);
  let left = 0, right = 0;
  const bounds = new THREE.Box3().setFromPoints(samples);
  assert.ok(bounds.min.x < -100 && bounds.max.x > 100 && bounds.min.z < -100 && bounds.max.z > 100);
  let minStep = Infinity, maxStep = 0;
  for (let i = 0; i < 800; i++) {
    const current = raceCurve.getTangentAt(i / 800);
    const next = raceCurve.getTangentAt((i + 1) / 800);
    const signedTurn = Math.atan2(current.x * next.z - current.z * next.x, current.dot(next));
    if (signedTurn > 0.001) left++;
    if (signedTurn < -0.001) right++;
    const distance = samples[i].distanceTo(samples[i + 1]);
    minStep = Math.min(minStep, distance);
    maxStep = Math.max(maxStep, distance);
    assert.ok(Math.abs(signedTurn) / distance < 0.025, 'no abrupt corners or hairpins');
  }
  assert.ok(left > 80 && right > 80, 'substantial curves in both directions');
  assert.ok(maxStep / minStep < 1.01, 'uniform distance sampling');
  for (const rock of createTrackRocks()) {
    assert.ok(Math.hypot(rock.position.x, rock.position.z) + rock.radius + 2 < COSMIC_BOUNDARY.warningRadius);
  }
});

test('new circuit has distinct asymmetric bends and visible obstacles leave room to dodge', () => {
  let quarterDifference = 0;
  for (let i = 0; i < 100; i++) {
    quarterDifference = Math.max(quarterDifference,
      Math.abs(raceCurve.getPoint(i / 100).length() - raceCurve.getPoint((i / 100 + 0.25) % 1).length()));
  }
  assert.ok(quarterDifference > 12, 'sections must not repeat a square pattern');
  assert.equal(RACE_OBSTACLES.length, 16);
  for (const obstacle of RACE_OBSTACLES) {
    assert.ok(Math.abs(obstacle.offset) + obstacle.radius + 3 < RACE_DRIVE_HALF_WIDTH, 'both sides remain passable');
    for (const gate of RACE_GATES) assert.ok(obstacle.position.distanceTo(new THREE.Vector3(...gate.position)) > 12, 'clear checkpoint approach');
    for (const other of RACE_OBSTACLES) if (other.id !== obstacle.id) {
      assert.ok(other.position.distanceTo(obstacle.position) > 27, 'alternating obstacles leave room to dodge');
    }
  }
});

test('obstacle impacts produce contact feedback and allow the actual Rapier ship to slide free', async () => {
  await RAPIER.init();
  for (const fps of [30, 60, 144]) for (const speed of [RACE_CRUISE_SPEED, RACE_BOOST_SPEED]) {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    try {
      addRaceBarriers(world, createTrackRocks());
      const obstacle = RACE_OBSTACLES.find(obstacle => obstacle.offset === 0)!;
      const tangent = raceCurve.getTangentAt(obstacle.distance);
      const start = obstacle.position.clone().addScaledVector(tangent, -12);
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x, 1, start.z)
        .enabledTranslations(true, false, true).enabledRotations(false, false, false).setCcdEnabled(true));
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.9, 0.9, 1.8).setMass(14), body);
      body.setLinvel(tangent.clone().multiplyScalar(speed), true);
      const guide = new RaceWallGuide(), velocity = { x: 0, z: 0 };
      let yaw = obstacle.yaw, contactFrames = 0, impacted = false;
      world.timestep = 1 / fps;
      for (let i = 0; i < fps * 3; i++) {
        world.step();
        const p = body.translation(), v = body.linvel();
        stepRaceDrive(velocity, v.x, v.z, yaw, 1, speed, 1 / fps);
        const f = guide.step(p.x, p.z, velocity.x, velocity.z, yaw, 1, 1 / fps);
        yaw = f.yaw;
        body.setTranslation({ x: f.x, y: 1, z: f.z }, true);
        body.setLinvel({ x: f.vx, y: 0, z: f.vz }, true);
        body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
        if (f.impact) {
          impacted = true;
          assert.ok(Math.hypot(f.vx, f.vz) < speed * 0.9, 'impact has a real speed penalty');
        }
        if (f.touching) contactFrames++;
        assert.ok(Math.hypot(f.x - obstacle.position.x, f.z - obstacle.position.z) > obstacle.radius + 2.2, 'no penetration');
        assert.ok(Math.hypot(f.vx, f.vz) > 5, 'no complete stop on impact');
      }
      const end = body.translation();
      assert.ok(impacted && contactFrames > 1, 'impact and continuing sparks');
      assert.ok(Math.hypot(end.x - obstacle.position.x, end.z - obstacle.position.z) > 15, 'ship has cleared the obstacle');
    } finally { world.free(); }
  }
});

test('race steering responds promptly without jumps and has the same response across frame rates', () => {
  const afterPress = smoothRaceSteering(0, 1, 1 / 60);
  assert.ok(afterPress > 0 && afterPress < 0.4);
  assert.ok(smoothRaceSteering(0, 1, 0.3) > 0.95);
  assert.ok(Math.abs(smoothRaceSteering(1, 0, 0.3)) < 0.05);
  for (const fps of [30, 60, 120]) {
    let steering = 0;
    for (let i = 0; i < fps / 2; i++) steering = smoothRaceSteering(steering, -1, 1 / fps);
    assert.ok(Math.abs(steering - smoothRaceSteering(0, -1, 0.5)) < 1e-10);
  }
  assert.ok(raceTurnRate(RACE_CRUISE_SPEED) > 1.5 && raceTurnRate(RACE_CRUISE_SPEED) < 2, 'cruise steering stays responsive without spinning');
  assert.ok(raceTurnRate(80) < raceTurnRate(25), 'steady steering at superboost speed');
});

test('race speed limits preserve travel direction and leave slower motion untouched', () => {
  assert.equal(RACE_CRUISE_SPEED, 46);
  assert.equal(RACE_BOOST_SPEED, 54);
  assert.equal(raceSpeedScale(12, 16, RACE_CRUISE_SPEED), 1);
  for (const cap of [RACE_CRUISE_SPEED, RACE_BOOST_SPEED]) {
    const scale = raceSpeedScale(60, 80, cap);
    const x = 60 * scale, z = 80 * scale;
    assert.ok(Math.abs(Math.hypot(x, z) - cap) < 1e-9);
    assert.ok(Math.abs(x / z - 0.75) < 1e-9);
  }
});

test('race drive accelerates progressively, brakes and reaches the same cruising speed across frame rates', () => {
  for (const fps of [30, 60, 144]) {
    const v = { x: 0, z: 0 };
    for (let i = 0; i < fps * 2; i++) stepRaceDrive(v, v.x, v.z, 0, 1, RACE_CRUISE_SPEED, 1 / fps);
    assert.ok(Math.abs(v.z - RACE_CRUISE_SPEED) < 0.01);
    stepRaceDrive(v, v.x, v.z, 0, 1, RACE_BOOST_SPEED, 1 / fps);
    assert.ok(v.z > RACE_CRUISE_SPEED && v.z < RACE_BOOST_SPEED, 'nitro ramps up instead of jumping');
    for (let i = 0; i < fps; i++) stepRaceDrive(v, v.x, v.z, 0, 0, RACE_CRUISE_SPEED, 1 / fps);
    assert.ok(v.z > 36 && v.z < 38, 'releasing throttle coasts');
    for (let i = 0; i < fps; i++) stepRaceDrive(v, v.x, v.z, 0, -1, RACE_CRUISE_SPEED, 1 / fps);
    assert.ok(v.z < 0 && v.z >= -9, 'braking can transition to a slow reverse');
    for (let i = 0; i < fps * 3; i++) stepRaceDrive(v, v.x, v.z, 0, 1, RACE_BOOST_SPEED, 1 / fps);
    assert.ok(Math.abs(v.z - RACE_BOOST_SPEED) < 0.01, 'sustained nitro reaches 54 units per second');
  }
});

test('every part of the wide race checkpoint counts; exploration portals retain their original size', () => {
  const gate = RACE_GATES[2], center = new THREE.Vector3(...gate.position);
  const forward = new THREE.Vector3(...gate.forward), normal = new THREE.Vector3(forward.z, 0, -forward.x);
  for (const lateral of [-13.8, 0, 13.8]) {
    const point = center.clone().addScaledVector(normal, lateral);
    const before = point.clone().addScaledVector(forward, -2), after = point.clone().addScaledVector(forward, 2);
    assert.notEqual(crossGate(before, after, gate, RACE_CHECKPOINT_HALF_WIDTH), null);
    if (lateral) assert.equal(crossGate(before, after, gate), null);
    assert.equal(crossGate(after, before, gate, RACE_CHECKPOINT_HALF_WIDTH), null);
  }
});

test('actual Rapier ship slides past multiple rocks after frontal and oblique impacts at 30/60/144 FPS', async () => {
  await RAPIER.init();
  for (const fps of [30, 60, 144]) for (const side of [-1, 1]) for (const glancing of [false, true]) {
    const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
    try {
      addRaceBarriers(world, createTrackRocks());
      const center = raceCurve.getPointAt(0.2), tangent = raceCurve.getTangentAt(0.2);
      const normal = new THREE.Vector3(tangent.z * side, 0, -tangent.x * side);
      const start = center.clone().addScaledVector(normal, RACE_DRIVE_HALF_WIDTH - 1);
      const direction = normal.clone().addScaledVector(tangent, glancing ? 1 : 0.03).normalize();
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(start.x, 1, start.z)
        .enabledTranslations(true, false, true).enabledRotations(false, false, false).setCcdEnabled(true));
      world.createCollider(RAPIER.ColliderDesc.cuboid(0.9, 0.9, 1.8).setMass(14), body);
      body.setLinvel(direction.clone().multiplyScalar(RACE_BOOST_SPEED), true);
      let yaw = Math.atan2(direction.x, direction.z), impacts = 0, contactFrames = 0, distance = 0;
      const guide = new RaceWallGuide(), velocity = { x: 0, z: 0 };
      world.timestep = 1 / fps;
      for (let i = 0; i < fps * 5; i++) {
        world.step();
        const p = body.translation(), v = body.linvel();
        stepRaceDrive(velocity, v.x, v.z, yaw, 1, RACE_BOOST_SPEED, 1 / fps);
        const wall = guide.step(p.x, p.z, velocity.x, velocity.z, yaw, 1, 1 / fps);
        yaw = wall.yaw;
        body.setTranslation({ x: wall.x, y: 1, z: wall.z }, true);
        body.setLinvel({ x: wall.vx, y: 0, z: wall.vz }, true);
        body.setRotation(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), true);
        if (wall.impact) impacts++;
        if (wall.touching) contactFrames++;
        distance += Math.hypot(wall.vx, wall.vz) / fps;
        assert.ok(Math.abs(sampleTrackFrame(wall.x, wall.z).offset) < RACE_DRIVE_HALF_WIDTH + 0.03, 'ship stays in corridor');
        if (i > fps / 2) assert.ok(Math.hypot(wall.vx, wall.vz) > 6, 'contact must not stall the ship');
      }
      assert.ok(impacts > 0 && impacts < 8, `entry impacts: ${impacts}`);
      assert.ok(contactFrames > fps / 3, 'sustained contact drives ongoing sparks');
      assert.ok(distance > 65, `sliding progress: ${distance}`);
    } finally { world.free(); }
  }
});

test('nitro depletes with elapsed time, remains bounded, and is not spent while released', () => {
  assert.equal(consumeNitro(100, true, 2), 52);
  assert.equal(consumeNitro(1, true, 1), 0);
  assert.equal(consumeNitro(30, false, 2), 30);
  let charge = 100;
  for (let i = 0; i < 120; i++) charge = consumeNitro(charge, true, 1 / 60);
  assert.ok(Math.abs(charge - 52) < 1e-8);
});

test('ghost validation rejects corruption, incompatible tracks and nonmonotonic frames', () => {
  const run = { version: TRACK_VERSION, duration: 1, frames: [[0, 18, 1, 18, 0, 1, 0], [1, 20, 1, 20, 0, 1, 0]] };
  assert.deepEqual(parseGhost(JSON.stringify(run)), run);
  for (const invalid of [null, '{', 'null', JSON.stringify({ ...run, version: -1 }),
    JSON.stringify({ ...run, duration: 0 }), JSON.stringify({ ...run, frames: [...run.frames].reverse() }),
    JSON.stringify({ ...run, frames: [run.frames[0], run.frames[0]] }), JSON.stringify({ ...run, duration: 2 })]) {
    assert.equal(parseGhost(invalid), null);
  }
});

test('session records only completed best laps, pauses time, and survives unavailable storage', () => {
  const data = new Map<string, string>();
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
  } });
  let now = 0;
  const start = () => {
    raceSession.prepare();
    raceSession.start();
    raceSession.clock = new PausableClock(() => now);
    raceSession.record(18, 1, 18, 0, 1, 0);
  };
  try {
    start();
    now += 500;
    raceSession.clock.setPaused(true);
    now += 5000;
    assert.equal(raceSession.elapsed(), 0.5);
    raceSession.clock.setPaused(false);
    now += 500;
    raceSession.record(20, 1, 20, 0, 1, 0);
    assert.equal(raceSession.finish(), 1);
    const best = data.get(GHOST_KEY);
    assert.equal(parseGhost(best!)?.duration, 1);
    start();
    now += 2000;
    raceSession.record(20, 1, 20, 0, 1, 0);
    raceSession.finish();
    assert.equal(data.get(GHOST_KEY), best, 'slower lap cannot overwrite top one');
    start();
    raceSession.cancel();
    assert.equal(data.get(GHOST_KEY), best, 'cancelled lap cannot overwrite top one');
    start();
    now += 500;
    raceSession.record(20, 1, 20, 0, 1, 0);
    raceSession.finish();
    assert.equal(parseGhost(data.get(GHOST_KEY)!)?.duration, 0.5);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('disabled'); } });
    start();
    now += 500;
    raceSession.record(20, 1, 20, 0, 1, 0);
    assert.doesNotThrow(() => raceSession.finish());
  } finally {
    raceSession.cancel();
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
