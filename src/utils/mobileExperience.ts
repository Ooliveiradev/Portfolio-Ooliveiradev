import type { GraphicsQuality } from '../types';

// Includes phones held sideways and touch-first tablets, without hiding controls
// merely because the viewport crossed Tailwind's desktop breakpoint.
export const TOUCH_LAYOUT_QUERY = '(max-width: 639px), (pointer: coarse)';

export function usesTouchLayout(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(TOUCH_LAYOUT_QUERY).matches;
}

export function initialGraphicsQuality(saved: string | null, touch = usesTouchLayout()): GraphicsQuality {
  if (saved === 'low' || saved === 'mid' || saved === 'high') return saved;
  return touch ? 'low' : 'high';
}

export function cameraFraming(width: number, height: number) {
  const portrait = width < height && width < 768;
  return { fov: portrait ? 42 : 30, distance: portrait ? 1.12 : 1, raceFov: portrait ? 66 : 58 };
}
