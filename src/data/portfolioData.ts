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
  title: 'Full Stack & Creative 3D Developer',
  subtitle: 'Especialista em aplicações web interativas de alta performance, Three.js, React e ecossistemas modernos.',
  bio: 'Desenvolvedor apaixonado por unir engenharia de software robusta a experiências visuais imersivas em 3D. Criador de produtos digitais escaláveis, interfaces ultra fluidas e experiências gamificadas que encantam usuários e geram resultados reais.',
  email: 'danilorib2324@gmail.com',
  location: 'Brasil / Remoto Global',
  github: 'https://github.com',
  linkedin: 'https://linkedin.com',
  whatsapp: 'https://wa.me/5511999999999',
  availability: 'Disponível para Projetos & Oportunidades Sênior',
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
    id: 'simon-world-3d',
    title: 'Bruno Simon 3D World Engine',
    category: 'Creative 3D & Games',
    shortDesc: 'Ambiente exploratório 3D com física personalizada, iluminação bakeada e controles de veículo.',
    description: 'Experiência web 3D interativa de alto impacto desenvolvida com Three.js e React Three Fiber. Inclui sistema de iluminação suave, física de colisões para veículos, shaders personalizados e otimização para 60 FPS estáveis mesmo em smartphones.',
    tags: ['Three.js', 'React Three Fiber', 'GLSL Shaders', 'TypeScript', 'Web Audio'],
    metrics: 'Taxa de quadros de 60fps constante com mais de 30k polígonos renderizados',
    liveUrl: 'https://bruno-simon.com',
    githubUrl: 'https://github.com',
    featured: true,
    accentColor: '#38bdf8',
  },
  {
    id: 'orbit-saas-platform',
    title: 'Orbit Analytics & Microservices',
    category: 'Full Stack & Cloud',
    shortDesc: 'Plataforma SaaS corporativa em tempo real com dashboards analíticos de telemetria.',
    description: 'Arquitetura resiliente de microserviços em Node.js e Go, com frontend reativo em React e Tailwind. Processamento de fluxos de eventos em alta escala, autenticação OAuth2 multi-tenant e relatórios instantâneos gerados via Web Workers.',
    tags: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'TailwindCSS', 'Redis'],
    metrics: 'Mais de 100k requisições diárias com tempo de resposta médio inferior a 85ms',
    liveUrl: '#',
    githubUrl: 'https://github.com',
    featured: true,
    accentColor: '#818cf8',
  },
  {
    id: 'space-defi-hub',
    title: 'Aura Protocol & Web3 Interface',
    category: 'Fintech & Web3',
    shortDesc: 'Interface descentralizada para custódia e swap de ativos com visual futurista.',
    description: 'Dashboard de finanças descentralizadas com integração direta de carteiras Web3, cálculo dinâmico de slippage e visualização gráfica de liquidez em tempo real com Recharts e D3.js.',
    tags: ['Next.js', 'TypeScript', 'Ethers.js', 'D3.js', 'TailwindCSS'],
    metrics: 'Mais de $2.5M de volume transacionado simulado em ambiente de testes',
    liveUrl: '#',
    githubUrl: 'https://github.com',
    featured: false,
    accentColor: '#10b981',
  },
  {
    id: 'cloud-pipeline-ops',
    title: 'DevOps & Pipeline Automation Suite',
    category: 'DevOps & Infraestrutura',
    shortDesc: 'Gerenciador automatizado de deployments multicloud com visualizador de nós.',
    description: 'Solução interna para simplificar a entrega contínua em Kubernetes e Google Cloud Run. Reduz o tempo de setup de novos ambientes de 4 horas para apenas 6 minutos com scripts declarativos e validação de segurança automática.',
    tags: ['Kubernetes', 'Docker', 'GCP', 'GitHub Actions', 'Terraform'],
    metrics: 'Redução de 70% no tempo médio de deploy (MTTD)',
    liveUrl: '#',
    githubUrl: 'https://github.com',
    featured: false,
    accentColor: '#f59e0b',
  },
];

export const EXPERIENCE_DATA: ExperienceItem[] = [
  {
    id: 'exp-1',
    role: 'Sênior Full Stack & Creative Developer',
    company: 'Nexus Digital Labs',
    period: '2023 - Presente',
    location: 'São Paulo, Brasil (Remoto)',
    highlights: [
      'Liderança técnica na arquitetura de aplicações web interativas com Three.js e React.',
      'Aumento de 42% na retenção de usuários após redesign com microinterações gamificadas.',
      'Mentoria de 6 desenvolvedores pleno/júnior em boas práticas de TypeScript e performance.',
    ],
    techStack: ['React', 'Three.js', 'TypeScript', 'Node.js', 'Docker', 'GCP'],
  },
  {
    id: 'exp-2',
    role: 'Pleno Software Engineer',
    company: 'Vanguard Tech Solutions',
    period: '2021 - 2023',
    location: 'Curitiba, Brasil',
    highlights: [
      'Desenvolvimento de APIs escaláveis com Node.js e arquitetura orientada a eventos.',
      'Migração de monólito legado para microsserviços containerizados com zero downtime.',
      'Implementação de pipelines de CI/CD automatizadas e testes de integração com Jest.',
    ],
    techStack: ['Node.js', 'PostgreSQL', 'Redis', 'React', 'TailwindCSS', 'AWS'],
  },
  {
    id: 'exp-3',
    role: 'Frontend Developer & UI Specialist',
    company: 'Starlight Interactive',
    period: '2019 - 2021',
    location: 'Florianópolis, Brasil',
    highlights: [
      'Criação de landing pages de alta conversão e dashboards reativos com design system proprietário.',
      'Otimização de métricas Core Web Vitals, elevando notas do Lighthouse de 68 para 98.',
    ],
    techStack: ['JavaScript ES6+', 'React', 'Sass', 'Webpack', 'Figma'],
  },
];

export const EDUCATION_DATA: EducationItem[] = [
  {
    id: 'edu-1',
    degree: 'Bacharelado em Ciência da Computação',
    institution: 'Universidade Federal / Estadual de Tecnologia',
    period: '2018 - 2022',
    description: 'Formação sólida em algoritmos fundamentais, estruturas de dados complexas, compiladores, computação gráfica, banco de dados distribuídos e engenharia de software.',
    skillsAcquired: ['Algoritmos Avançados', 'Computação Gráfica', 'Sistemas Operacionais', 'Engenharia de Software'],
    badgeName: 'Graduação Magna',
  },
  {
    id: 'edu-2',
    degree: 'Three.js Journey Certification',
    institution: 'Bruno Simon Masterclass',
    period: '2022 - 2023',
    description: 'Especialização profunda em WebGL, Three.js, Shaders GLSL, física de colisões (Cannon.js / Rapier), técnicas de baked lighting, performance em dispositivos móveis e creative coding.',
    skillsAcquired: ['Three.js Pro', 'GLSL Shaders', 'R3F Ecossistema', 'Bake Lighting & Performance'],
    badgeName: 'Mestre WebGL 3D',
  },
  {
    id: 'edu-3',
    degree: 'Cloud Architecture & DevOps Professional',
    institution: 'Google Cloud Platform Certified',
    period: '2023',
    description: 'Certificação em desenho de soluções de nuvem escaláveis, Kubernetes (GKE), Cloud Run, monitoramento contínuo e arquiteturas serverless seguras.',
    skillsAcquired: ['GCP Cloud Architect', 'Kubernetes', 'CI/CD Pipelines', 'Segurança Cloud'],
    badgeName: 'Cloud Specialist',
  },
];

export const SKILLS_DATA: SkillCategory[] = [
  {
    title: 'Frontend & 3D Web',
    icon: 'Layers',
    skills: [
      { name: 'React 19 & Next.js', level: 95, highlight: true },
      { name: 'Three.js & React Three Fiber', level: 92, highlight: true },
      { name: 'TypeScript', level: 96, highlight: true },
      { name: 'GLSL & Custom Shaders', level: 85 },
      { name: 'Tailwind CSS & Motion', level: 98, highlight: true },
      { name: 'Canvas API & Web Audio', level: 88 },
    ],
  },
  {
    title: 'Backend & APIs',
    icon: 'Server',
    skills: [
      { name: 'Node.js & Express', level: 94, highlight: true },
      { name: 'PostgreSQL & Drizzle/Prisma', level: 90 },
      { name: 'REST & GraphQL APIs', level: 92 },
      { name: 'Redis Caching & Queues', level: 86 },
      { name: 'Autenticação & JWT/OAuth', level: 90 },
    ],
  },
  {
    title: 'DevOps & Ferramentas',
    icon: 'Wrench',
    skills: [
      { name: 'Docker & Containers', level: 88 },
      { name: 'Google Cloud / AWS', level: 84 },
      { name: 'Git & GitHub Workflows', level: 95 },
      { name: 'Blender 3D Modeling (Low-poly)', level: 80 },
      { name: 'Vite & Build Optimization', level: 96 },
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
