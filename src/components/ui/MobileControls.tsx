import React, { useRef, useState, useCallback, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';
import { createVehicleInput, type VehicleInput } from '../../utils/gameInput';
import { sampleJoystick } from '../../utils/joystick';
import { useTouchLayout } from '../../hooks/useTouchLayout';
import { useI18n } from '../../i18n/I18nProvider';

interface MobileControlsProps {
  virtualInputRef?: React.MutableRefObject<VehicleInput>;
  onInputChange?: (input: VehicleInput) => void;
  onDockNearest: () => void;
  enabled?: boolean;
  dockingAvailable?: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  virtualInputRef,
  onInputChange,
  onDockNearest,
  enabled = true,
  dockingAvailable = true,
}) => {
  const touchLayout = useTouchLayout();
  const active = enabled && touchLayout;
  const { locale } = useI18n();
  const baseRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const boostRef = useRef<HTMLButtonElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const input = useRef(createVehicleInput());
  const joystickPointer = useRef<number | null>(null);
  const boostPointer = useRef<number | null>(null);
  const dockPointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const lastTouchDock = useRef(-Infinity);
  const joystickCenter = useRef({ x: 0, y: 0 });
  const [isBoosting, setIsBoosting] = useState(false);
  const eventState = useRef({ enabled: active, virtualInputRef, onInputChange });
  eventState.current = { enabled: active, virtualInputRef, onInputChange };

  const publishInput = useCallback((changes: Partial<VehicleInput>) => {
    Object.assign(input.current, changes);
    const { virtualInputRef: target, onInputChange: callback } = eventState.current;
    if (target) Object.assign(target.current, input.current);
    else callback?.({ ...input.current });
  }, []);

  const resetInput = useCallback(() => {
    const joystickId = joystickPointer.current;
    const boostId = boostPointer.current;
    joystickPointer.current = null;
    boostPointer.current = null;
    dockPointer.current = null;
    if (joystickId !== null && zoneRef.current?.hasPointerCapture(joystickId)) zoneRef.current.releasePointerCapture(joystickId);
    if (boostId !== null && boostRef.current?.hasPointerCapture(boostId)) boostRef.current.releasePointerCapture(boostId);
    if (baseRef.current) {
      baseRef.current.style.left = '';
      baseRef.current.style.top = '';
      baseRef.current.removeAttribute('data-active');
    }
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    publishInput({ x: 0, y: 0, boost: false });
    setIsBoosting(false);
  }, [publishInput]);

  useEffect(() => {
    if (!active) resetInput();
  }, [active, resetInput]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) resetInput();
    };
    window.addEventListener('blur', resetInput);
    window.addEventListener('resize', resetInput);
    window.addEventListener('orientationchange', resetInput);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', resetInput);
      window.removeEventListener('resize', resetInput);
      window.removeEventListener('orientationchange', resetInput);
      document.removeEventListener('visibilitychange', handleVisibility);
      publishInput({ x: 0, y: 0, boost: false });
    };
  }, [resetInput, publishInput]);

  const moveJoystick = (clientX: number, clientY: number) => {
    const value = sampleJoystick(clientX - joystickCenter.current.x, clientY - joystickCenter.current.y);
    // Keep pointer movement off React's render path and out of the scene tree.
    if (knobRef.current) knobRef.current.style.transform = `translate(${value.knobX}px, ${value.knobY}px)`;
    publishInput({ x: value.x, y: value.y });
  };

  const endJoystick = (event: React.PointerEvent) => {
    if (event.pointerId !== joystickPointer.current) return;
    joystickPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (baseRef.current) {
      baseRef.current.style.left = '';
      baseRef.current.style.top = '';
      baseRef.current.removeAttribute('data-active');
    }
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    publishInput({ x: 0, y: 0 });
  };

  const endBoost = (event: React.PointerEvent) => {
    if (event.pointerId !== boostPointer.current) return;
    boostPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    publishInput({ boost: false });
    setIsBoosting(false);
  };

  if (!active) return null;

  return (
    <div className="mobile-controls" aria-label={locale === 'pt' ? 'Controles de voo' : 'Flight controls'} onContextMenu={event => event.preventDefault()}>
      <div
        ref={zoneRef}
        className="joystick-zone"
        role="group"
        aria-label={locale === 'pt' ? 'Joystick: arraste na direção em que deseja voar' : 'Joystick: drag in the direction you want to fly'}
        onPointerDown={(event) => {
          if (!eventState.current.enabled || event.button !== 0 || joystickPointer.current !== null) return;
          event.preventDefault();
          const rect = event.currentTarget.getBoundingClientRect();
          // The first contact is always neutral, even at the edge of the zone.
          joystickCenter.current.x = event.clientX;
          joystickCenter.current.y = event.clientY;
          if (baseRef.current) {
            baseRef.current.style.left = `${Math.max(60, Math.min(rect.width - 60, event.clientX - rect.left))}px`;
            baseRef.current.style.top = `${Math.max(60, Math.min(rect.height - 60, event.clientY - rect.top))}px`;
            baseRef.current.setAttribute('data-active', 'true');
          }
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
      >
        <div ref={baseRef} className="joystick-base">
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <div className="w-16 h-0.5 bg-slate-500" />
            <div className="h-16 w-0.5 bg-slate-500 absolute" />
          </div>
          <div
            ref={knobRef}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg border border-sky-400/40 absolute pointer-events-none"
            style={{ transform: 'translate(0px, 0px)' }}
          />
        </div>
        <span className="joystick-hint">{locale === 'pt' ? 'Arraste para pilotar' : 'Drag to fly'}</span>
      </div>

      <div className="mobile-flight-actions">
        <button
          ref={boostRef}
          type="button"
          aria-label={locale === 'pt' ? 'Turbo: segure para acelerar' : 'Turbo: hold to boost'}
          aria-pressed={isBoosting}
          onPointerDown={(event) => {
            if (!eventState.current.enabled || event.button !== 0 || boostPointer.current !== null) return;
            event.preventDefault();
            boostPointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            publishInput({ boost: true });
            setIsBoosting(true);
            // The vehicle plays the boost sound once when sampled.
          }}
          onPointerUp={endBoost}
          onPointerCancel={endBoost}
          onLostPointerCapture={endBoost}
          className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 border shadow-xl transition-all cursor-pointer backdrop-blur-xl select-none touch-none ${
            isBoosting
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 scale-95 ring-2 ring-amber-400/30'
              : 'bg-[#0c1017]/90 text-amber-400/90 border-slate-800/80 hover:border-amber-500/40 active:scale-95'
          }`}
        >
          <MaterialIcon name="rocket_launch" size={22} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Turbo</span>
        </button>

        {dockingAvailable && <button
          type="button"
          aria-label={locale === 'pt' ? 'Aproximar e acessar a ilha mais próxima' : 'Approach and open the nearest island'}
          onPointerDown={event => {
            if (event.pointerType !== 'touch' || !eventState.current.enabled) return;
            dockPointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerCancel={() => { dockPointer.current = null; }}
          onLostPointerCapture={() => { dockPointer.current = null; }}
          onPointerUp={event => {
            const contact = dockPointer.current;
            if (!contact || contact.id !== event.pointerId) return;
            dockPointer.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
            if (!eventState.current.enabled || Math.hypot(event.clientX - contact.x, event.clientY - contact.y) > 14) return;
            // A second finger must work while the joystick owns the primary touch;
            // browsers may suppress synthetic clicks after a prevented touch gesture.
            lastTouchDock.current = performance.now();
            resetInput();
            sounds.playClick();
            onDockNearest();
          }}
          onClick={event => {
            if (!eventState.current.enabled) return;
            if (event.detail > 0 && performance.now() - lastTouchDock.current < 700) return;
            resetInput();
            sounds.playClick();
            onDockNearest();
          }}
          className="w-16 h-16 rounded-2xl bg-[#0c1017]/90 hover:bg-[#111622] text-sky-400 border border-slate-800/80 hover:border-sky-500/40 flex flex-col items-center justify-center gap-0.5 shadow-xl active:scale-95 transition-all cursor-pointer backdrop-blur-xl"
        >
          <MaterialIcon name="anchor" size={22} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{locale === 'pt' ? 'Pousar' : 'Dock'}</span>
        </button>}
      </div>
    </div>
  );
};
