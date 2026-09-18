import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SecretVoidIslandProps {
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  onEnterSecretIsland: () => void;
}

/**
 * SecretVoidIsland
 * A 6ª Ilha Oculta no Vazio Cósmico (Santuário dos Desenvolvedores).
 * Pousar ou aproximar da ilha ativa um portal para o mini-game arcade secreto.
 */
export const SecretVoidIsland: React.FC<SecretVoidIslandProps> = ({
  sharedVehiclePos,
  onEnterSecretIsland,
}) => {
  const monolithRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);
  const wasNearRef = useRef(false);

  const position: [number, number, number] = [-105, 0.8, 88];

  useFrame((_, delta) => {
    if (monolithRef.current) {
      monolithRef.current.rotation.y += delta * 0.5;
    }

    if (ringRef.current) {
      ringRef.current.rotation.y -= delta * 0.35;
    }

    // Detecção de proximidade com a nave
    if (sharedVehiclePos?.current) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - position[0];
      const dy = ship.y - position[1];
      const dz = ship.z - position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      const isNear = distSq < 7.5 * 7.5;
      if (isNear && !wasNearRef.current) {
        wasNearRef.current = true;
        onEnterSecretIsland();
      } else if (!isNear) {
        wasNearRef.current = false;
      }
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onEnterSecretIsland();
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Base da Ilha: Platô de Obsidiana Violeta Facetada */}
      <mesh position={[0, -1.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[5.2, 1.8, 2.8, 7]} />
        <meshStandardMaterial
          color="#1e112a"
          roughness={0.85}
          metalness={0.2}
          flatShading
        />
      </mesh>

      {/* Solo do Santuário */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[5.0, 5.0, 0.2, 7]} />
        <meshStandardMaterial
          color="#3b1d54"
          emissive="#240f36"
          emissiveIntensity={0.6}
          roughness={0.65}
          flatShading
        />
      </mesh>

      {/* Monólito Cósmico Flutuante com Runas de Ametista */}
      <mesh ref={monolithRef} position={[0, 2.6, 0]} castShadow>
        <octahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={1.4}
          roughness={0.2}
          metalness={0.5}
          flatShading
        />
      </mesh>

      {/* Anel de Cristais de Ametista Orbitais */}
      <group ref={ringRef} position={[0, 2.6, 0]}>
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            position={[Math.cos(angle) * 3.2, 0, Math.sin(angle) * 3.2]}
            scale={0.4}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#e879f9"
              emissive="#c084fc"
              emissiveIntensity={1.8}
              roughness={0.15}
              metalness={0.3}
              flatShading
            />
          </mesh>
        ))}
      </group>

      {/* Terminal de Arcade Retro Holográfico no Solo */}
      <group position={[1.8, 0.8, 1.2]} rotation={[0, -0.6, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.4, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Tela do Arcade */}
        <mesh position={[0, 0.35, 0.41]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.65, 0.5]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
      </group>

      {/* Beacon Colunar de Luz Violeta apontando para o infinito */}
      <mesh position={[0, 15, 0]}>
        <cylinderGeometry args={[0.2, 1.8, 30, 8, 1, true]} />
        <meshBasicMaterial
          color="#c084fc"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

    </group>
  );
};
