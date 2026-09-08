import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SkillsIsland: React.FC = () => {
  const fan1Ref = useRef<THREE.Group>(null);
  const fan2Ref = useRef<THREE.Group>(null);
  const fan3Ref = useRef<THREE.Group>(null);
  const holoChipRef = useRef<THREE.Group>(null);
  const coolerRingRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    // Spin cooling fans
    if (fan1Ref.current) fan1Ref.current.rotation.z += delta * 12;
    if (fan2Ref.current) fan2Ref.current.rotation.z += delta * 12;
    if (fan3Ref.current) fan3Ref.current.rotation.z += delta * 12;

    // Hover holographic CPU core
    if (holoChipRef.current) {
      holoChipRef.current.rotation.y += delta * 0.8;
      holoChipRef.current.rotation.x += delta * 0.4;
      holoChipRef.current.position.y = 2.4 + Math.sin(Date.now() * 0.003) * 0.2;
    }

    // Pulse AIO cooler ring
    if (coolerRingRef.current) {
      coolerRingRef.current.rotation.z -= delta * 1.5;
    }
  });

  // Overflowing power cables
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
          BASE PLATFORM & ASTEROID SUPPORT TOY MINIATURE
         ========================================================= */}
      <mesh position={[0, -2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 2.0, 3.2, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.88} metalness={0.05} flatShading />
      </mesh>

      {/* =========================================================
          GABINETE HORIZONTAL TOY MINIATURE
         ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Bottom Chassis Tray with Toy Bevel Rim */}
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.6, 6.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Chassis Raised Perimeter Rim Walls */}
        <mesh position={[0, 0.2, -3.0]} castShadow>
          <boxGeometry args={[7.4, 0.6, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.15, 3.0]} castShadow>
          <boxGeometry args={[7.4, 0.5, 0.25]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[-3.6, 0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 6.2]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh position={[3.6, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.5, 6.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Toy Translucent Canopy Panel */}
        <mesh position={[0, 1.4, -0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[7.2, 0.08, 5.8]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.4}
            roughness={0.85}
            metalness={0.05}
          />
        </mesh>

        {/* Thumb-Screws on corners */}
        {[
          [-3.3, 2.5, -2.4],
          [3.3, 2.5, -2.4],
          [-3.3, 0.3, 1.8],
          [3.3, 0.3, 1.8],
        ].map(([sx, sy, sz], idx) => (
          <mesh key={idx} position={[sx, sy, sz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.12, 10]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}

        {/* =========================================================
            MOTHERBOARD PCB
           ========================================================= */}
        <mesh position={[-0.2, 0.05, -0.2]} receiveShadow>
          <boxGeometry args={[6.2, 0.1, 5.0]} />
          <meshStandardMaterial color="#065f46" roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Golden PCB Circuit Tracks (Horizontal) */}
        {[
          [-1.5, 0.11, -0.5, 2.0, 0.04],
          [-1.2, 0.11, 0.3, 1.6, 0.04],
          [0.8, 0.11, -1.2, 1.8, 0.04],
          [1.5, 0.11, 0.8, 2.2, 0.04],
        ].map(([tx, ty, tz, len, wid], idx) => (
          <mesh key={idx} position={[tx, ty, tz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[len, wid]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.85} metalness={0.05} />
          </mesh>
        ))}

        {/* =========================================================
            CPU & WATERBLOCK TOY MINIATURE
           ========================================================= */}
        <group position={[-1.2, 0.15, -0.8]}>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.5, 0.12, 1.5]} />
            <meshStandardMaterial color="#475569" roughness={0.85} metalness={0.05} />
          </mesh>

          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.5, 24]} />
            <meshStandardMaterial color="#0f172a" roughness={0.85} metalness={0.05} />
          </mesh>

          <mesh ref={coolerRingRef} position={[0, 0.62, 0]}>
            <ringGeometry args={[0.3, 0.6, 24]} />
            <meshStandardMaterial color="#c084fc" roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
          </mesh>

          <mesh position={[0.7, 0.45, -0.6]} rotation={[0.3, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0.7, 0.35, -0.8]} rotation={[0.2, 0.9, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* =========================================================
            RAM MODULES (4 TOY BLOCKS)
           ========================================================= */}
        <group position={[-0.1, 0.15, -0.8]}>
          {[-0.3, -0.1, 0.1, 0.3].map((rx, idx) => {
            const colors = ['#ec4899', '#a855f7', '#06b6d4', '#10b981'];
            return (
              <group key={idx} position={[rx, 0, 0]}>
                <mesh position={[0, 0.35, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.65, 1.4]} />
                  <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.05} />
                </mesh>
                <mesh position={[0, 0.7, 0]}>
                  <boxGeometry args={[0.09, 0.1, 1.4]} />
                  <meshStandardMaterial color={colors[idx]} roughness={0.85} metalness={0.05} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* =========================================================
            GPU TOY MINIATURE
           ========================================================= */}
        <group position={[-0.4, 0.5, 1.2]}>
          <mesh castShadow>
            <boxGeometry args={[4.4, 0.8, 1.7]} />
            <meshStandardMaterial color="#27272a" roughness={0.85} metalness={0.05} />
          </mesh>

          <mesh position={[0, 0.41, 0.4]}>
            <boxGeometry args={[3.8, 0.05, 0.1]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.85} metalness={0.05} />
          </mesh>

          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[2.8, 0.12, 0.1]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.85} metalness={0.05} />
          </mesh>

          {/* 3 Toy Fans */}
          <group position={[-1.3, 0.42, 0]}>
            <group ref={fan1Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.05} />
                </mesh>
              ))}
            </group>
          </group>

          <group position={[0, 0.42, 0]}>
            <group ref={fan2Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.05} />
                </mesh>
              ))}
            </group>
          </group>

          <group position={[1.3, 0.42, 0]}>
            <group ref={fan3Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" roughness={0.85} metalness={0.05} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* PSU */}
        <group position={[2.2, 0.45, -1.7]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 1.1, 1.8]} />
            <meshStandardMaterial color="#09090b" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.02, 16]} />
            <meshStandardMaterial color="#3f3f46" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[-0.91, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.8, 0.4]} />
            <meshStandardMaterial color="#eab308" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>

        {/* NVMe SSD */}
        <group position={[-1.4, 0.16, 0.1]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.4]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.85} metalness={0.05} />
          </mesh>
          <mesh position={[0.4, 0.06, 0]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#ef4444" roughness={0.85} metalness={0.02} />
          </mesh>
        </group>
      </group>

      {/* CABLES */}
      {cableCurves.map((item, idx) => (
        <group key={idx}>
          <mesh castShadow>
            <tubeGeometry args={[item.curve, 48, item.radius, 8, false]} />
            <meshStandardMaterial
              color={item.color}
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
          <mesh position={item.curve.getPoint(1)}>
            <boxGeometry args={[0.22, 0.35, 0.22]} />
            <meshStandardMaterial color="#fbbf24" roughness={0.85} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* HOLOGRAPHIC CHIP */}
      <group ref={holoChipRef} position={[0, 2.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <octahedronGeometry args={[1.4, 0]} />
          <meshStandardMaterial color="#ec4899" roughness={0.85} metalness={0.05} wireframe />
        </mesh>
      </group>

      <pointLight position={[-0.5, 1.8, 0.8]} color="#06b6d4" intensity={2.2} distance={12} />
      <pointLight position={[1.5, 1.5, -1.0]} color="#ec4899" intensity={2.0} distance={12} />
    </group>
  );
};
