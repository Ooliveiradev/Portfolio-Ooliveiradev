import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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

export function MatrixEasterEgg() {
  return (
    <motion.div className="matrix-easter-egg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
      <CodeRain />
      <div className="matrix-vignette" aria-hidden="true" />
      <section className="matrix-terminal" role="status" aria-live="polite">
        <div className="matrix-terminal-bar" aria-hidden="true">
          <span className="matrix-terminal-lights"><i /><i /><i /></span>
          <span>danilo@universe:~</span><span>SECURE SESSION</span>
        </div>
        <div className="matrix-terminal-body">
          <p className="matrix-command" aria-hidden="true"><span>❯</span> ./unlock --developer</p>
          <p className="matrix-access">ACESSO CONCEDIDO</p>
          <h2>Você encontrou<br />o outro lado<span className="matrix-cursor" aria-hidden="true">_</span></h2>
          <p className="matrix-description">Nem todo segredo está no código.<br />Alguns estão em quem o escreve.</p>
          <div className="matrix-terminal-footer"><span>SEGREDO DO DESENVOLVEDOR</span><strong>+100 XP</strong></div>
        </div>
        <div className="matrix-session-progress" aria-hidden="true" />
      </section>
    </motion.div>
  );
}
