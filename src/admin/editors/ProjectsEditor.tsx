import React, { useState } from 'react';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';
import { DEFAULT_ACCENT, emptyList, emptyText, newId, pick, type ProjectDoc } from '../../content/model';
import { MediaListEditor } from '../MediaEditors';
import {
  Button, ColorField, Grid, ItemList, LocalizedField, LocalizedLines, SectionHeader, SubSection, TagsField,
  TextAreaField, TextField, Toggle, UrlField,
} from '../ui';
import { cloneWithNewIds, listOps, type EditorProps } from './common';

const makeProject = (): ProjectDoc => ({
  id: newId('project'),
  visible: true,
  featured: false,
  accentColor: DEFAULT_ACCENT,
  title: { pt: 'Novo projeto', en: 'New project' },
  category: emptyText(), role: emptyText(), statusBadge: emptyText(), shortDesc: emptyText(), description: emptyText(), metrics: emptyText(),
  tags: [], liveUrl: '', githubUrl: '', stats: [], highlights: emptyList(),
  architecture: { overview: emptyText(), flow: emptyList(), database: emptyText(), security: emptyList() },
  quickStart: { cloneCmd: '', installCmd: '', runCmd: '', envExample: '' },
  readme: emptyText(),
  media: [],
});

const ReadmeEditor: React.FC<{ project: ProjectDoc; index: number } & Pick<EditorProps, 'update' | 'lang'>> = ({ project, index, update, lang }) => {
  const [preview, setPreview] = useState(false);
  return (
    <SubSection title="README" description="Texto em Markdown exibido na aba principal da janela do projeto. Se ficar vazio, a aba não aparece.">
      <div className="flex justify-end">
        <Button small onClick={() => setPreview(value => !value)} aria-pressed={preview}>{preview ? 'Voltar a editar' : 'Ver como ficará'}</Button>
      </div>
      {preview
        ? <div className="rounded-lg border border-slate-700 bg-[#090d16] p-5 max-h-[28rem] overflow-y-auto"><MarkdownViewer content={pick(project.readme, lang)} accentColor={project.accentColor} /></div>
        : <LocalizedField label="Conteúdo (Markdown)" value={project.readme} lang={lang} multiline rows={16} maxLength={60000} mono
            onChange={value => update(d => { d.projects[index].readme = value; })}
            hint="Títulos com #, listas com -, código entre crases, links [texto](https://…)." />}
    </SubSection>
  );
};

export const ProjectsEditor: React.FC<EditorProps> = ({ doc, update, lang, onPreviewIsland }) => (
  <>
    <SectionHeader
      title="Projetos"
      description="Adicione, edite, reordene ou oculte projetos. Todo bloco deixado em branco simplesmente não aparece para os visitantes: sem mídia, não há galeria; sem arquitetura, não há aba de arquitetura."
      actions={<Button small onClick={() => onPreviewIsland('projects')}>Ver ilha de projetos na prévia</Button>}
    />
    <ItemList
      items={doc.projects}
      ops={listOps(update, {
        select: d => d.projects,
        make: makeProject,
        clone: project => { const copy = cloneWithNewIds(project, 'project'); copy.title = { pt: `${project.title.pt} (cópia)`, en: `${project.title.en} (copy)` }; return copy; },
        visibility: true,
      })}
      itemLabel="projeto"
      addLabel="Novo projeto"
      emptyLabel="Nenhum projeto. A ilha de projetos mostrará apenas um aviso de novidades."
      defaultOpen
      title={project => pick(project.title, lang)}
      subtitle={project => pick(project.category, lang) || undefined}
      hidden={project => !project.visible}
      body={(project, index) => {
        const set = <K extends keyof ProjectDoc>(key: K, value: ProjectDoc[K]) => update(d => { d.projects[index][key] = value; });
        return (
          <>
            <SubSection title="Informações">
              <Grid>
                <LocalizedField label="Título" value={project.title} lang={lang} onChange={value => set('title', value)} maxLength={120} />
                <LocalizedField label="Categoria" value={project.category} lang={lang} onChange={value => set('category', value)} maxLength={120} placeholder="Ex.: Fintech & Gestão Pessoal" />
                <LocalizedField label="Sua função" value={project.role} lang={lang} onChange={value => set('role', value)} maxLength={120} />
                <LocalizedField label="Selo de status" value={project.statusBadge} lang={lang} onChange={value => set('statusBadge', value)} maxLength={120} placeholder="Ex.: Em produção" />
              </Grid>
              <LocalizedField label="Descrição curta (cartão)" value={project.shortDesc} lang={lang} onChange={value => set('shortDesc', value)} multiline rows={2} maxLength={500} />
              <LocalizedField label="Descrição completa" value={project.description} lang={lang} onChange={value => set('description', value)} multiline rows={5} />
              <LocalizedField label="Resultado em destaque" value={project.metrics} lang={lang} onChange={value => set('metrics', value)} maxLength={300} hint="Frase curta mostrada com ⚡ no cartão." />
            </SubSection>

            <SubSection title="Links e destaque">
              <Grid>
                <UrlField label="Repositório (GitHub)" value={project.githubUrl} onChange={value => set('githubUrl', value)} />
                <UrlField label="Projeto no ar (demo)" value={project.liveUrl} onChange={value => set('liveUrl', value)} />
              </Grid>
              <Grid>
                <ColorField label="Cor de destaque do projeto" value={project.accentColor} onChange={value => set('accentColor', value)} />
                <div className="pt-6"><Toggle label="Marcar como projeto em destaque" checked={project.featured} onChange={value => set('featured', value)} /></div>
              </Grid>
            </SubSection>

            <SubSection title="Tecnologias usadas" description="Aparecem no cartão do projeto e na aba de visão geral.">
              <TagsField label="Tecnologias" value={project.tags} onChange={value => set('tags', value)} placeholder="Ex.: React, TypeScript — Enter para adicionar" />
            </SubSection>

            <SubSection title="Indicadores" description="Pequenos cartões de números e fatos (ex.: “Economia de tempo — 94% mais rápido”).">
              <ItemList
                items={project.stats}
                ops={listOps(update, {
                  select: d => d.projects[index].stats,
                  make: () => ({ id: newId('stat'), icon: 'bolt', label: emptyText(), value: emptyText() }),
                  max: 12,
                })}
                itemLabel="indicador"
                title={stat => pick(stat.label, lang) || pick(stat.value, lang)}
                subtitle={stat => pick(stat.value, lang) || undefined}
                body={(stat, statIndex) => (
                  <Grid>
                    <LocalizedField label="Rótulo" value={stat.label} lang={lang} onChange={value => update(d => { d.projects[index].stats[statIndex].label = value; })} maxLength={80} />
                    <LocalizedField label="Valor" value={stat.value} lang={lang} onChange={value => update(d => { d.projects[index].stats[statIndex].value = value; })} maxLength={120} />
                    <TextField label="Ícone" value={stat.icon} onChange={value => update(d => { d.projects[index].stats[statIndex].icon = value.replace(/[^a-z0-9_]/g, ''); })} mono maxLength={40}
                      hint="Nome de um ícone do Material Symbols (ex.: speed, timer, devices). Vazio = sem ícone." />
                  </Grid>
                )}
              />
            </SubSection>

            <SubSection title="Destaques de engenharia" description="Lista de pontos fortes exibida na aba de visão geral.">
              <LocalizedLines label="Destaques" value={project.highlights} lang={lang} onChange={value => set('highlights', value)} multiline addLabel="Adicionar destaque" />
            </SubSection>

            <SubSection title="Arquitetura" description="Deixe tudo vazio para esconder a aba de arquitetura.">
              <LocalizedField label="Visão geral" value={project.architecture.overview} lang={lang} multiline rows={3}
                onChange={value => update(d => { d.projects[index].architecture.overview = value; })} />
              <LocalizedLines label="Fluxo de dados (passos)" value={project.architecture.flow} lang={lang} addLabel="Adicionar passo"
                onChange={value => update(d => { d.projects[index].architecture.flow = value; })} />
              <LocalizedField label="Banco de dados e persistência" value={project.architecture.database} lang={lang} multiline rows={2}
                onChange={value => update(d => { d.projects[index].architecture.database = value; })} />
              <LocalizedLines label="Segurança e resiliência" value={project.architecture.security} lang={lang} addLabel="Adicionar item"
                onChange={value => update(d => { d.projects[index].architecture.security = value; })} />
            </SubSection>

            <SubSection title="Terminal & Quickstart" description="Comandos para rodar o projeto. Deixe os três primeiros vazios para esconder a aba.">
              <Grid>
                <TextField label="1. Clonar" mono value={project.quickStart.cloneCmd} maxLength={1000} onChange={value => update(d => { d.projects[index].quickStart.cloneCmd = value; })} placeholder="git clone https://github.com/…" />
                <TextField label="2. Instalar" mono value={project.quickStart.installCmd} maxLength={1000} onChange={value => update(d => { d.projects[index].quickStart.installCmd = value; })} placeholder="cd projeto && npm install" />
                <TextField label="3. Rodar" mono value={project.quickStart.runCmd} maxLength={1000} onChange={value => update(d => { d.projects[index].quickStart.runCmd = value; })} placeholder="npm run dev" />
              </Grid>
              <TextAreaField label="4. Variáveis de ambiente (opcional)" mono rows={4} value={project.quickStart.envExample} onChange={value => update(d => { d.projects[index].quickStart.envExample = value; })}
                hint="Use valores de exemplo. Nunca coloque chaves ou senhas reais aqui: este texto é público." />
            </SubSection>

            <ReadmeEditor project={project} index={index} update={update} lang={lang} />

            <SubSection title="Fotos e vídeos">
              <MediaListEditor title="Galeria do projeto" items={project.media} lang={lang} onChange={items => set('media', items)} />
            </SubSection>
          </>
        );
      }}
    />
  </>
);
