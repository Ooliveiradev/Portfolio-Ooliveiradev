import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';
import { CosmicPond, CosmicWaterfall } from '../shaders/CosmicWater';

interface EducationIslandProps {
  isNear?: boolean;
}

const EducationIslandComponent: React.FC<EducationIslandProps> = () => {
  // Animation refs
  const waterfallRef = useRef<THREE.Group>(null);
  const cloud1Ref = useRef<THREE.Group>(null);
  const cloud2Ref = useRef<THREE.Group>(null);
  const pencilRef = useRef<THREE.Group>(null);
  const capRef = useRef<THREE.Group>(null);
  const booksRef = useRef<THREE.Group>(null);
  const notebookRef = useRef<THREE.Group>(null);

  // Micro-interaction timer refs (Zero React re-renders)
  const pencilWiggleRef = useRef(0);
  const capTossTimeRef = useRef(0);
  const bookHopTimeRef = useRef(0);
  const notebookFlutterRef = useRef(0);

  // Precomputed waterfall droplets falling into the cosmic void
  const waterfallDroplets = useMemo(() => {
    return [
      { y: -0.8, s: 0.14, xOff: 0.04, zOff: 0.02 },
      { y: -1.8, s: 0.12, xOff: -0.05, zOff: 0.06 },
      { y: -2.8, s: 0.11, xOff: 0.03, zOff: -0.04 },
      { y: -3.8, s: 0.10, xOff: -0.02, zOff: 0.05 },
      { y: -4.8, s: 0.09, xOff: 0.04, zOff: -0.03 },
      { y: -5.8, s: 0.08, xOff: -0.03, zOff: 0.04 },
      { y: -6.8, s: 0.07, xOff: 0.02, zOff: -0.02 },
    ];
  }, []);

  // Precomputed emerald crystal clusters sprouting from rock crevices
  const geodeClusters = useMemo(() => {
    return [
      { pos: [-1.4, -1.8, 1.4] as [number, number, number], rot: [0.4, 0.6, -0.5] as [number, number, number], scale: 0.38 },
      { pos: [-0.8, -3.2, 1.1] as [number, number, number], rot: [0.2, 1.1, 0.4] as [number, number, number], scale: 0.32 },
      { pos: [0.6, -2.2, 1.5] as [number, number, number], rot: [-0.3, 0.4, 0.6] as [number, number, number], scale: 0.36 },
      { pos: [0.9, -3.8, 0.4] as [number, number, number], rot: [0.6, -0.5, 0.8] as [number, number, number], scale: 0.42 },
      { pos: [-0.4, -4.3, 0.6] as [number, number, number], rot: [-0.5, 0.8, -0.3] as [number, number, number], scale: 0.30 },
      { pos: [-1.8, -2.6, 0.3] as [number, number, number], rot: [0.8, -0.4, -0.7] as [number, number, number], scale: 0.35 },
    ];
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // 1. Cascata Cósmica: Fluxo vertical e ciclo de partículas de névoa
    if (waterfallRef.current) {
      waterfallRef.current.position.y = -((t * 2.8) % 1.0);
    }

    // 2. Nuvens volumétricas low-poly flutuando serenamente
    if (cloud1Ref.current) {
      cloud1Ref.current.position.y = 4.4 + Math.sin(t * 1.1) * 0.18;
      cloud1Ref.current.position.x = -2.2 + Math.cos(t * 0.7) * 0.12;
    }
    if (cloud2Ref.current) {
      cloud2Ref.current.position.y = 4.0 + Math.sin(t * 0.9 + 1.5) * 0.15;
      cloud2Ref.current.position.x = 1.9 + Math.cos(t * 0.6 + 1.0) * 0.14;
    }

    // 3. Lápis Hexagonal: Wiggle elástico ao clicar
    if (pencilRef.current) {
      if (pencilWiggleRef.current > 0) {
        const decay = pencilWiggleRef.current;
        pencilRef.current.rotation.z = 0.52 + Math.sin(decay * 24) * 0.18 * (decay / 1.5);
        pencilRef.current.rotation.x = -0.38 + Math.cos(decay * 20) * 0.12 * (decay / 1.5);
        pencilWiggleRef.current = Math.max(0, pencilWiggleRef.current - delta * 2.2);
      } else {
        pencilRef.current.rotation.z = 0.52;
        pencilRef.current.rotation.x = -0.38;
      }
    }

    // 4. Capelo de Formatura: Celebração de lançamento para o ar com rotação 360°
    if (capRef.current) {
      if (capTossTimeRef.current > 0) {
        const progress = (2.0 - capTossTimeRef.current) / 2.0;
        const jumpY = Math.sin(progress * Math.PI) * 2.2;
        const spinY = progress * Math.PI * 4;
        const wobbleZ = Math.sin(progress * Math.PI * 3) * 0.35;

        capRef.current.position.set(0.9, 0.42 + jumpY, 0.6);
        capRef.current.rotation.set(0.08, spinY, wobbleZ);
        capTossTimeRef.current = Math.max(0, capTossTimeRef.current - delta);
      } else {
        capRef.current.position.set(0.9, 0.42, 0.6);
        capRef.current.rotation.set(0.08, 0.25, 0.05);
      }
    }

    // 5. Pilha de Livros: Efeito de acordeom e pulo elástico ao interagir
    if (booksRef.current) {
      if (bookHopTimeRef.current > 0) {
        const progress = (1.2 - bookHopTimeRef.current) / 1.2;
        const hop = Math.sin(progress * Math.PI) * 0.22;
        booksRef.current.position.y = 0.15 + hop;
        bookHopTimeRef.current = Math.max(0, bookHopTimeRef.current - delta * 1.8);
      } else {
        booksRef.current.position.y = 0.15;
      }
    }

    // 6. Caderno Espiral: Folheio de páginas sutil
    if (notebookRef.current) {
      if (notebookFlutterRef.current > 0) {
        notebookFlutterRef.current = Math.max(0, notebookFlutterRef.current - delta * 2.0);
      }
    }
  });

  // Handlers de micro-interações (Zero React re-renders)
  const handlePencilClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playPencilSketch();
    pencilWiggleRef.current = 1.5;
  };

  const handleCapClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playCapToss();
    capTossTimeRef.current = 2.0;
  };

  const handleBooksClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playBookPageFlip();
    bookHopTimeRef.current = 1.2;
  };

  const handleNotebookClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playBookPageFlip();
    notebookFlutterRef.current = 1.0;
  };

  return (
    <group>
      {/* =========================================================
          1. 🌋 QUILHA DE XISTO VULCÂNICO, ESTRATOS & RAÍZES
             Fiel à imagem de referência (education_island_3d)
         ========================================================= */}
      {/* Quilha vulcânica escura profundamente facetada em ponta curva */}
      <mesh position={[0.2, -2.8, 0.1]} rotation={[0.08, 0.35, -0.06]} castShadow receiveShadow>
        <cylinderGeometry args={[5.2, 0.6, 5.2, 7]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.92}
          metalness={0.06}
          flatShading
        />
      </mesh>

      {/* Ponta inferior chanfrada e assimétrica da ilha */}
      <mesh position={[0.4, -5.2, 0.3]} rotation={[0.15, 0.8, -0.12]} castShadow receiveShadow>
        <coneGeometry args={[0.9, 1.8, 6]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.95}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* Saliente rochoso secundário de apoio na lateral */}
      <mesh position={[-0.8, -3.2, -0.6]} rotation={[-0.2, 0.5, 0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[3.2, 1.1, 3.4, 6]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.88}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Camadas geológicas estratificadas em terracota & argila fértil */}
      <mesh position={[0, -0.65, 0]} rotation={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.0, 0.9, 8]} />
        <meshStandardMaterial
          color="#9a3412"
          roughness={0.85}
          metalness={0.04}
          flatShading
        />
      </mesh>

      {/* Falésias de calcário claro incrustadas no flanco direito */}
      <mesh position={[2.6, -1.5, 0.4]} rotation={[0.1, -0.4, 0.2]} castShadow receiveShadow>
        <cylinderGeometry args={[1.6, 0.8, 2.4, 6]} />
        <meshStandardMaterial
          color="#64748b"
          roughness={0.82}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Raízes poligonais grossas entrelaçadas abraçando a quilha rochosa */}
      <group>
        {/* Raiz 1: Borda frontal descendo e contornando a rocha */}
        <mesh position={[-1.2, -1.8, 1.8]} rotation={[0.5, 0.3, -0.6]} castShadow>
          <cylinderGeometry args={[0.18, 0.12, 2.6, 6]} />
          <meshStandardMaterial color="#582900" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.3, -2.9, 1.4]} rotation={[0.8, 0.1, -0.4]} castShadow>
          <cylinderGeometry args={[0.13, 0.08, 2.2, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} flatShading />
        </mesh>

        {/* Raiz 2: Borda lateral direita abraçando a falésia */}
        <mesh position={[2.4, -1.6, 1.2]} rotation={[-0.4, -0.5, 0.7]} castShadow>
          <cylinderGeometry args={[0.22, 0.14, 2.8, 6]} />
          <meshStandardMaterial color="#582900" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[1.8, -2.8, 0.8]} rotation={[-0.2, -0.8, 0.5]} castShadow>
          <cylinderGeometry args={[0.15, 0.09, 2.4, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} flatShading />
        </mesh>

        {/* Raiz 3: Raiz profunda espiralando em direção à ponta inferior */}
        <mesh position={[0.7, -4.1, 0.5]} rotation={[0.3, 0.6, -0.2]} castShadow>
          <cylinderGeometry args={[0.11, 0.06, 2.0, 5]} />
          <meshStandardMaterial color="#381a02" roughness={0.9} flatShading />
        </mesh>
      </group>

      {/* Geodos de cristal esmeralda brotando das fendas da quilha */}
      {geodeClusters.map((geo, gIdx) => (
        <group key={`geode-${gIdx}`} position={geo.pos} rotation={geo.rot} scale={[geo.scale, geo.scale * 1.5, geo.scale]}>
          <mesh castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#10b981"
              emissive="#34d399"
              emissiveIntensity={1.8}
              roughness={0.2}
              metalness={0.3}
              flatShading
            />
          </mesh>
          <mesh position={[0.25, 0.3, 0.15]} scale={0.65} castShadow>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#34d399"
              emissive="#6ee7b7"
              emissiveIntensity={2.2}
              roughness={0.15}
              metalness={0.2}
              flatShading
            />
          </mesh>
          {/* Emissive fixtures share the island fill light. */}
        </group>
      ))}

      {/* Cascata Cósmica Crystalline despencando no vácuo estelar */}
      <group position={[-2.4, 0.05, 1.6]}>
        {/* Leito de transição onde a água verte sobre a borda chanfrada */}
        <mesh position={[0.15, -0.05, -0.15]} rotation={[-0.3, 0.6, 0.2]}>
          <boxGeometry args={[0.8, 0.14, 0.9]} />
          <meshStandardMaterial
            color="#7dd3fc"
            emissive="#38bdf8"
            emissiveIntensity={0.8}
            roughness={0.1}
            transparent
            opacity={0.85}
            flatShading
          />
        </mesh>

        {/* Coluna principal da cascata com shader procedural de fluxo contínuo */}
        <CosmicWaterfall position={[0, -0.2, 0]} height={7.4} width={0.85} />

        {/* Facho interno de luz translúcida cristalina */}
        <mesh position={[0, -3.8, 0]}>
          <cylinderGeometry args={[0.22, 0.14, 7.6, 5]} />
          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#bae6fd"
            emissiveIntensity={1.5}
            roughness={0.1}
            transparent
            opacity={0.7}
            flatShading
          />
        </mesh>

        {/* Gotículas e névoa cintilante despencando ciclicamente */}
        <group ref={waterfallRef}>
          {waterfallDroplets.map((drop, dIdx) => (
            <mesh
              key={`water-drop-${dIdx}`}
              position={[drop.xOff, drop.y, drop.zOff]}
              scale={[drop.s, drop.s * 2.2, drop.s]}
            >
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#e0f2fe"
                emissive="#38bdf8"
                emissiveIntensity={2.4}
                roughness={0.1}
                transparent
                opacity={0.92}
                flatShading
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* =========================================================
          2. 🌿 PLATÔ SUPERIOR: COLINAS VERDES & RIACHO FACETADO
         ========================================================= */}
      {/* Base principal de grama em verde-primavera com bordas chanfradas */}
      <mesh position={[0, 0.02, 0]} rotation={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[5.6, 5.5, 0.28, 8]} />
        <meshStandardMaterial
          color="#84cc16"
          roughness={0.78}
          metalness={0.02}
          flatShading
        />
      </mesh>

      {/* Colina elevada do lado esquerdo (sustenta a Árvore do Conhecimento) */}
      <group position={[-2.4, 0.2, -0.9]}>
        <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.3, 2.7, 0.45, 7]} />
          <meshStandardMaterial color="#65a30d" roughness={0.75} flatShading />
        </mesh>
        <mesh position={[0.2, 0.4, 0.1]} receiveShadow castShadow>
          <sphereGeometry args={[1.5, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#84cc16" roughness={0.72} flatShading />
        </mesh>

        {/* Cerquinha rústica branca de piquetes na borda da colina */}
        {[
          { x: 1.6, z: 0.8, rotY: 0.4 },
          { x: 1.8, z: 0.1, rotY: 0.1 },
          { x: 1.8, z: -0.6, rotY: -0.2 },
          { x: 1.5, z: -1.3, rotY: -0.5 },
        ].map((fence, fIdx) => (
          <group key={`fence-post-${fIdx}`} position={[fence.x, 0.4, fence.z]} rotation={[0, fence.rotY, 0]}>
            {/* Piquete vertical com topo pontiagudo */}
            <mesh position={[0, 0.22, 0]} castShadow>
              <boxGeometry args={[0.08, 0.44, 0.08]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.48, 0]} castShadow>
              <coneGeometry args={[0.06, 0.1, 4]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            {/* Travessa horizontal de união da cerca */}
            {fIdx < 3 && (
              <mesh position={[0.05, 0.24, -0.35]} rotation={[0, -0.25, 0]}>
                <boxGeometry args={[0.04, 0.06, 0.72]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* Lago sagrado de reflexão com shader procedural de ondulação cósmica */}
      <CosmicPond position={[-0.2, 0.18, -0.7]} scale={[0.9, 1, 0.9]} />

      {/* Leito do riacho cristalino que cruza o platô e alimenta a cascata */}
      <group position={[-1.2, 0.08, 0.5]} rotation={[0, 0.45, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.7, 0.04, 2.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.9}
            roughness={0.15}
            transparent
            opacity={0.88}
            flatShading
          />
        </mesh>
        {/* Cristais de água reluzente na superfície do riacho */}
        {[-0.8, 0.1, 0.9].map((wz, wi) => (
          <mesh key={`stream-shine-${wi}`} position={[0.1 * (wi % 2 ? 1 : -1), 0.03, wz]} scale={0.15}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={1.8} />
          </mesh>
        ))}
      </group>

      {/* Pedras de Rio (Stepping Stones) conectando o Foguetiponto à clareira */}
      {[
        { x: 0.1, z: 2.4, s: 0.45 },
        { x: 0.4, z: 1.8, s: 0.52 },
        { x: 0.2, z: 1.2, s: 0.48 },
        { x: 0.5, z: 0.5, s: 0.42 },
      ].map((stone, sIdx) => (
        <mesh
          key={`step-stone-${sIdx}`}
          position={[stone.x, 0.12, stone.z]}
          scale={[stone.s, stone.s * 0.35, stone.s * 0.9]}
          rotation={[0, sIdx * 0.6, 0]}
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.65} metalness={0.08} flatShading />
        </mesh>
      ))}

      {/* =========================================================
          3. 🌳 ÁRVORE DO CONHECIMENTO DOURADA
             Inspirada fielmente na referência (education_island_3d)
         ========================================================= */}
      <group position={[-2.4, 0.65, -1.0]}>
        {/* Tronco retorcido de madeira escura com ramificações */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.38, 1.4, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[-0.25, 1.4, 0.1]} rotation={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.9, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} flatShading />
        </mesh>
        <mesh position={[0.28, 1.35, -0.12]} rotation={[0, 0, -0.45]} castShadow>
          <cylinderGeometry args={[0.14, 0.19, 0.85, 6]} />
          <meshStandardMaterial color="#451a03" roughness={0.85} flatShading />
        </mesh>

        {/* Copa geométrica dourada/âmbar facetada (Dodecaedros Low-Poly) */}
        {[
          { x: 0.0, y: 2.3, z: 0.0, r: 1.35, col: '#f59e0b' },
          { x: -0.65, y: 2.0, z: 0.2, r: 1.05, col: '#d97706' },
          { x: 0.7, y: 1.9, z: -0.15, r: 1.1, col: '#fbbf24' },
          { x: 0.15, y: 1.8, z: 0.6, r: 0.95, col: '#f59e0b' },
          { x: -0.2, y: 2.7, z: -0.1, r: 0.9, col: '#fde68a' },
        ].map((canopy, cIdx) => (
          <mesh key={`canopy-${cIdx}`} position={[canopy.x, canopy.y, canopy.z]} castShadow>
            <dodecahedronGeometry args={[canopy.r, 0]} />
            <meshStandardMaterial
              color={canopy.col}
              emissive={canopy.col}
              emissiveIntensity={0.25}
              roughness={0.6}
              metalness={0.08}
              flatShading
            />
          </mesh>
        ))}

        {/* Luz dourada suave irradiando da copa */}
        {/* Emissive fixtures share the island fill light. */}
      </group>

      {/* =========================================================
          4. 🏛️ CÍRCULO DE MEGÁLITOS (STONEHENGE ALGORÍTMICO)
             Fundo central do platô
         ========================================================= */}
      <group position={[0.4, 0.1, -1.8]}>
        {/* Pilares verticais de pedra calcária branca facetada */}
        {[
          { x: -1.2, z: 0.0, h: 2.1, w: 0.55, d: 0.45, ry: 0.1 },
          { x: -0.4, z: -0.3, h: 2.3, w: 0.6, d: 0.48, ry: -0.2 },
          { x: 0.7, z: -0.35, h: 2.35, w: 0.62, d: 0.5, ry: 0.15 },
          { x: 1.5, z: 0.1, h: 2.05, w: 0.54, d: 0.44, ry: 0.3 },
        ].map((pillar, pIdx) => (
          <mesh
            key={`stone-pillar-${pIdx}`}
            position={[pillar.x, pillar.h / 2, pillar.z]}
            rotation={[0, pillar.ry, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[pillar.w, pillar.h, pillar.d]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.88} metalness={0.06} flatShading />
          </mesh>
        ))}

        {/* Travessas horizontais (Lintéis) apoiadas sobre os pares de pilares */}
        {/* Dintel 1: Sobre os dois pilares esquerdos */}
        <mesh position={[-0.8, 2.3, -0.15]} rotation={[0, -0.15, 0.02]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.4, 0.58]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.85} metalness={0.06} flatShading />
        </mesh>

        {/* Dintel 2: Sobre os dois pilares direitos */}
        <mesh position={[1.1, 2.35, -0.12]} rotation={[0, 0.22, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[1.55, 0.42, 0.6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.85} metalness={0.06} flatShading />
        </mesh>

        {/* Arbustos outonais avermelhados na base dos monólitos */}
        {[
          { x: -1.6, z: 0.3, col: '#dc2626', s: 0.26 },
          { x: 0.15, z: -0.6, col: '#ea580c', s: 0.28 },
          { x: 1.9, z: 0.4, col: '#b91c1c', s: 0.24 },
        ].map((shrub, shIdx) => (
          <mesh key={`shrub-${shIdx}`} position={[shrub.x, shrub.s, shrub.z]} scale={shrub.s} castShadow>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={shrub.col} roughness={0.7} flatShading />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          5. ✏️ LÁPIS HEXAGONAL GIGANTE TOY MINIATURE
             Inclinado no solo, com grafite fincado na relva
         ========================================================= */}
      <group
        ref={pencilRef}
        position={[-1.3, 1.4, 0.5]}
        onClick={handlePencilClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Corpo sextavado amarelo canário */}
        <mesh castShadow>
          <cylinderGeometry args={[0.34, 0.34, 3.8, 6]} />
          <meshStandardMaterial
            color="#eab308"
            roughness={0.35}
            metalness={0.06}
          />
        </mesh>

        {/* Virola metálica cromada escovada */}
        <mesh position={[0, 2.05, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.42, 14]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.85} />
        </mesh>

        {/* Borracha rosa pastel clássica */}
        <mesh position={[0, 2.45, 0]} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.45, 12]} />
          <meshStandardMaterial color="#f472b6" roughness={0.45} metalness={0.02} />
        </mesh>

        {/* Madeira natural talhada apontada */}
        <mesh position={[0, -2.25, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.34, 0.75, 6]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.55} metalness={0.02} />
        </mesh>

        {/* Ponta de grafite escuro afiado */}
        <mesh position={[0, -2.72, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.13, 0.32, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.35} />
        </mesh>
      </group>

      {/* =========================================================
          6. 📖 CADERNO ESPIRAL ABERTO COM NOTAS TÁTEIS
         ========================================================= */}
      <group
        ref={notebookRef}
        position={[-0.4, 0.14, 0.9]}
        rotation={[-0.08, 0.35, 0.05]}
        onClick={handleNotebookClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Capa e Páginas da Esquerda */}
        <group position={[-0.75, 0, 0]} rotation={[0, 0.06, 0]}>
          <mesh position={[0, -0.04, 0]} castShadow>
            <boxGeometry args={[1.4, 0.08, 1.8]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <boxGeometry args={[1.35, 0.09, 1.74]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.02} />
          </mesh>
          {/* Pautas azuis desenhadas na página */}
          {[-0.6, -0.3, 0.0, 0.3, 0.6].map((lz, idx) => (
            <mesh key={`rule-l-${idx}`} position={[0, 0.085, lz]}>
              <planeGeometry args={[1.1, 0.02]} />
              <meshStandardMaterial color="#93c5fd" roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Capa e Páginas da Direita */}
        <group position={[0.75, 0, 0]} rotation={[0, -0.06, 0]}>
          <mesh position={[0, -0.04, 0]} castShadow>
            <boxGeometry args={[1.4, 0.08, 1.8]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <boxGeometry args={[1.35, 0.09, 1.74]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.02} />
          </mesh>
          {/* Esboço de grafo algorítmico desenhado na folha */}
          {[-0.5, -0.2, 0.1, 0.4, 0.7].map((lz, idx) => (
            <mesh key={`rule-r-${idx}`} position={[0, 0.085, lz]}>
              <planeGeometry args={[1.1, 0.02]} />
              <meshStandardMaterial color="#93c5fd" roughness={0.3} />
            </mesh>
          ))}
          {/* Marcador amarelo marca-texto */}
          <mesh position={[0.1, 0.09, -0.2]}>
            <planeGeometry args={[0.7, 0.09]} />
            <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.6} transparent opacity={0.75} />
          </mesh>
        </group>

        {/* Espiral metálica aramada realista na lombada */}
        {[-0.7, -0.42, -0.14, 0.14, 0.42, 0.7].map((sz, idx) => (
          <mesh key={`spiral-${idx}`} position={[0, 0.09, sz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.12, 0.022, 8, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.75} />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          7. 📚 PILHA DE LIVROS ENCADERNADOS EM COURO
         ========================================================= */}
      <group
        ref={booksRef}
        position={[0.7, 0.15, -0.2]}
        rotation={[0, 0.35, 0]}
        onClick={handleBooksClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Livro 1 (Inferior - Carmesim Nobre) */}
        <group position={[0, 0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.65, 0.24, 1.25]} />
            <meshStandardMaterial color="#991b1b" roughness={0.45} metalness={0.08} />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[1.55, 0.2, 1.15]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.02} />
          </mesh>
          {/* Fita marcadora dourada caindo pela lateral */}
          <mesh position={[0.78, -0.12, 0.1]} rotation={[0, 0, 0.25]} castShadow>
            <boxGeometry args={[0.12, 0.42, 0.03]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
          </mesh>
        </group>

        {/* Livro 2 (Intermediário - Safira / Navy) */}
        <group position={[0.04, 0.34, 0.02]} rotation={[0, -0.18, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.52, 0.22, 1.16]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.45} metalness={0.08} />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[1.42, 0.18, 1.08]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.02} />
          </mesh>
        </group>

        {/* Livro 3 (Superior - Âmbar Dourado com Detalhes Geométricos) */}
        <group position={[-0.03, 0.54, -0.02]} rotation={[0, 0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.38, 0.20, 1.05]} />
            <meshStandardMaterial color="#92400e" roughness={0.4} metalness={0.1} />
          </mesh>
          <mesh position={[0.04, 0, 0]}>
            <boxGeometry args={[1.28, 0.16, 0.98]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.4} metalness={0.02} />
          </mesh>
          {/* Emblema dourado em relevo na capa */}
          <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.26, 16]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          8. 🎓 CAPELO ACADÊMICO (MORTARBOARD) COM BORLA DOURADA
             Apoiado sobre livro adjacente à pilha
         ========================================================= */}
      {/* Livro de apoio do capelo */}
      <group position={[0.9, 0.12, 0.6]} rotation={[0, 0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.3, 0.2, 1.0]} />
          <meshStandardMaterial color="#7f1d1d" roughness={0.42} />
        </mesh>
        <mesh position={[0.03, 0, 0]}>
          <boxGeometry args={[1.22, 0.16, 0.92]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.4} />
        </mesh>
      </group>

      {/* Capelo interativo (clique para jogar para o ar com comemoração) */}
      <group
        ref={capRef}
        position={[0.9, 0.42, 0.6]}
        onClick={handleCapClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Placa quadrada rígida superior chanfrada */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[1.1, 0.05, 1.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.12} />
        </mesh>

        {/* Casquete anatômico do crânio */}
        <mesh position={[0, -0.1, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.4, 0.24, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.12} />
        </mesh>

        {/* Botão central dourado */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* Borla dourada pendurada caindo pela quina */}
        <group position={[0.38, -0.04, 0.38]} rotation={[0.3, 0, 0.3]}>
          {/* Cordão de seda */}
          <mesh position={[-0.12, 0.06, -0.12]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.012, 0.012, 0.32, 6]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Pompom da borla */}
          <mesh position={[0, -0.12, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.05, 0.36, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.35} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          9. ☁️ NUVENS POLIGONAIS VOLUMÉTRICAS LOW-POLY
             Flutuando estáticas sobre a ilha (inspiradas na Ref 1)
         ========================================================= */}
      {/* Nuvem 1: Branca pura facetada acima da Árvore do Conhecimento */}
      <group ref={cloud1Ref} position={[-2.2, 4.4, -1.0]}>
        {[
          { x: 0.0, y: 0.0, z: 0.0, r: 0.8 },
          { x: -0.6, y: -0.1, z: 0.1, r: 0.65 },
          { x: 0.65, y: -0.12, z: -0.1, r: 0.68 },
          { x: -0.25, y: 0.25, z: -0.15, r: 0.55 },
          { x: 0.35, y: 0.22, z: 0.15, r: 0.6 },
        ].map((puff, pi) => (
          <mesh key={`cloud1-puff-${pi}`} position={[puff.x, puff.y, puff.z]} castShadow>
            <dodecahedronGeometry args={[puff.r, 0]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.8}
              metalness={0.02}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Nuvem 2: Cinza ardósia suave facetada acima dos Monólitos */}
      <group ref={cloud2Ref} position={[1.9, 4.0, -1.8]}>
        {[
          { x: 0.0, y: 0.0, z: 0.0, r: 0.72 },
          { x: -0.55, y: -0.08, z: 0.1, r: 0.58 },
          { x: 0.6, y: -0.1, z: -0.08, r: 0.62 },
          { x: 0.2, y: 0.2, z: 0.12, r: 0.52 },
        ].map((puff, pi) => (
          <mesh key={`cloud2-puff-${pi}`} position={[puff.x, puff.y, puff.z]} castShadow>
            <dodecahedronGeometry args={[puff.r, 0]} />
            <meshStandardMaterial
              color="#64748b"
              roughness={0.82}
              metalness={0.05}
              flatShading
            />
          </mesh>
        ))}
      </group>

    </group>
  );
};

export const EducationIsland = React.memo(EducationIslandComponent);
