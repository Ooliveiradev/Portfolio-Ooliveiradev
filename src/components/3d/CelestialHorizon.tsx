import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';

interface CelestialHorizonProps {
  graphicsQuality?: GraphicsQuality;
  sharedVehiclePos?: React.MutableRefObject<THREE.Vector3>;
}

export const CelestialHorizon: React.FC<CelestialHorizonProps> = ({
  graphicsQuality = 'mid',
  sharedVehiclePos,
}) => {
  // Parallax container tracking the vehicle so horizon feels infinitely deep
  const containerRef = useRef<THREE.Group>(null);

  // References for continuous atmospheric rotations
  const blackHoleGroupRef = useRef<THREE.Group>(null);
  const accretionDiskRef = useRef<THREE.Group>(null);
  const lensingRing1Ref = useRef<THREE.Mesh>(null);
  const lensingRing2Ref = useRef<THREE.Mesh>(null);
  const polarJetsRef = useRef<THREE.Group>(null);
  const orbitingDustRef = useRef<THREE.Group>(null);

  // Orbiting accretion plasma motes for smooth low-poly life (subtle & dark)
  const dustCount = graphicsQuality === 'low' ? 20 : graphicsQuality === 'high' ? 56 : 36;
  const dustParticles = useMemo(() => {
    return Array.from({ length: dustCount }, (_, i) => {
      const angle = (i / dustCount) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 34 + Math.random() * 55;
      const speed = (0.16 + Math.random() * 0.2) * (45 / radius);
      const scale = 0.5 + Math.random() * 0.8;
      const yOffset = (Math.random() - 0.5) * 2.0;
      return { angle, radius, speed, scale, yOffset };
    });
  }, [dustCount]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // 1. Cosmic Parallax Follow (88% follow keeps it on the infinite horizon)
    if (containerRef.current && sharedVehiclePos) {
      const vx = sharedVehiclePos.current.x;
      const vz = sharedVehiclePos.current.z;
      containerRef.current.position.set(vx * 0.88, 0, vz * 0.88);
    }

    // 2. Smooth Low-Poly Rotations
    if (accretionDiskRef.current) {
      accretionDiskRef.current.rotation.z += dt * 0.08;
    }
    if (lensingRing1Ref.current) {
      lensingRing1Ref.current.rotation.z -= dt * 0.035;
    }
    if (lensingRing2Ref.current) {
      lensingRing2Ref.current.rotation.z += dt * 0.025;
    }
    if (polarJetsRef.current) {
      polarJetsRef.current.rotation.y += dt * 0.05;
    }

    // 3. Orbiting Accretion Plasma Motes
    if (orbitingDustRef.current) {
      orbitingDustRef.current.children.forEach((child, i) => {
        const p = dustParticles[i];
        if (!p) return;
        p.angle += dt * p.speed;
        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;
        child.position.set(x, y, p.yOffset);
        child.rotation.x += dt * 0.6;
        child.rotation.y += dt * 0.8;
      });
    }
  });

  return (
    <group ref={containerRef}>
      {/* =========================================================
          THE VOID SINGULARITY — SMOOTH LOW-POLY DARK BLACK HOLE
          Darkened, subdued contrast, harmonized with cosmos
          Deep in the abyss below the solar system (Y: -54)
         ========================================================= */}
      <group
        ref={blackHoleGroupRef}
        position={[-70, -54, -135]}
        rotation={[0.58, -0.32, 0.18]}
      >
        {/* Core Event Horizon: Smooth absolute black void */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[26, 32, 32]} />
          <meshBasicMaterial color="#000000" fog={false} />
        </mesh>

        {/* Shadow Boundary Collar (Dark vacuum rim) */}
        <mesh position={[0, 0, 0]}>
          <ringGeometry args={[26.05, 28.2, 64]} />
          <meshBasicMaterial
            color="#020408"
            transparent
            opacity={0.98}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>

        {/* Relativistic Polar Plasma Jets (Very soft, whisper-thin cosmic beams) */}
        <group ref={polarJetsRef}>
          {/* North Jet */}
          <mesh position={[0, 95, 0]}>
            <cylinderGeometry args={[0.4, 5.0, 170, 16, 1, true]} />
            <meshBasicMaterial
              color="#0284c7"
              transparent
              opacity={0.10}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          {/* South Jet */}
          <mesh position={[0, -95, 0]}>
            <cylinderGeometry args={[5.0, 0.4, 170, 16, 1, true]} />
            <meshBasicMaterial
              color="#0284c7"
              transparent
              opacity={0.10}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Multi-Tiered Subdued Smooth Accretion Disk */}
        <group ref={accretionDiskRef} rotation={[-Math.PI / 2, 0, 0]}>
          {/* Tier 1: Inner Warm Amber Core (#f59e0b) - Toned down from bright white-gold */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[29.0, 42.0, 64]} />
            <meshBasicMaterial
              color="#f59e0b"
              transparent
              opacity={0.52}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Tier 2: Deep Solar Amber (#d97706) */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[41.0, 60.0, 64]} />
            <meshBasicMaterial
              color="#d97706"
              transparent
              opacity={0.40}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Tier 3: Burnt Orange Stellar Flare (#ea580c) */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[59.0, 80.0, 64]} />
            <meshBasicMaterial
              color="#ea580c"
              transparent
              opacity={0.28}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Tier 4: Cosmic Slate Indigo Fringe (#4f46e5) */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[78.0, 100.0, 64]} />
            <meshBasicMaterial
              color="#4f46e5"
              transparent
              opacity={0.18}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Tier 5: Outer Celestial Cyan Veil (#0284c7) */}
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[98.0, 122.0, 64]} />
            <meshBasicMaterial
              color="#0284c7"
              transparent
              opacity={0.09}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Orbiting Plasma Motes (Very subtle, soft floating embers) */}
          <group ref={orbitingDustRef}>
            {dustParticles.map((p, i) => (
              <mesh
                key={i}
                position={[
                  Math.cos(p.angle) * p.radius,
                  Math.sin(p.angle) * p.radius,
                  p.yOffset,
                ]}
                scale={[p.scale, p.scale, p.scale]}
              >
                <octahedronGeometry args={[0.8, 0]} />
                <meshBasicMaterial
                  color={i % 3 === 0 ? '#f59e0b' : i % 3 === 1 ? '#d97706' : '#ea580c'}
                  transparent
                  opacity={0.35}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        </group>

        {/* Double Vertical Gravitational Lensing Arcs (Soft and moody) */}
        {/* Main Arch */}
        <mesh
          ref={lensingRing1Ref}
          position={[0, 0, 0]}
          rotation={[0.22, 0.32, 0]}
        >
          <ringGeometry args={[28.5, 36.5, 64]} />
          <meshBasicMaterial
            color="#d97706"
            transparent
            opacity={0.34}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Secondary Soft Ambient Arch */}
        <mesh
          ref={lensingRing2Ref}
          position={[0, 0, 0]}
          rotation={[0.16, 0.45, 0.1]}
        >
          <ringGeometry args={[36.0, 44.0, 64]} />
          <meshBasicMaterial
            color="#b45309"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Soft, discreet amber ambient glow */}
        {graphicsQuality !== 'low' && (
          <pointLight
            position={[0, 0, 0]}
            color="#d97706"
            intensity={0.6}
            distance={110}
          />
        )}
      </group>
    </group>
  );
};
