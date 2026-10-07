import { DEFAULT_ACCENT } from './model';
import { isHexColor } from './validation';

/**
 * The interface paints its accent with Tailwind's sky-* palette. Tailwind v4 compiles those utilities to
 * CSS variables, so redefining the variables on :root re-themes every accent without touching components.
 */
export const ACCENT_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export const ACCENT_PRESETS = [
  { id: 'sky', label: 'Céu (padrão)', color: DEFAULT_ACCENT },
  { id: 'emerald', label: 'Esmeralda', color: '#34d399' },
  { id: 'violet', label: 'Violeta', color: '#a78bfa' },
  { id: 'amber', label: 'Âmbar', color: '#fbbf24' },
  { id: 'rose', label: 'Rosa', color: '#fb7185' },
  { id: 'teal', label: 'Turquesa', color: '#2dd4bf' },
] as const;

function hexToHsl(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(color * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

/** Builds a 50–950 scale in which the chosen colour is the 400 shade, as with the default sky blue. */
export function buildAccentScale(hex: string): Record<number, string> {
  const safe = isHexColor(hex) ? hex : DEFAULT_ACCENT;
  const [h, s, l] = hexToHsl(safe);
  const base = ACCENT_SHADES.indexOf(400);
  const scale: Record<number, string> = {};
  ACCENT_SHADES.forEach((shade, index) => {
    if (shade === 400) { scale[shade] = safe.toLowerCase(); return; }
    const lighter = index < base;
    const amount = lighter ? (base - index) / base : (index - base) / (ACCENT_SHADES.length - 1 - base);
    const lightness = lighter ? mix(l, 97, amount) : mix(l, 12, amount);
    const saturation = lighter ? s * (1 - 0.25 * amount) : s * (1 - 0.1 * amount);
    scale[shade] = hslToHex(h, Math.min(100, saturation), lightness);
  });
  return scale;
}

export function applyAccent(hex: string, root: HTMLElement = document.documentElement): void {
  if (!isHexColor(hex) || hex.toLowerCase() === DEFAULT_ACCENT) {
    for (const shade of ACCENT_SHADES) root.style.removeProperty(`--color-sky-${shade}`);
    return;
  }
  const scale = buildAccentScale(hex);
  for (const shade of ACCENT_SHADES) root.style.setProperty(`--color-sky-${shade}`, scale[shade]);
}
