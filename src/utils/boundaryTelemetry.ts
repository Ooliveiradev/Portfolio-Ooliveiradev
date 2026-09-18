import { createBoundaryFrame, type BoundaryFrame } from './cosmicBoundary';

// Mutable telemetry is sampled by isolated HUD widgets and read directly by shaders.
const frame = createBoundaryFrame();
export const getBoundaryTelemetry = () => frame;
export const publishBoundaryTelemetry = (next: BoundaryFrame) => { Object.assign(frame, next); };
export const clearBoundaryTelemetry = () => { Object.assign(frame, createBoundaryFrame()); };
