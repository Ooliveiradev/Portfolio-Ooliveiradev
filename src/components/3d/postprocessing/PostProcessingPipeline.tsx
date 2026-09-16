import React, { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GraphicsQuality } from '../../../types';
import { getClamped1080pDpr } from '../../../utils/resolutionLimiter';

interface PostProcessingPipelineProps {
  graphicsQuality?: GraphicsQuality;
}

// Shader de Aberração Cromática Radial e Suave (ativada dinamicamente no Boost da nave)
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
      // Vetor direcional do centro para a borda
      vec2 dir = vUv - vec2(0.5);
      float dist = length(dir);
      
      // Aberração cromática que aumenta quadraticamente em direção às bordas
      vec2 offset = dir * (dist * dist * uOffset);

      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

/**
 * PostProcessingPipeline
 * Inspiração: Folio-2025 (Bruno Simon "Rendering 998") e acabamento AAA.
 * 
 * - Selective Unreal Bloom: Brilho estelar etéreo no Sol, cristais, portais e turbinas.
 * - Dynamic Chromatic Aberration: Distorção de lente de alta velocidade no boost.
 * - Suporte ACESFilmicToneMapping e OutputPass para fidelidade de cores máxima.
 */
export const PostProcessingPipeline: React.FC<PostProcessingPipelineProps> = ({
  graphicsQuality = 'mid',
}) => {
  // Na qualidade 'low', desativa completamente o pós-processamento e não registra useFrame com prioridade,
  // permitindo que o renderizador nativo do Three.js / R3F execute com brilho total e zero overhead.
  if (graphicsQuality === 'low') {
    return null;
  }

  return <ActivePostProcessingPipeline graphicsQuality={graphicsQuality} />;
};

const ActivePostProcessingPipeline: React.FC<{ graphicsQuality: 'mid' | 'high' }> = ({
  graphicsQuality,
}) => {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const chromaPassRef = useRef<ShaderPass | null>(null);

  // Valor atual interpolado de aberração cromática
  const currentChromaOffset = useRef<number>(0);
  const targetChromaOffset = useRef<number>(0);

  // Escuta os eventos globais de boost para disparar o impacto visual da lente (sutil e elegante)
  useEffect(() => {
    const handleBoostStart = () => {
      targetChromaOffset.current = graphicsQuality === 'high' ? 0.0032 : 0.002;
    };

    const handleBoostEnd = () => {
      targetChromaOffset.current = 0.0;
    };

    window.addEventListener('app:boost-vehicle', handleBoostStart);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        targetChromaOffset.current = 0.0;
      }
    };
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('app:boost-vehicle', handleBoostStart);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [graphicsQuality]);

  // Inicializa o EffectComposer travado a no máximo 1080p (Full HD)
  useEffect(() => {
    const dpr = getClamped1080pDpr(graphicsQuality);
    const rtWidth = Math.min(1920, Math.round(size.width * dpr));
    const rtHeight = Math.min(1080, Math.round(size.height * dpr));

    const renderTarget = new THREE.WebGLRenderTarget(
      rtWidth,
      rtHeight,
      {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        samples: 0, // Desativa MSAA no render target HDR para eliminar gargalo de fill-rate
      }
    );

    const composer = new EffectComposer(gl, renderTarget);
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);

    // 1. Pass de Renderização da Cena Principal
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 2. Pass de Unreal Bloom Altamente Seletivo e Suave com buffer otimizado
    const bloomStrength = graphicsQuality === 'high' ? 0.22 : 0.15;
    const bloomRadius = 0.22;
    const bloomThreshold = 0.94; // Threshold alto: apenas elementos ultra-incandescentes emitem brilho

    const bloomResX = Math.max(256, Math.floor(size.width / 2));
    const bloomResY = Math.max(144, Math.floor(size.height / 2));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(bloomResX, bloomResY),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    );
    composer.addPass(bloomPass);
    bloomPassRef.current = bloomPass;

    // 3. Pass de Aberração Cromática Reativa
    const chromaPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(chromaPass);
    chromaPassRef.current = chromaPass;

    // 4. Pass de Saída com Mapeamento de Tons e Correção Gama
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerRef.current = composer;

    return () => {
      composer.dispose();
      renderTarget.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera, size, graphicsQuality]);

  // Redimensionamento responsivo travado em 1080p
  useEffect(() => {
    if (composerRef.current) {
      const dpr = getClamped1080pDpr(graphicsQuality);
      composerRef.current.setPixelRatio(dpr);
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size, graphicsQuality]);

  // Loop de Renderização do Pós-Processamento com prioridade 1 (substitui o render padrão do R3F)
  useFrame((state, delta) => {
    if (!composerRef.current) {
      // Failsafe: se o composer ainda não estiver pronto, renderiza normalmente via WebGL
      state.gl.render(state.scene, state.camera);
      return;
    }

    // Interpolação suave do efeito de aberração cromática
    currentChromaOffset.current = THREE.MathUtils.lerp(
      currentChromaOffset.current,
      targetChromaOffset.current,
      delta * 7.5
    );

    // Decaimento natural após pico de boost
    if (targetChromaOffset.current > 0.001) {
      targetChromaOffset.current = THREE.MathUtils.lerp(
        targetChromaOffset.current,
        0.0,
        delta * 3.2
      );
    }

    if (chromaPassRef.current) {
      const isChromaActive = currentChromaOffset.current > 0.0001;
      chromaPassRef.current.enabled = isChromaActive;
      if (isChromaActive) {
        chromaPassRef.current.uniforms['uOffset'].value = currentChromaOffset.current;
      }
    }

    // Executa a renderização do composer
    composerRef.current.render();
  }, 1);

  return null;
};
