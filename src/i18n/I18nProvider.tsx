import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, detectLocale, isLocale, localeTag, LOCALE_STORAGE_KEY, pathnameForLocale, type Locale } from './locale';
import { messages, translateVisibleText, type MessageKey } from './translations';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const readInitialLocale = (): Locale => {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  let stored: string | null = null;
  try { stored = window.localStorage.getItem(LOCALE_STORAGE_KEY); } catch { /* storage may be unavailable */ }
  return detectLocale(window.location.pathname, stored, navigator.languages ?? [navigator.language]);
};

const upsertLink = (rel: string, href: string, hrefLang?: string) => {
  const selector = hrefLang ? `link[rel="${rel}"][hreflang="${hrefLang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    if (hrefLang) link.hreflang = hrefLang;
    document.head.appendChild(link);
  }
  link.href = href;
};

const syncSeo = (locale: Locale) => {
  document.documentElement.lang = localeTag(locale);
  document.title = messages[locale].seoTitle;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = messages[locale].seoDescription;

  const origin = window.location.origin;
  const ptUrl = new URL(pathnameForLocale(window.location.pathname, 'pt'), origin).href;
  const enUrl = new URL(pathnameForLocale(window.location.pathname, 'en'), origin).href;
  const currentUrl = locale === 'pt' ? ptUrl : enUrl;
  upsertLink('canonical', currentUrl);
  upsertLink('alternate', ptUrl, 'pt-BR');
  upsertLink('alternate', enUrl, 'en');
  upsertLink('alternate', ptUrl, 'x-default');

  for (const [selector, value] of [
    ['meta[property="og:title"]', messages[locale].seoTitle],
    ['meta[property="og:description"]', messages[locale].seoDescription],
    ['meta[property="og:locale"]', locale === 'pt' ? 'pt_BR' : 'en_US'],
  ] as const) {
    let meta = document.head.querySelector<HTMLMetaElement>(selector);
    if (!meta) {
      meta = document.createElement('meta');
      const property = selector.match(/property="([^"]+)/)?.[1];
      if (property) meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = value;
  }
};

const localizeDom = (root: Node, locale: Locale) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = root.nodeType === Node.TEXT_NODE ? root : walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(parent.tagName)) {
      const source = node.textContent ?? '';
      const translated = translateVisibleText(source, locale);
      if (translated !== source) node.textContent = translated;
    }
    node = walker.nextNode();
  }

  if (root instanceof Element) {
    const elements = [root, ...root.querySelectorAll<HTMLElement>('[title], [aria-label], [placeholder]')];
    for (const element of elements) {
      for (const attribute of ['title', 'aria-label', 'placeholder']) {
        const value = element.getAttribute(attribute);
        if (value) element.setAttribute(attribute, translateVisibleText(value, locale));
      }
    }
  }
};

export const I18nProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try { window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale); } catch { /* storage may be unavailable */ }
    const nextPath = pathnameForLocale(window.location.pathname, nextLocale);
    if (nextPath !== window.location.pathname) {
      window.history.pushState({ locale: nextLocale }, '', `${nextPath}${window.location.search}${window.location.hash}`);
    }
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const routeLocale = window.location.pathname.split('/').filter(Boolean).find(isLocale);
      if (routeLocale) setLocaleState(routeLocale);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const localizedPath = pathnameForLocale(window.location.pathname, locale);
    if (localizedPath !== window.location.pathname) {
      window.history.replaceState({ locale }, '', `${localizedPath}${window.location.search}${window.location.hash}`);
    }
    syncSeo(locale);
    localizeDom(document.body, locale);
    if (locale === 'pt') return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') localizeDom(mutation.target, locale);
        for (const node of mutation.addedNodes) localizeDom(node, locale);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    toggleLocale: () => setLocale(locale === 'pt' ? 'en' : 'pt'),
    t: (key) => messages[locale][key],
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
};
