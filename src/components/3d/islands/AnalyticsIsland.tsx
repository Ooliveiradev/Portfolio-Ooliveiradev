import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { GraphicsQuality, PortfolioAnalyticsData } from '../../../types';
import {
  fetchRealtimeMetrics,
  subscribeToAnalytics,
} from '../../../services/analyticsService';
import { HolographicMaterial } from '../shaders/HolographicMaterial';

interface AnalyticsIslandProps {
  isNear?: boolean;
  graphicsQuality?: GraphicsQuality;
  transferToUi?: boolean;
}

const EMPTY_ANALYTICS: PortfolioAnalyticsData = {
  status: 'unavailable',
  totalVisits: 0,
  uniqueVisitors: 0,
  avgDurationSeconds: 0,
  topProjects: [],
  dailyVisits: [],
  spatialHeatmap: [],
  lastUpdated: '',
};

const holoPanelStyle: React.CSSProperties = {
  minWidth: 106,
  padding: '7px 9px',
  border: '1px solid rgba(103,232,249,.48)',
  borderRadius: 8,
  background: 'rgba(3,12,24,.74)',
  boxShadow: '0 0 18px rgba(34,211,238,.22)',
  color: '#cffafe',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  textTransform: 'uppercase',
  textAlign: 'center',
  pointerEvents: 'none',
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.max(0, Math.round(seconds % 60));
  return `${minutes}m ${remaining.toString().padStart(2, '0')}s`;
};

const HoloDataCounter: React.FC<{
  label: string;
  value: string;
  position: [number, number, number];
}> = ({ label, value, position }) => (
  <group position={position}>
    <mesh>
      <planeGeometry args={[2.35, 1.15]} />
      <HolographicMaterial
        baseColor="#22d3ee"
        fresnelColor="#e879f9"
        opacity={0.2}
        scanlineDensity={48}
        scanlineSpeed={2.2}
        additive
      />
    </mesh>
    <Html center transform distanceFactor={5.7} position={[0, 0, 0.04]}>
      <div style={holoPanelStyle}>
        <div style={{ fontSize: 7, opacity: 0.68 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '.06em' }}>{value}</div>
      </div>
    </Html>
  </group>
);

const HoloTimelineRibbon: React.FC<{ data: PortfolioAnalyticsData['dailyVisits'] }> = ({ data }) => {
  const line = useMemo(() => {
    const line = new THREE.BufferGeometry();
    if (data.length === 0) {
      line.setFromPoints([new THREE.Vector3(-2, 0, 0), new THREE.Vector3(2, 0, 0)]);
      return new THREE.Line(
        line,
        new THREE.LineBasicMaterial({
          color: '#67e8f9',
          transparent: true,
          opacity: 0.9,
          blending: THREE.AdditiveBlending,
        }),
      );
    }
    const max = Math.max(1, ...data.map((point) => point.visits));
    const points = data.map((point, index) => {
      const x = data.length === 1 ? 0 : -2 + (index / (data.length - 1)) * 4;
      return new THREE.Vector3(x, (point.visits / max) * 1.1, 0);
    });
    line.setFromPoints(points);
    return new THREE.Line(
      line,
      new THREE.LineBasicMaterial({
        color: '#67e8f9',
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    );
  }, [data]);

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);

  return (
    <group position={[0, 0.9, 1.55]}>
      <primitive object={line} />
      <mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.3, 1.35]} />
        <HolographicMaterial baseColor="#0891b2" fresnelColor="#d946ef" opacity={0.08} additive />
      </mesh>
    </group>
  );
};

const SpatialHeatmapCloud: React.FC<{
  data: PortfolioAnalyticsData['spatialHeatmap'];
  graphicsQuality: GraphicsQuality;
}> = ({ data, graphicsQuality }) => {
  const pointRef = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const count = graphicsQuality === 'low' ? 28 : graphicsQuality === 'high' ? 84 : 52;
    const samples = data.slice(-count);
    const positions = new Float32Array(samples.length * 3);
    const colors = new Float32Array(samples.length * 3);
    const cyan = new THREE.Color('#22d3ee');
    const magenta = new THREE.Color('#d946ef');
    const orange = new THREE.Color('#fb923c');
    samples.forEach((sample, index) => {
      const offset = index * 3;
      positions[offset] = sample.x * 0.025;
      positions[offset + 1] = 0.3 + Math.abs(sample.y) * 0.06 + sample.intensity * 1.8;
      positions[offset + 2] = sample.z * 0.025;
      const color = sample.intensity < 0.5
        ? cyan.clone().lerp(magenta, sample.intensity * 2)
        : magenta.clone().lerp(orange, (sample.intensity - 0.5) * 2);
      colors[offset] = color.r;
      colors[offset + 1] = color.g;
      colors[offset + 2] = color.b;
    });
    const next = new THREE.BufferGeometry();
    next.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    next.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return next;
  }, [data, graphicsQuality]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (!pointRef.current) return;
    pointRef.current.rotation.y += delta * 0.08;
    pointRef.current.position.y = 1.2 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
  });

  return (
    <points ref={pointRef} geometry={geometry} position={[0, 1.2, 0]}>
      <pointsMaterial
        size={graphicsQuality === 'low' ? 0.1 : 0.14}
        vertexColors
        transparent
        opacity={0.76}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

export const AnalyticsIsland: React.FC<AnalyticsIslandProps> = ({
  isNear = false,
  graphicsQuality = 'mid',
  transferToUi = false,
}) => {
  const [data, setData] = useState<PortfolioAnalyticsData>(EMPTY_ANALYTICS);
  const projectorRef = useRef<THREE.Group>(null);
  const fieldRef = useRef<THREE.Mesh>(null);
  const dataLayerRef = useRef<THREE.Group>(null);
  const transferBeamRef = useRef<THREE.MeshBasicMaterial>(null);
  const transferRingRef = useRef<THREE.Group>(null);
  const transferProgressRef = useRef(0);

  useEffect(() => {
    let active = true;
    void fetchRealtimeMetrics('7d').then((initial) => {
      if (active) setData(initial);
    });
    const unsubscribe = subscribeToAnalytics((next) => {
      if (active) setData(next);
    }, 4_000, '7d');
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useFrame((state, delta) => {
    if (projectorRef.current) projectorRef.current.rotation.y += delta * 0.22;
    if (fieldRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.035;
      fieldRef.current.scale.setScalar(pulse);
    }

    const target = transferToUi ? 1 : 0;
    const progress = THREE.MathUtils.damp(transferProgressRef.current, target, 6.5, delta);
    transferProgressRef.current = progress;

    if (dataLayerRef.current) {
      const compactScale = Math.max(0.07, 1 - progress * 0.93);
      dataLayerRef.current.position.y = progress * 5.6;
      dataLayerRef.current.scale.setScalar(compactScale);
      dataLayerRef.current.rotation.y += delta * (0.08 + progress * 1.8);
      dataLayerRef.current.visible = progress < 0.985;
    }

    if (transferBeamRef.current) {
      transferBeamRef.current.opacity = Math.sin(progress * Math.PI) * 0.3;
    }

    if (transferRingRef.current) {
      transferRingRef.current.visible = progress > 0.01 && progress < 0.99;
      transferRingRef.current.position.y = 0.75 + progress * 5.1;
      const ringScale = 1.3 - progress * 0.9;
      transferRingRef.current.scale.setScalar(ringScale);
      transferRingRef.current.rotation.y += delta * 2.8;
    }
  });

  return (
    <group>
      <mesh position={[0, -0.65, 0]} receiveShadow castShadow={graphicsQuality !== 'low'}>
        <cylinderGeometry args={[5.35, 4.7, 1.15, 10]} />
        <meshStandardMaterial color="#111827" roughness={0.52} metalness={0.26} flatShading />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[4.7, 4.7, 0.18, 12]} />
        <meshStandardMaterial color="#172033" roughness={0.32} metalness={0.56} />
      </mesh>
      <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.45, 4.35, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.24} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 3.05, 0]}>
        <cylinderGeometry args={[0.78, 1.45, 5.4, 20, 1, true]} />
        <meshBasicMaterial
          ref={transferBeamRef}
          color="#67e8f9"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group ref={transferRingRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 0.82, 28]} />
          <meshBasicMaterial
            color="#e879f9"
            transparent
            opacity={0.82}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      <group ref={projectorRef} position={[0, 0.25, 0]}>
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.72, 1.15, 0.7, 10]} />
          <meshStandardMaterial color="#111827" metalness={0.72} roughness={0.22} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.5, 8]} />
          <meshBasicMaterial color="#67e8f9" />
        </mesh>
        <mesh position={[0, 2.15, 0]}>
          <octahedronGeometry args={[0.4, 0]} />
          <HolographicMaterial baseColor="#22d3ee" fresnelColor="#f0abfc" opacity={0.64} additive />
        </mesh>
      </group>

      {[[-3.5, -2.2], [3.5, -2.2], [-3.5, 2.25], [3.5, 2.25]].map(([x, z], index) => (
        <group key={`quantum-antenna-${index}`} position={[x, 0.1, z]}>
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.07, 0.12, 1.55, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, index * 0.4]}>
            <torusGeometry args={[0.28, 0.035, 6, 18]} />
            <meshBasicMaterial color={index % 2 === 0 ? '#22d3ee' : '#d946ef'} />
          </mesh>
        </group>
      ))}

      <group ref={dataLayerRef}>
        <mesh ref={fieldRef} position={[0, 1.25, 0]}>
          <sphereGeometry args={[4.35, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <HolographicMaterial
            baseColor="#0891b2"
            fresnelColor="#d946ef"
            opacity={isNear ? 0.11 : 0.055}
            scanlineDensity={22}
            additive
          />
        </mesh>

        <HoloDataCounter label="Visits" value={data.status === 'available' ? data.totalVisits.toLocaleString() : '—'} position={[-2.1, 2.2, 0.2]} />
        <HoloDataCounter label="Unique" value={data.status === 'available' ? data.uniqueVisitors.toLocaleString() : '—'} position={[2.1, 2.2, 0.2]} />
        <HoloDataCounter label="Avg time" value={data.status === 'available' ? formatDuration(data.avgDurationSeconds) : '—'} position={[0, 3.15, -0.5]} />
        {data.status === 'available' && <HoloTimelineRibbon data={data.dailyVisits} />}
        <SpatialHeatmapCloud data={data.spatialHeatmap} graphicsQuality={graphicsQuality} />
      </group>
    </group>
  );
};
