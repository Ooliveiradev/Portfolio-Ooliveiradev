import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';
import { RocketExhaust, RocketLaunchEffects, useRocketLaunch } from './RocketLaunchEffects';

interface ProjectsIslandProps {
  isNear?: boolean;
  paused?: boolean;
}

const ProjectsIslandComponent: React.FC<ProjectsIslandProps> = ({ paused = false }) => {
  // Animation refs
  const launch = useRocketLaunch(paused);
  const { rocketRef, smokeRef, armRef, start: handleTowerRocketClick } = launch;
  const beaconRef = useRef<THREE.MeshStandardMaterial>(null);
  const holoMeshRef = useRef<THREE.Group>(null);
  const arcadeScreenRef = useRef<THREE.MeshStandardMaterial>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  const skyCloudRef = useRef<THREE.Group>(null);
  const oreShardsRef = useRef<THREE.Group>(null);

  // Micro-interaction discrete states (Only change on click, NEVER in useFrame)
  const [activeBtnIdx, setActiveBtnIdx] = useState<number | null>(null);
  const [joystickTilt, setJoystickTilt] = useState({ x: 0, z: 0 });
  const [holoModel, setHoloModel] = useState(0);
  const [holoFlash, setHoloFlash] = useState(false);
  const [pressedKey, setPressedKey] = useState<number | null>(null);
  const magneticTravel = pressedKey !== null ? 0.85 : 0;
  const magneticPulse = pressedKey !== null ? 0.85 : 0;
  const [encoderAngle, setEncoderAngle] = useState(0);
  const [rgbThemeIdx, setRgbThemeIdx] = useState(0);

  // Main frame loop for fluid mechanical and atmospheric animations
  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;

    // --- Farol estroboscópico de aviação no topo da torre Gantry ---
    if (beaconRef.current) {
      // Pulso estroboscópico rápido com duplo flash aéreo
      const strobe = Math.sin(time * 8.0) > 0.4 ? 3.2 : 0.4;
      beaconRef.current.emissiveIntensity = strobe;
    }

    // --- Shards de minério flutuantes abaixo da quilha ---
    if (oreShardsRef.current) {
      oreShardsRef.current.rotation.y += delta * 0.35;
    }

    // --- Nuvem Low-Poly no céu sobre a torre ---
    if (skyCloudRef.current) {
      skyCloudRef.current.position.y = 6.4 + Math.sin(time * 1.1) * 0.16;
      skyCloudRef.current.rotation.y = Math.sin(time * 0.3) * 0.08;
    }

    // --- Projeção holográfica na prancheta ---
    if (holoMeshRef.current) {
      const spinSpeed = holoFlash ? 4.8 : 1.2;
      holoMeshRef.current.rotation.y += delta * spinSpeed;
      holoMeshRef.current.rotation.x += delta * (spinSpeed * 0.45);
      holoMeshRef.current.position.y = 2.25 + Math.sin(time * 2.5) * 0.08;
    }

    // --- Arcade: Sprite CRT animado e brilho da tela ---
    if (spriteRef.current) {
      spriteRef.current.position.x = Math.sin(time * 3.5) * 0.14;
      spriteRef.current.position.y = 2.22 + (Math.floor(time * 4) % 2) * 0.03;
    }

    if (arcadeScreenRef.current) {
      arcadeScreenRef.current.emissiveIntensity = 1.0 + Math.sin(time * 4) * 0.2 + (activeBtnIdx !== null ? 2.0 : 0);
    }
  });

  // Micro-interaction handlers (Zero React Re-renders for animation loops)
  const handleArcadeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playArcadeCoin();
    const randomBtn = Math.floor(Math.random() * 4);
    setActiveBtnIdx(randomBtn);
    setJoystickTilt({
      x: (Math.random() - 0.5) * 0.4,
      z: 0.25 + Math.random() * 0.2,
    });
    setTimeout(() => {
      setActiveBtnIdx(null);
      setJoystickTilt({ x: 0, z: 0 });
    }, 600);
  };

  const handleHoloClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playHoloSwitch();
    setHoloFlash(true);
    setHoloModel((prev) => (prev + 1) % 3);
    setTimeout(() => setHoloFlash(false), 800);
  };

  // Teclado Magnético: Acionamento contínuo Hall Effect com amortecimento tátil e som cremoso
  const handleMagneticKeyClick = (keyIdx: number, e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const pitches = [0.88, 0.94, 1.0, 1.06, 1.12, 1.18];
    sounds.playMagneticSwitch(pitches[keyIdx % pitches.length]);
    setPressedKey(keyIdx);
    setTimeout(() => setPressedKey(null), 250);
  };

  // Rotary Encoder do Teclado Magnético: Gira com clique e altera o perfil RGB / Rapid Trigger
  const handleEncoderClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playEncoderClick();
    setEncoderAngle((prev) => prev + 0.45);
    setRgbThemeIdx((prev) => (prev + 1) % 4);
  };

  // Precomputed positions for hexagon heat shield tiles
  const heatShieldTiles = useMemo(() => {
    const tiles: [number, number, number][] = [];
    const rings = 3;
    for (let r = 1; r <= rings; r++) {
      const count = r * 6;
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        const rad = r * 0.95;
        tiles.push([Math.cos(ang) * rad, -0.65 - r * 0.4, Math.sin(ang) * rad]);
      }
    }
    return tiles;
  }, []);

  return (
    <group>
      {/* ===================================================================
          1. 🌋 BASE INFERIOR: QUILHA DE ESTALEIRO ORBITAL & ROCHA DE MINÉRIO
             Linguagem escultural única inspirada na Issue #1 e Issue #2
         =================================================================== */}

      {/* Quilha profunda de asteroide facetado (Deep Sculpted Asteroid Keel) */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.1, 1.4, 4.4, 8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.78}
          metalness={0.15}
          flatShading
        />
      </mesh>

      {/* Veios de minério ciano luminescente correndo pelas fendas da rocha */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((vi) => {
        const vAngle = (vi * Math.PI) / 4 + 0.2;
        const vx1 = Math.cos(vAngle) * 5.2;
        const vz1 = Math.sin(vAngle) * 5.2;
        const vx2 = Math.cos(vAngle) * 1.6;
        const vz2 = Math.sin(vAngle) * 1.6;
        return (
          <group key={`ore-vein-${vi}`}>
            <mesh position={[(vx1 + vx2) / 2, -2.5, (vz1 + vz2) / 2]}>
              <boxGeometry args={[0.16, 3.4, 0.16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.8}
                roughness={0.2}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* Placas de Blindagem Térmica Hexagonal (Heat Shield Tiles) com marcas de reentrada */}
      <group>
        {heatShieldTiles.map(([tx, ty, tz], idx) => (
          <mesh
            key={`heat-tile-${idx}`}
            position={[tx, ty, tz]}
            rotation={[-Math.PI / 2, 0, idx * 0.5]}
          >
            <cylinderGeometry args={[0.42, 0.42, 0.05, 6]} />
            <meshStandardMaterial
              color={idx % 4 === 0 ? '#0b0f19' : idx % 3 === 0 ? '#1e293b' : '#334155'}
              roughness={0.6}
              metalness={0.3}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* 4 Grandes Braços Estruturais Treliçados em "V" em Aço Carbono com Nós Laranja */}
      {[0, 1, 2, 3].map((gIdx) => {
        const gAngle = (gIdx * Math.PI) / 2 + Math.PI / 4;
        const cosA = Math.cos(gAngle);
        const sinA = Math.sin(gAngle);
        const rimX = cosA * 5.8;
        const rimZ = sinA * 5.8;
        const tipX = cosA * 1.6;
        const tipZ = sinA * 1.6;
        const midX = (rimX + tipX) / 2;
        const midZ = (rimZ + tipZ) / 2;

        return (
          <group key={`gantry-arm-${gIdx}`}>
            {/* Viga diagonal principal da treliça */}
            <mesh position={[midX, -2.3, midZ]} rotation={[0, -gAngle, 0.72]}>
              <boxGeometry args={[0.34, 4.8, 0.34]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.4} />
            </mesh>
            {/* Travessa diagonal de reforço em V */}
            <mesh position={[midX * 0.9, -1.8, midZ * 0.9]} rotation={[0, -gAngle, -0.65]}>
              <boxGeometry args={[0.22, 3.2, 0.22]} />
              <meshStandardMaterial color="#475569" roughness={0.45} metalness={0.3} />
            </mesh>
            {/* Junta esférica de ancoragem superior em Laranja Segurança */}
            <mesh position={[rimX, -0.55, rimZ]}>
              <sphereGeometry args={[0.38, 12, 12]} />
              <meshStandardMaterial
                color="#f97316"
                emissive="#ea580c"
                emissiveIntensity={0.5}
                roughness={0.35}
              />
            </mesh>
            {/* Nó estrutural inferior com braçadeira de fixação */}
            <mesh position={[tipX, -4.1, tipZ]}>
              <boxGeometry args={[0.48, 0.48, 0.48]} />
              <meshStandardMaterial color="#f97316" roughness={0.35} metalness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* Dois Tanques Criogênicos Horizontais Suspensos (LOX / LH2) */}
      {[
        { x: -2.3, y: -2.2, z: 0.6, rotY: 0.4 },
        { x: 2.3, y: -2.2, z: -0.6, rotY: -0.4 },
      ].map((tank, tIdx) => (
        <group key={`cryo-tank-${tIdx}`} position={[tank.x, tank.y, tank.z]} rotation={[0, tank.rotY, 0]}>
          {/* Corpo cilíndrico principal do tanque */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 2.6, 16]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.55} />
          </mesh>
          {/* Domos hemisféricos arredondados nas extremidades */}
          <mesh position={[-1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.55} />
          </mesh>
          <mesh position={[1.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.55} />
          </mesh>
          {/* Faixas amarelas de identificação de fluido pressurizado */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.71, 0.71, 0.5, 16]} />
            <meshStandardMaterial color="#facc15" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Suportes de montagem à estrutura superior */}
          {[-0.8, 0.8].map((hx, hIdx) => (
            <mesh key={hIdx} position={[hx, 0.75, 0]}>
              <boxGeometry args={[0.18, 0.9, 0.18]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.3} />
            </mesh>
          ))}
          {/* Tubulações criogênicas curvadas cromadas alimentando o estaleiro */}
          <mesh position={[0, 0.7, 0.4]} rotation={[0.5, 0, 0]}>
            <torusGeometry args={[0.45, 0.07, 8, 24, Math.PI]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 5 Shards de Minério Poliédricos Flutuantes abaixo da ponta da quilha */}
      <group ref={oreShardsRef} position={[0, -4.6, 0]}>
        {[
          { x: 1.2, y: -0.2, z: 0.8, s: 0.38, rot: [0.4, 0.2, 0.8] },
          { x: -1.3, y: -0.5, z: 0.7, s: 0.42, rot: [0.8, 0.5, 0.3] },
          { x: 0.4, y: -0.8, z: -1.2, s: 0.35, rot: [0.2, 0.9, 0.5] },
          { x: -0.9, y: -0.3, z: -1.0, s: 0.45, rot: [0.6, 0.3, 0.9] },
          { x: 0.1, y: -1.2, z: 0.2, s: 0.32, rot: [0.5, 0.7, 0.2] },
        ].map((shard, sIdx) => (
          <mesh
            key={`ore-shard-${sIdx}`}
            position={[shard.x, shard.y, shard.z]}
            scale={[shard.s, shard.s * 1.3, shard.s]}
            rotation={shard.rot as [number, number, number]}
            castShadow
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#1e293b"
              emissive="#0284c7"
              emissiveIntensity={0.6}
              roughness={0.5}
              metalness={0.2}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Luzes Estroboscópicas e Balizadores Náutico-Espaciais Âmbar */}
      <group>
        {[0, 1, 2, 3].map((bIdx) => {
          const bAngle = (bIdx * Math.PI) / 2 + Math.PI / 4;
          const bx = Math.cos(bAngle) * 1.7;
          const bz = Math.sin(bAngle) * 1.7;
          return (
            <group key={`nav-light-${bIdx}`} position={[bx, -4.25, bz]}>

              <mesh>
                <sphereGeometry args={[0.12, 10, 10]} />
                <meshStandardMaterial
                  color="#f59e0b"
                  emissive="#f59e0b"
                  emissiveIntensity={2.0}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ===================================================================
          2. 🏗️ PLATÔ SUPERIOR: DECK OCTOGONAL CHANFRADO & BAIA REBAIXADA
         =================================================================== */}

      {/* Deck superior industrial octogonal chanfrado */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6.5, 6.3, 0.45, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.38} metalness={0.22} />
      </mesh>

      {/* Faixa perimetral de advertência (Yellow/Black Industrial Caution Border) */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[5.6, 6.2, 8]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.35}
          metalness={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Recorte rebaixado central: Baia de Montagem Industrial (Assembly Bay) */}
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[5.5, 5.5, 0.04, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[3.8, 3.8, 0.03, 8]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.45} metalness={0.3} />
      </mesh>

      {/* Marcações da baia central (Crosshair e reticulado industrial) */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.3, 32]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 3.28, 32]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Passarela de aproximação conectando a baia ao heliponto frontal */}
      <mesh position={[0, 0.11, 2.0]} receiveShadow>
        <boxGeometry args={[1.4, 0.02, 2.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Faixas guias da passarela */}
      {[-0.6, 0.6].map((gx, idx) => (
        <mesh key={`runway-stripe-${idx}`} position={[gx, 0.125, 2.0]}>
          <boxGeometry args={[0.08, 0.01, 2.6]} />
          <meshStandardMaterial color="#facc15" roughness={0.3} />
        </mesh>
      ))}

      {/* Balizadores de pista com cúpula translúcida ciano */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i * Math.PI) / 4 + Math.PI / 8;
        const lx = Math.cos(rad) * 5.1;
        const lz = Math.sin(rad) * 5.1;
        return (
          <group key={`runway-post-${i}`} position={[lx, 0.15, lz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.07, 0.11, 0.25, 8]} />
              <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <sphereGeometry args={[0.085, 8, 8]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.3}
                roughness={0.2}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* ===================================================================
          3. 🚀 TORRE DE LANÇAMENTO TRELIÇADA & FOGUETE EXPERIMENTAL
             Setor posterior direito [2.2, 0.1, -1.6]
             Sequência de ignição, decolagem e materialização
         =================================================================== */}
      <group
        position={[2.2, 0.1, -1.6]}
        userData={{ onRocketLaunch: handleTowerRocketClick }}
        onClick={handleTowerRocketClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Plataforma de elevação da torre */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[2.8, 0.22, 2.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.25} />
        </mesh>

        {/* 4 Pilares estruturais verticais da torre Gantry em Vermelho Segurança (#dc2626) */}
        {[
          [-0.75, -0.6],
          [0.75, -0.6],
          [-0.75, 0.6],
          [0.75, 0.6],
        ].map(([px, pz], idx) => (
          <mesh key={`tower-col-${idx}`} position={[px, 2.6, pz]} castShadow>
            <boxGeometry args={[0.16, 5.2, 0.16]} />
            <meshStandardMaterial color="#dc2626" roughness={0.38} metalness={0.15} />
          </mesh>
        ))}

        {/* Travessas horizontais e treliças em X */}
        {[1.2, 2.4, 3.6, 4.8].map((by, bIdx) => (
          <group key={`tower-tier-${bIdx}`}>
            {/* Vigas frontais e traseiras */}
            <mesh position={[0, by, -0.6]}>
              <boxGeometry args={[1.5, 0.12, 0.12]} />
              <meshStandardMaterial color="#dc2626" roughness={0.38} />
            </mesh>
            <mesh position={[0, by, 0.6]}>
              <boxGeometry args={[1.5, 0.12, 0.12]} />
              <meshStandardMaterial color="#dc2626" roughness={0.38} />
            </mesh>
            {/* Vigas laterais */}
            <mesh position={[-0.75, by, 0]}>
              <boxGeometry args={[0.12, 0.12, 1.2]} />
              <meshStandardMaterial color="#dc2626" roughness={0.38} />
            </mesh>
            <mesh position={[0.75, by, 0]}>
              <boxGeometry args={[0.12, 0.12, 1.2]} />
              <meshStandardMaterial color="#dc2626" roughness={0.38} />
            </mesh>
          </group>
        ))}

        {/* Plataformas de serviço com gradil de segurança */}
        {[2.4, 4.0].map((py, idx) => (
          <group key={`platform-${idx}`} position={[0, py, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[1.6, 0.08, 1.3]} />
              <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.3} />
            </mesh>
            {/* Guarda-corpo perimetral */}
            <mesh position={[0, 0.35, -0.62]}>
              <boxGeometry args={[1.55, 0.6, 0.04]} />
              <meshStandardMaterial color="#f97316" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Braço Umbilical Articulado em Amarelo/Laranja conectando ao foguete */}
        <group ref={armRef} position={[-0.8, 3.8, 0]}>
          <mesh position={[-0.6, 0, 0]} castShadow>
            <boxGeometry args={[1.4, 0.18, 0.22]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.4} metalness={0.2} />
          </mesh>
          {/* Garra do acoplador criogênico */}
          <mesh position={[-1.35, 0, 0]}>
            <boxGeometry args={[0.18, 0.34, 0.34]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>

        {/* Farol estroboscópico de alerta no cume da torre */}

        <mesh position={[0, 5.3, 0]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial
            color="#ef4444"
            ref={beaconRef}
            emissive="#b91c1c"
            emissiveIntensity={2.2}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Foguete Experimental estilizado em levitação orgânica */}
      <group
        ref={rocketRef}
        userData={{ onRocketLaunch: handleTowerRocketClick }}
        position={[0.8, 2.6, -1.6]}
        onClick={handleTowerRocketClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Corpo esbelto branco esmaltado */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.72, 3.3, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.1} />
        </mesh>

        {/* Coifa cônica vermelha aerodinâmica */}
        <mesh position={[0, 2.25, 0]} castShadow>
          <coneGeometry args={[0.5, 1.25, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Vigia espelhada azul celeste */}
        <mesh position={[0, 0.8, 0.67]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.27, 0.27, 0.12, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.8}
            roughness={0.15}
            metalness={0.4}
          />
        </mesh>

        {/* 3 Aletas estabilizadoras em 120° */}
        {[0, 1, 2].map((fi) => {
          const finAngle = (fi * Math.PI * 2) / 3;
          return (
            <mesh
              key={`fin-${fi}`}
              position={[Math.sin(finAngle) * 0.78, -1.2, Math.cos(finAngle) * 0.78]}
              rotation={[0, finAngle, 0]}
              castShadow
            >
              <boxGeometry args={[0.08, 1.45, 0.72]} />
              <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.1} />
            </mesh>
          );
        })}

        {/* Bocais de escape com interior incandescente */}
        <mesh position={[0, -1.85, 0]}>
          <cylinderGeometry args={[0.42, 0.58, 0.52, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.35} />
        </mesh>
        <RocketExhaust controller={launch} />
      </group>
      <RocketLaunchEffects controller={launch} />

      {/* Volutas de fumaça poligonal estilizada sob o foguete (Low-Poly Vapor Cloud) */}
      <group
        ref={smokeRef}
        userData={{ onRocketLaunch: handleTowerRocketClick }}
        position={[0.8, 0.45, -1.6]}
        onClick={handleTowerRocketClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {[
          [0, 0.22, 0, 0.78],
          [-0.55, 0.18, 0.45, 0.62],
          [0.62, 0.3, -0.32, 0.68],
          [-0.35, 0.14, -0.52, 0.58],
          [0.44, 0.22, 0.52, 0.58],
          [0.1, 0.45, 0.1, 0.7],
        ].map(([sx, sy, sz, scale], i) => (
          <mesh key={`smoke-puff-${i}`} position={[sx, sy, sz]} scale={[scale, scale * 0.85, scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.65}
              metalness={0.02}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Nuvem Poligonal Flutuante no Céu (Low-Poly Cloud) sobre a torre */}
      <group ref={skyCloudRef} position={[2.6, 6.4, -1.8]}>
        {[
          [0, 0, 0, 0.85],
          [-0.65, -0.1, 0.2, 0.65],
          [0.7, -0.05, -0.15, 0.7],
          [0.1, 0.35, 0.1, 0.6],
        ].map(([cx, cy, cz, cs], cIdx) => (
          <mesh key={`sky-cloud-${cIdx}`} position={[cx, cy, cz]} scale={[cs * 1.3, cs * 0.7, cs]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#f1f5f9"
              roughness={0.8}
              metalness={0.05}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* ===================================================================
          4. 🕹️ GABINETE RETRO ARCADE (FLIPERAMA COLECIONÁVEL)
             Setor posterior esquerdo [-2.8, 0.1, -1.7]
             Com Micro-Interatividade de Moeda 8-bit, Joystick e Botões
         =================================================================== */}
      <group
        position={[-2.8, 0.1, -1.7]}
        rotation={[0, 0.65, 0]}
        onClick={handleArcadeClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Chassi principal fúcsia vibrante (#ec4899) com acabamento semi-brilhante */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1.55, 3.2, 1.45]} />
          <meshStandardMaterial color="#ec4899" roughness={0.35} metalness={0.08} />
        </mesh>

        {/* Marquee superior iluminado ("RETRO ARCADE") */}
        <mesh position={[0, 3.12, 0.58]}>
          <boxGeometry args={[1.38, 0.46, 0.24]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.9}
            roughness={0.25}
          />
        </mesh>

        {/* Friso luminoso do Marquee */}
        <mesh position={[0, 3.12, 0.71]}>
          <planeGeometry args={[1.2, 0.3]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#ec4899"
            emissiveIntensity={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Moldura da tela CRT inclinada */}
        <mesh position={[0, 2.2, 0.58]} rotation={[-0.22, 0, 0]}>
          <planeGeometry args={[1.26, 0.94]} />
          <meshStandardMaterial
            ref={arcadeScreenRef}
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={1.1}
            roughness={0.2}
          />
        </mesh>

        {/* Pixel Sprite retro animado na tela CRT */}
        <mesh ref={spriteRef} position={[0, 2.22, 0.61]} rotation={[-0.22, 0, 0]}>
          <planeGeometry args={[0.48, 0.48]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>

        {/* Mesa de controle inclinada com botões */}
        <mesh position={[0, 1.46, 0.78]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[1.42, 0.16, 0.76]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.15} />
        </mesh>

        {/* Joystick mecânico com mola e inclinação tátil */}
        <group
          position={[-0.36, 1.66, 0.78]}
          rotation={[joystickTilt.x, 0, joystickTilt.z]}
        >
          {/* Haste metálica cromada */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.32, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.85} />
          </mesh>
          {/* Esfera vermelha arcade */}
          <mesh position={[0, 0.33, 0]} castShadow>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#ef4444" roughness={0.28} metalness={0.1} />
          </mesh>
        </group>

        {/* 4 Botões coloridos arcade com afundamento dinâmico no clique */}
        {[
          { x: 0.12, z: 0.71, col: '#eab308' },
          { x: 0.34, z: 0.71, col: '#3b82f6' },
          { x: 0.18, z: 0.84, col: '#22c55e' },
          { x: 0.38, z: 0.84, col: '#f43f5e' },
        ].map((btn, bIdx) => {
          const isPressed = activeBtnIdx === bIdx;
          return (
            <mesh
              key={`arcade-btn-${bIdx}`}
              position={[btn.x, isPressed ? 1.57 : 1.62, btn.z]}
            >
              <cylinderGeometry args={[0.075, 0.075, 0.06, 10]} />
              <meshStandardMaterial
                color={btn.col}
                emissive={btn.col}
                emissiveIntensity={isPressed ? 1.4 : 0.2}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          );
        })}

        {/* Porta de moedas metálica (Coin Door) */}
        <mesh position={[0, 0.65, 0.74]}>
          <boxGeometry args={[0.72, 0.82, 0.06]} />
          <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.45} />
        </mesh>
        {/* Entradas de moeda iluminadas */}
        {[-0.16, 0.16].map((cx, cIdx) => (
          <mesh key={`coin-slot-${cIdx}`} position={[cx, 0.85, 0.78]}>
            <boxGeometry args={[0.08, 0.14, 0.02]} />
            <meshStandardMaterial
              color="#f97316"
              emissive="#ea580c"
              emissiveIntensity={0.9}
            />
          </mesh>
        ))}

      </group>

      {/* ===================================================================
          5. 📐 PRANCHETA DE ENGENHARIA & HOLOGRAMA 3D FLUTUANTE
             Flanco direito frontal [2.4, 0.1, 1.2]
             Com Micro-Interatividade de Troca de Modelo Wireframe e Som Sci-Fi
         =================================================================== */}
      <group
        position={[2.4, 0.1, 1.2]}
        rotation={[0, -0.65, 0]}
        onClick={handleHoloClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Pernas do cavalete em madeira escura nobre (#78350f) */}
        {[-0.42, 0.42].map((lx, idx) => (
          <mesh key={`easel-leg-${idx}`} position={[lx, 1.0, 0]} rotation={[0, 0, lx * -0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.55} metalness={0.05} />
          </mesh>
        ))}
        {/* Perna traseira articulada */}
        <mesh position={[0, 0.9, -0.52]} rotation={[-0.32, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.55} metalness={0.05} />
        </mesh>

        {/* Prancha de desenho chanfrada com blueprint azul elétrico */}
        <mesh position={[0, 1.42, 0.1]} rotation={[-0.22, 0, 0]} castShadow>
          <boxGeometry args={[1.85, 1.35, 0.07]} />
          <meshStandardMaterial color="#0284c7" roughness={0.38} metalness={0.15} />
        </mesh>

        {/* Grade do blueprint técnico */}
        <mesh position={[0, 1.44, 0.14]} rotation={[-0.22, 0, 0]}>
          <planeGeometry args={[1.6, 1.1]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.3}
            metalness={0.1}
            wireframe
          />
        </mesh>

        {/* Emitter ring holográfico na base da prancheta */}
        <mesh position={[0, 1.46, 0.16]} rotation={[-0.22, 0, 0]}>
          <ringGeometry args={[0.25, 0.32, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Miniatura isométrica holográfica flutuando sobre a prancheta (3 Modelos Alternáveis) */}
        <group ref={holoMeshRef} position={[0, 2.25, 0.22]}>
          {/* Modelo 0: Satélite Quântico Octaédrico */}
          {holoModel === 0 && (
            <group scale={[0.34, 0.34, 0.34]}>
              <mesh>
                <octahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={holoFlash ? 3.8 : 1.8}
                  roughness={0.2}
                  wireframe
                />
              </mesh>
              <mesh rotation={[Math.PI / 4, 0, 0]}>
                <ringGeometry args={[1.2, 1.3, 16]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={1.5}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          )}

          {/* Modelo 1: Sonda Geodésica Icosaédrica */}
          {holoModel === 1 && (
            <group scale={[0.32, 0.32, 0.32]}>
              <mesh>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={holoFlash ? 4.0 : 2.0}
                  roughness={0.2}
                  wireframe
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.35, 8, 8]} />
                <meshStandardMaterial
                  color="#facc15"
                  emissive="#eab308"
                  emissiveIntensity={1.6}
                />
              </mesh>
            </group>
          )}

          {/* Modelo 2: Anel de Dobra Espacial (Torus Warp Gate) */}
          {holoModel === 2 && (
            <group scale={[0.34, 0.34, 0.34]}>
              <mesh>
                <torusGeometry args={[0.9, 0.22, 8, 20]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={holoFlash ? 4.0 : 2.0}
                  roughness={0.2}
                  wireframe
                />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.06, 0.06, 2.1, 8]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#0284c7"
                  emissiveIntensity={1.4}
                />
              </mesh>
            </group>
          )}
        </group>

      </group>

      {/* ===================================================================
          6. ⌨️ TECLADO MAGNÉTICO HIGH-END (HALL EFFECT / RAPID TRIGGER)
             Flanco esquerdo [-3.1, 0.15, 0.25]
             Chassi CNC, switches magnéticos translúcidos, ímãs de neodímio,
             Rapid Trigger gauge analógico, knob recartilhado e cabo aviator espiralado
         =================================================================== */}
      <group
        position={[-3.1, 0.15, 0.25]}
        rotation={[0.06, 0.48, 0]}
        scale={[0.72, 0.72, 0.72]}
      >
        {/* Underglow RGB Difusor Perimetral */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[4.25, 0.06, 2.15]} />
          <meshStandardMaterial
            color={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
            emissive={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
            emissiveIntensity={1.4}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Chassi CNC em Alumínio Aeroespacial Anodizado Escuro */}
        <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.22, 2.1]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Peso Traseiro de Latão Maciço Polido (Brass Weight Bar) */}
        <mesh position={[0, 0.08, -0.98]}>
          <boxGeometry args={[3.6, 0.12, 0.14]} />
          <meshStandardMaterial
            color="#eab308"
            roughness={0.22}
            metalness={0.88}
          />
        </mesh>

        {/* Placa de Switch em Policarbonato Fumê com Visão das Trilhas Internas */}
        <mesh position={[-0.35, 0.26, 0]} receiveShadow>
          <boxGeometry args={[3.1, 0.04, 1.8]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.45}
            metalness={0.35}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Trilhas de Circuito Douradas Gravadas no PCB (PCB Traces) */}
        {[-0.8, -0.3, 0.2].map((tx, tidx) => (
          <mesh key={`pcb-trace-${tidx}`} position={[tx, 0.275, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.04, 1.6]} />
            <meshStandardMaterial
              color="#eab308"
              emissive="#ca8a04"
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}

        {/* Cluster de 6 Teclas Magnéticas Hall Effect (Layout 2x3 Compacto) */}
        {[
          // Fileira 1 (Superior)
          { x: -1.05, z: -0.42, label: '★', col: '#f43f5e', accent: true },
          { x: -0.35, z: -0.42, label: 'W', col: '#1e293b', accent: false },
          { x: 0.35, z: -0.42, label: '🚀', col: '#8b5cf6', accent: true },
          // Fileira 2 (Inferior / WASD Navigation)
          { x: -1.05, z: 0.38, label: 'A', col: '#1e293b', accent: false },
          { x: -0.35, z: 0.38, label: 'S', col: '#38bdf8', accent: true },
          { x: 0.35, z: 0.38, label: 'D', col: '#1e293b', accent: false },
        ].map((keyItem, kIdx) => {
          const isThisPressed = pressedKey === kIdx;
          const keyOffset = isThisPressed ? magneticTravel * 0.16 : 0;
          const keyY = 0.44 - keyOffset;
          const stemY = 0.32 - keyOffset * 0.8;

          return (
            <group key={`mag-key-${kIdx}`}>
              {/* Switch Magnético Translúcido (Housing Transparente) */}
              <mesh position={[keyItem.x, 0.31, keyItem.z]}>
                <boxGeometry args={[0.58, 0.14, 0.58]} />
                <meshStandardMaterial
                  color="#f8fafc"
                  roughness={0.2}
                  transparent
                  opacity={0.4}
                />
              </mesh>

              {/* Haste Magnética Móvel (Stem em Laranja/Âmbar Neon) */}
              <mesh position={[keyItem.x, stemY, keyItem.z]}>
                <boxGeometry args={[0.18, 0.26, 0.18]} />
                <meshStandardMaterial
                  color="#f97316"
                  emissive="#ea580c"
                  emissiveIntensity={isThisPressed ? 1.2 : 0.4}
                  roughness={0.3}
                />
              </mesh>

              {/* Ímã Cilíndrico de Neodímio na Base do Stem */}
              <mesh position={[keyItem.x, stemY - 0.1, keyItem.z]}>
                <cylinderGeometry args={[0.07, 0.07, 0.08, 12]} />
                <meshStandardMaterial
                  color="#cbd5e1"
                  metalness={0.92}
                  roughness={0.15}
                />
              </mesh>

              {/* Sensor Hall Effect SMD soldado no PCB */}
              <mesh position={[keyItem.x, 0.28, keyItem.z]}>
                <boxGeometry args={[0.1, 0.03, 0.08]} />
                <meshStandardMaterial color="#020617" roughness={0.5} />
              </mesh>

              {/* Anel de Fluxo / Indução Magnética Pulsante ao Atuar */}
              {isThisPressed && magneticPulse > 0.05 && (
                <mesh
                  position={[keyItem.x, 0.29, keyItem.z]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <ringGeometry
                    args={[
                      0.28,
                      0.38 + magneticPulse * 0.32,
                      20,
                    ]}
                  />
                  <meshStandardMaterial
                    color={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
                    emissive={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
                    emissiveIntensity={2.5 * magneticPulse}
                    transparent
                    opacity={magneticPulse * 0.85}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}

              {/* Keycap PBT Magnética com Perfil Ergonômico Chanfrado */}
              <group
                position={[keyItem.x, keyY, keyItem.z]}
                onClick={(e) => handleMagneticKeyClick(kIdx, e)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                {/* Corpo da Keycap */}
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[0.66, 0.28, 0.66]} />
                  <meshStandardMaterial
                    color={keyItem.col}
                    emissive={keyItem.accent ? keyItem.col : '#0284c7'}
                    emissiveIntensity={isThisPressed ? 0.7 : keyItem.accent ? 0.2 : 0.05}
                    roughness={0.36}
                    metalness={keyItem.accent ? 0.15 : 0.25}
                  />
                </mesh>

                {/* Topo da Keycap com Gravação Translúcida da Legenda */}
                <mesh position={[0, 0.145, 0]}>
                  <boxGeometry args={[0.48, 0.02, 0.48]} />
                  <meshStandardMaterial
                    color={isThisPressed ? '#ffffff' : '#94a3b8'}
                    emissive={isThisPressed ? '#ffffff' : '#38bdf8'}
                    emissiveIntensity={isThisPressed ? 0.8 : 0.15}
                    roughness={0.25}
                  />
                </mesh>
              </group>
            </group>
          );
        })}

        {/* Rotary Encoder (Knob Recartilhado em Alumínio CNC) */}
        <group
          position={[1.45, 0.32, -0.42]}
          onClick={handleEncoderClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Anel de LED Neon na Base do Knob */}
          <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.42, 24]} />
            <meshStandardMaterial
              color={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
              emissive={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
              emissiveIntensity={2.0}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Corpo Cilíndrico Recartilhado do Knob */}
          <mesh rotation={[0, encoderAngle, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.34, 0.28, 20]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.85} />
          </mesh>

          {/* Marcador de Posição Gravado no Topo do Knob */}
          <mesh position={[0.18, 0.15, 0]} rotation={[0, encoderAngle, 0]}>
            <boxGeometry args={[0.16, 0.02, 0.04]} />
            <meshStandardMaterial
              color={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
              emissive={['#38bdf8', '#a855f7', '#10b981', '#f97316'][rgbThemeIdx]}
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>

        {/* Display OLED / Gauge de Atuação Analógica Rapid Trigger */}
        <group position={[1.45, 0.28, 0.38]}>
          {/* Moldura Metálica do Display */}
          <mesh receiveShadow>
            <boxGeometry args={[0.82, 0.12, 0.88]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.3} />
          </mesh>

          {/* Tela de Vidro OLED Fumê */}
          <mesh position={[0, 0.065, 0]} rotation={[-0.15, 0, 0]}>
            <planeGeometry args={[0.74, 0.74]} />
            <meshStandardMaterial
              color="#020617"
              emissive="#0891b2"
              emissiveIntensity={0.2}
              roughness={0.15}
            />
          </mesh>

          {/* 4 Micro-LEDs de Atuação Analógica (0.1mm a 4.0mm) */}
          {[
            { z: -0.22, minT: 0.0, col: '#10b981' }, // 0.1mm - Calibrado
            { z: -0.07, minT: 0.25, col: '#22c55e' }, // 1.0mm - Atuado
            { z: 0.08, minT: 0.55, col: '#facc15' }, // 2.0mm - Rapid Trigger
            { z: 0.23, minT: 0.8, col: '#f97316' }, // 3.8mm - Bottom Out
          ].map((bar, bIdx) => {
            const isLit = pressedKey !== null && magneticTravel >= bar.minT;
            return (
              <mesh key={`gauge-bar-${bIdx}`} position={[0, 0.075, bar.z]} rotation={[-0.15, 0, 0]}>
                <planeGeometry args={[0.55, 0.08]} />
                <meshStandardMaterial
                  color={bar.col}
                  emissive={bar.col}
                  emissiveIntensity={isLit ? 2.5 : 0.3}
                />
              </mesh>
            );
          })}
        </group>

        {/* Cabo Coiled Aviator Cable (Cabo Espiralado GX16 em Alta Resolução) */}
        <group position={[-0.2, 0.08, -1.15]}>
          {/* Conector USB-C Reforçado na Traseira */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.28, 0.12, 0.18]} />
            <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Espirais do Cabo Coiled (Coiled Cable Rings descansando no deck) */}
          {[0, 1, 2, 3, 4, 5, 6].map((ci) => (
            <mesh
              key={`coil-ring-${ci}`}
              position={[-0.3 - ci * 0.16, 0.04, -0.22]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <torusGeometry args={[0.14, 0.045, 8, 16]} />
              <meshStandardMaterial
                color="#0284c7"
                roughness={0.4}
                metalness={0.15}
              />
            </mesh>
          ))}

          {/* Conector Metálico Aviator GX16 de 4 Pinos com Rosca de Bloqueio */}
          <group position={[-1.45, 0.04, -0.22]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.13, 0.13, 0.34, 16]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.92} />
            </mesh>
            {/* Anel de Rosca Serrilhada Central */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.15, 0.15, 0.08, 12]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.88} />
            </mesh>
          </group>
        </group>
      </group>

    </group>
  );
};

export const ProjectsIsland = React.memo(ProjectsIslandComponent);
