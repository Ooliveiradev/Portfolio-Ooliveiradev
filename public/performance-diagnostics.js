// Opt-in local diagnostics: no observer, hooks or telemetry without ?perf=1.
// This script runs before the app so shader creation during the first click is visible.
(() => {
  if (new URLSearchParams(location.search).get('perf') !== '1') return;
  let programs = 0;
  let resetPrograms = 0;
  let frames = [];
  let interactions = [];
  let longFrames = [];
  let previousFrame = 0;
  let sampleStartedAt = performance.now();
  let panel, output;
  for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Context) continue;
    const create = Context.prototype.createProgram;
    Context.prototype.createProgram = function (...args) {
      programs++;
      return create.apply(this, args);
    };
  }
  const observe = (type, callback, options = {}) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    new PerformanceObserver(list => callback(list.getEntries())).observe({ type, buffered: true, ...options });
  };
  observe('event', entries => {
    for (const e of entries) {
      if (!e.interactionId || document.hidden || e.startTime < sampleStartedAt) continue;
      const sample = {
        id: e.interactionId, event: e.name, duration: e.duration,
        input: Math.round(e.processingStart - e.startTime),
        processing: Math.round(e.processingEnd - e.processingStart),
        presentation: Math.round(Math.max(0, e.startTime + e.duration - e.processingEnd)),
      };
      const old = interactions.findIndex(item => item.id === sample.id);
      if (old >= 0 && interactions[old].duration >= sample.duration) continue;
      if (old >= 0) interactions.splice(old, 1);
      interactions.push(sample);
      interactions.sort((a, b) => b.duration - a.duration);
      interactions = interactions.slice(0, 10);
    }
  }, { durationThreshold: 16 });
  observe('long-animation-frame', entries => {
    for (const e of entries) {
      if (document.hidden || e.startTime < sampleStartedAt) continue;
      longFrames.push({
        duration: Math.round(e.duration),
        blocking: Math.round(e.blockingDuration),
        scripts: (e.scripts || []).map(s => ({
          source: s.sourceURL.split('/').pop(),
          fn: s.sourceFunctionName, duration: Math.round(s.duration),
        })).sort((a, b) => b.duration - a.duration).slice(0, 3),
      });
    }
    longFrames.sort((a, b) => b.duration - a.duration);
    longFrames = longFrames.slice(0, 5);
  });
  function frame(now) {
    if (!document.hidden && previousFrame) {
      frames.push(now - previousFrame);
      if (frames.length > 600) frames.shift();
    }
    previousFrame = document.hidden ? 0 : now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { previousFrame = 0; });
  function mount() {
    panel = document.createElement('details');
    panel.open = true;
    panel.style.cssText = 'position:fixed;bottom:8px;left:8px;z-index:999999;max-width:520px;max-height:42vh;overflow:auto;background:#070b14;color:#c4fbe5;border:1px solid #49766c;padding:8px;font:11px/1.4 monospace';
    const label = document.createElement('summary');
    label.textContent = 'Diagnóstico local de desempenho';
    const reset = document.createElement('button');
    reset.textContent = 'Zerar amostra';
    reset.style.cssText = 'display:block;margin:4px;padding:4px;border:1px solid';
    reset.onclick = () => {
      sampleStartedAt = performance.now();
      interactions = []; longFrames = []; frames = []; resetPrograms = programs;
    };
    output = document.createElement('pre');
    output.id = 'performance-diagnostics';
    output.style.whiteSpace = 'pre-wrap';
    panel.append(label, reset, output);
    document.body.append(panel);
    setInterval(() => {
      if (document.hidden) return;
      const sorted = [...frames].sort((a, b) => a - b);
      const percentile = n => Math.round(sorted[Math.floor((sorted.length - 1) * n)] || 0);
      output.textContent = JSON.stringify({
        quality: document.querySelector('[data-graphics-quality]')?.dataset.graphicsQuality,
        programs, newPrograms: programs - resetPrograms,
        scene: JSON.parse(document.querySelector('canvas[data-render-diagnostics]')?.dataset.renderDiagnostics || 'null'),
        frameMs: { p50: percentile(0.5), p95: percentile(0.95), max: Math.round(sorted.at(-1) || 0) },
        slowInteractions: interactions, longFrames,
      }, null, 2);
    }, 1000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
})();
