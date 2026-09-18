import assert from 'node:assert/strict';
import test from 'node:test';
import { canHandleGameKey, createVehicleInput, isEditableTarget } from '../src/utils/gameInput.ts';

const keyboardEvent = (overrides: Partial<KeyboardEvent> = {}) => ({
  target: null,
  defaultPrevented: false,
  isComposing: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...overrides,
});

test('vehicle input starts neutral and each control owns an independent value', () => {
  const first = createVehicleInput();
  const second = createVehicleInput();
  first.x = 1;
  first.boost = true;
  assert.deepEqual(second, { x: 0, y: 0, boost: false });
});

test('game keyboard controls are disabled outside driving and enabled on the page', () => {
  const event = keyboardEvent();
  assert.equal(canHandleGameKey(event), true);
  assert.equal(canHandleGameKey(event, false), false);
  assert.equal(isEditableTarget(null), false);
  assert.equal(isEditableTarget(new EventTarget()), false);
});

test('typing in native inputs or nested editor nodes never triggers game shortcuts', () => {
  const nativeInput = { closest: () => ({ tagName: 'INPUT' }) } as unknown as EventTarget;
  const editorChild = { isContentEditable: true, closest: () => null } as unknown as EventTarget;
  const nestedEditor = { closest: () => ({ isContentEditable: true }) } as unknown as EventTarget;
  for (const target of [nativeInput, editorChild, nestedEditor]) {
    assert.equal(isEditableTarget(target), true);
    assert.equal(canHandleGameKey(keyboardEvent({ target })), false);
  }
});

test('plain scene elements remain eligible for keyboard movement', () => {
  const target = { isContentEditable: false, closest: () => null } as unknown as EventTarget;
  assert.equal(isEditableTarget(target), false);
  assert.equal(canHandleGameKey(keyboardEvent({ target })), true);
});

test('browser shortcuts, composition and already handled events are left untouched', () => {
  for (const property of ['ctrlKey', 'metaKey', 'altKey', 'isComposing', 'defaultPrevented'] as const) {
    assert.equal(canHandleGameKey(keyboardEvent({ [property]: true })), false, property);
  }
});
