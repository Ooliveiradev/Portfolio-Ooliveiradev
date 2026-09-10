import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';

interface InstancedAsteroidBeltProps {
  graphicsQuality?: GraphicsQuality;
  count?: number;
}

/**
 * InstancedAsteroidBelt
 * Cinturão orbital de alta densidade colapsado em 1 única Draw Call via InstancedMesh.
 * Otimização de elite do Tier 3 (#18) inspirada em motores gráficos AAA.
 */
export const InstancedAsteroidBelt: React.FC<InstancedAsteroidBeltProps> = ({
  graphicsQuality = 'mid',
  count,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const instanceCount = useMemo(() => {
    if (count !== undefined) return count;
    return graphicsQuality === 'low' ? 60 : graphicsQuality === 'high' ? 160 : 110;
  }, [count, graphicsQuality]);

  // Pre-calculate randomized orbital transformations
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const asteroidColors = useMemo(() => [
    new THREE.Color('#475569'),
    new THREE.Color('#334155'),
    new THREE.Color('#64748b'),
    new THREE.Color('#1e293b'),
    new THREE.Color('#52525b'),
  ], []);

  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < instanceCount; i++) {
      // Ring distribution between 42 and 85 units from the sun
      const angle = (i / instanceCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const radius = 42 + Math.random() * 44;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 6.5;

      const scale = 0.45 + Math.random() * 0.95;

      dummy.position.set(x, y, z);
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Varied slate/stone colors
      const chosenColor = asteroidColors[i % asteroidColors.length];
      meshRef.current.setColorAt(i, chosenColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [instanceCount, dummy, asteroidColors]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Slow orbital revolution around the central sun
      groupRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, instanceCount]}
        castShadow={false}
        receiveShadow={graphicsQuality !== 'low'}
      >
        <dodecahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          roughness={0.8}
          metalness={0.15}
          flatShading
        />
      </instancedMesh>
    </group>
  );
};
