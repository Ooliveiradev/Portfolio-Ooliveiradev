import { createContext, useContext, useEffect, useState } from 'react';

export const NarrativePowerContext = createContext(false);

export function useNarrativeMotion(lowPower?: boolean) {
  const inheritedLowPower = useContext(NarrativePowerContext);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [small, setSmall] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setSmall(query.matches);
    const updateMotion = () => setReduced(motionQuery.matches);
    query.addEventListener('change', update);
    motionQuery.addEventListener('change', updateMotion);
    return () => { query.removeEventListener('change', update); motionQuery.removeEventListener('change', updateMotion); };
  }, []);
  return { reduced: Boolean(reduced), simple: Boolean(reduced) || small || (lowPower ?? inheritedLowPower) };
}
