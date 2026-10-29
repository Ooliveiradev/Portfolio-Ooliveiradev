/**
 * The site is served from several depths (`/`, `/pt/`, `/en/`), so a media path such as
 * `./assets/portfolio/x.webp` would resolve against the page and break below the root.
 * The bundle always lives in `<root>/assets/`, which gives a reliable site root.
 */
const siteRoot = (): string => (import.meta.env?.DEV ? '/' : new URL('../', import.meta.url).href);

export function resolveMediaUrl(src: string, root: string = siteRoot()): string {
  if (!src.startsWith('./')) return src;
  return root.replace(/\/$/, '') + '/' + src.slice(2);
}
