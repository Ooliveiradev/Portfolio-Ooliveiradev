import { HalfFloatType, WebGLRenderTarget } from 'three';
import type { Camera, Light, Scene, WebGLRenderer } from 'three';

type CompilationRenderer = Pick<WebGLRenderer,
  'getRenderTarget' | 'getActiveCubeFace' | 'getActiveMipmapLevel' | 'setRenderTarget' | 'compileAsync'>;

/** Compile the same color-space/tone-mapping variant used by the actual render
 * pass. Mid/high render into linear HDR, while low renders directly to screen. */
export function prewarmScene(
  renderer: CompilationRenderer,
  scene: Scene,
  camera: Camera,
  postprocessing: boolean,
): Promise<unknown> {
  const previousTarget = renderer.getRenderTarget();
  const previousFace = renderer.getActiveCubeFace();
  const previousMip = renderer.getActiveMipmapLevel();
  // Shader defines depend on target type, not its dimensions. Allocate 1 pixel.
  const target = postprocessing ? new WebGLRenderTarget(1, 1, { type: HalfFloatType }) : null;
  let compilation: Promise<unknown>;
  try {
    renderer.setRenderTarget(target);
    compilation = renderer.compileAsync(scene, camera);
  } catch (error) {
    target?.dispose();
    return Promise.reject(error);
  } finally {
    // compileAsync gathers programs synchronously, then polls their readiness.
    // Never leave the renderer bound to our temporary buffer between frames.
    renderer.setRenderTarget(previousTarget, previousFace, previousMip);
  }
  return compilation.finally(() => target?.dispose());
}

type QualityCompilationRenderer = CompilationRenderer & {
  shadowMap: Pick<WebGLRenderer['shadowMap'], 'enabled'>;
};

/** Prepare both quality modes before allowing input. The caller must suspend
 * scene rendering until this resolves: Three's compileAsync polls each material's
 * current program, which another render or compilation could replace. */
export async function prewarmQualityVariants(
  renderer: QualityCompilationRenderer,
  scene: Scene,
  camera: Camera,
  keyLight: Pick<Light, 'castShadow'> | null,
): Promise<void> {
  const compileVariant = (postprocessing: boolean): Promise<unknown> => {
    const shadowsEnabled = renderer.shadowMap.enabled;
    const castsShadow = keyLight?.castShadow;
    try {
      renderer.shadowMap.enabled = postprocessing;
      if (keyLight) keyLight.castShadow = postprocessing;
      return prewarmScene(renderer, scene, camera, postprocessing);
    } finally {
      // Shader setup is synchronous; temporary flags must not leak into frames,
      // React props, or a rejected asynchronous compilation.
      renderer.shadowMap.enabled = shadowsEnabled;
      if (keyLight) keyLight.castShadow = castsShadow!;
    }
  };

  // Sequential waits preserve the currentProgram being polled by compileAsync.
  await compileVariant(true);
  await compileVariant(false);
}
