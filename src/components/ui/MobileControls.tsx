import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';
import { createVehicleInput, type VehicleInput } from '../../utils/gameInput';

interface MobileControlsProps {
  virtualInputRef?: React.MutableRefObject<VehicleInput>;
  onInputChange?: (input: VehicleInput) => void;
  onDockNearest: () => void;
  enabled?: boolean;
}

const MAX_RADIUS = 45;

export const MobileControls: React.FC<MobileControlsProps> = ({
  virtualInputRef,
  onInputChange,
  onDockNearest,
  enabled = true,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const input = useRef(createVehicleInput());
  const joystickPointer = useRef<number | null>(null);
  const boostPointer = useRef<number | null>(null);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const [isBoosting, setIsBoosting] = useState(false);
  const eventState = useRef({ enabled, virtualInputRef, onInputChange });
  eventState.current = { enabled, virtualInputRef, onInputChange };

  const publishInput = useCallback((changes: Partial<VehicleInput>) => {
    Object.assign(input.current, changes);
    const { virtualInputRef: target, onInputChange: callback } = eventState.current;
    if (target) Object.assign(target.current, input.current);
    else callback?.({ ...input.current });
  }, []);

  const resetInput = useCallback(() => {
    joystickPointer.current = null;
    boostPointer.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    publishInput({ x: 0, y: 0, boost: false });
    setIsBoosting(false);
  }, [publishInput]);

  useEffect(() => {
    if (!enabled) resetInput();
  }, [enabled, resetInput]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) resetInput();
    };
    window.addEventListener('blur', resetInput);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', resetInput);
      document.removeEventListener('visibilitychange', handleVisibility);
      publishInput({ x: 0, y: 0, boost: false });
    };
  }, [resetInput, publishInput]);

  const moveJoystick = (clientX: number, clientY: number) => {
    let dx = clientX - joystickCenter.current.x;
    let dy = clientY - joystickCenter.current.y;
    const distance = Math.hypot(dx, dy);
    if (distance > MAX_RADIUS) {
      dx *= MAX_RADIUS / distance;
      dy *= MAX_RADIUS / distance;
    }
    // Update only the thumb and the sampled input, without rerendering the app.
    if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    publishInput({ x: dx / MAX_RADIUS, y: dy / MAX_RADIUS });
  };

  const endJoystick = (event: React.PointerEvent) => {
    if (event.pointerId !== joystickPointer.current) return;
    joystickPointer.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    publishInput({ x: 0, y: 0 });
  };

  const endBoost = (event: React.PointerEvent) => {
    if (event.pointerId !== boostPointer.current) return;
    boostPointer.current = null;
    publishInput({ boost: false });
    setIsBoosting(false);
  };

  if (!enabled) return null;

  return (
    <div className="sm:hidden absolute inset-x-0 bottom-16 z-25 pointer-events-none flex items-end justify-between px-5 pb-2">
      <div
        onPointerDown={(event) => {
          if (!eventState.current.enabled || event.button !== 0 || joystickPointer.current !== null) return;
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          joystickCenter.current.x = rect.left + rect.width / 2;
          joystickCenter.current.y = rect.top + rect.height / 2;
          joystickPointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          moveJoystick(event.clientX, event.clientY);
        }}
        onPointerMove={(event) => {
          if (eventState.current.enabled && event.pointerId === joystickPointer.current) {
            moveJoystick(event.clientX, event.clientY);
          }
        }}
        onPointerUp={endJoystick}
        onPointerCancel={endJoystick}
        onLostPointerCapture={endJoystick}
        className="w-28 h-28 rounded-full bg-[#0c1017]/90 border border-slate-800/80 backdrop-blur-xl relative flex items-center justify-center pointer-events-auto touch-none shadow-2xl active:border-sky-400/80 transition-colors"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <div className="w-16 h-0.5 bg-slate-500" />
          <div className="h-16 w-0.5 bg-slate-500 absolute" />
        </div>
        <div
          ref={knobRef}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg border border-sky-400/40 absolute pointer-events-none"
          style={{ transform: 'translate(0px, 0px)' }}
        />
      </div>

      <div className="flex flex-col gap-3 pointer-events-auto">
        <button
          onPointerDown={(event) => {
            if (!eventState.current.enabled || event.button !== 0 || boostPointer.current !== null) return;
            event.preventDefault();
            boostPointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            publishInput({ boost: true });
            setIsBoosting(true);
            sounds.playBoost();
          }}
          onPointerUp={endBoost}
          onPointerCancel={endBoost}
          onLostPointerCapture={endBoost}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 border shadow-xl transition-all cursor-pointer backdrop-blur-xl select-none touch-none ${
            isBoosting
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 scale-95 ring-2 ring-amber-400/30'
              : 'bg-[#0c1017]/90 text-amber-400/90 border-slate-800/80 hover:border-amber-500/40 active:scale-95'
          }`}
        >
          <MaterialIcon name="rocket_launch" size={22} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Turbo</span>
        </button>

        <button
          onClick={() => {
            if (!eventState.current.enabled) return;
            sounds.playClick();
            onDockNearest();
          }}
          className="w-14 h-14 rounded-2xl bg-[#0c1017]/90 hover:bg-[#111622] text-sky-400 border border-slate-800/80 hover:border-sky-500/40 flex flex-col items-center justify-center gap-0.5 shadow-xl active:scale-95 transition-all cursor-pointer backdrop-blur-xl"
        >
          <MaterialIcon name="anchor" size={22} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Pousar</span>
        </button>
      </div>
    </div>
  );
};
