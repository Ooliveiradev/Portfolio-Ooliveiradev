import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useContent } from '../../content/ContentProvider';
import './MatrixEasterEgg.css';

const GLYPHS = '01{}[]<>/;:=+*#$_ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ';

function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let lastFrame = 0;
    let frame = 0;
    let request = 0;
    let columns: { x: number; y: number; speed: number; length: number; glyphs: string[] }[] = [];
    const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

    const resize = () => {
      // A single capped-resolution canvas keeps this independent of React and the 3D renderer.
      const scale = Math.min(1, 1600 / window.innerWidth);
      width = canvas.width = Math.ceil(window.innerWidth * scale);
      height = canvas.height = Math.ceil(window.innerHeight * scale);
      const spacing = width < 600 ? 15 : 17;
      columns = Array.from({ length: Math.ceil(width / spacing) }, (_, i) => ({
        x: i * spacing + spacing / 2,
        y: Math.random() * (height + 400) - 200,
        speed: (55 + Math.random() * 95) * (reducedMotion ? 0.25 : 1),
        length: 18 + Math.floor(Math.random() * 16),
        glyphs: Array.from({ length: 34 }, randomGlyph),
      }));
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
    };
    const draw = (now: number) => {
      request = requestAnimationFrame(draw);
      if (now - lastFrame < (reducedMotion ? 100 : 1000 / 30)) return;
      const dt = Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      frame++;
      ctx.clearRect(0, 0, width, height);
      for (const column of columns) {
        column.y += column.speed * dt;
        if (column.y - column.length * 17 > height) column.y = -20;
        for (let j = 0; j < column.length; j++) {
          const y = column.y - j * 17;
          if (y < -20 || y > height + 20) continue;
          if (frame % (reducedMotion ? 3 : 2) === 0 && Math.random() < 0.3) column.glyphs[j] = randomGlyph();
          const alpha = (1 - j / column.length) ** 1.7;
          ctx.globalAlpha = j === 0 ? 0.95 : alpha * 0.65;
          ctx.fillStyle = j === 0 ? '#dcfff0' : j < 3 ? '#67f5bc' : '#16b87a';
          ctx.fillText(column.glyphs[j], column.x, y);
        }
      }
      ctx.globalAlpha = 1;
    };
    const visibility = () => {
      cancelAnimationFrame(request);
      lastFrame = 0;
      if (!document.hidden) request = requestAnimationFrame(draw);
    };
    resize();
    visibility();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      cancelAnimationFrame(request);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />;
}

/** How long the secret stays on screen when nobody touches it, as before. */
const IDLE_DISMISS_MS = 6500;

const Lines = ({ value }: { value: string }) => (
  <>
    {value.split('\n').map((line, index) => (
      <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>
    ))}
  </>
);

interface MatrixEasterEggProps {
  onClose: () => void;
  /** Reveals the administrator login. Discovering the secret grants no access by itself. */
  onLogin: () => void;
}

export function MatrixEasterEgg({ onClose, onLogin }: MatrixEasterEggProps) {
  const { personalInfo, text } = useContent();
  const [engaged, setEngaged] = useState(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Visitors who just watch keep the original 6.5 s moment; touching the terminal keeps it open.
  useEffect(() => {
    if (engaged) return;
    const timer = window.setTimeout(() => closeRef.current(), IDLE_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [engaged]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      closeRef.current();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const engage = () => setEngaged(true);
  const handle = personalInfo.name.split(/\s+/)[0]?.toLowerCase() || 'dev';

  return (
    <motion.div className="matrix-easter-egg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <CodeRain />
      <div className="matrix-vignette" aria-hidden="true" />
      <section className="matrix-terminal" aria-label={text('egg.footer')}
        onPointerEnter={engage} onFocus={engage} onTouchStart={engage}>
        <div className="matrix-terminal-bar">
          <span className="matrix-terminal-lights" aria-hidden="true"><i /><i /><i /></span>
          <span aria-hidden="true">{handle}@universe:~</span>
          <button type="button" className="matrix-close" onClick={onClose} aria-label="Fechar">esc ✕</button>
        </div>
        <div className="matrix-terminal-body">
          <div role="status" aria-live="polite">
            <p className="matrix-command" aria-hidden="true"><span>❯</span> ./unlock --developer</p>
            <p className="matrix-access">{text('egg.access')}</p>
            <h2><Lines value={text('egg.title')} /><span className="matrix-cursor" aria-hidden="true">_</span></h2>
            <p className="matrix-description"><Lines value={text('egg.description')} /></p>
          </div>
          <button type="button" className="matrix-login" onClick={onLogin}>
            <span><span aria-hidden="true">❯</span> ./login --admin</span>
            <small>{text('egg.login')}</small>
          </button>
          <div className="matrix-terminal-footer"><span>{text('egg.footer')}</span><strong>+100 XP</strong></div>
        </div>
        <div className={`matrix-session-progress ${engaged ? 'is-paused' : ''}`} aria-hidden="true" />
      </section>
    </motion.div>
  );
}
