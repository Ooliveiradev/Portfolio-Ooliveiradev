import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ExperienceIsland: React.FC = () => {
  const clockHourRef = useRef<THREE.Mesh>(null);
  const clockMinuteRef = useRef<THREE.Mesh>(null);
  const skybridgeBeaconRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (clockMinuteRef.current) {
      clockMinuteRef.current.rotation.z -= delta * 0.8;
    }
    if (clockHourRef.current) {
      clockHourRef.current.rotation.z -= delta * 0.1;
    }
    if (skybridgeBeaconRef.current) {
      skybridgeBeaconRef.current.position.x = Math.sin(Date.now() * 0.003) * 1.6;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: METROPOLIS FOUNDATION & URBAN ASPHALT TOY MINIATURE
         ========================================================= */}
      <mesh position={[0, -2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 2.2, 3.2, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.88} metalness={0.05} flatShading />
      </mesh>

      {/* Raised Sidewalk Curb with Bevel Chamfer */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[6.1, 5.9, 0.5, 8]} />
        <meshStandardMaterial color="#64748b" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Dark Slate Asphalt Plaza (Horizontal 3D Cylinder) */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[5.7, 5.7, 0.08, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} metalness={0.05} />
      </mesh>

      {/* White Roadway Crosswalk Zebra Stripes (Horizontal) */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((sz, idx) => (
        <mesh key={idx} position={[0, 0.17, sz + 2.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.4, 0.25]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.85} metalness={0.02} />
        </mesh>
      ))}

      {/* =========================================================
          TRIO OF TOY SKYSCRAPERS (CAREER TOWERS)
         ========================================================= */}
      {/* Tower 1: Main High-Rise with Helipad */}
      <group position={[-1.6, 0.1, -1.2]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[2.0, 5.0, 1.8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Illuminated Window Grid */}
        {[-1.8, -0.8, 0.2, 1.2, 2.0].map((wy, row) => (
          <group key={row} position={[0, 2.5 + wy, 0.92]}>
            {[-0.6, -0.2, 0.2, 0.6].map((wx, col) => (
              <mesh key={col} position={[wx, 0, 0]}>
                <planeGeometry args={[0.25, 0.35]} />
                <meshStandardMaterial
                  color={(row + col) % 3 === 0 ? '#fef08a' : '#bae6fd'}
                  roughness={0.85}
                  metalness={0.02}
                />
              </mesh>
            ))}
          </group>
        ))}

        {/* Rooftop Helipad with [H] */}
        <mesh position={[0, 5.05, 0]}>
          <cylinderGeometry args={[0.8, 0.8, 0.08, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 5.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.65, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 5.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0, 5.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 0.4]} />
          <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.02} />
        </mesh>
      </group>

      {/* Tower 2: Stepped Corporate Headquarters */}
      <group position={[1.8, 0.1, -1.5]}>
        <mesh position={[0, 2.0, 0]} castShadow>
          <boxGeometry args={[1.8, 4.0, 1.8]} />
          <meshStandardMaterial color="#0f766e" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* Upper Stepped Spire */}
        <mesh position={[0, 4.6, 0]} castShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#115e59" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* Spire Antenna */}
        <mesh position={[0, 5.8, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 1.4, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.85} metalness={0.08} />
        </mesh>
        {/* Windows */}
        {[-1.2, -0.2, 0.8, 1.6].map((wy, r) => (
          <group key={r} position={[0, 2.0 + wy, 0.92]}>
            {[-0.45, 0, 0.45].map((wx, c) => (
              <mesh key={c} position={[wx, 0, 0]}>
                <planeGeometry args={[0.28, 0.35]} />
                <meshStandardMaterial
                  color={r % 2 === 0 ? '#fef08a' : '#99f6e4'}
                  roughness={0.85}
                  metalness={0.02}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Suspended Toy Skybridge connecting Tower 1 & 2 */}
      <group position={[0.1, 3.4, -1.3]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.7, 0.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.6}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>
        <mesh ref={skybridgeBeaconRef} position={[0, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#fef08a" roughness={0.85} metalness={0.02} />
        </mesh>
      </group>

      {/* =========================================================
          OPEN LEATHER BRIEFCASE TOY MINIATURE
         ========================================================= */}
      <group position={[-1.5, 0.15, 1.4]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[2.0, 0.45, 1.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.05} />
        </mesh>

        <group position={[0, 0.45, -0.65]} rotation={[-1.4, 0, 0]}>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[2.0, 1.35, 0.15]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.5, 0.09]}>
            <planeGeometry args={[1.8, 0.8]} />
            <meshStandardMaterial color="#92400e" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* Latches */}
        {[-0.6, 0.6].map((lx, idx) => (
          <mesh key={idx} position={[lx, 0.35, 0.71]}>
            <boxGeometry args={[0.2, 0.15, 0.05]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.85} metalness={0.08} />
          </mesh>
        ))}

        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[1.6, 0.05, 1.1]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[0.4, 0.52, 0.2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.85} metalness={0.05} />
        </mesh>
      </group>

      {/* =========================================================
          HISTORIC CLOCK TOWER TOY MINIATURE
         ========================================================= */}
      <group position={[1.8, 0.15, 1.2]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1.1, 3.2, 1.1]} />
          <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.05} />
        </mesh>

        <mesh position={[0, 3.8, 0]} castShadow>
          <coneGeometry args={[0.9, 1.2, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
        </mesh>

        <mesh position={[0, 2.6, 0.56]}>
          <circleGeometry args={[0.42, 24]} />
          <meshStandardMaterial color="#fef08a" roughness={0.85} metalness={0.02} />
        </mesh>

        <mesh ref={clockHourRef} position={[0, 2.6, 0.57]}>
          <boxGeometry args={[0.04, 0.22, 0.01]} />
          <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh ref={clockMinuteRef} position={[0, 2.6, 0.58]}>
          <boxGeometry args={[0.03, 0.32, 0.01]} />
          <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
        </mesh>
      </group>

      {/* =========================================================
          VINTAGE STREETLAMPS TOY MINIATURE
         ========================================================= */}
      {[
        [-0.4, 0.1, 1.8],
        [0.4, 0.1, -1.8],
      ].map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.07, 1.8, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.08} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#fef08a" roughness={0.85} metalness={0.02} />
          </mesh>
          <pointLight position={[0, 1.85, 0]} color="#fbbf24" intensity={1.5} distance={5} />
        </group>
      ))}

      <pointLight position={[0, 3.5, 0]} color="#f59e0b" intensity={2.0} distance={10} />
    </group>
  );
};
