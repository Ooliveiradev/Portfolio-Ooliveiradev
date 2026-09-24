import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { PortfolioMedia } from '../../../types';
import { useI18n } from '../../../i18n/I18nProvider';
import { CinematicDialog } from './CinematicDialog';

function LazyVideo({ item, failure }: { item: PortfolioMedia; failure: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // Video has no interoperable loading="lazy": attach src only on intersection.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoaded(true);
      else video.pause();
    });
    const pauseHidden = () => { if (document.hidden) video.pause(); };
    observer.observe(video);
    document.addEventListener('visibilitychange', pauseHidden);
    return () => { observer.disconnect(); video.pause(); document.removeEventListener('visibilitychange', pauseHidden); };
  }, []);
  if (failed) return <p role="status">{failure}</p>;
  return <video ref={ref} src={loaded ? item.src : undefined} poster={item.thumbnail} controls playsInline preload="none" aria-label={item.alt} onError={() => setFailed(true)} />;
}

function MediaImage({ src, alt, failure, thumbnail = false }: { src: string; alt: string; failure: string; thumbnail?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <span role="status" className="narrative-media-error">{failure}</span> :
    <img src={src} alt={alt} loading={thumbnail ? 'lazy' : 'eager'} decoding="async" onError={() => setFailed(true)} />;
}

export function MediaGallery({ items = [], title, lowPower = false }: { items?: PortfolioMedia[]; title: string; lowPower?: boolean }) {
  const { locale } = useI18n();
  const pt = locale === 'pt';
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const item = selected === null ? undefined : items[selected];
  const failure = pt ? 'Não foi possível carregar esta mídia.' : 'This media could not be loaded.';
  const change = (direction: number) => setSelected(index => index === null ? null : (index + direction + items.length) % items.length);
  if (!items.length) return null;
  return <section className="narrative-gallery" aria-labelledby={`${id}-gallery`}>
    <h3 id={`${id}-gallery`} className="text-sm font-semibold mb-3">{title}</h3>
    {items.some(media => media.testOnly) && <p className="narrative-test-notice">{pt ? 'Arquivos de teste — substituir por capturas/documentos reais. Não comprovam projetos ou qualificações.' : 'Test files — replace with real captures/documents. They do not substantiate projects or qualifications.'}</p>}
    <div className="narrative-media-grid">
      {items.map((media, index) => <button type="button" key={media.id} onClick={() => setSelected(index)} aria-label={`${pt ? 'Ampliar' : 'Expand'}: ${media.alt}`}>
        <MediaImage src={media.thumbnail} alt={media.alt} failure={failure} thumbnail />
        <span>{media.kind === 'video' ? '▶ ' : ''}{media.caption}</span>
        {media.testOnly && <strong>{pt ? 'TESTE' : 'TEST'}</strong>}
      </button>)}
    </div>
    <AnimatePresence>
      {item && <CinematicDialog titleId={`${id}-lightbox`} onClose={() => setSelected(null)} layer={70} lowPower={lowPower} className="narrative-lightbox" onKeyDown={event => {
          // Native video keys keep their meaning; arrows elsewhere browse the gallery.
          if ((event.target as HTMLElement).tagName === 'VIDEO') { event.stopPropagation(); return; }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault(); event.stopPropagation(); change(event.key === 'ArrowLeft' ? -1 : 1);
          }
        }}>
        <div>
          <header><h3 id={`${id}-lightbox`}>{item.caption}{item.testOnly ? (pt ? ' · TESTE' : ' · TEST') : ''}</h3>
            <button type="button" onClick={() => setSelected(null)} aria-label={pt ? 'Fechar mídia' : 'Close media'}>✕</button></header>
          <div className="narrative-media-stage" key={item.id}>
            {item.kind === 'video' ? <LazyVideo item={item} failure={failure} /> : <MediaImage src={item.src} alt={item.alt} failure={failure} />}
          </div>
          <footer>
            <button type="button" onClick={() => change(-1)} disabled={items.length < 2}>{pt ? '← Anterior' : '← Previous'}</button>
            <span aria-live="polite">{selected! + 1} / {items.length}</span>
            <button type="button" onClick={() => change(1)} disabled={items.length < 2}>{pt ? 'Próxima →' : 'Next →'}</button>
          </footer>
        </div>
      </CinematicDialog>}
    </AnimatePresence>
  </section>;
}
