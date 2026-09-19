import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CosmicWhisper, WhisperColor } from '../../../types';
import { sounds } from '../../../audio/soundManager';
import { findNearbyWhisper } from '../../../utils/whisperProximity';

interface CosmicWhispersProps {
  whispers: CosmicWhisper[];
  sharedVehiclePos: React.RefObject<THREE.Vector3>;
  onInspectWhisper: (whisper: CosmicWhisper) => void;
}

const COLOR_MAP: Record<WhisperColor, { core: string; glow: string }> = {
  cyan: { core: '#06b6d4', glow: '#67e8f9' },
  purple: { core: '#a855f7', glow: '#d8b4fe' },
  amber: { core: '#f59e0b', glow: '#fde68a' },
  emerald: { core: '#10b981', glow: '#6ee7b7' },
};

export const CosmicWhispers: React.FC<CosmicWhispersProps> = ({
  whispers,
  sharedVehiclePos,
  onInspectWhisper,
}) => {
  const [nearbyWhisperId, setNearbyWhisperId] = useState<string | null>(null);
  const nearbyWhisperRef = useRef<string | null>(null);
  const lastProximityCheck = useRef(-Infinity);
  const groupsRef = useRef<{ [id: string]: THREE.Group | null }>({});

  // 60/120 FPS frame loop para animações e checagem inercial de proximidade
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const vPos = sharedVehiclePos.current;
    const checkProximity = time - lastProximityCheck.current >= 0.08;

    for (let idx = 0; idx < whispers.length; idx++) {
      const whisper = whispers[idx];
      const group = groupsRef.current[whisper.id];
      if (group) {
        // Flutuação suave vertical (bobbing)
        group.position.y = whisper.position[1] + Math.sin(time * 2 + idx * 1.3) * 0.25;

        // Rotação dos anéis orbitais
        group.rotation.y = time * 0.8 + idx;
      }
    }

    if (checkProximity) {
      lastProximityCheck.current = time;
      const closestId = vPos ? findNearbyWhisper(whispers, vPos, nearbyWhisperRef.current)?.id ?? null : null;
      if (closestId !== nearbyWhisperRef.current) {
        nearbyWhisperRef.current = closestId;
        setNearbyWhisperId(closestId);
      }
    }
  });

  return (
    <group name="CosmicWhispersGroup">
      {whispers.map((whisper, idx) => {
        const colors = COLOR_MAP[whisper.color] || COLOR_MAP.cyan;
        const isNearby = nearbyWhisperId === whisper.id;

        return (
          <group
            key={whisper.id}
            position={[whisper.position[0], whisper.position[1], whisper.position[2]]}
            ref={(el) => {
              if (el) groupsRef.current[whisper.id] = el;
              else delete groupsRef.current[whisper.id];
            }}
          >
            {/* 1. Núcleo Bioluminescente Central */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                onInspectWhisper(whisper);
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.45, 24, 24]} />
              <meshStandardMaterial
                color={colors.core}
                emissive={colors.core}
                emissiveIntensity={isNearby ? 2.5 : 1.4}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>

            {/* 2. Brilho Eéreo Externo */}
            <mesh>
              <sphereGeometry args={[0.7, 16, 16]} />
              <meshBasicMaterial
                color={colors.glow}
                transparent
                opacity={isNearby ? 0.35 : 0.18}
                wireframe
              />
            </mesh>

            {/* 3. Anéis Orbitais Holográficos Tilted */}
            <mesh rotation={[Math.PI / 4, 0, idx]}>
              <torusGeometry args={[0.85, 0.02, 8, 32]} />
              <meshBasicMaterial color={colors.glow} transparent opacity={0.6} />
            </mesh>
            <mesh rotation={[-Math.PI / 3, Math.PI / 6, -idx]}>
              <torusGeometry args={[1.05, 0.015, 8, 32]} />
              <meshBasicMaterial color={colors.core} transparent opacity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
