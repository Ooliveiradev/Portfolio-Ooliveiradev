import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ExperienceIsland: React.FC = () => {
  const clockHourRef = useRef<THREE.Mesh>(null);
  const clockMinuteRef = useRef<THREE.Mesh>(null);
  const skybridgeBeaconRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Ponteiros do relógio histórico em movimento suave
    if (clockMinuteRef.current) {
      clockMinuteRef.current.rotation.z -= delta * 0.9;
    }
    if (clockHourRef.current) {
      clockHourRef.current.rotation.z -= delta * 0.12;
    }
    // Pulso de luz cruzando a passarela suspensa
    if (skybridgeBeaconRef.current) {
      skybridgeBeaconRef.current.position.x = Math.sin(Date.now() * 0.003) * 1.5;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: FUNDAÇÃO METROPOLITANA & QUILHA ROCHOSA
         ========================================================= */}
      {/* Quilha inferior rochosa poligonal (Urban Asteroid Keel) */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 1.8, 3.4, 8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.62}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Camada intermediária de suporte em concreto arquitetônico */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[6.3, 5.8, 0.8, 8]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.48}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* Meio-fio de calçada elevada chanfrada */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6.4, 6.3, 0.45, 8]} />
        <meshStandardMaterial
          color="#475569"
          roughness={0.42}
          metalness={0.08}
        />
      </mesh>

      {/* Praça de asfalto slate com textura de vinil colecionável */}
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[5.7, 5.7, 0.06, 8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Faixas de pedestres brancas em relevo (Crosswalk Zebra) */}
      {[-1.2, -0.6, 0, 0.6, 1.2].map((sz, idx) => (
        <mesh key={idx} position={[0, 0.13, sz + 1.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[1.4, 0.26]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.35}
            metalness={0.05}
          />
        </mesh>
      ))}

      {/* =========================================================
          TRIO DE ARRANHA-CÉUS CORPORATIVOS ESTILO TOY MINIATURA
         ========================================================= */}
      {/* Edifício 1: Torre Principal Azure com Heliporto no Topo */}
      <group position={[-1.6, 0.1, -1.2]}>
        <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 5.0, 1.8]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.38}
            metalness={0.1}
          />
        </mesh>

        {/* Grade de janelas iluminadas com luz quente e ciano */}
        {[-1.8, -0.8, 0.2, 1.2, 2.0].map((wy, row) => (
          <group key={row} position={[0, 2.5 + wy, 0.92]}>
            {[-0.6, -0.2, 0.2, 0.6].map((wx, col) => {
              const isWarm = (row + col) % 3 === 0;
              return (
                <mesh key={col} position={[wx, 0, 0]}>
                  <planeGeometry args={[0.26, 0.36]} />
                  <meshStandardMaterial
                    color={isWarm ? '#fef08a' : '#bae6fd'}
                    emissive={isWarm ? '#fde047' : '#38bdf8'}
                    emissiveIntensity={isWarm ? 0.9 : 0.6}
                    roughness={0.2}
                  />
                </mesh>
              );
            })}
          </group>
        ))}

        {/* Heliporto no teto do edifício */}
        <mesh position={[0, 5.06, 0]} castShadow>
          <cylinderGeometry args={[0.82, 0.82, 0.08, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[0, 5.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.68, 16]} />
          <meshStandardMaterial
            color="#facc15"
            roughness={0.35}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 5.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.42, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.02} />
        </mesh>
        <mesh position={[0, 5.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 0.42]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.02} />
        </mesh>
      </group>

      {/* Edifício 2: Torre Esmeralda Escalonada com Antena Spire */}
      <group position={[1.8, 0.1, -1.5]}>
        <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 4.0, 1.8]} />
          <meshStandardMaterial
            color="#0f766e"
            roughness={0.38}
            metalness={0.1}
          />
        </mesh>
        {/* Andares superiores escalonados */}
        <mesh position={[0, 4.6, 0]} castShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#115e59" roughness={0.38} metalness={0.1} />
        </mesh>
        {/* Antena no topo com ponta de sinalizador */}
        <mesh position={[0, 5.8, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.08, 1.4, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.8} />
        </mesh>

        {/* Janelas corporativas */}
        {[-1.2, -0.2, 0.8, 1.6].map((wy, r) => (
          <group key={r} position={[0, 2.0 + wy, 0.92]}>
            {[-0.45, 0, 0.45].map((wx, c) => (
              <mesh key={c} position={[wx, 0, 0]}>
                <planeGeometry args={[0.28, 0.36]} />
                <meshStandardMaterial
                  color={r % 2 === 0 ? '#fef08a' : '#99f6e4'}
                  emissive={r % 2 === 0 ? '#fde047' : '#2dd4bf'}
                  emissiveIntensity={0.8}
                  roughness={0.2}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Passarela suspensa envidraçada (Skybridge) conectando as duas torres */}
      <group position={[0.1, 3.4, -1.3]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.72, 0.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.55}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        {/* Pulso de luz que caminha pela passarela */}
        <mesh ref={skybridgeBeaconRef} position={[0, 0, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={1.5}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* =========================================================
          MALETA EXECUTIVA ABERTA COM CONTRATOS TÁTEIS
         ========================================================= */}
      <group position={[-1.5, 0.15, 1.4]} rotation={[0, 0.4, 0]}>
        {/* Base da maleta em couro nobre marrom */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[2.0, 0.45, 1.4]} />
          <meshStandardMaterial color="#78350f" roughness={0.42} metalness={0.06} />
        </mesh>

        {/* Tampa da maleta aberta em ângulo */}
        <group position={[0, 0.45, -0.65]} rotation={[-1.4, 0, 0]}>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[2.0, 1.35, 0.15]} />
            <meshStandardMaterial color="#78350f" roughness={0.42} metalness={0.06} />
          </mesh>
          <mesh position={[0, 0.5, 0.09]}>
            <planeGeometry args={[1.8, 0.8]} />
            <meshStandardMaterial color="#92400e" roughness={0.45} metalness={0.05} />
          </mesh>
        </group>

        {/* Fechos metálicos em latão polido */}
        {[-0.6, 0.6].map((lx, idx) => (
          <mesh key={idx} position={[lx, 0.35, 0.71]} castShadow>
            <boxGeometry args={[0.2, 0.15, 0.05]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.8} />
          </mesh>
        ))}

        {/* Documentos / Contratos em papel pergaminho com carimbo de cera */}
        <mesh position={[0, 0.48, 0]}>
          <boxGeometry args={[1.6, 0.06, 1.1]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.02} />
        </mesh>
        <mesh position={[0.4, 0.52, 0.2]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.1} />
        </mesh>
      </group>

      {/* =========================================================
          TORRE DO RELÓGIO HISTÓRICO COM ENGRANAGENS
         ========================================================= */}
      <group position={[1.8, 0.15, 1.2]}>
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 3.2, 1.1]} />
          <meshStandardMaterial color="#334155" roughness={0.42} metalness={0.1} />
        </mesh>

        {/* Telhado em pirâmide de ardósia */}
        <mesh position={[0, 3.8, 0]} castShadow>
          <coneGeometry args={[0.9, 1.2, 4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Mostrador do relógio luminoso */}
        <mesh position={[0, 2.6, 0.56]}>
          <circleGeometry args={[0.42, 24]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.6}
            roughness={0.25}
          />
        </mesh>

        {/* Ponteiros giratórios */}
        <mesh ref={clockHourRef} position={[0, 2.6, 0.57]}>
          <boxGeometry args={[0.04, 0.22, 0.01]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh ref={clockMinuteRef} position={[0, 2.6, 0.58]}>
          <boxGeometry args={[0.03, 0.32, 0.01]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      {/* Postes de luz retrô de praça com globos quentes */}
      {[
        [-0.4, 0.1, 1.8],
        [0.4, 0.1, -1.8],
      ].map(([lx, ly, lz], idx) => (
        <group key={idx} position={[lx, ly, lz]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.07, 1.8, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.85, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>
          <pointLight position={[0, 1.85, 0]} color="#fbbf24" intensity={1.8} distance={6} />
        </group>
      ))}

      {/* Iluminação pontual âmbar urbana */}
      <pointLight position={[0, 3.6, 0]} color="#f59e0b" intensity={2.2} distance={12} />
    </group>
  );
};
