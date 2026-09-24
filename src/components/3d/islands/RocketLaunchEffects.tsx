import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';
import { RocketLaunch, type RocketPhase } from '../../../utils/rocketLaunch';

const PARTICLES = 48;
const noRaycast = () => {};

export function useRocketLaunch(paused: boolean) {
  const launch = useMemo(() => new RocketLaunch(), []);
  const rocketRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const materializeRef = useRef<THREE.Mesh>(null);
  const pool = useMemo(() => Array.from({ length: PARTICLES }, () => ({
    x: 0, y: 0, z: 0, age: 2, vx: 0, vy: 0, vz: 0,
  })), []);
  const scratch = useMemo(() => new THREE.Object3D(), []);
  const nozzle = useMemo(() => new THREE.Vector3(), []);
  const emission = useRef({ elapsed: 0, index: 0 });
  const soundPhase = useRef<RocketPhase | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        sounds.stopRocketLaunch();
        soundPhase.current = null;
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      sounds.stopRocketLaunch();
    };
  }, []);

  useEffect(() => {
    if (paused) {
      sounds.stopRocketLaunch();
      soundPhase.current = null;
    }
  }, [paused]);

  useFrame((_, delta) => {
    if (paused || document.hidden) return;
    const dt = Math.min(delta, 0.1);
    launch.update(dt);
    const audiblePhase = !sounds.isMuted && (launch.phase === 'ignition' || launch.phase === 'liftoff' || launch.phase === 'flying') ? launch.phase : null;
    if (soundPhase.current !== audiblePhase) {
      if (audiblePhase) {
        sounds.playRocketLaunchPhase(audiblePhase, launch.remainingSoundTime);
      } else {
        sounds.stopRocketLaunch();
      }
      soundPhase.current = audiblePhase;
    }
    const rocket = rocketRef.current;
    if (rocket) {
      rocket.position.set(launch.x, launch.y, launch.z);
      rocket.rotation.set(launch.tilt, 0, launch.roll);
      rocket.scale.setScalar(launch.scale);
      rocket.visible = launch.scale > 0;
      nozzle.set(0, -2.12, 0).applyEuler(rocket.rotation).add(rocket.position);
    }
    if (armRef.current) armRef.current.rotation.y = -launch.arm * Math.PI * 0.65;
    if (smokeRef.current) {
      smokeRef.current.rotation.y += dt * (launch.phase === 'ignition' ? 2.6 : 0.45);
      smokeRef.current.scale.set(launch.smoke, launch.smoke * 0.9, launch.smoke);
    }
    if (flameRef.current) {
      flameRef.current.visible = launch.exhaust > 0;
      const flicker = 1 + Math.sin(launch.time * 65) * 0.13;
      flameRef.current.scale.set(0.65 + launch.exhaust * 0.25, launch.exhaust * flicker, 0.65 + launch.exhaust * 0.25);
    }
    if (materializeRef.current) {
      const mesh = materializeRef.current;
      mesh.visible = launch.materialize > 0;
      mesh.position.y = 0.5 + launch.scale * 5;
      mesh.scale.setScalar(1 + launch.materialize * 0.7);
      (mesh.material as THREE.MeshBasicMaterial).opacity = launch.materialize * 0.85;
    }

    // Fixed pool: particles retain their island-local positions as the rocket leaves.
    const mesh = particlesRef.current;
    if (!mesh) return;
    if (!mesh.visible && launch.exhaust === 0) return;
    let alive = false;
    for (let i = 0; i < PARTICLES; i++) {
      const p = pool[i];
      p.age += dt;
      if (p.age < 1.2) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
      }
    }
    if (launch.exhaust > 0) {
      emission.current.elapsed += dt;
      while (emission.current.elapsed >= 0.03) {
        emission.current.elapsed -= 0.03;
        const index = emission.current.index++ % PARTICLES;
        const p = pool[index];
        const angle = index * 2.39996;
        p.x = nozzle.x;
        p.y = nozzle.y;
        p.z = nozzle.z;
        p.age = 0;
        p.vx = Math.cos(angle) * 1.3;
        p.vz = Math.sin(angle) * 1.3;
        p.vy = -2.5 - launch.exhaust * 2;
      }
    } else {
      emission.current.elapsed = 0;
    }
    for (let i = 0; i < PARTICLES; i++) {
      const p = pool[i];
      const life = Math.max(0, 1 - p.age / 1.2);
      alive ||= life > 0;
      scratch.position.set(p.x, p.y, p.z);
      scratch.scale.setScalar(life * (0.13 + p.age * 0.3));
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);
    }
    mesh.visible = alive;
    if (alive) mesh.instanceMatrix.needsUpdate = true;
  });

  const start = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (!paused && launch.start()) {
      sounds.playRocketLaunchPhase('ignition');
      soundPhase.current = sounds.isMuted ? null : 'ignition';
    }
  };

  return { rocketRef, armRef, smokeRef, flameRef, particlesRef, materializeRef, start };
}

export function RocketExhaust({ controller }: { controller: ReturnType<typeof useRocketLaunch> }) {
  return (
    <group ref={controller.flameRef} position={[0, -2.1, 0]} visible={false}>
      <mesh position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]} raycast={noRaycast}>
        <coneGeometry args={[0.48, 2.2, 8]} />
        <meshBasicMaterial color="#ff8a22" transparent opacity={0.75} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.55, 0]} rotation={[Math.PI, 0, 0]} raycast={noRaycast}>
        <coneGeometry args={[0.28, 1.1, 8]} />
        <meshBasicMaterial color="#fff5be" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function RocketLaunchEffects({ controller }: { controller: ReturnType<typeof useRocketLaunch> }) {
  return (
    <>
      <instancedMesh ref={controller.particlesRef} args={[undefined, undefined, PARTICLES]} visible={false} frustumCulled={false} raycast={noRaycast}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffbc66" transparent opacity={0.65} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <mesh ref={controller.materializeRef} position={[0.8, 0.5, -1.6]} rotation={[-Math.PI / 2, 0, 0]} visible={false} raycast={noRaycast}>
        <torusGeometry args={[1.2, 0.07, 6, 40]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
