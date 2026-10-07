import assert from 'node:assert/strict';
import test from 'node:test';
import { AdminError, toAdminError } from '../src/firebase/admin.ts';
import { checkMediaFile, formatBytes, matchesSignature, storageName } from '../src/firebase/mediaRules.ts';

const MB = 1024 * 1024;
const file = (bytes: number[] | Uint8Array, name: string, type: string, size?: number) => {
  const content = new Uint8Array(size ?? bytes.length);
  content.set(bytes);
  return new File([content], name, { type });
};
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MP4 = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31];

test('valid images, videos and PDFs are accepted for the categories requested', async () => {
  assert.equal((await checkMediaFile(file(JPEG, 'foto.JPG', 'image/jpeg'), ['image'])).ok, true);
  assert.equal((await checkMediaFile(file(PNG, 'a.png', 'image/png'), ['image'])).ok, true);
  assert.equal((await checkMediaFile(file(MP4, 'v.mp4', 'video/mp4'), ['video'])).ok, true);
  assert.equal((await checkMediaFile(file(PDF, 'cv.pdf', 'application/pdf'), ['document'])).ok, true);
});

test('SVG, HTML, scripts and mismatched categories never pass', async () => {
  const svg = file([60, 115, 118, 103], 'x.svg', 'image/svg+xml');
  assert.equal((await checkMediaFile(svg, ['image', 'video', 'document'])).ok, false);
  assert.equal((await checkMediaFile(file([60, 104], 'x.html', 'text/html'), ['image'])).ok, false);
  assert.equal((await checkMediaFile(file([1], 'x.js', 'text/javascript'), ['image'])).ok, false);
  assert.equal((await checkMediaFile(file(PDF, 'cv.pdf', 'application/pdf'), ['image'])).ok, false);
  assert.equal((await checkMediaFile(file(MP4, 'v.mp4', 'video/mp4'), ['image'])).ok, false);
});

test('a file that lies about its type or extension is refused', async () => {
  const wrongBytes = await checkMediaFile(file([60, 104, 116, 109, 108], 'trojan.png', 'image/png'), ['image']);
  assert.equal(wrongBytes.ok, false);
  assert.match(wrongBytes.message ?? '', /válido/);
  const wrongExtension = await checkMediaFile(file(PNG, 'photo.exe', 'image/png'), ['image']);
  assert.equal(wrongExtension.ok, false);
  assert.match(wrongExtension.message ?? '', /extensão/);
});

test('size limits are enforced per type with a message that says the sizes', async () => {
  assert.equal((await checkMediaFile(file(JPEG, 'a.jpg', 'image/jpeg', 5 * MB), ['image'])).ok, true);
  const big = await checkMediaFile(file(JPEG, 'a.jpg', 'image/jpeg', 5 * MB + 1), ['image']);
  assert.equal(big.ok, false);
  assert.match(big.message ?? '', /5 MB/);
  assert.equal((await checkMediaFile(file(MP4, 'a.mp4', 'video/mp4', 50 * MB + 1), ['video'])).ok, false);
  assert.equal((await checkMediaFile(file(PDF, 'a.pdf', 'application/pdf', 10 * MB + 1), ['document'])).ok, false);
  assert.equal((await checkMediaFile(new File([], 'a.jpg', { type: 'image/jpeg' }), ['image'])).ok, false);
});

test('signatures are checked on real bytes', () => {
  assert.equal(matchesSignature('image/jpeg', new Uint8Array(JPEG)), true);
  assert.equal(matchesSignature('image/jpeg', new Uint8Array(PNG)), false);
  assert.equal(matchesSignature('image/webp', new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])), true);
  assert.equal(matchesSignature('image/gif', new Uint8Array([0x47, 0x49, 0x46, 0x38])), true);
  assert.equal(matchesSignature('video/webm', new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])), true);
  assert.equal(matchesSignature('text/plain', new Uint8Array([1])), false);
});

test('stored file names are unique, lowercase and safe', () => {
  const name = storageName('Minha Foto Ção (1).JPEG', 'image/jpeg', 1_700_000_000_000, 0.123456);
  assert.match(name, /^[a-z0-9][a-z0-9._-]{0,120}$/);
  assert.ok(name.endsWith('minha-foto-cao-1.jpg'));
  assert.notEqual(storageName('a.png', 'image/png', 1, 0.1), storageName('a.png', 'image/png', 2, 0.1));
  assert.match(storageName('../../etc/passwd', 'image/png'), /^[a-z0-9][a-z0-9._-]*\.png$/);
  assert.match(storageName('日本語.png', 'image/png'), /arquivo\.png$/);
  assert.equal(formatBytes(5 * MB), '5 MB');
  assert.equal(formatBytes(2048), '2 KB');
});

test('Firebase errors become messages the owner can act on', () => {
  const code = (value: string) => toAdminError({ code: value });
  assert.equal(code('auth/invalid-credential').code, 'invalid-credentials');
  assert.equal(code('auth/wrong-password').message, 'E-mail ou senha incorretos.');
  assert.equal(code('auth/too-many-requests').code, 'too-many-requests');
  assert.equal(code('auth/network-request-failed').code, 'network');
  assert.equal(code('permission-denied').code, 'forbidden');
  assert.equal(code('storage/unauthorized').code, 'forbidden');
  assert.equal(code('unauthenticated').code, 'session-expired');
  assert.equal(code('something-new').code, 'unknown');
  const own = new AdminError('conflict', 'x');
  assert.equal(toAdminError(own), own);
  assert.equal(toAdminError(new Error('boom')).code, 'unknown');
});
