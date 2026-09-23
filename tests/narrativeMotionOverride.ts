// Runs before Motion is imported, only on the isolated development test page.
// This simulates the media query without changing the user's OS/browser settings.
const mode = new URLSearchParams(window.location.search).get('motion');
if (mode === 'full' || mode === 'reduced') {
  const matchMedia = window.matchMedia.bind(window);
  window.matchMedia = query => !query.includes('prefers-reduced-motion') ? matchMedia(query) : {
    media: query, matches: mode === 'reduced', onchange: null,
    addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
  };
}
