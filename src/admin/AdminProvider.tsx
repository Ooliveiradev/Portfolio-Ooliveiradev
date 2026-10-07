import React, { Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AdminError, loadAdminApi, type AdminApi, type AdminSession } from '../firebase/admin';

const AdminLoginDialog = lazy(() => import('./AdminLoginDialog'));
const AdminPanel = lazy(() => import('./AdminPanel'));

type Phase = 'closed' | 'checking' | 'login' | 'panel';

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

  const stopWatching = useCallback(() => { unwatch.current?.(); unwatch.current = null; }, []);

  const close = useCallback(() => {
    stopWatching();
    setPhase('closed');
    setPreviewing(false);
    setNotice(null);
  }, [stopWatching]);

  const open = useCallback(() => {
    if (phaseRef.current !== 'closed') return;
    setNotice(null);
    setPhase('checking');
    loadAdminApi().then(loaded => {
      setApi(loaded);
      let first = true;
      stopWatching();
      unwatch.current = loaded.watchSession(next => {
        setSession(next);
        if (first) {
          first = false;
          setPhase(next ? 'panel' : 'login');
        } else if (!next && phaseRef.current === 'panel') {
          // Revoked or expired while editing: ask for the password again, the draft stays in memory.
          setNotice('Sua sessão expirou. Entre novamente; suas alterações foram preservadas.');
          setPhase('login');
        }
      });
    }).catch((error: unknown) => {
      setNotice(error instanceof AdminError ? error.message : 'Não foi possível iniciar o painel.');
      setPhase('login');
    });
  }, [stopWatching]);

  useEffect(() => stopWatching, [stopWatching]);

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
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-lg border border-emerald-500/40 bg-[#04110f]/95 text-emerald-300 font-mono text-xs shadow-xl">
          Conectando ao servidor…
        </div>
      )}
      <Suspense fallback={null}>
        <AnimatePresence>
          {phase === 'login' && <AdminLoginDialog key="login" {...shared} />}
        </AnimatePresence>
        {phase === 'panel' && session && api && <AdminPanel key="panel" {...shared} session={session} api={api} />}
      </Suspense>
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextValue => useContext(AdminContext);
