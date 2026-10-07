import type { Locale } from '../i18n/locale';
import { messages } from '../i18n/translations';
import type { LocalizedText } from './model';
import { pick } from './model';

export interface UiTextEntry {
  group: string;
  label: string;
  pt: string;
  en: string;
  multiline?: boolean;
  /** Placeholders the copy may use, e.g. {name}. */
  placeholders?: string[];
}

const GROUPS = {
  seo: 'Busca e título da aba',
  preloader: 'Tela de abertura',
  landing: 'Tela inicial',
  islands: 'Janelas das ilhas',
  projects: 'Janela do projeto',
  about: 'Portal do desenvolvedor / contato',
  egg: 'Segredo do desenvolvedor',
  settings: 'Menu de configurações',
} as const;

/** Every public sentence the owner can rewrite from the admin panel. Defaults are today's copy. */
export const UI_TEXTS: Record<string, UiTextEntry> = {
  'seo.title': { group: GROUPS.seo, label: 'Título da aba do navegador', pt: messages.pt.seoTitle, en: messages.en.seoTitle },
  'seo.description': { group: GROUPS.seo, label: 'Descrição para buscadores', pt: messages.pt.seoDescription, en: messages.en.seoDescription, multiline: true },

  'preloader.brand': { group: GROUPS.preloader, label: 'Marca no topo', pt: 'PORTFÓLIO INTERATIVO', en: 'INTERACTIVE PORTFOLIO' },
  'preloader.edition': { group: GROUPS.preloader, label: 'Faixa do topo (desktop)', pt: 'DESENVOLVIMENTO · CRIATIVIDADE · EXPLORAÇÃO', en: 'DEVELOPMENT · CREATIVITY · EXPLORATION' },
  'preloader.eyebrow': { group: GROUPS.preloader, label: 'Chamada pequena', pt: 'PREPARANDO SUA EXPLORAÇÃO', en: 'PREPARING YOUR JOURNEY' },
  'preloader.headline': { group: GROUPS.preloader, label: 'Frase de destaque (uma linha por quebra)', pt: 'Um universo\npara descobrir.', en: 'A universe\nwaiting to be discovered.', multiline: true },
  'preloader.description': { group: GROUPS.preloader, label: 'Descrição (uma linha por quebra)', pt: 'Ideias, projetos e experiências conectados.\nSeu próximo destino está quase pronto.', en: 'Ideas, projects and experiences, all connected.\nYour next destination is almost ready.', multiline: true },
  'preloader.footer': { group: GROUPS.preloader, label: 'Rodapé', pt: 'FEITO PARA EXPLORAR', en: 'BUILT TO EXPLORE' },
  'preloader.orbitLabel': { group: GROUPS.preloader, label: 'Legenda da ilustração', pt: 'CADA ÓRBITA, UMA NOVA HISTÓRIA', en: 'EVERY ORBIT, A NEW STORY' },

  'landing.start': { group: GROUPS.landing, label: 'Botão principal', pt: 'Iniciar Exploração com Nave', en: 'Start Exploring by Ship' },
  'landing.islandsHint': { group: GROUPS.landing, label: 'Texto acima dos atalhos das ilhas', pt: 'Ou explore clicando direto na ilha:', en: 'Or explore by selecting an island:' },
  'landing.footnote': { group: GROUPS.landing, label: 'Rodapé de instruções', pt: 'Clique em qualquer ilha 3D em órbita ou pilote com W, A, S, D', en: 'Select any orbiting 3D island or fly with W, A, S, D' },

  'islands.experienceLabel': { group: GROUPS.islands, label: 'Linha do tempo: descrição para leitores de tela', pt: 'Trajetória profissional, da mais recente à mais antiga', en: 'Career history, newest first' },
  'islands.codeStoryTitle': { group: GROUPS.islands, label: 'Trecho de código: título', pt: 'Código deste portfólio: tempo de simulação pausável', en: 'Code from this portfolio: pausable simulation time' },
  'islands.certificatesTitle': { group: GROUPS.islands, label: 'Galeria de certificados: título', pt: 'Certificados e diplomas', en: 'Certificates and diplomas' },
  'islands.featuredBadge': { group: GROUPS.islands, label: 'Selo de projeto em destaque', pt: '★ DESTAQUE', en: '★ FEATURED' },

  'projects.gallery': { group: GROUPS.projects, label: 'Galeria de mídias: título', pt: 'Projeto em ação', en: 'Project in action' },
  'projects.tabReadme': { group: GROUPS.projects, label: 'Aba README: selo', pt: 'Principal', en: 'Home' },
  'projects.tabOverview': { group: GROUPS.projects, label: 'Aba de visão geral', pt: 'Visão Geral & Destaques', en: 'Overview & Highlights' },
  'projects.tabArchitecture': { group: GROUPS.projects, label: 'Aba de arquitetura', pt: 'Arquitetura & Fluxo', en: 'Architecture & Flow' },
  'projects.tabQuickstart': { group: GROUPS.projects, label: 'Aba de quickstart', pt: 'Terminal & Quickstart', en: 'Terminal & Quickstart' },
  'projects.solution': { group: GROUPS.projects, label: 'Título: proposta e solução', pt: 'Proposta & Solução', en: 'Problem & Solution' },
  'projects.metrics': { group: GROUPS.projects, label: 'Título: métricas', pt: 'Métricas & Indicadores Técnicos', en: 'Metrics & Technical Indicators' },
  'projects.highlights': { group: GROUPS.projects, label: 'Título: destaques', pt: 'Destaques de Engenharia', en: 'Engineering Highlights' },
  'projects.stack': { group: GROUPS.projects, label: 'Título: tecnologias', pt: 'Stack de Tecnologias Utilizada', en: 'Technology Stack' },
  'projects.architecture': { group: GROUPS.projects, label: 'Título: visão arquitetural', pt: 'Visão Arquitetural do Sistema', en: 'System Architecture' },
  'projects.flow': { group: GROUPS.projects, label: 'Título: fluxo', pt: 'Fluxo Operacional de Dados', en: 'Data Flow' },
  'projects.database': { group: GROUPS.projects, label: 'Título: banco de dados', pt: 'Camada de Banco & Persistência', en: 'Database & Persistence Layer' },
  'projects.security': { group: GROUPS.projects, label: 'Título: segurança', pt: 'Segurança & Resiliência', en: 'Security & Resilience' },
  'projects.quickstartTitle': { group: GROUPS.projects, label: 'Título: inicialização rápida', pt: 'Instruções de Inicialização Rápida', en: 'Quick Start Instructions' },
  'projects.quickstartIntro': { group: GROUPS.projects, label: 'Texto: inicialização rápida', pt: 'Siga o passo a passo no terminal para clonar, instalar dependências e inicializar a aplicação localmente.', en: 'Follow the terminal steps to clone, install dependencies and run the application locally.', multiline: true },

  'about.greeting': { group: GROUPS.about, label: 'Saudação', pt: 'Olá! Eu sou o {name} 👋', en: 'Hello! I’m {name} 👋', placeholders: ['{name}'] },
  'about.emailLabel': { group: GROUPS.about, label: 'Cartão de e-mail', pt: 'Email Direto', en: 'Direct Email' },
  'about.formTitle': { group: GROUPS.about, label: 'Formulário: título', pt: 'Terminal de Mensagem Rápida', en: 'Quick Message Terminal' },
  'about.formDestination': { group: GROUPS.about, label: 'Formulário: rótulo do destino', pt: 'Destino de envio:', en: 'Destination:' },
  'about.formPlaceholder': { group: GROUPS.about, label: 'Formulário: campo de mensagem', pt: 'Escreva uma mensagem para {firstName}...', en: 'Write a message to {firstName}...', placeholders: ['{firstName}'] },
  'about.formButton': { group: GROUPS.about, label: 'Formulário: botão', pt: 'Enviar Email', en: 'Send Email' },
  'about.formSuccess': { group: GROUPS.about, label: 'Formulário: confirmação', pt: '✓ Sinal cósmico transmitido! O cliente de email foi acionado para {email}.', en: '✓ Cosmic signal transmitted! Your email client opened for {email}.', placeholders: ['{email}'] },
  'about.mailSubject': { group: GROUPS.about, label: 'Assunto do e-mail enviado', pt: 'Contato via Portfólio 3D - {name}', en: 'Contact from 3D Portfolio - {name}', placeholders: ['{name}'] },

  'settings.welcome': { group: GROUPS.settings, label: 'Aba Principal: boas-vindas', pt: 'Olá e seja muito bem-vindo! 👋', en: 'Hello and welcome! 👋' },
  'settings.intro': { group: GROUPS.settings, label: 'Aba Principal: apresentação', pt: 'Meu nome é {name}, sou desenvolvedor focado em engenharia de software full-stack e experiências 3D WebGL imersivas.', en: 'My name is {name}, a developer focused on full-stack software engineering and immersive 3D WebGL experiences.', multiline: true, placeholders: ['{name}'] },

  'egg.access': { group: GROUPS.egg, label: 'Linha de acesso', pt: 'ACESSO CONCEDIDO', en: 'ACCESS GRANTED' },
  'egg.title': { group: GROUPS.egg, label: 'Título', pt: 'Você encontrou\no outro lado', en: 'You found\nthe other side', multiline: true },
  'egg.description': { group: GROUPS.egg, label: 'Descrição', pt: 'Nem todo segredo está no código.\nAlguns estão em quem o escreve.', en: 'Not every secret is in the code.\nSome are in the person who writes it.', multiline: true },
  'egg.login': { group: GROUPS.egg, label: 'Texto do acesso administrativo', pt: 'Acesso administrativo', en: 'Administrator access' },
  'egg.footer': { group: GROUPS.egg, label: 'Rodapé', pt: 'SEGREDO DO DESENVOLVEDOR', en: 'DEVELOPER SECRET' },
};

export type UiTextKey = keyof typeof UI_TEXTS;

export const interpolate = (template: string, values: Record<string, string>): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

export const defaultText = (key: string): LocalizedText => {
  const entry = UI_TEXTS[key];
  return { pt: entry?.pt ?? '', en: entry?.en ?? '' };
};

/** Returns the owner's override when present, otherwise the built-in copy. */
export const resolveUiText = (
  overrides: Record<string, LocalizedText>,
  key: string,
  locale: Locale,
  values: Record<string, string> = {},
): string => {
  const entry = overrides[key] ?? defaultText(key);
  return interpolate(pick(entry, locale), values);
};
