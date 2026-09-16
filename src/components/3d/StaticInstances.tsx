import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

interface StaticInstancesProps {
  positions: readonly (readonly [number, number, number])[];
  children: React.ReactNode;
}

/** Identical, non-interactive details rendered with one draw call per material. */
export const StaticInstances: React.FC<StaticInstancesProps> = ({ positions, children }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) => {
      matrix.setPosition(...position);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions]);

  return <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>{children}</instancedMesh>;
};
