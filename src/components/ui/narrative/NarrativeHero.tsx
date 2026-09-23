import React, { useEffect, useRef } from 'react';
import { useNarrativeMotion } from './useNarrativeMotion';

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  facts?: string[];
  portrait?: { src: string; alt: string };
  lowPower?: boolean;
}

export function NarrativeHero({ eyebrow, title, description, accent, facts = [], portrait, lowPower }: Props) {
  const ref = useRef<HTMLElement>(null);
  const { simple } = useNarrativeMotion(lowPower);
  useEffect(() => {
    const hero = ref.current;
    const scroll = hero?.closest('[data-narrative-scroll]');
    if (!hero || !scroll || simple) return;
    const layers = Array.from(hero.querySelectorAll<HTMLElement>('[data-depth]'));
    let frame = 0;
    let visible = true;
    const update = () => {
      frame = 0;
      // Relative scroll distance is capped: text never overlaps the next chapter.
      const distance = Math.min(240, Math.max(0, scroll.scrollTop));
      for (const layer of layers) {
        layer.style.transform = `translate3d(0, ${distance * Number(layer.dataset.depth)}px, 0)`;
      }
    };
    const schedule = () => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else { cancelAnimationFrame(frame); frame = 0; }
    }, { root: scroll });
    observer.observe(hero);
    scroll.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    schedule();
    return () => {
      observer.disconnect();
      scroll.removeEventListener('scroll', schedule);
      document.removeEventListener('visibilitychange', schedule);
      cancelAnimationFrame(frame);
      layers.forEach(layer => { layer.style.transform = ''; });
    };
  }, [simple]);

  return <section ref={ref} className="narrative-hero" style={{ '--narrative-accent': accent } as React.CSSProperties}>
    <div aria-hidden="true" className="narrative-orbits" data-depth="0.2"><i /><i /><i /></div>
    <div className="narrative-hero-copy" data-depth="-0.06">
      <p className="narrative-eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p className="narrative-description">{description}</p>
      {facts.length > 0 && <ul className="narrative-facts">{facts.map(fact => <li key={fact}>{fact}</li>)}</ul>}
    </div>
    {portrait && <img className="narrative-portrait" src={portrait.src} alt={portrait.alt} width={160} height={160} decoding="async" />}
  </section>;
}
