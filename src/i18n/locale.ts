export const SUPPORTED_LOCALES = ['pt', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'pt';
export const LOCALE_STORAGE_KEY = 'galactic_portfolio_locale';

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);

export const localeFromPathname = (pathname: string): Locale | null => {
  const segment = pathname.split('/').filter(Boolean).find(isLocale);
  return segment ?? null;
};

export const detectLocale = (
  pathname: string,
  storedLocale?: string | null,
  browserLanguages: readonly string[] = [],
): Locale => {
  const routeLocale = localeFromPathname(pathname);
  if (routeLocale) return routeLocale;
  if (isLocale(storedLocale)) return storedLocale;
  return browserLanguages.some((language) => language.toLowerCase().startsWith('pt')) ? 'pt' : 'en';
};

export const pathnameForLocale = (pathname: string, locale: Locale): string => {
  const parts = pathname.split('/').filter(Boolean);
  const localeIndex = parts.findIndex(isLocale);

  if (localeIndex >= 0) {
    parts[localeIndex] = locale;
  } else {
    parts.push(locale);
  }

  return `/${parts.join('/')}/`;
};

export const localeTag = (locale: Locale): string => (locale === 'pt' ? 'pt-BR' : 'en');
