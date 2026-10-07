import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from '../firebase/config';
import { useI18n } from '../i18n/I18nProvider';
import { createDefaultDocument } from './defaults';
import type { PortfolioDocument } from './model';
import { fetchPublishedContent, readCachedContent, writeCachedContent } from './remote';
import { resolveContent, type ResolvedContent } from './resolve';
import { applyAccent } from './theme';

/** Longest the opening screen waits for the published content before showing the built-in copy. */
const CONTENT_WAIT_MS = 2500;

interface ContentContextValue {
  /** What every visitor sees right now. */
  published: PortfolioDocument;
  /** Revision of `published`; null while nothing has ever been published. */
  revision: number | null;
  /** Unpublished edits being previewed by the owner; null for everyone else. */
  draft: PortfolioDocument | null;
  content: ResolvedContent;
  /** True once the published content is known (or we gave up waiting). */
  ready: boolean;
  setDraft: (draft: PortfolioDocument | null) => void;
  setPublished: (document: PortfolioDocument, revision: number) => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export const ContentProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { locale } = useI18n();
  const [initial] = useState(() => readCachedContent());
  const [published, setPublishedDoc] = useState<PortfolioDocument>(() => initial?.document ?? createDefaultDocument());
  const [revision, setRevision] = useState<number | null>(initial?.revision ?? null);
  const [draft, setDraft] = useState<PortfolioDocument | null>(null);
  const [ready, setReady] = useState<boolean>(() => Boolean(initial) || !isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => setReady(true), CONTENT_WAIT_MS);
    fetchPublishedContent(controller.signal)
      .then(result => {
        if (result) {
          setPublishedDoc(result.document);
          setRevision(result.revision);
          writeCachedContent(result);
        }
      })
      // Offline or backend unavailable: keep the cached or built-in portfolio.
      .catch(() => undefined)
      .finally(() => { window.clearTimeout(timer); setReady(true); });
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, []);

  const setPublished = useCallback((document: PortfolioDocument, nextRevision: number) => {
    setPublishedDoc(document);
    setRevision(nextRevision);
    writeCachedContent({ document, revision: nextRevision });
  }, []);

  const active = draft ?? published;
  const content = useMemo(() => resolveContent(active, locale), [active, locale]);

  useEffect(() => { applyAccent(active.appearance.accentColor); }, [active.appearance.accentColor]);

  const seoTitle = content.text('seo.title');
  const seoDescription = content.text('seo.description');
  useEffect(() => {
    document.title = seoTitle;
    for (const [selector, attribute, value] of [
      ['meta[name="description"]', 'name', seoDescription],
      ['meta[property="og:title"]', 'property', seoTitle],
      ['meta[property="og:description"]', 'property', seoDescription],
    ] as const) {
      let meta = document.head.querySelector<HTMLMetaElement>(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, selector.match(/"([^"]+)"/)![1]);
        document.head.appendChild(meta);
      }
      meta.content = value;
    }
  }, [seoTitle, seoDescription]);

  const value = useMemo<ContentContextValue>(
    () => ({ published, revision, draft, content, ready, setDraft, setPublished }),
    [published, revision, draft, content, ready, setPublished],
  );
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
};

const useContentContext = (): ContentContextValue => {
  const value = useContext(ContentContext);
  if (!value) throw new Error('useContent must be used inside ContentProvider');
  return value;
};

/** The portfolio content in the visitor's language. */
export const useContent = (): ResolvedContent => useContentContext().content;

/** Document-level access for the admin panel and the loading screen. */
export const usePortfolioDocument = () => useContentContext();
