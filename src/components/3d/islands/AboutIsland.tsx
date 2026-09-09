import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';

export const AboutIsland: React.FC = () => {
  // Animation refs
  const gyroRing1Ref = useRef<THREE.Group>(null);
  const gyroRing2Ref = useRef<THREE.Group>(null);
  const paperPlaneRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const commsDishRef = useRef<THREE.Group>(null);
  const deskLightRef = useRef<THREE.SpotLight>(null);
  const koiFishRef = useRef<THREE.Group>(null);
  const petalsGroupRef = useRef<THREE.Group>(null);
  const waterfallRef = useRef<THREE.Group>(null);

  // Micro-interaction states
  // 1. Pixar Lamp toggle state
  const [lampOn, setLampOn] = useState(true);

  // 2. Monitor Screen Mode state (0: VS Code, 1: Matrix Terminal, 2: Celestial Radar)
  const [screenMode, setScreenMode] = useState(0);
  const [screenFlash, setScreenFlash] = useState(0);

  // 3. Paper Plane aerobatic flight state (timer > 0 means flying)
  const [flightTimer, setFlightTimer] = useState(0);

  // 4. Coffee steam boost state
  const [coffeeBoost, setCoffeeBoost] = useState(0);

  // Precomputed petal particles for the blooming Sakura tree
  const petalData = useMemo(() => {
    return [
      { pos: [1.8, 2.2, -0.4], scale: 0.08, speed: 1.2 },
      { pos: [2.5, 2.0, -0.8], scale: 0.07, speed: 0.9 },
      { pos: [2.1, 1.8, -0.2], scale: 0.09, speed: 1.4 },
      { pos: [2.6, 2.4, -0.5], scale: 0.06, speed: 1.1 },
      { pos: [1.6, 1.6, -0.7], scale: 0.08, speed: 0.8 },
      { pos: [2.3, 1.4, -0.1], scale: 0.07, speed: 1.3 },
    ];
  }, []);

  // Precomputed cosmic waterfall droplet offsets
  const waterfallDroplets = useMemo(() => {
    return [
      { x: -3.2, y: -0.8, z: 0.4, s: 0.12 },
      { x: -3.28, y: -1.6, z: 0.45, s: 0.10 },
      { x: -3.24, y: -2.4, z: 0.38, s: 0.09 },
      { x: -3.32, y: -3.2, z: 0.42, s: 0.08 },
      { x: -3.26, y: -4.0, z: 0.39, s: 0.07 },
    ];
  }, []);

  useFrame((_, delta) => {
    const t = Date.now() * 0.001;

    // 1. Aros Giroscópicos de Latão na Quilha em Rotação Oblíqua
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.z += delta * 0.35;
      gyroRing1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.25 + 0.4;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y -= delta * 0.45;
      gyroRing2Ref.current.rotation.z = Math.cos(t * 0.6) * 0.25 - 0.35;
    }

    // 2. Cascata Cósmica escorrendo para o vácuo
    if (waterfallRef.current) {
      waterfallRef.current.position.y = -((t * 2.2) % 0.8);
    }

    // 3. Aviãozinho de Papel: Voo acrobático em looping 3D fluido vs Pouso na mesa
    if (paperPlaneRef.current) {
      if (flightTimer > 0) {
        // Trajetória acrobática fluida em arco por toda a ilha e jardim zen
        const flightProgress = (4.0 - flightTimer) / 4.0; // 0 -> 1
        const flightAngle = flightProgress * Math.PI * 4; // 2 voltas completas
        const orbitRadius = 2.8 + Math.sin(flightProgress * Math.PI * 2) * 1.2;

        const px = Math.cos(flightAngle) * orbitRadius;
        const pz = Math.sin(flightAngle) * orbitRadius;
        const py = 2.2 + Math.sin(flightProgress * Math.PI * 4) * 0.9 + Math.cos(flightProgress * Math.PI) * 0.4;

        paperPlaneRef.current.position.set(px, py, pz);
        // Orientação tangente à curva + inclinação de banking acrobático
        paperPlaneRef.current.rotation.y = -flightAngle + Math.PI / 2;
        paperPlaneRef.current.rotation.z = Math.sin(flightProgress * Math.PI * 4) * 0.65;
        paperPlaneRef.current.rotation.x = -Math.cos(flightProgress * Math.PI * 4) * 0.25;
      } else {
        // Pousado elegantemente no flanco da mesa com leve respiração tátil
        paperPlaneRef.current.position.set(-0.2, 1.34, 0.42);
        paperPlaneRef.current.rotation.set(0.1, -0.3, 0.05 + Math.sin(t * 2.0) * 0.02);
      }
    }

    // 4. Carpa Koi nadando no lago
    if (koiFishRef.current) {
      const koiAngle = t * 0.75;
      const kx = 1.5 + Math.cos(koiAngle) * 0.7;
      const kz = 0.8 + Math.sin(koiAngle) * 0.55;
      koiFishRef.current.position.set(kx, 0.12, kz);
      koiFishRef.current.rotation.y = -koiAngle + Math.PI / 2;
      koiFishRef.current.rotation.z = Math.sin(t * 3.5) * 0.12; // ondulação da cauda
    }

    // 5. Pétalas de flor de cerejeira (Sakura) flutuando suavemente
    if (petalsGroupRef.current) {
      petalsGroupRef.current.children.forEach((petal, idx) => {
        const pData = petalData[idx];
        if (pData) {
          petal.position.y = pData.pos[1] + Math.sin(t * pData.speed) * 0.12;
          petal.rotation.z = Math.sin(t * pData.speed * 1.5) * 0.3;
          petal.rotation.y = t * 0.4;
        }
      });
    }

    // 6. Rotação suave do vapor do café
    if (steamRef.current) {
      steamRef.current.rotation.y += delta * (0.6 + coffeeBoost * 2.0);
      const steamScale = 1.0 + coffeeBoost * 0.7;
      steamRef.current.scale.set(steamScale, steamScale * 1.2, steamScale);
    }

    // 7. Varredura periódica da antena parabólica de comunicação
    if (commsDishRef.current) {
      commsDishRef.current.rotation.y = Math.sin(t * 0.7) * 0.45;
      commsDishRef.current.rotation.x = -0.6 + Math.sin(t * 0.4) * 0.08;
    }

    // 8. Luminária Pixar: fade suave na intensidade
    if (deskLightRef.current) {
      const targetIntensity = lampOn ? 2.8 + Math.sin(t * 2.0) * 0.2 : 0.0;
      deskLightRef.current.intensity = THREE.MathUtils.lerp(
        deskLightRef.current.intensity,
        targetIntensity,
        delta * 8.0
      );
    }

    // Timers de decaimento
    if (flightTimer > 0) {
      setFlightTimer((prev) => Math.max(0, prev - delta));
    }
    if (screenFlash > 0) {
      setScreenFlash((prev) => Math.max(0, prev - delta * 3.0));
    }
    if (coffeeBoost > 0) {
      setCoffeeBoost((prev) => Math.max(0, prev - delta * 1.8));
    }
  });

  // Handlers de micro-interatividades
  const handleLampClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const nextState = !lampOn;
    setLampOn(nextState);
    sounds.playLampSwitch(nextState);
  };

  const handleScreenClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playTerminalBeep();
    setScreenFlash(1.0);
    setScreenMode((prev) => (prev + 1) % 3);
  };

  const handlePaperPlaneClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playPaperPlaneWhoosh();
    setFlightTimer(4.0); // 4 segundos de voo acrobático
  };

  const handleCoffeeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playSipCoffee();
    setCoffeeBoost(1.0);
  };

  return (
    <group>
      {/* ===================================================================
          1. 🌋 BASE INFERIOR: METEORITO ORGÂNICO & DECK CANTILEVER NÓRDICO
             Linguagem escultural única inspirada na Issue #1 e Issue #3
         =================================================================== */}

      {/* Quilha de Meteorito Esculpido Assimétrico (Faceted Organic Asteroid) */}
      <mesh position={[0.2, -2.5, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[5.2, 1.1, 4.2, 7]} />
        <meshStandardMaterial
          color="#38251a"
          roughness={0.88}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* Crateras de Impacto Facetadas no Meteorito */}
      {[
        { x: -1.6, y: -2.8, z: 1.2, r: 0.65 },
        { x: 1.4, y: -2.2, z: -1.4, r: 0.55 },
        { x: -0.8, y: -3.6, z: -0.7, r: 0.45 },
      ].map((crater, cIdx) => (
        <mesh key={`crater-${cIdx}`} position={[crater.x, crater.y, crater.z]}>
          <dodecahedronGeometry args={[crater.r, 0]} />
          <meshStandardMaterial
            color="#231710"
            roughness={0.92}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}

      {/* Núcleo Geotérmico Âmbar Incandescente na Ponta Inferior */}
      <group position={[0.2, -4.3, -0.1]}>
        <pointLight color="#f97316" intensity={2.6} distance={8} />
        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <meshStandardMaterial
            color="#f97316"
            emissive="#ea580c"
            emissiveIntensity={2.5}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Vigas Diagonais em Madeira Laminada Cruzada (Cantilever Timber Braces) */}
      {[
        { x: -2.8, z: -0.8, ang: 0.4 },
        { x: -2.6, z: 0.6, ang: -0.3 },
        { x: -1.8, z: 1.6, ang: -0.7 },
        { x: -1.4, z: -1.6, ang: 0.7 },
      ].map((brace, bIdx) => (
        <mesh
          key={`brace-${bIdx}`}
          position={[brace.x * 0.7, -1.4, brace.z * 0.7]}
          rotation={[brace.ang * 0.5, 0, 0.65]}
          castShadow
        >
          <boxGeometry args={[0.22, 2.8, 0.24]} />
          <meshStandardMaterial color="#78350f" roughness={0.55} metalness={0.05} />
        </mesh>
      ))}

      {/* Dois Aros Giroscópicos Finos de Latão Escovado em Rotação Oblíqua */}
      <group position={[0.2, -4.0, -0.1]}>
        <group ref={gyroRing1Ref}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.5, 0.025, 8, 36]} />
            <meshStandardMaterial
              color="#f59e0b"
              roughness={0.25}
              metalness={0.85}
            />
          </mesh>
        </group>
        <group ref={gyroRing2Ref}>
          <mesh rotation={[0, 0, -Math.PI / 2]}>
            <torusGeometry args={[1.8, 0.022, 8, 36]} />
            <meshStandardMaterial
              color="#fbbf24"
              roughness={0.28}
              metalness={0.82}
            />
          </mesh>
        </group>
      </group>

      {/* Cascata Cósmica de Partículas de Cristal que escorrem para o vácuo */}
      <group position={[-3.2, 0, 0.4]}>
        {/* Fenda no deck de onde sai o filete */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.6]} />
          <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
        {/* Filete contínuo de água cristalina */}
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.06, 0.09, 3.4, 8]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.4}
            transparent
            opacity={0.65}
          />
        </mesh>
        {/* Gotículas em queda */}
        <group ref={waterfallRef}>
          {waterfallDroplets.map((drop, dIdx) => (
            <mesh key={`drop-${dIdx}`} position={[0, drop.y, 0]} scale={[drop.s, drop.s * 1.5, drop.s]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#e0f2fe"
                emissive="#38bdf8"
                emissiveIntensity={1.8}
                transparent
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* ===================================================================
          2. 🌸 PLATÔ SUPERIOR: PÁTIO DE TECA CANTILEVER & JARDIM ZEN JAPONÊS
         =================================================================== */}

      {/* Deck Cantilever em Balanço de Tábuas de Nogueira e Teca (Lado Esquerdo) */}
      <mesh position={[-1.2, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.5, 4.4, 0.35, 12, 1, false, Math.PI * 0.4, Math.PI * 1.2]} />
        <meshStandardMaterial color="#92400e" roughness={0.42} metalness={0.06} />
      </mesh>

      {/* Gramado Suave do Jardim Zen (Lado Direito) */}
      <mesh position={[1.4, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[4.2, 4.3, 0.32, 12, 1, false, -Math.PI * 0.6, Math.PI * 1.2]} />
        <meshStandardMaterial color="#15803d" roughness={0.78} metalness={0.02} />
      </mesh>

      {/* Friso Perimetral de Latão Dourado Nobre */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.2, 5.5, 32]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.32}
          metalness={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Pedras de Rio Polidas (Tobi-ishi) Conectando a Estação ao Jardim e ao Foguetiponto */}
      {[
        { x: -0.2, z: 1.4, s: 0.38 },
        { x: 0.3, z: 1.6, s: 0.42 },
        { x: 0.1, z: 2.1, s: 0.36 },
        { x: -0.1, z: 2.6, s: 0.4 },
        { x: 0.7, z: 0.3, s: 0.35 },
        { x: 0.9, z: -0.3, s: 0.38 },
      ].map((stone, sIdx) => (
        <mesh
          key={`tobi-stone-${sIdx}`}
          position={[stone.x, 0.08, stone.z]}
          scale={[stone.s, stone.s * 0.4, stone.s * 1.15]}
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#475569"
            roughness={0.65}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}

      {/* ===================================================================
          3. ⛩️ ELEMENTOS ZEN & PAISAGISMO (SAKURA, LAGO DE CARPAS E TŌRŌ)
         =================================================================== */}

      {/* Bonsai Sakura Estilizado com Copa Florida em Flor de Cerejeira */}
      <group position={[2.2, 0.05, -0.7]}>
        {/* Tronco retorcido em madeira nobre */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.28, 1.0, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0.22, 1.1, 0.1]} rotation={[0, 0, -0.45]} castShadow>
          <cylinderGeometry args={[0.11, 0.16, 0.8, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[-0.2, 1.0, -0.15]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 0.7, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {/* Copa floridíssima em tons de rosa e branco (Cherry Blossom Canopy) */}
        {[
          { x: 0.3, y: 1.6, z: 0.15, r: 0.85, col: '#f472b6' },
          { x: -0.3, y: 1.5, z: -0.2, r: 0.75, col: '#ec4899' },
          { x: 0.0, y: 1.9, z: 0.0, r: 0.95, col: '#fbcfe8' },
          { x: 0.4, y: 1.3, z: -0.3, r: 0.65, col: '#ffffff' },
          { x: -0.4, y: 1.3, z: 0.25, r: 0.68, col: '#f472b6' },
        ].map((canopy, cIdx) => (
          <mesh key={`canopy-${cIdx}`} position={[canopy.x, canopy.y, canopy.z]} castShadow>
            <dodecahedronGeometry args={[canopy.r, 0]} />
            <meshStandardMaterial
              color={canopy.col}
              emissive={canopy.col}
              emissiveIntensity={0.2}
              roughness={0.65}
              metalness={0.05}
              flatShading
            />
          </mesh>
        ))}

        {/* Pétalas suspensas esvoaçando suavemente na brisa */}
        <group ref={petalsGroupRef}>
          {petalData.map((p, idx) => (
            <mesh key={`petal-${idx}`} position={p.pos as [number, number, number]} scale={p.scale}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color="#fbcfe8"
                emissive="#f472b6"
                emissiveIntensity={0.4}
                roughness={0.4}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* Lago de Carpas Cristalino (Koi Pond) */}
      <group position={[1.5, 0.05, 0.8]}>
        {/* Depressão rochosa da margem do lago */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1.25, 1.35, 0.16, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.7} flatShading />
        </mesh>
        {/* Superfície d'água azul celeste translúcida */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.18, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.4}
            roughness={0.1}
            metalness={0.15}
            transparent
            opacity={0.8}
          />
        </mesh>
        {/* Folhas de lótus flutuantes com flor rosa */}
        {[-0.4, 0.5].map((lx, idx) => (
          <group key={`lotus-${idx}`} position={[lx, 0.05, idx * 0.3]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.18, 8]} />
              <meshStandardMaterial color="#22c55e" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <coneGeometry args={[0.08, 0.08, 6]} />
              <meshStandardMaterial color="#ec4899" emissive="#f472b6" emissiveIntensity={0.6} />
            </mesh>
          </group>
        ))}

        {/* Carpa Koi nadando em voltas elegantes */}
        <group ref={koiFishRef} position={[0.4, 0.01, 0]}>
          {/* Corpo da carpa laranja */}
          <mesh scale={[0.07, 0.04, 0.22]}>
            <coneGeometry args={[1, 1, 6]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ea580c"
              emissiveIntensity={0.4}
              roughness={0.3}
            />
          </mesh>
        </group>

        {/* Ponte de Madeira Arqueada Cruzando a Margem do Lago */}
        <group position={[-0.85, 0.12, -0.1]} rotation={[0, 0.35, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.55, 0.06, 1.2]} />
            <meshStandardMaterial color="#78350f" roughness={0.45} />
          </mesh>
          {/* Guarda-corpo arqueado */}
          {[-0.24, 0.24].map((px, idx) => (
            <mesh key={`bridge-rail-${idx}`} position={[px, 0.18, 0]}>
              <boxGeometry args={[0.04, 0.3, 1.15]} />
              <meshStandardMaterial color="#92400e" roughness={0.4} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Lanterna Japonesa Tradicional de Pedra (Tōrō) */}
      <group position={[2.5, 0.08, 0.2]}>
        {/* Base da lanterna */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.2, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.7} flatShading />
        </mesh>
        {/* Coluna cilíndrica */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 0.35, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.7} flatShading />
        </mesh>
        {/* Câmara de fogo com luz âmbar suave */}
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[0.32, 0.28, 0.32]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={1.4}
            roughness={0.3}
          />
        </mesh>
        <pointLight position={[0, 0.65, 0]} color="#f59e0b" intensity={1.5} distance={4} />
        {/* Telhado em pagoda chanfrado */}
        <mesh position={[0, 0.88, 0]} castShadow>
          <coneGeometry args={[0.42, 0.22, 6]} />
          <meshStandardMaterial color="#334155" roughness={0.7} flatShading />
        </mesh>
      </group>

      {/* ===================================================================
          4. 💻 ESTAÇÃO DO DESENVOLVEDOR (MESA NOBRE, ULTRAWIDE, PIXAR LAMP)
             Localização: [-1.2, 0.1, -0.5] (Sem colisão com o Foguetiponto)
         =================================================================== */}
      <group position={[-1.2, 0.1, -0.5]}>
        {/* Tampo chanfrado da mesa em nogueira nobre acetinada */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.14, 1.65]} />
          <meshStandardMaterial color="#92400e" roughness={0.4} metalness={0.06} />
        </mesh>

        {/* 4 Pernas cilíndricas em aço preto acetinado */}
        {[
          [-1.4, -0.65],
          [1.4, -0.65],
          [-1.4, 0.65],
          [1.4, 0.65],
        ].map(([lx, lz], idx) => (
          <mesh key={`desk-leg-${idx}`} position={[lx, 0.6, lz]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 1.2, 8]} />
            <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.3} />
          </mesh>
        ))}

        {/* Bandeja de gerenciamento de cabos sob o tampo */}
        <mesh position={[0, 1.05, -0.45]}>
          <boxGeometry args={[2.4, 0.08, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Monitor Curvo Ultrawide de 49" com Micro-Interatividade de Troca de Tela */}
        <group
          position={[0, 1.9, -0.42]}
          onClick={handleScreenClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Chassi curvo do monitor */}
          <mesh castShadow>
            <boxGeometry args={[2.5, 1.12, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.32} metalness={0.3} />
          </mesh>

          {/* Tela brilhante com efeito de transição de modo */}
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[2.34, 0.98]} />
            <meshStandardMaterial
              color={screenMode === 1 ? '#022c22' : '#090d16'}
              emissive={
                screenFlash > 0
                  ? '#38bdf8'
                  : screenMode === 1
                  ? '#064e3b'
                  : screenMode === 2
                  ? '#0284c7'
                  : '#000000'
              }
              emissiveIntensity={screenFlash > 0 ? 1.8 : 0.4}
              roughness={0.15}
            />
          </mesh>

          {/* Conteúdo Dinâmico da Tela: Modo 0 (VS Code / Neon Syntax) */}
          {screenMode === 0 && (
            <group position={[0, 0, 0.07]}>
              {[-0.32, -0.16, 0.0, 0.16, 0.32].map((ly, lIdx) => {
                const codeColors = ['#38bdf8', '#facc15', '#4ade80', '#f43f5e', '#a78bfa'];
                return (
                  <mesh key={`code-line-${lIdx}`} position={[-0.2, ly, 0]}>
                    <planeGeometry args={[1.6, 0.055]} />
                    <meshStandardMaterial
                      color={codeColors[lIdx]}
                      emissive={codeColors[lIdx]}
                      emissiveIntensity={0.85}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {/* Conteúdo Dinâmico da Tela: Modo 1 (Matrix Cyber Terminal Verde) */}
          {screenMode === 1 && (
            <group position={[0, 0, 0.07]}>
              {[-0.34, -0.22, -0.1, 0.02, 0.14, 0.26, 0.38].map((ty, tIdx) => (
                <mesh key={`term-line-${tIdx}`} position={[-0.3 + (tIdx % 2) * 0.1, ty, 0]}>
                  <planeGeometry args={[1.4 - (tIdx % 3) * 0.25, 0.045]} />
                  <meshStandardMaterial
                    color="#22c55e"
                    emissive="#22c55e"
                    emissiveIntensity={1.4}
                  />
                </mesh>
              ))}
            </group>
          )}

          {/* Conteúdo Dinâmico da Tela: Modo 2 (Celestial Radar Estelar) */}
          {screenMode === 2 && (
            <group position={[0, 0, 0.07]}>
              <mesh>
                <ringGeometry args={[0.25, 0.28, 24]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.6} />
              </mesh>
              <mesh>
                <ringGeometry args={[0.42, 0.44, 28]} />
                <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
              </mesh>
              {[-0.4, 0.4].map((rx, idx) => (
                <mesh key={`star-dot-${idx}`} position={[rx, idx * 0.2, 0]}>
                  <circleGeometry args={[0.04, 8]} />
                  <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={2.0} />
                </mesh>
              ))}
            </group>
          )}

          {/* Suporte articulado e base de apoio cromada */}
          <mesh position={[0, -0.52, -0.1]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.75} />
          </mesh>
          <mesh position={[0, -0.66, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.04, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.75} />
          </mesh>
        </group>

        {/* Teclado Slim de Perfil Baixo & Mousepad */}
        <mesh position={[0, 1.28, 0.18]} receiveShadow>
          <boxGeometry args={[1.25, 0.03, 0.42]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.27, 0.18]} receiveShadow>
          <boxGeometry args={[1.8, 0.015, 0.65]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>

        {/* Luminária Articulada Pixar (Toy Desk Lamp) com Toggle de Luz */}
        <group
          position={[1.15, 1.27, -0.38]}
          onClick={handleLampClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Base pesada de latão com interruptor */}
          <mesh castShadow>
            <cylinderGeometry args={[0.19, 0.22, 0.06, 14]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0.08, 0.05, 0.06]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>

          {/* Braços articulados articuláveis */}
          <mesh position={[-0.08, 0.3, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.02, 0.02, 0.62, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[-0.2, 0.72, 0.08]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.02, 0.54, 8]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Cúpula cônica apontando para a mesa */}
          <mesh position={[-0.32, 0.94, 0.18]} rotation={[0.6, 0, -0.85]} castShadow>
            <coneGeometry args={[0.26, 0.36, 14, 1, true]} />
            <meshStandardMaterial
              color="#f59e0b"
              roughness={0.28}
              metalness={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Lâmpada e SpotLight Cônica Direcionada para a Mesa */}
          <mesh position={[-0.32, 0.9, 0.18]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive={lampOn ? '#fef08a' : '#000000'}
              emissiveIntensity={lampOn ? 2.5 : 0.0}
            />
          </mesh>
          <spotLight
            ref={deskLightRef}
            position={[-0.32, 0.9, 0.18]}
            target-position={[-0.32, 1.2, 0.2]}
            color="#fef08a"
            intensity={2.8}
            angle={0.65}
            penumbra={0.5}
            distance={5}
            castShadow
          />
        </group>

        {/* Xícara de Café Cerâmica Turquesa Fumegante Reativa */}
        <group
          position={[0.95, 1.28, 0.28]}
          onClick={handleCoffeeClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Corpo da caneca turquesa com asa */}
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.11, 0.26, 14]} />
            <meshStandardMaterial color="#06b6d4" roughness={0.25} metalness={0.1} />
          </mesh>
          <mesh position={[0.13, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.07, 0.02, 8, 12]} />
            <meshStandardMaterial color="#06b6d4" roughness={0.25} metalness={0.1} />
          </mesh>
          {/* Café quente */}
          <mesh position={[0, 0.11, 0]}>
            <cylinderGeometry args={[0.11, 0.11, 0.02, 12]} />
            <meshStandardMaterial color="#381a03" roughness={0.2} />
          </mesh>
          {/* Nuvem de vapor poligonal */}
          <group ref={steamRef} position={[0, 0.25, 0]}>
            {[0.06, 0.14, 0.22, 0.3].map((sy, idx) => (
              <mesh key={`steam-${idx}`} position={[Math.sin(idx * 2) * 0.04, sy, 0]}>
                <dodecahedronGeometry args={[0.04 + idx * 0.02, 0]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  roughness={0.6}
                  transparent
                  opacity={0.5 - idx * 0.1}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* Vaso Geométrico com Suculenta e Pedriscos */}
        <group position={[-1.25, 1.27, -0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.14, 0.22, 6]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Folhas da suculenta */}
          {[0, 1, 2, 3, 4].map((ri) => {
            const rAng = (ri * Math.PI * 2) / 5;
            return (
              <mesh key={`succulent-${ri}`} position={[Math.cos(rAng) * 0.06, 0.14, Math.sin(rAng) * 0.06]}>
                <coneGeometry args={[0.06, 0.14, 5]} />
                <meshStandardMaterial color="#10b981" roughness={0.4} />
              </mesh>
            );
          })}
        </group>

        {/* Fones de Ouvido Estúdio */}
        <group position={[-1.15, 1.28, 0.25]} rotation={[0, 0.4, 0]}>
          <mesh position={[0, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.17, 0.028, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.2} />
          </mesh>
          {[-0.17, 0.17].map((cx, idx) => (
            <mesh key={`headphone-cup-${idx}`} position={[cx, 0.17, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.07, 12]} />
              <meshStandardMaterial color="#ef4444" roughness={0.35} metalness={0.1} />
            </mesh>
          ))}
        </group>

        {/* CADEIRA ERGONÔMICA DE DESENVOLVEDOR (Padrão Toy Bruno Simon) */}
        <group position={[0, 0, 0.95]}>
          {/* Base estrelada de 5 pontas com rodízios */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.36, 0.4, 0.08, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.3} />
          </mesh>
          {/* Pistão central a gás cromado */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.48, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Assento estofado confortável */}
          <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.92, 0.12, 0.86]} />
            <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.05} />
          </mesh>
          {/* Encosto ergonômico com suporte lombar curvo */}
          <mesh position={[0, 1.15, 0.38]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[0.84, 0.95, 0.1]} />
            <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* ===================================================================
          5. ✈️ AVIÃOZINHO DE PAPEL (VOO ACROBÁTICO 3D) & ANTENA DE TELEMETRIA
         =================================================================== */}

      {/* Avião de Papel em Origami (Micro-Interativo: Voo em Looping ao Clicar) */}
      <group
        ref={paperPlaneRef}
        position={[-0.2, 1.34, 0.42]}
        onClick={handlePaperPlaneClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <mesh castShadow>
          <coneGeometry args={[0.3, 0.85, 3]} />
          <meshStandardMaterial
            color="#ffffff"
            roughness={0.3}
            metalness={0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Vinco central da dobra de papel */}
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.02, 0.02, 0.82]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
        </mesh>
      </group>

      {/* Antena Parabólica de Telemetria e Radar Espacial */}
      <group ref={commsDishRef} position={[-2.4, 0.15, 0.9]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.12, 1.0, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[-0.6, 0, 0]} castShadow>
          <sphereGeometry args={[0.78, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.32}
            metalness={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 1.4, 0.4]} rotation={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Iluminação Pontual Cósmica Acolhedora (Rosa/Dourado) */}
      <pointLight position={[0, 3.6, 0]} color="#fbcfe8" intensity={2.2} distance={14} />
    </group>
  );
};

