export interface VehicleInput {
  x: number;
  y: number;
  boost: boolean;
}

export const createVehicleInput = (): VehicleInput => ({ x: 0, y: 0, boost: false });

/** Check ancestors too: a contenteditable element can contain the event target. */
export function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as (Element & { isContentEditable?: boolean }) | null;
  if (!element || typeof element.closest !== 'function') return false;
  return Boolean(
    element.isContentEditable ||
    element.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'),
  );
}

type GameKeyEvent = Pick<KeyboardEvent,
  'target' | 'defaultPrevented' | 'isComposing' | 'ctrlKey' | 'metaKey' | 'altKey'
>;

/** Game shortcuts must leave typing, browser shortcuts and handled events alone. */
export function canHandleGameKey(event: GameKeyEvent, enabled = true): boolean {
  return enabled && !event.defaultPrevented && !event.isComposing &&
    !event.ctrlKey && !event.metaKey && !event.altKey && !isEditableTarget(event.target);
}
