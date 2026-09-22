import * as THREE from 'three';

export type RaceState = 'idle' | 'countdown' | 'racing' | 'finished';
export const TRACK_VERSION = 6;
export const TRACK_HALF_WIDTH = 18;
export const RACE_CHECKPOINT_HALF_WIDTH = TRACK_HALF_WIDTH - 3;
export const RACE_GATE_COUNT = 12;
// Exploration portals remain near the islands; the race uses its own outer loop.
const points = [[18, 1, 18], [46, 1, -14], [34, 1, -58], [-36, 1, -76], [-88, 1, 38], [-22, 1, 26]];
const explorationCurve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), true, 'centripetal');
export const SPEED_RINGS = points.map((p, id) => {
  const tangent = explorationCurve.getTangent(id / points.length).normalize();
  return { id, position: p as [number, number, number], rotationY: Math.atan2(tangent.x, tangent.z), forward: tangent.toArray() as [number, number, number] };
});

const circuitRadius = (angle: number) => 114.5 + 7 * Math.sin(angle * 3) + 8 * Math.sin(angle * 5 + 3.6) + 2 * Math.cos(angle * 2 + 0.4);

/** Asymmetric sweeping turns and five S-bend sequences, without spline seams or hairpins.
 * The outer wall stays inside the 150-unit boundary warning, even at wave crests. */
class GalacticCircuit extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); this.arcLengthDivisions = 2048; }

  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2;
    const radius = circuitRadius(angle);
    return target.set(Math.sin(angle) * radius, 1, Math.cos(angle) * radius);
  }

  getTangent(t: number, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 2;
    const radius = circuitRadius(angle);
    const radialSlope = 21 * Math.cos(angle * 3) + 40 * Math.cos(angle * 5 + 3.6) - 4 * Math.sin(angle * 2 + 0.4);
    return target.set(
      Math.cos(angle) * radius + Math.sin(angle) * radialSlope,
      0,
      -Math.sin(angle) * radius + Math.cos(angle) * radialSlope,
    ).normalize();
  }
}

export const raceCurve = new GalacticCircuit();
export const RACE_GATES = Array.from({ length: RACE_GATE_COUNT }, (_, id) => {
  const distance = id / RACE_GATE_COUNT;
  const tangent = raceCurve.getTangentAt(distance);
  return { id, position: raceCurve.getPointAt(distance).toArray() as [number, number, number],
    rotationY: Math.atan2(tangent.x, tangent.z), forward: tangent.toArray() as [number, number, number] };
});
// Gate zero is the finish line: a race always completes a full closed lap.
export const RACE_CHECKPOINTS = [...RACE_GATES.slice(1), RACE_GATES[0]];
export const RACE_GRID = { position: RACE_GATES[0].position, yaw: RACE_GATES[0].rotationY };

/** Fixed, readable slalom hazards with open escape routes and no blocked checkpoints. */
export const RACE_OBSTACLES = [
  { distance: 0.042, offset: -5, radius: 2 },
  { distance: 0.125, offset: 6, radius: 2.5 },
  { distance: 0.192, offset: -7, radius: 1.8 },
  { distance: 0.225, offset: 7, radius: 2.2 },
  { distance: 0.292, offset: 0, radius: 2.4 },
  { distance: 0.375, offset: -5, radius: 2 },
  { distance: 0.442, offset: 7, radius: 2.2 },
  { distance: 0.475, offset: -7, radius: 2.4 },
  { distance: 0.542, offset: 0, radius: 2.1 },
  { distance: 0.625, offset: 5, radius: 2.3 },
  { distance: 0.692, offset: -7, radius: 2 },
  { distance: 0.725, offset: 7, radius: 2.1 },
  { distance: 0.792, offset: 0, radius: 1.9 },
  { distance: 0.858, offset: 7, radius: 2.3 },
  { distance: 0.892, offset: -7, radius: 2 },
  { distance: 0.958, offset: 4, radius: 2.2 },
].map((obstacle, id) => {
  const point = raceCurve.getPointAt(obstacle.distance), tangent = raceCurve.getTangentAt(obstacle.distance);
  point.add(new THREE.Vector3(tangent.z, 0, -tangent.x).multiplyScalar(obstacle.offset));
  return { ...obstacle, id, position: point, yaw: Math.atan2(tangent.x, tangent.z) };
});

/** Swept, forward-only gate crossing, including frames that skip over the plane. */
export function crossGate(previous: THREE.Vector3, current: THREE.Vector3, gate: typeof SPEED_RINGS[number], halfWidth = 3.05): number | null {
  const [x, y, z] = gate.position;
  const [fx, , fz] = gate.forward;
  const before = (previous.x - x) * fx + (previous.z - z) * fz;
  const after = (current.x - x) * fx + (current.z - z) * fz;
  if (before >= 0 || after < 0) return null;
  const t = -before / (after - before);
  const dx = previous.x + (current.x - previous.x) * t - x;
  const dy = previous.y + (current.y - previous.y) * t - y;
  const dz = previous.z + (current.z - previous.z) * t - z;
  const radius = Math.hypot(dx, dy, dz);
  const lateral = Math.abs(dx * fz - dz * fx);
  return halfWidth === 3.05 ? (radius <= 3.05 ? radius : null) : (lateral <= halfWidth && Math.abs(dy) <= 3.5 ? lateral : null);
}

/** Overlapping rocks form two continuous closed walls, independent of graphics quality. */
export function createTrackRocks() {
  const count = Math.ceil(raceCurve.getLength() / 2.2);
  return [-1, 1].flatMap(side => {
    const wall = Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const p = raceCurve.getPointAt(t);
      const tangent = raceCurve.getTangentAt(t);
      p.add(new THREE.Vector3(tangent.z, 0, -tangent.x).multiplyScalar(side * TRACK_HALF_WIDTH));
      return p;
    });
    // Outer bends are longer than the centerline; subdivide those gaps too.
    return wall.flatMap((p, i) => {
      const next = wall[(i + 1) % wall.length];
      const steps = Math.ceil(p.distanceTo(next) / 2.8);
      return Array.from({ length: steps }, (_, step) => ({
        position: p.clone().lerp(next, step / steps),
        radius: 1.65 + (Math.sin(i * 17.3 + step) + 1) * 0.18,
        rotation: i * 2.399 + step,
        side,
      }));
    });
  });
}
