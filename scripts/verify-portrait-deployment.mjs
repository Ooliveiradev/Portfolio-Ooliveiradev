import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';

const assetsDirectory = new URL('../dist/assets/', import.meta.url);
const assets = await readdir(assetsDirectory);
const portraitImage = assets.find((name) => /^danilo-ribeiro-[\w-]+\.jpg$/.test(name));
const portraitModule = assets.find((name) => /^danilo-ribeiro-[\w-]+\.js$/.test(name));

assert.ok(portraitImage, 'The production build must emit the portrait image');
assert.ok(portraitModule, 'The portrait must be imported through the Vite asset pipeline');
assert.ok((await stat(new URL(portraitImage, assetsDirectory))).size > 0, 'The emitted portrait must not be empty');

const portraitCode = await readFile(new URL(portraitModule, assetsDirectory), 'utf8');
assert.match(portraitCode, new RegExp(`new URL\\(["']${portraitImage.replaceAll('.', '\\.')}["'],import\\.meta\\.url\\)`),
  'The portrait URL must resolve relative to its deployed JS module');

for (const modalName of ['GameSettingsModal', 'IslandModal']) {
  const modalFile = assets.find((name) => name.startsWith(`${modalName}-`) && name.endsWith('.js'));
  assert.ok(modalFile, `${modalName} must be emitted`);
  const modalCode = await readFile(new URL(modalFile, assetsDirectory), 'utf8');
  assert.ok(modalCode.includes(portraitModule), `${modalName} must use the shared portrait asset`);
  assert.ok(!modalCode.includes('/assets/danilo-ribeiro.jpg'), `${modalName} must not use a site-root URL`);
}

for (const locale of ['pt', 'en']) {
  const html = await readFile(new URL(`../dist/${locale}/index.html`, import.meta.url), 'utf8');
  assert.match(html, /\.\.\/assets\//, `The ${locale} route must load assets from the parent directory`);
  const imageUrl = new URL(portraitImage, `https://example.github.io/Portfolio-Ooliveiradev/assets/${portraitModule}`);
  assert.equal(imageUrl.pathname, `/Portfolio-Ooliveiradev/assets/${portraitImage}`);
}

console.log('Portrait asset verified for the menu, About island, and nested language routes.');
