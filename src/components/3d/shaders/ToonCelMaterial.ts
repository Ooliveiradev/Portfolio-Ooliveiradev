import * as THREE from 'three';

interface CreateToonCelMaterialOptions {
  color: string;
  rimColor?: string;
  lightDirection?: [number, number, number];
}

/**
 * createToonCelMaterial
 * Shader de Cel-Shading em 3 bandas de iluminação discretas estilo anime / toy diorama:
 * - Banda 1: Sombra base ambiente (35%)
 * - Banda 2: Meio-tom suave (70%)
 * - Banda 3: Iluminação solar plena (100%)
 * - Rim Light: Realce nas silhuetas contra o espaço profundo
 */
export function createToonCelMaterial(options: CreateToonCelMaterialOptions): THREE.ShaderMaterial {
  const {
    color,
    rimColor = '#f8fafc',
    lightDirection = [40, 60, 32],
  } = options;

  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(color) },
      uRimColor: { value: new THREE.Color(rimColor) },
      uLightDir: { value: new THREE.Vector3(...lightDirection).normalize() },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform vec3 uLightDir;

      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        // Produto escalar com a luz principal solar
        float NdotL = dot(vNormal, uLightDir);

        // Quantização em 3 patamares de iluminação (Cel-Banding)
        float celFactor = 0.35;
        if (NdotL > 0.42) {
          celFactor = 1.0;
        } else if (NdotL > -0.05) {
          celFactor = 0.70;
        }

        vec3 shadedColor = uBaseColor * celFactor;

        // Rim Lighting de borda estelar
        float rim = 1.0 - max(dot(vNormal, vViewDir), 0.0);
        float rimFactor = smoothstep(0.68, 0.95, rim) * 0.35;

        vec3 finalColor = shadedColor + uRimColor * rimFactor;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}
