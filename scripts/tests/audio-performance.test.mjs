import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../../src/audio/soundManager.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source, {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
});

function createEngine(initialState = 'running') {
  const metrics = { contexts: 0, resumes: 0, events: [], context: null, finishResume: null };
  const parameter = () => ({
    setValueAtTime() {},
    setTargetAtTime(value, time, constant) {
      metrics.events.push({ value, time, constant });
    },
  });
  const audioNode = () => ({
    connect() {},
    start() {},
    gain: parameter(),
    frequency: parameter(),
    Q: parameter(),
  });

  class AudioContextMock {
    state = initialState;
    currentTime = 1;
    sampleRate = 48000;
    destination = {};

    constructor() {
      metrics.contexts++;
      metrics.context = this;
    }

    resume() {
      metrics.resumes++;
      return new Promise((resolve) => {
        metrics.finishResume = () => {
          this.state = 'running';
          resolve();
        };
      });
    }

    createGain() { return audioNode(); }
    createBiquadFilter() { return audioNode(); }
    createOscillator() { return audioNode(); }
    createBufferSource() { return audioNode(); }
    createBuffer(_channels, size) {
      return { getChannelData: () => new Float32Array(size) };
    }
  }

  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    module: { exports },
    window: { AudioContext: AudioContextMock },
  });
  return { sounds: exports.sounds, metrics };
}

test('idle and muted vehicles do not create an audio context or noise graph', () => {
  const { sounds, metrics } = createEngine();
  for (let frame = 0; frame < 600; frame++) sounds.updateThrusterSound(0, false);
  sounds.isMuted = true;
  for (let frame = 0; frame < 600; frame++) sounds.updateThrusterSound(1, true);
  assert.equal(metrics.contexts, 0);
  assert.equal(metrics.events.length, 0);
});

test('12,000 frames schedule audio only on cruise and boost transitions', () => {
  const { sounds, metrics } = createEngine();
  for (let frame = 0; frame < 6000; frame++) sounds.updateThrusterSound(1, false);
  assert.equal(metrics.events.length, 3, 'steady throttle must not grow the automation timeline');
  assert.deepEqual(metrics.events.map(({ value }) => value), [0.036, 270, 54]);

  for (let frame = 0; frame < 6000; frame++) sounds.updateThrusterSound(1, true);
  assert.equal(metrics.events.length, 6);
  assert.deepEqual(metrics.events.slice(3).map(({ value }) => value), [0.068, 440, 68]);
  assert.equal(metrics.contexts, 1);
});

test('release fades once and accelerating again restores all sound parameters', () => {
  const { sounds, metrics } = createEngine();
  sounds.updateThrusterSound(1, true);
  for (let frame = 0; frame < 600; frame++) sounds.updateThrusterSound(0, false);
  assert.equal(metrics.events.length, 5);
  assert.deepEqual(metrics.events.slice(3).map(({ value }) => value), [0.0001, 200]);

  sounds.updateThrusterSound(-1, false);
  assert.equal(metrics.events.length, 8);
  assert.deepEqual(metrics.events.slice(5).map(({ value }) => value), [0.036, 270, 54]);
});

test('muting and repeated cleanup fade once, then unmuting resumes the thruster', () => {
  const { sounds, metrics } = createEngine();
  sounds.updateThrusterSound(1, false);
  sounds.isMuted = true;
  for (let frame = 0; frame < 600; frame++) sounds.updateThrusterSound(1, false);
  sounds.stopThrusterSound();
  sounds.stopThrusterSound();
  assert.equal(metrics.events.length, 4);
  assert.equal(metrics.events.at(-1).value, 0.0001);

  sounds.isMuted = false;
  sounds.updateThrusterSound(1, false);
  assert.equal(metrics.events.length, 7);
});

test('suspended audio resumes once while a request is pending, including after a tab pause', async () => {
  const { sounds, metrics } = createEngine('suspended');
  for (let frame = 0; frame < 300; frame++) sounds.updateThrusterSound(1, false);
  assert.equal(metrics.resumes, 1);
  assert.equal(metrics.events.length, 3);

  metrics.finishResume();
  await Promise.resolve();
  await Promise.resolve();
  metrics.context.state = 'suspended';
  for (let frame = 0; frame < 300; frame++) sounds.updateThrusterSound(1, false);
  assert.equal(metrics.resumes, 2, 'a later browser suspension must remain recoverable');
  assert.equal(metrics.events.length, 3, 'resuming must not requeue unchanged audio automation');
  metrics.finishResume();
});
