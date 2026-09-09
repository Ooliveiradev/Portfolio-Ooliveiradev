import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ProjectsIsland: React.FC = () => {
  const rocketRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);
  const holoMeshRef = useRef<THREE.Mesh>(null);
  const screenGlowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    const time = Date.now() * 0.001;

    // Levitação suave do foguete de testes com respiração orgânica
    if (rocketRef.current) {
      rocketRef.current.position.y = 2.6 + Math.sin(time * 2.5) * 0.14;
      rocketRef.current.rotation.z = Math.sin(time * 1.8) * 0.03;
    }

    // Volutas de fumaça poligonal estilizada em rotação
    if (smokeRef.current) {
      smokeRef.current.rotation.y += delta * 0.45;
    }

    // Farol estroboscópico de aviação no topo da torre
    if (beaconRef.current) {
      beaconRef.current.intensity = 1.8 + Math.sin(time * 6.0) * 1.4;
    }

    // Holograma 3D girando sobre a prancheta de arquitetura
    if (holoMeshRef.current) {
      holoMeshRef.current.rotation.y += delta * 1.2;
      holoMeshRef.current.rotation.x += delta * 0.6;
    }

    // Brilho pulsante da tela arcade
    if (screenGlowRef.current) {
      screenGlowRef.current.intensity = 1.4 + Math.sin(time * 4.0) * 0.6;
    }
  });

  return (
    <group>
      {/* =========================================================
          BASE: ESTRATIFICAÇÃO ROCHOSA & PLATAFORMA INDUSTRIAL
         ========================================================= */}
      {/* Quilha inferior rochosa poligonal (Floating Asteroid Keel) */}
      <mesh position={[0, -2.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 1.8, 3.4, 7]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.65}
          metalness={0.08}
          flatShading
        />
      </mesh>

      {/* Camada intermediária de suporte estrutural */}
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <cylinderGeometry args={[6.3, 5.8, 0.8, 8]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.48}
          metalness={0.12}
          flatShading
        />
      </mesh>

      {/* Deck superior industrial octogonal chanfrado */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[6.4, 6.3, 0.4, 8]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.42}
          metalness={0.15}
        />
      </mesh>

      {/* Faixa perimetral de aviso (Caution Strip) estilo Poly Bridge / Toy */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 6.1, 32]} />
        <meshStandardMaterial
          color="#eab308"
          roughness={0.38}
          metalness={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Piso central antiderrapante texturizado com bezerro de borracha */}
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[5.4, 5.4, 0.06, 8]} />
        <meshStandardMaterial
          color="#1e293b"
          roughness={0.55}
          metalness={0.1}
        />
      </mesh>

      {/* Balizadores de pista com cúpula translúcida ciano */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const rad = (i * Math.PI) / 4;
        const lx = Math.cos(rad) * 4.9;
        const lz = Math.sin(rad) * 4.9;
        return (
          <group key={i} position={[lx, 0.16, lz]}>
            {/* Poste metálico */}
            <mesh castShadow>
              <cylinderGeometry args={[0.08, 0.12, 0.22, 8]} />
              <meshStandardMaterial color="#64748b" roughness={0.35} metalness={0.3} />
            </mesh>
            {/* Lente emissiva */}
            <mesh position={[0, 0.16, 0]}>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#0284c7"
                emissiveIntensity={1.2}
                roughness={0.2}
                metalness={0.1}
              />
            </mesh>
          </group>
        );
      })}

      {/* =========================================================
          GABINETE RETRO ARCADE (MINIATURA TOY COLECIONÁVEL)
         ========================================================= */}
      <group position={[-2.4, 0.1, -1.2]} rotation={[0, 0.5, 0]}>
        {/* Chassi principal fúcsia/magenta com acabamento brilhante */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[1.5, 3.2, 1.4]} />
          <meshStandardMaterial
            color="#ec4899"
            roughness={0.38}
            metalness={0.06}
          />
        </mesh>

        {/* Marquee superior iluminado */}
        <mesh position={[0, 3.1, 0.56]}>
          <boxGeometry args={[1.35, 0.45, 0.22]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#fde047"
            emissiveIntensity={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* Moldura da tela CRT inclinada */}
        <mesh position={[0, 2.2, 0.56]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[1.22, 0.92]} />
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#0891b2"
            emissiveIntensity={1.1}
            roughness={0.25}
          />
        </mesh>

        {/* Pixel Sprite estilizado na tela */}
        <mesh position={[0, 2.22, 0.59]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial
            color="#fef08a"
            emissive="#facc15"
            emissiveIntensity={1.5}
            roughness={0.2}
          />
        </mesh>

        {/* Mesa de controle inclinada com botões */}
        <mesh position={[0, 1.45, 0.76]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[1.4, 0.15, 0.72]} />
          <meshStandardMaterial color="#0f172a" roughness={0.45} metalness={0.1} />
        </mesh>

        {/* Joystick esférico vermelho */}
        <group position={[-0.35, 1.65, 0.76]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.25} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.32, 0]} castShadow>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} metalness={0.1} />
          </mesh>
        </group>

        {/* Botões coloridos arcade */}
        {[
          [0.1, 0.7],
          [0.3, 0.7],
          [0.15, 0.82],
          [0.35, 0.82],
        ].map(([bx, bz], idx) => {
          const btnColors = ['#eab308', '#3b82f6', '#22c55e', '#f43f5e'];
          return (
            <mesh key={idx} position={[bx, 1.6, bz]}>
              <cylinderGeometry args={[0.07, 0.07, 0.06, 10]} />
              <meshStandardMaterial
                color={btnColors[idx]}
                roughness={0.35}
                metalness={0.1}
              />
            </mesh>
          );
        })}

        {/* Inserção de moedas metálica (Coin Door) */}
        <mesh position={[0, 0.65, 0.72]}>
          <boxGeometry args={[0.7, 0.8, 0.05]} />
          <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.4} />
        </mesh>

        {/* Luz de projeção da tela no chão */}
        <pointLight
          ref={screenGlowRef}
          position={[0, 2.2, 1.2]}
          color="#06b6d4"
          intensity={1.4}
          distance={5}
        />
      </group>

      {/* =========================================================
          TORRE DE LANÇAMENTO TRELIÇADA & FOGUETE EXPERIMENTAL
         ========================================================= */}
      <group position={[1.8, 0.1, -1.5]}>
        {/* Pilares verticais estruturais da torre */}
        {[-0.8, 0.8].map((tx, idx) => (
          <mesh key={idx} position={[tx, 2.5, 0]} castShadow>
            <boxGeometry args={[0.18, 5.0, 0.18]} />
            <meshStandardMaterial color="#dc2626" roughness={0.42} metalness={0.1} />
          </mesh>
        ))}

        {/* Travessas horizontais e diagonais da torre */}
        {[1.2, 2.4, 3.6, 4.6].map((by, idx) => (
          <mesh key={idx} position={[0, by, 0]}>
            <boxGeometry args={[1.7, 0.14, 0.14]} />
            <meshStandardMaterial color="#dc2626" roughness={0.42} metalness={0.1} />
          </mesh>
        ))}

        {/* Braço de conexão e abastecimento articulado (Umbilical Arm) */}
        <mesh position={[-0.6, 4.2, 0]} castShadow>
          <boxGeometry args={[1.5, 0.2, 0.25]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.45} metalness={0.1} />
        </mesh>

        {/* Farol estroboscópico de alerta no cume */}
        <pointLight
          ref={beaconRef}
          position={[0.8, 5.2, 0]}
          color="#ef4444"
          intensity={2.0}
          distance={10}
        />
        <mesh position={[0.8, 5.15, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Foguete Experimental estilizado */}
      <group ref={rocketRef} position={[0.6, 2.6, -1.5]}>
        {/* Corpo esbelto branco esmaltado */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.7, 3.2, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.36} metalness={0.08} />
        </mesh>

        {/* Coifa cônica vermelha aerodinâmica */}
        <mesh position={[0, 2.2, 0]} castShadow>
          <coneGeometry args={[0.5, 1.2, 16]} />
          <meshStandardMaterial color="#dc2626" roughness={0.38} metalness={0.08} />
        </mesh>

        {/* Vigia espelhada azul celeste */}
        <mesh position={[0, 0.8, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.12, 16]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.2}
          />
        </mesh>

        {/* 3 Aletas estabilizadoras em 120° */}
        {[0, 1, 2].map((fi) => {
          const finAngle = (fi * Math.PI * 2) / 3;
          return (
            <mesh
              key={fi}
              position={[Math.sin(finAngle) * 0.75, -1.2, Math.cos(finAngle) * 0.75]}
              rotation={[0, finAngle, 0]}
              castShadow
            >
              <boxGeometry args={[0.08, 1.4, 0.7]} />
              <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.08} />
            </mesh>
          );
        })}

        {/* Bocais de escape com interior incandescente */}
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.4, 0.55, 0.5, 14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* Volutas de fumaça poligonal estilizada (Low-Poly Vapor Cloud) */}
      <group ref={smokeRef} position={[0.6, 0.4, -1.5]}>
        {[
          [0, 0.2, 0, 0.75],
          [-0.5, 0.18, 0.4, 0.6],
          [0.6, 0.28, -0.3, 0.65],
          [-0.3, 0.12, -0.5, 0.55],
          [0.4, 0.2, 0.5, 0.55],
        ].map(([sx, sy, sz, scale], i) => (
          <mesh key={i} position={[sx, sy, sz]} scale={[scale, scale * 0.85, scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#f8fafc"
              roughness={0.6}
              metalness={0.02}
              flatShading
            />
          </mesh>
        ))}
        <pointLight position={[0, 0.5, 0]} color="#f97316" intensity={3.5} distance={7} />
      </group>

      {/* =========================================================
          TECLADO MECÂNICO ARTESANAL COM KEYCAPS ESCULPIDAS
         ========================================================= */}
      <group position={[-1.4, 0.15, 1.2]} rotation={[0, -0.4, 0]}>
        {/* Base da carcaça do teclado chanfrada */}
        <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[3.2, 0.2, 1.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.15} />
        </mesh>

        {/* 3 Teclas artesanais coloridas com chanfro em relevo */}
        {[
          { x: -1.05, col: '#f43f5e' },
          { x: 0, col: '#10b981' },
          { x: 1.05, col: '#8b5cf6' },
        ].map((k, idx) => (
          <group key={idx} position={[k.x, 0.35, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.85, 0.38, 0.85]} />
              <meshStandardMaterial
                color={k.col}
                roughness={0.38}
                metalness={0.08}
              />
            </mesh>
            {/* Centro impresso / ícone */}
            <mesh position={[0, 0.2, 0]}>
              <planeGeometry args={[0.5, 0.22]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.02} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================
          CAVALETE DE ARQUITETURA COM PROJETOR HOLOGRÁFICO 3D
         ========================================================= */}
      <group position={[2.0, 0.1, 1.2]} rotation={[0, -0.6, 0]}>
        {/* Pernas do cavalete em madeira polida */}
        {[-0.4, 0.4].map((lx, idx) => (
          <mesh key={idx} position={[lx, 1.0, 0]} rotation={[0, 0, lx * -0.2]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.2, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.02} />
          </mesh>
        ))}
        <mesh position={[0, 0.9, -0.5]} rotation={[-0.3, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 8]} />
          <meshStandardMaterial color="#78350f" roughness={0.5} metalness={0.02} />
        </mesh>

        {/* Prancheta com prancha de blueprint azul elétrico */}
        <mesh position={[0, 1.4, 0.1]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.8, 1.3, 0.06]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* Grade de blueprint técnico */}
        <mesh position={[0, 1.42, 0.14]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[1.5, 1.0]} />
          <meshStandardMaterial
            color="#38bdf8"
            roughness={0.3}
            metalness={0.1}
            wireframe
          />
        </mesh>

        {/* Miniatura isométrica holográfica flutuando sobre a prancheta */}
        <mesh
          ref={holoMeshRef}
          position={[0, 2.2, 0.2]}
          scale={[0.32, 0.32, 0.32]}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#0284c7"
            emissiveIntensity={1.6}
            roughness={0.2}
            metalness={0.1}
            wireframe
          />
        </mesh>
      </group>

      {/* Iluminação pontual cósmica para o diorama da ilha */}
      <pointLight position={[0, 3.8, 0]} color="#38bdf8" intensity={2.4} distance={12} />
    </group>
  );
};
