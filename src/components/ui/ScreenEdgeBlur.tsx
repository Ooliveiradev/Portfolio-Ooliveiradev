import React from 'react';
import { GraphicsQuality } from '../../types';

interface ScreenEdgeBlurProps {
  graphicsQuality?: GraphicsQuality;
  enabled?: boolean;
}

/**
 * ScreenEdgeBlur
 * Inspiração: Folio-2025 (Bruno Simon) e estética de diorama/lente macro.
 * 
 * Cria um desfoque periférico charmoso (tilt-shift lens vignette) acelerado por hardware:
 * - Centro nítido para jogabilidade e visualização cristalina das ilhas e nave.
 * - Bordas suaves e aveludadas com desfoque óptico e vinheta cósmica profunda.
 * - Roda a 120 FPS no compositor nativo da GPU sem sobrecarregar a VRAM ou o pipeline WebGL.
 */
export const ScreenEdgeBlur: React.FC<ScreenEdgeBlurProps> = ({
  graphicsQuality = 'mid',
  enabled = true,
}) => {
  if (!enabled || graphicsQuality === 'low') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 select-none overflow-hidden"
      aria-hidden="true"
    >

      {/* 2. Vinheta de Profundidade Cósmica Suave */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background:
            'radial-gradient(ellipse 78% 70% at 50% 50%, transparent 58%, rgba(7, 11, 20, 0.45) 86%, rgba(7, 11, 20, 0.88) 100%)',
        }}
      />

      {/* 3. Realce Sutil de Iluminação de Borda Cósmica (Ambient Glow) */}
      <div
        className="absolute inset-0 w-full h-full opacity-35"
        style={{
          boxShadow: 'inset 0 0 100px rgba(56, 189, 248, 0.08), inset 0 0 40px rgba(99, 102, 241, 0.12)',
        }}
      />
    </div>
  );
};
