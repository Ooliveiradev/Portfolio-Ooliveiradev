/**
 * webgpuDetector.ts
 * Detecção em tempo de execução de WebGPU e telemetria de GPU de próxima geração.
 * Permite detecção automática de WebGPU com fallback seguro para WebGL 2.0.
 */

export interface WebGPUCapability {
  isSupported: boolean;
  adapterName: string;
  backend: string; // 'vulkan' | 'metal' | 'd3d12' | 'webgl' | 'desconhecido'
  deviceType: string;
  preferredFormat?: string;
  features: string[];
}

let cachedCapability: WebGPUCapability | null = null;

export async function detectWebGPUSupport(): Promise<WebGPUCapability> {
  if (cachedCapability) return cachedCapability;

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isSupported: false,
      adapterName: 'Ambiente Server-Side',
      backend: 'webgl',
      deviceType: 'desconhecido',
      features: [],
    };
  }

  const nav = navigator as any;
  // Verifica se a API navigator.gpu existe no navegador
  if (!('gpu' in nav) || !nav.gpu) {
    cachedCapability = {
      isSupported: false,
      adapterName: getWebGLRendererName(),
      backend: 'WebGL 2.0 (Universal)',
      deviceType: 'gpu-compat',
      features: ['webgl2', 'float-textures', 'instancing'],
    };
    return cachedCapability;
  }

  try {
    const gpu = nav.gpu;
    // Sem powerPreference para evitar advertência do Chromium no Windows
    const adapter = await gpu.requestAdapter();

    if (!adapter) {
      cachedCapability = {
        isSupported: false,
        adapterName: getWebGLRendererName(),
        backend: 'WebGL 2.0 (Adaptador WebGPU Indisponível)',
        deviceType: 'gpu-compat',
        features: ['webgl2'],
      };
      return cachedCapability;
    }

    // Coleta informações do adaptador WebGPU
    let adapterInfo: any = {};
    try {
      if (typeof adapter.requestAdapterInfo === 'function') {
        adapterInfo = await adapter.requestAdapterInfo();
      } else if (adapter.info) {
        adapterInfo = adapter.info;
      }
    } catch {
      // fallback
    }

    const preferredFormat = gpu.getPreferredCanvasFormat
      ? gpu.getPreferredCanvasFormat()
      : 'bgra8unorm';

    const featuresList: string[] = [];
    if (adapter.features) {
      adapter.features.forEach((feat) => featuresList.push(feat));
    }

    const vendor = adapterInfo.vendor || 'GPU Nativa';
    const architecture = adapterInfo.architecture ? ` (${adapterInfo.architecture})` : '';
    const description = adapterInfo.description || adapterInfo.device || getWebGLRendererName();

    // Determina o provável backend nativo
    let backendName = 'WebGPU Nativo';
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac') || ua.includes('iphone') || ua.includes('ipad')) {
      backendName = 'WebGPU (Apple Metal)';
    } else if (ua.includes('win')) {
      backendName = 'WebGPU (DirectX 12 / Vulkan)';
    } else if (ua.includes('linux') || ua.includes('android')) {
      backendName = 'WebGPU (Vulkan)';
    }

    cachedCapability = {
      isSupported: true,
      adapterName: `${vendor} ${description}${architecture}`.trim(),
      backend: backendName,
      deviceType: adapterInfo.device || 'discrete-gpu',
      preferredFormat,
      features: featuresList.slice(0, 8),
    };

    return cachedCapability;
  } catch {
    cachedCapability = {
      isSupported: false,
      adapterName: getWebGLRendererName(),
      backend: 'WebGL 2.0 (Fallback Seguro)',
      deviceType: 'fallback',
      features: ['webgl2'],
    };
    return cachedCapability;
  }
}

/**
 * Coleta o nome da GPU através do contexto WebGL tradicional como fallback
 */
function getWebGLRendererName(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'Acelerador Gráfico Genérico';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Acelerador WebGL';
    }
    return gl.getParameter(gl.RENDERER) || 'Acelerador WebGL';
  } catch {
    return 'Acelerador WebGL 2.0';
  }
}
