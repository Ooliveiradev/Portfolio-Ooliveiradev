import assert from 'node:assert/strict';
import test from 'node:test';
import { Camera, DirectionalLight, HalfFloatType, Scene, WebGLRenderTarget } from 'three';
import { prewarmQualityVariants, prewarmScene } from '../src/utils/prewarmScene.ts';

test('HDR warmup compiles the composer variant and immediately restores the active target', async () => {
  const original = new WebGLRenderTarget(8, 8);
  let active: WebGLRenderTarget | null = original;
  let compiled: WebGLRenderTarget | null = null;
  let disposed = false;
  let restored: number[] = [];
  let complete!: () => void;
  const pending = new Promise<void>(resolve => { complete = resolve; });
  const renderer = {
    getRenderTarget: () => active,
    getActiveCubeFace: () => 3,
    getActiveMipmapLevel: () => 2,
    setRenderTarget: (target: WebGLRenderTarget | null, face = 0, mip = 0) => {
      active = target; restored = [face, mip];
    },
    compileAsync: async (scene: Scene) => {
      compiled = active;
      assert.ok(compiled);
      assert.equal(compiled.texture.type, HalfFloatType);
      assert.equal(compiled.width * compiled.height, 1);
      compiled.addEventListener('dispose', () => { disposed = true; });
      await pending;
      return scene;
    },
  };
  const warmup = prewarmScene(renderer, new Scene(), new Camera(), true);
  assert.equal(active, original, 'rendering must remain usable while shaders compile');
  assert.deepEqual(restored, [3, 2]);
  assert.equal(disposed, false);
  complete();
  await warmup;
  assert.equal(disposed, true);
  original.dispose();
});

test('low quality warms the direct-screen variant', async () => {
  let active: WebGLRenderTarget | null = new WebGLRenderTarget(1, 1);
  const original = active;
  await prewarmScene({
    getRenderTarget: () => active,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: (target: WebGLRenderTarget | null) => { active = target; },
    compileAsync: async scene => { assert.equal(active, null); return scene; },
  }, new Scene(), new Camera(), false);
  assert.equal(active, original);
  original.dispose();
});

test('failed warmup restores the renderer and releases the temporary HDR target', async () => {
  let active: WebGLRenderTarget | null = null;
  let disposed = false;
  await assert.rejects(prewarmScene({
    getRenderTarget: () => active,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: (target: WebGLRenderTarget | null) => { active = target; },
    compileAsync: () => {
      active!.addEventListener('dispose', () => { disposed = true; });
      throw new Error('compilation failed');
    },
  }, new Scene(), new Camera(), true), /compilation failed/);
  assert.equal(active, null);
  assert.equal(disposed, true);
});

test('quality warmup prepares HDR shadows then direct output even when starting in low quality', async () => {
  let active: WebGLRenderTarget | null = null;
  let finishHdr!: () => void;
  let finishDirect!: () => void;
  let hdrDisposed = false;
  const hdrPending = new Promise<void>(resolve => { finishHdr = resolve; });
  const directPending = new Promise<void>(resolve => { finishDirect = resolve; });
  const configurations: boolean[][] = [];
  const light = new DirectionalLight();
  const renderer = {
    shadowMap: { enabled: false },
    getRenderTarget: () => active,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget: (target: WebGLRenderTarget | null) => { active = target; },
    compileAsync: async (scene: Scene) => {
      configurations.push([Boolean(active), renderer.shadowMap.enabled, light.castShadow]);
      if (active) {
        active.addEventListener('dispose', () => { hdrDisposed = true; });
        await hdrPending;
      } else {
        await directPending;
      }
      return scene;
    },
  };
  const warmup = prewarmQualityVariants(renderer, new Scene(), new Camera(), light);
  assert.deepEqual(configurations, [[true, true, true]]);
  assert.equal(active, null);
  assert.equal(renderer.shadowMap.enabled, false);
  assert.equal(light.castShadow, false);
  assert.equal(hdrDisposed, false);

  finishHdr();
  // Wait until the queued HDR disposal and following direct compilation run.
  await new Promise<void>(resolve => setImmediate(resolve));
  assert.deepEqual(configurations, [[true, true, true], [false, false, false]]);
  assert.equal(hdrDisposed, true);
  assert.equal(active, null);
  assert.equal(renderer.shadowMap.enabled, false);
  assert.equal(light.castShadow, false);
  finishDirect();
  await warmup;
});

test('quality warmup restores original shadow flags and framebuffer while compilation is pending', async () => {
  const original = new WebGLRenderTarget(4, 4);
  let active: WebGLRenderTarget | null = original;
  const light = new DirectionalLight();
  light.castShadow = true;
  let currentRestore: number[] = [];
  let callCount = 0;
  const renderer = {
    shadowMap: { enabled: true },
    getRenderTarget: () => active,
    getActiveCubeFace: () => 2,
    getActiveMipmapLevel: () => 1,
    setRenderTarget: (target: WebGLRenderTarget | null, face = 0, mip = 0) => {
      active = target;
      currentRestore = [face, mip];
    },
    compileAsync: async (scene: Scene) => {
      const hdr = callCount++ === 0;
      assert.equal(Boolean(active), hdr);
      assert.equal(renderer.shadowMap.enabled, hdr);
      assert.equal(light.castShadow, hdr);
      await Promise.resolve();
      assert.equal(active, original);
      assert.equal(renderer.shadowMap.enabled, true);
      assert.equal(light.castShadow, true);
      assert.deepEqual(currentRestore, [2, 1]);
      return scene;
    },
  };
  await prewarmQualityVariants(renderer, new Scene(), new Camera(), light);
  assert.equal(callCount, 2);
  original.dispose();
});

for (const failure of ['sync-hdr', 'async-hdr', 'async-direct'] as const) {
  test(`quality warmup restores state and disposes targets after ${failure} failure`, async () => {
    let active: WebGLRenderTarget | null = null;
    let disposed = false;
    let callCount = 0;
    const light = new DirectionalLight();
    light.castShadow = true;
    const renderer = {
      shadowMap: { enabled: true },
      getRenderTarget: () => active,
      getActiveCubeFace: () => 0,
      getActiveMipmapLevel: () => 0,
      setRenderTarget: (target: WebGLRenderTarget | null) => { active = target; },
      compileAsync: (scene: Scene) => {
        const hdr = callCount++ === 0;
        if (active) active.addEventListener('dispose', () => { disposed = true; });
        if (failure === 'sync-hdr') throw new Error(failure);
        if (hdr === (failure === 'async-hdr')) return Promise.reject(new Error(failure));
        return Promise.resolve(scene);
      },
    };
    const warmup = prewarmQualityVariants(renderer, new Scene(), new Camera(), light);
    assert.equal(active, null);
    assert.equal(renderer.shadowMap.enabled, true);
    assert.equal(light.castShadow, true);
    await assert.rejects(warmup, new RegExp(failure));
    assert.equal(active, null);
    assert.equal(renderer.shadowMap.enabled, true);
    assert.equal(light.castShadow, true);
    assert.equal(disposed, true);
    assert.equal(callCount, failure === 'async-direct' ? 2 : 1);
  });
}
