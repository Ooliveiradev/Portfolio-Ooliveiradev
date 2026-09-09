import React, { useRef, useState, useCallback } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';

interface MobileControlsProps {
  onInputChange: (input: { x: number; y: number; boost: boolean }) => void;
  onDockNearest: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInputChange,
  onDockNearest,
}) => {
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  const maxRadius = 45;

  const handleTouchMove = useCallback(
    (touchX: number, touchY: number) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = touchX - centerX;
      let dy = touchY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized vector (-1 to 1)
      const normX = dx / maxRadius;
      const normY = dy / maxRadius;

      onInputChange({
        x: normX,
        y: normY,
        boost: isBoosting,
      });
    },
    [isBoosting, onInputChange]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    handleTouchMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onInputChange({ x: 0, y: 0, boost: isBoosting });
  };

  const toggleBoost = (active: boolean) => {
    setIsBoosting(active);
    if (active) sounds.playBoost();
    onInputChange({
      x: knobPos.x / maxRadius,
      y: knobPos.y / maxRadius,
      boost: active,
    });
  };

  return (
    <div className="sm:hidden absolute inset-x-0 bottom-16 z-25 pointer-events-none flex items-end justify-between px-5 pb-2">
      {/* Virtual Joystick (Left) */}
      <div
        ref={joystickBaseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={(e) => {
          e.preventDefault();
          if (isDragging) {
            handleTouchMove(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-[#0c1017]/90 border border-slate-800/80 backdrop-blur-xl relative flex items-center justify-center pointer-events-auto touch-none shadow-2xl active:border-sky-400/80 transition-colors"
      >
        {/* Direction Cross Markings */}
        <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
          <div className="w-16 h-0.5 bg-slate-500" />
          <div className="h-16 w-0.5 bg-slate-500 absolute" />
        </div>

        {/* Joystick Thumb Knob */}
        <div
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg border border-sky-400/40 absolute transition-transform pointer-events-none"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        />
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Boost Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            toggleBoost(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            toggleBoost(false);
          }}
          onMouseDown={() => toggleBoost(true)}
          onMouseUp={() => toggleBoost(false)}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 border shadow-xl transition-all cursor-pointer backdrop-blur-xl select-none touch-none ${
            isBoosting
              ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 scale-95 ring-2 ring-amber-400/30'
              : 'bg-[#0c1017]/90 text-amber-400/90 border-slate-800/80 hover:border-amber-500/40 active:scale-95'
          }`}
        >
          <MaterialIcon name="rocket_launch" size={22} />
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider">Turbo</span>
        </button>

        {/* Quick Dock Button */}
        <button
          onClick={() => {
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
