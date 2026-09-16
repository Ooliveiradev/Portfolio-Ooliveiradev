import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GraphicsQuality } from '../../../types';

interface PostProcessingPipelineProps {
  graphicsQuality?: GraphicsQuality;
}

const ChromaticAberrationShader = {
  name: 'ChromaticAberrationShader',
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    varying vec2 vUv;
    void main() {
      vec2 dir = vUv - vec2(0.5);
      vec2 offset = dir * (dot(dir, dir) * uOffset);
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

// EffectComposer calls pass.setSize on insertion and every resize. Supplying a
// smaller constructor resolution alone does not keep bloom buffers smaller.
class ScaledBloomPass extends UnrealBloomPass {
  resolutionScale = 0.5;

  override setSize(width: number, height: number) {
    super.setSize(
      Math.max(64, Math.floor(width * this.resolutionScale)),
      Math.max(64, Math.floor(height * this.resolutionScale)),
    );
  }
}

export const PostProcessingPipeline: React.FC<PostProcessingPipelineProps> = ({
  graphicsQuality = 'mid',
}) => graphicsQuality === 'low' ? null : <ActivePostProcessingPipeline graphicsQuality={graphicsQuality} />;

const ActivePostProcessingPipeline: React.FC<{ graphicsQuality: 'mid' | 'high' }> = ({ graphicsQuality }) => {
  const { gl, scene, camera, size } = useThree();
  const dpr = useThree((state) => state.viewport.dpr);
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<ScaledBloomPass | null>(null);
  const chromaPassRef = useRef<ShaderPass | null>(null);
  const currentChromaOffset = useRef(0);
  const targetChromaOffset = useRef(0);

  useEffect(() => {
    const handleBoost = () => {
      targetChromaOffset.current = graphicsQuality === 'high' ? 0.0032 : 0.002;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') targetChromaOffset.current = 0;
    };
    window.addEventListener('app:boost-vehicle', handleBoost);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('app:boost-vehicle', handleBoost);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [graphicsQuality]);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    // Work in physical pixels so the renderer and composer share exactly the
    // same resolution, including fractional DPRs on 4K/ultrawide displays.
    composer.setPixelRatio(1);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new ScaledBloomPass(new THREE.Vector2(64, 64), 0.22, 0.22, 0.94);
    const chromaPass = new ShaderPass(ChromaticAberrationShader);
    chromaPass.enabled = false;
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(chromaPass);
    composer.addPass(outputPass);
    composerRef.current = composer;
    bloomPassRef.current = bloomPass;
    chromaPassRef.current = chromaPass;

    return () => {
      // EffectComposer only disposes its own targets and copy pass. Each
      // effect owns additional targets/materials that must also be released.
      renderPass.dispose();
      bloomPass.dispose();
      bloomPass.materialHighPassFilter.dispose();
      chromaPass.dispose();
      outputPass.dispose();
      composer.dispose();
      composerRef.current = null;
      bloomPassRef.current = null;
      chromaPassRef.current = null;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    const bloomPass = bloomPassRef.current;
    if (bloomPass) {
      bloomPass.strength = graphicsQuality === 'high' ? 0.22 : 0.15;
      bloomPass.resolutionScale = graphicsQuality === 'high' ? 0.5 : 0.35;
    }
    composerRef.current?.setSize(
      Math.max(1, Math.floor(size.width * dpr)),
      Math.max(1, Math.floor(size.height * dpr)),
    );
  }, [size.width, size.height, dpr, graphicsQuality]);

  useFrame((state, delta) => {
    if (!composerRef.current) {
      state.gl.render(state.scene, state.camera);
      return;
    }

    currentChromaOffset.current = THREE.MathUtils.lerp(
      currentChromaOffset.current,
      targetChromaOffset.current,
      1 - Math.exp(-delta * 7.5),
    );
    // Decay all the way to zero. Stopping at 0.001 left this fullscreen pass
    // enabled permanently after the first boost.
    targetChromaOffset.current *= Math.exp(-delta * 3.2);
    if (targetChromaOffset.current < 0.00001) targetChromaOffset.current = 0;

    const chromaPass = chromaPassRef.current;
    if (chromaPass) {
      chromaPass.enabled = currentChromaOffset.current > 0.0001;
      if (chromaPass.enabled) chromaPass.uniforms.uOffset.value = currentChromaOffset.current;
    }
    composerRef.current.render(delta);
  }, 1);

  return null;
};
