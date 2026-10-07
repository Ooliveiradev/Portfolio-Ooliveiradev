import assert from 'node:assert/strict';
import test from 'node:test';
import { createDefaultDocument } from '../src/content/defaults.ts';
import { findIssues } from '../src/content/issues.ts';
import { newId, pick, pickList, type PortfolioDocument } from '../src/content/model.ts';
import { parsePublishedPayload } from '../src/content/remote.ts';
import { resolveContent } from '../src/content/resolve.ts';
import { normalizeDocument, prepareForPublish } from '../src/content/sanitize.ts';
import { ACCENT_SHADES, applyAccent, buildAccentScale } from '../src/content/theme.ts';
import { UI_TEXTS, resolveUiText } from '../src/content/uiTexts.ts';
import { isEmail, isSafeLink, isSafeMediaUrl } from '../src/content/validation.ts';
import { getPortfolioContent } from '../src/i18n/portfolio.ts';

const fresh = (): PortfolioDocument => createDefaultDocument();

test('the built-in document survives sanitising unchanged', () => {
  assert.deepEqual(normalizeDocument(fresh()), fresh());
});

test('the built-in portfolio resolves to exactly the content shipped in code, in both languages', () => {
  for (const locale of ['pt', 'en'] as const) {
    const resolved = resolveContent(fresh(), locale);
    const builtIn = getPortfolioContent(locale);
    assert.deepEqual(resolved.projects.map(p => [p.id, p.title, p.shortDesc, p.description, p.tags, p.readme, p.featured]),
      builtIn.projects.map(p => [p.id, p.title, p.shortDesc, p.description, p.tags, p.readme, p.featured]));
    assert.deepEqual(resolved.experience, builtIn.experience);
    assert.deepEqual(resolved.education.map(e => [e.id, e.degree, e.skillsAcquired]), builtIn.education.map(e => [e.id, e.degree, e.skillsAcquired]));
    assert.deepEqual(resolved.skills.map(s => [s.title, s.skills.map(k => [k.name, k.level])]), builtIn.skills.map(s => [s.title, s.skills.map(k => [k.name, k.level])]));
    assert.deepEqual(resolved.islands, builtIn.islands);
    assert.deepEqual(resolved.badges, builtIn.badges);
    assert.equal(resolved.personalInfo.name, builtIn.personalInfo.name);
    assert.equal(resolved.personalInfo.phone, '', 'the phone number stays private unless the owner opts in');
  }
});

test('no media means nothing to render: the default portfolio has no galleries', () => {
  const resolved = resolveContent(fresh(), 'pt');
  assert.ok(resolved.projects.every(project => project.media === undefined));
  assert.ok(resolved.education.every(item => item.certificates === undefined));
});

test('empty optional blocks are omitted rather than rendered blank', () => {
  const doc = fresh();
  const project = doc.projects[0];
  project.architecture = { overview: { pt: '', en: '' }, flow: { pt: [], en: [] }, database: { pt: '', en: '' }, security: { pt: [], en: [] } };
  project.quickStart = { cloneCmd: '', installCmd: '', runCmd: '', envExample: '' };
  project.stats = [];
  project.highlights = { pt: [], en: [] };
  project.metrics = { pt: '', en: '' };
  const resolved = resolveContent(doc, 'pt').projects[0];
  for (const key of ['architecture', 'quickStart', 'stats', 'highlights', 'metrics', 'media'] as const) assert.equal(resolved[key], undefined, key);
});

test('hidden items and islands are removed, and the owner’s order wins', () => {
  const doc = fresh();
  doc.projects[1].visible = false;
  doc.experience.reverse();
  doc.islands[0].visible = false;
  doc.islands.reverse();
  const resolved = resolveContent(doc, 'pt');
  assert.ok(!resolved.projects.some(project => project.id === doc.projects[1].id));
  assert.equal(resolved.experience[0].id, doc.experience[0].id);
  assert.equal(resolved.islands.length, doc.islands.length - 1);
  assert.ok(!resolved.islands.some(island => island.id === 'projects'));
  assert.equal(resolved.islands[0].id, doc.islands[0].id);
});

test('a missing language falls back to the other one instead of showing blanks', () => {
  assert.equal(pick({ pt: '', en: 'Hello' }, 'pt'), 'Hello');
  assert.equal(pick({ pt: 'Olá', en: '' }, 'en'), 'Olá');
  assert.deepEqual(pickList({ pt: [], en: ['a', ' ', 'b'] }, 'pt'), ['a', 'b']);
});

test('links that can run code or leave the allowed set are rejected', () => {
  for (const bad of ['javascript:alert(1)', 'data:text/html,<script>', 'vbscript:x', 'file:///etc/passwd', 'ftp://x.com', 'http://localhost', 'not a url', '//evil.com']) {
    assert.equal(isSafeLink(bad), false, bad);
  }
  for (const good of ['', 'https://github.com/Ooliveiradev', 'http://example.com/a?b=1']) assert.equal(isSafeLink(good), true, good);
  assert.equal(isEmail('danilorib2324@gmail.com'), true);
  assert.equal(isEmail('a@b'), false);
});

test('media may only come from this site or the portfolio bucket', () => {
  for (const good of ['https://firebasestorage.googleapis.com/v0/b/x/o/portfolio-media%2Fa.jpg?alt=media&token=1', 'https://x.firebasestorage.app/a.png', '/assets/a.png', './assets/a.png']) {
    assert.equal(isSafeMediaUrl(good), true, good);
  }
  for (const bad of ['', 'https://evil.com/a.png', 'http://firebasestorage.googleapis.com/a.png', 'data:image/png;base64,AAAA', 'javascript:1', '//evil.com/a.png', '/../secret', '/a/../b.png', 'https://firebasestorage.googleapis.com.evil.com/a.png']) {
    assert.equal(isSafeMediaUrl(bad), false, bad);
  }
});

test('hostile stored content is neutralised when it is loaded', () => {
  const hostile = {
    profile: { name: '  Alguém  ', github: 'javascript:alert(1)', linkedin: 'https://linkedin.com/in/x', photo: 'https://evil.com/p.png', links: [{ id: 'a', label: 'ok', url: 'https://x.com' }, { id: 'b', label: 'bad', url: 'javascript:1' }], bio: { pt: 'x'.repeat(20000), en: 1 } },
    islands: [{ id: 'projects', visible: false, color: 'red' }, { id: 'nonexistent', visible: true }, { id: 'projects', visible: true }],
    projects: [{ id: 'p', title: { pt: 'T' }, liveUrl: 'javascript:1', githubUrl: 'https://github.com/x', accentColor: 'nope', media: [{ id: 'm', kind: 'image', src: 'https://evil.com/x.png' }, { id: 'n', kind: 'video', src: '/assets/v.mp4' }], tags: ['a', 7, '', 'b'] }, { id: 'p', title: { pt: 'duplicate' } }],
    texts: { 'landing.start': { pt: 'Começar', en: 'Go' }, 'made.up.key': { pt: 'x', en: 'y' } },
    appearance: { accentColor: 'javascript:1' },
  };
  const doc = normalizeDocument(hostile);
  assert.equal(doc.profile.name, 'Alguém');
  assert.equal(doc.profile.github, '');
  assert.equal(doc.profile.photo, '');
  assert.deepEqual(doc.profile.links.map(link => link.id), ['a']);
  assert.ok(doc.profile.bio.pt.length <= 6000);
  assert.equal(doc.profile.bio.en, fresh().profile.bio.en, 'a value of the wrong type falls back to the built-in text');
  assert.equal(doc.islands.length, 6, 'every island of the 3D world is kept');
  assert.equal(doc.islands.filter(island => island.id === 'projects').length, 1);
  assert.ok(doc.islands.some(island => island.visible), 'at least one island stays visible');
  assert.equal(doc.islands.find(island => island.id === 'projects')?.color, fresh().islands[0].color);
  assert.equal(doc.projects.length, 1, 'duplicate ids are dropped');
  assert.equal(doc.projects[0].liveUrl, '');
  assert.equal(doc.projects[0].accentColor, '#38bdf8');
  assert.deepEqual(doc.projects[0].media.map(item => item.id), ['n']);
  assert.deepEqual(doc.projects[0].tags, ['a', 'b']);
  assert.deepEqual(Object.keys(doc.texts), ['landing.start']);
  assert.equal(doc.appearance.accentColor, '#38bdf8');
});

test('garbage input still yields a complete, usable portfolio', () => {
  for (const input of [null, undefined, 42, 'x', [], {}, { profile: 5, projects: 'no' }]) {
    const doc = normalizeDocument(input);
    assert.ok(doc.profile.name);
    assert.equal(doc.islands.length, 6);
    assert.equal(doc.badges.length, fresh().badges.length);
  }
});

test('findIssues blocks what the sanitiser would silently drop', () => {
  assert.deepEqual(findIssues(fresh()), []);
  const doc = fresh();
  doc.profile.github = 'javascript:alert(1)';
  doc.profile.email = 'nope';
  doc.projects[0].title = { pt: '', en: '' };
  doc.projects[0].liveUrl = 'ftp://x.com';
  doc.projects[0].media = [{ id: 'm', kind: 'image', src: 'https://evil.com/a.png', thumbnail: '', alt: { pt: '', en: '' }, caption: { pt: '', en: '' } }];
  doc.islands.forEach(island => { island.visible = false; });
  const messages = findIssues(doc).map(issue => issue.where);
  for (const expected of ['Perfil › GitHub', 'Perfil › E-mail', 'Seções']) assert.ok(messages.some(where => where.startsWith(expected)), expected);
  assert.ok(messages.some(where => where.includes('Projeto 1')));
  assert.ok(messages.filter(where => where.includes('Mídia 1')).length >= 2, 'bad source and missing alt text');
  const sections = new Set(findIssues(doc).map(issue => issue.section));
  assert.ok(sections.has('profile') && sections.has('projects') && sections.has('islands'));
});

test('findIssues reports oversize content before the server would refuse it', () => {
  const doc = fresh();
  doc.projects[0].readme = { pt: 'x'.repeat(59000), en: 'y'.repeat(59000) };
  for (let i = 0; i < 14; i++) doc.projects.push({ ...structuredClone(doc.projects[0]), id: newId('p'), title: { pt: `p${i}`, en: `p${i}` } });
  assert.ok(findIssues(doc).some(issue => issue.section === 'document'));
});

test('copy overrides win, fall back across languages and interpolate placeholders', () => {
  assert.equal(resolveUiText({}, 'landing.start', 'pt'), UI_TEXTS['landing.start'].pt);
  assert.equal(resolveUiText({ 'landing.start': { pt: 'Vamos', en: '' } }, 'landing.start', 'pt'), 'Vamos');
  assert.equal(resolveUiText({ 'landing.start': { pt: 'Vamos', en: '' } }, 'landing.start', 'en'), 'Vamos');
  assert.equal(resolveUiText({}, 'about.greeting', 'en', { name: 'Ana' }), 'Hello! I’m Ana 👋');
  const resolved = resolveContent({ ...fresh(), texts: { 'egg.footer': { pt: 'OUTRO', en: 'OTHER' } } }, 'en');
  assert.equal(resolved.text('egg.footer'), 'OTHER');
  assert.equal(resolved.text('about.formPlaceholder'), 'Write a message to Danilo...');
});

test('publishing stores only real overrides', () => {
  const doc = fresh();
  doc.texts['landing.start'] = { pt: UI_TEXTS['landing.start'].pt, en: UI_TEXTS['landing.start'].en };
  doc.texts['landing.footnote'] = { pt: 'Novo rodapé', en: UI_TEXTS['landing.footnote'].en };
  assert.deepEqual(Object.keys(prepareForPublish(doc).texts), ['landing.footnote']);
});

test('the accent scale keeps the chosen colour as shade 400 and stays valid', () => {
  for (const color of ['#38bdf8', '#34d399', '#fbbf24', '#ffffff', '#000000', '#ff0000']) {
    const scale = buildAccentScale(color);
    assert.equal(scale[400], color);
    for (const shade of ACCENT_SHADES) assert.match(scale[shade], /^#[0-9a-f]{6}$/, `${color} ${shade}`);
  }
  const light = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
  const scale = buildAccentScale('#a78bfa');
  assert.ok(light(scale[50]) > light(scale[400]) && light(scale[400]) > light(scale[950]), 'lightest to darkest');
});

test('the accent is applied as CSS variables and removed for the default colour', () => {
  const style = new Map<string, string>();
  const root = { style: { setProperty: (k: string, v: string) => style.set(k, v), removeProperty: (k: string) => style.delete(k) } } as unknown as HTMLElement;
  applyAccent('#34d399', root);
  assert.equal(style.size, ACCENT_SHADES.length);
  assert.equal(style.get('--color-sky-400'), '#34d399');
  applyAccent('#38BDF8', root);
  assert.equal(style.size, 0);
  applyAccent('not-a-color', root);
  assert.equal(style.size, 0);
});

test('the published payload is parsed defensively', () => {
  const doc = fresh();
  const parsed = parsePublishedPayload({ fields: { json: { stringValue: JSON.stringify(doc) }, revision: { integerValue: '7' } } });
  assert.equal(parsed?.revision, 7);
  assert.deepEqual(parsed?.document, doc);
  assert.equal(parsePublishedPayload({}), null);
  assert.equal(parsePublishedPayload({ fields: { json: { stringValue: '{broken' } } }), null);
  const hostile = parsePublishedPayload({ fields: { json: { stringValue: JSON.stringify({ profile: { github: 'javascript:1' } }) }, revision: { integerValue: '1' } } });
  assert.equal(hostile?.document.profile.github, '');
});
