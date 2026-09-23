import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { tokenizeCode } from './codeTokens';
import { useNarrativeMotion } from './useNarrativeMotion';

export function CodeStory({ code, language = 'code', lineInterval = 180 }: { code: string; language?: string; lineInterval?: number }) {
  const { locale } = useI18n();
  const { simple } = useNarrativeMotion();
  const ref = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => code.split('\n').map(tokenizeCode), [code]);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const pt = locale === 'pt';
  useEffect(() => { setCount(0); }, [code]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let intersects = false;
    const update = () => setVisible(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!visible || paused || simple || count >= lines.length) return;
    // One timer per revealed line, never a perpetual frame loop. Hidden lines keep
    // their layout so typing cannot move the scrollbar or shift subsequent content.
    const timer = window.setTimeout(() => setCount(value => value + 1), Math.max(40, lineInterval));
    return () => window.clearTimeout(timer);
  }, [visible, paused, simple, count, lines.length, lineInterval]);
  const complete = simple || count >= lines.length;
  return <div ref={ref} className="narrative-code">
    <div className="narrative-code-tools"><span>{language}</span>
      {!simple && <span>
        {!complete && <button type="button" onClick={() => setPaused(value => !value)}>{paused ? (pt ? 'Continuar' : 'Resume') : (pt ? 'Pausar' : 'Pause')}</button>}
        <button type="button" onClick={() => { setCount(complete ? 0 : lines.length); setPaused(false); }}>{complete ? (pt ? 'Repetir' : 'Replay') : (pt ? 'Mostrar tudo' : 'Show all')}</button>
      </span>}
    </div>
    <pre aria-label={pt ? `Código ${language}` : `${language} code`}><code><span className="sr-only">{code}</span>
      <span aria-hidden="true">{lines.map((tokens, index) => <span key={index} className="narrative-code-line" style={{ opacity: complete || index < count ? 1 : 0 }}>
        <span className="narrative-line-number">{index + 1}</span>{tokens.map((token, tokenIndex) => <span key={tokenIndex} className={`code-${token.kind}`}>{token.text}</span>)}{'\n'}
      </span>)}</span>
    </code></pre>
  </div>;
}
