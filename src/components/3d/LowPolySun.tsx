import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';

interface LowPolySunProps {
  graphicsQuality?: GraphicsQuality;
}

export const LowPolySun: React.FC<LowPolySunProps> = ({ graphicsQuality = 'mid' }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const mantleRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Smooth, solid low-poly rotations on independent axes - NO resizing or pulsating!
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.22;
      coreRef.current.rotation.x += delta * 0.08;
    }

    if (mantleRef.current) {
      mantleRef.current.rotation.y -= delta * 0.32;
      mantleRef.current.rotation.z += delta * 0.16;
    }

    if (coronaRef.current) {
      coronaRef.current.rotation.y += delta * 0.14;
      coronaRef.current.rotation.z -= delta * 0.18;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. LOW-POLY INCANDESCENT SOLAR CORE
          Faceted polygonal dodecahedron (12 pentagonal faces) glowing with intense heat
         ========================================================================= */}
      <mesh ref={coreRef} castShadow={graphicsQuality !== 'low'}>
        <dodecahedronGeometry args={[4.4, 0]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#ff5500"
          emissiveIntensity={1.8}
          roughness={0.7}
          metalness={0.05}
          flatShading
        />
      </mesh>

      {/* =========================================================================
          2. CONVECTIVE MAGMA MANTLE (Fiery Volcanic Shell)
          Faceted icosahedron counter-rotating for smooth low-poly plasma depth
         ========================================================================= */}
      <mesh ref={mantleRef}>
        <icosahedronGeometry args={[4.85, 0]} />
        <meshStandardMaterial
          color="#ff3b00"
          emissive="#ff2200"
          emissiveIntensity={1.3}
          roughness={0.8}
          metalness={0.05}
          flatShading
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* =========================================================================
          3. OUTER GEOMETRIC CORONA SHELL
          Faceted dodecahedral halo providing atmospheric depth and heat shimmer
         ========================================================================= */}
      <group ref={coronaRef}>
        <mesh>
          <dodecahedronGeometry args={[5.5, 0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f97316"
            emissiveIntensity={0.9}
            roughness={0.85}
            metalness={0.05}
            flatShading
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* =========================================================================
          4. DUAL-STAGE INCANDESCENT HEAT ILLUMINATION
          High-intensity solar illumination casting warm light across the galaxy
         ========================================================================= */}
      {/* Primary Solar Illuminator (Bright Golden Sunlight) */}
      <pointLight
        color="#fef08a"
        intensity={graphicsQuality === 'low' ? 6.0 : 7.5}
        distance={220}
        decay={1.2}
      />
      {/* Secondary Volcanic Heat Wash (Deep Incandescent Crimson Atmosphere) */}
      {graphicsQuality !== 'low' && (
        <pointLight
          color="#ff3300"
          intensity={4.5}
          distance={65}
          decay={1.4}
        />
      )}
    </group>
  );
};
