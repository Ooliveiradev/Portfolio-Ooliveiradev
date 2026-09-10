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
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
    gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * CosmicDust (Poeira Estelar Eérea e Leve - 100% GPU Accelerated)
 *
 * Configurada com baixa densidade e alta elegância visual para transmitir sensação
 * de voo no vácuo estelar sem poluir a cena ou prejudicar a leitura do cenário.
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

  // Densidade reduzida e equilibrada (bem levezinha)
  const count = useMemo(() => {
    if (graphicsQuality === 'low') return 110;
    if (graphicsQuality === 'high') return 380;
    return 220;
  }, [graphicsQuality]);

  // Inicializa atributos estáticos apenas uma vez
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const driftDirs = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);

    const boxSize = 190.0;
    const boxHeight = 42.0;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      // Posição inicial no espaço cósmico com distribuição ampla
      positions[idx] = (Math.random() - 0.5) * boxSize;
      positions[idx + 1] = (Math.random() - 0.5) * boxHeight + 3.0;
      positions[idx + 2] = (Math.random() - 0.5) * boxSize;

      // Deriva suave no vácuo
      driftDirs[idx] = (Math.random() - 0.5) * 0.22;
      driftDirs[idx + 1] = (Math.random() - 0.5) * 0.12;
      driftDirs[idx + 2] = (Math.random() - 0.5) * 0.22;

      // Fase de pulsação e escala
      phases[i] = Math.random() * Math.PI * 2;
      scales[i] = 0.6 + Math.random() * 0.7;

      // Paleta cósmica suave: Cyan Pastel (65%), Branco Estelar (25%), Âmbar Suave (10%)
      const rand = Math.random();
      let r = 0.38, g = 0.78, b = 0.98;
      if (rand > 0.9) {
        r = 0.98; g = 0.86; b = 0.38;
      } else if (rand > 0.65) {
        r = 0.96; g = 0.98; b = 1.0;
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

          // Deriva sutil na GPU com o tempo
          vec3 p = position + aDrift * uTime;

          // Toroidal wrapping relativo ao centro da nave
          vec3 rel = p - uCenter;
          rel.x = mod(rel.x + uBoxSize * 0.5, uBoxSize) - uBoxSize * 0.5;
          rel.y = mod(rel.y + uBoxHeight * 0.5, uBoxHeight) - uBoxHeight * 0.5;
          rel.z = mod(rel.z + uBoxSize * 0.5, uBoxSize) - uBoxSize * 0.5;

          vec3 finalPos = uCenter + rel;
          vec4 mvPosition = viewMatrix * vec4(finalPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Pulso estelar cintilante e sutil
          float twinkle = sin(uTime * 1.4 + aPhase) * 0.3 + 0.7;
          vAlpha = twinkle * 0.44;

          // Tamanho com atenuação de perspectiva e clamp para máxima delicadeza
          float basePointSize = 34.0 * aScale;
          gl_PointSize = clamp(basePointSize * (1.0 / max(-mvPosition.z, 1.0)), 2.0, 9.0);
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

  // Loop de alta eficiência: atualiza apenas uTime e uCenter na GPU
  useFrame((state) => {
    if (!material) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    const isLanding = gameMode === 'landing' || gameMode === 'exiting';
    if (isLanding) {
      material.uniforms.uCenter.value.set(0, 4, 0);
    } else if (sharedVehiclePos && sharedVehiclePos.current) {
      material.uniforms.uCenter.value.copy(sharedVehiclePos.current);
    }
  });

  return <primitive object={new THREE.Points(geometry, material)} ref={pointsRef} />;
};
