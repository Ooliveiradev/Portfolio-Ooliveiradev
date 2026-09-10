import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CosmicPondProps {
  position?: [number, number, number];
  scale?: [number, number, number];
}

/**
 * CosmicPond
 * Lago sagrado de reflexão com ondulações procedurais, gradiente de profundidade e reflexo solar.
 */
export const CosmicPond: React.FC<CosmicPondProps> = ({
  position = [0, 0.08, 0],
  scale = [1, 1, 1],
}) => {
  const pondMatRef = useRef<THREE.ShaderMaterial>(null);

  const waterMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColorShallow: { value: new THREE.Color('#38bdf8') },
        uColorDeep: { value: new THREE.Color('#0369a1') },
        uSunPosition: { value: new THREE.Vector3(40, 60, 32) },
      },
      vertexShader: `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          vUv = uv;

          // Ondulações suaves procedurais no vértice
          vec3 pos = position;
          float wave1 = sin(pos.x * 5.0 + uTime * 2.0) * 0.035;
          float wave2 = cos(pos.y * 4.2 + uTime * 1.6) * 0.028;
          float wave3 = sin((pos.x + pos.y) * 3.0 + uTime * 2.4) * 0.02;
          pos.z += wave1 + wave2 + wave3;

          // Cálculo aproximado da normal ondulada
          vec3 n = vec3(
            -cos(pos.x * 5.0 + uTime * 2.0) * 0.15,
            -sin(pos.y * 4.2 + uTime * 1.6) * 0.12,
            1.0
          );
          vNormal = normalize(normalMatrix * n);

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;

          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorShallow;
        uniform vec3 uColorDeep;
        uniform vec3 uSunPosition;

        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main() {
          // Distância do centro para criar borda de espuma suave
          vec2 centeredUv = vUv - 0.5;
          float dist = length(centeredUv) * 2.0;
          if (dist > 1.0) discard;

          // Gradiente de profundidade: margens rasas ciano, centro azul marinho
          float depthFactor = smoothstep(0.1, 0.85, 1.0 - dist);
          vec3 waterColor = mix(uColorShallow, uColorDeep, depthFactor);

          // Espuma nas margens do lago
          float foam = smoothstep(0.78, 0.96, dist);
          waterColor = mix(waterColor, vec3(0.92, 0.98, 1.0), foam * 0.85);

          // Reflexo especular cintilante do Sol
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          vec3 lightDir = normalize(uSunPosition - vWorldPos);
          vec3 halfVector = normalize(lightDir + viewDir);
          float specular = pow(max(dot(vNormal, halfVector), 0.0), 48.0);

          // Caustics procedurais
          float caustic = sin(vWorldPos.x * 8.0 + uTime * 1.8) * cos(vWorldPos.z * 8.0 - uTime * 1.5);
          caustic = smoothstep(0.4, 0.9, caustic) * 0.25;

          vec3 finalColor = waterColor + vec3(specular * 0.85) + vec3(caustic);

          float alpha = smoothstep(1.0, 0.85, dist) * 0.88;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    if (pondMatRef.current) {
      pondMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Borda de pedras e musgo do lago */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <ringGeometry args={[1.55, 1.85, 24]} />
        <meshStandardMaterial color="#475569" roughness={0.88} flatShading />
      </mesh>

      {/* Superfície líquida com shader procedural */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[3.2, 3.2, 32, 32]} />
        <primitive object={waterMaterial} ref={pondMatRef} attach="material" />
      </mesh>
    </group>
  );
};

interface CosmicWaterfallProps {
  position?: [number, number, number];
  height?: number;
  width?: number;
}

/**
 * CosmicWaterfall
 * Cascata de energia líquida contínua caindo pela falésia e se dissolvendo no cosmos.
 */
export const CosmicWaterfall: React.FC<CosmicWaterfallProps> = ({
  position = [0, 0, 0],
  height = 5.2,
  width = 1.1,
}) => {
  const fallMatRef = useRef<THREE.ShaderMaterial>(null);

  const waterfallMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uTopColor: { value: new THREE.Color('#38bdf8') },
        uBottomColor: { value: new THREE.Color('#818cf8') },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uTopColor;
        uniform vec3 uBottomColor;
        varying vec2 vUv;

        void main() {
          // Fluxo vertical contínuo acelerado para baixo
          float flowCoord = vUv.y * 6.0 + uTime * 4.5;
          float foamLines = sin(flowCoord + sin(vUv.x * 12.0) * 1.5);
          foamLines = smoothstep(0.2, 0.8, foamLines) * 0.45;

          // Gradiente vertical de cor
          vec3 col = mix(uBottomColor, uTopColor, vUv.y);
          col += vec3(foamLines);

          // Desvanecimento na ponta inferior (dissolução no vácuo estelar)
          float fade = smoothstep(0.0, 0.25, vUv.y);

          // Bordas laterais arredondadas
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

          gl_FragColor = vec4(col, fade * edgeFade * 0.85);
        }
      `,
    });
  }, []);

  useFrame((state) => {
    if (fallMatRef.current) {
      fallMatRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, -height / 2, 0]}>
        <planeGeometry args={[width, height, 1, 1]} />
        <primitive object={waterfallMaterial} ref={fallMatRef} attach="material" />
      </mesh>
    </group>
  );
};
