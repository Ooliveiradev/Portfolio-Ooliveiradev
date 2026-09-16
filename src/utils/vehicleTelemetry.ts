export type VehiclePosition = [number, number, number];

export const INITIAL_VEHICLE_POSITION: VehiclePosition = [0, 1, 16];

// Transient simulation data must not cause App (and every modal) to render.
// The radar and race overlay sample this data at their own UI refresh rate.
let position: VehiclePosition = [...INITIAL_VEHICLE_POSITION];
let rotation = 0;

export const getVehiclePosition = () => position;
export const getVehicleRotation = () => rotation;
export const updateVehiclePosition = (next: VehiclePosition) => { position = next; };
export const updateVehicleRotation = (next: number) => { rotation = next; };
