import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';

interface CosmicRubberDuckProps {
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
  onDiscover: () => void;
}

/**
 * CosmicRubberDuck
 * O Pato de Borracha Espacial da Depuração ("Rubber Duck Debugging").
 * Um easter egg clássico para desenvolvedores que exploram as coordenadas profundas do espaço.
 */
export const CosmicRubberDuck: React.FC<CosmicRubberDuckProps> = ({
  sharedVehiclePos,
  onDiscover,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [discovered, setDiscovered] = useState(false);

  const position: [number, number, number] = [-48, 2.8, -72];

  useFrame((state, delta) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Flutuação suave no vácuo estelar
      groupRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.35;
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.z = Math.sin(t * 1.4) * 0.08;
    }

    // Detecção de aproximação da nave
    if (!discovered && sharedVehiclePos?.current) {
      const ship = sharedVehiclePos.current;
      const dx = ship.x - position[0];
      const dy = ship.y - position[1];
      const dz = ship.z - position[2];
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < 4.2 * 4.2) {
        setDiscovered(true);
        sounds.playCoin();
        onDiscover();
      }
    }
  });

  const handleInteraction = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (discovered) return;
    setDiscovered(true);
    sounds.playCoin();
    onDiscover();
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleInteraction}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* 1. Corpo do Pato Amarelo Canário */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.9, 12, 10]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.35}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* 2. Cabeça do Pato */}
      <mesh position={[0.55, 0.65, 0]} castShadow>
        <sphereGeometry args={[0.58, 10, 8]} />
        <meshStandardMaterial
          color="#facc15"
          roughness={0.35}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* 3. Bico Alaranjado */}
      <mesh position={[1.1, 0.6, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[0.26, 0.45, 6]} />
        <meshStandardMaterial
          color="#f97316"
          roughness={0.4}
          metalness={0.02}
          flatShading
        />
      </mesh>

      {/* 4. Olhinhos Brilhantes */}
      <mesh position={[0.85, 0.82, 0.32]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0.85, 0.82, -0.32]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* 5. Capacete de Astronauta Espacial (Bolha Translúcida Ciano) */}
      <mesh position={[0.62, 0.68, 0]}>
        <sphereGeometry args={[0.82, 16, 12]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.1}
          metalness={0.1}
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 6. Mini-Jetpack de Foguete nas Costas */}
      <group position={[-0.78, 0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.6, 0.48]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Chamas do mini propulsor */}
        <mesh position={[-0.1, -0.4, 0]}>
          <coneGeometry args={[0.12, 0.3, 6]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      </group>

    </group>
  );
};
