import { useEffect, useState } from 'react';

/** Local UI clock: no work while hidden, stopped or unmounted. */
export function useVisibleTick(intervalMs: number, enabled = true) {
  const [time, setTime] = useState(() => performance.now());
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const syncVisibility = () => {
      clearInterval(timer);
      if (!document.hidden) {
        setTime(performance.now());
        timer = setInterval(() => setTime(performance.now()), intervalMs);
      }
    };
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [intervalMs, enabled]);
  return time;
}
