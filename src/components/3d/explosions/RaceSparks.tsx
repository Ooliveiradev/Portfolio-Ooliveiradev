import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../../types';
import { sparkEvents } from './sparkEvents';

const MAX_SPARKS = 48;
const UP = new THREE.Vector3(0, 1, 0);
const COLORS = ['#fff7cc', '#facc15', '#fb923c'].map(color => new THREE.Color(color));

interface Spark {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  duration: number;
  size: number;
}

/** Small, short-lived streaks at race contacts; no shockwave, flash or explosion sound. */
export const RaceSparks: React.FC<{ graphicsQuality?: GraphicsQuality }> = ({ graphicsQuality = 'mid' }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const cursor = useRef(0);
  const transform = useMemo(() => new THREE.Object3D(), []);
  const direction = useMemo(() => new THREE.Vector3(), []);
  const sparks = useMemo<Spark[]>(() => Array.from({ length: MAX_SPARKS }, () => ({
    position: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    life: 0,
    duration: 0,
    size: 0,
  })), []);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    mesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    transform.scale.setScalar(0);
    transform.updateMatrix();
    for (let i = 0; i < MAX_SPARKS; i++) {
      mesh.current.setMatrixAt(i, transform.matrix);
      mesh.current.setColorAt(i, COLORS[0]);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [transform]);

  useEffect(() => sparkEvents.subscribe((position, intensity) => {
    const instance = mesh.current;
    if (!instance) return;
    const qualityCount = graphicsQuality === 'low' ? 6 : graphicsQuality === 'high' ? 11 : 8;
    const count = Math.max(3, Math.round(qualityCount * Math.min(intensity, 1.25)));
    for (let i = 0; i < count; i++) {
      const index = cursor.current++ % MAX_SPARKS;
      const spark = sparks[index];
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      spark.position.set(...position);
      spark.velocity.set(Math.cos(angle) * speed, 1.5 + Math.random() * 2.5, Math.sin(angle) * speed);
      spark.duration = 0.22 + Math.random() * 0.16;
      spark.life = spark.duration;
      spark.size = 0.6 + Math.random() * 0.55;
      instance.setColorAt(index, COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    if (instance.instanceColor) instance.instanceColor.needsUpdate = true;
  }), [graphicsQuality, sparks]);

  useFrame((_, delta) => {
    const instance = mesh.current;
    if (!instance) return;
    const dt = Math.min(delta, 0.05);
    let dirty = false;
    for (let i = 0; i < MAX_SPARKS; i++) {
      const spark = sparks[i];
      if (spark.life <= 0) continue;
      spark.life = Math.max(0, spark.life - dt);
      spark.position.addScaledVector(spark.velocity, dt);
      spark.velocity.y -= 8 * dt;
      spark.velocity.multiplyScalar(Math.exp(-3 * dt));
      transform.position.copy(spark.position);
      direction.copy(spark.velocity).normalize();
      transform.quaternion.setFromUnitVectors(UP, direction);
      transform.scale.setScalar(spark.size * spark.life / spark.duration);
      transform.updateMatrix();
      instance.setMatrixAt(i, transform.matrix);
      dirty = true;
    }
    if (dirty) instance.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX_SPARKS]} frustumCulled={false}>
      <cylinderGeometry args={[0.015, 0.03, 0.3, 3]} />
      <meshBasicMaterial transparent opacity={0.9} depthWrite={false} />
    </instancedMesh>
  );
};
