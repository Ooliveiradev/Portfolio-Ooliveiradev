import assert from 'node:assert/strict';
import test from 'node:test';
import { detectLocale, localeFromPathname, pathnameForLocale } from '../src/i18n/locale.ts';
import { getPortfolioContent } from '../src/i18n/portfolio.ts';
import { translateVisibleText } from '../src/i18n/translations.ts';

test('locale detection gives the URL priority, then saved preference, then browser language', () => {
  assert.equal(detectLocale('/Portfolio-Ooliveiradev/en/', 'pt', ['pt-BR']), 'en');
  assert.equal(detectLocale('/Portfolio-Ooliveiradev/', 'en', ['pt-BR']), 'en');
  assert.equal(detectLocale('/', null, ['pt-BR', 'en-US']), 'pt');
  assert.equal(detectLocale('/', null, ['en-US']), 'en');
});
test('localized URLs preserve a GitHub Pages project prefix', () => {
  assert.equal(localeFromPathname('/Portfolio-Ooliveiradev/pt/'), 'pt');
  assert.equal(pathnameForLocale('/Portfolio-Ooliveiradev/', 'en'), '/Portfolio-Ooliveiradev/en/');
  assert.equal(pathnameForLocale('/Portfolio-Ooliveiradev/pt/', 'en'), '/Portfolio-Ooliveiradev/en/');
});

test('visible interface copy can switch in both directions without a reload', () => {
  assert.equal(translateVisibleText('Iniciar Corrida', 'en'), 'Start Race');
  assert.equal(translateVisibleText('Start Race', 'pt'), 'Iniciar Corrida');
});

test('portfolio islands, project content and achievements have English variants', () => {
  const content = getPortfolioContent('en');
  assert.equal(content.islands[0].name, 'Projects Island');
  assert.match(content.projects[0].description, /web platform/i);
  assert.match(content.projects[0].readme, /Overview/);
  assert.equal(content.badges[0].title, 'First Contact');
});
