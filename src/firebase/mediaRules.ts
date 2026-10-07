/**
 * Upload rules for portfolio media. The same limits are enforced by storage.rules, so a
 * hand-crafted request cannot get around this check.
 */
export type MediaCategory = 'image' | 'video' | 'document';

interface MediaType { category: MediaCategory; extensions: string[]; maxBytes: number; label: string }

const MB = 1024 * 1024;

export const ALLOWED_MEDIA: Record<string, MediaType> = {
  'image/jpeg': { category: 'image', extensions: ['jpg', 'jpeg'], maxBytes: 5 * MB, label: 'JPEG' },
  'image/png': { category: 'image', extensions: ['png'], maxBytes: 5 * MB, label: 'PNG' },
  'image/webp': { category: 'image', extensions: ['webp'], maxBytes: 5 * MB, label: 'WebP' },
  'image/gif': { category: 'image', extensions: ['gif'], maxBytes: 5 * MB, label: 'GIF' },
  'image/avif': { category: 'image', extensions: ['avif'], maxBytes: 5 * MB, label: 'AVIF' },
  'video/mp4': { category: 'video', extensions: ['mp4', 'm4v'], maxBytes: 50 * MB, label: 'MP4' },
  'video/webm': { category: 'video', extensions: ['webm'], maxBytes: 50 * MB, label: 'WebM' },
  'application/pdf': { category: 'document', extensions: ['pdf'], maxBytes: 10 * MB, label: 'PDF' },
};

export const MEDIA_ACCEPT: Record<MediaCategory, string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif,image/avif',
  video: 'video/mp4,video/webm',
  document: 'application/pdf',
};

export const formatBytes = (bytes: number): string =>
  bytes >= MB ? `${(bytes / MB).toFixed(1).replace('.0', '')} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

export const extensionOf = (name: string): string => name.split('.').pop()?.toLowerCase() ?? '';

/** Confirms the first bytes of the file really are what its MIME type claims (SVG and HTML never pass). */
export function matchesSignature(mime: string, head: Uint8Array): boolean {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  switch (mime) {
    case 'image/jpeg': return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    case 'image/png': return head[0] === 0x89 && ascii(1, 4) === 'PNG';
    case 'image/gif': return ascii(0, 4) === 'GIF8';
    case 'image/webp': return ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
    case 'image/avif': return ascii(4, 8) === 'ftyp' && /avif|avis/.test(ascii(8, 12));
    case 'video/mp4': return ascii(4, 8) === 'ftyp';
    case 'video/webm': return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    case 'application/pdf': return ascii(0, 5) === '%PDF-';
    default: return false;
  }
}

export interface MediaCheck { ok: boolean; message?: string; mime?: string; category?: MediaCategory }

/** Validates type, extension, size and real content before anything is uploaded. */
export async function checkMediaFile(file: File, allowed: MediaCategory[]): Promise<MediaCheck> {
  const type = ALLOWED_MEDIA[file.type];
  if (!type || !allowed.includes(type.category)) {
    const accepted = allowed.flatMap(category => Object.values(ALLOWED_MEDIA).filter(item => item.category === category).map(item => item.label));
    return { ok: false, message: `Formato não aceito (${file.type || 'desconhecido'}). Use ${accepted.join(', ')}.` };
  }
  if (!type.extensions.includes(extensionOf(file.name))) {
    return { ok: false, message: `A extensão do arquivo não corresponde ao formato ${type.label}.` };
  }
  if (file.size === 0) return { ok: false, message: 'O arquivo está vazio.' };
  if (file.size > type.maxBytes) {
    return { ok: false, message: `O arquivo tem ${formatBytes(file.size)}; o máximo para ${type.label} é ${formatBytes(type.maxBytes)}.` };
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesSignature(file.type, head)) {
    return { ok: false, message: `O conteúdo do arquivo não é um ${type.label} válido.` };
  }
  return { ok: true, mime: file.type, category: type.category };
}

/** A storage object name that is unique, lowercase and free of anything unusual. */
export function storageName(originalName: string, mime: string, now = Date.now(), random = Math.random()): string {
  const extension = ALLOWED_MEDIA[mime]?.extensions[0] ?? extensionOf(originalName);
  const base = originalName.replace(/\.[^.]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'arquivo';
  return `${now.toString(36)}-${random.toString(36).slice(2, 8)}-${base}.${extension}`;
}
