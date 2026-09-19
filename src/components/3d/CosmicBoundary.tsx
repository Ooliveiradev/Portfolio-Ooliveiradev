import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COSMIC_BOUNDARY } from '../../utils/cosmicBoundary';
import { getBoundaryTelemetry } from '../../utils/boundaryTelemetry';

const vertexShader = `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const fragmentShader = `
  uniform float uStrength;
  uniform float uTime;
  uniform float uImpactAge;
  uniform vec3 uShip;
  uniform vec3 uImpact;
  varying vec3 vWorld;
  float hexGrid(vec2 p) {
    vec2 period = vec2(1.0, 1.73205);
    vec2 a = mod(p, period) - period * 0.5;
    vec2 b = mod(p - period * 0.5, period) - period * 0.5;
    vec2 h = abs(dot(a,a) < dot(b,b) ? a : b);
    float edge = max(dot(h, normalize(vec2(1.0, 1.73205))), h.x);
    return smoothstep(0.45, 0.49, edge);
  }
  void main() {
    vec3 normal = normalize(vWorld - vec3(0.0, 1.0, 0.0));
    vec2 uv = vec2(atan(normal.z, normal.x), asin(clamp(normal.y, -1.0, 1.0))) * 30.0;
    float localFade = 1.0 - smoothstep(20.0, 65.0, distance(vWorld, uShip));
    float fresnel = pow(1.0 - abs(dot(normal, normalize(cameraPosition - vWorld))), 2.0);
    float arc = acos(clamp(dot(normal, uImpact), -1.0, 1.0)) * 175.0;
    float ripple = (1.0 - smoothstep(0.0, 2.8, abs(arc - uImpactAge * 45.0)))
      * (1.0 - smoothstep(0.2, 1.2, uImpactAge));
    float grid = hexGrid(uv);
    float alpha = (grid * (0.12 + fresnel * 0.3) + ripple * 0.55)
      * localFade * uStrength * (0.92 + 0.08 * sin(uTime * 3.0));
    if (alpha < 0.005) discard;
    gl_FragColor = vec4(mix(vec3(0.1, 0.7, 1.0), vec3(1.0, 0.35, 0.3), uStrength * 0.8), alpha);
  }
`;

export function CosmicBoundary({ sharedVehiclePos, active }: {
  sharedVehiclePos: React.RefObject<THREE.Vector3>;
  active: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useRef({
    uStrength: { value: 0 }, uTime: { value: 0 }, uImpactAge: { value: 10 },
    uShip: { value: new THREE.Vector3() }, uImpact: { value: new THREE.Vector3(0, 0, 1) },
  });
  useFrame((_, delta) => {
    const f = getBoundaryTelemetry();
    const visible = active && f.warning;
    if (mesh.current) mesh.current.visible = visible;
    if (!visible || !material.current) return;
    // ShaderMaterial copies uniforms during initialization; update the live GPU material.
    const u = material.current.uniforms as typeof uniforms.current;
    u.uTime.value += delta;
    u.uStrength.value = f.strength;
    u.uShip.value.copy(sharedVehiclePos.current);
    u.uImpactAge.value += delta;
    if (f.impact) {
      u.uImpactAge.value = 0;
      u.uImpact.value.set(f.nx, f.ny, f.nz);
    }
  });
  return (
    <mesh ref={mesh} name="cosmic-boundary" position={[0, 1, 0]} visible={false} renderOrder={2}>
      <sphereGeometry args={[COSMIC_BOUNDARY.radius, 48, 24]} />
      <shaderMaterial ref={material} uniforms={uniforms.current} vertexShader={vertexShader} fragmentShader={fragmentShader}
        transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
