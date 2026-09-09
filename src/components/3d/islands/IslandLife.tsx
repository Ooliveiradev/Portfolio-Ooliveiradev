import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { IslandId, GraphicsQuality } from '../../../types';

interface IslandLifeProps {
  islandId: IslandId;
  themeColor: string;
  isNear?: boolean;
  graphicsQuality?: GraphicsQuality;
}

export const IslandLife: React.FC<IslandLifeProps> = ({
  islandId,
  themeColor,
  isNear = false,
  graphicsQuality = 'mid',
}) => {
  const droneRef = useRef<THREE.Group>(null);
  const scanConeRef = useRef<THREE.Mesh>(null);
  const radarHeadRef = useRef<THREE.Group>(null);
  const radarLedRef = useRef<THREE.Mesh>(null);
  const runwayLedsRef = useRef<(THREE.Mesh | null)[]>([]);
  const rotorLeftRef = useRef<THREE.Group>(null);
  const rotorRightRef = useRef<THREE.Group>(null);

  // Deslocamento de fase único por ilha para drones não sincronizados
  const phaseOffset =
    islandId === 'projects'
      ? 0.0
      : islandId === 'experience'
      ? 1.3
      : islandId === 'skills'
      ? 2.6
      : islandId === 'education'
      ? 3.9
      : 5.2;

  useFrame((_, delta) => {
    const time = Date.now() * 0.001;

    // 1. Drone autônomo orbitando com banking fluido
    if (droneRef.current) {
      const droneSpeed = 0.6;
      const angle = time * droneSpeed + phaseOffset;
      const orbitR = 5.8 + Math.sin(time * 1.2 + phaseOffset) * 0.35;

      const dx = Math.cos(angle) * orbitR;
      const dz = Math.sin(angle) * orbitR;
      const dy = 2.0 + Math.sin(time * 2.4 + phaseOffset) * 0.25;

      droneRef.current.position.set(dx, dy, dz);

      // Orientação tangente à órbita + inclinação bancada orgânica
      const tangentYaw = angle + Math.PI / 2;
      const bankRoll = Math.sin(time * 1.5) * 0.16;
      droneRef.current.rotation.set(bankRoll, -tangentYaw, 0);

      // Feixe do scanner oscilando
      if (scanConeRef.current) {
        scanConeRef.current.rotation.z = Math.sin(time * 3.5 + phaseOffset) * 0.22;
      }

      // Rotação rápida das hélices anti-gravidade
      if (rotorLeftRef.current) rotorLeftRef.current.rotation.y += delta * 24;
      if (rotorRightRef.current) rotorRightRef.current.rotation.y -= delta * 24;
    }

    // 2. Rotação do radar de telemetria
    if (radarHeadRef.current) {
      radarHeadRef.current.rotation.y += delta * 1.4;
    }
    if (radarLedRef.current) {
      const isBlinking = Math.sin(time * 7.0 + phaseOffset) > 0.15;
      const mat = radarLedRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = isBlinking ? 1.0 : 0.2;
    }

    // 3. Efeito de onda sequencial nas luzes de pista de pouso
    const chaseSpeed = isNear ? 6.8 : 3.8;
    const chaseCycle = (time * chaseSpeed) % 6;

    runwayLedsRef.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const distToPhase = Math.abs(chaseCycle - idx);
      const isLit = distToPhase < 0.95 || Math.abs(chaseCycle - idx - 6) < 0.95;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = isLit ? (isNear ? 1.0 : 0.85) : 0.2;
      }
    });
  });

  return (
    <group>
      {/* ============================================================
          1. DRONE AUTÔNOMO DE EXPLORAÇÃO COM HÉLICES GIKATÓRIAS
         ============================================================ */}
      <group ref={droneRef} position={[5.8, 2.0, 0]}>
        {/* Chassi aerodinâmico acetinado tipo toy */}
        <mesh castShadow={graphicsQuality !== 'low'}>
          <capsuleGeometry args={[0.18, 0.42, 6, 12]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.35}
            metalness={0.25}
          />
        </mesh>

        {/* Viseira de sensores iluminada na cor tema */}
        <mesh position={[0, 0.05, 0.22]}>
          <boxGeometry args={[0.3, 0.08, 0.06]} />
          <meshBasicMaterial color={themeColor} />
        </mesh>

        {/* Braços de suporte dos rotores */}
        <mesh position={[-0.34, 0.04, 0]} rotation={[0, 0, 0.1]} castShadow>
          <boxGeometry args={[0.28, 0.04, 0.14]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.34, 0.04, 0]} rotation={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[0.28, 0.04, 0.14]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Rotor esquerdo giratório */}
        <group ref={rotorLeftRef} position={[-0.46, 0.08, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.34, 0.015, 0.04]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.1} />
          </mesh>
        </group>

        {/* Rotor direito giratório */}
        <group ref={rotorRightRef} position={[0.46, 0.08, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.34, 0.015, 0.04]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.1} />
          </mesh>
        </group>

        {/* Facho cônico de varredura holográfica */}
        <group position={[0, -0.12, 0]}>
          <mesh
            ref={scanConeRef}
            position={[0, -0.9, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.65, 1.8, 14, 1, true]} />
            <meshBasicMaterial
              color={themeColor}
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* Retículo de varredura no solo */}
          <mesh position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.65, 20]} />
            <meshBasicMaterial
              color={themeColor}
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>
      </group>

      {/* ============================================================
          2. TORRE DE RADAR DE TELEMETRIA NA BORDA DA ILHA
         ============================================================ */}
      <group position={[-3.6, 0.1, -2.4]}>
        {/* Base pesada de montagem */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.42, 0.3, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.42} metalness={0.2} />
        </mesh>
        {/* Mastro tubular estrutural */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.7, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.3} />
        </mesh>

        {/* Cabeça rotativa e antena parabólica */}
        <group ref={radarHeadRef} position={[0, 1.0, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.3} />
          </mesh>
          {/* Prato parabólico inclinado */}
          <group rotation={[0.35, 0, 0]}>
            <mesh position={[0, 0.1, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <coneGeometry args={[0.34, 0.22, 10, 1, true]} />
              <meshStandardMaterial
                color="#0f172a"
                roughness={0.35}
                metalness={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Iluminador de foco / Corneta alimentadora */}
            <mesh position={[0, 0.1, 0.34]}>
              <cylinderGeometry args={[0.02, 0.02, 0.24, 6]} />
              <meshBasicMaterial color="#cbd5e1" />
            </mesh>
            {/* LED vermelho de sinalização */}
            <mesh ref={radarLedRef} position={[0, 0.1, 0.48]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshBasicMaterial color="#f43f5e" transparent opacity={0.9} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ============================================================
          3. SEQUÊNCIA DE BALIZADORES DE APROXIMAÇÃO DA PISTA
         ============================================================ */}
      <group position={[0, 0.1, 3.5]}>
        {[-1.4, -0.7, 0, 0.7, 1.4, 2.1].map((offsetZ, i) => {
          const lx = (i % 2 === 0 ? -2.45 : 2.45);
          const lz = offsetZ;

          return (
            <group key={i} position={[lx, 0, lz]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.11, 0.16, 8]} />
                <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.2} />
              </mesh>
              <mesh
                ref={(el) => (runwayLedsRef.current[i] = el)}
                position={[0, 0.12, 0]}
              >
                <sphereGeometry args={[0.075, 8, 8]} />
                <meshBasicMaterial
                  color={themeColor}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};
