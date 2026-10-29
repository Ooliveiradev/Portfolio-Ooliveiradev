import {
  IslandConfig,
  ProjectItem,
  ExperienceItem,
  EducationItem,
  SkillCategory,
  Badge,
  LeaderboardEntry,
  PersonalInfo,
  RaceLeaderboardEntry
} from '../types';

export const PERSONAL_INFO: PersonalInfo = {
  name: 'Danilo Ribeiro',
  fullName: 'Danilo Ribeiro Luiz de Oliveira',
  title: 'Full Stack & AI Integrations Developer',
  subtitle: 'Especialista em aplicações modernas com TypeScript, React, Next.js, Python, Kotlin e inteligência artificial aplicada.',
  bio: 'Estudante de Análise e Desenvolvimento de Sistemas e desenvolvedor focado em unir interfaces de alto impacto visual a fluxos inteligentes de Inteligência Artificial. Com sólida base técnica que vai do front-end moderno (Next.js/React) ao backend e bancos relacionais com PostgreSQL/PostGIS, transformo desafios complexos e necessidades de negócios em produtos funcionais, escaláveis e inovadores.',
  email: 'danilorib2324@gmail.com',
  phone: '(31) 97145-9370',
  location: 'Betim - MG, Brasil',
  github: 'https://github.com/Ooliveiradev',
  linkedin: 'https://www.linkedin.com/in/danilo-oliveira-127b3126a',
  availability: 'Disponível para Estágio & Posições em Tecnologia (Segunda a sexta até 18h)',
  links: [],
  photo: '',
  resumeUrl: '',
  resumeLabel: 'Baixar currículo',
};

export const ISLANDS_CONFIG: IslandConfig[] = [
  {
    id: 'projects',
    name: 'Ilha dos Projetos',
    tagline: 'Projetos que Viram Soluções Reais',
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
    tagline: 'Trajetória Profissional, Atuação Técnica & Soluções Reais',
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
    tagline: 'Stack Tecnológica, Ecossistema Moderno & Arquitetura Web',
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
    tagline: 'Graduação em ADS (PUC Minas), Engenharia (CEFET-MG) & Certificações',
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
    tagline: 'Perfil Profissional, Trajetória & Canais de Contato Direto',
    color: '#ec4899', // Pink Laser
    orbitRadius: 30,
    orbitSpeed: 0.13,
    angleOffset: 5.0,
    elevation: -4.0,
    iconName: 'UserCheck',
    challengeTitle: 'Conexão de Frequência Segura',
    challengeXp: 150,
  },
  {
    id: 'analytics',
    name: 'Ilha de Analytics',
    tagline: 'Telemetria Anônima & Fluxos em Tempo Real',
    color: '#22d3ee',
    orbitRadius: 120,
    orbitSpeed: -0.04,
    angleOffset: 5.8,
    elevation: -3.6,
    iconName: 'QueryStats',
    challengeTitle: 'Observatório de Dados',
    challengeXp: 0,
  },
];

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'quantia-mvp',
    title: 'QuantIA (Protótipo)',
    category: 'IA Aplicada & Engenharia Civil',
    role: 'Full Stack & AI Integrations Developer',
    statusBadge: 'Protótipo · Descontinuado',
    shortDesc: 'Automação inteligente de levantamento quantitativo de materiais a partir de plantas baixas em PDF com Google Gemini.',
    description: 'Protótipo descontinuado, mantido aqui apenas como peça de portfólio: o desenvolvimento foi encerrado e o projeto não receberá novas versões. Plataforma web que automatiza a extração de ambientes, áreas e tipos de acabamento diretamente de plantas baixas em PDF através do Google Gemini. Inclui motor de cálculo determinístico com memória de cálculo completa para piso, argamassa e rejunte, além de um Agente Auditor autônomo para detecção de inconsistências antes da exibição dos resultados. Cobertura robusta de testes unitários com Vitest e testes ponta a ponta com Playwright.',
    tags: ['Next.js 16', 'React 19', 'TypeScript', 'Gemini AI', 'Supabase', 'Zod', 'Tailwind v4', 'Vitest', 'Playwright'],
    metrics: 'Redução drástica de horas para segundos na extração de áreas e quantitativos de obras',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/QuantIA-MVP',
    featured: true,
    accentColor: '#38bdf8',
    media: [
      { id: 'quantia-demo', kind: 'video', src: './assets/portfolio/quantia-demo.mp4', thumbnail: './assets/portfolio/quantia-poster.webp', alt: 'Gravação do QuantIA: login, abertura da residência de demonstração e memória de cálculo do porcelanato.', caption: 'Protótipo em funcionamento com uma planta fictícia: do resultado à memória de cálculo.' },
      { id: 'quantia-entrada', kind: 'image', src: './assets/portfolio/quantia-01-entrada.webp', alt: 'Tela inicial do QuantIA para iniciar um novo levantamento.', caption: 'Entrada: novo levantamento e projeto de demonstração.' },
      { id: 'quantia-resultados', kind: 'image', src: './assets/portfolio/quantia-02-resultados.webp', alt: 'Resumo do levantamento da residência de 120 m² com 11 ambientes, 12 materiais e 2 pontos de atenção.', caption: 'Resumo com ambientes, materiais e pontos de atenção do auditor (dados fictícios).' },
      { id: 'quantia-memoria', kind: 'image', src: './assets/portfolio/quantia-03-memoria-calculo.webp', alt: 'Quantitativo de materiais com a memória de cálculo do porcelanato 90x90 expandida.', caption: 'Quantitativo de materiais com memória de cálculo auditável.' },
      { id: 'quantia-mobile', kind: 'image', src: './assets/portfolio/quantia-04-mobile.webp', alt: 'Resumo de revisão do levantamento fictício no celular.', caption: 'Revisão do levantamento em tela pequena.' },
    ],
    stats: [
      { label: 'Economia de Tempo', value: '94% mais rápido', icon: 'timer' },
      { label: 'Motor Matemático', value: '100% determinístico', icon: 'calculate' },
      { label: 'Cobertura Testes', value: 'Vitest + Playwright', icon: 'verified' },
      { label: 'Modelo de Visão', value: 'Gemini 2.0 Multimodal', icon: 'auto_awesome' },
    ],
    highlights: [
      'Extração visual automatizada de plantas baixas em PDF com leitura de cotas, cômodos e legendas.',
      'Cálculo analítico certificado de consumo de argamassa (colagem simples/dupla) e rejunte por m².',
      'Agente Auditor autônomo baseado em IA para verificação cruzada de divergências em medidas e áreas.',
      'Arquitetura segura com Supabase PostgreSQL, autenticação e armazenamento de plantas.',
      'Tipagem estrita de ponta a ponta com schemas Zod garantindo robustez nas saídas do LLM.',
    ],
    architecture: {
      overview: 'Pipeline moderna em Next.js 16 (App Router) conectada ao Google Gemini para inferência de visão computacional, sanitizada via schemas estritos Zod e processada por um motor matemático puro e auditável.',
      flow: [
        'Upload da prancha arquitetônica em PDF pelo usuário via dropzone seguro',
        'Renderização de páginas de alta fidelidade e envio ao Google Gemini 2.0 Flash/Pro',
        'Extração estruturada de cômodos, áreas (m²), perímetros e acabamentos especificados',
        'Validação estrita de tipagem e integridade dos dados via schemas Zod',
        'Execução do motor determinístico de cálculo de materiais (piso, argamassa, rejunte e perdas)',
        'Auditoria autônoma de consistência: conferência entre soma de ambientes e área bruta',
        'Geração e exportação do relatório detalhado com memória de cálculo',
      ],
      database: 'Supabase PostgreSQL com Row Level Security (RLS) e bucket protegido para armazenamento de plantas.',
      security: [
        'Validação estrita de tipos em tempo de execução via Zod',
        'Chaves de API Gemini mantidas exclusivamente no servidor (Server Actions / API Routes)',
        'Isolamento multi-tenant por usuário no Supabase com políticas RLS',
      ],
    },
    quickStart: {
      cloneCmd: 'git clone https://github.com/Ooliveiradev/QuantIA-MVP.git',
      installCmd: 'cd QuantIA-MVP && pnpm install',
      runCmd: 'pnpm dev',
      envExample: 'GEMINI_API_KEY="AIzaSy..."\nNEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"\nNEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..."',
    },
    readme: `# QuantIA (Protótipo) — Levantamento Quantitativo Inteligente com IA

> **Status: protótipo descontinuado.** Mantido apenas como projeto de portfólio; não receberá novas versões.

> Automação preditiva de orçamentos e quantitativos de obras na construção civil utilizando Google Gemini Multimodal e cálculos determinísticos.

## 📌 Visão Geral & O Problema

Na construção civil, o levantamento quantitativo de materiais (pisos cerâmicos, porcelanatos, argamassas colantes e rejuntes) a partir de plantas baixas é historicamente um processo manual, exaustivo e sujeito a erros humanos de transcrição. Orçamentistas e engenheiros chegam a despender dias para calcular áreas líquidas, descontar vãos e aplicar coeficientes de perda de materiais.

O **QuantIA** resolve essa dor ao combinar a inteligência visual do **Google Gemini** com um **Motor Matemático Determinístico** e um **Agente Auditor** autônomo.

## ⚡ Principais Funcionalidades

- [x] **Leitura Multimodal de Plantas em PDF**: Processamento de pranchas arquitetônicas de qualquer escala sem conversão prévia manual.
- [x] **Identificação Automatizada de Ambientes**: Detecção de salas, quartos, banheiros, cozinhas, varandas e áreas de serviço com cotas precisas.
- [x] **Motor Determinístico de Consumo**:
  - Cálculo de argamassa (AC-I, AC-II, AC-III) baseado em colagem simples ou dupla.
  - Cálculo volumétrico de rejunte pela fórmula padrão: \`(L + C) / (L * C) * E * J * d\`.
  - Margem configurável de perda de corte (5% a 15%).
- [x] **Agente Auditor Autônomo**: IA que inspeciona a coerência entre a soma das áreas e os perímetros das cotas, sinalizando discrepâncias.
- [x] **Memória de Cálculo Auditável**: Relatórios detalhados com fórmulas expostas para conferência técnica.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Função Principal |
| --- | --- | --- |
| **Framework** | Next.js 16 (App Router) & React 19 | SSR, Server Actions e renderização de alta performance |
| **Linguagem** | TypeScript 5.8 | Tipagem estrita de ponta a ponta |
| **Inteligência Artificial** | Google Gemini 2.0 Flash / Pro | Visão computacional multimodal e extração de cotas |
| **Validação** | Zod | Garantia estrutural das saídas geradas pelos prompts |
| **Estilização** | Tailwind CSS v4 | Design system responsivo e tema escuro industrial |
| **Banco & Auth** | Supabase (PostgreSQL) | Autenticação, banco relacional e armazenamento de arquivos |
| **Testes** | Vitest & Playwright | Testes unitários do motor matemático e testes ponta a ponta |

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ ou pnpm 9+
- Chave de API do Google Gemini (Google AI Studio)
- Projeto no Supabase (gratuito)

\`\`\`bash
# 1. Clone o repositório
git clone https://github.com/Ooliveiradev/QuantIA-MVP.git
cd QuantIA-MVP

# 2. Instale as dependências
pnpm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local

# 4. Inicie o servidor de desenvolvimento
pnpm dev
\`\`\`

### Variáveis de Ambiente (.env.local)
\`\`\`env
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
\`\`\`

## 🧪 Estratégia de Testes

\`\`\`bash
# Executar testes unitários do motor de cálculo determinístico
pnpm test

# Executar suíte ponta a ponta com Playwright
pnpm test:e2e
\`\`\`

---
Desenvolvido por **Danilo Ribeiro** ([@Ooliveiradev](https://github.com/Ooliveiradev)).`,
  },
  {
    id: 'ecofinance',
    title: 'EcoFinance',
    category: 'Fintech & Gestão Pessoal',
    role: 'Full Stack & Mobile Developer',
    statusBadge: 'Web no ar · App mobile em validação',
    shortDesc: 'Gerenciador financeiro pessoal para planejar o mês: quanto já gastei, quanto está comprometido e quanto sobra.',
    description: 'Aplicação web responsiva em Next.js com Cloud Firestore, publicada na Vercel. Reúne contas, cartões e faturas, planejamento mensal com recorrências e orçamento por categoria, relatórios e importação com revisão de extratos (OFX, CSV, XLSX, PDF e fotos com OCR local). Funciona sem Open Finance pago e sem IA externa obrigatória. O app Expo (Android/iOS) existe e compila na CI, mas ainda está em validação.',
    tags: ['TypeScript', 'Next.js', 'Cloud Firestore', 'Expo', 'React Native', 'Vitest', 'Playwright', 'Vercel'],
    metrics: 'Web em produção, coberta por testes de domínio, integração e E2E; app Expo em validação',
    liveUrl: 'https://ecofinance-ooliveiradev.vercel.app',
    githubUrl: 'https://github.com/Ooliveiradev/EcoFinance',
    featured: true,
    accentColor: '#10b981',
    media: [
      { id: 'eco-demo', kind: 'video', src: './assets/portfolio/ecofinance-demo.mp4', thumbnail: './assets/portfolio/ecofinance-poster.webp', alt: 'Gravação do EcoFinance: login, novo lançamento, painel atualizado, planejamento, cartões e relatórios.', caption: 'Fluxo completo com dados fictícios: registrar um gasto e ver o painel do mês atualizar.' },
      { id: 'eco-mes', kind: 'image', src: './assets/portfolio/ecofinance-01-meu-mes.webp', alt: 'Tela Meu mês do EcoFinance com próximas contas, saldo total e receitas e despesas do mês.', caption: 'Meu mês: saldo, próximas contas e disponibilidade projetada (dados fictícios).' },
      { id: 'eco-lancamentos', kind: 'image', src: './assets/portfolio/ecofinance-02-lancamentos.webp', alt: 'Lista de lançamentos do EcoFinance com filtros por conta, categoria, tipo e status.', caption: 'Lançamentos com filtros por conta, categoria, tipo, status e competência.' },
      { id: 'eco-planejamento', kind: 'image', src: './assets/portfolio/ecofinance-03-planejamento.webp', alt: 'Tela de planejamento mensal do EcoFinance com orçamento por categoria.', caption: 'Planejamento: realizado, previsto e orçamento por categoria.' },
      { id: 'eco-relatorios', kind: 'image', src: './assets/portfolio/ecofinance-04-relatorios.webp', alt: 'Relatórios do EcoFinance com evolução mensal de receitas e despesas.', caption: 'Relatórios por competência, com exportação CSV.' },
      { id: 'eco-mobile', kind: 'image', src: './assets/portfolio/ecofinance-05-meu-mes-mobile.webp', alt: 'Tela Meu mês do EcoFinance em um celular.', caption: 'A mesma tela na web responsiva, em um celular.' },
    ],
    stats: [
      { label: 'Plataformas', value: 'Web no ar · Expo em validação', icon: 'devices' },
      { label: 'Banco de Dados', value: 'Cloud Firestore', icon: 'database' },
      { label: 'Importação', value: 'OFX, CSV, XLSX, PDF e OCR', icon: 'upload_file' },
      { label: 'Testes', value: 'Vitest + Playwright', icon: 'verified' },
    ],
    highlights: [
      'Meu mês: disponibilidade projetada com a fórmula exibida na tela, separando competência e caixa.',
      'Cartões, faturas e parcelas: o pagamento da fatura não conta como gasto de novo.',
      'Importação com revisão: nada muda nos saldos até a confirmação, e o desfazer é protegido.',
      'PDF digital/escaneado e fotos com OCR local, sem enviar documentos a serviços externos.',
      'Login por e-mail e senha com sessões revogáveis e isolamento de dados por usuário.',
    ],
    architecture: {
      overview: 'Monorepo com web em Next.js, pacote de domínio e acesso a dados compartilhado e app Expo. A web roda na Vercel (região São Paulo) e acessa o Firestore sem chave estática, por federação de identidade OIDC.',
      flow: [
        'O usuário entra com e-mail e senha (sem cadastro público: o operador cria os acessos)',
        'Lançamentos, contas, cartões e recorrências são gravados com valores em centavos exatos',
        'O planejamento gera previsões sem duplicar contas já geradas',
        'Extratos importados ficam em revisão até o usuário confirmar',
        'Os mesmos cálculos alimentam painel, tabelas, API e exportação CSV',
      ],
      database: 'Cloud Firestore, com regras de segurança por usuário e testes de integração em emulador.',
      security: [
        'Isolamento por usuário e sessões revogáveis',
        'Sem chave de serviço: credencial temporária via OIDC da Vercel',
        'Verificações automáticas de segredos no código e no bundle',
      ],
    },
    quickStart: {
      cloneCmd: 'git clone https://github.com/Ooliveiradev/EcoFinance.git',
      installCmd: 'cd EcoFinance && pnpm install --frozen-lockfile',
      runCmd: 'pnpm --filter @ecofinance/next build && pnpm --filter @ecofinance/next start',
      envExample: 'AUTH_URL="http://127.0.0.1:3000"\nAUTH_SECRET="<32+ caracteres aleatórios>"\nFIREBASE_PROJECT_ID="demo-ecofinance"\nFIRESTORE_EMULATOR_HOST="127.0.0.1:8080"',
    },
    readme: `# EcoFinance — Planejamento financeiro pessoal

> Quanto já gastei, quanto ainda está comprometido e quanto sobra no mês.

## Status

- **Web:** no ar, coberta por testes de domínio, integração com Firestore e E2E.
- **App Expo (Android/iOS):** telas nativas e cache; compila na CI, com jornadas em aparelho ainda pendentes.
- **Removido:** Open Finance (Pluggy), captura com GPS, mapa e chat com IA.

## Recursos

- Meu mês, lançamentos, contas, cartões, faturas e parcelas
- Planejamento com recorrências e orçamento por categoria
- Importação de OFX/CSV/XLSX/PDF com revisão e OCR local
- Relatórios, gráficos e exportação CSV
- Backup, restauração com prévia e exclusão de dados

## Stack

TypeScript, Next.js, Cloud Firestore, Expo, Vitest, Playwright e Vercel.

---
Desenvolvido por **Danilo Ribeiro** ([@Ooliveiradev](https://github.com/Ooliveiradev)).`,
  },
  {
    id: 'portfolio-3d',
    title: 'Portfolio Cósmico 3D',
    category: 'Creative 3D & WebGL',
    role: 'Creative Developer & 3D Engineer',
    statusBadge: 'Em Produção · 60-120 FPS',
    shortDesc: 'Portfólio interativo gamificado em universo 3D com física inercial Rapier, iluminação de estúdio e 6 ilhas orbitais.',
    description: 'Experiência web 3D de alto impacto inspirada no trabalho de Bruno Simon. Desenvolvida com Three.js e React Three Fiber, apresenta simulação física inercial de veículo espacial com drift e suspensão elástica, iluminação de estúdio cósmico (Key/Fill/Rim), órbitas celestes matemáticas sincronizadas, 6 ilhas planetárias com Foguetipontos [F], minigame de corrida de checkpoints, analytics holográfico e desafios técnicos interativos.',
    tags: ['React Three Fiber', 'Three.js', 'Rapier 3D', 'TypeScript', 'Tailwind CSS', 'Vite'],
    metrics: 'Taxa estável de 60-120 FPS com sombras PCF e iluminação de estúdio cinematográfica',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/Portfolio-Ooliveiradev',
    featured: true,
    accentColor: '#818cf8',
    stats: [
      { label: 'Renderizador', value: 'Three.js + R3F', icon: 'view_in_ar' },
      { label: 'Física', value: 'Rapier 3D Rigidbody', icon: 'speed' },
      { label: 'Desempenho', value: '60-120 FPS Fluido', icon: 'monitor_heart' },
      { label: 'Áudio Procedural', value: 'Web Audio API Synth', icon: 'graphic_eq' },
    ],
    highlights: [
      'Controle inercial de veículo espacial com aceleração vetorial, atrito, drift e suspensão elástica.',
      'Iluminação de estúdio cinematográfica (Key Light, Fill Light, Rim Light e Ambient Light) calibrada.',
      '6 ilhas orbitais flutuantes com mecânica de atracamento automático [F] e câmera orbital adaptativa.',
      'Minigame de corrida contra o relógio com checkpoints colidíveis, contagem regressiva e Hall da Fama.',
      'Sintetizador sonoro sintetizado em tempo real na Web Audio API sem arquivos externos de áudio.',
    ],
    architecture: {
      overview: 'Pipeline WebGL de alta eficiência com React Three Fiber renderizando um grafo de cena otimizado, acoplado ao motor de física Rapier 3D em WASM para simulações rígidas em 60hz com zero garbage collection lag.',
      flow: [
        'Vite inicializa o canvas WebGL com gerenciamento de DPR adaptativo conforme o dispositivo',
        'Rapier 3D inicializa o mundo físico e instancia o Rigidbody da nave espacial',
        'Loop de animação sincronizado via useFrame atualiza posições, órbitas das ilhas e vetores de propulsão',
        'Câmera em terceira pessoa suavizada interpola posição com damping exponencial',
        'Sistema de colisão detecta anéis de corrida, cristais de XP e zonas de ancoragem',
        'Interface React sobreposta (HUD) reage ao estado reativo global sem causar re-render no canvas 3D',
      ],
      database: 'LocalStorage com schema versionado para persistência de XP, badges conquistadas e ranking de corrida.',
      security: [
        'Sem dependência de servidores terceiros: execução 100% client-side com isolamento seguro',
        'Sanitização e limites estritos de taxa de amostragem na Web Audio API',
      ],
    },
    quickStart: {
      cloneCmd: 'git clone https://github.com/Ooliveiradev/Portfolio-Ooliveiradev.git',
      installCmd: 'cd Portfolio-Ooliveiradev && npm install',
      runCmd: 'npm run dev',
      envExample: '# Nenhuma chave de API obrigatória para rodar a simulação física 3D localmente\nNODE_ENV="development"',
    },
    readme: `# Portfolio Cósmico 3D — Universo Gamificado

> Experiência imersiva 3D inspirada em Bruno Simon, unindo navegação física por veículo espacial, iluminação de estúdio e gamificação em tempo real.

## 📌 Visão Geral

Desenvolvido para transformar o clássico currículo web em uma jornada memorável, o **Portfolio Cósmico 3D** coloca o recrutador ou visitante no comando de um foguete espacial com física inercial completa, capaz de pousar em 6 ilhas planetárias orbitais que revelam cada faceta da carreira de Danilo Ribeiro.

## ⚡ Destaques Técnicos

- [x] **Física Inercial com Rapier 3D (WASM)**: Aceleração progressiva, inércia de rotação, atrito dinâmico e resposta elástica ao colidir com o solo.
- [x] **Iluminação Tridimensional de Estúdio**:
  - **Key Light**: Foco principal projetando sombras suaves PCF.
  - **Fill Light**: Preenchimento cromático em tons frios de azul cósmico.
  - **Rim Light**: Destaque de silhueta nas bordas dos corpos celestes.
- [x] **Mecânica de Atracamento das Ilhas [F]**: Detecção de proximidade com aproximação suave de câmera e telemetria de conteúdos.
- [x] **Minigame de Corrida por Checkpoints**: Desafio contra o relógio com portais colecionáveis, cronômetro de milissegundos e leaderboard.
- [x] **Sintetizador Web Audio API**: Efeitos sonoros de motor espacial, cliques e alertas gerados via osciladores senoidais e filtros de ganho.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| --- | --- |
| **Engine 3D** | Three.js & React Three Fiber (R3F) |
| **Física** | @dimforge/rapier3d-compat |
| **Linguagem** | TypeScript 5.8 |
| **UI & Animação** | Tailwind CSS & Motion |
| **Áudio** | Web Audio API nativa |

## 🚀 Como Executar

\`\`\`bash
# 1. Clone o projeto
git clone https://github.com/Ooliveiradev/Portfolio-Ooliveiradev.git
cd Portfolio-Ooliveiradev

# 2. Instale as dependências
npm install

# 3. Inicie o servidor
npm run dev
\`\`\`

---
Desenvolvido por **Danilo Ribeiro** ([@Ooliveiradev](https://github.com/Ooliveiradev)).`,
  },
  {
    id: 'nutrilife',
    title: 'NutriLife',
    category: 'Saúde & Nutrição',
    role: 'Front-end & UX Developer',
    statusBadge: 'Em desenvolvimento · IMC disponível',
    shortDesc: 'Site de nutrição com calculadora de IMC, blog e, em construção, calculadora de calorias, banco de receitas e diário alimentar.',
    description: 'Plataforma web feita com HTML, CSS e JavaScript puros, com Firebase para autenticação e conteúdo. A calculadora de IMC está funcional, com validação, classificação e recomendações. Calculadora de calorias, banco de receitas e diário alimentar ainda estão em desenvolvimento.',
    tags: ['HTML5', 'CSS3', 'JavaScript', 'Firebase'],
    metrics: 'Calculadora de IMC funcional; demais ferramentas em construção',
    liveUrl: '#',
    githubUrl: 'https://github.com/Ooliveiradev/NutriLife',
    featured: false,
    accentColor: '#f59e0b',
    media: [
      { id: 'nutri-demo', kind: 'video', src: './assets/portfolio/nutrilife-demo.mp4', thumbnail: './assets/portfolio/nutrilife-poster.webp', alt: 'Gravação do NutriLife: página inicial e cálculo do IMC com peso e altura.', caption: 'Página inicial e cálculo de IMC (72,5 kg e 175 cm).' },
      { id: 'nutri-home', kind: 'image', src: './assets/portfolio/nutrilife-01-visao-geral.webp', alt: 'Página inicial do NutriLife com menu e texto de boas-vindas.', caption: 'Página inicial.' },
      { id: 'nutri-imc', kind: 'image', src: './assets/portfolio/nutrilife-03-imc-formulario.webp', alt: 'Formulário da calculadora de IMC do NutriLife.', caption: 'Calculadora de IMC: formulário de peso e altura.' },
      { id: 'nutri-resultado', kind: 'image', src: './assets/portfolio/nutrilife-04-imc-resultado.webp', alt: 'Resultado do IMC 23,7 classificado como peso normal.', caption: 'Resultado, classificação e recomendação.' },
      { id: 'nutri-mobile', kind: 'image', src: './assets/portfolio/nutrilife-05-mobile.webp', alt: 'Calculadora de IMC do NutriLife em um celular.', caption: 'Layout responsivo em tela pequena.' },
    ],
    stats: [
      { label: 'Stack', value: 'HTML + CSS + JS', icon: 'code' },
      { label: 'Backend', value: 'Firebase', icon: 'cloud' },
      { label: 'Disponível', value: 'Calculadora de IMC', icon: 'calculate' },
      { label: 'Em construção', value: 'Calorias, receitas, diário', icon: 'construction' },
    ],
    highlights: [
      'Calculadora de IMC com validação de entrada, classificação e recomendações.',
      'Página inicial com blog filtrável por categoria, busca e ordenação.',
      'Layout responsivo, com navegação entre as ferramentas.',
      'Autenticação e conteúdo com Firebase (Authentication e Firestore).',
    ],
    architecture: {
      overview: 'Site multipágina em HTML, CSS e JavaScript (ES6+) sem framework, com Firebase para autenticação e dados do blog.',
      flow: [
        'O visitante escolhe a ferramenta no menu',
        'O formulário valida peso e altura antes de calcular',
        'O IMC é calculado e classificado na hora',
        'A interface mostra o resultado e orientações',
      ],
      database: 'Cloud Firestore para conteúdo do blog, com regras de segurança no repositório.',
      security: ['Regras do Firestore versionadas', 'Cálculo do IMC executado no navegador, sem enviar dados de saúde'],
    },
    quickStart: {
      cloneCmd: 'git clone https://github.com/Ooliveiradev/NutriLife.git',
      installCmd: 'cd NutriLife',
      runCmd: 'python -m http.server 4173',
      envExample: '# Site estático: abra http://localhost:4173\n# O Firebase é configurado em js/firebase-config.js',
    },
    readme: `# NutriLife — Sua jornada para uma vida saudável

> Site com ferramentas de nutrição: IMC, blog e, em construção, calorias, receitas e diário alimentar.

## Status

- **Disponível:** página inicial com blog e calculadora de IMC.
- **Em desenvolvimento:** calculadora de calorias, banco de receitas e diário alimentar.

## Stack

HTML5, CSS3, JavaScript (ES6+) e Firebase.

---
Desenvolvido por **Danilo Ribeiro** ([@Ooliveiradev](https://github.com/Ooliveiradev)).`,
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
    description: 'Visitou e explorou todas as 6 ilhas orbitais do sistema.',
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
    id: 'badge-crystal-novice',
    title: 'Minerador Estelar',
    description: 'Coletou pelo menos 3 cristais cósmicos flutuando em órbita.',
    icon: 'Sparkles',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'badge-crystal',
    title: 'Coletor Cósmico',
    description: 'Coletou todos os cristais de energia espacial espalhados pelo espaço.',
    icon: 'Diamond',
    xpReward: 250,
    unlocked: false,
  },
  {
    id: 'badge-inspector',
    title: 'Arquiteto de Software',
    description: 'Inspecionou os detalhes técnicos completos e código de projetos.',
    icon: 'FolderSearch',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'badge-contact',
    title: 'Comunicação Estabelecida',
    description: 'Acessou o terminal de contato ou links profissionais do desenvolvedor.',
    icon: 'Send',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-speedster',
    title: 'Piloto de Elite',
    description: 'Cruzou todos os 6 checkpoints da corrida Time Trial estelar.',
    icon: 'Flag',
    xpReward: 300,
    unlocked: false,
  },
  {
    id: 'badge-supersonic',
    title: 'Velocidade da Luz',
    description: 'Concluiu a corrida Time Trial em tempo recorde (< 28 segundos).',
    icon: 'Zap',
    xpReward: 400,
    unlocked: false,
  },
  {
    id: 'badge-boost-master',
    title: 'Hyperdrive Ativado',
    description: 'Utilizou o propulsor turbo de plasma para acelerar em alta velocidade.',
    icon: 'Rocket',
    xpReward: 150,
    unlocked: false,
  },
  {
    id: 'badge-orbit-drifter',
    title: 'Drifter Solar',
    description: 'Realizou uma manobra arriscada de assistência gravitacional próximo ao Sol.',
    icon: 'Sun',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-easter-asteroid',
    title: 'Geólogo Cósmico',
    description: 'Explorou e voou pelo cinturão de asteroides periférico.',
    icon: 'Layers',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-secret-voyager',
    title: 'Explorador do Vazio',
    description: 'Aventurou-se além das fronteiras do sistema solar no espaço profundo.',
    icon: 'Navigation',
    xpReward: 250,
    unlocked: false,
  },
  {
    id: 'badge-event-horizon',
    title: 'Além do Horizonte de Eventos',
    description: 'Tentou escapar do universo observável e sobreviveu à singularidade.',
    icon: 'Orbit',
    xpReward: 50,
    unlocked: false,
  },
  {
    id: 'badge-scholar',
    title: 'Mente Brilhante',
    description: 'Explorou a Ilha de Educação e interagiu com os elementos acadêmicos.',
    icon: 'BookOpen',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-technologist',
    title: 'Engenheiro Fullstack',
    description: 'Explorou a Ilha de Habilidades e investigou a stack de tecnologias.',
    icon: 'Terminal',
    xpReward: 200,
    unlocked: false,
  },
  {
    id: 'badge-perfectionist',
    title: 'Lenda da Galáxia',
    description: 'Alcançou a marca suprema de 10 ou mais conquistas desbloqueadas.',
    icon: 'Award',
    xpReward: 500,
    unlocked: false,
  },
];

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Danilo Ribeiro', score: 1450, badgesCount: 6, title: 'Desenvolvedor & Criador', date: 'Oficial' },
];

export const INITIAL_RACE_LEADERBOARD: RaceLeaderboardEntry[] = [
  { id: '1', name: 'Danilo Ribeiro', timeSeconds: 22.40, formattedTime: '00:22.40', date: 'Recorde do Criador' },
];

export const formatRaceTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

// The ship cruises at y=1. Keep every collectible in the same reachable plane.
export const CRYSTAL_HEIGHT = 1.2;

export const CRYSTALS_DATA = [
  { id: 1, position: [22, CRYSTAL_HEIGHT, 14] as [number, number, number], collected: false },
  { id: 2, position: [-38, CRYSTAL_HEIGHT, -24] as [number, number, number], collected: false },
  { id: 3, position: [44, CRYSTAL_HEIGHT, -40] as [number, number, number], collected: false },
  { id: 4, position: [-58, CRYSTAL_HEIGHT, 34] as [number, number, number], collected: false },
  { id: 5, position: [18, CRYSTAL_HEIGHT, 60] as [number, number, number], collected: false },
  { id: 6, position: [-32, CRYSTAL_HEIGHT, -72] as [number, number, number], collected: false },
  { id: 7, position: [75, CRYSTAL_HEIGHT, 32] as [number, number, number], collected: false },
];
