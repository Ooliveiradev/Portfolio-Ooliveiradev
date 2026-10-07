import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { AdminError, type StoredMedia } from '../../firebase/admin';
import { formatBytes } from '../../firebase/mediaRules';
import { AdminApiContext, UploadButton } from '../MediaEditors';
import { Button, SectionHeader } from '../ui';

/** Every file in the storage bucket, with the ones the portfolio no longer uses flagged for clean-up. */
export const MediaLibrary: React.FC<{ draftJson: string; publishedJson: string }> = ({ draftJson, publishedJson }) => {
  const api = useContext(AdminApiContext);
  const [files, setFiles] = useState<StoredMedia[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!api) return;
    setError(null);
    try { setFiles(await api.listMedia()); }
    catch (reason) { setError(reason instanceof AdminError ? reason.message : 'Não foi possível listar os arquivos.'); setFiles([]); }
  }, [api]);
  useEffect(() => { void load(); }, [load]);

  // A file counts as used while either the published portfolio or the current draft points at it.
  const inUse = useMemo(() => {
    const haystack = `${draftJson}\n${publishedJson}`;
    return (file: StoredMedia) => haystack.includes(encodeURIComponent(file.path)) || haystack.includes(file.name);
  }, [draftJson, publishedJson]);

  const remove = async (file: StoredMedia) => {
    if (!api || !window.confirm(`Excluir “${file.name}” definitivamente? Esta ação não pode ser desfeita.`)) return;
    setBusy(file.path);
    try { await api.deleteMedia(file.path); setFiles(current => current?.filter(item => item.path !== file.path) ?? null); }
    catch (reason) { setError(reason instanceof AdminError ? reason.message : 'Não foi possível excluir o arquivo.'); }
    finally { setBusy(null); }
  };

  const copy = async (file: StoredMedia) => {
    try { await navigator.clipboard.writeText(file.url); setCopied(file.path); window.setTimeout(() => setCopied(null), 1600); } catch { /* clipboard unavailable */ }
  };

  const unused = files?.filter(file => !inUse(file)).length ?? 0;
  return (
    <>
      <SectionHeader title="Biblioteca de mídias" description="Arquivos enviados ao portfólio. Fotos e vídeos são enviados dentro dos projetos, certificados e perfil; aqui você confere o que existe e limpa o que sobrou."
        actions={<div className="flex gap-2"><Button small onClick={() => void load()}><MaterialIcon name="refresh" size={14} />Atualizar</Button><UploadButton label="Enviar arquivo" categories={['image', 'video', 'document']} multiple onUploaded={() => void load()} /></div>} />
      {error && <p role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>}
      {files === null && <p className="text-xs text-slate-400" role="status">Carregando…</p>}
      {files && files.length === 0 && !error && <p className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-xs text-slate-400">Nenhum arquivo enviado ainda.</p>}
      {files && files.length > 0 && <p className="mb-3 text-[11px] text-slate-400">{files.length} arquivo{files.length === 1 ? '' : 's'} · {unused} sem uso</p>}
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {files?.map(file => {
          const used = inUse(file);
          return (
            <li key={file.path} className="rounded-xl border border-slate-700/80 bg-[#0c1219] overflow-hidden flex flex-col">
              <div className="aspect-[16/10] bg-black/40 grid place-items-center">
                {file.contentType.startsWith('image/')
                  ? <img src={file.url} alt="" loading="lazy" className="w-full h-full object-contain" />
                  : <MaterialIcon name={file.contentType.startsWith('video/') ? 'movie' : 'description'} size={36} className="text-slate-500" />}
              </div>
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <p className="text-[11px] font-mono text-slate-200 break-all" title={file.name}>{file.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString('pt-BR')}</p>
                <p className={`text-[10px] font-mono ${used ? 'text-emerald-300' : 'text-amber-300'}`}>{used ? '● Em uso' : '○ Sem uso'}</p>
                <div className="mt-auto flex gap-2 pt-1">
                  <Button small onClick={() => void copy(file)}>{copied === file.path ? 'Copiado' : 'Copiar link'}</Button>
                  <Button small tone="danger" disabled={used || busy === file.path} onClick={() => void remove(file)} title={used ? 'Remova do portfólio antes de excluir' : 'Excluir'}>
                    {busy === file.path ? 'Excluindo…' : 'Excluir'}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
};
