import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ProjectsIsland: React.FC = () => {
  const rocketRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (rocketRef.current) {
      rocketRef.current.position.y = 2.6 + Math.sin(Date.now() * 0.004) * 0.15;
    }
    if (smokeRef.current) {
      smokeRef.current.rotation.y += delta * 0.4;
    }
    if (beaconRef.current) {
      beaconRef.current.intensity = 1.5 + Math.sin(Date.now() * 0.008) * 1.0;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: HIGH-TECH LAUNCHPAD TOY MINIATURE
         ========================================================= */}
      <mesh position={[0, -2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.6, 2.2, 3.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.88} metalness={0.05} flatShading />
      </mesh>

      {/* Main Hexagonal Industrial Deck */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[6.0, 5.8, 0.6, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Perimeter Yellow Caution Border Ring (Horizontal) */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.8, 32]} />
        <meshStandardMaterial color="#eab308" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner Runway Grid Plating (Horizontal 3D Cylinder) */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[5.1, 5.1, 0.08, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.05} />
      </mesh>

      {/* Runway Guide Lights */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i * Math.PI) / 4;
        const lx = Math.cos(rad) * 4.6;
        const lz = Math.sin(rad) * 4.6;
        return (
          <group key={i} position={[lx, 0.22, lz]}>
            <mesh>
              <cylinderGeometry args={[0.12, 0.15, 0.2, 8]} />
              <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#38bdf8" roughness={0.85} metalness={0.02} />
            </mesh>
          </group>
        );
      })}

      {/* =========================================================
          RETRO ARCADE MACHINE TOY MINIATURE
         ========================================================= */}
      <group position={[-2.4, 0.1, -1.2]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1.5, 3.2, 1.4]} />
          <meshStandardMaterial color="#ec4899" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Marquee Header */}
        <mesh position={[0, 3.1, 0.55]}>
          <boxGeometry args={[1.35, 0.45, 0.2]} />
          <meshStandardMaterial color="#fef08a" roughness={0.85} metalness={0.02} />
        </mesh>

        {/* Screen */}
        <mesh position={[0, 2.2, 0.55]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[1.2, 0.9]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0, 2.22, 0.58]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color="#fef08a" roughness={0.85} metalness={0.02} />
        </mesh>

        {/* Control Panel */}
        <mesh position={[0, 1.45, 0.75]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[1.4, 0.15, 0.7]} />
          <meshStandardMaterial color="#1e1e24" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Joystick */}
        <group position={[-0.35, 1.65, 0.75]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* Buttons */}
        {[
          [0.1, 0.7],
          [0.3, 0.7],
          [0.15, 0.82],
          [0.35, 0.82],
        ].map(([bx, bz], idx) => {
          const btnColors = ['#eab308', '#3b82f6', '#22c55e', '#f8fafc'];
          return (
            <mesh key={idx} position={[bx, 1.6, bz]}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 8]} />
              <meshStandardMaterial color={btnColors[idx]} roughness={0.85} metalness={0.05} />
            </mesh>
          );
        })}

        {/* Coin Door */}
        <mesh position={[0, 0.65, 0.71]}>
          <boxGeometry args={[0.7, 0.8, 0.05]} />
          <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.08} />
        </mesh>
      </group>

      {/* =========================================================
          TOY LAUNCH ROCKET & GANTRY TOWER
         ========================================================= */}
      <group position={[1.8, 0.1, -1.5]}>
        {[-0.8, 0.8].map((tx, idx) => (
          <mesh key={idx} position={[tx, 2.5, 0]}>
            <boxGeometry args={[0.2, 5.0, 0.2]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}
        {[1.2, 2.4, 3.6, 4.6].map((by, idx) => (
          <mesh key={idx} position={[0, by, 0]}>
            <boxGeometry args={[1.7, 0.12, 0.12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}
        <mesh position={[-0.6, 4.8, 0]}>
          <boxGeometry args={[1.5, 0.2, 0.3]} />
          <meshStandardMaterial color="#eab308" roughness={0.85} metalness={0.05} />
        </mesh>
        <pointLight ref={beaconRef} position={[0.8, 5.2, 0]} color="#ef4444" intensity={2} distance={8} />
        <mesh position={[0.8, 5.15, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.02} />
        </mesh>
      </group>

      {/* Toy Rocket */}
      <group ref={rocketRef} position={[0.6, 2.6, -1.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.7, 3.2, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.85} metalness={0.05} />
        </mesh>

        <mesh position={[0, 2.2, 0]} castShadow>
          <coneGeometry args={[0.5, 1.2, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
        </mesh>

        <mesh position={[0, 0.8, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 16]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.85} metalness={0.05} />
        </mesh>

        {[0, 1, 2].map((fi) => {
          const finAngle = (fi * Math.PI * 2) / 3;
          return (
            <mesh
              key={fi}
              position={[Math.sin(finAngle) * 0.75, -1.2, Math.cos(finAngle) * 0.75]}
              rotation={[0, finAngle, 0]}
              castShadow
            >
              <boxGeometry args={[0.08, 1.4, 0.7]} />
              <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
            </mesh>
          );
        })}

        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.4, 0.55, 0.5, 12]} />
          <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.08} />
        </mesh>
      </group>

      {/* Low-Poly Smoke Puffs */}
      <group ref={smokeRef} position={[0.6, 0.4, -1.5]}>
        {[
          [0, 0.2, 0, 0.7],
          [-0.5, 0.15, 0.4, 0.55],
          [0.6, 0.25, -0.3, 0.6],
          [-0.3, 0.1, -0.5, 0.5],
          [0.4, 0.18, 0.5, 0.5],
        ].map(([sx, sy, sz, scale], i) => (
          <mesh key={i} position={[sx, sy, sz]} scale={[scale, scale * 0.8, scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.88} metalness={0.02} flatShading />
          </mesh>
        ))}
        <pointLight position={[0, 0.5, 0]} color="#f97316" intensity={3.0} distance={6} />
      </group>

      {/* =========================================================
          KEYBOARD ARTISAN KEYCAPS TOY MINIATURE
         ========================================================= */}
      <group position={[-0.8, 0.15, 1.8]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.2, 1.4]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.05} />
        </mesh>

        <group position={[-1.05, 0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.4, 0.85]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.21, 0]}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
          </mesh>
        </group>

        <group position={[0, 0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.4, 0.85]} />
            <meshStandardMaterial color="#10b981" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.21, 0]}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
          </mesh>
        </group>

        <group position={[1.05, 0.35, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.4, 0.85]} />
            <meshStandardMaterial color="#8b5cf6" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.21, 0]}>
            <planeGeometry args={[0.5, 0.2]} />
            <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          ARCHITECTURAL BLUEPRINT EASEL TOY MINIATURE
         ========================================================= */}
      <group position={[2.0, 0.1, 1.2]} rotation={[0, -0.6, 0]}>
        {[-0.4, 0.4].map((lx, idx) => (
          <mesh key={idx} position={[lx, 1.0, 0]} rotation={[0, 0, lx * -0.2]}>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.02} />
          </mesh>
        ))}
        <mesh position={[0, 0.9, -0.5]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0, 1.4, 0.1]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.8, 1.3, 0.06]} />
          <meshStandardMaterial color="#0284c7" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 1.42, 0.14]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.85} metalness={0.02} wireframe />
        </mesh>
      </group>

      <pointLight position={[0, 3.5, 0]} color="#38bdf8" intensity={2.2} distance={10} />
    </group>
  );
};
