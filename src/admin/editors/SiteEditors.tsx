import React, { useMemo, useState } from 'react';
import { DEFAULT_ACCENT, pick } from '../../content/model';
import { ACCENT_PRESETS, buildAccentScale } from '../../content/theme';
import { UI_TEXTS, defaultText } from '../../content/uiTexts';
import { Button, ColorField, Field, ItemList, LocalizedField, SectionHeader, SubSection, Toggle, inputClass } from '../ui';
import type { EditorProps } from './common';

export const BadgesEditor: React.FC<EditorProps> = ({ doc, update, lang }) => (
  <>
    <SectionHeader title="Conquistas" description="O jogo libera conquistas conforme o visitante explora. As regras são fixas, mas você pode reescrever o nome e a descrição de cada uma." />
    <ItemList
      items={doc.badges}
      ops={{}}
      removable={false}
      itemLabel="conquista"
      title={badge => pick(badge.title, lang)}
      subtitle={badge => pick(badge.description, lang)}
      body={(badge, index) => (
        <>
          <LocalizedField label="Nome" value={badge.title} lang={lang} onChange={value => update(d => { d.badges[index].title = value; })} maxLength={100} />
          <LocalizedField label="Descrição" value={badge.description} lang={lang} multiline rows={2} onChange={value => update(d => { d.badges[index].description = value; })} maxLength={300} />
        </>
      )}
    />
  </>
);

export const AppearanceEditor: React.FC<EditorProps> = ({ doc, update }) => {
  const accent = doc.appearance.accentColor;
  const scale = useMemo(() => buildAccentScale(accent), [accent]);
  return (
    <>
      <SectionHeader title="Aparência" description="Cor de destaque da interface e opções visuais. As cores de cada ilha ficam em Seções e a de cada projeto, em Projetos." />
      <div className="space-y-5">
        <SubSection title="Cor de destaque" description="Troca o azul-céu usado em botões, links, selos e realces de todas as janelas.">
          <ul className="flex flex-wrap gap-2" aria-label="Temas prontos">
            {ACCENT_PRESETS.map(preset => (
              <li key={preset.id}>
                <button type="button" aria-pressed={accent.toLowerCase() === preset.color}
                  onClick={() => update(d => { d.appearance.accentColor = preset.color; })}
                  className={`flex items-center gap-2 px-3 min-h-10 rounded-lg border text-xs font-mono cursor-pointer transition focus-visible:outline-2 focus-visible:outline-emerald-300 ${accent.toLowerCase() === preset.color ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200' : 'border-slate-700 text-slate-300 hover:bg-slate-800/60'}`}>
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: preset.color }} />{preset.label}
                </button>
              </li>
            ))}
          </ul>
          <ColorField label="Cor personalizada" value={accent} onChange={value => update(d => { d.appearance.accentColor = value; })} hint="Qualquer cor clara ou média funciona bem sobre o fundo escuro." />
          <div aria-hidden="true" className="flex h-6 rounded-md overflow-hidden border border-slate-700">
            {Object.entries(scale).map(([shade, color]) => <span key={shade} className="flex-1" style={{ backgroundColor: color }} />)}
          </div>
          {accent.toLowerCase() !== DEFAULT_ACCENT && <Button small onClick={() => update(d => { d.appearance.accentColor = DEFAULT_ACCENT; })}>Voltar à cor padrão</Button>}
        </SubSection>
        <SubSection title="Opções visuais">
          <Toggle label="Mostrar o trecho de código na ilha de tecnologias" checked={doc.appearance.showCodeStory} onChange={value => update(d => { d.appearance.showCodeStory = value; })}
            hint="Exibe um exemplo animado do código deste portfólio. Desligue para mostrar só as habilidades." />
        </SubSection>
      </div>
    </>
  );
};

export const TextsEditor: React.FC<EditorProps> = ({ doc, update, lang }) => {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = new Map<string, string[]>();
    for (const [key, entry] of Object.entries(UI_TEXTS)) {
      const haystack = `${entry.label} ${entry.pt} ${entry.en} ${doc.texts[key]?.pt ?? ''} ${doc.texts[key]?.en ?? ''}`.toLowerCase();
      if (needle && !haystack.includes(needle)) continue;
      result.set(entry.group, [...(result.get(entry.group) ?? []), key]);
    }
    return Array.from(result);
  }, [query, doc.texts]);

  return (
    <>
      <SectionHeader title="Textos da interface" description="Frases fixas do site: abertura, tela inicial, títulos das janelas, formulário de contato e o segredo do desenvolvedor. Use “Restaurar” para voltar ao texto original." />
      <Field label="Buscar texto" htmlFor="text-search" className="mb-5 max-w-md">
        <input id="text-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex.: formulário, abertura, destaque…" className={inputClass} />
      </Field>
      {groups.length === 0 && <p className="text-xs text-slate-400">Nenhum texto encontrado.</p>}
      <div className="space-y-5">
        {groups.map(([group, keys]) => (
          <SubSection key={group} title={group}>
            <div className="space-y-5">
              {keys.map(key => {
                const entry = UI_TEXTS[key];
                const value = doc.texts[key] ?? defaultText(key);
                const changed = key in doc.texts;
                return (
                  <div key={key} className="space-y-1.5">
                    <LocalizedField label={entry.label} value={value} lang={lang} multiline={entry.multiline} rows={entry.multiline ? 3 : undefined} maxLength={1000}
                      hint={entry.placeholders ? `Pode usar ${entry.placeholders.join(', ')}.` : entry.multiline && /\n/.test(entry.pt) ? 'Cada quebra de linha vira uma linha no site.' : undefined}
                      onChange={next => update(d => { d.texts[key] = next; })} />
                    {changed && <Button small tone="ghost" onClick={() => update(d => { delete d.texts[key]; })}>Restaurar texto original</Button>}
                  </div>
                );
              })}
            </div>
          </SubSection>
        ))}
      </div>
    </>
  );
};
