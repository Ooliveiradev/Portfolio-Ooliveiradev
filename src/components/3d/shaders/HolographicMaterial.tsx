import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HolographicMaterialProps {
  baseColor?: string;
  fresnelColor?: string;
  fresnelPower?: number;
  scanlineDensity?: number;
  scanlineSpeed?: number;
  iridescenceSpeed?: number;
  opacity?: number;
  additive?: boolean;
}

/**
 * HolographicMaterial
 * Inspiração: Folio-2025 e estética sci-fi cósmica.
 * 
 * Shader GLSL customizado para cristais e geodos celestes:
 * - Fresnel Iridescente: a cor muda suavemente com o ângulo de visão da câmera (estilo filme fino).
 * - Scanlines Holográficas sutis.
 * - Brilho estelar integrado que interage perfeitamente com o Bloom Pass.
 */
export const HolographicMaterial: React.FC<HolographicMaterialProps> = ({
  baseColor = '#38bdf8',
  fresnelColor = '#c084fc',
  fresnelPower = 2.4,
  scanlineDensity = 32.0,
  scanlineSpeed = 1.8,
  iridescenceSpeed = 0.8,
  opacity = 0.92,
  additive = false,
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: !additive,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uBaseColor: { value: new THREE.Color(baseColor) },
        uFresnelColor: { value: new THREE.Color(fresnelColor) },
        uFresnelPower: { value: fresnelPower },
        uScanlineDensity: { value: scanlineDensity },
        uScanlineSpeed: { value: scanlineSpeed },
        uIridescenceSpeed: { value: iridescenceSpeed },
        uOpacity: { value: opacity },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vViewDir = normalize(- (modelViewMatrix * vec4(position, 1.0)).xyz);

          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uBaseColor;
        uniform vec3 uFresnelColor;
        uniform float uFresnelPower;
        uniform float uScanlineDensity;
        uniform float uScanlineSpeed;
        uniform float uIridescenceSpeed;
        uniform float uOpacity;

        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;
        varying vec3 vWorldPos;

        // Paleta espectral iridescente procedural (Inigo Quilez)
        vec3 spectralPalette(float t) {
          vec3 a = vec3(0.5, 0.5, 0.5);
          vec3 b = vec3(0.5, 0.5, 0.5);
          vec3 c = vec3(1.0, 1.0, 1.0);
          vec3 d = vec3(0.0, 0.33, 0.67);
          return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
          // 1. Efeito Fresnel baseado no ângulo de visão da câmera
          float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
          fresnel = pow(fresnel, uFresnelPower);

          // 2. Deslocamento espectral iridescente dinâmico
          float iridCoord = fresnel * 1.5 + sin(vWorldPos.y * 2.0 + uTime * uIridescenceSpeed) * 0.25;
          vec3 iridColor = spectralPalette(iridCoord);

          // 3. Scanlines holográficas discretas
          float scanline = sin((vWorldPos.y * uScanlineDensity) + (uTime * uScanlineSpeed));
          scanline = smoothstep(-0.2, 0.2, scanline) * 0.12;

          // 4. Combinação harmoniosa de cores
          vec3 finalColor = mix(uBaseColor, iridColor, 0.45);
          finalColor = mix(finalColor, uFresnelColor, fresnel * 0.85);
          finalColor += vec3(scanline);

          // Realce de arestas para gemas e cristais facetados
          finalColor += vec3(fresnel * 0.3);

          gl_FragColor = vec4(finalColor, uOpacity * (0.8 + fresnel * 0.2));
        }
      `,
    });
  }, [baseColor, fresnelColor, fresnelPower, scanlineDensity, scanlineSpeed, iridescenceSpeed, opacity, additive]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return <primitive object={material} ref={matRef} attach="material" />;
};
