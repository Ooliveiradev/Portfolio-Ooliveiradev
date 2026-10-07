/**
 * Firebase web configuration. These values identify the project and are public by design:
 * what protects the data is firestore.rules / storage.rules, not secrecy of this file.
 * Nothing here grants write access, and no password or admin credential belongs in the client.
 */
const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && firebaseConfig.storageBucket,
);

/** Local development against the Firebase emulators (npm run emulators). Never enabled in production builds. */
export const emulatorHost: string | null = env.DEV && env.VITE_FIREBASE_EMULATORS === 'true' ? '127.0.0.1' : null;

/** The single document that holds the published portfolio. */
export const CONTENT_COLLECTION = 'portfolio';
export const CONTENT_DOC_ID = 'main';
export const MEDIA_FOLDER = 'portfolio-media';
