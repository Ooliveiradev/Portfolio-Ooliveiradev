import { emulatorHost } from '../firebase/config';

/** Shared rules for what the portfolio is allowed to link to or display. */

const MEDIA_HOSTS = [/^firebasestorage\.googleapis\.com$/, /^storage\.googleapis\.com$/, /\.firebasestorage\.app$/];
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/;

export const MAX_DOCUMENT_BYTES = 900_000;

export const isHexColor = (value: string): boolean => HEX_COLOR.test(value);
export const isEmail = (value: string): boolean => EMAIL.test(value) && value.length <= 254;

const parse = (value: string): URL | null => {
  try { return new URL(value); } catch { return null; }
};

/** Profile and project links: empty means "no link". Only http(s) is accepted. */
export const isSafeLink = (value: string): boolean => {
  if (!value) return true;
  const url = parse(value);
  return Boolean(url && (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.'));
};

/** Media may come from this site's own files or from the portfolio's storage bucket. */
export const isSafeMediaUrl = (value: string): boolean => {
  if (!value) return false;
  if (value.startsWith('/') || value.startsWith('./')) {
    return !value.startsWith('//') && !value.includes('..') && /^\.?\/[\w\-./%]+$/.test(value);
  }
  const url = parse(value);
  if (!url) return false;
  // Local development only: files uploaded to the Storage emulator.
  if (emulatorHost && url.protocol === 'http:' && url.hostname === emulatorHost && url.port === '9199') return true;
  return url.protocol === 'https:' && MEDIA_HOSTS.some(pattern => pattern.test(url.hostname));
};

export const utf8Size = (value: string): number => new TextEncoder().encode(value).length;

export const trimmed = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(/\r\n/g, '\n').slice(0, max).trim() : '';
