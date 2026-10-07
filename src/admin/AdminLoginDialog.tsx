import React, { useEffect, useId, useRef, useState } from 'react';
import { CinematicDialog } from '../components/ui/narrative/CinematicDialog';
import { AdminError } from '../firebase/admin';
import type { AdminSessionApi } from './AdminProvider';

/** After this many wrong passwords in a row the form pauses; Firebase applies its own, stricter limits too. */
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

const fieldClass =
  'w-full bg-black/40 border border-emerald-500/30 rounded-md px-3 py-2.5 text-sm text-emerald-100 font-mono placeholder:text-emerald-900 ' +
  'focus:outline-none focus:border-emerald-300 focus-visible:ring-1 focus-visible:ring-emerald-300/60 disabled:opacity-50';

export default function AdminLoginDialog({ api, notice, close, onSignedIn }: AdminSessionApi) {
  const emailId = useId();
  const passwordId = useId();
  const email = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failures, setFailures] = useState(0);
  const [locked, setLocked] = useState(0);

  useEffect(() => { email.current?.focus(); }, []);
  useEffect(() => {
    if (locked <= 0) return;
    const timer = window.setTimeout(() => setLocked(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [locked]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!api || submitting || locked > 0) return;
    const form = new FormData(event.currentTarget);
    const address = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    if (!address || !password) { setError('Informe o e-mail e a senha.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      onSignedIn(await api.signIn(address, password));
    } catch (reason) {
      const known = reason instanceof AdminError;
      setError(known ? reason.message : 'Não foi possível entrar. Tente novamente.');
      if (known && (reason.code === 'invalid-credentials' || reason.code === 'not-admin')) {
        const next = failures + 1;
        if (next >= MAX_ATTEMPTS) { setFailures(0); setLocked(LOCK_SECONDS); } else setFailures(next);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CinematicDialog titleId="admin-login-title" onClose={close} layer={85}
      className="w-full max-w-md rounded-xl border border-emerald-500/40 bg-[#04110f] shadow-[0_0_80px_#16b87a22] overflow-hidden font-mono text-emerald-100">
      <div translate="no" className="flex items-center gap-3 px-4 py-3 border-b border-emerald-500/20 text-[11px] text-emerald-300/70">
        <span className="flex gap-1.5" aria-hidden="true"><i className="w-2 h-2 rounded-full bg-emerald-900" /><i className="w-2 h-2 rounded-full bg-emerald-900" /><i className="w-2 h-2 rounded-full bg-emerald-400" /></span>
        <span aria-hidden="true">secure@universe:~</span>
        <button type="button" onClick={close} className="ml-auto px-2 min-h-8 rounded text-emerald-200/80 hover:bg-emerald-500/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300">esc ✕</button>
      </div>

      <div translate="no" className="p-6 space-y-5">
        <div>
          <p className="text-[11px] tracking-[0.25em] text-emerald-400/80" aria-hidden="true">❯ ./login --admin</p>
          <h2 id="admin-login-title" className="mt-3 text-2xl font-medium tracking-tight text-emerald-50">Acesso administrativo</h2>
          <p className="mt-2 text-xs text-emerald-200/60 leading-relaxed">Área restrita ao proprietário do portfólio. Descobrir este segredo não concede acesso: é preciso entrar com a conta autorizada.</p>
        </div>

        {notice && <p role="alert" className="rounded-md border border-amber-400/40 bg-amber-400/10 p-3 text-xs text-amber-100 leading-relaxed">{notice}</p>}

        {api ? (
          <form onSubmit={event => void submit(event)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor={emailId} className="block text-[11px] uppercase tracking-wider text-emerald-300/70">E-mail</label>
              <input ref={email} id={emailId} name="email" type="email" autoComplete="username" inputMode="email" required className={fieldClass} disabled={submitting} spellCheck={false} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={passwordId} className="block text-[11px] uppercase tracking-wider text-emerald-300/70">Senha</label>
              <div className="relative">
                <input id={passwordId} name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className={`${fieldClass} pr-20`} disabled={submitting} />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 min-h-8 rounded text-[11px] text-emerald-300/80 hover:bg-emerald-500/10 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300">
                  {showPassword ? 'ocultar' : 'mostrar'}
                </button>
              </div>
            </div>

            <div aria-live="assertive" className="min-h-5">
              {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
              {locked > 0 && <p className="text-xs text-amber-200 mt-1">Muitas tentativas. Aguarde {locked}s para tentar de novo.</p>}
            </div>

            <button type="submit" disabled={submitting || locked > 0}
              className="w-full min-h-11 rounded-md border border-emerald-400/60 bg-emerald-500/15 text-emerald-100 text-sm font-medium hover:bg-emerald-500/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300">
              {submitting ? 'Autenticando…' : '❯ Autenticar'}
            </button>
          </form>
        ) : (
          <button type="button" onClick={close} className="w-full min-h-11 rounded-md border border-emerald-400/40 text-sm text-emerald-100 hover:bg-emerald-500/10 cursor-pointer">Fechar</button>
        )}
      </div>
    </CinematicDialog>
  );
}
