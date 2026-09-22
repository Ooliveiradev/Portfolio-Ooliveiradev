import RAPIER from '@dimforge/rapier3d-compat';
import { createTrackRocks, RACE_OBSTACLES } from './raceTrack';

export function addRaceBarriers(world: RAPIER.World, rocks: ReturnType<typeof createTrackRocks>) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  body.userData = { raceBarrier: true };
  rocks.forEach(({ position, radius }) => {
    world.createCollider(RAPIER.ColliderDesc.ball(radius)
      .setTranslation(position.x, position.y, position.z).setRestitution(0).setFriction(0), body);
  });
  RACE_OBSTACLES.forEach(({ position, radius }) => {
    world.createCollider(RAPIER.ColliderDesc.ball(radius)
      .setTranslation(position.x, position.y, position.z).setRestitution(0).setFriction(0)
      .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Min)
      .setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min), body);
  });
  return body;
}
