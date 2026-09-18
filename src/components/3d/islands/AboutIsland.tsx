import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';

interface AboutIslandProps {
  isNear?: boolean;
}

const AboutIslandComponent: React.FC<AboutIslandProps> = () => {
  // Animation refs
  const paperPlaneRef = useRef<THREE.Group>(null);
  const steamRef = useRef<THREE.Group>(null);
  const deskLightRef = useRef<THREE.SpotLight>(null);
  const koiFishRef = useRef<THREE.Group>(null);
  const petalsGroupRef = useRef<THREE.Group>(null);
  const waterfallRef = useRef<THREE.Group>(null);

  // Micro-interaction timer refs (Zero React re-renders)
  const flightTimerRef = useRef(0);
  const screenFlashRef = useRef(0);
  const coffeeBoostRef = useRef(0);

  // Discrete interactive state
  const [lampOn, setLampOn] = useState(true);
  const [screenMode, setScreenMode] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);

  // Precomputed petal particles for the blooming Sakura trees
  const petalData = useMemo(() => {
    return [
      { pos: [0.3, 2.2, -2.4], scale: 0.08, speed: 1.2 },
      { pos: [0.8, 1.9, -2.2], scale: 0.07, speed: 0.9 },
      { pos: [-0.2, 2.0, -2.6], scale: 0.09, speed: 1.4 },
      { pos: [3.1, 2.3, -1.4], scale: 0.06, speed: 1.1 },
      { pos: [2.8, 1.8, -1.8], scale: 0.08, speed: 0.8 },
      { pos: [3.4, 2.0, -1.2], scale: 0.07, speed: 1.3 },
    ];
  }, []);

  // Precomputed waterfall droplets falling into the cosmic void
  const waterfallDroplets = useMemo(() => {
    return [
      { x: 3.2, y: -0.8, z: 0.6, s: 0.12 },
      { x: 3.28, y: -1.6, z: 0.65, s: 0.10 },
      { x: 3.24, y: -2.4, z: 0.58, s: 0.09 },
      { x: 3.32, y: -3.2, z: 0.62, s: 0.08 },
      { x: 3.26, y: -4.0, z: 0.59, s: 0.07 },
      { x: 3.22, y: -4.8, z: 0.64, s: 0.06 },
    ];
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;

    // 1. Cascata Cósmica escorrendo para o vácuo
    if (waterfallRef.current) {
      waterfallRef.current.position.y = -((t * 2.4) % 0.8);
    }

    // 2. Aviãozinho de Papel: Voo acrobático em looping 3D fluido vs Pouso nas rochas
    if (paperPlaneRef.current) {
      if (flightTimerRef.current > 0) {
        const flightProgress = (4.0 - flightTimerRef.current) / 4.0;
        const flightAngle = flightProgress * Math.PI * 4;
        const orbitRadius = 2.6 + Math.sin(flightProgress * Math.PI * 2) * 1.0;
        const px = Math.cos(flightAngle) * orbitRadius;
        const pz = Math.sin(flightAngle) * orbitRadius;
        const py = 2.2 + Math.sin(flightProgress * Math.PI * 4) * 0.8 + Math.cos(flightProgress * Math.PI) * 0.3;
        paperPlaneRef.current.position.set(px, py, pz);
        paperPlaneRef.current.rotation.y = -flightAngle + Math.PI / 2;
        paperPlaneRef.current.rotation.z = Math.sin(flightProgress * Math.PI * 4) * 0.6;
        paperPlaneRef.current.rotation.x = -Math.cos(flightProgress * Math.PI * 4) * 0.25;
      } else {
        paperPlaneRef.current.position.set(2.4, 0.38, 0.7);
        paperPlaneRef.current.rotation.set(0.1, -0.4, 0.05 + Math.sin(t * 2.0) * 0.02);
      }
    }

    // 3. Carpa Koi nadando no lago
    if (koiFishRef.current) {
      const koiAngle = t * 0.75;
      const kx = 1.3 + Math.cos(koiAngle) * 0.55;
      const kz = -1.2 + Math.sin(koiAngle) * 0.45;
      koiFishRef.current.position.set(kx, 0.28, kz);
      koiFishRef.current.rotation.y = -koiAngle + Math.PI / 2;
      koiFishRef.current.rotation.z = Math.sin(t * 3.5) * 0.12;
    }

    // 4. Pétalas de flor de cerejeira (Sakura) flutuando suavemente
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

    // 5. Rotação suave do vapor do café
    if (steamRef.current) {
      steamRef.current.rotation.y += delta * (0.6 + coffeeBoostRef.current * 2.0);
      const steamScale = 1.0 + coffeeBoostRef.current * 0.7;
      steamRef.current.scale.set(steamScale, steamScale * 1.2, steamScale);
    }

    // 6. Luminária Pixar: fade suave na intensidade
    if (deskLightRef.current) {
      const targetIntensity = lampOn ? 2.8 + Math.sin(t * 2.0) * 0.2 : 0.0;
      deskLightRef.current.intensity = THREE.MathUtils.lerp(
        deskLightRef.current.intensity,
        targetIntensity,
        delta * 8.0
      );
    }

    // Timers de decaimento em refs (zero React re-renders)
    if (flightTimerRef.current > 0) flightTimerRef.current = Math.max(0, flightTimerRef.current - delta);
    if (screenFlashRef.current > 0) screenFlashRef.current = Math.max(0, screenFlashRef.current - delta * 3.0);
    if (coffeeBoostRef.current > 0) coffeeBoostRef.current = Math.max(0, coffeeBoostRef.current - delta * 1.8);
  });

  // Handlers de micro-interatividades (zero overhead)
  const handleLampClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const nextState = !lampOn;
    setLampOn(nextState);
    sounds.playLampSwitch(nextState);
  };

  const handleScreenClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playTerminalBeep();
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 300);
    setScreenMode((prev) => (prev + 1) % 3);
  };

  const handlePaperPlaneClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playPaperPlaneWhoosh();
    flightTimerRef.current = 4.0;
  };

  const handleCoffeeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    sounds.playSipCoffee();
    coffeeBoostRef.current = 2.0;
  };

  return (
    <group>
      {/* 1. 🌋 BASE INFERIOR: METEORITO FACETADO EM TERRACOTA */}
      <mesh position={[0, -2.4, 0]} rotation={[0, Math.PI / 8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.4, 1.2, 4.4, 8]} />
        <meshStandardMaterial color="#9a3412" roughness={0.88} metalness={0.08} flatShading />
      </mesh>

      {/* Cascata Crystalline */}
      <group position={[3.2, 0, 0.6]}>
        <mesh position={[0, -3.2, 0]}>
          <boxGeometry args={[0.32, 6.4, 0.65]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.4} transparent opacity={0.82} />
        </mesh>
        <group ref={waterfallRef}>
          {waterfallDroplets.map((drop, dIdx) => (
            <mesh key={`drop-${dIdx}`} position={[0, drop.y, 0]} scale={[drop.s, drop.s * 1.8, drop.s]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#e0f2fe" emissive="#38bdf8" emissiveIntensity={2.0} transparent opacity={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 2. 🌸 PLATÔ SUPERIOR: GRAMADO ZEN */}
      <mesh position={[0, 0.05, 0]} rotation={[0, Math.PI / 8, 0]} receiveShadow>
        <cylinderGeometry args={[5.45, 5.45, 0.08, 8]} />
        <meshStandardMaterial color="#65a30d" roughness={0.75} metalness={0.02} flatShading />
      </mesh>

      <mesh position={[-1.5, 0.09, -0.4]} receiveShadow>
        <boxGeometry args={[3.2, 0.04, 2.2]} />
        <meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.05} />
      </mesh>

      {/* Pedras de Rio Polidas (Tobi-ishi) */}
      {[
        { x: -0.2, z: 1.4, s: 0.38 },
        { x: 0.3, z: 1.6, s: 0.42 },
        { x: 0.1, z: 2.1, s: 0.36 },
        { x: 0.7, z: 0.3, s: 0.35 },
        { x: 1.0, z: -0.3, s: 0.38 },
        { x: 1.6, z: 0.4, s: 0.34 },
      ].map((stone, sIdx) => (
        <mesh
          key={`tobi-stone-${sIdx}`}
          position={[stone.x, 0.08, stone.z]}
          scale={[stone.s, stone.s * 0.4, stone.s * 1.15]}
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.65} metalness={0.1} flatShading />
        </mesh>
      ))}

      {/* 3. ⛩️ JARDIM ZEN JAPONÊS: SAKURA, LAGO DE CARPAS, PONTE E TŌRŌ */}

      {/* Bonsai Sakura Principal (Fundo Esquerdo) */}
      <group position={[0.2, 0.08, -2.4]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.28, 1.2, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0.25, 1.3, 0.1]} rotation={[0, 0, -0.45]} castShadow>
          <cylinderGeometry args={[0.11, 0.16, 0.9, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[-0.22, 1.2, -0.15]} rotation={[0, 0, 0.5]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 0.8, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>

        {[
          { x: 0.35, y: 1.8, z: 0.15, r: 0.9, col: '#f472b6' },
          { x: -0.35, y: 1.7, z: -0.2, r: 0.8, col: '#ec4899' },
          { x: 0.0, y: 2.1, z: 0.0, r: 1.0, col: '#fbcfe8' },
          { x: 0.45, y: 1.5, z: -0.3, r: 0.7, col: '#ffffff' },
          { x: -0.45, y: 1.5, z: 0.25, r: 0.72, col: '#f472b6' },
        ].map((canopy, cIdx) => (
          <mesh key={`canopy1-${cIdx}`} position={[canopy.x, canopy.y, canopy.z]} castShadow>
            <dodecahedronGeometry args={[canopy.r, 0]} />
            <meshStandardMaterial color={canopy.col} emissive={canopy.col} emissiveIntensity={0.2} roughness={0.65} metalness={0.05} flatShading />
          </mesh>
        ))}
      </group>

      {/* Segundo Bonsai Sakura (Flanco Direito) */}
      <group position={[3.2, 0.08, -1.6]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.22, 1.0, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        <mesh position={[-0.2, 1.1, 0.1]} rotation={[0, 0, 0.35]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.7, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.7} />
        </mesh>
        {[
          { x: -0.2, y: 1.5, z: 0.1, r: 0.75, col: '#f472b6' },
          { x: 0.2, y: 1.4, z: -0.1, r: 0.65, col: '#fbcfe8' },
          { x: 0.0, y: 1.8, z: 0.0, r: 0.82, col: '#ec4899' },
        ].map((canopy, cIdx) => (
          <mesh key={`canopy2-${cIdx}`} position={[canopy.x, canopy.y, canopy.z]} castShadow>
            <dodecahedronGeometry args={[canopy.r, 0]} />
            <meshStandardMaterial color={canopy.col} emissive={canopy.col} emissiveIntensity={0.2} roughness={0.65} flatShading />
          </mesh>
        ))}
      </group>

      {/* Pétalas suspensas */}
      <group ref={petalsGroupRef}>
        {petalData.map((p, idx) => (
          <mesh key={`petal-${idx}`} position={p.pos as [number, number, number]} scale={p.scale}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#fbcfe8" emissive="#f472b6" emissiveIntensity={0.4} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Lago de Carpas */}
      <group position={[1.3, 0.08, -1.2]}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1.35, 1.45, 0.14, 16]} />
          <meshStandardMaterial color="#334155" roughness={0.7} flatShading />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.28, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.4} roughness={0.1} metalness={0.15} transparent opacity={0.82} />
        </mesh>
        
        <group ref={koiFishRef}>
          <mesh castShadow>
            <coneGeometry args={[0.07, 0.32, 6]} />
            <meshStandardMaterial color="#f97316" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.16]}>
            <boxGeometry args={[0.03, 0.06, 0.12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Ponte Arqueada de Madeira (Taiko-bashi) */}
      <group position={[2.1, 0.12, -0.2]} rotation={[0, 0.25, 0]}>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 0.65, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#b45309" roughness={0.5} metalness={0.05} />
        </mesh>
        {[-0.32, 0.32].map((pz, idx) => (
          <group key={`bridge-rail-${idx}`} position={[0, 0, pz]}>
            {[-0.45, 0, 0.45].map((px, pIdx) => (
              <mesh key={`post-${pIdx}`} position={[px, 0.36, 0]} castShadow>
                <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
                <meshStandardMaterial color="#78350f" roughness={0.5} />
              </mesh>
            ))}
            <mesh position={[0, 0.52, 0]}>
              <boxGeometry args={[1.05, 0.04, 0.04]} />
              <meshStandardMaterial color="#991b1b" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Lanternas Japonesas (Tōrō) */}
      {[
        { x: 0.9, z: -0.3 },
        { x: 2.7, z: -0.9 },
      ].map((toro, idx) => (
        <group key={`toro-${idx}`} position={[toro.x, 0.08, toro.z]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 0.2, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[0.26, 0.22, 0.26]} />
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.5} roughness={0.3} />
          </mesh>
          {/* Emissive fixtures share the island fill light. */}
          <mesh position={[0, 0.72, 0]} castShadow>
            <coneGeometry args={[0.35, 0.18, 6]} />
            <meshStandardMaterial color="#334155" roughness={0.7} flatShading />
          </mesh>
        </group>
      ))}

      {/* 4. 💻 ESTAÇÃO DO DESENVOLVEDOR */}
      <group position={[-1.4, 0.1, -0.2]} rotation={[0, 0.15, 0]}>
        <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.7, 0.1, 1.3]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.06} />
        </mesh>
        <mesh position={[0.9, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.78, 1.15]} />
          <meshStandardMaterial color="#92400e" roughness={0.45} metalness={0.05} />
        </mesh>

        <group position={[-0.1, 1.38, -0.22]} onClick={handleScreenClick}>
          <mesh castShadow>
            <boxGeometry args={[2.0, 0.92, 0.08]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.88, 0.82]} />
            <meshStandardMaterial
              color={screenMode === 1 ? '#022c22' : '#090d16'}
              emissive={screenFlash ? '#38bdf8' : screenMode === 1 ? '#064e3b' : screenMode === 2 ? '#0284c7' : '#000000'}
              emissiveIntensity={screenFlash ? 1.8 : 0.4}
              roughness={0.15}
            />
          </mesh>
          {/* Modo 0: VS Code / Linhas de Código Sintaxe Neon */}
          {screenMode === 0 && (
            <group position={[0, 0, 0.055]}>
              {[-0.24, -0.12, 0.0, 0.12, 0.24].map((ly, lIdx) => {
                const codeColors = ['#38bdf8', '#facc15', '#4ade80', '#f43f5e', '#a78bfa'];
                return (
                  <mesh key={`code-line-${lIdx}`} position={[-0.15, ly, 0]}>
                    <planeGeometry args={[1.4, 0.045]} />
                    <meshStandardMaterial
                      color={codeColors[lIdx]}
                      emissive={codeColors[lIdx]}
                      emissiveIntensity={0.9}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {/* Modo 1: Terminal Matrix (Chuva de Código Verde) */}
          {screenMode === 1 && (
            <group position={[0, 0, 0.055]}>
              {[-0.6, -0.3, 0.0, 0.3, 0.6].map((cx, cIdx) => (
                <mesh key={`term-line-${cIdx}`} position={[cx, 0, 0]}>
                  <planeGeometry args={[0.12, 0.65]} />
                  <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={1.8} />
                </mesh>
              ))}
            </group>
          )}

          {/* Modo 2: Radar Cósmico */}
          {screenMode === 2 && (
            <group position={[0, 0, 0.055]}>
              <mesh>
                <ringGeometry args={[0.18, 0.22, 24]} />
                <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.5} side={THREE.DoubleSide} />
              </mesh>
              <mesh>
                <ringGeometry args={[0.32, 0.35, 24]} />
                <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1.2} side={THREE.DoubleSide} />
              </mesh>
            </group>
          )}
        </group>

        {/* Teclado Mecânico & Mouse */}
        <group position={[-0.1, 0.91, 0.22]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.3, 0.015, 0.45]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[-0.15, 0.02, 0]} castShadow>
            <boxGeometry args={[0.8, 0.03, 0.25]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
          <mesh position={[0.38, 0.02, 0]} castShadow>
            <boxGeometry args={[0.12, 0.03, 0.2]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>
        </group>

        {/* Luminária Pixar */}
        <group position={[0.85, 0.91, -0.15]} onClick={handleLampClick}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.16, 0.04, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[-0.26, 0.72, 0.12]} rotation={[0.6, 0, -0.85]} castShadow>
            <coneGeometry args={[0.2, 0.28, 12, 1, true]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.28} metalness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <spotLight
            ref={deskLightRef}
            position={[-0.26, 0.68, 0.12]}
            target-position={[-0.26, 0.9, 0.2]}
            color="#fef08a"
            intensity={2.8}
            angle={0.65}
            penumbra={0.5}
            distance={4.5}
          />
        </group>

        {/* Xícara de Café */}
        <group position={[0.45, 0.95, 0.22]} onClick={handleCoffeeClick}>
          <mesh castShadow>
            <cylinderGeometry args={[0.11, 0.09, 0.2, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} metalness={0.05} />
          </mesh>
          <group ref={steamRef} position={[0, 0.2, 0]}>
            {[0.05, 0.11, 0.18].map((sy, idx) => (
              <mesh key={`steam-${idx}`} position={[Math.sin(idx * 2) * 0.03, sy, 0]}>
                <dodecahedronGeometry args={[0.035 + idx * 0.015, 0]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.6} transparent opacity={0.5 - idx * 0.12} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* 5. ✈️ AVIÃOZINHO DE PAPEL & ROCHAS */}
      <group position={[2.4, 0.16, 0.7]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#475569" roughness={0.8} flatShading />
        </mesh>
      </group>

      <group ref={paperPlaneRef} position={[2.4, 0.38, 0.7]} onClick={handlePaperPlaneClick}>
        <mesh castShadow>
          <coneGeometry args={[0.26, 0.75, 3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.02} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Nuvens Volumétricas Low-Poly no Céu */}
      <group position={[-1.8, 4.0, -1.5]}>
        {[
          { x: 0, y: 0, z: 0, s: 0.8 },
          { x: 0.6, y: -0.1, z: 0.1, s: 0.65 },
          { x: -0.6, y: -0.1, z: -0.1, s: 0.6 },
          { x: 0.2, y: 0.3, z: 0, s: 0.7 },
        ].map((cPart, idx) => (
          <mesh key={`cloud1-${idx}`} position={[cPart.x, cPart.y, cPart.z]} scale={cPart.s}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#ffffff" roughness={0.6} flatShading />
          </mesh>
        ))}
      </group>
      <group position={[2.2, 4.4, -2.0]}>
        {[
          { x: 0, y: 0, z: 0, s: 0.7 },
          { x: 0.5, y: -0.05, z: 0, s: 0.55 },
          { x: -0.5, y: -0.05, z: 0, s: 0.5 },
        ].map((cPart, idx) => (
          <mesh key={`cloud2-${idx}`} position={[cPart.x, cPart.y, cPart.z]} scale={cPart.s}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.6} flatShading />
          </mesh>
        ))}
      </group>

    </group>
  );
};

export const AboutIsland = React.memo(AboutIslandComponent);
