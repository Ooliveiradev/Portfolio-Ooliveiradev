import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AboutIsland: React.FC = () => {
  const paperPlaneRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const commsDishRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (paperPlaneRef.current) {
      const t = Date.now() * 0.002;
      paperPlaneRef.current.position.x = 2.0 + Math.cos(t) * 0.4;
      paperPlaneRef.current.position.z = 1.0 + Math.sin(t) * 0.4;
      paperPlaneRef.current.position.y = 2.6 + Math.sin(t * 2) * 0.15;
      paperPlaneRef.current.rotation.y = -t;
      paperPlaneRef.current.rotation.z = Math.sin(t) * 0.2;
    }

    if (steamRef.current) {
      steamRef.current.rotation.y += delta * 0.5;
    }

    if (commsDishRef.current) {
      commsDishRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.4;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: WOODEN PATIO DECK & STONE TERRACE TOY MINIATURE
         ========================================================= */}
      <mesh position={[0, -2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.6, 2.2, 3.2, 8]} />
        <meshStandardMaterial color="#475569" roughness={0.88} metalness={0.05} flatShading />
      </mesh>

      {/* Terraced Teak Wood Plank Deck */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[5.9, 5.7, 0.5, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Surface Planks Deck with Toy Bevel Rim */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.5, 0.08, 8]} />
        <meshStandardMaterial color="#b45309" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Outer Brass Perimeter Railing Posts */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i * Math.PI) / 4;
        const rx = Math.cos(rad) * 5.0;
        const rz = Math.sin(rad) * 5.0;
        return (
          <group key={i} position={[rx, 0.5, rz]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.08} roughness={0.85} />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.08} roughness={0.85} />
            </mesh>
          </group>
        );
      })}

      {/* =========================================================
          COZY WOODEN DEVELOPER WORKBENCH TOY MINIATURE
         ========================================================= */}
      <group position={[-0.8, 0.1, -0.6]}>
        {/* Desk Tabletop */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.15, 1.8]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* 4 Toy Desk Legs */}
        {[
          [-1.5, -0.7],
          [1.5, -0.7],
          [-1.5, 0.7],
          [1.5, 0.7],
        ].map(([lx, lz], idx) => (
          <mesh key={idx} position={[lx, 0.6, lz]}>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.08} />
          </mesh>
        ))}

        {/* Ultrawide Curved Computer Monitor */}
        <group position={[0, 1.9, -0.5]}>
          <mesh castShadow>
            <boxGeometry args={[2.4, 1.1, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.05} />
          </mesh>
          {/* Screen Content */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[2.2, 0.95]} />
            <meshStandardMaterial color="#0284c7" roughness={0.85} metalness={0.02} />
          </mesh>
          {/* Monitor Stand */}
          <mesh position={[0, -0.5, -0.1]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.08} />
          </mesh>
        </group>

        {/* Low-profile Keyboard & Trackpad */}
        <mesh position={[0, 1.3, 0.2]}>
          <boxGeometry args={[1.2, 0.04, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Steaming Ceramic Coffee Mug */}
        <group position={[1.0, 1.3, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.12, 0.28, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.85} metalness={0.02} />
          </mesh>
          {/* Coffee Surface */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial color="#451a03" roughness={0.85} metalness={0.02} />
          </mesh>
          {/* Steam puffs */}
          <group ref={steamRef} position={[0, 0.28, 0]}>
            {[0.05, 0.12, 0.18].map((sy, idx) => (
              <mesh key={idx} position={[Math.sin(idx) * 0.04, sy, 0]}>
                <sphereGeometry args={[0.04 + idx * 0.02, 6, 6]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.85} metalness={0.02} transparent opacity={0.45 - idx * 0.1} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Studio Headphones */}
        <group position={[-1.2, 1.3, 0.2]}>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.18, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[-0.18, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0.18, 0.18, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* Potted Succulent */}
        <group position={[-1.2, 1.3, -0.5]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.12, 0.28, 8]} />
            <meshStandardMaterial color="#c2410c" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color="#16a34a" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* Toy Desk Lamp */}
        <group position={[1.2, 1.3, -0.4]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.22, 0.06, 12]} />
            <meshStandardMaterial color="#facc15" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
            <meshStandardMaterial color="#facc15" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[-0.2, 0.7, 0.1]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#facc15" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[-0.3, 0.9, 0.2]} rotation={[0.6, 0, -0.8]} castShadow>
            <coneGeometry args={[0.25, 0.35, 12, 1, true]} />
            <meshStandardMaterial color="#facc15" roughness={0.85} metalness={0.08} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.3, 0.85, 0.2]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#fffbeb" roughness={0.85} metalness={0.02} />
          </mesh>
          <pointLight position={[-0.3, 0.8, 0.2]} color="#fef08a" intensity={2.6} distance={4} />
        </group>
      </group>

      {/* =========================================================
          GIANT POSTAL AIRMAIL ENVELOPE TOY MINIATURE
         ========================================================= */}
      <group position={[1.8, 0.15, 1.2]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 0.08]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0.7, 0.8, 0.06]} rotation={[-0.3, 0, 0]}>
          <planeGeometry args={[0.4, 0.45]} />
          <meshStandardMaterial color="#0284c7" roughness={0.85} metalness={0.05} />
        </mesh>
      </group>

      {/* Paper Airplane */}
      <group ref={paperPlaneRef} position={[2.0, 2.6, 1.0]}>
        <mesh castShadow>
          <coneGeometry args={[0.3, 0.8, 3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.85} metalness={0.02} />
        </mesh>
      </group>

      {/* =========================================================
          RETRO SATELLITE COMMS DISH TOY MINIATURE
         ========================================================= */}
      <group ref={commsDishRef} position={[-2.0, 0.15, 1.4]}>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.06, 0.12, 1.0, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.08} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[-0.6, 0, 0]} castShadow>
          <sphereGeometry args={[0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.4, 0.4]} rotation={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.85} metalness={0.08} />
        </mesh>
        <pointLight position={[0, 1.5, 0.5]} color="#38bdf8" intensity={1.6} distance={6} />
      </group>

      <pointLight position={[0, 3.2, 0]} color="#fde047" intensity={1.8} distance={10} />
    </group>
  );
};
