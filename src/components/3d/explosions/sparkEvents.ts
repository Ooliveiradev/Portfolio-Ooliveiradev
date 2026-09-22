type SparkListener = (position: [number, number, number], intensity: number) => void;

const listeners = new Set<SparkListener>();

export const sparkEvents = {
  subscribe(listener: SparkListener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  emit(position: [number, number, number], intensity = 1) {
    listeners.forEach(listener => listener(position, intensity));
  },
};
