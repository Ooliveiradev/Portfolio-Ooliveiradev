import React, { Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AdminError, loadAdminApi, type AdminApi, type AdminSession } from '../firebase/admin';

const AdminLoginDialog = lazy(() => import('./AdminLoginDialog'));
const AdminPanel = lazy(() => import('./AdminPanel'));

type Phase = 'closed' | 'checking' | 'login' | 'panel';

/** Longest the "connecting" step may take before the owner gets the login (and a clear message) anyway. */
const CONNECT_TIMEOUT_MS = 15_000;

interface AdminContextValue {
  /** True while an admin dialog covers the world (login or editing). Preview mode hands the world back. */
  isOpen: boolean;
  open: () => void;
}

const AdminContext = createContext<AdminContextValue>({ isOpen: false, open: () => undefined });

/** Handed to the lazily loaded dialogs. */
export interface AdminSessionApi {
  api: AdminApi | null;
  session: AdminSession | null;
  /** Why the login is being shown again, e.g. an expired session. */
  notice: string | null;
  setPreviewing: (previewing: boolean) => void;
  close: () => void;
  onSignedIn: (session: AdminSession) => void;
  signOut: () => Promise<void>;
}

export const AdminProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [phase, setPhase] = useState<Phase>('closed');
  const [api, setApi] = useState<AdminApi | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const unwatch = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>('closed');
  phaseRef.current = phase;
  // Identifies the latest open() so a slow, cancelled attempt can never reopen anything.
  const attempt = useRef(0);

  const stopWatching = useCallback(() => { unwatch.current?.(); unwatch.current = null; }, []);

  const close = useCallback(() => {
    attempt.current++;
    stopWatching();
    setPhase('closed');
    setPreviewing(false);
    setNotice(null);
  }, [stopWatching]);

  const open = useCallback(() => {
    if (phaseRef.current !== 'closed') return;
    const id = ++attempt.current;
    const isCurrent = () => attempt.current === id;
    setNotice(null);
    setPhase('checking');
    const timer = window.setTimeout(() => {
      if (!isCurrent() || phaseRef.current !== 'checking') return;
      setNotice('Não foi possível conectar ao servidor. Verifique a internet e tente de novo.');
      setPhase('login');
    }, CONNECT_TIMEOUT_MS);
    loadAdminApi().then(loaded => {
      if (!isCurrent()) return;
      setApi(loaded);
      let first = true;
      stopWatching();
      unwatch.current = loaded.watchSession(next => {
        if (!isCurrent()) return;
        setSession(next);
        if (first) {
          first = false;
          window.clearTimeout(timer);
          setPhase(next ? 'panel' : 'login');
        } else if (!next && phaseRef.current === 'panel') {
          // Revoked or expired while editing: ask for the password again, the draft stays in memory.
          setNotice('Sua sessão expirou. Entre novamente; suas alterações foram preservadas.');
          setPhase('login');
        }
      });
    }).catch((error: unknown) => {
      window.clearTimeout(timer);
      if (!isCurrent()) return;
      setNotice(error instanceof AdminError ? error.message : 'Não foi possível iniciar o painel.');
      setPhase('login');
    });
  }, [stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

  // While connecting there is no dialog to close, so Esc cancels.
  useEffect(() => {
    if (phase !== 'checking') return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, close]);

  const signOut = useCallback(async () => {
    try { await api?.signOut(); } finally { setSession(null); close(); }
  }, [api, close]);

  const onSignedIn = useCallback((next: AdminSession) => {
    setSession(next);
    setNotice(null);
    setPhase('panel');
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({ isOpen: phase !== 'closed' && !(phase === 'panel' && previewing), open }),
    [phase, previewing, open],
  );
  const shared: AdminSessionApi = { api, session, notice, setPreviewing, close, onSignedIn, signOut };

  return (
    <AdminContext.Provider value={value}>
      {children}
      {phase === 'checking' && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] pl-4 pr-2 py-2 rounded-lg border border-emerald-500/40 bg-[#04110f]/95 text-emerald-300 font-mono text-xs shadow-xl flex items-center gap-3">
          <span>Conectando ao servidor…</span>
          <button type="button" onClick={close} className="px-2.5 min-h-8 rounded-md border border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300">Cancelar</button>
        </div>
      )}
      <Suspense fallback={null}>
        {/* No exit animation on purpose: closing must work even when animations are throttled. */}
        {phase === 'login' && <AdminLoginDialog key="login" {...shared} />}
        {phase === 'panel' && session && api && <AdminPanel key="panel" {...shared} session={session} api={api} />}
      </Suspense>
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextValue => useContext(AdminContext);
