import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import RAPIER from '@dimforge/rapier3d-compat';

type PhysicsCallback = (delta: number) => void;
let rapierInitialization: Promise<void> | null = null;

interface RapierContextType {
  rapier: typeof RAPIER | null;
  world: RAPIER.World | null;
  isReady: boolean;
  registerPrePhysics: (cb: PhysicsCallback) => () => void;
  registerPostPhysics: (cb: PhysicsCallback) => () => void;
}

const RapierContext = createContext<RapierContextType>({
  rapier: null,
  world: null,
  isReady: false,
  registerPrePhysics: () => () => {},
  registerPostPhysics: () => () => {},
});

export const useRapier = () => useContext(RapierContext);

/**
 * usePrePhysics Hook
 * Inspiração: Folio-2025 (Bruno Simon "Player:pre-physics" & "PhysicalVehicle:pre-physics").
 * Executado rigorosamente ANTES do world.step() do Rapier.
 */
export const usePrePhysics = (callback: PhysicsCallback) => {
  const { registerPrePhysics } = useRapier();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    return registerPrePhysics((dt) => cbRef.current(dt));
  }, [registerPrePhysics]);
};

/**
 * usePostPhysics Hook
 * Inspiração: Folio-2025 (Bruno Simon "PhysicalVehicle:post-physics" & "Objects").
 * Executado rigorosamente DEPOIS do world.step() do Rapier e antes do render da câmera.
 */
export const usePostPhysics = (callback: PhysicsCallback) => {
  const { registerPostPhysics } = useRapier();
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    return registerPostPhysics((dt) => cbRef.current(dt));
  }, [registerPostPhysics]);
};

interface RapierPhysicsProviderProps {
  children: React.ReactNode;
  gravity?: [number, number, number];
  paused?: boolean;
}

export const RapierPhysicsProvider: React.FC<RapierPhysicsProviderProps> = ({
  children,
  gravity = [0, -22, 0],
  paused = false,
}) => {
  const [isReady, setIsReady] = useState(false);
  const rapierRef = useRef<typeof RAPIER | null>(null);
  const worldRef = useRef<RAPIER.World | null>(null);

  // Fila sequencial de callbacks rigorosamente sincronizados
  const prePhysicsListeners = useRef<Set<PhysicsCallback>>(new Set());
  const postPhysicsListeners = useRef<Set<PhysicsCallback>>(new Set());

  const registerPrePhysics = useCallback((cb: PhysicsCallback) => {
    prePhysicsListeners.current.add(cb);
    return () => {
      prePhysicsListeners.current.delete(cb);
    };
  }, []);

  const registerPostPhysics = useCallback((cb: PhysicsCallback) => {
    postPhysicsListeners.current.add(cb);
    return () => {
      postPhysicsListeners.current.delete(cb);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function initRapier() {
      try {
        // StrictMode/remounts share one WASM initialization.
        rapierInitialization ??= RAPIER.init();
        await rapierInitialization;
        if (!active) return;

        rapierRef.current = RAPIER;
        const g = { x: gravity[0], y: gravity[1], z: gravity[2] };
        worldRef.current = new RAPIER.World(g);
        setIsReady(true);
      } catch (err) {
        console.error('Failed to initialize Rapier WASM physics engine:', err);
      }
    }

    initRapier();

    return () => {
      active = false;
      if (worldRef.current) {
        worldRef.current.free();
        worldRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (worldRef.current) {
      worldRef.current.gravity = { x: gravity[0], y: gravity[1], z: gravity[2] };
    }
  }, [isReady, gravity[0], gravity[1], gravity[2]]);

  // Game Loop Sequenciado (Folio-2025 Architecture):
  // 1. Time / Delta Clamp
  // 2. Pre-Physics (Inputs -> Forças e Impulsos)
  // 3. Physics Simulation (Rapier Step)
  // 4. Post-Physics (Visual Sync dos Corpos Rígidos)
  useFrame((_, delta) => {
    if (paused) return;

    // Delta time clampado para prevenir saltos em quedas de quadros
    const dt = Math.min(delta, 0.05);

    // 1. Executa estágio Pre-Physics
    prePhysicsListeners.current.forEach((fn) => {
      try {
        fn(dt);
      } catch (e) {
        console.error('Pre-physics callback error:', e);
      }
    });

    // 2. Executa o passo físico da simulação
    if (worldRef.current && isReady) {
      worldRef.current.timestep = dt;
      worldRef.current.step();
    }

    // 3. Executa estágio Post-Physics (sync de transforms)
    postPhysicsListeners.current.forEach((fn) => {
      try {
        fn(dt);
      } catch (e) {
        console.error('Post-physics callback error:', e);
      }
    });
  });

  // HUD/vehicle updates must not invalidate every physics consumer.
  const contextValue = useMemo(() => ({
    rapier: rapierRef.current,
    world: worldRef.current,
    isReady,
    registerPrePhysics,
    registerPostPhysics,
  }), [isReady, registerPrePhysics, registerPostPhysics]);

  return (
    <RapierContext.Provider value={contextValue}>
      {children}
    </RapierContext.Provider>
  );
};
