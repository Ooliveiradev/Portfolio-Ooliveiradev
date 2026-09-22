import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useRapier } from './physics/RapierPhysicsContext';
import { createTrackRocks, raceCurve, TRACK_HALF_WIDTH, RACE_OBSTACLES } from '../../utils/raceTrack';
import { addRaceBarriers } from '../../utils/raceTrackPhysics';

export const AsteroidTrack = () => {
  const { world, rapier, isReady } = useRapier();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const markings = useRef<THREE.InstancedMesh>(null);
  const curbs = useRef<THREE.InstancedMesh>(null);
  const rocks = useMemo(createTrackRocks, []);
  const road = useMemo(() => {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= 512; i++) {
      const p = raceCurve.getPointAt(i / 512), t = raceCurve.getTangentAt(i / 512);
      for (const side of [-1, 1]) vertices.push(p.x + t.z * side * (TRACK_HALF_WIDTH - 1.6), -0.3, p.z - t.x * side * (TRACK_HALF_WIDTH - 1.6));
      if (i < 512) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    return geometry;
  }, []);
  useEffect(() => () => road.dispose(), [road]);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    rocks.forEach((rock, i) => {
      dummy.position.copy(rock.position);
      dummy.rotation.set(rock.rotation, rock.rotation * 0.7, rock.rotation * 0.3);
      dummy.scale.setScalar(rock.radius);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      mesh.current!.setColorAt(i, new THREE.Color(i % 7 === 0 ? '#64748b' : i % 3 === 0 ? '#726881' : '#424b60'));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    if (curbs.current) {
      for (let i = 0; i < 320; i++) {
        const distance = Math.floor(i / 2) / 160, side = i % 2 ? 1 : -1;
        const p = raceCurve.getPointAt(distance), t = raceCurve.getTangentAt(distance);
        dummy.position.set(p.x + t.z * side * 15.5, -0.22, p.z - t.x * side * 15.5);
        dummy.rotation.set(0, Math.atan2(t.x, t.z), 0);
        dummy.scale.set(0.45, 0.06, 2.6);
        dummy.updateMatrix();
        curbs.current.setMatrixAt(i, dummy.matrix);
        curbs.current.setColorAt(i, new THREE.Color(Math.floor(i / 2) % 4 < 2 ? '#5ba8b6' : '#28424a'));
      }
      curbs.current.instanceMatrix.needsUpdate = true;
      if (curbs.current.instanceColor) curbs.current.instanceColor.needsUpdate = true;
      curbs.current.computeBoundingSphere();
    }
    if (markings.current) {
      for (let i = 0; i < 80; i++) {
        const p = raceCurve.getPointAt(i / 80), t = raceCurve.getTangentAt(i / 80);
        dummy.position.set(p.x, -0.24, p.z);
        dummy.rotation.set(0, Math.atan2(t.x, t.z), 0);
        dummy.scale.set(0.12, 0.025, 2.2);
        dummy.updateMatrix();
        markings.current.setMatrixAt(i, dummy.matrix);
      }
      markings.current.instanceMatrix.needsUpdate = true;
      markings.current.computeBoundingSphere();
    }
  }, [rocks]);
  useEffect(() => {
    if (!world || !rapier || !isReady) return;
    const body = addRaceBarriers(world, rocks);
    return () => { if (world.getRigidBody(body.handle)) world.removeRigidBody(body); };
  }, [world, rapier, isReady, rocks]);
  return <group>
    <mesh geometry={road}><meshBasicMaterial color="#102833" side={THREE.DoubleSide} /></mesh>
    <instancedMesh ref={curbs} args={[undefined, undefined, 320]}>
      <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial />
    </instancedMesh>
    {RACE_OBSTACLES.map(obstacle => <group key={obstacle.id} position={obstacle.position} rotation={[0, obstacle.yaw, 0]}>
      <mesh scale={obstacle.radius} rotation={[0.25, obstacle.id * 1.7, 0.2]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#9c7654" roughness={0.8} flatShading />
      </mesh>
    </group>)}
    <instancedMesh ref={markings} args={[undefined, undefined, 80]}>
      <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#557c88" />
    </instancedMesh>
    <instancedMesh ref={mesh} args={[undefined, undefined, rocks.length]}>
    <icosahedronGeometry args={[1, 1]} />
    <meshStandardMaterial color="#b9c5dd" roughness={0.95} metalness={0.2} flatShading />
  </instancedMesh></group>;
};
