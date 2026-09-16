import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CosmicWhisper, WhisperColor } from '../../../types';
import { sounds } from '../../../audio/soundManager';

interface CosmicWhispersProps {
  whispers: CosmicWhisper[];
  sharedVehiclePos: React.RefObject<THREE.Vector3>;
  onInspectWhisper: (whisper: CosmicWhisper) => void;
}

const COLOR_MAP: Record<WhisperColor, { core: string; glow: string; hex: number }> = {
  cyan: { core: '#06b6d4', glow: '#67e8f9', hex: 0x06b6d4 },
  purple: { core: '#a855f7', glow: '#d8b4fe', hex: 0xa855f7 },
  amber: { core: '#f59e0b', glow: '#fde68a', hex: 0xf59e0b },
  emerald: { core: '#10b981', glow: '#6ee7b7', hex: 0x10b981 },
};

export const CosmicWhispers: React.FC<CosmicWhispersProps> = ({
  whispers,
  sharedVehiclePos,
  onInspectWhisper,
}) => {
  const [nearbyWhisperId, setNearbyWhisperId] = useState<string | null>(null);
  const nearbyWhisperRef = useRef<string | null>(null);
  const lastProximityCheck = useRef(-Infinity);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const litWhisperRef = useRef<string | null>(null);
  const groupsRef = useRef<{ [id: string]: THREE.Group | null }>({});

  // 60/120 FPS frame loop para animações e checagem inercial de proximidade
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const vPos = sharedVehiclePos.current;
    const checkProximity = time - lastProximityCheck.current >= 0.08;

    let closestId: string | null = null;
    let closestDistSq = Infinity;
    let closestWhisper: CosmicWhisper | null = null;

    for (let idx = 0; idx < whispers.length; idx++) {
      const whisper = whispers[idx];
      const group = groupsRef.current[whisper.id];
      if (group) {
        // Flutuação suave vertical (bobbing)
        group.position.y = whisper.position[1] + Math.sin(time * 2 + idx * 1.3) * 0.25;

        // Rotação dos anéis orbitais
        group.rotation.y = time * 0.8 + idx;
      }

      if (checkProximity && vPos) {
        const dx = vPos.x - whisper.position[0];
        const dy = vPos.y - whisper.position[1];
        const dz = vPos.z - whisper.position[2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestWhisper = whisper;
          closestId = distSq < 36 ? whisper.id : null;
        }
      }
    }

    if (checkProximity) {
      lastProximityCheck.current = time;
      if (closestId !== nearbyWhisperRef.current) {
        nearbyWhisperRef.current = closestId;
        setNearbyWhisperId(closestId);
      }
      // One permanent light keeps every lit scene material's shader stable as messages grow.
      const light = glowLightRef.current;
      if (light) {
        const whisper = closestWhisper;
        litWhisperRef.current = whisper?.id ?? null;
        light.intensity = whisper ? (closestId ? 2.5 : 1) : 0;
        if (whisper) light.color.setHex((COLOR_MAP[whisper.color] || COLOR_MAP.cyan).hex);
      }
    }
    const litGroup = litWhisperRef.current ? groupsRef.current[litWhisperRef.current] : null;
    if (litGroup && glowLightRef.current) {
      glowLightRef.current.position.copy(litGroup.position);
    }
  });

  return (
    <group name="CosmicWhispersGroup">
      <pointLight ref={glowLightRef} intensity={0} distance={7} decay={2} />
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

            {/* 5. Holograma Flutuante de Proximidade */}
            {isNearby && (
              <Html
                position={[0, 1.4, 0]}
                center
                distanceFactor={18}
                style={{ pointerEvents: 'auto' }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playClick();
                    onInspectWhisper(whisper);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-cyan-500/60 shadow-xl shadow-cyan-500/20 text-center cursor-pointer transition transform hover:scale-105 select-none min-w-[140px]"
                >
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>TRANSMISSÃO</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate max-w-[160px]">
                    {whisper.author}
                  </div>
                  <div className="text-[9px] font-mono text-cyan-300/80 mt-0.5 flex items-center justify-center gap-1">
                    <kbd className="px-1 py-0.2 bg-cyan-950/80 rounded border border-cyan-500/40 text-[8px] text-cyan-200">
                      E
                    </kbd>
                    <span>ou clique para ouvir</span>
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
