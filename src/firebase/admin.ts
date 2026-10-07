/**
 * Everything that needs the Firebase SDK lives here and is loaded on demand, the first time the
 * owner opens the login. Visitors never download it.
 *
 * Authorization is not decided here: the client only asks, and firestore.rules / storage.rules
 * refuse every write that does not come from a user listed in the `admins` collection.
 */
import type { PortfolioDocument } from '../content/model';
import { normalizeDocument } from '../content/sanitize';
import { MAX_DOCUMENT_BYTES, utf8Size } from '../content/validation';
import { CONTENT_COLLECTION, CONTENT_DOC_ID, MEDIA_FOLDER, emulatorHost, firebaseConfig, isFirebaseConfigured, isStorageEnabled } from './config';
import { storageName } from './mediaRules';

export interface AdminSession { uid: string; email: string }

export type AdminErrorCode =
  | 'not-configured' | 'invalid-credentials' | 'too-many-requests' | 'network' | 'not-admin'
  | 'session-expired' | 'forbidden' | 'conflict' | 'too-large' | 'upload-failed' | 'storage-disabled' | 'unknown';

export class AdminError extends Error {
  constructor(public code: AdminErrorCode, message: string) {
    super(message);
    this.name = 'AdminError';
  }
}

export interface StoredMedia { path: string; url: string; name: string; contentType: string; size: number; createdAt: string }

export interface AdminApi {
  watchSession(callback: (session: AdminSession | null) => void): () => void;
  signIn(email: string, password: string): Promise<AdminSession>;
  signOut(): Promise<void>;
  publish(document: PortfolioDocument, expectedRevision: number | null): Promise<number>;
  loadPublished(): Promise<{ document: PortfolioDocument; revision: number } | null>;
  uploadMedia(file: Blob, originalName: string, contentType: string, onProgress?: (fraction: number) => void): Promise<{ url: string; path: string }>;
  listMedia(): Promise<StoredMedia[]>;
  deleteMedia(path: string): Promise<void>;
}

const messages: Record<AdminErrorCode, string> = {
  'not-configured': 'O Firebase ainda não está configurado neste site. Siga docs/ADMIN.md.',
  'invalid-credentials': 'E-mail ou senha incorretos.',
  'too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  network: 'Sem conexão com o servidor. Verifique a internet e tente novamente.',
  'not-admin': 'Esta conta não tem permissão de administrador.',
  'session-expired': 'Sua sessão expirou. Entre novamente; suas alterações foram preservadas.',
  forbidden: 'O servidor recusou a operação: esta conta não pode alterar o portfólio.',
  conflict: 'Outra versão foi publicada enquanto você editava. Recarregue a versão publicada antes de continuar.',
  'too-large': 'O conteúdo é grande demais para ser publicado.',
  'upload-failed': 'Não foi possível enviar o arquivo.',
  'storage-disabled': 'O envio de arquivos não está ativado neste site. Adicione a mídia por link (veja docs/ADMIN.md).',
  unknown: 'Algo deu errado. Tente novamente.',
};

const fail = (code: AdminErrorCode, detail?: string) => new AdminError(code, detail ?? messages[code]);

/** Maps SDK errors to messages the owner can act on. Exported for tests. */
export function toAdminError(error: unknown): AdminError {
  if (error instanceof AdminError) return error;
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email', 'auth/missing-password'].includes(code)) return fail('invalid-credentials');
  if (code === 'auth/too-many-requests') return fail('too-many-requests');
  if (code === 'auth/user-disabled') return fail('not-admin');
  if (['auth/network-request-failed', 'unavailable', 'storage/retry-limit-exceeded'].includes(code)) return fail('network');
  if (['auth/requires-recent-login', 'auth/user-token-expired', 'unauthenticated'].includes(code)) return fail('session-expired');
  if (['permission-denied', 'storage/unauthorized'].includes(code)) return fail('forbidden');
  if (code === 'storage/unauthenticated') return fail('session-expired');
  if (code === 'storage/canceled') return fail('upload-failed', 'Envio cancelado.');
  return fail('unknown');
}

const ADMIN_CHECK_TIMEOUT_MS = 10_000;
const PUBLISH_TIMEOUT_MS = 30_000;

/** Never leave the owner staring at a spinner: a stuck connection becomes a clear "no connection" error. */
function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => { timer = window.setTimeout(() => reject(fail('network')), ms); });
  return Promise.race([work, timeout]).finally(() => window.clearTimeout(timer));
}

let apiPromise: Promise<AdminApi> | null = null;

export function loadAdminApi(): Promise<AdminApi> {
  if (!isFirebaseConfigured) return Promise.reject(fail('not-configured'));
  apiPromise ??= createApi().catch(error => { apiPromise = null; throw toAdminError(error); });
  return apiPromise;
}

async function createApi(): Promise<AdminApi> {
  const [{ initializeApp }, auth, firestore] = await Promise.all([
    import('firebase/app'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  // Storage is optional (paid plan): its code is only downloaded when a bucket is configured.
  const storage = isStorageEnabled ? await import('firebase/storage') : null;
  const app = initializeApp(firebaseConfig);
  const authService = auth.getAuth(app);
  // Some networks, proxies and browsers break Firestore's streaming channel; fall back to long polling instead of hanging.
  const db = firestore.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  const bucket = storage?.getStorage(app) ?? null;
  if (emulatorHost) {
    auth.connectAuthEmulator(authService, `http://${emulatorHost}:9099`, { disableWarnings: true });
    firestore.connectFirestoreEmulator(db, emulatorHost, 8080);
    if (storage && bucket) storage.connectStorageEmulator(bucket, emulatorHost, 9199);
  }
  // The session lasts only as long as the browser tab/window profile keeps it; no passwords are stored by us.
  await auth.setPersistence(authService, auth.browserLocalPersistence);

  // Asks the server whether this account has an /admins/{uid} document. A plain REST call with the user's own
  // ID token (the rules decide) is quicker and sturdier than opening a streaming connection just for this.
  const isAdmin = async (user: import('firebase/auth').User): Promise<boolean> => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), ADMIN_CHECK_TIMEOUT_MS);
    try {
      const origin = emulatorHost ? `http://${emulatorHost}:8080` : 'https://firestore.googleapis.com';
      const response = await fetch(`${origin}/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/(default)/documents/admins/${encodeURIComponent(user.uid)}`, {
        headers: { Authorization: `Bearer ${await user.getIdToken()}` }, signal: controller.signal, cache: 'no-store',
      });
      if (response.ok) return true;
      if (response.status === 404 || response.status === 403 || response.status === 401) return false;
      throw fail('network');
    } catch (error) {
      throw error instanceof AdminError ? error : fail('network');
    } finally {
      window.clearTimeout(timer);
    }
  };
  const toSession = async (user: import('firebase/auth').User | null): Promise<AdminSession | null> =>
    user && user.email && await isAdmin(user) ? { uid: user.uid, email: user.email } : null;
  const contentRef = firestore.doc(db, CONTENT_COLLECTION, CONTENT_DOC_ID);

  return {
    watchSession(callback) {
      return auth.onAuthStateChanged(authService, user => { void toSession(user).then(callback, () => callback(null)); });
    },

    async signIn(email, password) {
      try {
        const credential = await auth.signInWithEmailAndPassword(authService, email.trim(), password);
        const session = await toSession(credential.user);
        if (!session) {
          await auth.signOut(authService);
          throw fail('not-admin');
        }
        return session;
      } catch (error) {
        throw toAdminError(error);
      }
    },

    async signOut() {
      await auth.signOut(authService);
    },

    async loadPublished() {
      try {
        const snapshot = await firestore.getDoc(contentRef);
        const data = snapshot.data();
        if (!snapshot.exists() || typeof data?.json !== 'string') return null;
        return { document: normalizeDocument(JSON.parse(data.json)), revision: Number(data.revision) || 0 };
      } catch (error) {
        throw toAdminError(error);
      }
    },

    async publish(document, expectedRevision) {
      const user = authService.currentUser;
      if (!user) throw fail('session-expired');
      // Only the sanitised form is ever stored, whatever the form held.
      const json = JSON.stringify(normalizeDocument(document));
      if (utf8Size(json) > MAX_DOCUMENT_BYTES) throw fail('too-large');
      try {
        return await withTimeout(firestore.runTransaction(db, async transaction => {
          const snapshot = await transaction.get(contentRef);
          const current = snapshot.exists() ? Number(snapshot.data().revision) || 0 : 0;
          if (current !== (expectedRevision ?? 0)) throw fail('conflict');
          const next = current + 1;
          transaction.set(contentRef, { json, revision: next, updatedAt: firestore.serverTimestamp(), updatedBy: user.uid });
          return next;
        }), PUBLISH_TIMEOUT_MS);
      } catch (error) {
        throw toAdminError(error);
      }
    },

    async uploadMedia(file, originalName, contentType, onProgress) {
      if (!storage || !bucket) throw fail('storage-disabled');
      if (!authService.currentUser) throw fail('session-expired');
      const path = `${MEDIA_FOLDER}/${storageName(originalName, contentType)}`;
      const reference = storage.ref(bucket, path);
      const task = storage.uploadBytesResumable(reference, file, {
        contentType,
        cacheControl: 'public,max-age=31536000,immutable',
      });
      try {
        await new Promise<void>((resolve, reject) => {
          task.on('state_changed',
            snapshot => onProgress?.(snapshot.totalBytes ? snapshot.bytesTransferred / snapshot.totalBytes : 0),
            reject, () => resolve());
        });
        return { url: await storage.getDownloadURL(reference), path };
      } catch (error) {
        throw toAdminError(error);
      }
    },

    async listMedia() {
      if (!storage || !bucket) return [];
      try {
        const { items } = await storage.list(storage.ref(bucket, MEDIA_FOLDER), { maxResults: 200 });
        const files = await Promise.all(items.map(async item => {
          const [meta, url] = await Promise.all([storage.getMetadata(item), storage.getDownloadURL(item)]);
          return { path: item.fullPath, url, name: item.name, contentType: meta.contentType ?? '', size: meta.size, createdAt: meta.timeCreated };
        }));
        return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } catch (error) {
        throw toAdminError(error);
      }
    },

    async deleteMedia(path) {
      if (!storage || !bucket) throw fail('storage-disabled');
      if (!path.startsWith(`${MEDIA_FOLDER}/`)) throw fail('forbidden');
      try {
        await storage.deleteObject(storage.ref(bucket, path));
      } catch (error) {
        throw toAdminError(error);
      }
    },
  };
}
