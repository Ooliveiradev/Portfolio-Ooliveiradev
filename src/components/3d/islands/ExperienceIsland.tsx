import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';
import { StaticInstances } from '../StaticInstances';

const WINDOW_ROWS = [-2, -1.2, -0.4, 0.4, 1.2, 2];
const AZURE_WINDOWS = [true, false].map((warm) => WINDOW_ROWS.flatMap((y, row) =>
  [-0.6, -0.2, 0.2, 0.6].flatMap((x, column): [number, number, number][] =>
    ((row + column) % 3 === 0) === warm ? [[x, 2.6 + y, 0.96]] : [])
));
const SLATE_WINDOWS = [true, false].map((warm) => WINDOW_ROWS.flatMap((y) =>
  [-0.55, -0.18, 0.18, 0.55].flatMap((x, column): [number, number, number][] =>
    (column % 2 === 0) === warm ? [[x, 2.7 + y, 0.96]] : [])
));

interface ExperienceIslandProps {
  isNear?: boolean;
}

const BasaltKeel: React.FC<{ columns: { x: number; z: number; r: number; h: number; y: number }[] }> = ({ columns }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const tempMatrix = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    columns.forEach((col, idx) => {
      tempPos.set(col.x, col.y, col.z);
      tempScale.set(col.r, col.h, col.r);
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      meshRef.current!.setMatrixAt(idx, tempMatrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [columns]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, columns.length]}
      receiveShadow
      castShadow
    >
      <cylinderGeometry args={[1, 1, 1, 6]} />
      <meshStandardMaterial
        color="#1e293b"
        roughness={0.92}
        metalness={0.08}
        flatShading
      />
    </instancedMesh>
  );
};

const ExperienceIslandComponent: React.FC<ExperienceIslandProps> = () => {
  // Animation refs
  const clockHourRef = useRef<THREE.Mesh>(null);
  const clockMinuteRef = useRef<THREE.Mesh>(null);
  const skybridgeBeaconRef = useRef<THREE.Group>(null);
  const briefcaseRef = useRef<THREE.Group>(null);
  const clockTowerRef = useRef<THREE.Group>(null);
  const cloud1Ref = useRef<THREE.Group>(null);
  const cloud2Ref = useRef<THREE.Group>(null);

  // Micro-interaction timer refs (Zero React re-renders)
  const clockSpinTimeRef = useRef(0);
  const briefcaseHopTimeRef = useRef(0);
  const skybridgeBoostRef = useRef(0);

  // Precomputed basalt columnar hex prisms for the dramatic stepped keel (Giant's Causeway)
  const basaltColumns = useMemo(() => {
    const cols: { x: number; z: number; r: number; h: number; y: number }[] = [];
    const ringRadius = [0, 0.85, 1.7, 2.55, 3.4];

    ringRadius.forEach((r, ringIdx) => {
      const count = ringIdx === 0 ? 1 : ringIdx * 6;
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count + (ringIdx * 0.18);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;

        // Inverted stepped mountain / cluster profile: center goes deepest, edges taper
        const distFromCenter = Math.hypot(x, z);
        const maxDepth = 4.8 - (distFromCenter / 4.0) * 2.8;
        const h = Math.max(1.2, maxDepth + Math.sin(i * 1.5 + ringIdx) * 0.7);
        const y = -1.2 - h / 2;
        const colRadius = 0.42 + (Math.sin(i * 2.3) * 0.06);

        cols.push({ x, z, r: colRadius, h, y });
      }
    });
    return cols;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // 1. Torre do Relógio Histórico: Rotação suave contínua + Giro acelerado com badalada
    if (clockMinuteRef.current) {
      if (clockSpinTimeRef.current > 0) {
        clockMinuteRef.current.rotation.z -= delta * 24;
      } else {
        clockMinuteRef.current.rotation.z -= delta * 0.6;
      }
    }
    if (clockHourRef.current) {
      if (clockSpinTimeRef.current > 0) {
        clockHourRef.current.rotation.z -= delta * 4;
        clockSpinTimeRef.current = Math.max(0, clockSpinTimeRef.current - delta);
      } else {
        clockHourRef.current.rotation.z -= delta * 0.05;
      }
    }

    // 2. Pulso de Luz da Passarela Suspensa (Skybridge)
    if (skybridgeBeaconRef.current) {
      const speed = skybridgeBoostRef.current > 0 ? 7.5 : 2.5;
      const progress = (t * speed) % 2.4;
      // Posiciona entre a Torre 1 (x = -1.7) e a Torre 2 (x = 0.6), delta ~ 2.3
      skybridgeBeaconRef.current.position.x = -1.6 + progress;
      if (skybridgeBoostRef.current > 0) {
        skybridgeBoostRef.current = Math.max(0, skybridgeBoostRef.current - delta * 1.5);
      }
    }

    // 3. Maleta Executiva: Pulo elástico e balanço ao clicar
    if (briefcaseRef.current) {
      if (briefcaseHopTimeRef.current > 0) {
        const p = (1.2 - briefcaseHopTimeRef.current) / 1.2;
        const jump = Math.sin(p * Math.PI) * 0.28;
        const wobble = Math.sin(p * Math.PI * 4) * 0.08;
        briefcaseRef.current.position.y = 0.52 + jump;
        briefcaseRef.current.rotation.z = wobble;
        briefcaseHopTimeRef.current = Math.max(0, briefcaseHopTimeRef.current - delta * 2.0);
      } else {
        briefcaseRef.current.position.y = 0.52;
        briefcaseRef.current.rotation.z = 0;
      }
    }

    // 4. Nuvens volumétricas low-poly flutuando
    if (cloud1Ref.current) {
      cloud1Ref.current.position.y = 4.8 + Math.sin(t * 1.0) * 0.16;
      cloud1Ref.current.position.x = 1.8 + Math.cos(t * 0.6) * 0.12;
    }
    if (cloud2Ref.current) {
      cloud2Ref.current.position.y = 4.6 + Math.sin(t * 0.9 + 1.2) * 0.14;
      cloud2Ref.current.position.x = -1.8 + Math.cos(t * 0.5 + 0.8) * 0.12;
    }
  });

  // Interatividade handlers (zero react render overhead)
  const handleClockClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playClockChime();
    clockSpinTimeRef.current = 2.2;
  };

  const handleBriefcaseClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playBriefcaseClick();
    briefcaseHopTimeRef.current = 1.2;
  };

  const handleSkybridgeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playSkybridgePulse();
    skybridgeBoostRef.current = 2.0;
  };

  return (
    <group>
      {/* =========================================================
          1. 🌋 QUILHA DE BASALTO COLUNAR (GIANT'S CAUSEWAY) - 1 DRAW CALL VIA INSTANCED MESH
          ========================================================= */}
      <BasaltKeel columns={basaltColumns} />

      {/* =========================================================
          2. 🏗️ FUNDAÇÃO DE CONCRETO, PILARES, VIGAS EM 'I' & GRELHAS
             Fiel à imagem conceitual de referência
         ========================================================= */}
      {/* Bloco maciço de concreto de transição sobre o basalto */}
      <mesh position={[0, -0.7, 0]} receiveShadow castShadow>
        <boxGeometry args={[6.8, 1.2, 6.8]} />
        <meshStandardMaterial color="#334155" roughness={0.85} flatShading />
      </mesh>

      {/* Pilares de Contraforte Chanfrados em Concreto nas 4 faces */}
      {[
        // Face frontal (+Z)
        { x: -1.8, z: 3.48, ry: 0 },
        { x: 1.8, z: 3.48, ry: 0 },
        // Face traseira (-Z)
        { x: -1.8, z: -3.48, ry: Math.PI },
        { x: 1.8, z: -3.48, ry: Math.PI },
        // Face esquerda (-X)
        { x: -3.48, z: -1.8, ry: Math.PI / 2 },
        { x: -3.48, z: 1.8, ry: Math.PI / 2 },
        // Face direita (+X)
        { x: 3.48, z: -1.8, ry: -Math.PI / 2 },
        { x: 3.48, z: 1.8, ry: -Math.PI / 2 },
      ].map((buttress, bIdx) => (
        <group key={`buttress-${bIdx}`} position={[buttress.x, -0.7, buttress.z]} rotation={[0, buttress.ry, 0]}>
          {/* Pilar de concreto chanfrado */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.55, 1.4, 0.45]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} flatShading />
          </mesh>
          <mesh position={[0, -0.6, 0.08]} castShadow>
            <boxGeometry args={[0.7, 0.25, 0.55]} />
            <meshStandardMaterial color="#475569" roughness={0.8} flatShading />
          </mesh>

          {/* Viga de Aço Estrutural em 'I' projetada para fora */}
          <group position={[0, 0.1, 0.45]}>
            {/* Flange superior do perfil I */}
            <mesh castShadow>
              <boxGeometry args={[0.26, 0.04, 0.8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Alma vertical do perfil I */}
            <mesh position={[0, -0.12, 0]}>
              <boxGeometry args={[0.04, 0.20, 0.8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
            </mesh>
            {/* Flange inferior do perfil I */}
            <mesh position={[0, -0.24, 0]} castShadow>
              <boxGeometry args={[0.26, 0.04, 0.8]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Grelhas de Ventilação Subterrânea (Subway Louvers) com Brilho Âmbar */}
      {[
        // Grelhas Frontais
        { x: 0, z: 3.42, ry: 0 },
        // Grelhas Traseiras
        { x: 0, z: -3.42, ry: Math.PI },
        // Grelhas Esquerda
        { x: -3.42, z: 0, ry: Math.PI / 2 },
        // Grelhas Direita
        { x: 3.42, z: 0, ry: -Math.PI / 2 },
      ].map((vent, vIdx) => (
        <group key={`vent-${vIdx}`} position={[vent.x, -0.65, vent.z]} rotation={[0, vent.ry, 0]}>
          {/* Moldura rebaixada em concreto escuro */}
          <mesh>
            <boxGeometry args={[1.5, 0.7, 0.1]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          {/* Painel interno emissivo âmbar (luz do subsolo) */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[1.35, 0.58]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#ea580c"
              emissiveIntensity={1.8}
              roughness={0.3}
            />
          </mesh>
          {/* Lâminas horizontais de persiana de aço */}
          {[-0.2, -0.07, 0.07, 0.2].map((ly, lIdx) => (
            <mesh key={`blade-${lIdx}`} position={[0, ly, 0.03]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[1.38, 0.05, 0.08]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
            </mesh>
          ))}
          {/* Luz pontual quente emitida pela grelha */}
          {/* Emissive fixtures share the island fill light. */}
        </group>
      ))}

      {/* =========================================================
          3. 🏙️ PLATÔ SUPERIOR: CALÇADAS, ASFALTO & FAIXAS DE PEDESTRES
         ========================================================= */}
      {/* Meio-fio de calçada elevada em concreto cinza claro */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <boxGeometry args={[7.0, 0.22, 7.0]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} flatShading />
      </mesh>

      {/* Leito de asfalto da avenida central */}
      <mesh position={[-0.4, 0.16, 0.8]} receiveShadow>
        <boxGeometry args={[4.4, 0.04, 4.4]} />
        <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Faixas de Pedestres Brancas (Zebra Crosswalks) */}
      <group position={[-0.3, 0.19, 1.9]}>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((fx, fi) => (
          <mesh key={`crosswalk-${fi}`} position={[fx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.22, 0.9]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Praça elevada de pedestres lateral direita com piso de lajotas */}
      <mesh position={[1.8, 0.16, 1.2]} receiveShadow>
        <boxGeometry args={[2.6, 0.06, 2.6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
      </mesh>

      {/* =========================================================
          4. 🏢 TORRE 1: ARRANHA-CÉU AZURE GLASS (ESQUERDA/FUNDO)
         ========================================================= */}
      <group position={[-1.7, 0.15, -1.2]}>
        {/* Corpo principal do edifício em vidro azul espelhado */}
        <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 5.2, 1.9]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.25}
            metalness={0.2}
          />
        </mesh>

        {/* Topo com heliponto / corrimão */}
        <mesh position={[0, 5.25, 0]} castShadow>
          <boxGeometry args={[1.85, 0.12, 1.75]} />
          <meshStandardMaterial color="#0369a1" roughness={0.4} />
        </mesh>
        <mesh position={[0, 5.8, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.06, 1.0, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Grade de janelas iluminadas na fachada frontal (+Z) */}
        {AZURE_WINDOWS.map((positions, index) => (
          <StaticInstances key={index} positions={positions}>
            <planeGeometry args={[0.26, 0.38]} />
            <meshStandardMaterial
              color={index === 0 ? '#fef08a' : '#bae6fd'}
              emissive={index === 0 ? '#fde047' : '#38bdf8'}
              emissiveIntensity={index === 0 ? 0.9 : 0.6}
              roughness={0.2}
            />
          </StaticInstances>
        ))}
      </group>

      {/* =========================================================
          5. 🏢 TORRE 2: ARRANHA-CÉU DARK SLATE CORPORATIVO (CENTRO/FUNDO)
         ========================================================= */}
      <group position={[0.6, 0.15, -1.4]}>
        {/* Corpo principal em ardósia grafite escuro */}
        <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 5.4, 1.9]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>

        {/* Antena transmissora no topo */}
        <mesh position={[0, 5.9, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.08, 1.2, 8]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Janelas verticais corporativas com luz quente */}
        {SLATE_WINDOWS.map((positions, index) => (
          <StaticInstances key={index} positions={positions}>
            <planeGeometry args={[0.24, 0.38]} />
            <meshStandardMaterial
              color={index === 0 ? '#fef08a' : '#94a3b8'}
              emissive={index === 0 ? '#fde047' : '#475569'}
              emissiveIntensity={index === 0 ? 0.8 : 0.2}
              roughness={0.3}
            />
          </StaticInstances>
        ))}
      </group>

      {/* =========================================================
          6. 🌉 SKYBRIDGE: PASSARELA CILÍNDRICA TUBULAR DE VIDRO
             Conectando as duas torres com pulso de luz móvel
         ========================================================= */}
      <group
        position={[-0.55, 3.8, -1.3]}
        onClick={handleSkybridgeClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Tubo cilíndrico de vidro azul translúcido (Skybridge) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 2.2, 16, 1, true]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.4}
            transparent
            opacity={0.65}
            roughness={0.15}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Anéis estruturais externos de suporte em aço azulado */}
        {[-0.8, -0.3, 0.2, 0.7].map((rx, ri) => (
          <mesh key={`sky-ring-${ri}`} position={[rx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.44, 0.03, 8, 20]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}

        {/* Piso interno da passarela */}
        <mesh position={[0, -0.28, 0]}>
          <boxGeometry args={[2.2, 0.04, 0.55]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>

        {/* Pulso de luz de dados e tráfego executivo em alta velocidade */}
        <group ref={skybridgeBeaconRef} position={[-0.8, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#facc15"
              emissiveIntensity={2.5}
              roughness={0.1}
            />
          </mesh>
          {/* Emissive fixtures share the island fill light. */}
        </group>
      </group>

      {/* =========================================================
          7. 🕰️ TORRE DO RELÓGIO HISTÓRICA (BIG BEN CORPORATIVO)
             Tijolos terracota, teto em pirâmide de cobre e mostrador 4 faces
         ========================================================= */}
      <group
        ref={clockTowerRef}
        position={[2.2, 0.15, 0.4]}
        onClick={handleClockClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Corpo principal em tijolos terracota escuros */}
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 3.6, 1.3]} />
          <meshStandardMaterial color="#9a3412" roughness={0.85} flatShading />
        </mesh>

        {/* Friso e moldura superior da câmara do sino */}
        <mesh position={[0, 3.65, 0]} castShadow>
          <boxGeometry args={[1.45, 0.25, 1.45]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} flatShading />
        </mesh>

        {/* Telhado em pirâmide esbelta de cobre / ardósia */}
        <mesh position={[0, 4.45, 0]} castShadow>
          <coneGeometry args={[1.05, 1.4, 4]} />
          <meshStandardMaterial color="#78350f" roughness={0.55} flatShading />
        </mesh>
        <mesh position={[0, 5.25, 0]} castShadow>
          <coneGeometry args={[0.12, 0.4, 6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.6} />
        </mesh>

        {/* Mostradores luminosos circulares nas faces da torre */}
        {/* Face Frontal (+Z) */}
        <group position={[0, 3.0, 0.66]}>
          <mesh>
            <circleGeometry args={[0.45, 24]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fde047"
              emissiveIntensity={0.8}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <ringGeometry args={[0.45, 0.52, 24]} />
            <meshStandardMaterial color="#451a03" roughness={0.5} />
          </mesh>
          {/* Ponteiro das horas */}
          <mesh ref={clockHourRef} position={[0, 0, 0.02]}>
            <boxGeometry args={[0.04, 0.22, 0.01]} />
            <meshStandardMaterial color="#09090b" roughness={0.2} />
          </mesh>
          {/* Ponteiro dos minutos */}
          <mesh ref={clockMinuteRef} position={[0, 0, 0.03]}>
            <boxGeometry args={[0.03, 0.34, 0.01]} />
            <meshStandardMaterial color="#09090b" roughness={0.2} />
          </mesh>
        </group>

        {/* Face Lateral Esquerda (-X) */}
        <mesh position={[-0.66, 3.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <circleGeometry args={[0.42, 24]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Luz quente do mostrador da torre */}
        {/* Emissive fixtures share the island fill light. */}
      </group>

      {/* =========================================================
          8. 💼 MALETA EXECUTIVA DE LUXO SOBRE BANCO DE PRAÇA
             Fiel à imagem de referência (experience_island_3d)
         ========================================================= */}
      <group position={[-0.4, 0.16, 1.2]}>
        {/* Banco de praça em ripas de madeira sobre o qual a maleta repousa */}
        <group position={[0, 0.12, 0]}>
          {/* Assento de ripas de madeira */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.06, 0.65]} />
            <meshStandardMaterial color="#b45309" roughness={0.65} />
          </mesh>
          {/* Pés de ferro fundido escuro */}
          {[-0.6, 0.6].map((bx, bi) => (
            <mesh key={`bench-leg-${bi}`} position={[bx, 0.06, 0]} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.55]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Maleta Executiva em Couro Marrom Nobre com Fechos de Latão Dourado */}
        <group
          ref={briefcaseRef}
          position={[0, 0.52, 0]}
          onClick={handleBriefcaseClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Corpo principal da maleta em couro nobre */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.68, 0.32]} />
            <meshStandardMaterial
              color="#92400e"
              roughness={0.38}
              metalness={0.08}
            />
          </mesh>

          {/* Nervura central de divisão da maleta */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.02, 0.04, 0.33]} />
            <meshStandardMaterial color="#78350f" roughness={0.4} />
          </mesh>

          {/* Fechos duplos de latão dourado polido */}
          {[-0.32, 0.32].map((lx, li) => (
            <mesh key={`lock-${li}`} position={[lx, 0.08, 0.17]} castShadow>
              <boxGeometry args={[0.12, 0.14, 0.04]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.85} />
            </mesh>
          ))}

          {/* Alça superior ergonômica arqueada */}
          <mesh position={[0, 0.42, 0]} castShadow>
            <torusGeometry args={[0.16, 0.035, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#78350f" roughness={0.4} />
          </mesh>

          {/* Fita perimetral de costura de reforço em couro escuro */}
          <mesh position={[0, -0.32, 0]}>
            <boxGeometry args={[1.02, 0.05, 0.33]} />
            <meshStandardMaterial color="#78350f" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          9. 💡 MOBILIÁRIO URBANO: POSTES VINTAGE & BANCOS DE PRAÇA
         ========================================================= */}
      {/* 4 Postes Coloniais de Ferro com Globos Iluminados */}
      {[
        { x: -2.8, z: 1.8 },
        { x: -2.8, z: -2.4 },
        { x: 2.8, z: 2.0 },
        { x: 0.8, z: 1.8 },
      ].map((lamp, li) => (
        <group key={`lamp-${li}`} position={[lamp.x, 0.16, lamp.z]}>
          {/* Base pesada de ferro fundido */}
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 0.24, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
          </mesh>
          {/* Mastro vertical esbelto */}
          <mesh position={[0, 0.95, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.06, 1.5, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.4} />
          </mesh>
          {/* Lanterna / Globo incandescente vintage */}
          <mesh position={[0, 1.82, 0]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={1.4}
              roughness={0.2}
            />
          </mesh>
          {/* Emissive fixtures share the island fill light. */}
        </group>
      ))}

      {/* Bancos de praça adicionais espalhados pela calçada */}
      {[
        { x: 1.8, z: 2.2, ry: 0 },
        { x: -2.2, z: 0.6, ry: Math.PI / 2 },
      ].map((pb, pbi) => (
        <group key={`park-bench-${pbi}`} position={[pb.x, 0.16, pb.z]} rotation={[0, pb.ry, 0]}>
          <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.2, 0.05, 0.45]} />
            <meshStandardMaterial color="#b45309" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.36, -0.2]} rotation={[0.15, 0, 0]} castShadow>
            <boxGeometry args={[1.2, 0.35, 0.05]} />
            <meshStandardMaterial color="#b45309" roughness={0.65} />
          </mesh>
          {[-0.5, 0.5].map((bx, bi) => (
            <mesh key={`p-leg-${bi}`} position={[bx, 0.12, 0]} castShadow>
              <boxGeometry args={[0.06, 0.24, 0.4]} />
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* =========================================================
          10. ☁️ NUVENS VOLUMÉTRICAS LOW-POLY NO CÉU METROPOLITANO
         ========================================================= */}
      {/* Nuvem 1 (Branca Pura): Acima da Torre do Relógio e Torre Slate */}
      <group ref={cloud1Ref} position={[1.8, 4.8, -1.8]}>
        {[
          { x: 0.0, y: 0.0, z: 0.0, r: 0.85 },
          { x: -0.65, y: -0.1, z: 0.1, r: 0.68 },
          { x: 0.7, y: -0.12, z: -0.1, r: 0.72 },
          { x: -0.2, y: 0.28, z: -0.12, r: 0.58 },
          { x: 0.35, y: 0.24, z: 0.14, r: 0.62 },
        ].map((puff, pi) => (
          <mesh key={`cloud1-exp-${pi}`} position={[puff.x, puff.y, puff.z]} castShadow>
            <dodecahedronGeometry args={[puff.r, 0]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.82}
              metalness={0.02}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Nuvem 2 (Cinza Ardósia): Acima da Torre Azure */}
      <group ref={cloud2Ref} position={[-1.8, 4.6, -1.4]}>
        {[
          { x: 0.0, y: 0.0, z: 0.0, r: 0.75 },
          { x: -0.58, y: -0.08, z: 0.1, r: 0.6 },
          { x: 0.62, y: -0.1, z: -0.08, r: 0.65 },
          { x: 0.2, y: 0.22, z: 0.12, r: 0.54 },
        ].map((puff, pi) => (
          <mesh key={`cloud2-exp-${pi}`} position={[puff.x, puff.y, puff.z]} castShadow>
            <dodecahedronGeometry args={[puff.r, 0]} />
            <meshStandardMaterial
              color="#64748b"
              roughness={0.85}
              metalness={0.05}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Iluminação ambiente dourada/âmbar corporativa */}
      <pointLight position={[0, 4.0, 0]} color="#f59e0b" intensity={1.4} distance={12} />
    </group>
  );
};

export const ExperienceIsland = React.memo(ExperienceIslandComponent);
