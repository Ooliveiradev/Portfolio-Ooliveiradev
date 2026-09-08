type ExplosionListener = (pos: [number, number, number], scale?: number) => void;

const listeners: Set<ExplosionListener> = new Set();

export const explosionEvents = {
  subscribe(fn: ExplosionListener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  emit(pos: [number, number, number], scale: number = 1) {
    listeners.forEach((fn) => fn(pos, scale));
  },
};
