import type { GraphicsQuality } from '../types';
import { usesTouchLayout } from './mobileExperience';

export const MAX_RENDER_WIDTH = 1920;
export const MAX_RENDER_HEIGHT = 1080;

const RENDER_BUDGETS: Record<GraphicsQuality, { width: number; height: number; dpr: number }> = {
  low: { width: 1280, height: 720, dpr: 1 },
  mid: { width: 1600, height: 900, dpr: 1.25 },
  high: { width: MAX_RENDER_WIDTH, height: MAX_RENDER_HEIGHT, dpr: 2 },
};

interface RenderViewport {
  width: number;
  height: number;
  dpr: number;
  touch?: boolean;
}

function getViewport(): RenderViewport {
  return typeof window === 'undefined'
    ? { width: MAX_RENDER_WIDTH, height: MAX_RENDER_HEIGHT, dpr: 1 }
    : { width: window.innerWidth, height: window.innerHeight, dpr: window.devicePixelRatio || 1, touch: usesTouchLayout() };
}

/**
 * One uniform scale preserves aspect ratio and bounds both GPU dimensions.
 * Do not impose a minimum DPR: even 0.5 exceeds 1080p on an 8K display.
 */
export function getClamped1080pDpr(
  quality: GraphicsQuality = 'high',
  viewport: RenderViewport = getViewport(),
): number {
  const budget = RENDER_BUDGETS[quality];
  return Math.min(
    budget.width / Math.max(1, viewport.width),
    budget.height / Math.max(1, viewport.height),
    budget.dpr,
    viewport.touch ? (quality === 'low' ? 1 : 1.25) : Infinity,
    viewport.dpr > 0 ? viewport.dpr : 1,
  );
}

/**
 * Retorna as dimensões finais em pixels físicos renderizados (sempre <= 1920x1080)
 */
export function getClampedResolution(
  quality: GraphicsQuality = 'high',
  viewport: RenderViewport = getViewport(),
): {
  width: number;
  height: number;
  dpr: number;
} {
  const dpr = getClamped1080pDpr(quality, viewport);
  const width = Math.max(1, Math.floor(viewport.width * dpr));
  const height = Math.max(1, Math.floor(viewport.height * dpr));

  return { width, height, dpr };
}
