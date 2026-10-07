import assert from 'node:assert/strict';
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

test('the built-in portfolio ships without placeholder media, so no gallery renders until media is added', () => {
  for (const locale of ['pt', 'en'] as const) {
    const content = getPortfolioContent(locale);
    assert.ok(content.projects.every(project => !project.media?.length), 'projects must not carry fixture media');
    assert.ok(content.education.every(item => !item.certificates?.length), 'education must not carry fixture certificates');
  }
});
