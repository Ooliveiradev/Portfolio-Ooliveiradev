import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import App from './App.tsx';
import './index.css';

// Silencia avisos de depreciação de bibliotecas de terceiros no Three.js r185
// (ex.: instanciação interna de THREE.Clock dentro do @react-three/fiber e PCFSoftShadowMap)
const isSuppressedWarning = (msg: unknown): boolean => {
  if (typeof msg === 'string') {
    return (
      msg.includes('Clock: This module has been deprecated') ||
      msg.includes('PCFSoftShadowMap has been deprecated')
    );
  }
  if (msg && typeof msg === 'object') {
    const text = String((msg as { message?: unknown }).message || msg);
    return (
      text.includes('Clock: This module has been deprecated') ||
      text.includes('PCFSoftShadowMap has been deprecated')
    );
  }
  return false;
};

if (typeof THREE.setConsoleFunction === 'function') {
  THREE.setConsoleFunction((type, message, ...params) => {
    if (type === 'warn' && (isSuppressedWarning(message) || params.some(isSuppressedWarning))) {
      return;
    }
    if (type === 'error') {
      console.error(message, ...params);
    } else if (type === 'log') {
      console.log(message, ...params);
    } else {
      console.warn(message, ...params);
    }
  });
}

const originalConsoleWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (args.some(isSuppressedWarning)) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
