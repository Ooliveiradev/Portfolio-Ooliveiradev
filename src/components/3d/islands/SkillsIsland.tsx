import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sounds } from '../../../audio/soundManager';
import { StaticInstances } from '../StaticInstances';

const CONTACT_TEETH_POSITIONS = [-0.04, 0.04].map((x) =>
  Array.from({ length: 24 }, (_, i): [number, number, number] => [x, 0, -2.2 + i * 0.19])
);

interface SkillsIslandProps {
  isNear?: boolean;
}

const HeatsinkFinsMesh: React.FC<{ fins: { x: number; y: number; height: number; depth: number }[] }> = ({ fins }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    const tempMatrix = new THREE.Matrix4();
    const tempPos = new THREE.Vector3();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();

    fins.forEach((fin, idx) => {
      tempPos.set(fin.x, fin.y, 0);
      tempScale.set(0.07, fin.height, fin.depth);
      tempMatrix.compose(tempPos, tempQuat, tempScale);
      meshRef.current!.setMatrixAt(idx, tempMatrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [fins]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, fins.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#1e293b"
        metalness={0.88}
        roughness={0.25}
      />
    </instancedMesh>
  );
};

const SkillsIslandComponent: React.FC<SkillsIslandProps> = () => {
  // Discrete state for click reactivity (Updated only on click/timeout, NEVER in useFrame)
  const [gpuBoosted, setGpuBoosted] = useState(false);
  const [waterblockPulse, setWaterblockPulse] = useState(0);
  const [quantumBurst, setQuantumBurst] = useState(0);

  // =========================================================
  // REFS & INTERACTIVE STATES (Zero React Re-renders in 60FPS loop)
  // =========================================================
  const fan1Ref = useRef<THREE.Group>(null);
  const fan2Ref = useRef<THREE.Group>(null);
  const fan3Ref = useRef<THREE.Group>(null);
  const radFan1Ref = useRef<THREE.Group>(null);
  const radFan2Ref = useRef<THREE.Group>(null);

  // Holographic Quantum Processor
  const quantumCoreRef = useRef<THREE.Mesh>(null);
  const quantumGimbal1Ref = useRef<THREE.Group>(null);
  const quantumGimbal2Ref = useRef<THREE.Group>(null);
  const quantumShockwaveRef = useRef<THREE.Mesh>(null);

  // Infinite Mirror Waterblock
  const coolerRing1Ref = useRef<THREE.Mesh>(null);
  const coolerRing2Ref = useRef<THREE.Mesh>(null);
  const coolerRing3Ref = useRef<THREE.Mesh>(null);

  // NVMe Activity
  const nvmeLedRef = useRef<THREE.Mesh>(null);

  // Interactive timer refs
  const gpuBoostedRef = useRef(false);
  const gpuSpeedRef = useRef(12);
  const waterblockPulseRef = useRef(0);
  const quantumBurstRef = useRef(0);
  const nvmeBenchmarkRef = useRef(0);

  // =========================================================
  // ANIMATION LOOP (60FPS)
  // =========================================================
  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;

    // 1. GPU Triple-Fan Rotation with dynamic boost acceleration
    const targetSpeed = gpuBoostedRef.current ? 52 : 12;
    gpuSpeedRef.current = THREE.MathUtils.lerp(gpuSpeedRef.current, targetSpeed, delta * 3.5);

    if (fan1Ref.current) fan1Ref.current.rotation.z += delta * gpuSpeedRef.current;
    if (fan2Ref.current) fan2Ref.current.rotation.z += delta * gpuSpeedRef.current;
    if (fan3Ref.current) fan3Ref.current.rotation.z += delta * gpuSpeedRef.current;

    // 2. Radiator Exhaust Fans
    if (radFan1Ref.current) radFan1Ref.current.rotation.z += delta * 15;
    if (radFan2Ref.current) radFan2Ref.current.rotation.z += delta * 15;

    // 3. Levitation & Gyroscopic Quantum Core
    if (quantumCoreRef.current) {
      quantumCoreRef.current.rotation.y += delta * 1.6;
      quantumCoreRef.current.rotation.x += delta * 0.8;
      quantumCoreRef.current.position.y = 0.85 + Math.sin(time * 3.0) * 0.08;
    }
    if (quantumGimbal1Ref.current) {
      quantumGimbal1Ref.current.rotation.z += delta * 1.2;
      quantumGimbal1Ref.current.rotation.y += delta * 0.6;
    }
    if (quantumGimbal2Ref.current) {
      quantumGimbal2Ref.current.rotation.x -= delta * 1.4;
      quantumGimbal2Ref.current.rotation.z -= delta * 0.7;
    }

    // Expanding holographic shockwave ring decay
    if (quantumShockwaveRef.current) {
      if (quantumBurstRef.current > 0) {
        const progress = 1 - quantumBurstRef.current;
        const scale = 0.4 + progress * 2.8;
        quantumShockwaveRef.current.scale.set(scale, scale, scale);
        const mat = quantumShockwaveRef.current.material as THREE.MeshStandardMaterial;
        mat.opacity = quantumBurstRef.current * 0.85;
      } else {
        quantumShockwaveRef.current.scale.set(0.001, 0.001, 0.001);
      }
    }

    // 4. Infinite Mirror Waterblock rotation & pulse
    if (coolerRing1Ref.current) coolerRing1Ref.current.rotation.z -= delta * 1.5;
    if (coolerRing2Ref.current) coolerRing2Ref.current.rotation.z += delta * 2.2;
    if (coolerRing3Ref.current) coolerRing3Ref.current.rotation.z -= delta * 3.0;

    // Decay interactive timers directly in refs (zero React re-renders)
    if (waterblockPulseRef.current > 0) {
      waterblockPulseRef.current = Math.max(0, waterblockPulseRef.current - delta * 1.8);
    }
    if (quantumBurstRef.current > 0) {
      quantumBurstRef.current = Math.max(0, quantumBurstRef.current - delta * 1.4);
    }
    if (nvmeBenchmarkRef.current > 0) {
      nvmeBenchmarkRef.current = Math.max(0, nvmeBenchmarkRef.current - delta * 2.2);
      if (nvmeLedRef.current) {
        const mat = nvmeLedRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = Math.sin(time * 35) > 0 ? 3.5 : 0.2;
      }
    } else if (nvmeLedRef.current) {
      const mat = nvmeLedRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(time * 4) * 0.6;
    }
  });

  // =========================================================
  // PROCEDURAL GEOMETRIES: WATERCOOLING TUBES & CABLES
  // =========================================================
  const hardTubeCurves = useMemo(() => {
    return [
      // Loop 1: Waterblock CPU to 360mm Radiator (Cyan Coolant)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.65, 0.48, -0.65),
          new THREE.Vector3(0.65, 0.95, -0.65),
          new THREE.Vector3(0.65, 0.95, -2.3),
          new THREE.Vector3(0.3, 0.85, -2.6),
        ]),
        color: '#06b6d4',
        radius: 0.065,
      },
      // Loop 2: Radiator to Reservoir (Violet Coolant)
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.3, 0.85, -2.6),
          new THREE.Vector3(-0.65, 0.95, -2.3),
          new THREE.Vector3(-0.65, 0.95, -1.8),
          new THREE.Vector3(1.8, 0.95, -1.8),
          new THREE.Vector3(2.1, 0.9, -1.8),
        ]),
        color: '#a855f7',
        radius: 0.065,
      },
      // Loop 3: Reservoir into Deep Thermal Keel & back to Waterblock
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.1, 0.25, -1.8),
          new THREE.Vector3(2.1, -0.8, -1.8),
          new THREE.Vector3(1.4, -2.2, -1.0),
          new THREE.Vector3(0.0, -3.2, 0.0),
          new THREE.Vector3(-1.2, -2.2, 0.6),
          new THREE.Vector3(0.95, -0.6, -0.5),
          new THREE.Vector3(0.95, 0.48, -0.55),
        ]),
        color: '#38bdf8',
        radius: 0.07,
      },
      // Loop 4: Deep Under-Keel Re-circulation Loop
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.2, -1.2, 0.5),
          new THREE.Vector3(-2.8, -2.5, -0.4),
          new THREE.Vector3(0.0, -3.8, -0.8),
          new THREE.Vector3(2.6, -2.6, 0.2),
          new THREE.Vector3(2.2, -1.2, 0.5),
        ]),
        color: '#c084fc',
        radius: 0.06,
      },
    ];
  }, []);

  // Sleeved High-Density Power Cables
  const powerCables = useMemo(() => {
    return [
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.4, 0.65, -0.2),
          new THREE.Vector3(-1.1, 0.85, 0.3),
          new THREE.Vector3(-0.8, 0.5, 0.9),
          new THREE.Vector3(-0.8, -0.2, 1.2),
        ]),
        color: '#ec4899',
        radius: 0.045,
      },
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.5, 0.65, -0.2),
          new THREE.Vector3(-1.2, 0.85, 0.3),
          new THREE.Vector3(-0.9, 0.5, 0.9),
          new THREE.Vector3(-0.9, -0.2, 1.2),
        ]),
        color: '#06b6d4',
        radius: 0.045,
      },
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.6, 0.65, -0.2),
          new THREE.Vector3(-1.3, 0.85, 0.3),
          new THREE.Vector3(-1.0, 0.5, 0.9),
          new THREE.Vector3(-1.0, -0.2, 1.2),
        ]),
        color: '#3b82f6',
        radius: 0.045,
      },
      // 24-Pin ATX Mainboard Cable Bundle
      {
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(2.9, 0.25, -0.4),
          new THREE.Vector3(3.25, 0.35, -0.4),
          new THREE.Vector3(3.35, -0.1, -0.4),
          new THREE.Vector3(3.1, -0.6, -0.4),
        ]),
        color: '#f59e0b',
        radius: 0.09,
      },
    ];
  }, []);

  // Precomputed TubeGeometries for watercooling loops and power cables
  const tubeGeometries = useMemo(() => {
    return hardTubeCurves.map((tube) => new THREE.TubeGeometry(tube.curve, 48, tube.radius, 10, false));
  }, [hardTubeCurves]);

  const cableGeometries = useMemo(() => {
    return powerCables.map((cable) => new THREE.TubeGeometry(cable.curve, 32, cable.radius, 8, false));
  }, [powerCables]);

  // Clean up geometries on unmount
  useEffect(() => {
    return () => {
      tubeGeometries.forEach((g) => g.dispose());
      cableGeometries.forEach((g) => g.dispose());
    };
  }, [tubeGeometries, cableGeometries]);

  // Heatsink Fin Array Parameters (22 Monolithic Fins)
  const heatsinkFins = useMemo(() => {
    const fins = [];
    const count = 22;
    const minX = -3.2;
    const maxX = 3.2;
    const step = (maxX - minX) / (count - 1);

    for (let i = 0; i < count; i++) {
      const x = minX + i * step;
      // Inverted V-taper: Center fins are significantly deeper
      const distFromCenter = Math.abs(x) / 3.2;
      const height = 1.4 + (1 - distFromCenter) * 2.5; // up to 3.9 units deep
      const depth = 5.2 - distFromCenter * 1.6; // 3.6 to 5.2 units
      const y = -0.3 - height / 2;
      fins.push({ x, y, height, depth });
    }
    return fins;
  }, []);

  // Floating Specular Silicon Wafers under Keel
  const siliconWafers = useMemo(() => {
    return [
      { pos: [-2.1, -3.2, 1.4], rot: [0.3, 0.5, -0.2], size: 0.55 },
      { pos: [2.3, -3.6, -1.2], rot: [-0.4, 0.8, 0.3], size: 0.65 },
      { pos: [-1.2, -4.1, -1.5], rot: [0.5, -0.3, 0.6], size: 0.48 },
      { pos: [1.6, -3.9, 1.5], rot: [-0.2, -0.7, -0.4], size: 0.58 },
    ];
  }, []);

  // =========================================================
  // INTERACTION HANDLERS (Zero 60FPS overhead)
  // =========================================================
  const handleGpuClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    gpuBoostedRef.current = true;
    setGpuBoosted(true);
    sounds.playGpuTurbineBoost();
    setTimeout(() => {
      gpuBoostedRef.current = false;
      setGpuBoosted(false);
    }, 2400);
  };

  const handleWaterblockClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    waterblockPulseRef.current = 1.0;
    setWaterblockPulse(1);
    sounds.playWaterblockPulse();
    setTimeout(() => {
      setWaterblockPulse(0);
    }, 1200);
  };

  const handleQuantumClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    quantumBurstRef.current = 1.0;
    setQuantumBurst(1);
    sounds.playQuantumPulse();
    setTimeout(() => {
      setQuantumBurst(0);
    }, 1500);
  };

  const handleNvmeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    nvmeBenchmarkRef.current = 1.0;
    sounds.playNvmeBenchmark();
  };

  return (
    <group>
      {/* =========================================================
          1. QUILHA INFERIOR: DISSIPADOR MONOLÍTICO DE CALOR - 1 DRAW CALL VIA INSTANCED MESH
         ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Monolithic Heatsink Parallel Vertical Fins via InstancedMesh */}
        <HeatsinkFinsMesh fins={heatsinkFins} />

        {/* Cross-Braced Copper Heatpipes piercing the fins */}
        {[-1.6, -0.5, 0.5, 1.6].map((hz, idx) => (
          <group key={idx} position={[0, -1.6, hz]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 6.8, 16]} />
              <meshStandardMaterial
                color="#b45309"
                metalness={0.92}
                roughness={0.18}
              />
            </mesh>
            {/* Heatpipe curved copper elbows terminating into motherboard */}
            <mesh position={[-3.35, 0.45, 0]} rotation={[0, 0, 0.35]}>
              <cylinderGeometry args={[0.088, 0.088, 1.0, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.92} roughness={0.18} />
            </mesh>
            <mesh position={[3.35, 0.45, 0]} rotation={[0, 0, -0.35]}>
              <cylinderGeometry args={[0.088, 0.088, 1.0, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        ))}

        {/* Gigantic PCIe Gold Contact Finger Buses along Chassis Flanks */}
        {[-3.62, 3.62].map((bx, bIdx) => (
          <group key={bIdx} position={[bx, -0.4, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.06, 0.45, 4.8]} />
              <meshStandardMaterial
                color="#fbbf24"
                emissive="#f59e0b"
                emissiveIntensity={0.35}
                metalness={0.92}
                roughness={0.15}
              />
            </mesh>
            {/* Contact Teeth Ridges */}
            <StaticInstances positions={CONTACT_TEETH_POSITIONS[bIdx]}>
              <boxGeometry args={[0.03, 0.38, 0.09]} />
              <meshStandardMaterial
                color="#fef08a"
                metalness={0.95}
                roughness={0.1}
              />
            </StaticInstances>
          </group>
        ))}

        {/* Hexagonal Honeycomb Ventilation Plates under Keel */}
        {[-1.5, 1.5].map((gx, idx) => (
          <group key={idx} position={[gx, -3.2, 0]} rotation={[0, 0, idx === 0 ? 0.25 : -0.25]}>
            <mesh>
              <boxGeometry args={[1.6, 0.08, 3.2]} />
              <meshStandardMaterial
                color="#0b0f19"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            {/* Hex Mesh Glow Core */}
            <mesh position={[0, -0.05, 0]}>
              <planeGeometry args={[1.5, 3.0]} />
              <meshStandardMaterial
                color="#a855f7"
                emissive="#9333ea"
                emissiveIntensity={1.4}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}

        {/* Floating Specular Silicon Wafers (Sub-keel Zero-G Wafers) */}
        {siliconWafers.map((waf, idx) => (
          <group
            key={idx}
            position={waf.pos as [number, number, number]}
            rotation={waf.rot as [number, number, number]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[waf.size, waf.size, 0.025, 8]} />
              <meshStandardMaterial
                color="#1e293b"
                metalness={0.98}
                roughness={0.05}
              />
            </mesh>
            {/* Iridescent Circuit Grid on Wafer */}
            <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, waf.size * 0.9, 16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#06b6d4"
                emissiveIntensity={0.65}
                metalness={0.8}
                roughness={0.2}
                wireframe
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================
          2. OPEN-AIR TEST BENCH: CHASSI & PLACA-MÃE ESMERALDA
         ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Chassis Open Bench Tray (Dark Machined Aluminum) */}
        <mesh position={[0, -0.08, -0.3]} castShadow receiveShadow>
          <boxGeometry args={[7.4, 0.18, 5.8]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.35} metalness={0.4} />
        </mesh>

        {/* Beveled Perimeter Corner Brackets with Knurled Brass Screws */}
        {[
          [-3.6, 0.05, -3.1],
          [3.6, 0.05, -3.1],
          [-3.6, 0.05, 2.5],
          [3.6, 0.05, 2.5],
        ].map(([cx, cy, cz], idx) => (
          <group key={idx} position={[cx, cy, cz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.16, 0.16, 0.22, 16]} />
              <meshStandardMaterial color="#eab308" metalness={0.85} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Emerald Green PCB Motherboard */}
        <mesh position={[0, 0.06, -0.4]} receiveShadow>
          <boxGeometry args={[6.8, 0.09, 5.2]} />
          <meshStandardMaterial
            color="#064e3b"
            roughness={0.38}
            metalness={0.15}
          />
        </mesh>

        {/* Printed Gold Circuit Traces in Relief */}
        {[
          [-1.8, 0.12, -0.8, 2.6, 0.06, 0],
          [-1.2, 0.12, 0.2, 1.8, 0.06, Math.PI / 4],
          [0.4, 0.12, -1.4, 2.2, 0.05, -Math.PI / 6],
          [1.5, 0.12, 0.6, 2.4, 0.06, Math.PI / 3],
          [-0.4, 0.12, 1.2, 3.2, 0.07, 0],
          [2.0, 0.12, -0.8, 1.6, 0.05, -Math.PI / 4],
          // Busbars leading directly towards the Foguetiponto at [0, 0.22, 3.5]
          [-0.6, 0.12, 1.8, 1.8, 0.08, Math.PI / 2],
          [0.6, 0.12, 1.8, 1.8, 0.08, Math.PI / 2],
        ].map(([tx, ty, tz, len, wid, rot], idx) => (
          <mesh
            key={idx}
            position={[tx, ty, tz]}
            rotation={[-Math.PI / 2, 0, rot]}
          >
            <planeGeometry args={[len, wid]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.45}
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
        ))}

        {/* Array of Solid-State Cylindrical Capacitors & Power Chokes */}
        {[
          [0.2, 0.2, -1.3],
          [0.4, 0.2, -1.3],
          [0.6, 0.2, -1.3],
          [0.8, 0.2, -1.3],
          [1.0, 0.2, -1.3],
          [1.4, 0.2, -1.1],
          [1.4, 0.2, -0.9],
          [1.4, 0.2, -0.7],
        ].map(([cx, cy, cz], idx) => (
          <mesh key={idx} position={[cx, cy, cz]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.16, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#94a3b8' : '#0284c7'}
              metalness={0.8}
              roughness={0.25}
            />
          </mesh>
        ))}

        {/* Rear I/O Shield on back edge */}
        <group position={[-2.4, 0.35, -2.9]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 0.55, 0.25]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* USB & LAN Ports */}
          {[-0.6, -0.2, 0.2, 0.6].map((px, idx) => (
            <mesh key={idx} position={[px, 0, -0.13]}>
              <boxGeometry args={[0.2, 0.12, 0.05]} />
              <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.3} />
            </mesh>
          ))}
          {/* Gold Audio Jacks */}
          {[-0.4, 0.0, 0.4].map((ax, idx) => (
            <mesh key={idx} position={[ax, -0.16, -0.13]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 10]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* =========================================================
          3. TRIPLE-FAN MONUMENTAL GPU (RTX 3D)
         ========================================================= */}
      <group
        position={[-1.9, 0.58, -0.2]}
        onClick={handleGpuClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Heavy GPU Shroud */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.72, 4.4]} />
          <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.3} />
        </mesh>

        {/* Brushed Metal Backplate */}
        <mesh position={[0, -0.37, 0]} receiveShadow>
          <boxGeometry args={[2.46, 0.04, 4.36]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Illuminated Side Badge "RTX 3D" */}
        <mesh position={[-1.27, 0.12, 0]}>
          <boxGeometry args={[0.04, 0.18, 1.6]} />
          <meshStandardMaterial
            color={gpuBoosted ? '#38bdf8' : '#a855f7'}
            emissive={gpuBoosted ? '#0ea5e9' : '#9333ea'}
            emissiveIntensity={gpuBoosted ? 2.8 : 1.2}
            roughness={0.2}
          />
        </mesh>

        {/* PCIe x16 Gold Bus Connector */}
        <mesh position={[0.7, -0.48, 0]}>
          <boxGeometry args={[0.08, 0.18, 3.2]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* 3 Independent Axial Fans */}
        {[-1.25, 0, 1.25].map((fz, fIdx) => {
          const fanRef = fIdx === 0 ? fan1Ref : fIdx === 1 ? fan2Ref : fan3Ref;
          return (
            <group key={fIdx} position={[0, 0.38, fz]}>
              {/* Fan Bezel Ring */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.52, 0.58, 24]} />
                <meshStandardMaterial
                  color={gpuBoosted ? '#38bdf8' : '#334155'}
                  metalness={0.7}
                  roughness={0.25}
                />
              </mesh>

              {/* Rotating Blades Assembly */}
              <group ref={fanRef} rotation={[-Math.PI / 2, 0, 0]}>
                {/* Center Motor Hub */}
                <mesh>
                  <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
                  <meshStandardMaterial color="#09090b" metalness={0.5} roughness={0.2} />
                </mesh>
                {/* 7 Aerodynamic Chamfered Blades */}
                {[0, 1, 2, 3, 4, 5, 6].map((b) => (
                  <mesh
                    key={b}
                    rotation={[0.2, 0, (b * Math.PI * 2) / 7]}
                    position={[0, 0, 0]}
                  >
                    <boxGeometry args={[0.48, 0.11, 0.02]} />
                    <meshStandardMaterial
                      color="#0f172a"
                      metalness={0.3}
                      roughness={0.4}
                    />
                  </mesh>
                ))}
              </group>
            </group>
          );
        })}
      </group>

      {/* =========================================================
          4. INFINITE MIRROR WATERBLOCK (CPU COOLER)
         ========================================================= */}
      <group
        position={[0.85, 0.35, -0.6]}
        onClick={handleWaterblockClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* LGA CPU Socket Base */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <boxGeometry args={[1.5, 0.12, 1.5]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Cylindrical CNC Aluminum Housing */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.66, 0.66, 0.45, 32]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.8} roughness={0.25} />
        </mesh>

        {/* Smoked Acrylic Tempered Mirror Face */}
        <mesh position={[0, 0.385, 0]}>
          <cylinderGeometry args={[0.62, 0.62, 0.02, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            metalness={0.9}
            roughness={0.05}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Infinite Mirror Stepped Concentric Glowing Rings */}
        <mesh ref={coolerRing1Ref} position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.56, 28]} />
          <meshStandardMaterial
            color={waterblockPulse > 0 ? '#f43f5e' : '#06b6d4'}
            emissive={waterblockPulse > 0 ? '#e11d48' : '#0891b2'}
            emissiveIntensity={waterblockPulse > 0 ? 3.0 : 1.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={coolerRing2Ref} position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.42, 28]} />
          <meshStandardMaterial
            color={waterblockPulse > 0 ? '#a855f7' : '#38bdf8'}
            emissive={waterblockPulse > 0 ? '#9333ea' : '#0284c7'}
            emissiveIntensity={waterblockPulse > 0 ? 2.6 : 1.0}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={coolerRing3Ref} position={[0, 0.20, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.26, 24]} />
          <meshStandardMaterial
            color={waterblockPulse > 0 ? '#fbbf24' : '#a855f7'}
            emissive={waterblockPulse > 0 ? '#f59e0b' : '#7e22ce'}
            emissiveIntensity={waterblockPulse > 0 ? 2.4 : 0.8}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Dual Chrome G1/4 Compression Fittings */}
        {[-0.22, 0.22].map((fx, idx) => (
          <mesh key={idx} position={[fx, 0.42, -0.15]} castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.12, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* =========================================================
          5. MÓDULOS DE MEMÓRIA RAM DDR5 COM DIFUSOR RGB
         ========================================================= */}
      <group position={[-0.2, 0.18, -0.8]}>
        {[-0.36, -0.12, 0.12, 0.36].map((rx, idx) => {
          const colors = ['#f43f5e', '#a855f7', '#06b6d4', '#10b981'];
          return (
            <group key={idx} position={[rx, 0, 0]}>
              {/* RAM Anodized Gunmetal Heat Spreader */}
              <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[0.08, 0.52, 1.45]} />
                <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.3} />
              </mesh>
              {/* Top Milky Acrylic RGB Light Diffuser Bar */}
              <mesh position={[0, 0.53, 0]}>
                <boxGeometry args={[0.085, 0.08, 1.45]} />
                <meshStandardMaterial
                  color={colors[idx]}
                  emissive={colors[idx]}
                  emissiveIntensity={1.6}
                  roughness={0.2}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* =========================================================
          6. CHIP QUÂNTICO HOLOGRÁFICO FLUTUANTE
         ========================================================= */}
      <group
        position={[2.2, 0.22, 0.8]}
        onClick={handleQuantumClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Socket Frame with Gold Pins on PCB */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[1.05, 0.04, 1.05]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* Levitating Polyhedral Quantum Die Core */}
        <mesh ref={quantumCoreRef} position={[0, 0.85, 0]} castShadow>
          <dodecahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial
            color={quantumBurst > 0 ? '#f43f5e' : '#06b6d4'}
            emissive={quantumBurst > 0 ? '#e11d48' : '#0891b2'}
            emissiveIntensity={quantumBurst > 0 ? 3.5 : 1.4}
            metalness={0.2}
            roughness={0.15}
          />
        </mesh>

        {/* Counter-Rotating Holographic Gimbal Rings */}
        <group ref={quantumGimbal1Ref} position={[0, 0.85, 0]}>
          <mesh>
            <torusGeometry args={[0.58, 0.02, 8, 28]} />
            <meshStandardMaterial
              color="#a855f7"
              emissive="#9333ea"
              emissiveIntensity={1.8}
              wireframe
            />
          </mesh>
        </group>
        <group ref={quantumGimbal2Ref} position={[0, 0.85, 0]}>
          <mesh>
            <torusGeometry args={[0.72, 0.02, 8, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={1.8}
              wireframe
            />
          </mesh>
        </group>

        {/* Expanding Holographic Shockwave Ring on Click */}
        <mesh
          ref={quantumShockwaveRef}
          position={[0, 0.85, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.6, 0.8, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#06b6d4"
            emissiveIntensity={2.5}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* =========================================================
          7. SSD NVME M.2 COM DISSIPADOR & BENCHMARK LED
         ========================================================= */}
      <group
        position={[-1.3, 0.16, 0.8]}
        onClick={handleNvmeClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {/* NVMe PCB Bar */}
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.04, 1.4]} />
          <meshStandardMaterial color="#064e3b" roughness={0.3} />
        </mesh>
        {/* Aluminum Finned Heatsink */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.38, 0.08, 1.25]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Carbon Fiber Decal Stripe */}
        <mesh position={[0, 0.105, 0]}>
          <planeGeometry args={[0.22, 1.0]} />
          <meshStandardMaterial color="#09090b" roughness={0.2} />
        </mesh>
        {/* Ultra-Rapid PCIe 5.0 Activity LED */}
        <mesh ref={nvmeLedRef} position={[0.12, 0.11, 0.45]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#dc2626"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* =========================================================
          8. RADIADOR 360MM & RESERVATÓRIO DE WATERCOOLING
         ========================================================= */}
      {/* 360mm Radiator along rear edge */}
      <group position={[0, 0.65, -2.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.85, 0.4]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Radiator Cooling Fins Texture */}
        <mesh position={[0, 0, 0.205]}>
          <planeGeometry args={[3.8, 0.65]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.4} />
        </mesh>
        {/* Dual Exhaust Fans */}
        {[-1.2, 1.2].map((rx, idx) => {
          const rRef = idx === 0 ? radFan1Ref : radFan2Ref;
          return (
            <group key={idx} position={[rx, 0, 0.22]}>
              <mesh>
                <ringGeometry args={[0.35, 0.42, 20]} />
                <meshStandardMaterial
                  color="#a855f7"
                  emissive="#9333ea"
                  emissiveIntensity={1.4}
                />
              </mesh>
              <group ref={rRef}>
                {[0, 1, 2, 3, 4].map((b) => (
                  <mesh key={b} rotation={[0, 0, (b * Math.PI * 2) / 5]}>
                    <boxGeometry args={[0.32, 0.08, 0.02]} />
                    <meshStandardMaterial color="#09090b" />
                  </mesh>
                ))}
              </group>
            </group>
          );
        })}
      </group>

      {/* Vertical Cylindrical Coolant Reservoir & D5 Pump */}
      <group position={[2.2, 0.72, -1.8]}>
        {/* D5 Pump Base */}
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.36, 0.35, 20]} />
          <meshStandardMaterial color="#0b0f19" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Transparent Acrylic Cylinder */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.26, 0.26, 0.75, 24]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.35}
            roughness={0.1}
            metalness={0.1}
          />
        </mesh>
        {/* Internal Glowing Coolant Core with Helix */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.68, 16]} />
          <meshStandardMaterial
            color={waterblockPulse > 0 ? '#f43f5e' : '#a855f7'}
            emissive={waterblockPulse > 0 ? '#e11d48' : '#7e22ce'}
            emissiveIntensity={waterblockPulse > 0 ? 2.5 : 1.4}
          />
        </mesh>
      </group>

      {/* =========================================================
          9. PROCEDURAL HARD TUBING & SLEEVED CABLES
         ========================================================= */}
      {/* Hard Watercooling Tubes */}
      {hardTubeCurves.map((tube, idx) => (
        <group key={idx}>
          <mesh geometry={tubeGeometries[idx]} castShadow>
            <meshStandardMaterial
              color={waterblockPulse > 0 ? '#f43f5e' : tube.color}
              emissive={waterblockPulse > 0 ? '#e11d48' : tube.color}
              emissiveIntensity={waterblockPulse > 0 ? 2.2 : 0.9}
              roughness={0.2}
              metalness={0.3}
              transparent
              opacity={0.88}
            />
          </mesh>
          {/* Compression Fitting Collars at Ends */}
          <mesh position={tube.curve.getPoint(0)}>
            <cylinderGeometry args={[tube.radius * 1.6, tube.radius * 1.6, 0.08, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={tube.curve.getPoint(1)}>
            <cylinderGeometry args={[tube.radius * 1.6, tube.radius * 1.6, 0.08, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Braided Sleeved High-Density Power Cables */}
      {powerCables.map((cable, idx) => (
        <mesh key={idx} geometry={cableGeometries[idx]} castShadow>
          <meshStandardMaterial
            color={cable.color}
            roughness={0.4}
            metalness={0.15}
          />
        </mesh>
      ))}

    </group>
  );
};

export const SkillsIsland = React.memo(SkillsIslandComponent);
