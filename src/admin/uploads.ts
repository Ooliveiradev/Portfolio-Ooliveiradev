import { AdminError, type AdminApi } from '../firebase/admin';
import { checkMediaFile, type MediaCategory } from '../firebase/mediaRules';

export interface UploadResult {
  kind: MediaCategory;
  url: string;
  /** Preview image for videos; empty for everything else (images are their own preview). */
  thumbnail: string;
  name: string;
}

/** Grabs a frame near the start of a video to use as its preview. Resolves null when the browser cannot decode it. */
export function captureVideoPoster(file: Blob): Promise<Blob | null> {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let settled = false;
    const finish = (blob: Blob | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(blob);
    };
    const timer = window.setTimeout(() => finish(null), 10_000);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, Math.max(0, (video.duration || 0) / 4));
    };
    video.onseeked = () => {
      const scale = Math.min(1, 960 / (video.videoWidth || 960));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((video.videoWidth || 960) * scale));
      canvas.height = Math.max(1, Math.round((video.videoHeight || 540) * scale));
      const context = canvas.getContext('2d');
      if (!context) return finish(null);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => finish(blob), 'image/jpeg', 0.82);
    };
    video.src = url;
  });
}

/** Validates, uploads and (for videos) creates a preview. Throws AdminError with a message ready to show. */
export async function uploadFile(
  api: AdminApi,
  file: File,
  allowed: MediaCategory[],
  onProgress?: (fraction: number) => void,
): Promise<UploadResult> {
  const check = await checkMediaFile(file, allowed);
  if (!check.ok || !check.mime || !check.category) throw new AdminError('upload-failed', check.message ?? 'Arquivo não aceito.');
  const { url } = await api.uploadMedia(file, file.name, check.mime, onProgress);
  let thumbnail = '';
  if (check.category === 'video') {
    try {
      const poster = await captureVideoPoster(file);
      if (poster) thumbnail = (await api.uploadMedia(poster, `${file.name}-capa.jpg`, 'image/jpeg')).url;
    } catch {
      // A video without a preview still works; only the grid tile is plainer.
    }
  }
  return { kind: check.category, url, thumbnail, name: file.name };
}
