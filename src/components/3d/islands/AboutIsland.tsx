import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const AboutIsland: React.FC = () => {
  const paperPlaneRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const commsDishRef = useRef<THREE.Group>(null);
  const deskLightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const t = Date.now() * 0.001;

    // Voo suave e acrobático do avião de papel em órbita
    if (paperPlaneRef.current) {
      const flightAngle = t * 1.4;
      paperPlaneRef.current.position.x = 2.2 + Math.cos(flightAngle) * 0.75;
      paperPlaneRef.current.position.z = 1.0 + Math.sin(flightAngle) * 0.75;
      paperPlaneRef.current.position.y = 2.7 + Math.sin(t * 3.0) * 0.16;
      paperPlaneRef.current.rotation.y = -flightAngle + Math.PI / 2;
      paperPlaneRef.current.rotation.z = Math.sin(t * 2.5) * 0.28; // Dynamic banking into turn
      paperPlaneRef.current.rotation.x = Math.sin(t * 3.0) * 0.12;
    }

    // Rotação suave do vapor do café
    if (steamRef.current) {
      steamRef.current.rotation.y += delta * 0.55;
    }

    // Varredura periódica da antena parabólica de comunicação
    if (commsDishRef.current) {
      commsDishRef.current.rotation.y = Math.sin(t * 0.8) * 0.45;
    }

    // Leve respiração da lâmpada de mesa
    if (deskLightRef.current) {
      deskLightRef.current.intensity = 2.6 + Math.sin(t * 2.0) * 0.3;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: PATIO DE TECA & ESTRATO ROCHOSO POLIGONAL
         ========================================================= */}
      {/* Quilha inferior rochosa poligonal (Faceted Stone Keel) */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 1.8, 3.4, 7]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.65}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Camada intermediária de suporte em madeira de lei */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[6.2, 5.8, 0.8, 8]} />
        <meshStandardMaterial
          color="#78350f"
          roughness={0.48}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* Deck superior de tábuas de teca (Warm Honey Teak Deck) */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6.3, 6.2, 0.4, 8]} />
        <meshStandardMaterial
          color="#b45309"
          roughness={0.42}
          metalness={0.06}
        />
      </mesh>

      {/* Friso dourado perimetral com balaústres de latão */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.6, 6.0, 32]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.35}
          metalness={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Postes de balaustrada em latão escovado */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i * Math.PI) / 4;
        const rx = Math.cos(rad) * 5.1;
        const rz = Math.sin(rad) * 5.1;
        return (
          <group key={i} position={[rx, 0.45, rz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.75, 8]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.38, 0]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* =========================================================
          ESTAÇÃO DO DESENVOLVEDOR (MESA EM NOGUEIRA + CADEIRA ERGONÔMICA)
         ========================================================= */}
      <group position={[-0.8, 0.1, -0.6]}>
        {/* Tampo chanfrado da mesa em nogueira nobre */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.16, 1.8]} />
          <meshStandardMaterial color="#92400e" roughness={0.42} metalness={0.05} />
        </mesh>

        {/* 4 Pernas cilíndricas em aço preto acetinado */}
        {[
          [-1.5, -0.7],
          [1.5, -0.7],
          [-1.5, 0.7],
          [1.5, 0.7],
        ].map(([lx, lz], idx) => (
          <mesh key={idx} position={[lx, 0.6, lz]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.3} />
          </mesh>
        ))}

        {/* Monitor curvo Ultrawide com base cromada */}
        <group position={[0, 1.9, -0.5]}>
          {/* Chassi do monitor */}
          <mesh castShadow>
            <boxGeometry args={[2.4, 1.1, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.2} />
          </mesh>
          {/* Tela brilhante com linhas de código multicoloridas */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[2.22, 0.96]} />
            <meshStandardMaterial
              color="#090d16"
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          {/* Linhas de código estilizadas (syntax highlighting) */}
          {[-0.32, -0.16, 0.0, 0.16, 0.32].map((ly, lIdx) => {
            const codeColors = ['#38bdf8', '#facc15', '#4ade80', '#f43f5e', '#a78bfa'];
            return (
              <mesh key={lIdx} position={[-0.2, ly, 0.07]}>
                <planeGeometry args={[1.5, 0.06]} />
                <meshStandardMaterial
                  color={codeColors[lIdx]}
                  emissive={codeColors[lIdx]}
                  emissiveIntensity={0.8}
                  roughness={0.2}
                />
              </mesh>
            );
          })}
          {/* Suporte articulado e base de apoio */}
          <mesh position={[0, -0.5, -0.1]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.6} />
          </mesh>
        </group>

        {/* Teclado slim e mousepad */}
        <mesh position={[0, 1.3, 0.2]} receiveShadow>
          <boxGeometry args={[1.2, 0.04, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.1} />
        </mesh>

        {/* Xícara de café cerâmica fumegante */}
        <group position={[1.0, 1.3, 0.3]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.12, 0.28, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Café quente */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
            <meshStandardMaterial color="#451a03" roughness={0.2} metalness={0.1} />
          </mesh>
          {/* Vapor poligonal orgânico */}
          <group ref={steamRef} position={[0, 0.28, 0]}>
            {[0.06, 0.14, 0.22].map((sy, idx) => (
              <mesh key={idx} position={[Math.sin(idx * 2) * 0.04, sy, 0]}>
                <sphereGeometry args={[0.04 + idx * 0.02, 6, 6]} />
                <meshStandardMaterial
                  color="#f1f5f9"
                  roughness={0.6}
                  transparent
                  opacity={0.5 - idx * 0.12}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* Fones de ouvido estúdio */}
        <group position={[-1.2, 1.3, 0.2]}>
          <mesh position={[0, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.18, 0.03, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.2} />
          </mesh>
          {[-0.18, 0.18].map((cx, idx) => (
            <mesh key={idx} position={[cx, 0.18, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.08, 12]} />
              <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.1} />
            </mesh>
          ))}
        </group>

        {/* Luminária articulada retrô (Toy Desk Lamp) */}
        <group position={[1.2, 1.3, -0.4]}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.22, 0.06, 12]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[-0.1, 0.3, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[-0.2, 0.7, 0.1]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.5, 6]} />
            <meshStandardMaterial color="#facc15" roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[-0.3, 0.9, 0.2]} rotation={[0.6, 0, -0.8]} castShadow>
            <coneGeometry args={[0.25, 0.35, 12, 1, true]} />
            <meshStandardMaterial
              color="#facc15"
              roughness={0.35}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            ref={deskLightRef}
            position={[-0.3, 0.8, 0.2]}
            color="#fef08a"
            intensity={2.6}
            distance={5}
          />
        </group>

        {/* CADEIRA ERGONÔMICA DE DESENVOLVEDOR (Padrão Toy Bruno Simon) */}
        <group position={[0, 0, 1.0]}>
          {/* Base estrelada de 5 pontas com rodízios */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.35, 0.38, 0.08, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Pistão central a gás cromado */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.48, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Assento estofado confortável */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.12, 0.85]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.05} />
          </mesh>
          {/* Encosto ergonômico com suporte lombar */}
          <mesh position={[0, 1.15, 0.38]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[0.82, 0.95, 0.1]} />
            <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          ENVELOPE DE CORRESPONDÊNCIA AÉREA & AVIÃO DE PAPEL
         ========================================================= */}
      <group position={[1.8, 0.15, 1.2]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 1.4, 0.08]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.45} metalness={0.02} />
        </mesh>
        {/* Selo postal clássico azul */}
        <mesh position={[0.7, 0.8, 0.06]} rotation={[-0.3, 0, 0]}>
          <planeGeometry args={[0.4, 0.45]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.05} />
        </mesh>
      </group>

      {/* Avião de papel em órbita acrobática */}
      <group ref={paperPlaneRef} position={[2.2, 2.7, 1.0]}>
        <mesh castShadow>
          <coneGeometry args={[0.32, 0.9, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.32} metalness={0.02} />
        </mesh>
      </group>

      {/* Antena parabólica de comunicação e radar de dados */}
      <group ref={commsDishRef} position={[-2.0, 0.15, 1.4]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 1.0, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[-0.6, 0, 0]} castShadow>
          <sphereGeometry args={[0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.35}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 1.4, 0.4]} rotation={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Iluminação pontual cósmica dourada */}
      <pointLight position={[0, 3.4, 0]} color="#fde047" intensity={2.0} distance={12} />
    </group>
  );
};
