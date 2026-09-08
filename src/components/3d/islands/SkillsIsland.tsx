import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SkillsIsland: React.FC = () => {
  const fan1Ref = useRef<THREE.Group>(null);
  const fan2Ref = useRef<THREE.Group>(null);
  const fan3Ref = useRef<THREE.Group>(null);
  const coolerRingRef = useRef<THREE.Mesh>(null);
  const holoChipRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Spin GPU cooling fans
    if (fan1Ref.current) fan1Ref.current.rotation.z += delta * 12;
    if (fan2Ref.current) fan2Ref.current.rotation.z += delta * 12;
    if (fan3Ref.current) fan3Ref.current.rotation.z += delta * 12;

    // Pulse AIO cooler light
    if (coolerRingRef.current) {
      coolerRingRef.current.rotation.z += delta * 2;
    }

    // Floating central silicon holographic chip
    if (holoChipRef.current) {
      holoChipRef.current.rotation.y += delta * 0.8;
      holoChipRef.current.position.y = 2.4 + Math.sin(Date.now() * 0.0025) * 0.15;
    }
  });

  // Pre-generate smooth 3D curves for the overflowing cables falling down into space
  const cableCurves = useMemo(() => {
    return [
      // Cable 1: Neon Cyan 24-pin ribbon draping over right side and falling down
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.2, 0.4, -0.6),
          new THREE.Vector3(2.6, 0.5, -0.4),
          new THREE.Vector3(3.8, 0.2, -0.2),
          new THREE.Vector3(4.2, -1.2, 0.1),
          new THREE.Vector3(4.0, -3.2, 0.3),
          new THREE.Vector3(4.4, -5.0, 0.6),
        ]),
        color: '#06b6d4',
        radius: 0.1,
      },
      // Cable 2: Hot Magenta PCIe 8-pin sleeve looping over front lip
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.4, 0.6, 1.2),
          new THREE.Vector3(0.6, 0.65, 2.2),
          new THREE.Vector3(1.4, 0.3, 3.2),
          new THREE.Vector3(1.8, -1.5, 3.8),
          new THREE.Vector3(1.6, -3.8, 4.0),
          new THREE.Vector3(2.0, -5.6, 4.2),
        ]),
        color: '#ec4899',
        radius: 0.09,
      },
      // Cable 3: Electric Purple braided coolant / modular power cable
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.8, 0.5, 0.2),
          new THREE.Vector3(-2.8, 0.45, 0.8),
          new THREE.Vector3(-3.9, 0.1, 1.2),
          new THREE.Vector3(-4.4, -1.6, 1.4),
          new THREE.Vector3(-4.2, -3.8, 1.2),
          new THREE.Vector3(-4.5, -5.4, 1.5),
        ]),
        color: '#a855f7',
        radius: 0.11,
      },
      // Cable 4: Lime Green high-speed data bus hanging off rear left corner
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.2, 0.4, -1.6),
          new THREE.Vector3(-2.2, 0.5, -2.4),
          new THREE.Vector3(-3.2, 0.1, -3.0),
          new THREE.Vector3(-3.5, -1.8, -3.3),
          new THREE.Vector3(-3.3, -4.0, -3.1),
        ]),
        color: '#22c55e',
        radius: 0.08,
      },
      // Cable 5: Golden Braided Yellow cable spilling out of front right corner
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.8, 0.5, 1.0),
          new THREE.Vector3(2.9, 0.4, 1.9),
          new THREE.Vector3(3.6, -0.2, 2.5),
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
          BASE PLATFORM & ASTEROID SUPPORT
         ========================================================= */}
      <mesh position={[0, -2.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[5.8, 2.0, 3.2, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.4} flatShading />
      </mesh>

      {/* =========================================================
          GABINETE DEITADO (HORIZONTAL OPEN PC CASE TOWER)
         ========================================================= */}
      {/* Main Chassis Metal Tub */}
      <group position={[0, 0, 0]}>
        {/* Bottom Chassis Tray */}
        <mesh position={[0, -0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.6, 6.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Chassis Raised Perimeter Rim Walls (Anodized Dark Gray Aluminum) */}
        {/* Back Wall */}
        <mesh position={[0, 0.2, -3.0]} castShadow>
          <boxGeometry args={[7.4, 0.6, 0.25]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Front Wall with Cutout */}
        <mesh position={[0, 0.15, 3.0]} castShadow>
          <boxGeometry args={[7.4, 0.5, 0.25]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* Left Wall (I/O Shield side) */}
        <mesh position={[-3.6, 0.2, 0]} castShadow>
          <boxGeometry args={[0.25, 0.6, 6.2]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Right Wall */}
        <mesh position={[3.6, 0.15, 0]} castShadow>
          <boxGeometry args={[0.25, 0.5, 6.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Tempered Glass Panel (Propped up open diagonally) */}
        <mesh position={[0, 1.4, -0.3]} rotation={[-0.45, 0, 0]}>
          <boxGeometry args={[7.2, 0.08, 5.8]} />
          <meshPhysicalMaterial
            color="#38bdf8"
            transparent
            opacity={0.25}
            roughness={0.1}
            metalness={0.1}
            transmission={0.85}
            ior={1.5}
          />
        </mesh>
        {/* 4 Golden Knurled Thumb-Screws on Glass corners */}
        {[
          [-3.3, 2.5, -2.4],
          [3.3, 2.5, -2.4],
          [-3.3, 0.3, 1.8],
          [3.3, 0.3, 1.8],
        ].map(([sx, sy, sz], idx) => (
          <mesh key={idx} position={[sx, sy, sz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.12, 10]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* =========================================================
            MOTHERBOARD PCB (DARK MATTE WITH GOLD TRACES)
           ========================================================= */}
        <mesh position={[-0.2, 0.05, -0.2]} receiveShadow>
          <boxGeometry args={[6.2, 0.1, 5.0]} />
          <meshStandardMaterial color="#064e3b" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* Golden PCB Circuit Tracks */}
        {[
          [-1.5, 0.11, -0.5, 2.0, 0.04],
          [-1.2, 0.11, 0.3, 1.6, 0.04],
          [0.8, 0.11, -1.2, 1.8, 0.04],
          [1.5, 0.11, 0.8, 2.2, 0.04],
        ].map(([tx, ty, tz, len, wid], idx) => (
          <mesh key={idx} position={[tx, ty, tz]}>
            <planeGeometry args={[len, wid]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        ))}

        {/* =========================================================
            CPU & ALL-IN-ONE (AIO) LIQUID COOLER WATERBLOCK
           ========================================================= */}
        <group position={[-1.2, 0.15, -0.8]}>
          {/* CPU Socket Bracket */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[1.5, 0.12, 1.5]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* Cylindrical AIO Waterblock */}
          <mesh position={[0, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.5, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.2} />
          </mesh>

          {/* Infinity Mirror RGB Top Ring */}
          <mesh ref={coolerRingRef} position={[0, 0.62, 0]}>
            <ringGeometry args={[0.3, 0.6, 24]} />
            <meshBasicMaterial color="#c084fc" side={THREE.DoubleSide} />
          </mesh>

          {/* Braided Coolant Hoses running to radiator */}
          <mesh position={[0.7, 0.45, -0.6]} rotation={[0.3, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.8} />
          </mesh>
          <mesh position={[0.7, 0.35, -0.8]} rotation={[0.2, 0.9, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.8} />
          </mesh>
        </group>

        {/* =========================================================
            DDR5 RGB MEMORY MODULES (4 RAM STICKS)
           ========================================================= */}
        <group position={[-0.1, 0.15, -0.8]}>
          {[-0.3, -0.1, 0.1, 0.3].map((rx, idx) => {
            const colors = ['#ec4899', '#a855f7', '#06b6d4', '#10b981'];
            return (
              <group key={idx} position={[rx, 0, 0]}>
                {/* Black Heatsink */}
                <mesh position={[0, 0.35, 0]} castShadow>
                  <boxGeometry args={[0.08, 0.65, 1.4]} />
                  <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Frosted Acrylic RGB Top Diffuser Bar */}
                <mesh position={[0, 0.7, 0]}>
                  <boxGeometry args={[0.09, 0.1, 1.4]} />
                  <meshBasicMaterial color={colors[idx]} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* =========================================================
            GRAPHICS CARD (MONSTROUS TRIPLE-FAN RTX GPU)
           ========================================================= */}
        <group position={[-0.4, 0.5, 1.2]}>
          {/* Main Heatsink Shroud (Brushed Gunmetal) */}
          <mesh castShadow>
            <boxGeometry args={[4.4, 0.8, 1.7]} />
            <meshStandardMaterial color="#27272a" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Top RGB Lightstrip */}
          <mesh position={[0, 0.41, 0.4]}>
            <boxGeometry args={[3.8, 0.05, 0.1]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          {/* PCIe Golden Finger Riser at bottom */}
          <mesh position={[0, -0.45, 0]}>
            <boxGeometry args={[2.8, 0.12, 0.1]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} />
          </mesh>

          {/* 3 Cooling Fans */}
          <group position={[-1.3, 0.42, 0]}>
            <group ref={fan1Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" roughness={0.3} />
              </mesh>
              {/* Fan Blades */}
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" />
                </mesh>
              ))}
            </group>
          </group>

          <group position={[0, 0.42, 0]}>
            <group ref={fan2Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" />
                </mesh>
              ))}
            </group>
          </group>

          <group position={[1.3, 0.42, 0]}>
            <group ref={fan3Ref} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <circleGeometry args={[0.55, 12]} />
                <meshStandardMaterial color="#09090b" />
              </mesh>
              {[0, 1, 2, 3, 4, 5].map((b) => (
                <mesh key={b} rotation={[0, 0, (b * Math.PI) / 3]}>
                  <boxGeometry args={[0.5, 0.1, 0.02]} />
                  <meshStandardMaterial color="#18181b" />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        {/* =========================================================
            POWER SUPPLY UNIT (PSU) WITH MODULAR CONNECTORS
           ========================================================= */}
        <group position={[2.2, 0.45, -1.7]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 1.1, 1.8]} />
            <meshStandardMaterial color="#09090b" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* Honeycomb fan exhaust grill */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.02, 16]} />
            <meshStandardMaterial color="#3f3f46" metalness={0.9} />
          </mesh>
          {/* Yellow Warning Label */}
          <mesh position={[-0.91, 0.2, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.8, 0.4]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        </group>

        {/* M.2 High-Speed NVMe SSD with Heatsink */}
        <group position={[-1.4, 0.16, 0.1]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.4]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.4, 0.06, 0]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
        </group>
      </group>

      {/* =========================================================
          OS CABOS CAINDO (OVERFLOWING CABLES FALLING INTO SPACE)
         ========================================================= */}
      {cableCurves.map((item, idx) => (
        <group key={idx}>
          <mesh castShadow>
            <tubeGeometry args={[item.curve, 48, item.radius, 8, false]} />
            <meshStandardMaterial
              color={item.color}
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
          {/* Connector plug at cable terminal */}
          <mesh position={item.curve.getPoint(1)}>
            <boxGeometry args={[0.22, 0.35, 0.22]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* =========================================================
          HOLOGRAPHIC SILICON CHIP HOVERING IN ZERO-G
         ========================================================= */}
      <group ref={holoChipRef} position={[0, 2.4, 0]}>
        {/* Center Golden Core Chip */}
        <mesh castShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Outer Orbiting Golden Circuit Wireframe Ring */}
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <octahedronGeometry args={[1.4, 0]} />
          <meshBasicMaterial color="#ec4899" wireframe />
        </mesh>
      </group>

      {/* Dynamic Cyberpunk Lighting */}
      <pointLight position={[-0.5, 1.8, 0.8]} color="#06b6d4" intensity={2.8} distance={12} />
      <pointLight position={[1.5, 1.5, -1.0]} color="#ec4899" intensity={2.5} distance={12} />
    </group>
  );
};
