import { GraphicsQuality } from '../types';

/**
 * resolutionLimiter.ts
 * Trava a resolução interna do buffer WebGL e pós-processamento para 1080p (Full HD: 1920x1080) no máximo.
 * 
 * Previne que monitores 1440p, 4K, ultrawide ou telas com escala do Windows (125%, 150%, 200%)
 * renderizem além de 1920x1080, garantindo taxa de quadros estável a 60 FPS.
 */

export const MAX_RENDER_WIDTH = 1920;
export const MAX_RENDER_HEIGHT = 1080;

/**
 * Retorna o Device Pixel Ratio (DPR) exato para que a resolução da GPU
 * nunca ultrapasse 1920x1080.
 */
export function getClamped1080pDpr(quality: GraphicsQuality = 'mid'): number {
  if (typeof window === 'undefined') return 1;

  const width = window.innerWidth || MAX_RENDER_WIDTH;
  const height = window.innerHeight || MAX_RENDER_HEIGHT;
  const nativeDpr = window.devicePixelRatio || 1;

  // Fator máximo de escala para não ultrapassar 1920x1080
  const maxDprFor1080p = Math.min(
    MAX_RENDER_WIDTH / width,
    MAX_RENDER_HEIGHT / height
  );

  if (quality === 'low') {
    // Low: máximo 1.0 DPR, limitado a 1080p
    return Math.max(0.5, Math.min(1.0, maxDprFor1080p, nativeDpr));
  }

  if (quality === 'mid') {
    // Mid: máximo 1.25 DPR, limitado a 1080p
    return Math.max(0.6, Math.min(1.25, maxDprFor1080p, nativeDpr));
  }

  // High: aproveita o DPR do monitor até o teto absoluto de 1080p
  return Math.max(0.65, Math.min(nativeDpr, maxDprFor1080p));
}

/**
 * Retorna as dimensões finais em pixels físicos renderizados (sempre <= 1920x1080)
 */
export function getClampedResolution(quality: GraphicsQuality = 'mid'): {
  width: number;
  height: number;
  dpr: number;
} {
  if (typeof window === 'undefined') {
    return { width: MAX_RENDER_WIDTH, height: MAX_RENDER_HEIGHT, dpr: 1 };
  }

  const dpr = getClamped1080pDpr(quality);
  const width = Math.min(MAX_RENDER_WIDTH, Math.round(window.innerWidth * dpr));
  const height = Math.min(MAX_RENDER_HEIGHT, Math.round(window.innerHeight * dpr));

  return { width, height, dpr };
}
