import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/analyticsService.ts', import.meta.url), 'utf8');
let moduleId = 0;
async function loadService(endpoint = '') {
  // Inject Vite's build-time setting, keeping the actual service implementation under test.
  const { outputText } = ts.transpileModule(
    source.replace('import.meta.env?.VITE_ANALYTICS_API_URL', JSON.stringify(endpoint)),
    { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } },
  );
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${moduleId++}`);
}

const realMetrics = {
  totalVisits: 12, uniqueVisitors: 8, avgDurationSeconds: 45,
  dailyVisits: [{ date: '2026-09-24', visits: 12 }],
  lastUpdated: '2026-09-24T12:00:00Z',
};

test('no API: elapsed time and local activity never fabricate visits', async (t) => {
  const service = await loadService();
  const before = await service.fetchRealtimeMetrics('7d');
  t.mock.method(Date, 'now', () => 1_900_000_000_000);
  service.trackSessionStart();
  service.trackProjectView('portfolio-3d');
  service.trackSpatialPosition([10, 2, 20]);
  const after = await service.fetchRealtimeMetrics('30d');
  assert.equal(after.status, 'unavailable');
  assert.deepEqual(after, before);
  assert.deepEqual(after.dailyVisits, []);
  assert.deepEqual(after.spatialHeatmap, []);
});

test('real API: preserves portfolio metrics and sends the selected timeframe', async (t) => {
  let requestedUrl;
  t.mock.method(globalThis, 'fetch', async (url) => {
    requestedUrl = new URL(url);
    return new Response(JSON.stringify({ ...realMetrics, topProjects: [{ projectName: 'Ignored' }] }));
  });
  const service = await loadService('https://analytics.example.test/metrics');
  const data = await service.fetchRealtimeMetrics('30d');
  assert.equal(requestedUrl.searchParams.get('timeframe'), '30d');
  assert.deepEqual(data, { ...realMetrics, status: 'available', topProjects: [], spatialHeatmap: [] });
});

test('offline, invalid and unavailable responses never become demo data', async (t) => {
  const service = await loadService('https://analytics.example.test/metrics');
  for (const response of [
    () => { throw new Error('offline'); },
    () => new Response('', { status: 503 }),
    () => new Response('invalid json'),
    () => new Response(JSON.stringify({ ...realMetrics, totalVisits: -1 })),
    () => new Response(JSON.stringify({ ...realMetrics, status: 'unavailable' })),
  ]) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response());
    const data = await service.fetchRealtimeMetrics();
    assert.equal(data.status, 'unavailable');
    assert.equal(data.lastUpdated, '');
    assert.deepEqual(data.dailyVisits, []);
    mock.mock.restore();
  }
});

test('a real zero-visit response remains available', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({
    ...realMetrics, totalVisits: 0, uniqueVisitors: 0, avgDurationSeconds: 0,
    dailyVisits: [{ date: '2026-09-24', visits: 0 }],
  })));
  const service = await loadService('https://analytics.example.test/metrics');
  const data = await service.fetchRealtimeMetrics();
  assert.equal(data.status, 'available');
  assert.equal(data.totalVisits, 0);
  assert.equal(data.dailyVisits[0].visits, 0);
});
