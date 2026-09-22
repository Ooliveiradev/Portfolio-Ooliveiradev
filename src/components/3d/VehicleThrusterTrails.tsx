import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GraphicsQuality } from '../../types';
import { raceSession } from '../../utils/raceSession';

interface VehicleThrusterTrailsProps {
  sharedVehiclePos: React.MutableRefObject<THREE.Vector3>;
  graphicsQuality?: GraphicsQuality;
  visible?: boolean;
}

const TRAIL_POINTS = 32;

// Vetores auxiliares pre-alocados para evitar garbage collection
const _leftNozzle = new THREE.Vector3();
const _rightNozzle = new THREE.Vector3();
const _worldLeft = new THREE.Vector3();
const _worldRight = new THREE.Vector3();

/**
 * VehicleThrusterTrails
 * Inspiração: Folio-2025 (Bruno Simon "Trails / Tracks").
 * 
 * Renderiza duas fitas contínuas de plasma estelar e rastro luminescente
 * emitidas pelos propulsores da nave. Desvanecem no vácuo espacial com gradiente suave.
 */
export const VehicleThrusterTrails: React.FC<VehicleThrusterTrailsProps> = ({
  sharedVehiclePos,
  graphicsQuality = 'mid',
  visible = true,
}) => {
  const lineLeftRef = useRef<THREE.Line>(null);
  const lineRightRef = useRef<THREE.Line>(null);

  // Histórico de posições (ring buffer)
  const historyLeft = useRef<Float32Array>(new Float32Array(TRAIL_POINTS * 3));
  const historyRight = useRef<Float32Array>(new Float32Array(TRAIL_POINTS * 3));
  const initialized = useRef(false);

  // Cores por vértice para criar o fade-out natural na ponta mais antiga
  const { geometryLeft, geometryRight, material } = useMemo(() => {
    const geoL = new THREE.BufferGeometry();
    const geoR = new THREE.BufferGeometry();

    const positionsL = new Float32Array(TRAIL_POINTS * 3);
    const positionsR = new Float32Array(TRAIL_POINTS * 3);
    const colors = new Float32Array(TRAIL_POINTS * 4);

    for (let i = 0; i < TRAIL_POINTS; i++) {
      const alpha = 1.0 - i / (TRAIL_POINTS - 1);
      // Gradiente de cor: de ciano turbo (#38bdf8) para índigo cósmico (#818cf8)
      colors[i * 4] = 0.22 + 0.28 * (1.0 - alpha);
      colors[i * 4 + 1] = 0.74 * alpha;
      colors[i * 4 + 2] = 0.98;
      colors[i * 4 + 3] = Math.pow(alpha, 1.8) * 0.75;
    }

    geoL.setAttribute('position', new THREE.BufferAttribute(positionsL, 3));
    geoL.setAttribute('color', new THREE.BufferAttribute(colors, 4));

    geoR.setAttribute('position', new THREE.BufferAttribute(positionsR, 3));
    geoR.setAttribute('color', new THREE.BufferAttribute(colors, 4));

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 2,
    });

    return { geometryLeft: geoL, geometryRight: geoR, material: mat };
  }, []);

  useEffect(() => {
    return () => {
      geometryLeft.dispose();
      geometryRight.dispose();
      material.dispose();
    };
  }, [geometryLeft, geometryRight, material]);

  useFrame(() => {
    if (!visible || !sharedVehiclePos) return;

    const shipPos = sharedVehiclePos.current;
    material.opacity = raceSession.active && raceSession.boosting ? 1 : 0.6;
    // A grid teleport must not leave a ribbon across the entire galaxy.
    if (Math.hypot(historyLeft.current[0] - shipPos.x, historyLeft.current[2] - shipPos.z) > 12) initialized.current = false;

    // Se ainda não inicializado, preenche com a posição atual da nave
    if (!initialized.current) {
      for (let i = 0; i < TRAIL_POINTS; i++) {
        historyLeft.current[i * 3] = shipPos.x - 0.45;
        historyLeft.current[i * 3 + 1] = shipPos.y;
        historyLeft.current[i * 3 + 2] = shipPos.z - 1.6;

        historyRight.current[i * 3] = shipPos.x + 0.45;
        historyRight.current[i * 3 + 1] = shipPos.y;
        historyRight.current[i * 3 + 2] = shipPos.z - 1.6;
      }
      initialized.current = true;
    }

    // Desloca o histórico uma posição para trás
    const hL = historyLeft.current;
    const hR = historyRight.current;

    for (let i = TRAIL_POINTS - 1; i > 0; i--) {
      hL[i * 3] = hL[(i - 1) * 3];
      hL[i * 3 + 1] = hL[(i - 1) * 3 + 1];
      hL[i * 3 + 2] = hL[(i - 1) * 3 + 2];

      hR[i * 3] = hR[(i - 1) * 3];
      hR[i * 3 + 1] = hR[(i - 1) * 3 + 1];
      hR[i * 3 + 2] = hR[(i - 1) * 3 + 2];
    }

    // Insere as coordenadas atuais dos bicos esquerdo e direito da nave
    hL[0] = shipPos.x - 0.42;
    hL[1] = shipPos.y + 0.05;
    hL[2] = shipPos.z - 1.4;

    hR[0] = shipPos.x + 0.42;
    hR[1] = shipPos.y + 0.05;
    hR[2] = shipPos.z - 1.4;

    // Atualiza os atributos de vértice
    const posAttrL = geometryLeft.getAttribute('position') as THREE.BufferAttribute;
    const posAttrR = geometryRight.getAttribute('position') as THREE.BufferAttribute;

    (posAttrL.array as Float32Array).set(hL);
    (posAttrR.array as Float32Array).set(hR);

    posAttrL.needsUpdate = true;
    posAttrR.needsUpdate = true;
  });

  const lineLeft = useMemo(() => new THREE.Line(geometryLeft, material), [geometryLeft, material]);
  const lineRight = useMemo(() => new THREE.Line(geometryRight, material), [geometryRight, material]);

  if (graphicsQuality === 'low') {
    return null;
  }

  return (
    <group visible={visible}>
      <primitive object={lineLeft} ref={lineLeftRef} />
      <primitive object={lineRight} ref={lineRightRef} />
    </group>
  );
};
