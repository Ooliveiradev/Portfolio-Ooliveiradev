import React, { useEffect, useRef } from 'react';
import type { CosmicWhisper } from '../../types';
import { useVisibleTick } from '../../hooks/useVisibleTick';
import { getVehiclePosition } from '../../utils/vehicleTelemetry';
import { findNearbyWhisper } from '../../utils/whisperProximity';
import { sounds } from '../../audio/soundManager';
import { MaterialIcon } from './MaterialIcon';

interface NearbyTransmissionProps {
  whispers: CosmicWhisper[];
  onInspect: (whisper: CosmicWhisper) => void;
}

/** Sample telemetry locally: prompt visibility must not depend on a scene click or an App render. */
export const NearbyTransmission: React.FC<NearbyTransmissionProps> = ({ whispers, onInspect }) => {
  useVisibleTick(100);
  const previousId = useRef<string | null>(null);
  const [x, y, z] = getVehiclePosition();
  const nearby = findNearbyWhisper(whispers, { x, y, z }, previousId.current);
  useEffect(() => { previousId.current = nearby?.id ?? null; }, [nearby?.id]);

  return (
    <div className="nearby-transmission absolute bottom-48 sm:bottom-8 left-1/2 sm:left-6 -translate-x-1/2 sm:translate-x-0 w-[min(18rem,calc(100vw-3rem))] sm:w-72 pointer-events-none" role="status" aria-live="polite">
      {nearby && (
        <button
          type="button"
          onClick={() => { sounds.playClick(); onInspect(nearby); }}
          className="pointer-events-auto w-full flex items-center gap-3 rounded-2xl border border-cyan-400/40 bg-[#091522]/95 px-4 py-3 text-left shadow-lg cursor-pointer hover:border-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-300"
          aria-label={`Abrir transmissão de ${nearby.author}`}
        >
          <MaterialIcon name="sensors" size={22} className="text-cyan-300 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-mono tracking-wider text-cyan-300">TRANSMISSÃO PRÓXIMA</span>
            <span className="block truncate text-sm font-semibold text-white">{nearby.author}</span>
            <span className="block text-[10px] text-slate-400">Toque para abrir a mensagem</span>
          </span>
          <MaterialIcon name="arrow_forward" size={16} className="text-cyan-300 shrink-0" />
        </button>
      )}
    </div>
  );
};
