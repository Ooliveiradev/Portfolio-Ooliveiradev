import React, { useId, useState } from 'react';
import type { LocalizedList, LocalizedText } from '../content/model';
import { isSafeLink } from '../content/validation';
import { MaterialIcon } from '../components/ui/MaterialIcon';

export type Lang = 'pt' | 'en';
export const OTHER: Record<Lang, Lang> = { pt: 'en', en: 'pt' };
export const LANG_LABEL: Record<Lang, string> = { pt: 'Português', en: 'English' };

export const inputClass =
  'w-full bg-[#07090e] border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 ' +
  'focus:outline-none focus:border-emerald-400 focus-visible:ring-1 focus-visible:ring-emerald-400/60 disabled:opacity-50';
const invalidClass = ' border-rose-500/70 focus:border-rose-400';

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';
const buttonTones: Record<ButtonTone, string> = {
  primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
  secondary: 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80',
  danger: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40',
  ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/60',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; small?: boolean }> = ({
  tone = 'secondary', small, className = '', type = 'button', ...props
}) => (
  <button
    type={type}
    {...props}
    className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-mono transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ` +
      `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${small ? 'px-2.5 min-h-8 text-[11px]' : 'px-3.5 min-h-10 text-xs'} ${buttonTones[tone]} ${className}`}
  />
);

export const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; danger?: boolean }> = ({
  label, danger, className = '', type = 'button', children, ...props
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    {...props}
    className={`w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-md text-sm transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ` +
      `focus-visible:outline-2 focus-visible:outline-emerald-300 ${danger ? 'text-rose-300 hover:bg-rose-500/15' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'} ${className}`}
  >
    {children}
  </button>
);

export const Field: React.FC<{ label: string; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode; className?: string }> = ({
  label, hint, error, htmlFor, children, className = '',
}) => (
  <div className={`space-y-1.5 min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className="block text-[11px] font-mono uppercase tracking-wide text-slate-400">{label}</label>
    {children}
    {error ? <p role="alert" className="text-[11px] text-rose-300">{error}</p> : hint && <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>}
  </div>
);

interface TextProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'url' | 'tel';
  maxLength?: number;
  mono?: boolean;
  className?: string;
}

export const TextField: React.FC<TextProps> = ({ label, value, onChange, hint, error, placeholder, type = 'text', maxLength = 300, mono, className }) => {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <input id={id} type={type} value={value} maxLength={maxLength} placeholder={placeholder} spellCheck={!mono && type === 'text'}
        onChange={event => onChange(event.target.value)} aria-invalid={Boolean(error)}
        className={inputClass + (mono ? ' font-mono' : '') + (error ? invalidClass : '')} />
    </Field>
  );
};

/** A link field that warns as soon as the address would be rejected on publish. */
export const UrlField: React.FC<Omit<TextProps, 'type' | 'error'>> = props => (
  <TextField {...props} type="url" maxLength={2048} mono placeholder={props.placeholder ?? 'https://'}
    error={props.value && !isSafeLink(props.value) ? 'Use um endereço completo começando com https://' : undefined} />
);

export const TextAreaField: React.FC<TextProps & { rows?: number }> = ({ label, value, onChange, hint, error, placeholder, rows = 4, maxLength = 6000, mono, className }) => {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id} className={className}>
      <textarea id={id} value={value} rows={rows} maxLength={maxLength} placeholder={placeholder} spellCheck={!mono}
        onChange={event => onChange(event.target.value)} aria-invalid={Boolean(error)}
        className={inputClass + ' resize-y leading-relaxed' + (mono ? ' font-mono' : '') + (error ? invalidClass : '')} />
    </Field>
  );
};

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; hint?: string }> = ({ label, checked, onChange, hint }) => {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-6 rounded-full shrink-0 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <label htmlFor={id} className="text-xs text-slate-200 cursor-pointer leading-snug">
        {label}
        {hint && <span className="block text-[11px] text-slate-500 mt-0.5">{hint}</span>}
      </label>
    </div>
  );
};

export const ColorField: React.FC<{ label: string; value: string; onChange: (value: string) => void; hint?: string }> = ({ label, value, onChange, hint }) => {
  const id = useId();
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <Field label={label} hint={hint} htmlFor={id} error={valid ? undefined : 'Use o formato #RRGGBB.'}>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} (seletor)`} value={valid ? value : '#38bdf8'} onChange={event => onChange(event.target.value)}
          className="w-10 h-9 p-0.5 rounded-lg bg-[#07090e] border border-slate-700/80 cursor-pointer" />
        <input id={id} value={value} maxLength={7} onChange={event => onChange(event.target.value)} spellCheck={false}
          className={`${inputClass} font-mono max-w-32 ${valid ? '' : invalidClass}`} />
      </div>
    </Field>
  );
};

export const RangeField: React.FC<{ label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }> = ({ label, value, onChange, min = 0, max = 100 }) => {
  const id = useId();
  return (
    <Field label={`${label}: ${value}%`} htmlFor={id}>
      <input id={id} type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} className="w-full accent-emerald-400" />
    </Field>
  );
};

export const SelectField: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => {
  const id = useId();
  return (
    <Field label={label} htmlFor={id}>
      <select id={id} value={value} onChange={event => onChange(event.target.value)} className={inputClass}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
};

/** One text in both languages: the language being edited is shown, the other one is a click away. */
export const LocalizedField: React.FC<{
  label: string; value: LocalizedText; lang: Lang; onChange: (value: LocalizedText) => void;
  multiline?: boolean; rows?: number; hint?: string; placeholder?: string; maxLength?: number; mono?: boolean;
}> = ({ label, value, lang, onChange, multiline, rows, hint, placeholder, maxLength, mono }) => {
  const other = OTHER[lang];
  const set = (next: string) => onChange({ ...value, [lang]: next });
  const missing = !value[lang].trim() && value[other].trim();
  const common = { label: `${label} · ${lang.toUpperCase()}`, value: value[lang], onChange: set, hint, placeholder, maxLength, mono };
  return (
    <div className="space-y-1.5 min-w-0">
      {multiline ? <TextAreaField {...common} rows={rows} /> : <TextField {...common} />}
      {missing && (
        <p className="flex flex-wrap items-center gap-2 text-[11px] text-amber-300/90">
          <span>Sem texto em {LANG_LABEL[lang]}: o site mostra a versão em {LANG_LABEL[other]}.</span>
          <button type="button" onClick={() => set(value[other])} className="underline underline-offset-2 hover:text-amber-200 cursor-pointer">
            Copiar de {other.toUpperCase()}
          </button>
        </p>
      )}
    </div>
  );
};

const move = <T,>(items: T[], from: number, to: number): T[] => {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
};

/** A list of short lines (highlights, steps…) in the language being edited. */
export const LocalizedLines: React.FC<{
  label: string; value: LocalizedList; lang: Lang; onChange: (value: LocalizedList) => void; addLabel?: string; hint?: string; multiline?: boolean;
}> = ({ label, value, lang, onChange, addLabel = 'Adicionar linha', hint, multiline }) => {
  const items = value[lang];
  const set = (next: string[]) => onChange({ ...value, [lang]: next });
  return (
    <fieldset className="space-y-2 min-w-0">
      <legend className="text-[11px] font-mono uppercase tracking-wide text-slate-400">{label} · {lang.toUpperCase()}</legend>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      {items.length === 0 && value[OTHER[lang]].length > 0 && (
        <p className="text-[11px] text-amber-300/90 flex flex-wrap gap-2">
          <span>Vazio em {LANG_LABEL[lang]}: o site mostra a versão em {LANG_LABEL[OTHER[lang]]}.</span>
          <button type="button" className="underline underline-offset-2 cursor-pointer" onClick={() => set([...value[OTHER[lang]]])}>Copiar de {OTHER[lang].toUpperCase()}</button>
        </p>
      )}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-1.5">
            <span className="mt-2.5 w-5 text-[10px] font-mono text-slate-500 text-right shrink-0">{index + 1}</span>
            {multiline
              ? <textarea aria-label={`${label} ${index + 1}`} value={item} rows={2} maxLength={1000} className={`${inputClass} resize-y`} onChange={event => set(items.map((entry, i) => (i === index ? event.target.value : entry)))} />
              : <input aria-label={`${label} ${index + 1}`} value={item} maxLength={1000} className={inputClass} onChange={event => set(items.map((entry, i) => (i === index ? event.target.value : entry)))} />}
            <IconButton label="Mover para cima" disabled={index === 0} onClick={() => set(move(items, index, index - 1))}><MaterialIcon name="arrow_upward" size={16} /></IconButton>
            <IconButton label="Mover para baixo" disabled={index === items.length - 1} onClick={() => set(move(items, index, index + 1))}><MaterialIcon name="arrow_downward" size={16} /></IconButton>
            <IconButton label="Remover linha" danger onClick={() => set(items.filter((_, i) => i !== index))}><MaterialIcon name="close" size={16} /></IconButton>
          </li>
        ))}
      </ul>
      <Button small onClick={() => set([...items, ''])} disabled={items.length >= 40}>＋ {addLabel}</Button>
    </fieldset>
  );
};

/** Short labels such as technologies. Enter or comma adds one. */
export const TagsField: React.FC<{ label: string; value: string[]; onChange: (value: string[]) => void; hint?: string; placeholder?: string }> = ({ label, value, onChange, hint, placeholder = 'Digite e pressione Enter' }) => {
  const id = useId();
  const [draft, setDraft] = useState('');
  const commit = () => {
    const parts = draft.split(',').map(part => part.trim()).filter(Boolean);
    if (parts.length) onChange([...value, ...parts.filter(part => !value.includes(part))].slice(0, 40));
    setDraft('');
  };
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <ul className="flex flex-wrap gap-1.5 mb-1.5" aria-label={label}>
        {value.map((tag, index) => (
          <li key={tag} className="inline-flex items-center gap-0.5 pl-2 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-200">
            <span className="py-1">{tag}</span>
            <IconButton label={`Mover ${tag} para trás`} disabled={index === 0} className="!w-6 !h-6" onClick={() => onChange(move(value, index, index - 1))}><MaterialIcon name="chevron_left" size={16} /></IconButton>
            <IconButton label={`Mover ${tag} para frente`} disabled={index === value.length - 1} className="!w-6 !h-6" onClick={() => onChange(move(value, index, index + 1))}><MaterialIcon name="chevron_right" size={16} /></IconButton>
            <IconButton label={`Remover ${tag}`} danger className="!w-6 !h-6" onClick={() => onChange(value.filter(item => item !== tag))}><MaterialIcon name="close" size={16} /></IconButton>
          </li>
        ))}
      </ul>
      <input id={id} value={draft} placeholder={placeholder} maxLength={120} className={inputClass}
        onChange={event => setDraft(event.target.value)} onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); commit(); }
          else if (event.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }} />
    </Field>
  );
};

export interface ListOps {
  move?: (index: number, direction: -1 | 1) => void;
  remove?: (index: number) => void;
  duplicate?: (index: number) => void;
  toggleVisible?: (index: number) => void;
  add?: () => void;
}

/** Collapsible, reorderable cards. Structure only: the editor decides what goes inside. */
export function ItemList<T extends { id: string }>({
  items, ops, title, subtitle, body, hidden, addLabel, emptyLabel, itemLabel = 'item', defaultOpen = false, removable = true,
}: {
  items: T[]; ops: ListOps; title: (item: T, index: number) => string; subtitle?: (item: T) => string | undefined;
  body: (item: T, index: number) => React.ReactNode; hidden?: (item: T) => boolean;
  addLabel?: string; emptyLabel?: string; itemLabel?: string; defaultOpen?: boolean; removable?: boolean;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(defaultOpen && items[0] ? [items[0].id] : []));
  const [confirming, setConfirming] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-xs text-slate-400">{emptyLabel ?? `Nenhum ${itemLabel} ainda.`}</p>}
      <ul className="space-y-2.5">
        {items.map((item, index) => {
          const isOpen = open.has(item.id);
          const isHidden = hidden?.(item) ?? false;
          const panelId = `panel-${item.id}`;
          return (
            <li key={item.id} className={`rounded-xl border bg-[#0c1219] ${isHidden ? 'border-slate-800 opacity-80' : 'border-slate-700/80'}`}>
              <div className="flex items-center gap-1 p-1.5">
                <button type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)}
                  className="flex-1 min-w-0 flex items-center gap-2 text-left px-2 py-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-300">
                  <span aria-hidden="true" className={`text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-slate-100 truncate">{title(item, index) || `(sem título)`}</span>
                    {subtitle?.(item) && <span className="block text-[11px] text-slate-500 truncate">{subtitle(item)}</span>}
                  </span>
                  {isHidden && <span className="ml-auto shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">oculto</span>}
                </button>
                {ops.toggleVisible && (
                  <IconButton label={isHidden ? 'Mostrar no site' : 'Ocultar do site'} onClick={() => ops.toggleVisible!(index)}>{isHidden ? <MaterialIcon name="visibility_off" size={16} /> : <MaterialIcon name="visibility" size={16} />}</IconButton>
                )}
                {ops.move && <IconButton label="Mover para cima" disabled={index === 0} onClick={() => ops.move!(index, -1)}><MaterialIcon name="arrow_upward" size={16} /></IconButton>}
                {ops.move && <IconButton label="Mover para baixo" disabled={index === items.length - 1} onClick={() => ops.move!(index, 1)}><MaterialIcon name="arrow_downward" size={16} /></IconButton>}
                {ops.duplicate && <IconButton label="Duplicar" onClick={() => ops.duplicate!(index)}><MaterialIcon name="content_copy" size={16} /></IconButton>}
                {removable && ops.remove && (confirming === item.id
                  ? <Button small tone="danger" onClick={() => { setConfirming(null); ops.remove!(index); }} onBlur={() => setConfirming(null)} autoFocus>Remover?</Button>
                  : <IconButton label="Remover" danger onClick={() => setConfirming(item.id)}><MaterialIcon name="delete" size={16} /></IconButton>)}
              </div>
              {isOpen && <div id={panelId} className="border-t border-slate-800 p-4 space-y-5">{body(item, index)}</div>}
            </li>
          );
        })}
      </ul>
      {ops.add && <Button onClick={ops.add}>＋ {addLabel ?? `Adicionar ${itemLabel}`}</Button>}
    </div>
  );
}

export const SubSection: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="space-y-3 rounded-lg border border-slate-800 bg-[#090d14] p-4">
    <header>
      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">{title}</h4>
      {description && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{description}</p>}
    </header>
    {children}
  </section>
);

export const SectionHeader: React.FC<{ title: string; description: string; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <header className="flex flex-wrap items-start justify-between gap-3 mb-5">
    <div className="min-w-0 max-w-2xl">
      <h3 className="text-lg font-sans font-bold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{description}</p>
    </div>
    {actions}
  </header>
);

export const Grid: React.FC<{ cols?: 1 | 2 | 3; children: React.ReactNode }> = ({ cols = 2, children }) => (
  <div className={`grid grid-cols-1 gap-4 ${cols === 2 ? 'md:grid-cols-2' : cols === 3 ? 'md:grid-cols-3' : ''}`}>{children}</div>
);

/** Immutable helpers used to build ListOps on top of the panel's update function. */
export const arrayMove = move;
