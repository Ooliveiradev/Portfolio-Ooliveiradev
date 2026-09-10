import { useState, useEffect, useRef } from 'react';
import { GraphicsQuality } from '../types';

interface UseFPSQualityGuardOptions {
  currentQuality: GraphicsQuality;
  onAutoAdjustQuality?: (newQuality: GraphicsQuality) => void;
  enabled?: boolean;
}

export function useFPSQualityGuard({
  currentQuality,
  onAutoAdjustQuality,
  enabled = true,
}: UseFPSQualityGuardOptions) {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const lowFpsStartTimeRef = useRef<number | null>(null);
  const lastDowngradeTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) return;

    let animId: number;

    const loop = (now: number) => {
      frameCountRef.current++;
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        const calculatedFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(calculatedFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;

        // Auto-throttle protection if FPS stays under 34 for > 2.0 seconds
        if (calculatedFps < 34) {
          if (!lowFpsStartTimeRef.current) {
            lowFpsStartTimeRef.current = now;
          } else if (now - lowFpsStartTimeRef.current > 2000) {
            // Check cooldown between downgrades (at least 8s)
            if (Date.now() - lastDowngradeTimeRef.current > 8000) {
              if (currentQuality === 'high') {
                onAutoAdjustQuality?.('mid');
                lastDowngradeTimeRef.current = Date.now();
                lowFpsStartTimeRef.current = null;
              } else if (currentQuality === 'mid') {
                onAutoAdjustQuality?.('low');
                lastDowngradeTimeRef.current = Date.now();
                lowFpsStartTimeRef.current = null;
              }
            }
          }
        } else {
          lowFpsStartTimeRef.current = null;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [enabled, currentQuality, onAutoAdjustQuality]);

  return { fps };
}
