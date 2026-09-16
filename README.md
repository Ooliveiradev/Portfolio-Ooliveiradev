<div align="center">
  <h1>🚀 Portfolio 3D Espacial Interativo</h1>

  <p>
    <strong>Portfólio interativo gamificado em 3D inspirado em Bruno Simon — desenvolvido com Three.js, React Three Fiber, Rapier Physics, órbita de corpos celestes em tempo real, circuito de corrida, minigames e áudio procedural cósmico.</strong>
  </p>

  <p>
    <a href="https://github.com/Ooliveiradev/Portfolio-Ooliveiradev/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-38bdf8?style=flat-square" alt="MIT License" />
    </a>
    <a href="https://nodejs.org">
      <img src="https://img.shields.io/badge/node-%3E%3D20-10b981?style=flat-square&logo=node.js&logoColor=white" alt="Node >= 20" />
    </a>
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/Three.js-r185-black?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/R3F-v9-white?style=flat-square&logo=react" alt="React Three Fiber" />
    <img src="https://img.shields.io/badge/Rapier-3D_Physics-EF4444?style=flat-square" alt="Rapier Physics" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Web_Audio_API-Procedural-f59e0b?style=flat-square" alt="Web Audio API" />
  </p>
</div>

---

## ✨ Requisitos & Funcionalidades Entregues

Abaixo estão todos os requisitos e funcionalidades arquitetados e entregues no projeto até o momento, organizados por sistema:

| Módulo / Sistema | Requisito / Funcionalidade | Status |
|---|---|:---:|
| 🚀 **Foguete & Pilotagem** | Foguete espacial com física Rapier, drift com roll e pitch dinâmico, turbo boost (`Espaço`), partículas de exaustão e sistema de respawn | ✅ Entregue |
| 🪐 **Ilhas & Órbita Viva** | 5 Ilhas flutuantes (Projetos, Carreira, Tecnologias, Acadêmica e Sobre Mim) com motor orbital unificado e colisores cinemáticos | ✅ Entregue |
| ⛰️ **Rebalanceamento de Altitude** | Ilhas rebaixadas para $Y = -3.8 \sim -4.4$, permitindo voo livre seguro do foguete em $Y = 1.0$ sem atravessar ou colidir com estruturas | ✅ Entregue |
| 🧭 **MiniMap em Tempo Real** | Radar SVG calculando posições orbitais vivas a cada frame com traçado de aproximação e vetor de rotação | ✅ Entregue |
| 🎬 **Warp In (Tela Inicial $\to$ Jogo)** | Foguete surge em voo do espaço profundo em arco parabólico $[0, 24, -40] \to [0, 1.0, 16]$ e desbloqueia os controles suavemente | ✅ Entregue |
| 🪐 **Pouso Cinemático na Ilha** | Piloto automático faz curva aerodinâmica e pousa no heliponto da ilha viva $[ix, iy + 0.35, iz + 3.2]$ com som de touchdown | ✅ Entregue |
| 🛫 **Decolagem Cinemática** | Decolagem vertical direta com som de liftoff do heliponto até a altitude de cruzeiro $Y = 1.0$, devolvendo o controle | ✅ Entregue |
| 🛸 **Warp Out (Jogo $\to$ Tela Inicial)** | Ao clicar no botão Home, o foguete empina o bico e dispara $+95$ unidades para fora da tela com som de hiperespaço | ✅ Entregue |
| 🏁 **Fase 4: Corrida Cósmica (Time Trial)** | Ponto de largada ao lado do Sol com card "Iniciar Corrida", contagem 3-2-1, argolas de turbo, bússola 3D e ranking de scores | ✅ Entregue |
| 🛰️ **Fase 5: Satélites & Caixas de Carga** | Satélites com colisão elástica e contêineres espaciais com física rígida Rapier empurráveis pelo foguete (+35 XP em caixas perdidas) | ✅ Entregue |
| 🛸 **Fase 6: Vida em Miniatura nas Ilhas** | Drones de patrulha com feixes cônicos de escaneamento, luzes sequenciais no heliponto e torres de radar girando $360^\circ$ | ✅ Entregue |
| 🎵 **Fase 7: Áudio Procedural Cósmico** | Som suave de jato (ruído rosa + sub-grave aveludado sem chiado), drone celestial Dm9 com LFO de respiração e 4 efeitos de transição | ✅ Entregue |
| 🌌 **Fenômenos Celestes** | Sol central com campo gravitacional/calor, poeira estelar dinâmica, estrelas cadentes, cometas e buraco negro com disco de acreção | ✅ Entregue |
| 🎮 **Gamificação & Minigames** | Coleta de Cristais (+25 XP), sistema de níveis, badges desbloqueáveis e desafios técnicos interativos em cada ilha | ✅ Entregue |
| 📱 **Controles Mobile Touch** | Joystick analógico virtual na tela e botões dedicados de aceleração, turbo e docking rápido na ilha mais próxima | ✅ Entregue |

---

### Detalhamento das Funcionalidades

#### 1. 🚀 Foguete Espacial & Dinâmica de Pilotagem
- **Motor Físico Rapier 3D**: O foguete é controlado por um corpo rígido dinâmico (`RigidBody`), aplicando impulsos direcionais com vetor `forward` real.
- **Aerodinâmica & Banking Roll**: Ao virar, o chassi inclina suavemente no eixo Z (*banking roll*) e ajusta o *pitch* ao acelerar/desacelerar.
- **Turbo Boost**: Acionado pela barra de espaço (ou botão na tela mobile), aumentando a velocidade máxima de cruzeiro de $27$ para $46\text{ unidades/s}$.
- **Partículas de Exaustão Dinâmicas**: Pool reutilizável de partículas de fumaça e plasma colorido geradas no bocal do motor com decaimento suave.
- **Sistema de Respawn & Anti-Gravidade**: Proteção caso o jogador caia em direção ao Sol ou se afaste da galáxia, com teletransporte seguro e efeito visual de invulnerabilidade piscante.

#### 2. 🪐 Ilhas Orbitais & Motor Celestial em Tempo Real
- **5 Ilhas Flutuantes Temáticas**:
  - **Ilha dos Projetos**: Laboratório com edifícios corporativos, telas holográficas e terminais de deploy.
  - **Ilha da Carreira**: Linha do tempo de experiências profissionais com marcos arquitetônicos e bandeiras.
  - **Ilha de Tecnologias**: Reator de energia néon com pilares representativos das stacks e linguagens.
  - **Ilha Acadêmica**: Observatório universitário com estantes digitais, diplomas e certificações.
  - **Ilha Sobre Mim**: Base pessoal com biosfera, links sociais e sintetizador de perfil.
- **Motor Orbital Puro (`celestialCoords.ts`)**: Unifica o relógio de rotação entre a renderização Three.js e a projeção 2D do MiniMap SVG.
- **Colisores Cinemáticos Rapier**: As plataformas utilizam `kinematicPositionBased`, mantendo a colisão sólida perfeitamente acoplada à geometria em movimento orbital sem deslizamentos.

#### 3. ⛰️ Calibração de Altitude & Voo Livre Seguro
- **Problema Solucionado**: No layout anterior, o foguete voava em $Y = 0.5$, colidindo e atravessando montanhas e edifícios das ilhas.
- **Solução de Engenharia**:
  - Rebaixamento vertical de todas as plataformas para cotas entre $-3.8$ e $-4.4$.
  - O cume das estruturas mais altas atinge no máximo $Y \approx -0.8$.
  - O foguete navega com altitude de cruzeiro estabilizada em $Y = 1.0$, garantindo mais de $1.8$ unidades de folga livre acima das ilhas.
  - As argolas de velocidade e os satélites foram alinhados a essa mesma altitude de voo.

#### 4. 🧭 Radar / MiniMap SVG em Tempo Real
- **Varredura Orbital a 16 FPS**: Desenha a posição precisa de cada ilha calculada em tempo real pela fórmula matemática de órbita.
- **Orientação Bruno Simon**: Marcadores em diamante que indicam a localização das ilhas fora do campo de visão da câmera.
- **Vetor de Navegação**: Exibe o foguete com ângulo de rotação em tempo real e linha tracejada apontando para o destino selecionado.

#### 5. 🎬 Cinemáticas & Transições de Câmera Fluidas
- **Transição de Entrada (*Warp In*)**:
  - Ao clicar em "Iniciar Exploração" / "Jogar", o foguete surge em voo do espaço profundo $[0, 24, -40]$ descendo em curva parabólica até $[0, 1.0, 16]$.
  - Toca o som procedural `playWarpEntry()` e a câmera interpola suavemente até o ponto isométrico sem cortes. Ao pousar na altitude de cruzeiro, o controle é transferido imediatamente para o jogador.
- **Pouso no Heliponto da Ilha (*Island Landing*)**:
  - Ao clicar em qualquer ilha (no 3D, no mapa ou na barra rápida), o piloto automático guia a nave em trajetória curva até o heliponto $[ix, iy + 0.35, iz + 3.2]$.
  - Toca o efeito `playTouchdown()` (som magnético + despressurização pneumática) e o modal da ilha se abre somente após a aterrissagem.
- **Decolagem Vertical (*Vertical Liftoff*)**:
  - Ao fechar o modal da ilha (botão ou `ESC`), o som `playLiftoff()` é acionado e a nave sobe verticalmente do heliponto até $Y = 1.0$, liberando a condução manual em pleno voo.
- **Transição de Saída (*Warp Out*)**:
  - Ao clicar no botão Home do HUD, a nave empina o bico, aciona o pós-combustor, toca `playWarpExit()` e dispara $+95$ unidades para fora da tela, enquanto a câmera volta à visão panorâmica estelar.

#### 6. 🏁 Fase 4: Circuito Cósmico de Corrida (Time Trial & Ranking)
- **Localização**: Próximo ao Sol, ao lado da argola especial de propulsão cósmica.
- **Interatividade**: Ao se aproximar, surge o card holográfico *"Iniciar Corrida"*.
- **Contagem Regressiva**: Animação cinematográfica central 3... 2... 1... GO! com áudio de largada.
- **Direcionamento 3D da Próxima Argola**: Bússola e indicador visual apontando para o próximo anel do circuito.
- **Time Trial & Ranking**: Cronômetro de alta precisão em tempo real, melhor tempo (*Best Time*) e salvamento de pontuação no ranking local.

#### 7. 🛰️ Fase 5: Satélites & Caixas de Carga com Física Rapier
- **Satélites Artificiais de Órbita**: Corpos rígidos com chassi em titânio grafite, painéis solares reflexivos, antena de telemetria e rotação inercial com colisão elástica.
- **Contêineres de Carga Espacial**: Pilhas de caixas sci-fi com juntas néon coloridas espalhadas pelo espaço que reagem dinamicamente aos choques da nave.
- **Caixas Perdidas Colecionáveis**: 3 caixas especiais que, ao serem encontradas, concedem $+35\text{ XP}$.

#### 8. 🛸 Fase 6: Vida em Miniatura nas Ilhas
- **Drones de Patrulha Autônomos**: Pequenas sondas orbitando cada ilha com feixes cônicos holográficos de varredura e inclinação de voo realista.
- **Pista Sequencial de Heliponto**: Onda luminosa contínua de LEDs que acelera a cadência de piscagem conforme o foguete se aproxima da base.
- **Mini Torres de Radar**: Antenas parabólicas rotativas com giro contínuo de $360^\circ$ e LED vermelho de telemetria.

#### 9. 🎵 Fase 7: Áudio Procedural Cósmico & Som Suave do Jato
- **100% Web Audio API**: Áudio sintetizado puramente por código — zero download de arquivos de áudio externos.
- **Som Suave do Jato (*Smooth Thruster*)**:
  - Substituição do ruído branco estridente por um fluxo de **ruído rosa (*pink noise*) musical** filtrado por passa-baixa em $270\text{Hz}$.
  - Camada harmônica sub-grave em onda triangular ($54\text{Hz}$) para conferir massa mecânica ao foguete.
  - Reatividade suave: abre para $440\text{Hz}$ no turbo e faz fade-out suave em $120\text{ms}$ ao soltar os controles.
- **Drone Celestial com Respiração LFO**:
  - Acorde aberto de 4 vozes em **Dm9 / Fmaj9** (D2, A2, E3, F3) com micro-detuning analógico.
  - Filtro passa-baixa de 24dB modulado por um oscilador LFO ultra lento de $0.04\text{Hz}$ (~25 segundos por ciclo), simulando a respiração do cosmos.

---

## 🏗️ Arquitetura do Repositório

```
Portfolio-Ooliveiradev/
├── src/
│   ├── main.tsx                       # Ponto de entrada da aplicação React 19
│   ├── App.tsx                        # Orquestrador de estados globais, HUD, modais e transições
│   ├── types.ts                       # Tipos centrais TypeScript (GameMode, IslandConfig, etc.)
│   ├── index.css                      # Configurações de Tailwind CSS v4 e estilos globais
│   │
│   ├── audio/
│   │   └── soundManager.ts            # Motor procedural Web Audio API (jato, drone cósmico, SFX)
│   │
│   ├── data/
│   │   └── portfolioData.ts           # Dados biográficos, projetos, experiências, ilhas e badges
│   │
│   ├── utils/
│   │   └── celestialCoords.ts         # Cálculo orbital em tempo real compartilhado (3D e SVG)
│   │
│   └── components/
│       ├── GalaxyScene.tsx            # Canvas Three.js, iluminação ambiente, estrelas e sol
│       │
│       ├── 3d/
│       │   ├── SpaceVehicle.tsx       # Foguete, física Rapier, cinemáticas, fumaça e controles
│       │   ├── CameraController.tsx   # Câmera com interpolação esférica e modos de visualização
│       │   ├── Islands.tsx            # Posicionamento orbital das ilhas e colisores Rapier
│       │   ├── SpeedRings.tsx         # Anéis de velocidade, corrida Time Trial e bússola 3D
│       │   ├── LowPolySun.tsx         # Sol central incandescente com partículas e atração
│       │   ├── CelestialHorizon.tsx   # Buraco negro com disco de acreção e nébula
│       │   ├── CosmicDust.tsx         # Poeira estelar dinâmica (*Cosmic Stardust Motes*)
│       │   ├── ShootingStars.tsx      # Estrelas cadentes e cometas periódicos
│       │   ├── OrbitRingsAndCollectibles.tsx # Cristais espalhados para coleta de XP
│       │   ├── DioramaFloor.tsx       # Grade espacial isométrica de referência
│       │   │
│       │   ├── islands/               # Modelagem procedural de cada ilha
│       │   │   ├── ProjectsIsland.tsx    # Ilha de Projetos (edifícios, outdoors, telas)
│       │   │   ├── ExperienceIsland.tsx  # Ilha de Carreira (marcos, linha do tempo)
│       │   │   ├── SkillsIsland.tsx      # Ilha de Tecnologias (reator, pilares neon)
│       │   │   ├── EducationIsland.tsx   # Ilha Acadêmica (observatório, estantes)
│       │   │   ├── AboutIsland.tsx       # Ilha Sobre Mim (biosfera, terminal pessoal)
│       │   │   └── IslandLife.tsx        # Drones de patrulha, radar 360° e pista do heliponto
│       │   │
│       │   ├── physics/               # Objetos interativos com Rapier
│       │   │   ├── RapierPhysicsContext.tsx # Contexto e inicialização do Rapier WASM
│       │   │   ├── SpaceSatellite.tsx       # Satélites orbitais com colisão elástica
│       │   │   ├── SpaceCargoBox.tsx        # Contêineres de carga rígidos dinâmicos
│       │   │   ├── PhysicsProps.tsx         # Obstáculos físicos diversos
│       │   │   └── useRapierBody.ts         # Hook customizado de registro físico
│       │   │
│       │   └── explosions/            # Efeitos visuais de impacto
│       │       ├── LowPolyExplosions.tsx
│       │       └── explosionEvents.ts
│       │
│       └── ui/                        # Interface gráfica (HUD, modais e radar)
│           ├── HUD.tsx                # Barra de status, XP, velocímetro, bússola e botões
│           ├── MiniMap.tsx            # Radar orbital SVG em tempo real
│           ├── LandingOverlay.tsx     # Tela inicial com apresentação e botão "Jogar"
│           ├── IslandModal.tsx        # Modal de detalhes de projetos, carreira e skills
│           ├── RaceOverlay.tsx        # HUD de corrida, contagem regressiva e ranking
│           ├── ChallengeModal.tsx     # Desafios técnicos interativos por ilha
│           ├── GameSettingsModal.tsx  # Modal de opções gráficas, áudio e controles
│           └── MobileControls.tsx     # Joystick analógico e botões de toque para mobile
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

| Ferramenta | Versão Mínima | Link |
|---|---|---|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **npm** ou **pnpm** | 9+ | [pnpm.io](https://pnpm.io) |
| **Navegador Moderno** | Qualquer (com suporte a WebGL e Web Audio) | Chrome, Firefox, Edge, Safari |

---

### 1. Clonar o Repositório

```bash
git clone https://github.com/Ooliveiradev/Portfolio-Ooliveiradev.git
cd Portfolio-Ooliveiradev
```

### 2. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Rodar em Modo Desenvolvimento

```bash
npm run dev
# ou
pnpm dev
```

Acesse o endereço local indicado no terminal:  
👉 **`http://localhost:3000`**

### 4. Build de Produção

```bash
npm run build
```

Para visualizar o build compilado:

```bash
npm run preview
```

---

## 🎮 Controles & Navegação

### 💻 Teclado & Mouse (Desktop)

| Tecla / Ação | Ação no Jogo |
|---|---|
| <kbd>W</kbd> ou <kbd>↑</kbd> | Acelerar o foguete para frente |
| <kbd>S</kbd> ou <kbd>↓</kbd> | Marcha ré / Frear |
| <kbd>A</kbd> ou <kbd>←</kbd> | Girar a nave para a esquerda |
| <kbd>D</kbd> ou <kbd>→</kbd> | Girar a nave para a direita |
| <kbd>Espaço</kbd> | **Turbo Boost Cósmico** (aceleração máxima) |
| <kbd>R</kbd> | Respawn / Reposicionar a nave na origem segura |
| <kbd>ESC</kbd> | Fechar modal aberto / Decolar da ilha |
| **Clique com Botão Esquerdo** | Clicar em qualquer ilha para iniciar a aproximação e pouso |
| **Arrastar com o Mouse** | Orbitar e ajustar o ângulo de visão da câmera |

### 📱 Dispositivos Móveis & Touch

- **Joystick Analógico Virtual**: Canto inferior esquerdo para acelerar e direcionar o foguete.
- **Botão Turbo (Ícone de Raio)**: Ativa o turbo boost contínuo.
- **Botão Docking (Ícone de Ancoragem)**: Localiza e pousa automaticamente na ilha mais próxima.
- **MiniMap Interativo**: Toque em qualquer ilha no radar para navegar automaticamente.

---

## 🛠️ Tecnologias & Ferramentas

| Categoria | Tecnologias Utilizadas |
|---|---|
| **Core & Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite 6](https://vitejs.dev/) |
| **Renderização 3D** | [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei) |
| **Motor Físico** | [@dimforge/rapier3d-compat](https://rapier.rs/) (Física de corpos rígidos 3D compilada em WebAssembly) |
| **Design & UI** | [Tailwind CSS v4](https://tailwindcss.com/), [Motion (Framer Motion)](https://motion.dev/), [Lucide React](https://lucide.dev/) |
| **Motor de Áudio** | Web Audio API nativa (Síntese procedural sem dependências externas) |
| **Efeitos Visuais** | [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) para celebrações de XP e conquistas |

---

## ⚙️ Personalização & Customização de Conteúdo

Todos os dados do portfólio (informações pessoais, biografia, projetos, cargos de carreira, habilidades técnicas e badges) estão centralizados em um único arquivo:

📁 **[`src/data/portfolioData.ts`](./src/data/portfolioData.ts)**

```typescript
export const PERSONAL_INFO = {
  name: 'Seu Nome Aqui',
  title: 'Sua Profissão',
  subtitle: 'Sua descrição de destaque...',
  bio: 'Seu texto biográfico completo...',
  email: 'seuemail@exemplo.com',
  github: 'https://github.com/seu-usuario',
  linkedin: 'https://linkedin.com/in/seu-usuario',
};
```

Basta editar esse arquivo para que o portfólio inteiro, os modais 3D e as telas de perfil reflitam automaticamente as suas próprias informações.

---

## ⚡ Engenharia de Performance

- **Cena persistente:** trocar qualidade e redimensionar a janela mantém o Canvas, o veículo e o mundo físico.
- **Resolução controlada:** Low limita a 1280×720, Mid a 1600×900 e High a 1920×1080 pixels físicos; o aspecto da tela é preservado.
- **Qualidade adaptativa:** inicia em Mid quando não existe preferência salva. Quedas sustentadas de FPS reduzem efeitos sem substituir a preferência manual salva.
- **UI separada da simulação:** radar a 10 Hz e cronômetro a 20 Hz atualizam seus próprios componentes. Posição, rotação e tempo de corrida não provocam renderizações contínuas de App.
- **GPU e memória:** geometrias repetidas e fragmentos usam instancing; explosões usam um pool fixo; pós-processamento reaproveita buffers e libera os passes ao desmontar.
- **Áudio e inicialização:** parâmetros do motor mudam apenas nas transições de aceleração/turbo. Rapier inicializa uma vez e o carregamento aguarda a compilação assíncrona dos shaders.
- **Aba oculta:** renderização e relógios da interface pausam quando a página fica oculta.

Execute as verificações com:

```bash
npm run lint
npm run test:performance
npm run build
```

Veja [o diagnóstico, os limites e o roteiro de validação](docs/PERFORMANCE.md). As reduções de trabalho são verificadas por código e testes; FPS final depende do dispositivo e do navegador.

---

## 📋 Roadmap & Próximos Passos

- [ ] Modo multiplayer cooperativo via WebSockets para voar com amigos na galáxia.
- [ ] Personalização de skins e cores para o chassi e jatos do foguete na oficina.
- [ ] Suporte a áudio espacial 3D posicional via `PannerNode` em torno de cada ilha e do Sol.
- [ ] Conquistas adicionais com integração à API do GitHub (exibições de commits reais em tempo real).
- [ ] Localização de idiomas (i18n): Português / Inglês.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para obter mais informações.

---

<div align="center">
  <p>Desenvolvido com dedicação por <strong>Danilo Ribeiro</strong> (<a href="https://github.com/Ooliveiradev">@Ooliveiradev</a>) 🇧🇷</p>
</div>
