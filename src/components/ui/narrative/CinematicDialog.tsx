import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { useDialogFocus } from './useDialogFocus';
import { NarrativePowerContext, useNarrativeMotion } from './useNarrativeMotion';
import './narrative.css';

interface Props {
  children: React.ReactNode;
  titleId: string;
  onClose: () => void;
  className?: string;
  layer?: number;
  lowPower?: boolean;
  suspended?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export function CinematicDialog({ children, titleId, onClose, className = '', layer = 40, lowPower = false, suspended = false, onKeyDown }: Props) {
  const panel = useDialogFocus(onClose, !suspended);
  const { reduced, simple } = useNarrativeMotion(lowPower);
  const duration = reduced ? 0.18 : 0.56;
  const transition = { duration, ease: [0.22, 1, 0.36, 1] as const };
  // A portal prevents a transformed parent panel from becoming a nested modal's viewport.
  return createPortal(
    <motion.div className="narrative-overlay" style={{ zIndex: layer }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
      {/* Fade a static blur surface with the zoom instead of repainting blur every frame. */}
      <div className={`narrative-backdrop ${simple ? 'narrative-backdrop-simple' : ''}`} aria-hidden="true" />
      <motion.div ref={panel} role="dialog" aria-modal={!suspended || undefined} aria-labelledby={titleId} tabIndex={-1} inert={suspended || undefined} onKeyDown={onKeyDown}
        initial={{ scale: simple ? 1 : 0.84, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: simple ? 1 : 1.025, opacity: 0 }} transition={transition}
        className={`narrative-dialog ${className}`}>
        <NarrativePowerContext.Provider value={lowPower}>{children}</NarrativePowerContext.Provider>
      </motion.div>
    </motion.div>, document.body,
  );
}
