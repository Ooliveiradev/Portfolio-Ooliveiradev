import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const EducationIsland: React.FC = () => {
  const capRef = useRef<THREE.Group>(null);
  const diplomaRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (capRef.current) {
      capRef.current.rotation.y += delta * 0.6;
      capRef.current.position.y = 4.2 + Math.sin(Date.now() * 0.002) * 0.25;
    }
    if (diplomaRef.current) {
      diplomaRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group>
      {/* =========================================================
          TERRA FIRME & GRAMA ESTILIZADA (EARTH & LUSH GRASS HILLS)
         ========================================================= */}

      {/* Layer 1: Sculpted Dirt & Rock Base (Earthen Brown Terraces) */}
      <mesh position={[0, -2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.0, 2.2, 3.2, 9]} />
        <meshStandardMaterial
          color="#6c3a1d"
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Under-cliff Stone Strata & Rock Shards */}
      {[
        [-2.5, -3.2, 1.5, 0.9],
        [2.8, -3.0, -1.2, 1.1],
        [0.4, -3.8, 2.6, 0.8],
        [-1.8, -2.8, -2.5, 1.0],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} scale={[s, s * 1.3, s]} castShadow>
          <dodecahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#452310" roughness={0.95} flatShading />
        </mesh>
      ))}

      {/* Subsoil transition layer */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[6.3, 6.0, 0.7, 9]} />
        <meshStandardMaterial color="#854d27" roughness={0.85} flatShading />
      </mesh>

      {/* Layer 2: Lush Vibrant Green Grass Cap (Rolling contoured turf) */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <cylinderGeometry args={[6.4, 6.3, 0.45, 9]} />
        <meshStandardMaterial
          color="#38a169"
          roughness={0.65}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Gentle Green Grass Mounds for depth */}
      <mesh position={[-1.6, 0.15, -1.2]} receiveShadow>
        <sphereGeometry args={[2.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2f855a" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[2.0, 0.12, 1.0]} receiveShadow>
        <sphereGeometry args={[1.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#48bb78" roughness={0.7} flatShading />
      </mesh>

      {/* Stepping-Stone Cobblestone Pathway */}
      {[
        [-0.4, 0.1, 3.2, 0.7, 0.5],
        [-0.2, 0.1, 2.2, 0.6, 0.6],
        [0.1, 0.12, 1.2, 0.8, 0.6],
        [0.0, 0.14, 0.1, 0.7, 0.7],
      ].map(([px, py, pz, sx, sz], i) => (
        <mesh
          key={i}
          position={[px, py, pz]}
          scale={[sx, 0.08, sz]}
          rotation={[0, i * 0.4, 0]}
          receiveShadow
        >
          <cylinderGeometry args={[0.6, 0.65, 0.2, 6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* =========================================================
          LÁPIS GIGANTE (GIANT ARTISAN SCHOOL PENCIL)
         ========================================================= */}
      <group position={[-2.4, 1.8, 1.0]} rotation={[-0.45, 0.35, 0.65]}>
        {/* Main Hexagonal Yellow Wooden Shaft */}
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 4.4, 6]} />
          <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Silver Metal Ferrule Collar */}
        <mesh position={[0, -2.3, 0]}>
          <cylinderGeometry args={[0.43, 0.43, 0.5, 12]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Pink Rubber Eraser */}
        <mesh position={[0, -2.75, 0]}>
          <cylinderGeometry args={[0.41, 0.41, 0.5, 12]} />
          <meshStandardMaterial color="#f472b6" roughness={0.8} />
        </mesh>

        {/* Sharpened Beige Natural Wood Cone */}
        <mesh position={[0, 2.65, 0]}>
          <coneGeometry args={[0.42, 0.9, 6]} />
          <meshStandardMaterial color="#fde68a" roughness={0.7} />
        </mesh>

        {/* Dark Graphite Lead Tip */}
        <mesh position={[0, 3.15, 0]}>
          <coneGeometry args={[0.16, 0.35, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>

      {/* =========================================================
          CADERNO ESPIRAL ABERTO (OPEN SPIRAL NOTEBOOK)
         ========================================================= */}
      <group position={[1.4, 0.35, -1.0]} rotation={[-0.1, -0.5, 0.1]}>
        {/* Left Page & Cover */}
        <group position={[-1.1, 0, 0]} rotation={[0, 0.08, 0]}>
          {/* Blue Hardcover Base */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[2.0, 0.1, 2.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          {/* White Paper Stack */}
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.12, 2.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          {/* Ruled Lines on Left Page */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((lz, idx) => (
            <mesh key={idx} position={[0, 0.12, lz]}>
              <planeGeometry args={[1.5, 0.03]} />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
          ))}
          {/* Yellow Highlighter Stroke */}
          <mesh position={[0, 0.125, 0]}>
            <planeGeometry args={[1.2, 0.12]} />
            <meshBasicMaterial color="#fde047" transparent opacity={0.6} />
          </mesh>
        </group>

        {/* Right Page & Cover */}
        <group position={[1.1, 0, 0]} rotation={[0, -0.08, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[2.0, 0.1, 2.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.12, 2.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.7} />
          </mesh>
          {/* Ruled Lines on Right Page */}
          {[-0.8, -0.4, 0, 0.4, 0.8].map((lz, idx) => (
            <mesh key={idx} position={[0, 0.12, lz]}>
              <planeGeometry args={[1.5, 0.03]} />
              <meshBasicMaterial color="#93c5fd" />
            </mesh>
          ))}
        </group>

        {/* Silver Spiral Rings binding the spine */}
        {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((sz, idx) => (
          <mesh
            key={idx}
            position={[0, 0.15, sz]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[0.18, 0.03, 8, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          PILHA DE LIVROS COLORIDOS (STACK OF CLASSIC STUDY BOOKS)
         ========================================================= */}
      <group position={[-1.2, 0.2, -1.8]} rotation={[0, 0.4, 0]}>
        {/* Book 1 (Big Crimson Red Book on bottom) */}
        <group position={[0, 0.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.1, 0.38, 1.6]} />
            <meshStandardMaterial color="#dc2626" roughness={0.5} />
          </mesh>
          {/* White Paper edges */}
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.95, 0.32, 1.5]} />
            <meshStandardMaterial color="#fef08a" roughness={0.8} />
          </mesh>
          {/* Gold Embossed Spine bands */}
          <mesh position={[-1.02, 0, 0]}>
            <boxGeometry args={[0.08, 0.4, 1.55]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.7} />
          </mesh>
        </group>

        {/* Book 2 (Emerald Green Book rotated 15 deg) */}
        <group position={[0.05, 0.55, 0.05]} rotation={[0, -0.25, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.9, 0.35, 1.45]} />
            <meshStandardMaterial color="#059669" roughness={0.5} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.75, 0.3, 1.35]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
        </group>

        {/* Book 3 (Deep Sapphire Blue Book with Ribbon Bookmark) */}
        <group position={[-0.05, 0.9, -0.05]} rotation={[0, 0.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.7, 0.32, 1.3]} />
            <meshStandardMaterial color="#1d4ed8" roughness={0.5} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.55, 0.28, 1.2]} />
            <meshStandardMaterial color="#fef08a" />
          </mesh>
          {/* Red Ribbon Bookmark hanging down */}
          <mesh position={[0.85, -0.18, 0.2]} rotation={[0, 0, 0.3]}>
            <boxGeometry args={[0.15, 0.55, 0.03]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          DIPLOMA DE GRADUAÇÃO ENROLADO COM LAÇO
         ========================================================= */}
      <group ref={diplomaRef} position={[2.6, 1.2, 0.6]} rotation={[0.4, 0.3, -0.5]}>
        {/* Rolled Parchment Tube */}
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 2.2, 16]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.6} />
        </mesh>
        {/* Red Ribbon Tied Around Center */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.35, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        {/* Red Ribbon Bow Knot */}
        <mesh position={[0, 0, 0.38]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* =========================================================
          CAPELO ACADÊMICO FLUTUANTE (MORTARBOARD)
         ========================================================= */}
      <group ref={capRef} position={[0, 4.2, 0]}>
        {/* Square Flat Cap Board */}
        <mesh rotation={[0.1, 0, 0.1]} castShadow>
          <boxGeometry args={[1.5, 0.08, 1.5]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Skull Cap Base */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.45, 0.5, 0.35, 12]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} />
        </mesh>
        {/* Center Golden Button */}
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {/* Golden Tassel Ribbon hanging down */}
        <mesh position={[0.35, -0.2, 0.35]} rotation={[0.4, 0, 0.4]}>
          <cylinderGeometry args={[0.03, 0.06, 0.6, 6]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} />
        </mesh>
      </group>

      {/* =========================================================
          DETALHES ORGÂNICOS: PINHEIROS LOW-POLY & COGUMELOS
         ========================================================= */}
      {/* Tree 1 */}
      <group position={[-2.8, 0.1, -1.8]}>
        {/* Trunk */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 1.2, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.9} />
        </mesh>
        {/* Foliage Cone 1 */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <coneGeometry args={[1.1, 1.2, 6]} />
          <meshStandardMaterial color="#166534" roughness={0.7} flatShading />
        </mesh>
        {/* Foliage Cone 2 */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <coneGeometry args={[0.85, 1.1, 6]} />
          <meshStandardMaterial color="#15803d" roughness={0.7} flatShading />
        </mesh>
        {/* Foliage Cone 3 */}
        <mesh position={[0, 2.7, 0]} castShadow>
          <coneGeometry args={[0.55, 0.9, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.7} flatShading />
        </mesh>
      </group>

      {/* Tree 2 */}
      <group position={[2.8, 0.1, -2.0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.22, 1.0, 6]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <coneGeometry args={[0.9, 1.0, 6]} />
          <meshStandardMaterial color="#166534" flatShading />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <coneGeometry args={[0.65, 0.9, 6]} />
          <meshStandardMaterial color="#22c55e" flatShading />
        </mesh>
      </group>

      {/* Little Red Toadstool Mushrooms */}
      {[
        [-0.8, 0.1, 1.8],
        [-1.1, 0.1, 2.0],
        [2.2, 0.1, 2.2],
      ].map(([mx, my, mz], idx) => (
        <group key={idx} position={[mx, my, mz]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.24, 6]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      ))}

      {/* Floating Sparkles of Wisdom */}
      <pointLight position={[0, 3.0, 0]} color="#4ade80" intensity={2.0} distance={10} />
    </group>
  );
};
