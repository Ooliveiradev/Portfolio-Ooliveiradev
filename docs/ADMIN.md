# Painel administrativo

Edite o portfólio inteiro pelo próprio site, sem mexer no código. O acesso fica escondido no segredo do desenvolvedor:

1. Abra o menu (⚙) → aba **Sobre mim** → clique **5 vezes no avatar**.
2. No terminal verde que aparece, escolha `./login --admin`.
3. Entre com a conta administradora. A sessão fica salva no navegador até você clicar em **Sair**.

Quem descobre o segredo vê apenas a tela de login. Sem a conta autorizada, nada é lido nem gravado (veja [Segurança](#segurança)).

## O que dá para editar

| Aba | O que controla |
| --- | --- |
| **Perfil** | Nome, cargo, subtítulo, biografia, disponibilidade, localização, foto, e-mail, telefone (opcional), GitHub, LinkedIn, links extras, currículo (PDF ou link) |
| **Seções** | As 6 ilhas: ordem, visibilidade, nome, frase, texto de abertura, título do desafio e cor |
| **Projetos** | Adicionar, duplicar, remover, ordenar e ocultar. Título, categoria, função, selo, descrições, resultado em destaque, links, cor, destaque, **tecnologias**, indicadores, destaques de engenharia, arquitetura, quickstart, **README (Markdown)** e **fotos e vídeos** |
| **Experiência** | Cargos, empresas, períodos, atividades e tecnologias |
| **Formação** | Cursos, instituições, competências e imagens de certificados |
| **Habilidades** | Grupos, itens, ordem, nível (0–100%) e destaque |
| **Conquistas** | Nome e descrição de cada conquista do jogo |
| **Aparência** | Cor de destaque de toda a interface (temas prontos ou cor livre) e o trecho de código da ilha de tecnologias |
| **Textos** | Frases fixas: abertura, tela inicial, títulos das janelas, formulário de contato, segredo, título e descrição da aba |
| **Mídias** | Biblioteca dos arquivos enviados, com indicação do que está em uso e exclusão do que sobrou |

Tudo que tem texto existe em **português e inglês**: use o seletor `PT | EN` no topo. Se uma língua ficar vazia, o site mostra a outra, e o painel avisa.

**Nada aparece vazio para o visitante.** Projeto sem fotos ou vídeos não mostra galeria; sem arquitetura, não há aba de arquitetura; sem README, não há aba de README; campo de link em branco não gera botão.

### Fluxo de trabalho

- **Prévia**: mostra o portfólio real (com navegação) já com as suas alterações, antes de publicar. Em cada seção há um botão “Ver na prévia” que abre a ilha correspondente.
- **Publicar**: valida tudo (links, cores, imagens sem texto alternativo etc.), lista o que precisa ser corrigido e só então grava. Visitantes veem a nova versão ao recarregar, em qualquer aparelho.
- **Descartar**: volta à versão publicada.
- **Rascunho**: suas alterações ficam guardadas neste navegador (inclusive se a aba fechar ou a sessão expirar) até você publicar ou descartar.
- **Dois dispositivos editando**: cada publicação tem um número de versão. Se outra pessoa/aparelho publicou antes de você, o painel avisa e não sobrescreve.

### Limites das mídias

| Tipo | Formatos | Tamanho máximo |
| --- | --- | --- |
| Imagem | JPG, PNG, WebP, GIF, AVIF | 5 MB |
| Vídeo | MP4, WebM | 50 MB (a capa é gerada automaticamente) |
| Documento | PDF (currículo) | 10 MB |

SVG e HTML são recusados de propósito (podem carregar scripts). O painel confere extensão, tipo e o conteúdo real do arquivo, e o servidor repete os mesmos limites.

## Como funciona

```
Visitante ──► lê  portfolio/main (Firestore, leitura pública, sem SDK)     ┐
                   mídias (Storage, leitura pública)                       ├─ conteúdo publicado
Administrador ──► Authentication (e-mail e senha)                          │
              └─► grava portfolio/main e envia mídias, se estiver em /admins ┘
```

- O conteúdo publicado é **um único documento** (`portfolio/main`) com o JSON do portfólio, mais o número da versão. Enquanto nada for publicado, o site usa o conteúdo que vem no código (`src/data/portfolioData.ts` + `src/i18n/portfolio.ts`), então **a migração é automática**: na primeira publicação tudo o que existe hoje já está carregado no painel.
- O SDK do Firebase só é baixado quando o administrador abre o login. Visitantes leem o documento pela API REST pública, e o último conteúdo fica em cache no navegador para abrir instantaneamente (e funcionar offline).
- Se o Firebase estiver fora do ar ou não configurado, o site abre normalmente com o conteúdo que está no código.

## Configuração (uma vez)

> Você precisa de uma conta Google. Os passos abaixo são feitos no console do Firebase; nada disso pode ser automatizado a partir do repositório.

### 1. Criar o projeto

1. Em <https://console.firebase.google.com> → **Adicionar projeto** (o Analytics pode ficar desligado).
2. **Visão geral do projeto → Adicionar app → Web (`</>`)**. Dê um apelido e **não** marque Hosting. Copie o objeto `firebaseConfig` (apiKey, authDomain, projectId, storageBucket, appId).

### 2. Autenticação

1. **Build → Authentication → Começar → Provedor E-mail/senha → Ativar** (deixe “link por e-mail” desligado).
2. Aba **Users → Add user**: cadastre o seu e-mail e uma **senha longa e única**. Anote o **UID** que aparece na lista.
3. Em **Settings → User actions**, desative **“Enable create (sign-up)”** quando essa opção estiver disponível. Mesmo que fique ligada, uma conta nova não ganha acesso: só quem está em `admins` (passo 5) consegue gravar.
4. Em **Settings → Authorized domains**, confirme `localhost` e adicione o domínio do site (por exemplo `ooliveiradev.github.io`).

### 3. Banco e arquivos

1. **Build → Firestore Database → Criar banco** (modo **produção**; escolha uma região próxima, por exemplo `southamerica-east1`).
2. **Build → Storage → Começar**. Desde 3 de fevereiro de 2026 o Cloud Storage exige o **plano Blaze** (cartão vinculado) ([FAQ oficial](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)). Dentro da cota gratuita do Google Cloud (5 GB armazenados e 100 GB de saída por mês) a fatura é zero; configure um **alerta de orçamento** no Google Cloud para ficar tranquilo. Sem Storage, o painel continua editando todos os textos; só o envio de fotos, vídeos, foto de perfil e PDF fica indisponível.

### 4. Publicar as regras de segurança

As regras estão no repositório ([`firestore.rules`](../firestore.rules) e [`storage.rules`](../storage.rules)). Com o Node instalado:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,storage --project SEU_PROJECT_ID
```

(Ou copie o conteúdo de cada arquivo para **Firestore → Regras** e **Storage → Regras** no console e clique em Publicar.)

### 5. Cadastrar a conta administradora

**Firestore Database → Iniciar coleção** → ID da coleção `admins` → ID do documento = **o UID** do passo 2.2 → adicione qualquer campo, por exemplo `createdBy` (string) = `console`.

Esse documento não pode ser criado nem alterado pelo site: só pelo console. Para **revogar** o acesso de alguém, apague o documento.

### 6. Proteger a chave da API

No [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → a chave “Browser key” do projeto → **Restrições de aplicativo: Referenciadores HTTP** → adicione `https://SEU-USUARIO.github.io/*` e `http://localhost:3000/*`. A chave do Firebase identifica o projeto e não é um segredo, mas restringi-la evita uso indevido da cota.

### 7. Conectar o site publicado

No GitHub: **Settings → Secrets and variables → Actions → aba Variables → New repository variable** (variáveis, não segredos):

| Variável | Valor |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Depois, **Actions → Deploy to GitHub Pages → Run workflow**. Para rodar localmente, copie as mesmas chaves para um arquivo `.env.local` (veja `.env.example`; ele não vai para o Git).

## Segurança

- **O que é público**: as chaves `VITE_FIREBASE_*` (identificam o projeto), o conteúdo publicado e as mídias. É exatamente o que qualquer visitante já vê.
- **O que protege os dados** são as regras do servidor, não o esconderijo do login:
  - `portfolio/main`: leitura pública; escrita só para quem tem documento em `admins/{uid}`, uma versão por vez e com tamanho máximo.
  - `admins`: um usuário só consegue consultar o próprio documento; ninguém grava pelo site.
  - Storage: leitura pública; envio e exclusão só do administrador, só nos formatos e tamanhos acima, sem sobrescrever arquivos.
  - Qualquer outra coleção ou pasta: negada.
- **Sem segredos no código**: nenhuma senha, token ou e-mail de administrador é enviado ao navegador. A senha só é digitada no formulário e vai direto ao Firebase Authentication.
- **Sem cadastro público**: o site nunca chama `createUser`. Uma conta criada por terceiros não tem documento em `admins`, portanto não lê nem grava nada administrativo.
- **Conteúdo defensivo**: tudo o que é lido é revalidado antes de ser exibido. Links só aceitam `http(s)`, mídias só vêm do site ou do bucket, cores precisam ser hexadecimais e o Markdown dos READMEs não executa `javascript:`.
- **Sessão**: expirada ou revogada, o painel pede o login de novo e preserva o rascunho.
- **Recomendado**: use uma senha longa e única e ative a verificação em duas etapas na sua conta Google. Os testes das regras estão em [`tests/firebase/rules.test.mjs`](../tests/firebase/rules.test.mjs).

## Testar localmente, sem Firebase real

Precisa de Java 21+ (os emuladores do Firebase rodam em Java).

```bash
npm run emulators                       # terminal 1: Auth, Firestore e Storage locais
ADMIN_EMAIL=voce@exemplo.com ADMIN_PASSWORD='uma-senha-de-teste' npm run emulators:seed   # terminal 2
```

Crie `.env.local` com `VITE_FIREBASE_PROJECT_ID=demo-portfolio`, `VITE_FIREBASE_API_KEY=demo`, `VITE_FIREBASE_APP_ID=demo`, `VITE_FIREBASE_AUTH_DOMAIN=demo.firebaseapp.com`, `VITE_FIREBASE_STORAGE_BUCKET=demo-portfolio.appspot.com` e `VITE_FIREBASE_EMULATORS=true`, depois rode `npm run dev`. O modo emulador só é ativado em desenvolvimento (`npm run dev`); builds de produção nunca o usam.

```bash
npm test            # lógica de conteúdo, validação de mídia e demais testes
npm run test:rules  # regras de segurança, nos emuladores
```

## Limites conhecidos

- A **geometria do universo 3D** (posição e órbita das ilhas, cristais, pista de corrida) e o **conteúdo interno dos mini-desafios** continuam no código. Nome, frase, cor, visibilidade e título do desafio de cada ilha são editáveis.
- A **pré-visualização em redes sociais** (Open Graph) lê o `index.html` estático e não acompanha o painel. O título da aba e a descrição para buscadores são atualizados em tempo de execução.
- O painel é em português.
