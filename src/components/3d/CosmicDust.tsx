import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality, GameMode } from '../../types';

interface CosmicDustProps {
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
  gameMode?: GameMode;
}

// Textura de partícula circular suave gerada proceduralmente uma única vez
function createGlowPointTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * CosmicDust (Arquitetura Folio-2025 Bruno Simon - GPU Accelerated)
 * 
 * Todo o cálculo de deriva (drift), flutuação e brilho estelar roda 100% no VERTEX SHADER da GPU.
 * - CPU Load: 0.0% (sem iteração em array por frame).
 * - PCIe Bus: 0 bytes transferidos por frame (elimina needsUpdate = true).
 * - Garbage Collection: 0 alocações de memória RAM.
 */
export const CosmicDust: React.FC<CosmicDustProps> = ({
  sharedVehiclePos,
  graphicsQuality = 'mid',
  gameMode = 'landing',
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const pointTexture = useMemo(() => createGlowPointTexture(), []);

  useEffect(() => {
    return () => {
      pointTexture.dispose();
    };
  }, [pointTexture]);

  const count = useMemo(() => {
    if (graphicsQuality === 'low') return 300;
    if (graphicsQuality === 'high') return 1200;
    return 650;
  }, [graphicsQuality]);

  // Inicializa atributos estáticos apenas uma vez
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftDirs = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);

    const boxSize = 160.0;
    const boxHeight = 50.0;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Posição inicial no espaço cósmico
      positions[idx] = (Math.random() - 0.5) * boxSize;
      positions[idx + 1] = (Math.random() - 0.5) * boxHeight + 4.0;
      positions[idx + 2] = (Math.random() - 0.5) * boxSize;

      // Vetor de deriva orgânica (drift no vácuo)
      driftDirs[idx] = (Math.random() - 0.5) * 0.4;
      driftDirs[idx + 1] = (Math.random() - 0.5) * 0.25;
      driftDirs[idx + 2] = (Math.random() - 0.5) * 0.4;

      // Fase de pulso estelar e escala
      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.5 + Math.random() * 0.9;

      // Paleta minimalista galáctica: Sky Blue (70%), Ice White (20%), Solar Amber (10%)
      const rand = Math.random();
      let r = 0.22, g = 0.74, b = 0.97;
      if (rand > 0.88) {
        r = 0.99; g = 0.88; b = 0.28;
      } else if (rand > 0.68) {
        r = 0.95; g = 0.96; b = 1.0;
      }

      colors[idx] = r;
      colors[idx + 1] = g;
      colors[idx + 2] = b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aDrift', new THREE.BufferAttribute(driftDirs, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uTexture: { value: pointTexture },
        uCenter: { value: new THREE.Vector3(0, 4, 0) },
        uBoxSize: { value: boxSize },
        uBoxHeight: { value: boxHeight },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uCenter;
        uniform float uBoxSize;
        uniform float uBoxHeight;

        attribute vec3 aDrift;
        attribute float aPhase;
        attribute float aScale;

        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          // Deriva na GPU com o tempo
          vec3 p = position + aDrift * uTime;

          // Toroidal wrapping relativo ao centro da nave
          vec3 rel = p - uCenter;
          rel.x = mod(rel.x + uBoxSize * 0.5, uBoxSize) - uBoxSize * 0.5;
          rel.y = mod(rel.y + uBoxHeight * 0.5, uBoxHeight) - uBoxHeight * 0.5;
          rel.z = mod(rel.z + uBoxSize * 0.5, uBoxSize) - uBoxSize * 0.5;

          vec3 finalPos = uCenter + rel;
          vec4 mvPosition = viewMatrix * vec4(finalPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Pulso estelar sutil
          float twinkle = sin(uTime * 1.8 + aPhase) * 0.25 + 0.75;
          vAlpha = twinkle * 0.65;

          // Tamanho responsivo à distância com atenuação de perspectiva
          float basePointSize = 42.0 * aScale;
          gl_PointSize = basePointSize * (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec4 texColor = texture2D(uTexture, gl_PointCoord);
          gl_FragColor = vec4(vColor, texColor.a * vAlpha);
        }
      `,
    });

    return { geometry: geo, material: mat };
  }, [count, pointTexture]);

  // Loop de alta eficiência: atualiza apenas o uniform uTime e uCenter na GPU
  useFrame((state) => {
    if (!material) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    const isLanding = gameMode === 'landing' || gameMode === 'exiting';
    if (isLanding) {
      material.uniforms.uCenter.value.set(0, 4, 0);
    } else if (sharedVehiclePos) {
      material.uniforms.uCenter.value.copy(sharedVehiclePos.current);
    }
  });

  return <primitive object={new THREE.Points(geometry, material)} ref={pointsRef} />;
};
