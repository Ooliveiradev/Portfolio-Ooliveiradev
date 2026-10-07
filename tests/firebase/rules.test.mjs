// Runs against the Firebase emulators: npm run test:rules
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { deleteObject, getBytes, listAll, ref, uploadBytes } from 'firebase/storage';

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-portfolio',
    firestore: { rules: read('firestore.rules'), host: '127.0.0.1', port: 8080 },
    storage: { rules: read('storage.rules'), host: '127.0.0.1', port: 9199 },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'admins/admin1'), { createdBy: 'console' });
  });
});

const content = (uid, revision, extra = {}) => ({ json: '{"schemaVersion":1}', revision, updatedAt: serverTimestamp(), updatedBy: uid, ...extra });
const admin = () => env.authenticatedContext('admin1');
const stranger = () => env.authenticatedContext('stranger');
const visitor = () => env.unauthenticatedContext();
const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('firestore rules', () => {
  test('anyone can read the published portfolio but cannot list the collection', async () => {
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'portfolio/main'), content('admin1', 1, { updatedAt: new Date() })));
    await assertSucceeds(getDoc(doc(visitor().firestore(), 'portfolio/main')));
    await assertFails(getDocs(collection(visitor().firestore(), 'portfolio')));
  });

  test('visitors and non-admin accounts cannot write', async () => {
    await assertFails(setDoc(doc(visitor().firestore(), 'portfolio/main'), content('x', 1)));
    await assertFails(setDoc(doc(stranger().firestore(), 'portfolio/main'), content('stranger', 1)));
  });

  test('admin creates revision 1, then advances one revision at a time', async () => {
    const db = admin().firestore();
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 2)));
    await assertSucceeds(setDoc(doc(db, 'portfolio/main'), content('admin1', 1)));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 1)));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 3)));
    await assertSucceeds(setDoc(doc(db, 'portfolio/main'), content('admin1', 2)));
  });

  test('admin writes must be well formed', async () => {
    const db = admin().firestore();
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 1, { extra: 'field' })));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('someone-else', 1)));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 1, { json: 'x'.repeat(950001) })));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 1, { json: 42 })));
    await assertFails(setDoc(doc(db, 'portfolio/main'), content('admin1', 1, { updatedAt: new Date('2020-01-01') })));
  });

  test('nobody can delete the portfolio, not even the admin', async () => {
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), 'portfolio/main'), content('admin1', 1, { updatedAt: new Date() })));
    await assertFails(deleteDoc(doc(admin().firestore(), 'portfolio/main')));
  });

  test('admins collection: a user can only check their own entry and nobody can write', async () => {
    await assertSucceeds(getDoc(doc(admin().firestore(), 'admins/admin1')));
    await assertSucceeds(getDoc(doc(stranger().firestore(), 'admins/stranger')));
    await assertFails(getDoc(doc(stranger().firestore(), 'admins/admin1')));
    await assertFails(getDoc(doc(visitor().firestore(), 'admins/admin1')));
    await assertFails(setDoc(doc(stranger().firestore(), 'admins/stranger'), { a: 1 }));
    await assertFails(setDoc(doc(admin().firestore(), 'admins/other'), { a: 1 }));
    await assertFails(getDocs(collection(admin().firestore(), 'admins')));
  });

  test('everything else is closed', async () => {
    await assertFails(getDoc(doc(admin().firestore(), 'secrets/key')));
    await assertFails(setDoc(doc(admin().firestore(), 'secrets/key'), { a: 1 }));
  });
});

describe('storage rules', () => {
  const upload = (context, name, bytes = jpeg(), contentType = 'image/jpeg') =>
    uploadBytes(ref(context.storage(), `portfolio-media/${name}`), bytes, { contentType });
  const seed = (name = 'seed.jpg') => env.withSecurityRulesDisabled(ctx =>
    uploadBytes(ref(ctx.storage(), `portfolio-media/${name}`), jpeg(), { contentType: 'image/jpeg' }));

  test('files are public to read, but only the admin can list them', async () => {
    await seed();
    await assertSucceeds(getBytes(ref(visitor().storage(), 'portfolio-media/seed.jpg')));
    await assertFails(listAll(ref(visitor().storage(), 'portfolio-media')));
    await assertFails(listAll(ref(stranger().storage(), 'portfolio-media')));
    await assertSucceeds(listAll(ref(admin().storage(), 'portfolio-media')));
  });

  test('only the admin can upload, and only allowed formats', async () => {
    await assertFails(upload(visitor(), 'a.jpg'));
    await assertFails(upload(stranger(), 'a.jpg'));
    await assertSucceeds(upload(admin(), 'a.jpg'));
    await assertSucceeds(upload(admin(), 'b.mp4', new Uint8Array([0, 0, 0, 1]), 'video/mp4'));
    await assertSucceeds(upload(admin(), 'c.pdf', new Uint8Array([0x25, 0x50]), 'application/pdf'));
    await assertFails(upload(admin(), 'd.svg', new Uint8Array([60, 115]), 'image/svg+xml'));
    await assertFails(upload(admin(), 'e.html', new Uint8Array([60, 104]), 'text/html'));
    await assertFails(upload(admin(), 'f.js', new Uint8Array([1]), 'application/javascript'));
  });

  test('size limits per type are enforced', async () => {
    await assertFails(upload(admin(), 'big.jpg', new Uint8Array(5 * 1024 * 1024 + 1)));
    await assertSucceeds(upload(admin(), 'ok.jpg', new Uint8Array(5 * 1024 * 1024)));
    await assertFails(upload(admin(), 'big.pdf', new Uint8Array(10 * 1024 * 1024 + 1), 'application/pdf'));
    await assertFails(upload(admin(), 'big.mp4', new Uint8Array(50 * 1024 * 1024 + 1), 'video/mp4'));
  });

  test('files are immutable and names are constrained', async () => {
    await seed('exists.jpg');
    await assertFails(upload(admin(), 'exists.jpg'));
    await assertFails(upload(admin(), 'UPPER.jpg'));
    await assertFails(upload(admin(), '.hidden.jpg'));
    await assertFails(uploadBytes(ref(admin().storage(), 'elsewhere/a.jpg'), jpeg(), { contentType: 'image/jpeg' }));
  });

  test('only the admin can delete', async () => {
    await seed('x.jpg');
    await assertFails(deleteObject(ref(visitor().storage(), 'portfolio-media/x.jpg')));
    await assertFails(deleteObject(ref(stranger().storage(), 'portfolio-media/x.jpg')));
    await assertSucceeds(deleteObject(ref(admin().storage(), 'portfolio-media/x.jpg')));
  });
});
