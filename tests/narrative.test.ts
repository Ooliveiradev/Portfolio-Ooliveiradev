import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { tokenizeCode } from '../src/components/ui/narrative/codeTokens';
import { getPortfolioContent } from '../src/i18n/portfolio';

test('highlighting preserves exact source, including markup, quoted comments and Unicode', () => {
  for (const source of [
    'const text = "<script>alert(1)</script>"; // never HTML',
    'git clone https://github.com/Ooliveiradev/QuantIA-MVP.git',
    'const title = "Olá # não é comentário";',
    "print('teste \\' quoted')", '', '  SELECT value FROM items WHERE id = 42;',
  ]) assert.equal(tokenizeCode(source).map(token => token.text).join(''), source);
  assert.deepEqual(tokenizeCode('const value = "#keep"; // comment').filter(token => token.kind !== 'plain').map(token => token.kind), ['keyword', 'string', 'comment']);
});

test('built-in project media points at real files shipped with the site and is fully described', () => {
  for (const locale of ['pt', 'en'] as const) {
    const content = getPortfolioContent(locale);
    for (const item of content.projects.flatMap(project => project.media ?? [])) {
      assert.ok(item.alt.trim() && item.caption.trim(), `${item.id} needs alt text and a caption`);
      assert.ok(item.src.startsWith('./assets/portfolio/'), `${item.id} must live in public/assets/portfolio`);
      assert.ok(existsSync(join('public', item.src)), `${item.src} is missing`);
      if (item.thumbnail) assert.ok(existsSync(join('public', item.thumbnail)), `${item.thumbnail} is missing`);
    }
    assert.ok(content.education.every(item => !item.certificates?.length), 'education must not carry fixture certificates');
  }
});

test('QuantIA is presented as a discontinued prototype in both languages', () => {
  for (const locale of ['pt', 'en'] as const) {
    const quantia = getPortfolioContent(locale).projects.find(project => project.id === 'quantia-mvp');
    assert.match(quantia?.statusBadge ?? '', /Prot[oó]tipo|Prototype/);
    assert.doesNotMatch(quantia?.title ?? '', /MVP/);
  }
});
