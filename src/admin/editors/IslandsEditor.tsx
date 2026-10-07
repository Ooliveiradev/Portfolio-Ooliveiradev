import React from 'react';
import { MaterialIcon } from '../../components/ui/MaterialIcon';
import { pick } from '../../content/model';
import { Button, ColorField, Grid, ItemList, LocalizedField, SectionHeader, Toggle } from '../ui';
import { listOps, type EditorProps } from './common';

const KIND: Record<string, string> = {
  projects: 'Lista os projetos', experience: 'Linha do tempo da carreira', skills: 'Grupos de habilidades',
  education: 'Formação e certificados', about: 'Perfil, contato e formulário', analytics: 'Painel de visitas (dados reais, sem simulação)',
};

export const IslandsEditor: React.FC<EditorProps> = ({ doc, update, lang, onPreviewIsland }) => {
  const ops = listOps(update, { select: d => d.islands, visibility: true, keepOneVisible: true });
  return (
  <>
    <SectionHeader
      title="Seções (ilhas)"
      description="Cada ilha é uma seção do portfólio. Reordene, oculte as que não quiser mostrar e personalize nome, frase, texto de abertura e cor. Ilhas ocultas somem do mapa, da tela inicial e das conquistas."
    />
    <ItemList
      items={doc.islands}
      ops={ops}
      removable={false}
      itemLabel="ilha"
      title={island => pick(island.name, lang) || island.id}
      subtitle={island => KIND[island.id]}
      hidden={island => !island.visible}
      body={(island, index) => (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Toggle label="Mostrar esta ilha no site" checked={island.visible}
              onChange={() => ops.toggleVisible?.(index)}
              hint={island.visible && doc.islands.filter(item => item.visible).length <= 1 ? 'É a única ilha visível; mantenha pelo menos uma.' : undefined} />
            <Button small onClick={() => onPreviewIsland(island.id)} disabled={!island.visible}>
              <MaterialIcon name="visibility" size={14} />Ver esta ilha na prévia
            </Button>
          </div>
          <Grid>
            <LocalizedField label="Nome" value={island.name} lang={lang} onChange={value => update(d => { d.islands[index].name = value; })} maxLength={80} />
            <LocalizedField label="Título do desafio" value={island.challengeTitle} lang={lang} onChange={value => update(d => { d.islands[index].challengeTitle = value; })} maxLength={80} />
          </Grid>
          <LocalizedField label="Frase de destaque" value={island.tagline} lang={lang} onChange={value => update(d => { d.islands[index].tagline = value; })} multiline rows={2} maxLength={300} />
          {island.id !== 'analytics' && island.id !== 'about' && (
            <LocalizedField label="Texto de abertura" value={island.intro} lang={lang} onChange={value => update(d => { d.islands[index].intro = value; })} multiline rows={3} hint="Parágrafo exibido no topo da janela da ilha. Deixe vazio para não mostrar." />
          )}
          {island.id === 'about' && <p className="text-[11px] text-slate-500">O texto de abertura desta ilha é o subtítulo do Perfil.</p>}
          <ColorField label="Cor da ilha" value={island.color} onChange={value => update(d => { d.islands[index].color = value; })} hint="Usada no mapa, nos atalhos e no brilho da ilha." />
        </>
      )}
    />
  </>
  );
};
