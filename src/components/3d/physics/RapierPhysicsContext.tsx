import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import RAPIER from '@dimforge/rapier3d-compat';

interface RapierContextType {
  rapier: typeof RAPIER | null;
  world: RAPIER.World | null;
  isReady: boolean;
}

const RapierContext = createContext<RapierContextType>({
  rapier: null,
  world: null,
  isReady: false,
});

export const useRapier = () => useContext(RapierContext);

interface RapierPhysicsProviderProps {
  children: React.ReactNode;
  gravity?: [number, number, number];
}

export const RapierPhysicsProvider: React.FC<RapierPhysicsProviderProps> = ({
  children,
  gravity = [0, -22, 0],
}) => {
  const [isReady, setIsReady] = useState(false);
  const rapierRef = useRef<typeof RAPIER | null>(null);
  const worldRef = useRef<RAPIER.World | null>(null);

  useEffect(() => {
    let active = true;

    async function initRapier() {
      try {
        await RAPIER.init();
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
  }, [gravity[0], gravity[1], gravity[2]]);

  // Physics simulation loop strictly in sync with requestAnimationFrame
  useFrame((_, delta) => {
    if (worldRef.current && isReady) {
      // Step the physics world with capped delta time for stability
      const dt = Math.min(delta, 0.05);
      worldRef.current.timestep = dt;
      worldRef.current.step();
    }
  });

  return (
    <RapierContext.Provider
      value={{
        rapier: rapierRef.current,
        world: worldRef.current,
        isReady,
      }}
    >
      {children}
    </RapierContext.Provider>
  );
};
