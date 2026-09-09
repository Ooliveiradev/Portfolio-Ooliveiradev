import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const EducationIsland: React.FC = () => {
  const capRef = useRef<THREE.Group>(null);
  const diplomaRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const t = Date.now() * 0.001;

    // Levitação e rotação serena do capelo acadêmico
    if (capRef.current) {
      capRef.current.rotation.y += delta * 0.7;
      capRef.current.position.y = 4.2 + Math.sin(t * 2.2) * 0.22;
      capRef.current.rotation.z = Math.sin(t * 1.5) * 0.06;
    }

    // Flutuação suave do diploma com fita vermelha
    if (diplomaRef.current) {
      diplomaRef.current.rotation.y += delta * 0.5;
      diplomaRef.current.position.y = 1.3 + Math.sin(t * 2.8) * 0.12;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: TERRA FIRME ESTRATIFICADA & COLINAS LOW-POLY
         ========================================================= */}
      {/* Quilha inferior rochosa poligonal em terracota e basalto */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 1.8, 3.4, 8]} />
        <meshStandardMaterial
          color="#5c341d"
          roughness={0.65}
          metalness={0.06}
          flatShading
        />
      </mesh>

      {/* Camada intermediária de transição de solo fértil */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[6.3, 5.8, 0.8, 9]} />
        <meshStandardMaterial
          color="#854d27"
          roughness={0.52}
          metalness={0.04}
          flatShading
        />
      </mesh>

      {/* Camada superior de grama verde esmeralda com borda chanfrada */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6.4, 6.3, 0.45, 12]} />
        <meshStandardMaterial
          color="#10b981"
          roughness={0.44}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* Colinas suaves em cúpula para topografia orgânica */}
      <mesh position={[-1.6, 0.15, -1.2]} receiveShadow castShadow>
        <sphereGeometry args={[2.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#059669" roughness={0.45} metalness={0.04} flatShading />
      </mesh>
      <mesh position={[2.0, 0.12, 1.0]} receiveShadow castShadow>
        <sphereGeometry args={[1.8, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#34d399" roughness={0.45} metalness={0.04} flatShading />
      </mesh>

      {/* Caminho de pedras (Stepping Stones) chanfradas */}
      {[
        [-0.2, 0.1, 2.1, 0.6, 0.6],
        [0.1, 0.12, 1.2, 0.8, 0.6],
        [0.0, 0.14, 0.1, 0.7, 0.7],
      ].map(([px, py, pz, sx, sz], i) => (
        <mesh
          key={i}
          position={[px, py, pz]}
          scale={[sx, 0.08, sz]}
          rotation={[0, i * 0.4, 0]}
          receiveShadow
          castShadow
        >
          <cylinderGeometry args={[0.6, 0.65, 0.2, 6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.48} metalness={0.08} flatShading />
        </mesh>
      ))}

      {/* =========================================================
          LÁPIS GIGANTE TOY MINIATURE
         ========================================================= */}
      <group position={[-2.4, 1.8, 1.0]} rotation={[-0.45, 0.35, 0.65]}>
        {/* Corpo sextavado amarelo brilhante */}
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 4.4, 6]} />
          <meshStandardMaterial color="#facc15" roughness={0.38} metalness={0.08} />
        </mesh>

        {/* Virola metálica prateada com ranhuras gravadas */}
        <mesh position={[0, -2.3, 0]} castShadow>
          <cylinderGeometry args={[0.43, 0.43, 0.5, 14]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.22} metalness={0.8} />
        </mesh>

        {/* Borracha rosa pastel clássica */}
        <mesh position={[0, -2.75, 0]} castShadow>
          <cylinderGeometry args={[0.41, 0.41, 0.5, 12]} />
          <meshStandardMaterial color="#f472b6" roughness={0.45} metalness={0.02} />
        </mesh>

        {/* Madeira natural talhada apontada */}
        <mesh position={[0, 2.65, 0]} castShadow>
          <coneGeometry args={[0.42, 0.9, 6]} />
          <meshStandardMaterial color="#fef08a" roughness={0.5} metalness={0.02} />
        </mesh>

        {/* Ponta de grafite escuro facetado */}
        <mesh position={[0, 3.15, 0]} castShadow>
          <coneGeometry args={[0.16, 0.35, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.3} />
        </mesh>
      </group>

      {/* =========================================================
          CADERNO ESPIRAL ABERTO COM NOTAS TÁTEIS
         ========================================================= */}
      <group position={[1.4, 0.35, -1.0]} rotation={[-0.1, -0.5, 0.1]}>
        {/* Capa e Páginas da Esquerda */}
        <group position={[-1.1, 0, 0]} rotation={[0, 0.08, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[2.0, 0.1, 2.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.12, 2.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.02} />
          </mesh>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((lz, idx) => (
            <mesh key={idx} position={[0, 0.12, lz]}>
              <planeGeometry args={[1.5, 0.03]} />
              <meshStandardMaterial color="#93c5fd" roughness={0.3} metalness={0.02} />
            </mesh>
          ))}
          {/* Marcador marca-texto amarelo fluorescente */}
          <mesh position={[0, 0.125, 0]}>
            <planeGeometry args={[1.2, 0.12]} />
            <meshStandardMaterial
              color="#fde047"
              emissive="#facc15"
              emissiveIntensity={0.5}
              roughness={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Capa e Páginas da Direita */}
        <group position={[1.1, 0, 0]} rotation={[0, -0.08, 0]}>
          <mesh position={[0, -0.05, 0]} castShadow>
            <boxGeometry args={[2.0, 0.1, 2.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.05, 0]} receiveShadow>
            <boxGeometry args={[1.9, 0.12, 2.5]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.02} />
          </mesh>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((lz, idx) => (
            <mesh key={idx} position={[0, 0.12, lz]}>
              <planeGeometry args={[1.5, 0.03]} />
              <meshStandardMaterial color="#93c5fd" roughness={0.3} metalness={0.02} />
            </mesh>
          ))}
        </group>

        {/* Espiral metálica aramada realista */}
        {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((sz, idx) => (
          <mesh
            key={idx}
            position={[0, 0.15, sz]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <torusGeometry args={[0.18, 0.03, 8, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          PILHA DE LIVROS COLORIDOS (MINIATURA TOY)
         ========================================================= */}
      <group position={[-1.2, 0.2, -1.8]} rotation={[0, 0.4, 0]}>
        {/* Livro 1 (Coral Red) */}
        <group position={[0, 0.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.1, 0.38, 1.6]} />
            <meshStandardMaterial color="#ef4444" roughness={0.38} metalness={0.08} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.95, 0.32, 1.5]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} metalness={0.02} />
          </mesh>
          <mesh position={[-1.02, 0, 0]}>
            <boxGeometry args={[0.08, 0.4, 1.55]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.1} />
          </mesh>
        </group>

        {/* Livro 2 (Mint Green) */}
        <group position={[0.05, 0.55, 0.05]} rotation={[0, -0.25, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.9, 0.35, 1.45]} />
            <meshStandardMaterial color="#10b981" roughness={0.38} metalness={0.08} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.75, 0.3, 1.35]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} metalness={0.02} />
          </mesh>
        </group>

        {/* Livro 3 (Sky Blue) com fita marcadora pendurada */}
        <group position={[-0.05, 0.9, -0.05]} rotation={[0, 0.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.7, 0.32, 1.3]} />
            <meshStandardMaterial color="#0284c7" roughness={0.38} metalness={0.08} />
          </mesh>
          <mesh position={[0.05, 0, 0]}>
            <boxGeometry args={[1.55, 0.28, 1.2]} />
            <meshStandardMaterial color="#fef08a" roughness={0.4} metalness={0.02} />
          </mesh>
          <mesh position={[0.85, -0.18, 0.2]} rotation={[0, 0, 0.3]} castShadow>
            <boxGeometry args={[0.15, 0.55, 0.03]} />
            <meshStandardMaterial color="#f43f5e" roughness={0.4} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          DIPLOMA DE PERGAMINHO FLUTUANTE COM FITA
         ========================================================= */}
      <group ref={diplomaRef} position={[2.6, 1.3, 0.6]} rotation={[0.4, 0.3, -0.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 2.2, 16]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.04} />
        </mesh>
        {/* Fita vermelha de cetim */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.35, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.08} />
        </mesh>
        {/* Selo dourado de cera */}
        <mesh position={[0, 0, 0.38]} castShadow>
          <sphereGeometry args={[0.15, 10, 10]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.6} />
        </mesh>
      </group>

      {/* =========================================================
          CAPELO ACADÊMICO FLUTUANTE (MORTARBOARD)
         ========================================================= */}
      <group ref={capRef} position={[0, 4.2, 0]}>
        {/* Placa quadrada superior */}
        <mesh rotation={[0.1, 0, 0.1]} castShadow>
          <boxGeometry args={[1.5, 0.08, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.1} />
        </mesh>
        {/* Casquete inferior */}
        <mesh position={[0, -0.22, 0]}>
          <cylinderGeometry args={[0.45, 0.5, 0.35, 14]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.1} />
        </mesh>
        {/* Botão central dourado */}
        <mesh position={[0, 0.07, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.6} />
        </mesh>
        {/* Borla de seda pendurada balançando */}
        <mesh position={[0.38, -0.2, 0.38]} rotation={[0.4, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.03, 0.07, 0.65, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.3} />
        </mesh>
      </group>

      {/* =========================================================
          PINHEIROS LOW-POLY & COGUMELOS DA FLORESTA
         ========================================================= */}
      <group position={[-2.8, 0.1, -1.8]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.25, 1.2, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.02} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <coneGeometry args={[1.1, 1.2, 6]} />
          <meshStandardMaterial color="#15803d" roughness={0.42} metalness={0.05} flatShading />
        </mesh>
        <mesh position={[0, 2.1, 0]} castShadow>
          <coneGeometry args={[0.85, 1.1, 6]} />
          <meshStandardMaterial color="#16a34a" roughness={0.42} metalness={0.05} flatShading />
        </mesh>
        <mesh position={[0, 2.7, 0]} castShadow>
          <coneGeometry args={[0.55, 0.9, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.42} metalness={0.05} flatShading />
        </mesh>
      </group>

      <group position={[2.8, 0.1, -2.0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.22, 1.0, 6]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} metalness={0.02} />
        </mesh>
        <mesh position={[0, 1.1, 0]} castShadow>
          <coneGeometry args={[0.9, 1.0, 6]} />
          <meshStandardMaterial color="#15803d" roughness={0.42} metalness={0.05} flatShading />
        </mesh>
        <mesh position={[0, 1.7, 0]} castShadow>
          <coneGeometry args={[0.65, 0.9, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.42} metalness={0.05} flatShading />
        </mesh>
      </group>

      {/* Cogumelos mágicos vermelhos com bolinhas brancas */}
      {[
        [-0.8, 0.1, 1.8],
        [-1.1, 0.1, 2.0],
        [2.2, 0.1, 2.2],
      ].map(([mx, my, mz], idx) => (
        <group key={idx} position={[mx, my, mz]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.24, 6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.02} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <sphereGeometry args={[0.16, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* Luz pontual esmeralda suave */}
      <pointLight position={[0, 3.2, 0]} color="#34d399" intensity={2.0} distance={12} />
    </group>
  );
};
