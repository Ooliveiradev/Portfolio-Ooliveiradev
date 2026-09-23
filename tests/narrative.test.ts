import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { tokenizeCode } from '../src/components/ui/narrative/codeTokens';
import { TEST_PROJECT_MEDIA, TEST_CERTIFICATE_MEDIA } from '../src/data/mediaTestAssets';

test('highlighting preserves exact source, including markup, quoted comments and Unicode', () => {
  for (const source of [
    'const text = "<script>alert(1)</script>"; // never HTML',
    'git clone https://github.com/Ooliveiradev/QuantIA-MVP.git',
    'const title = "Olá # não é comentário";',
    "print('teste \\' quoted')", '', '  SELECT value FROM items WHERE id = 42;',
  ]) assert.equal(tokenizeCode(source).map(token => token.text).join(''), source);
  assert.deepEqual(tokenizeCode('const value = "#keep"; // comment').filter(token => token.kind !== 'plain').map(token => token.kind), ['keyword', 'string', 'comment']);
});

test('review media resolve to local assets and cannot be mistaken for real evidence', () => {
  const media = [...TEST_PROJECT_MEDIA, ...TEST_CERTIFICATE_MEDIA];
  assert.equal(new Set(media.map(item => item.id)).size, media.length);
  for (const item of media) {
    assert.equal(item.testOnly, true);
    assert.match(item.alt, /TESTE/);
    for (const path of [item.src, item.thumbnail]) {
      const file = new URL(`../public${path}`, import.meta.url);
      assert.ok(existsSync(file), path);
      assert.ok(statSync(file).size < 400_000, 'Review fixture should remain small');
      if (path.endsWith('.svg')) assert.match(readFileSync(file, 'utf8'), /TEST/);
    }
  }
});
