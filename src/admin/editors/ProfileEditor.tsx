import React from 'react';
import { emptyText, newId } from '../../content/model';
import { isEmail } from '../../content/validation';
import { FileField } from '../MediaEditors';
import { Grid, ItemList, LocalizedField, SectionHeader, SubSection, TextField, Toggle, UrlField } from '../ui';
import { listOps, type EditorProps } from './common';

export const ProfileEditor: React.FC<EditorProps> = ({ doc, update, lang }) => {
  const { profile } = doc;
  const set = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => update(draft => { draft.profile[key] = value; });
  return (
    <>
      <SectionHeader title="Perfil" description="Nome, apresentação, foto e formas de contato. Aparecem na tela inicial, no Portal do Desenvolvedor e no menu." />
      <div className="space-y-5">
        <SubSection title="Identidade">
          <Grid>
            <TextField label="Nome de exibição" value={profile.name} onChange={value => set('name', value)} error={profile.name.trim() ? undefined : 'Informe seu nome.'} hint="Aparece em destaque na abertura e na tela inicial." />
            <TextField label="Nome completo" value={profile.fullName} onChange={value => set('fullName', value)} />
          </Grid>
          <LocalizedField label="Cargo / título" value={profile.title} lang={lang} onChange={value => set('title', value)} />
          <LocalizedField label="Subtítulo" value={profile.subtitle} lang={lang} onChange={value => set('subtitle', value)} multiline rows={3} hint="Frase de apresentação do Portal do Desenvolvedor." />
          <LocalizedField label="Biografia" value={profile.bio} lang={lang} onChange={value => set('bio', value)} multiline rows={6} maxLength={6000} />
          <Grid>
            <LocalizedField label="Disponibilidade" value={profile.availability} lang={lang} onChange={value => set('availability', value)} hint="Deixe vazio para ocultar o selo verde." />
            <LocalizedField label="Localização" value={profile.location} lang={lang} onChange={value => set('location', value)} />
          </Grid>
        </SubSection>

        <SubSection title="Foto" description="Se nenhuma foto for enviada, o site usa a foto que já vem com ele.">
          <FileField label="Foto / avatar" value={profile.photo} onChange={value => set('photo', value)} category="image" preview="image" emptyLabel="Usando a foto padrão do site." hint="Imagem quadrada funciona melhor (até 5 MB)." />
        </SubSection>

        <SubSection title="Contato e redes" description="Cada link só aparece no site quando preenchido.">
          <Grid>
            <TextField label="E-mail" type="email" value={profile.email} onChange={value => set('email', value)} error={profile.email && !isEmail(profile.email) ? 'E-mail inválido.' : undefined} hint="Recebe as mensagens do formulário do site." />
            <TextField label="Telefone" type="tel" value={profile.phone} onChange={value => set('phone', value)} maxLength={40} />
          </Grid>
          <Toggle label="Mostrar o telefone no site" checked={profile.showPhone} onChange={value => set('showPhone', value)} hint="Desligado por padrão. Quando ligado, aparece no Portal do Desenvolvedor." />
          <Grid>
            <UrlField label="GitHub" value={profile.github} onChange={value => set('github', value)} />
            <UrlField label="LinkedIn" value={profile.linkedin} onChange={value => set('linkedin', value)} />
          </Grid>
          <div className="space-y-2">
            <h5 className="text-[11px] font-mono uppercase tracking-wide text-slate-400">Outros links</h5>
            <ItemList
              items={profile.links}
              ops={listOps(update, { select: d => d.profile.links, make: () => ({ id: newId('link'), label: '', url: '' }), max: 20 })}
              title={link => link.label || link.url}
              subtitle={link => link.url}
              itemLabel="link"
              addLabel="Adicionar link (Instagram, YouTube, site…)"
              body={(link, index) => (
                <Grid>
                  <TextField label="Nome do link" value={link.label} onChange={value => update(d => { d.profile.links[index].label = value; })} placeholder="Instagram" maxLength={60} />
                  <UrlField label="Endereço" value={link.url} onChange={value => update(d => { d.profile.links[index].url = value; })} />
                </Grid>
              )}
            />
          </div>
        </SubSection>

        <SubSection title="Currículo" description="Aparece como botão no Portal do Desenvolvedor e na tela inicial quando houver um arquivo ou link.">
          <FileField label="Arquivo ou link do currículo" value={profile.resumeUrl} onChange={value => set('resumeUrl', value)} category="document" allowExternal
            hint="Envie um PDF (até 10 MB) ou cole o link de um arquivo hospedado em outro lugar." />
          <LocalizedField label="Texto do botão" value={profile.resumeLabel ?? emptyText()} lang={lang} onChange={value => set('resumeLabel', value)} maxLength={80} />
        </SubSection>
      </div>
    </>
  );
};
