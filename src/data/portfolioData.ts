import {
  IslandConfig,
  ProjectItem,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  Badge,
  LeaderboardEntry,
  RaceLeaderboardEntry
} from '../types';

export const PERSONAL_INFO = {
  name: 'Danilo Ribeiro',
  fullName: 'Danilo Ribeiro Luiz de Oliveira',
  title: 'Full Stack & AI Integrations Developer',
  subtitle: 'Especialista em aplicações modernas com TypeScript, React, Next.js, Python, Kotlin e inteligência artificial aplicada.',
  bio: 'Estudante de Análise e Desenvolvimento de Sistemas e desenvolvedor focado em unir interfaces de alto impacto visual a fluxos inteligentes de Inteligência Artificial. Com sólida base técnica que vai do front-end moderno (Next.js/React) ao backend e bancos relacionais com PostgreSQL/PostGIS, transformo desafios complexos e necessidades de negócios em produtos funcionais, escaláveis e inovadores.',
  email: 'danilorib2324@gmail.com',
  phone: '(31) 97145-9370',
  location: 'Betim - MG, Brasil',
  github: 'https://github.com/Ooliveiradev',
  linkedin: 'https://linkedin.com',
  whatsapp: 'https://wa.me/5531971459370',
  availability: 'Disponível para Estágio & Posições em Tecnologia (Segunda a sexta até 18h)',
};

export const ISLANDS_CONFIG: IslandConfig[] = [
  {
    id: 'projects',
    name: 'Ilha dos Projetos',
    tagline: 'Laboratório de Criações & Softwares',
    color: '#38bdf8', // Sky Cyan
    orbitRadius: 48,
    orbitSpeed: 0.10,
    angleOffset: 0,
    elevation: -3.8,
    iconName: 'FolderGit2',
    challengeTitle: 'Terminal Cósmico de Deploy',
    challengeXp: 150,
  },
  {
    id: 'experience',
    name: 'Ilha da Carreira',
    tagline: 'Linha do Tempo & Conquistas Corporativas',
    color: '#f59e0b', // Amber / Gold
    orbitRadius: 66,
    orbitSpeed: -0.08,
    angleOffset: 1.25,
    elevation: -4.2,
    iconName: 'Briefcase',
    challengeTitle: 'Ativação de Marco Operacional',
    challengeXp: 150,
  },
  {
    id: 'skills',
    name: 'Ilha de Tecnologias',
    tagline: 'Reator de Habilidades & Ferramentas',
    color: '#a855f7', // Purple Neon
    orbitRadius: 84,
    orbitSpeed: 0.065,
    angleOffset: 2.5,
    elevation: -3.8,
    iconName: 'Cpu',
    challengeTitle: 'Sintonia de Frequência Tech',
    challengeXp: 150,
  },
  {
    id: 'education',
    name: 'Ilha Acadêmica',
    tagline: 'Formação, Ciência da Computação & Certificados',
    color: '#10b981', // Emerald Green
    orbitRadius: 102,
    orbitSpeed: -0.05,
    angleOffset: 3.8,
    elevation: -4.4,
    iconName: 'GraduationCap',
    challengeTitle: 'Desafio Algorítmico Rápido',
    challengeXp: 150,
  },
  {
    id: 'about',
    name: 'Portal do Desenvolvedor',
    tagline: 'Bio, Contato Direto & Conexão Galáctica',
    color: '#ec4899', // Pink Laser
    orbitRadius: 30,
    orbitSpeed: 0.13,
    angleOffset: 5.0,
    elevation: -4.0,
    iconName: 'UserCheck',
    challengeTitle: 'Conexão de Frequência Segura',
    challengeXp: 150,
  },
];

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'quantia-mvp',
    title: 'QuantIA (MVP)',
    category: 'IA Aplicada & Engenharia Civil',
    shortDesc: 'Automação inteligente de levantamento quantitativo de materiais a partir de plantas baixas em PDF com Google Gemini.',
    description: 'Plataforma web inovadora que automatiza a extração de ambientes, áreas e tipos de acabamento diretamente de plantas baixas em PDF através do Google Gemini. Inclui motor de cálculo determinístico com memória de cálculo completa para piso, argamassa e rejunte, além de um Agente Auditor autônomo para detecção de inconsistências antes da exibição dos resultados. Cobertura robusta de testes unitários com Vitest e testes ponta a ponta com Playwright.',
    tags: ['Next.js 16', 'React 19', 'TypeScript', 'Gemini AI', 'Supabase', 'Zod', 'Tailwind v4', 'Vitest', 'Playwright'],
    metrics: 'Redução drástica de horas para segundos na extração de áreas e quantitativos de obras',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/QuantIA-MVP',
    featured: true,
    accentColor: '#38bdf8',
  },
  {
    id: 'ecofinance',
    title: 'EcoFinance',
    category: 'Fintech & Gestão Pessoal',
    shortDesc: 'Ecossistema completo de finanças pessoais (Web + Mobile) com IA generativa, Open Finance e geolocalização.',
    description: 'Solução financeira multiplataforma com inteligência artificial (Gemini 2.0 Flash) para categorização preditiva de gastos e consultoria financeira em chat interativo. Conexão bancária direta em tempo real com cartões e bancos via Open Finance (Pluggy) e visualização de despesas no mapa com PostGIS e PostgreSQL.',
    tags: ['TypeScript', 'Kotlin', 'Android', 'PostgreSQL', 'PostGIS', 'Supabase', 'Node.js', 'Gemini AI', 'Pluggy API'],
    metrics: 'Open Finance automatizado e mapeamento georreferenciado de gastos com PostGIS',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/EcoFinance',
    featured: true,
    accentColor: '#10b981',
  },
  {
    id: 'portfolio-3d',
    title: 'Portfolio Cósmico 3D',
    category: 'Creative 3D & WebGL',
    shortDesc: 'Portfólio interativo gamificado em universo 3D com física inercial Rapier, iluminação de estúdio e 5 ilhas orbitais.',
    description: 'Experiência web 3D de alto impacto inspirada no trabalho de Bruno Simon. Desenvolvida com Three.js e React Three Fiber, apresenta simulação física inercial de veículo espacial com drift e suspensão elástica, iluminação de estúdio cósmico (Key/Fill/Rim), órbitas celestes matemáticas sincronizadas, 5 ilhas planetárias com Foguetipontos [F], minigame de corrida de checkpoints e desafios técnicos interativos.',
    tags: ['React Three Fiber', 'Three.js', 'Rapier 3D', 'TypeScript', 'Tailwind CSS', 'Vite'],
    metrics: 'Taxa estável de 60-120 FPS com sombras PCF e iluminação de estúdio cinematográfica',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/Portfolio-Ooliveiradev',
    featured: true,
    accentColor: '#818cf8',
  },
  {
    id: 'nutrilife',
    title: 'NutriLife',
    category: 'Saúde & Nutrição',
    shortDesc: 'Aplicação web responsiva para acompanhamento nutricional, rotinas alimentares e rastreamento de hábitos saudáveis.',
    description: 'Interface web moderna e intuitiva focada em planejamento de refeições, monitoramento de metas nutricionais diárias e métricas de consistência de hábitos saudáveis, com design system limpo e responsivo.',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    metrics: 'Experiência de usuário fluida e acessível focada em adesão de hábitos',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/NutriLife',
    featured: false,
    accentColor: '#f59e0b',
  },
];

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: 'exp-betim-tech',
    role: 'Estagiário de Desenvolvimento Front-end',
    company: 'Fundação Pública de Pesquisa e Tecnologia Avançada de Betim',
    period: '07/2026 – Atual',
    location: 'Betim - MG, Brasil',
    highlights: [
      'Desenvolvimento e manutenção de interfaces web responsivas e acessíveis utilizando React e Next.js.',
      'Colaboração ativa na implementação de novas funcionalidades com foco prioritário em experiência do usuário (UX) e performance.',
      'Integração de componentes front-end com APIs REST para consumo e manipulação de dados em tempo real.',
    ],
    techStack: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST APIs', 'Git'],
  },
  {
    id: 'exp-nemak',
    role: 'Aprendiz / Assistente de Fundição',
    company: 'Nemak',
    period: '02/2026 – 04/2026',
    location: 'Betim - MG, Brasil',
    highlights: [
      'Suporte administrativo às operações da unidade industrial e acompanhamento sistemático de indicadores de produção.',
      'Aplicação de rotinas de controle de qualidade, garantia da fluidez de fluxos organizacionais e segurança industrial.',
    ],
    techStack: ['Controle de Qualidade', 'Processos Industriais', 'Gestão Operacional', 'Segurança'],
  },
  {
    id: 'exp-futurese',
    role: 'Assistente de Inovação',
    company: 'FutureSe',
    period: '11/2023 – 06/2025',
    location: 'Betim - MG, Brasil',
    highlights: [
      'Suporte operacional e logístico na organização de eventos de inovação, programas de aceleração de startups e hackathons de tecnologia.',
      'Gestão de CRM, atendimento a empreendedores e clientes, estratégias de marketing digital e produção de conteúdo audiovisual.',
    ],
    techStack: ['Gestão de Startups', 'Hackathons', 'CRM', 'Marketing Digital', 'Edição Audiovisual'],
  },
  {
    id: 'exp-freelancer',
    role: 'Experiências Autônomas e Freelancer',
    company: 'Autônomo',
    period: '2023 – 2025',
    location: 'Betim - MG, Brasil',
    highlights: [
      'Atendimento ao público e suporte operacional em grandes eventos como garçom freelancer, com liderança sob pressão.',
      'Gestão autônoma de custos operacionais, precificação dinâmica e negociação direta de vendas com clientes.',
    ],
    techStack: ['Comunicação Assertiva', 'Negociação', 'Gestão de Custos', 'Resolução de Problemas'],
  },
];

export const EDUCATION_DATA: EducationItem[] = [
  {
    id: 'edu-puc-ads',
    degree: 'Graduação em Análise e Desenvolvimento de Sistemas',
    institution: 'PUC-MG (Pontifícia Universidade Católica de Minas Gerais)',
    period: '07/2026 – Previsão: 12/2028',
    description: 'Formação focada em engenharia de software moderna, arquitetura de sistemas escaláveis, banco de dados relacionais e distribuídos, desenvolvimento full-stack e segurança de aplicações.',
    skillsAcquired: ['Engenharia de Software', 'Sistemas Distribuídos', 'Modelagem de Dados', 'Clean Architecture'],
    badgeName: 'Graduando ADS PUC-MG',
  },
  {
    id: 'edu-cefet-eng',
    degree: 'Graduação em Engenharia de Transportes',
    institution: 'CEFET-MG (Campus Nova Suíça / Gameleira)',
    period: 'Início: 03/2026',
    description: 'Formação analítica rigorosa com base forte em ciências exatas, lógica matemática avançada, modelagem de fluxos, análise quantitativa de dados e infraestrutura.',
    skillsAcquired: ['Modelagem Matemática', 'Otimização de Fluxos', 'Cálculo Avançado', 'Análise Quantitativa'],
    badgeName: 'Engenharia CEFET-MG',
  },
  {
    id: 'edu-certificacoes',
    degree: 'Qualificações Técnicas & Cursos de Extensão',
    institution: 'Rocketseat · Curso em Vídeo · Criadores do Futuro · CCAA',
    period: '2021 – 2025',
    description: 'Desenvolvimento Web (Curso em Vídeo, 150h - 2024), Fundamentos em Python (Rocketseat, 30h - 2025), Marketing Digital (Criadores do Futuro, 50h - 2023) e Inglês Intermediário/Avançado (CCAA Módulo 6, 2021).',
    skillsAcquired: ['Python Moderno', 'Web Full-Stack', 'Marketing de Produto', 'Inglês Técnico'],
    badgeName: 'Certificações Tech',
  },
];

export const SKILLS_DATA: SkillCategory[] = [
  {
    title: 'Front-end & Web',
    icon: 'Layers',
    skills: [
      { name: 'TypeScript', level: 96, highlight: true },
      { name: 'React & Next.js', level: 95, highlight: true },
      { name: 'JavaScript (ES6+)', level: 92, highlight: true },
      { name: 'Tailwind CSS', level: 96, highlight: true },
      { name: 'HTML5 & CSS3', level: 94 },
    ],
  },
  {
    title: 'Backend & Bancos de Dados',
    icon: 'Server',
    skills: [
      { name: 'Python', level: 90, highlight: true },
      { name: 'PostgreSQL & PostGIS', level: 92, highlight: true },
      { name: 'Supabase', level: 90, highlight: true },
      { name: 'Node.js', level: 88 },
      { name: 'PL/pgSQL', level: 82 },
      { name: 'PHP', level: 75 },
    ],
  },
  {
    title: 'IA, Mobile, Testes & Ferramentas',
    icon: 'Wrench',
    skills: [
      { name: 'Google Gemini AI', level: 94, highlight: true },
      { name: 'Kotlin & Android', level: 85, highlight: true },
      { name: 'Zod (Schema Validation)', level: 92 },
      { name: 'Git & GitHub Workflows', level: 95, highlight: true },
      { name: 'Vitest & Playwright', level: 88 },
      { name: 'Design (Canva, Affinity, Premiere)', level: 80 },
    ],
  },
];

export const BADGES_DATA: Badge[] = [
  {
    id: 'badge-ignition',
    title: 'Primeiro Contato',
    description: 'Iniciou a navegação pelo universo 3D do portfólio.',
    icon: 'Compass',
    xpReward: 100,
    unlocked: true,
    unlockedAt: 'Ao Iniciar',
  },
  {
    id: 'badge-explorer',
    title: 'Cosmo Navegador',
    description: 'Visitou e explorou todas as 5 ilhas orbitais.',
    icon: 'Globe',
    xpReward: 300,
    unlocked: false,
  },
  {
    id: 'badge-coder',
    title: 'Mestre dos Desafios',
    description: 'Completou com sucesso pelo menos 2 desafios técnicos nas ilhas.',
    icon: 'Cpu',
    xpReward: 250,
    unlocked: false,
  },
  {
    id: 'badge-crystal',
    title: 'Coletor Cósmico',
    description: 'Coletou 5 cristais de energia espacial escondidos pelo espaço.',
    icon: 'Sparkles',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-inspector',
    title: 'Inspetor de Projetos',
    description: 'Inspecionou os detalhes técnicos completos de um projeto em destaque.',
    icon: 'FolderSearch',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'badge-contact',
    title: 'Comunicação Estabelecida',
    description: 'Acessou o terminal de contato ou links sociais do desenvolvedor.',
    icon: 'Send',
    xpReward: 200,
    unlocked: false,
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Danilo Ribeiro', score: 1450, badgesCount: 6, title: 'Comandante Supremo', date: 'Hoje' },
  { id: '2', name: 'Bruno Simon Fan', score: 1200, badgesCount: 5, title: 'Piloto Estelar', date: 'Ontem' },
  { id: '3', name: 'Recrutador Tech', score: 950, badgesCount: 4, title: 'Avaliador Galáctico', date: '3 dias atrás' },
  { id: '4', name: 'Explorador 404', score: 750, badgesCount: 3, title: 'Navegador Espacial', date: '5 dias atrás' },
  { id: '5', name: 'Visitante Curioso', score: 450, badgesCount: 2, title: 'Cadete Estelar', date: '1 sem atrás' },
];

export const INITIAL_RACE_LEADERBOARD: RaceLeaderboardEntry[] = [
  { id: '1', name: 'Danilo Ribeiro', timeSeconds: 18.42, formattedTime: '00:18.42', date: 'Hoje' },
  { id: '2', name: 'Piloto Galáctico', timeSeconds: 22.15, formattedTime: '00:22.15', date: 'Ontem' },
  { id: '3', name: 'Cosmic Ace', timeSeconds: 25.80, formattedTime: '00:25.80', date: '2 dias atrás' },
  { id: '4', name: 'Speedster 404', timeSeconds: 28.95, formattedTime: '00:28.95', date: '4 dias atrás' },
  { id: '5', name: 'Cadete Espacial', timeSeconds: 33.60, formattedTime: '00:33.60', date: '1 sem atrás' },
];

export const formatRaceTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const CRYSTALS_DATA = [
  { id: 1, position: [22, 1.2, 14] as [number, number, number], collected: false },
  { id: 2, position: [-38, 2.5, -24] as [number, number, number], collected: false },
  { id: 3, position: [44, -1.0, -40] as [number, number, number], collected: false },
  { id: 4, position: [-58, 0.5, 34] as [number, number, number], collected: false },
  { id: 5, position: [18, 3.0, 60] as [number, number, number], collected: false },
  { id: 6, position: [-32, -1.8, -72] as [number, number, number], collected: false },
  { id: 7, position: [75, 1.5, 32] as [number, number, number], collected: false },
];
