import { useEffect, useRef } from 'react';

const focusable = 'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), video[controls], [tabindex="0"]';
const rootLocks = new Set<HTMLElement>();
let originalRootInert = false;

function syncDialogStack() {
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-narrative-dialog]'));
  panels.forEach((node, index) => {
    node.toggleAttribute('inert', index !== panels.length - 1);
    if (index === panels.length - 1) node.setAttribute('aria-modal', 'true');
    else node.removeAttribute('aria-modal');
  });
}

/** Capture Escape before the game's window listener; only the top dialog owns keys. */
export function useDialogFocus(onClose: () => void, enabled = true) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const panel = ref.current;
    if (!panel || !enabled) return;
    const previous = document.activeElement as HTMLElement | null;
    const root = document.getElementById('root');
    if (root) {
      if (!rootLocks.size) originalRootInert = root.hasAttribute('inert');
      rootLocks.add(panel);
      root.setAttribute('inert', '');
    }
    panel.dataset.narrativeDialog = 'true';
    syncDialogStack();
    const isTop = () => Array.from(document.querySelectorAll('[data-narrative-dialog]')).at(-1) === panel;
    const targets = () => Array.from(panel.querySelectorAll<HTMLElement>(focusable))
      .filter(node => node.getClientRects().length && !node.closest('[inert]'));
    // Child portals mount in the same commit. Defer to the final dialog stack.
    const frame = requestAnimationFrame(() => { if (isTop()) panel.focus({ preventScroll: true }); });
    const keydown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        close.current();
      } else if (event.key === 'Tab') {
        const nodes = targets();
        const first = nodes[0] ?? panel;
        const last = nodes.at(-1) ?? panel;
        if (!panel.contains(document.activeElement) || document.activeElement === panel ||
          (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const focusin = (event: FocusEvent) => {
      if (isTop() && !panel.contains(event.target as Node)) panel.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', keydown, true);
    document.addEventListener('focusin', focusin);
    return () => {
      cancelAnimationFrame(frame);
      delete panel.dataset.narrativeDialog;
      document.removeEventListener('keydown', keydown, true);
      document.removeEventListener('focusin', focusin);
      syncDialogStack();
      rootLocks.delete(panel);
      if (root && !rootLocks.size) root.toggleAttribute('inert', originalRootInert);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [enabled]);
  return ref;
}
