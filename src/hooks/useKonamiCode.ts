import { useEffect, useRef } from 'react';

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

/**
 * useKonamiCode
 * Detecta a digitação da sequência do Konami Code (↑ ↑ ↓ ↓ ← → ← → B A) no teclado.
 */
export function useKonamiCode(onSuccess: () => void) {
  const currentIndex = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const expectedKey = KONAMI_SEQUENCE[currentIndex.current];

      if (key === expectedKey.toLowerCase()) {
        currentIndex.current += 1;
        if (currentIndex.current === KONAMI_SEQUENCE.length) {
          currentIndex.current = 0;
          onSuccess();
        }
      } else {
        // Se a tecla pressionada corresponder à primeira da sequência, recomeça do índice 1
        currentIndex.current = key === KONAMI_SEQUENCE[0].toLowerCase() ? 1 : 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSuccess]);
}
