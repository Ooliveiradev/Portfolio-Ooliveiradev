import type { PortfolioMedia } from '../types';

// Explicitly requested review fixtures. Replace these associations with real media
// in portfolioData.ts and remove this file before treating the galleries as evidence.
export const TEST_PROJECT_MEDIA: PortfolioMedia[] = [
  { id: 'test-screen', kind: 'image', src: '/assets/test-media/screen.svg', thumbnail: '/assets/test-media/screen.svg', alt: 'TESTE / TEST — grade de calibração 16:10', caption: 'Teste de imagem / Image test', testOnly: true },
  { id: 'test-detail', kind: 'image', src: '/assets/test-media/detail.svg', thumbnail: '/assets/test-media/detail.svg', alt: 'TESTE / TEST — detalhe de interface vetorial', caption: 'Teste de detalhe / Detail test', testOnly: true },
  { id: 'test-video', kind: 'video', src: '/assets/test-media/motion.mp4', thumbnail: '/assets/test-media/screen.svg', alt: 'TESTE / TEST — vídeo de calibração sem áudio', caption: 'Teste de vídeo / Video test', testOnly: true },
];

export const TEST_CERTIFICATE_MEDIA: PortfolioMedia[] = [
  { id: 'test-certificate', kind: 'image', src: '/assets/test-media/certificate.svg', thumbnail: '/assets/test-media/certificate.svg', alt: 'TESTE / TEST — documento sem valor acadêmico', caption: 'Documento de teste / Test document', testOnly: true },
];
