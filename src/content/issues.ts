import type { LocalizedText, MediaDoc, PortfolioDocument } from './model';
import { LIMITS } from './sanitize';
import { isEmail, isHexColor, isSafeLink, isSafeMediaUrl, MAX_DOCUMENT_BYTES, utf8Size } from './validation';

export type SectionId = 'profile' | 'islands' | 'projects' | 'experience' | 'education' | 'skills' | 'badges' | 'appearance' | 'texts' | 'document';

export interface ContentIssue {
  section: SectionId;
  /** Human readable location, e.g. "Projetos › QuantIA › Link do GitHub". */
  where: string;
  message: string;
}

const blank = (value: LocalizedText) => !value.pt.trim() && !value.en.trim();

/**
 * Blocking problems the owner must fix before publishing. The normaliser would silently drop
 * most of these, so they are reported first to avoid losing content without notice.
 */
export function findIssues(doc: PortfolioDocument): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const add = (section: SectionId, where: string, message: string) => issues.push({ section, where, message });
  const url = (section: SectionId, where: string, value: string, label: string) => {
    if (value && !isSafeLink(value)) add(section, where, `${label}: use um endereço completo começando com https:// (ex.: https://exemplo.com).`);
  };
  const mediaList = (section: SectionId, where: string, items: MediaDoc[]) => {
    items.forEach((item, index) => {
      const place = `${where} › Mídia ${index + 1}`;
      if (!isSafeMediaUrl(item.src)) add(section, place, 'Envie o arquivo pelo painel; o endereço atual não é aceito.');
      if (item.thumbnail && !isSafeMediaUrl(item.thumbnail)) add(section, place, 'A miniatura não é aceita; envie a imagem novamente.');
      if (item.kind === 'image' && blank(item.alt)) add(section, place, 'Descreva a imagem no texto alternativo (acessibilidade).');
    });
  };
  const duplicates = (section: SectionId, where: string, ids: string[]) => {
    if (new Set(ids).size !== ids.length) add(section, where, 'Há itens com identificador repetido. Recarregue o painel e tente novamente.');
  };

  const { profile } = doc;
  if (!profile.name.trim()) add('profile', 'Perfil › Nome', 'Informe seu nome.');
  if (profile.email && !isEmail(profile.email)) add('profile', 'Perfil › E-mail', 'Informe um e-mail válido.');
  url('profile', 'Perfil › GitHub', profile.github, 'GitHub');
  url('profile', 'Perfil › LinkedIn', profile.linkedin, 'LinkedIn');
  url('profile', 'Perfil › Currículo', profile.resumeUrl, 'Currículo');
  if (profile.photo && !isSafeMediaUrl(profile.photo)) add('profile', 'Perfil › Foto', 'Envie a foto pelo painel; o endereço atual não é aceito.');
  profile.links.forEach((item, index) => {
    const where = `Perfil › Link ${index + 1}`;
    if (!item.label.trim()) add('profile', where, 'Dê um nome ao link.');
    if (!item.url.trim()) add('profile', where, 'Informe o endereço do link.');
    else url('profile', where, item.url, 'Endereço');
  });
  duplicates('profile', 'Perfil › Links', profile.links.map(item => item.id));

  if (!doc.islands.some(island => island.visible)) add('islands', 'Seções', 'Deixe pelo menos uma ilha visível.');
  doc.islands.forEach(island => {
    if (blank(island.name)) add('islands', `Seções › ${island.id}`, 'Informe o nome da ilha.');
    if (!isHexColor(island.color)) add('islands', `Seções › ${island.id}`, 'Cor inválida.');
  });

  doc.projects.forEach((project, index) => {
    const label = project.title.pt || project.title.en || `Projeto ${index + 1}`;
    const where = `Projetos › ${label}`;
    if (blank(project.title)) add('projects', `Projetos › Projeto ${index + 1}`, 'Informe o título do projeto.');
    if (!isHexColor(project.accentColor)) add('projects', where, 'Cor de destaque inválida.');
    url('projects', where, project.githubUrl, 'Link do GitHub');
    url('projects', where, project.liveUrl, 'Link do projeto no ar');
    mediaList('projects', where, project.media);
    duplicates('projects', `${where} › Mídias`, project.media.map(item => item.id));
  });
  duplicates('projects', 'Projetos', doc.projects.map(item => item.id));

  doc.experience.forEach((item, index) => {
    if (blank(item.role) && blank(item.company)) add('experience', `Experiência › Item ${index + 1}`, 'Informe o cargo ou a empresa.');
  });
  duplicates('experience', 'Experiência', doc.experience.map(item => item.id));

  doc.education.forEach((item, index) => {
    const where = `Formação › ${item.degree.pt || item.degree.en || `Item ${index + 1}`}`;
    if (blank(item.degree)) add('education', `Formação › Item ${index + 1}`, 'Informe o curso ou a qualificação.');
    mediaList('education', where, item.certificates);
  });
  duplicates('education', 'Formação', doc.education.map(item => item.id));

  doc.skills.forEach((category, index) => {
    const where = `Habilidades › ${category.title.pt || category.title.en || `Grupo ${index + 1}`}`;
    if (blank(category.title)) add('skills', `Habilidades › Grupo ${index + 1}`, 'Informe o nome do grupo.');
    category.skills.forEach((skill, skillIndex) => {
      if (!skill.name.trim()) add('skills', `${where} › Item ${skillIndex + 1}`, 'Informe o nome da habilidade.');
      if (!Number.isFinite(skill.level) || skill.level < 0 || skill.level > 100) add('skills', `${where} › ${skill.name || skillIndex + 1}`, 'O nível deve estar entre 0 e 100.');
    });
  });

  if (!isHexColor(doc.appearance.accentColor)) add('appearance', 'Aparência › Cor de destaque', 'Cor inválida.');

  const size = utf8Size(JSON.stringify(doc));
  if (size > MAX_DOCUMENT_BYTES) {
    add('document', 'Conteúdo', `O conteúdo está grande demais (${Math.round(size / 1024)} KB; máximo ${Math.round(MAX_DOCUMENT_BYTES / 1024)} KB). Encurte textos longos, como o README.`);
  }
  for (const project of doc.projects) {
    if (project.readme.pt.length > LIMITS.readme || project.readme.en.length > LIMITS.readme) {
      add('projects', `Projetos › ${project.title.pt || project.title.en}`, `O README passa de ${LIMITS.readme} caracteres.`);
    }
  }
  return issues;
}
