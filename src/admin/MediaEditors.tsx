import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { MaterialIcon } from '../components/ui/MaterialIcon';
import { newId, type LocalizedText, type MediaDoc } from '../content/model';
import { isSafeLink, isSafeMediaUrl } from '../content/validation';
import { AdminError, type AdminApi } from '../firebase/admin';
import { MEDIA_ACCEPT, type MediaCategory } from '../firebase/mediaRules';
import { uploadFile, type UploadResult } from './uploads';
import { Button, Field, IconButton, LocalizedField, arrayMove, inputClass, type Lang } from './ui';

export const AdminApiContext = createContext<AdminApi | null>(null);
const useApi = (): AdminApi => {
  const api = useContext(AdminApiContext);
  if (!api) throw new Error('AdminApiContext missing');
  return api;
};

interface UploadState { name: string; progress: number; error?: string }

/** File picker that validates and uploads, reporting progress and errors next to the button. */
export const UploadButton: React.FC<{
  label: string; categories: MediaCategory[]; multiple?: boolean; disabled?: boolean;
  onUploaded: (results: UploadResult[]) => void; tone?: 'primary' | 'secondary';
}> = ({ label, categories, multiple, disabled, onUploaded, tone = 'secondary' }) => {
  const api = useApi();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const busy = uploads.some(item => !item.error && item.progress < 1);

  const handle = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, multiple ? 12 : 1);
    setUploads(list.map(file => ({ name: file.name, progress: 0 })));
    const done: UploadResult[] = [];
    await Promise.all(list.map(async (file, index) => {
      const patch = (change: Partial<UploadState>) => setUploads(current => current.map((item, i) => (i === index ? { ...item, ...change } : item)));
      try {
        done.push(await uploadFile(api, file, categories, fraction => patch({ progress: Math.min(0.99, fraction) })));
        patch({ progress: 1 });
      } catch (error) {
        patch({ error: error instanceof AdminError ? error.message : 'Não foi possível enviar o arquivo.' });
      }
    }));
    if (done.length) onUploaded(done);
    if (input.current) input.current.value = '';
    window.setTimeout(() => setUploads(current => current.filter(item => item.error)), 1800);
  };

  const accept = categories.map(category => MEDIA_ACCEPT[category]).join(',');
  return (
    <div className="space-y-2">
      <input ref={input} id={inputId} type="file" accept={accept} multiple={multiple} className="sr-only" tabIndex={-1}
        onChange={event => { void handle(event.target.files); }} />
      <Button tone={tone} disabled={disabled || busy} onClick={() => input.current?.click()}>
        <MaterialIcon name="upload" size={16} />{busy ? 'Enviando…' : label}
      </Button>
      <ul aria-live="polite" className="space-y-1">
        {uploads.map((item, index) => (
          <li key={`${item.name}-${index}`} className={`text-[11px] font-mono ${item.error ? 'text-rose-300' : 'text-slate-400'}`}>
            {item.error ? `✕ ${item.name}: ${item.error}` : `${item.progress >= 1 ? '✓' : '…'} ${item.name}${item.progress < 1 ? ` ${Math.round(item.progress * 100)}%` : ''}`}
            {!item.error && item.progress < 1 && (
              <span className="block h-1 mt-1 rounded bg-slate-800 overflow-hidden"><span className="block h-full bg-emerald-400 transition-all" style={{ width: `${Math.round(item.progress * 100)}%` }} /></span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Images and videos for a project or certificate. Nothing is shown to visitors when this list is empty. */
export const MediaListEditor: React.FC<{
  title: string; items: MediaDoc[]; onChange: (items: MediaDoc[]) => void; lang: Lang; allowVideo?: boolean; hint?: string;
}> = ({ title, items, onChange, lang, allowVideo = true, hint }) => {
  const patch = (index: number, change: Partial<MediaDoc>) => onChange(items.map((item, i) => (i === index ? { ...item, ...change } : item)));
  return (
    <div className="space-y-3">
      <div>
        <h5 className="text-[11px] font-mono uppercase tracking-wide text-slate-400">{title}</h5>
        <p className="text-[11px] text-slate-500 mt-1">{hint ?? (allowVideo ? 'Imagens (JPG, PNG, WebP, GIF, AVIF até 5 MB) e vídeos (MP4, WebM até 50 MB). Se não adicionar nada, nenhuma galeria aparece.' : 'Imagens (JPG, PNG, WebP, GIF, AVIF até 5 MB). Se não adicionar nada, nenhuma galeria aparece.')}</p>
      </div>
      {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-[11px] text-slate-500">Nenhuma mídia. A galeria fica oculta no site.</p>}
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-slate-700/80 bg-[#0c1219] p-3 flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-36 shrink-0">
              <div className="aspect-[16/10] rounded-md overflow-hidden bg-black/50 border border-slate-800 grid place-items-center">
                {item.kind === 'video' && !item.thumbnail
                  ? <MaterialIcon name="movie" size={32} className="text-slate-500" />
                  : <img src={item.thumbnail || item.src} alt={item.alt[lang] || item.caption[lang] || ''} className="w-full h-full object-contain" />}
              </div>
              <p className="mt-1 text-[10px] font-mono text-slate-500 flex items-center gap-1"><MaterialIcon name={item.kind === 'video' ? 'videocam' : 'image'} size={12} />{item.kind === 'video' ? 'Vídeo' : 'Imagem'}</p>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <LocalizedField label="Legenda" value={item.caption} lang={lang} onChange={caption => patch(index, { caption })} maxLength={300} />
              <LocalizedField label={item.kind === 'video' ? 'Descrição do vídeo (acessibilidade)' : 'Texto alternativo (acessibilidade)'} value={item.alt} lang={lang} onChange={alt => patch(index, { alt })} maxLength={300}
                hint="Descreva o que aparece para quem usa leitor de tela." />
            </div>
            <div className="flex sm:flex-col gap-1 justify-end sm:justify-start">
              <IconButton label="Mover para cima" disabled={index === 0} onClick={() => onChange(arrayMove(items, index, index - 1))}><MaterialIcon name="arrow_upward" size={16} /></IconButton>
              <IconButton label="Mover para baixo" disabled={index === items.length - 1} onClick={() => onChange(arrayMove(items, index, index + 1))}><MaterialIcon name="arrow_downward" size={16} /></IconButton>
              <IconButton label="Remover mídia" danger onClick={() => onChange(items.filter((_, i) => i !== index))}><MaterialIcon name="delete" size={16} /></IconButton>
            </div>
          </li>
        ))}
      </ul>
      <UploadButton label={allowVideo ? 'Enviar imagens ou vídeos' : 'Enviar imagens'} categories={allowVideo ? ['image', 'video'] : ['image']} multiple
        onUploaded={results => onChange([...items, ...results.map((result): MediaDoc => ({
          id: newId('media'), kind: result.kind === 'video' ? 'video' : 'image', src: result.url, thumbnail: result.thumbnail,
          alt: { pt: '', en: '' } as LocalizedText, caption: { pt: '', en: '' } as LocalizedText,
        }))].slice(0, 60))} />
    </div>
  );
};

/** A single file reference: either uploaded here or (for documents) pasted as an external link. */
export const FileField: React.FC<{
  label: string; value: string; onChange: (url: string) => void; category: MediaCategory; hint?: string;
  allowExternal?: boolean; emptyLabel?: string; preview?: 'image' | 'link';
}> = ({ label, value, onChange, category, hint, allowExternal, emptyLabel = 'Nada enviado.', preview = 'link' }) => {
  const valid = !value || (allowExternal ? isSafeLink(value) || isSafeMediaUrl(value) : isSafeMediaUrl(value));
  return (
    <div className="space-y-2">
      <Field label={label} hint={hint} error={valid ? undefined : 'Endereço não aceito. Envie o arquivo pelo painel.'}>
        {value && preview === 'image' && <img src={value} alt="" className="w-24 h-24 rounded-full object-cover border border-slate-700 mb-2" />}
        {allowExternal
          ? <input aria-label={label} value={value} onChange={event => onChange(event.target.value.trim())} placeholder="https://… ou envie um arquivo" className={`${inputClass} font-mono`} spellCheck={false} />
          : <p className="text-[11px] font-mono text-slate-400 break-all">{value ? decodeURIComponent(value.split('/').pop()?.split('?')[0] ?? value) : emptyLabel}</p>}
      </Field>
      <div className="flex flex-wrap gap-2 items-start">
        <UploadButton label={value ? 'Substituir arquivo' : 'Enviar arquivo'} categories={[category]} onUploaded={([result]) => onChange(result.url)} />
        {value && <Button tone="danger" onClick={() => onChange('')}>Remover</Button>}
      </div>
    </div>
  );
};
