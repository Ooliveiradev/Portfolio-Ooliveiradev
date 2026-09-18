import React from 'react';
import { useVisibleTick } from '../../hooks/useVisibleTick';
import { getBoundaryTelemetry } from '../../utils/boundaryTelemetry';
import { COSMIC_BOUNDARY } from '../../utils/cosmicBoundary';
import { MaterialIcon } from './MaterialIcon';

export function BoundaryAlert({ active }: { active: boolean }) {
  useVisibleTick(100, active);
  const frame = getBoundaryTelemetry();
  if (!active) return null;
  const returning = frame.recovery > 0;
  return (
    <>
      {returning && <div className="boundary-warp-flash fixed inset-0 z-40 pointer-events-none bg-cyan-100"
        style={{ opacity: Math.max(0, (frame.recovery - COSMIC_BOUNDARY.recoverySeconds + 0.5) / 0.5) * 0.65 }} aria-hidden="true" />}
      {(frame.warning || returning) && (
        <div role="status" aria-live="polite" className="pointer-events-none absolute z-30 bottom-48 sm:bottom-8 left-1/2 -translate-x-1/2 w-[min(23rem,calc(100vw-2rem))] rounded-xl border border-amber-400/40 bg-[#15121c]/95 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-semibold">
            <MaterialIcon name={returning ? 'rocket_launch' : 'warning'} size={18} />
            {returning ? 'Retorno quântico concluído' : 'Fronteira do espaço profundo'}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            {returning ? 'Motores estabilizando. Você está em uma órbita segura.' :
              frame.pressure > 0 ? 'Contenção crítica. Preparando retorno de emergência.' :
              'Interferência gravitacional. Vire a nave em direção ao Sol.'}
          </p>
          {frame.warning && <div className="mt-2 h-0.5 bg-slate-700 overflow-hidden rounded-full" aria-hidden="true">
            <div className="h-full bg-amber-300 boundary-danger-pulse" style={{ width: `${Math.max(frame.strength, frame.pressure) * 100}%` }} />
          </div>}
        </div>
      )}
    </>
  );
}
