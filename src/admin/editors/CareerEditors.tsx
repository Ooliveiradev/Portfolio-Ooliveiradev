import React from 'react';
import { emptyList, emptyText, newId, pick, type EducationDoc, type ExperienceDoc, type SkillCategoryDoc } from '../../content/model';
import { MediaListEditor } from '../MediaEditors';
import {
  Button, Grid, ItemList, LocalizedField, LocalizedLines, RangeField, SectionHeader, SubSection, TextField, Toggle,
} from '../ui';
import { cloneWithNewIds, listOps, type EditorProps } from './common';

const makeExperience = (): ExperienceDoc => ({
  id: newId('exp'), visible: true, role: { pt: 'Novo cargo', en: 'New role' }, company: emptyText(), period: emptyText(),
  location: emptyText(), highlights: emptyList(), techStack: emptyList(),
});

export const ExperienceEditor: React.FC<EditorProps> = ({ doc, update, lang, onPreviewIsland }) => (
  <>
    <SectionHeader title="Experiência" description="Sua linha do tempo profissional. A ordem aqui é a ordem no site (normalmente da mais recente para a mais antiga)."
      actions={<Button small onClick={() => onPreviewIsland('experience')}>Ver na prévia</Button>} />
    <ItemList
      items={doc.experience}
      ops={listOps(update, { select: d => d.experience, make: makeExperience, clone: item => cloneWithNewIds(item, 'exp'), visibility: true })}
      itemLabel="experiência" addLabel="Nova experiência" defaultOpen
      title={item => pick(item.role, lang) || pick(item.company, lang)}
      subtitle={item => [pick(item.company, lang), pick(item.period, lang)].filter(Boolean).join(' · ') || undefined}
      hidden={item => !item.visible}
      body={(item, index) => (
        <>
          <Grid>
            <LocalizedField label="Cargo" value={item.role} lang={lang} onChange={value => update(d => { d.experience[index].role = value; })} maxLength={150} />
            <LocalizedField label="Empresa" value={item.company} lang={lang} onChange={value => update(d => { d.experience[index].company = value; })} maxLength={150} />
            <LocalizedField label="Período" value={item.period} lang={lang} onChange={value => update(d => { d.experience[index].period = value; })} maxLength={80} placeholder="07/2026 – Atual" />
            <LocalizedField label="Local" value={item.location} lang={lang} onChange={value => update(d => { d.experience[index].location = value; })} maxLength={150} />
          </Grid>
          <LocalizedLines label="O que você fez" value={item.highlights} lang={lang} multiline addLabel="Adicionar atividade" onChange={value => update(d => { d.experience[index].highlights = value; })} />
          <LocalizedLines label="Tecnologias e competências" value={item.techStack} lang={lang} addLabel="Adicionar" onChange={value => update(d => { d.experience[index].techStack = value; })} />
        </>
      )}
    />
  </>
);

const makeEducation = (): EducationDoc => ({
  id: newId('edu'), visible: true, degree: { pt: 'Novo curso', en: 'New course' }, institution: emptyText(), period: emptyText(),
  description: emptyText(), skillsAcquired: emptyList(), badgeName: emptyText(), certificates: [],
});

export const EducationEditor: React.FC<EditorProps> = ({ doc, update, lang, onPreviewIsland }) => (
  <>
    <SectionHeader title="Formação" description="Graduações, cursos e certificações. Certificados em imagem formam a galeria da ilha acadêmica; sem nenhum, a galeria não aparece."
      actions={<Button small onClick={() => onPreviewIsland('education')}>Ver na prévia</Button>} />
    <ItemList
      items={doc.education}
      ops={listOps(update, { select: d => d.education, make: makeEducation, clone: item => cloneWithNewIds(item, 'edu'), visibility: true })}
      itemLabel="formação" addLabel="Nova formação" defaultOpen
      title={item => pick(item.degree, lang)}
      subtitle={item => [pick(item.institution, lang), pick(item.period, lang)].filter(Boolean).join(' · ') || undefined}
      hidden={item => !item.visible}
      body={(item, index) => (
        <>
          <Grid>
            <LocalizedField label="Curso / qualificação" value={item.degree} lang={lang} onChange={value => update(d => { d.education[index].degree = value; })} maxLength={200} />
            <LocalizedField label="Instituição" value={item.institution} lang={lang} onChange={value => update(d => { d.education[index].institution = value; })} maxLength={300} />
            <LocalizedField label="Período" value={item.period} lang={lang} onChange={value => update(d => { d.education[index].period = value; })} maxLength={80} />
            <LocalizedField label="Selo (opcional)" value={item.badgeName} lang={lang} onChange={value => update(d => { d.education[index].badgeName = value; })} maxLength={100} hint="Pequeno destaque ao lado do período." />
          </Grid>
          <LocalizedField label="Descrição" value={item.description} lang={lang} multiline rows={4} onChange={value => update(d => { d.education[index].description = value; })} />
          <LocalizedLines label="Competências adquiridas" value={item.skillsAcquired} lang={lang} addLabel="Adicionar competência" onChange={value => update(d => { d.education[index].skillsAcquired = value; })} />
          <SubSection title="Certificados e diplomas">
            <MediaListEditor title="Imagens" items={item.certificates} lang={lang} allowVideo={false} onChange={items => update(d => { d.education[index].certificates = items; })} />
          </SubSection>
        </>
      )}
    />
  </>
);

const makeCategory = (): SkillCategoryDoc => ({
  id: newId('skills'), visible: true, title: { pt: 'Novo grupo', en: 'New group' }, icon: 'Layers', skills: [],
});

export const SkillsEditor: React.FC<EditorProps> = ({ doc, update, lang, onPreviewIsland }) => (
  <>
    <SectionHeader title="Habilidades" description="Grupos de tecnologias com nível de domínio. Você controla grupos, itens, ordem e nível (0 a 100%)."
      actions={<Button small onClick={() => onPreviewIsland('skills')}>Ver na prévia</Button>} />
    <ItemList
      items={doc.skills}
      ops={listOps(update, { select: d => d.skills, make: makeCategory, clone: item => cloneWithNewIds(item, 'skills'), visibility: true })}
      itemLabel="grupo" addLabel="Novo grupo" defaultOpen
      title={item => pick(item.title, lang)}
      subtitle={item => `${item.skills.length} habilidade${item.skills.length === 1 ? '' : 's'}`}
      hidden={item => !item.visible}
      body={(category, index) => (
        <>
          <LocalizedField label="Nome do grupo" value={category.title} lang={lang} onChange={value => update(d => { d.skills[index].title = value; })} maxLength={120} />
          <SubSection title="Itens do grupo">
            <ItemList
              items={category.skills}
              ops={listOps(update, { select: d => d.skills[index].skills, make: () => ({ id: newId('skill'), name: '', level: 80, highlight: false }), max: 40 })}
              itemLabel="habilidade" addLabel="Nova habilidade"
              title={skill => skill.name}
              subtitle={skill => `${skill.level}%${skill.highlight ? ' · destaque' : ''}`}
              body={(skill, skillIndex) => (
                <>
                  <TextField label="Nome" value={skill.name} maxLength={120} onChange={value => update(d => { d.skills[index].skills[skillIndex].name = value; })} />
                  <RangeField label="Nível" value={skill.level} onChange={value => update(d => { d.skills[index].skills[skillIndex].level = value; })} />
                  <Toggle label="Destacar em negrito" checked={skill.highlight} onChange={value => update(d => { d.skills[index].skills[skillIndex].highlight = value; })} />
                </>
              )}
            />
          </SubSection>
        </>
      )}
    />
  </>
);
