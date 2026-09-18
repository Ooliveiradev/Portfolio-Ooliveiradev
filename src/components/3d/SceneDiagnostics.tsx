import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PointLight } from 'three';

/** Local, opt-in instrumentation. No network requests or per-frame React state. */
export function SceneDiagnostics() {
  const { gl, scene } = useThree();
  useEffect(() => {
    if (new URLSearchParams(location.search).get('perf') !== '1') return;
    let previousRender = gl.info.render.frame;
    const timer = window.setInterval(() => {
      let pointLights = 0;
      scene.traverseVisible(object => {
        if (object instanceof PointLight) pointLights++;
      });
      const render = gl.info.render.frame;
      gl.domElement.dataset.renderDiagnostics = JSON.stringify({
        pointLights,
        renderPassesSinceSample: render - previousRender,
        cachedPrograms: gl.info.programs?.length ?? 0,
      });
      previousRender = render;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      delete gl.domElement.dataset.renderDiagnostics;
    };
  }, [gl, scene]);
  return null;
}
