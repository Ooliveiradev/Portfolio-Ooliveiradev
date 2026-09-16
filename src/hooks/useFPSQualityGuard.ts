import { useState, useEffect, useRef } from 'react';
import { GraphicsQuality } from '../types';
import { FrameRateMonitor } from '../utils/frameRateMonitor';

interface UseFPSQualityGuardOptions {
  currentQuality: GraphicsQuality;
  onAutoAdjustQuality?: (newQuality: GraphicsQuality) => void;
  enabled?: boolean;
  /** Enable React updates only when an FPS readout is actually displayed. */
  trackFps?: boolean;
}

export function useFPSQualityGuard({
  currentQuality,
  onAutoAdjustQuality,
  enabled = true,
  trackFps = false,
}: UseFPSQualityGuardOptions) {
  const [fps, setFps] = useState(60);
  const callbackRef = useRef(onAutoAdjustQuality);
  callbackRef.current = onAutoAdjustQuality;
  const monitorRef = useRef<FrameRateMonitor | null>(null);
  monitorRef.current ??= new FrameRateMonitor(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let animationFrame = 0;
    const monitor = monitorRef.current!;
    monitor.reset(performance.now());

    const loop = (now: number) => {
      if (document.hidden) return;
      const sample = monitor.recordFrame(now, currentQuality);
      if (sample) {
        if (trackFps) setFps(sample.fps);
        if (sample.suggestedQuality) callbackRef.current?.(sample.suggestedQuality);
      }
      animationFrame = requestAnimationFrame(loop);
    };

    const handleVisibility = () => {
      cancelAnimationFrame(animationFrame);
      monitor.reset(performance.now());
      if (!document.hidden) animationFrame = requestAnimationFrame(loop);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    if (!document.hidden) animationFrame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrame);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, currentQuality, trackFps]);

  return { fps };
}
