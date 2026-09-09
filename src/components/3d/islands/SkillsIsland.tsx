import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SkillsIsland: React.FC = () => {
  const fan1Ref = useRef<THREE.Group>(null);
  const fan2Ref = useRef<THREE.Group>(null);
  const fan3Ref = useRef<THREE.Group>(null);
  const holoChipRef = useRef<THREE.Group>(null);
  const coolerRingRef = useRef<THREE.Mesh>(null);
  const rgbPulseRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const time = Date.now() * 0.001;

    // Rotação suave das ventoinhas da GPU com inércia contínua
    if (fan1Ref.current) fan1Ref.current.rotation.z += delta * 14;
    if (fan2Ref.current) fan2Ref.current.rotation.z += delta * 14;
    if (fan3Ref.current) fan3Ref.current.rotation.z += delta * 14;

    // Levitação e rotação giroscópica do processador quântico holográfico
    if (holoChipRef.current) {
      holoChipRef.current.rotation.y += delta * 1.0;
      holoChipRef.current.rotation.x += delta * 0.5;
      holoChipRef.current.position.y = 2.4 + Math.sin(time * 2.8) * 0.18;
    }

    // Anel de água do waterblock com rotação contra-direcional
    if (coolerRingRef.current) {
      coolerRingRef.current.rotation.z -= delta * 1.8;
    }

    // Respiração da iluminação RGB
    if (rgbPulseRef.current) {
      rgbPulseRef.current.intensity = 2.4 + Math.sin(time * 3.5) * 0.8;
    }
  });

  // Cabos de força trançados com caimento elegante no espaço
  const cableCurves = useMemo(() => {
    return [
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.4, 0.4, -0.6),
          new THREE.Vector3(3.2, -0.2, 0.2),
          new THREE.Vector3(3.6, -1.8, 1.0),
          new THREE.Vector3(3.2, -4.5, 1.2),
        ]),
        color: '#f43f5e',
        radius: 0.12,
      },
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.2, 0.4, -0.8),
          new THREE.Vector3(2.9, -0.4, -0.2),
          new THREE.Vector3(3.2, -2.2, -0.4),
          new THREE.Vector3(2.8, -4.2, -0.5),
        ]),
        color: '#06b6d4',
        radius: 0.1,
      },
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.6, 0.4, -0.4),
          new THREE.Vector3(3.5, -0.3, 1.2),
          new THREE.Vector3(3.8, -2.5, 2.8),
          new THREE.Vector3(3.5, -4.8, 2.9),
        ]),
        color: '#eab308',
        radius: 0.09,
      },
    ];
  }, []);

  return (
    <group>
      {/* =========================================================
          BASE: PLATAFORMA TECNOLÓGICA & QUILHA OBSIDIANA ESTRATIFICADA
         ========================================================= */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 1.8, 3.4, 7]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.6}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* =========================================================
          BANDEJA DO CHASSI HORIZONTAL (TOY MATTE CASE)
         ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Bandeja inferior reforçada com bordas chanfradas */}
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.6, 6.2]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.42} metalness={0.15} />
        </mesh>

        {/* Paredes perimetrais do gabinete com aberturas de ventilação */}
        <mesh position={[0, 0.2, -3.0]} castShadow>
          <boxGeometry args={[7.4, 0.6, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Parede frontal dividida com vão livre para o heliponto */}
        <mesh position={[-2.45, 0.15, 3.0]} castShadow>
          <boxGeometry args={[2.5, 0.5, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[2.45, 0.15, 3.0]} castShadow>
          <boxGeometry args={[2.5, 0.5, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[-3.6, 0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 6.2]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[3.6, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.5, 6.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Painel de vidro temperado translúcido levemente inclinado */}
        <mesh position={[0, 1.4, -0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[7.2, 0.08, 5.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>

        {/* Parafusos recartilhados dourados nos 4 cantos */}
        {[
          [-3.3, 2.5, -2.4],
          [3.3, 2.5, -2.4],
          [-3.3, 0.3, 1.8],
          [3.3, 0.3, 1.8],
        ].map(([sx, sy, sz], idx) => (
          <mesh key={idx} position={[sx, sy, sz]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.14, 12]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.6} />
          </mesh>
        ))}

        {/* =========================================================
            PLACA-MÃE (EMERALD PCB COM TRILHAS DOURADAS EM RELEVO)
           ========================================================= */}
        <mesh position={[-0.2, 0.05, -0.2]} receiveShadow>
          <boxGeometry args={[6.2, 0.12, 5.0]} />
          <meshStandardMaterial color="#064e3b" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Trilhas condutoras douradas espelhadas */}
        {[
          [-1.5, 0.12, -0.5, 2.0, 0.05],
          [-1.2, 0.12, 0.3, 1.6, 0.05],
          [0.8, 0.12, -1.2, 1.8, 0.05],
          [1.5, 0.12, 0.8, 2.2, 0.05],
          [-0.6, 0.12, 1.4, 2.8, 0.06],
        ].map(([tx, ty, tz, len, wid], idx) => (
          <mesh key={idx} position={[tx, ty, tz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[len, wid]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.5}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>
        ))}

        {/* =========================================================
            SOCKET CPU & BLOCO DE WATERCOOLER AIO
           ========================================================= */}
        <group position={[-1.2, 0.15, -0.8]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[1.5, 0.12, 1.5]} />
            <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.3} />
          </mesh>

          {/* Bloco cilíndrico de cobre e acrílico com iluminação central */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.5, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
          </mesh>

          {/* Anel giratório do espelho infinito (Infinite Mirror) */}
          <mesh ref={coolerRingRef} position={[0, 0.62, 0]}>
            <ringGeometry args={[0.32, 0.6, 28]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#a855f7"
              emissiveIntensity={1.2}
              roughness={0.2}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Mangueiras de refrigeração líquida com abraçadeiras */}
          <mesh position={[0.7, 0.45, -0.6]} rotation={[0.3, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.45} metalness={0.05} />
          </mesh>
          <mesh position={[0.7, 0.35, -0.8]} rotation={[0.2, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 12]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.45} metalness={0.05} />
          </mesh>
        </group>

        {/* =========================================================
            MÓDULOS DE MEMÓRIA RAM DDR5 COM BARRAS RGB DIFUSAS
           ========================================================= */}
        <group position={[-0.1, 0.15, -0.8]}>
          {[-0.3, -0.1, 0.1, 0.3].map((rx, idx) => {
            const colors = ['#ec4899', '#a855f7', '#06b6d4', '#10b981'];
            return (
              <group key={idx} position={[rx, 0, 0]}>
                {/* Dissipador de calor em alumínio anodizado */}
                <mesh position={[0, 0.35, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.65, 1.4]} />
                  <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.4} />
                </mesh>
                {/* Barra difusora de luz RGB no topo */}
                <mesh position={[0, 0.7, 0]}>
                  <boxGeometry args={[0.09, 0.1, 1.4]} />
                  <meshStandardMaterial
                    color={colors[idx]}
                    emissive={colors[idx]}
                    emissiveIntensity={1.4}
                    roughness={0.2}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* =========================================================
            PLACA DE VÍDEO (GPU MONSTRO COM TRÊS VENTOINHAS)
           ========================================================= */}
        <group position={[-0.4, 0.5, 1.2]}>
          {/* Corpo robusto da GPU */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.8, 1.7]} />
            <meshStandardMaterial color="#27272a" roughness={0.4} metalness={0.25} />
          </mesh>

          {/* Faixa decorativa ciano no topo */}
          <mesh position={[0, 0.41, 0.4]}>
            <boxGeometry args={[3.8, 0.05, 0.1]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={1.2}
              roughness={0.2}
            />
          </mesh>

          {/* Slot PCIe dourado de conexão */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[2.8, 0.12, 0.1]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.25} metalness={0.8} />
          </mesh>

          {/* 3 Ventoinhas axiais de alta precisão */}
          {[-1.3, 0, 1.3].map((fanX, fIdx) => {
            const fanRef = fIdx === 0 ? fan1Ref : fIdx === 1 ? fan2Ref : fan3Ref;
            return (
              <group key={fIdx} position={[fanX, 0.42, 0]}>
                <group ref={fanRef} rotation={[-Math.PI / 2, 0, 0]}>
                  {/* Cubo central da ventoinha */}
                  <mesh>
                    <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                    <meshStandardMaterial color="#09090b" roughness={0.35} metalness={0.2} />
                  </mesh>
                  {/* Pás estilizadas aerodinâmicas */}
                  {[0, 1, 2, 3, 4, 5].map((b) => (
                    <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                      <boxGeometry args={[0.55, 0.12, 0.02]} />
                      <meshStandardMaterial color="#18181b" roughness={0.35} metalness={0.1} />
                    </mesh>
                  ))}
                </group>
              </group>
            );
          })}
        </group>

        {/* Unidade de armazenamento NVMe M.2 com dissipador */}
        <group position={[-1.4, 0.16, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 0.08, 0.4]} />
            <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* LED de atividade vermelho */}
          <mesh position={[0.4, 0.06, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#dc2626"
              emissiveIntensity={1.8}
            />
          </mesh>
        </group>
      </group>

      {/* Cabos trançados de alta voltagem com terminais banhados a ouro */}
      {cableCurves.map((item, idx) => (
        <group key={idx}>
          <mesh castShadow>
            <tubeGeometry args={[item.curve, 48, item.radius, 10, false]} />
            <meshStandardMaterial
              color={item.color}
              roughness={0.42}
              metalness={0.1}
            />
          </mesh>
          <mesh position={item.curve.getPoint(1)}>
            <boxGeometry args={[0.22, 0.35, 0.22]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* =========================================================
          PROCESSADOR QUÂNTICO HOLOGRÁFICO (FLUTUANTE NO CENTRO)
         ========================================================= */}
      <group ref={holoChipRef} position={[0, 2.4, 0]}>
        {/* Núcleo de computação monolítico ciano */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={0.8}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>
        {/* Gaiola dimensional externa em octaedro aramado giratório */}
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <octahedronGeometry args={[1.45, 0]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#db2777"
            emissiveIntensity={1.4}
            roughness={0.2}
            metalness={0.1}
            wireframe
          />
        </mesh>
      </group>

      {/* Iluminação ciberespacial da ilha */}
      <pointLight
        ref={rgbPulseRef}
        position={[-0.5, 2.0, 0.8]}
        color="#06b6d4"
        intensity={2.5}
        distance={12}
      />
      <pointLight position={[1.5, 1.8, -1.0]} color="#ec4899" intensity={2.2} distance={12} />
    </group>
  );
};
