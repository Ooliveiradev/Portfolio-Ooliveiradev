import { CONTENT_COLLECTION, CONTENT_DOC_ID, emulatorHost, firebaseConfig, isFirebaseConfigured } from '../firebase/config';
import type { PortfolioDocument } from './model';
import { normalizeDocument } from './sanitize';

export interface PublishedContent {
  revision: number;
  document: PortfolioDocument;
}

const CACHE_KEY = 'portfolio_published_content_v1';

interface FirestoreDocument {
  fields?: { json?: { stringValue?: string }; revision?: { integerValue?: string } };
}

/** Parses the Firestore REST payload. Exported for tests. */
export function parsePublishedPayload(payload: FirestoreDocument): PublishedContent | null {
  const json = payload.fields?.json?.stringValue;
  if (!json) return null;
  try {
    const revision = Number(payload.fields?.revision?.integerValue ?? 0);
    return { revision: Number.isFinite(revision) ? revision : 0, document: normalizeDocument(JSON.parse(json)) };
  } catch {
    return null;
  }
}

/**
 * Visitors read the published portfolio over Firestore's public REST endpoint, so the Firebase SDK is
 * never downloaded for them. Returns null when nothing has been published yet.
 */
export async function fetchPublishedContent(signal?: AbortSignal): Promise<PublishedContent | null> {
  if (!isFirebaseConfigured) return null;
  const origin = emulatorHost ? `http://${emulatorHost}:8080` : 'https://firestore.googleapis.com';
  const url = `${origin}/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/(default)/documents/${CONTENT_COLLECTION}/${CONTENT_DOC_ID}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  const response = await fetch(url, { signal, cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Falha ao carregar o conteúdo publicado (${response.status}).`);
  return parsePublishedPayload(await response.json() as FirestoreDocument);
}

export function readCachedContent(): PublishedContent | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { revision?: number; document?: unknown };
    if (typeof parsed.revision !== 'number' || !parsed.document) return null;
    return { revision: parsed.revision, document: normalizeDocument(parsed.document) };
  } catch {
    return null;
  }
}

export function writeCachedContent(content: PublishedContent): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(content)); } catch { /* storage may be unavailable */ }
}
