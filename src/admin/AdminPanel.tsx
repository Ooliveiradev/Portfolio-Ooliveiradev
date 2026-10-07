import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CinematicDialog } from '../components/ui/narrative/CinematicDialog';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { usePortfolioDocument } from '../content/ContentProvider';
import { findIssues, type ContentIssue, type SectionId } from '../content/issues';
import type { PortfolioDocument } from '../content/model';
import { normalizeDocument, prepareForPublish } from '../content/sanitize';
import { AdminError, type AdminApi, type AdminSession } from '../firebase/admin';
import type { IslandId } from '../types';
import type { AdminSessionApi } from './AdminProvider';
import { EducationEditor, ExperienceEditor, SkillsEditor } from './editors/CareerEditors';
import type { EditorProps, Update } from './editors/common';
import { IslandsEditor } from './editors/IslandsEditor';
import { MediaLibrary } from './editors/MediaLibrary';
import { ProfileEditor } from './editors/ProfileEditor';
import { ProjectsEditor } from './editors/ProjectsEditor';
import { AppearanceEditor, BadgesEditor, TextsEditor } from './editors/SiteEditors';
import { AdminApiContext } from './MediaEditors';
import { Button, LANG_LABEL, type Lang } from './ui';

const DRAFT_KEY = (uid: string) => `portfolio_admin_draft_v1:${uid}`;

interface StoredDraft { baseRevision: number | null; doc: PortfolioDocument }

const readStoredDraft = (uid: string): StoredDraft | null => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { baseRevision?: number | null; doc?: unknown };
    return parsed.doc ? { baseRevision: parsed.baseRevision ?? null, doc: normalizeDocument(parsed.doc) } : null;
  } catch {
    return null;
  }
};
const writeStoredDraft = (uid: string, draft: StoredDraft | null) => {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY(uid), JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY(uid));
  } catch { /* storage may be unavailable */ }
};

interface Tab {
  id: SectionId | 'media';
  label: string;
  icon: string;
  render: (props: EditorProps) => React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Perfil', icon: 'person', render: props => <ProfileEditor {...props} /> },
  { id: 'islands', label: 'Seções', icon: 'public', render: props => <IslandsEditor {...props} /> },
  { id: 'projects', label: 'Projetos', icon: 'folder_open', render: props => <ProjectsEditor {...props} /> },
  { id: 'experience', label: 'Experiência', icon: 'work', render: props => <ExperienceEditor {...props} /> },
  { id: 'education', label: 'Formação', icon: 'school', render: props => <EducationEditor {...props} /> },
  { id: 'skills', label: 'Habilidades', icon: 'bolt', render: props => <SkillsEditor {...props} /> },
  { id: 'badges', label: 'Conquistas', icon: 'emoji_events', render: props => <BadgesEditor {...props} /> },
  { id: 'appearance', label: 'Aparência', icon: 'palette', render: props => <AppearanceEditor {...props} /> },
  { id: 'texts', label: 'Textos', icon: 'text_fields', render: props => <TextsEditor {...props} /> },
  { id: 'media', label: 'Mídias', icon: 'perm_media', render: () => null },
];

type Dialog = null | 'publish' | 'exit' | 'discard' | 'issues' | 'reload';
type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

interface Props extends AdminSessionApi {
  session: AdminSession;
  api: AdminApi;
}

export default function AdminPanel({ session, api, setPreviewing, close, signOut }: Props) {
  const { published, revision, draft: sharedDraft, setDraft, setPublished } = usePortfolioDocument();
  const [doc, setDoc] = useState<PortfolioDocument>(() => {
    if (sharedDraft) return structuredClone(sharedDraft);
    const stored = readStoredDraft(session.uid);
    return stored && stored.baseRevision === revision ? stored.doc : structuredClone(published);
  });
  const [restored] = useState(() => !sharedDraft && readStoredDraft(session.uid)?.baseRevision === revision && readStoredDraft(session.uid) !== null);
  const [lang, setLang] = useState<Lang>('pt');
  const [tab, setTab] = useState<Tab['id']>('profile');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<Notice>(restored ? { tone: 'info', text: 'Rascunho anterior restaurado neste navegador. Ele ainda não foi publicado.' } : null);
  const [publishing, setPublishing] = useState(false);
  const [previewing, setPreviewingState] = useState(false);
  const [pendingIssues, setPendingIssues] = useState<ContentIssue[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const publishedJson = useMemo(() => JSON.stringify(published), [published]);
  const draftJson = useMemo(() => JSON.stringify(doc), [doc]);
  const dirty = draftJson !== publishedJson;
  const issues = useMemo(() => findIssues(doc), [doc]);
  const issueCount = useMemo(() => issues.reduce<Record<string, number>>((count, issue) => ({ ...count, [issue.section]: (count[issue.section] ?? 0) + 1 }), {}), [issues]);

  const update: Update = useCallback(recipe => {
    setDoc(previous => {
      const next = structuredClone(previous);
      recipe(next);
      return next;
    });
  }, []);

  // Keep the unpublished draft on this device so a closed tab or expired session loses nothing.
  useEffect(() => {
    const timer = window.setTimeout(() => writeStoredDraft(session.uid, dirty ? { baseRevision: revision, doc } : null), 400);
    return () => window.clearTimeout(timer);
  }, [doc, dirty, revision, session.uid]);

  // The world shows the draft while previewing, and keeps it when this panel is closed or the session expires.
  const docRef = useRef(doc);
  docRef.current = doc;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  // The scene only ever receives the sanitised form, exactly what visitors would get after publishing.
  useEffect(() => { if (previewing) setDraft(dirty ? normalizeDocument(doc) : null); }, [previewing, doc, dirty, setDraft]);
  useEffect(() => () => { setDraft(dirtyRef.current ? normalizeDocument(docRef.current) : null); setPreviewing(false); }, [setDraft, setPreviewing]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [tab]);

  const startPreview = useCallback(() => {
    setPreviewingState(true);
    setPreviewing(true);
  }, [setPreviewing]);
  const stopPreview = useCallback(() => {
    setPreviewingState(false);
    setPreviewing(false);
  }, [setPreviewing]);

  const previewIsland = useCallback((id: IslandId) => {
    startPreview();
    // Let the draft reach the scene before the island opens.
    window.setTimeout(() => window.dispatchEvent(new CustomEvent('admin:preview-island', { detail: id })), 160);
  }, [startPreview]);

  const requestPublish = () => {
    const found = findIssues(doc);
    if (found.length) { setPendingIssues(found); setDialog('issues'); return; }
    setDialog('publish');
  };

  const publish = async () => {
    setDialog(null);
    setPublishing(true);
    setNotice(null);
    try {
      const document = prepareForPublish(doc);
      const nextRevision = await api.publish(document, revision);
      setPublished(document, nextRevision);
      setDoc(structuredClone(document));
      setDraft(null);
      writeStoredDraft(session.uid, null);
      setNotice({ tone: 'success', text: `Publicado! A versão ${nextRevision} já aparece para todos os visitantes, em qualquer aparelho, ao recarregar o site.` });
      stopPreview();
    } catch (error) {
      if (error instanceof AdminError && error.code === 'conflict') setDialog('reload');
      setNotice({ tone: 'error', text: error instanceof AdminError ? error.message : 'Não foi possível publicar. Tente novamente.' });
    } finally {
      setPublishing(false);
    }
  };

  const discard = () => {
    setDialog(null);
    setDoc(structuredClone(published));
    setDraft(null);
    writeStoredDraft(session.uid, null);
    setNotice({ tone: 'info', text: 'Alterações descartadas. O painel voltou à versão publicada.' });
  };

  const reloadPublished = async () => {
    setDialog(null);
    try {
      const latest = await api.loadPublished();
      if (latest) { setPublished(latest.document, latest.revision); setDoc(structuredClone(latest.document)); }
      setDraft(null);
      writeStoredDraft(session.uid, null);
      setNotice({ tone: 'info', text: 'Versão publicada mais recente carregada.' });
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof AdminError ? error.message : 'Não foi possível carregar a versão publicada.' });
    }
  };

  const requestClose = () => {
    if (dialog) setDialog(null);
    else if (dirty) setDialog('exit');
    else close();
  };
  const logout = async () => {
    if (dirty && !window.confirm('Há alterações não publicadas. Elas ficam guardadas neste navegador. Sair mesmo assim?')) return;
    await signOut();
  };

  const editorProps: EditorProps = { doc, update, lang, onPreviewIsland: previewIsland };
  const active = TABS.find(item => item.id === tab) ?? TABS[0];

  if (previewing) {
    return (
      <div role="region" aria-label="Modo prévia" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[95] w-[min(94vw,640px)] rounded-2xl border border-emerald-400/50 bg-[#04110f]/95 backdrop-blur-xl shadow-2xl p-3 flex flex-wrap items-center gap-2.5">
        <p className="flex-1 min-w-[10rem] text-[11px] font-mono text-emerald-200 leading-snug">
          <strong className="block text-emerald-300">PRÉVIA {dirty ? '· não publicada' : ''}</strong>
          Navegue pelo portfólio como um visitante veria com suas alterações.
        </p>
        <Button onClick={stopPreview}><MaterialIcon name="edit" size={16} />Voltar a editar</Button>
        <Button tone="primary" disabled={!dirty || publishing} onClick={() => { stopPreview(); requestPublish(); }}>Publicar…</Button>
      </div>
    );
  }

  return (
    <AdminApiContext.Provider value={api}>
      <CinematicDialog titleId="admin-title" onClose={requestClose} layer={90}
        className="relative w-full max-w-[1240px] h-[94dvh] bg-[#0a0f16] border border-emerald-500/25 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        <div translate="no" className="contents">
        {/* ===== Header ===== */}
        <header className="shrink-0 border-b border-slate-800 bg-[#0c1219] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="min-w-0 mr-auto">
            <h2 id="admin-title" className="text-sm font-mono font-bold text-emerald-300 flex items-center gap-2">
              <span aria-hidden="true">❯</span> PAINEL DO ADMINISTRADOR
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {session.email} · {revision ? `versão publicada ${revision}` : 'nada publicado ainda (o site usa o conteúdo original)'}
            </p>
          </div>

          <div role="group" aria-label="Idioma em edição" className="inline-flex rounded-lg border border-slate-700 overflow-hidden">
            {(['pt', 'en'] as const).map(code => (
              <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)} title={`Editar em ${LANG_LABEL[code]}`}
                className={`px-3 min-h-9 text-xs font-mono cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-300 ${lang === code ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}>
                {code.toUpperCase()}
              </button>
            ))}
          </div>

          <span role="status" className={`text-[11px] font-mono px-2 py-1 rounded-md ${dirty ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
            {dirty ? '● Alterações não publicadas' : '✓ Tudo publicado'}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={startPreview}><MaterialIcon name="visibility" size={16} />Prévia</Button>
            <Button tone="danger" disabled={!dirty || publishing} onClick={() => setDialog('discard')}>Descartar</Button>
            <Button tone="primary" disabled={!dirty || publishing} onClick={requestPublish}>
              {publishing ? 'Publicando…' : <><MaterialIcon name="cloud_upload" size={16} />Publicar</>}
            </Button>
            <Button onClick={() => void logout()} title="Encerrar a sessão"><MaterialIcon name="logout" size={16} /><span className="hidden sm:inline">Sair</span></Button>
            <button type="button" onClick={requestClose} aria-label="Fechar painel" title="Fechar painel (Esc)"
              className="w-10 h-10 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300 grid place-items-center">
              <MaterialIcon name="close" size={18} />
            </button>
          </div>
        </header>

        {notice && (
          <div role={notice.tone === 'error' ? 'alert' : 'status'}
            className={`shrink-0 px-4 py-2.5 text-xs flex items-start gap-3 border-b ${notice.tone === 'error' ? 'bg-rose-500/10 text-rose-200 border-rose-500/30' : notice.tone === 'success' ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30' : 'bg-sky-500/10 text-sky-200 border-sky-500/30'}`}>
            <span className="flex-1 leading-relaxed">{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dispensar aviso" className="cursor-pointer opacity-70 hover:opacity-100"><MaterialIcon name="close" size={16} /></button>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* ===== Navigation ===== */}
          <nav aria-label="Seções do painel" className="shrink-0 md:w-52 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0b1017] overflow-x-auto md:overflow-y-auto">
            <ul className="flex md:flex-col gap-1 p-2">
              {TABS.map(item => (
                <li key={item.id} className="shrink-0">
                  <button type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 min-h-10 rounded-lg text-xs font-mono text-left whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300 ${tab === item.id ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40' : 'text-slate-300 border border-transparent hover:bg-slate-800/60'}`}>
                    <MaterialIcon name={item.icon} size={18} />
                    <span className="flex-1">{item.label}</span>
                    {issueCount[item.id] ? <span aria-label={`${issueCount[item.id]} problema(s)`} className="min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] grid place-items-center">{issueCount[item.id]}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ===== Editor ===== */}
          <div ref={scroller} data-narrative-scroll className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              {tab === 'media'
                ? <MediaLibrary draftJson={draftJson} publishedJson={publishedJson} />
                : active.render(editorProps)}
            </div>
          </div>
        </div>

        {/* ===== Confirmations ===== */}
        {dialog && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-black/70 p-4" role="presentation">
            <div role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" className="w-full max-w-md max-h-full overflow-y-auto rounded-xl border border-slate-600 bg-[#0c1219] p-5 space-y-4 shadow-2xl">
              {dialog === 'publish' && <>
                <h3 id="admin-dialog-title" className="text-base font-bold">Publicar alterações?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">Todos os visitantes passarão a ver esta versão, em qualquer aparelho, assim que recarregarem o site. Você pode editar e publicar de novo quando quiser.</p>
                <div className="flex justify-end gap-2"><Button autoFocus onClick={() => setDialog(null)}>Cancelar</Button><Button tone="primary" onClick={() => void publish()}>Publicar agora</Button></div>
              </>}
              {dialog === 'discard' && <>
                <h3 id="admin-dialog-title" className="text-base font-bold">Descartar alterações?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">Tudo o que você editou desde a última publicação será perdido. O site público não é afetado.</p>
                <div className="flex justify-end gap-2"><Button autoFocus onClick={() => setDialog(null)}>Continuar editando</Button><Button tone="danger" onClick={discard}>Descartar</Button></div>
              </>}
              {dialog === 'exit' && <>
                <h3 id="admin-dialog-title" className="text-base font-bold">Fechar o painel?</h3>
                <p className="text-xs text-slate-300 leading-relaxed">Há alterações não publicadas. Elas podem ficar guardadas neste navegador para você continuar depois, ou ser descartadas.</p>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button autoFocus onClick={() => setDialog(null)}>Continuar editando</Button>
                  <Button tone="danger" onClick={() => { discard(); close(); }}>Descartar e fechar</Button>
                  <Button tone="primary" onClick={close}>Guardar rascunho e fechar</Button>
                </div>
              </>}
              {dialog === 'reload' && <>
                <h3 id="admin-dialog-title" className="text-base font-bold">Outra versão foi publicada</h3>
                <p className="text-xs text-slate-300 leading-relaxed">Enquanto você editava, o portfólio foi publicado de outro lugar. Para não sobrescrever aquele trabalho, carregue a versão mais recente. Seu rascunho atual será descartado.</p>
                <div className="flex justify-end gap-2"><Button autoFocus onClick={() => setDialog(null)}>Manter rascunho</Button><Button tone="danger" onClick={() => void reloadPublished()}>Carregar versão publicada</Button></div>
              </>}
              {dialog === 'issues' && <>
                <h3 id="admin-dialog-title" className="text-base font-bold">Corrija antes de publicar</h3>
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {pendingIssues.map((issue, index) => (
                    <li key={index} className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-xs">
                      <strong className="block text-rose-200">{issue.where}</strong>
                      <span className="text-slate-300">{issue.message}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end gap-2">
                  <Button tone="primary" autoFocus onClick={() => { const first = pendingIssues[0]; setDialog(null); if (first && TABS.some(item => item.id === first.section)) setTab(first.section as Tab['id']); }}>Ir ao primeiro problema</Button>
                </div>
              </>}
            </div>
          </div>
        )}
        </div>
      </CinematicDialog>
    </AdminApiContext.Provider>
  );
}
