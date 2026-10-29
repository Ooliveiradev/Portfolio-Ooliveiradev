import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMediaUrl } from '../src/utils/mediaUrl';

test('site-relative media resolves from the site root, whatever the page depth', () => {
  const root = 'https://ooliveiradev.github.io/Portfolio-Ooliveiradev/';
  assert.equal(resolveMediaUrl('./assets/portfolio/a.webp', root), `${root}assets/portfolio/a.webp`);
  assert.equal(resolveMediaUrl('./assets/portfolio/a.webp', '/'), '/assets/portfolio/a.webp');
});

test('absolute and attachment links are left untouched', () => {
  assert.equal(resolveMediaUrl('https://github.com/user-attachments/assets/x', '/'), 'https://github.com/user-attachments/assets/x');
  assert.equal(resolveMediaUrl('/assets/a.png', '/'), '/assets/a.png');
});
