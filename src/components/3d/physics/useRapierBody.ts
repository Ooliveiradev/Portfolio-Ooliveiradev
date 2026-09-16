import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { useRapier, usePostPhysics } from './RapierPhysicsContext';

export type ColliderShape =
  | { type: 'cuboid'; halfExtents: [number, number, number] }
  | { type: 'ball'; radius: number }
  | { type: 'cylinder'; halfHeight: number; radius: number }
  | { type: 'capsule'; halfHeight: number; radius: number };

export interface UseRapierBodyOptions {
  type?: 'dynamic' | 'fixed' | 'kinematicPositionBased';
  position?: [number, number, number];
  rotation?: [number, number, number, number] | [number, number, number]; // quaternion [x,y,z,w] or euler [x,y,z]
  shape: ColliderShape;
  mass?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  canSleep?: boolean;
}

export function useRapierBody<T extends THREE.Object3D>(
  options: UseRapierBodyOptions
) {
  const { rapier, world, isReady } = useRapier();
  const ref = useRef<T>(null);
  const bodyRef = useRef<RAPIER.RigidBody | null>(null);
  const colliderRef = useRef<RAPIER.Collider | null>(null);
  const wasSleepingRef = useRef(false);

  useEffect(() => {
    if (!isReady || !world || !rapier) return;

    const {
      type = 'dynamic',
      position = [0, 0, 0],
      rotation,
      shape,
      mass,
      friction = 0.5,
      restitution = 0.3,
      linearDamping = 0.2,
      angularDamping = 0.3,
      canSleep = true,
    } = options;

    let bodyDesc: RAPIER.RigidBodyDesc;
    if (type === 'fixed') {
      bodyDesc = rapier.RigidBodyDesc.fixed();
    } else if (type === 'kinematicPositionBased') {
      bodyDesc = rapier.RigidBodyDesc.kinematicPositionBased();
    } else {
      bodyDesc = rapier.RigidBodyDesc.dynamic();
    }

    bodyDesc.setTranslation(position[0], position[1], position[2]);

    if (rotation) {
      if (rotation.length === 4) {
        bodyDesc.setRotation({
          x: rotation[0],
          y: rotation[1],
          z: rotation[2],
          w: rotation[3],
        });
      } else {
        const q = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rotation[0], rotation[1], rotation[2])
        );
        bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
      }
    }

    bodyDesc.setLinearDamping(linearDamping);
    bodyDesc.setAngularDamping(angularDamping);
    bodyDesc.setCanSleep(canSleep);

    const body = world.createRigidBody(bodyDesc);
    bodyRef.current = body;
    wasSleepingRef.current = false;

    let colliderDesc: RAPIER.ColliderDesc;
    switch (shape.type) {
      case 'cuboid':
        colliderDesc = rapier.ColliderDesc.cuboid(
          shape.halfExtents[0],
          shape.halfExtents[1],
          shape.halfExtents[2]
        );
        break;
      case 'ball':
        colliderDesc = rapier.ColliderDesc.ball(shape.radius);
        break;
      case 'cylinder':
        colliderDesc = rapier.ColliderDesc.cylinder(
          shape.halfHeight,
          shape.radius
        );
        break;
      case 'capsule':
        colliderDesc = rapier.ColliderDesc.capsule(
          shape.halfHeight,
          shape.radius
        );
        break;
    }

    colliderDesc.setFriction(friction);
    colliderDesc.setRestitution(restitution);
    if (mass !== undefined) {
      colliderDesc.setMass(mass);
    }

    const collider = world.createCollider(colliderDesc, body);
    colliderRef.current = collider;

    return () => {
      if (world && body) {
        world.removeRigidBody(body);
        bodyRef.current = null;
        colliderRef.current = null;
      }
    };
  }, [isReady, world, rapier]);

  // Sincronização visual em fase Post-Physics: executado exatamente após o step do Rapier
  usePostPhysics(() => {
    if (!bodyRef.current || !ref.current || options.type === 'fixed') return;

    // Copy the final resting transform once, then leave sleeping objects alone.
    const sleeping = bodyRef.current.isSleeping();
    if (sleeping && wasSleepingRef.current) return;
    wasSleepingRef.current = sleeping;

    const t = bodyRef.current.translation();
    const r = bodyRef.current.rotation();

    ref.current.position.set(t.x, t.y, t.z);
    ref.current.quaternion.set(r.x, r.y, r.z, r.w);
  });

  return { ref, bodyRef, colliderRef };
}
