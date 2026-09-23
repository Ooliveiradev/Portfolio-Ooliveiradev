# Arquivos para substituir as mídias de teste — issue #10

As quatro galerias de projetos e a galeria acadêmica usam arquivos de teste identificados, conforme autorizado durante a implementação. Nenhuma dessas imagens é apresentada como captura real ou comprovação acadêmica. A foto de perfil, textos, experiências e cursos continuam vindo do portfólio existente.

## Pacote mínimo por projeto

Envie 2–4 screenshots e, se possível, um vídeo curto por projeto. Não precisa editar nem montar colagens: os arquivos originais facilitam gerar miniaturas leves e versões para ampliação.

| Arquivo sugerido | O que capturar | Como preparar |
| --- | --- | --- |
| `nome-projeto-01-visao-geral.png` | A tela principal com um estado útil, preenchido e legível | Desktop em 1440×900 ou 1920×1080, zoom do navegador em 100%, sem menus/devtools abertos |
| `nome-projeto-02-fluxo.png` | A funcionalidade que melhor demonstra o problema resolvido | Mostre a ação e seu contexto; evite somente telas de login ou páginas vazias |
| `nome-projeto-03-resultado.png` | O resultado produzido pelo fluxo anterior | Mantenha dados coerentes entre as capturas; informe quando estiver usando uma conta de demonstração |
| `nome-projeto-04-mobile.png` | A mesma função em tela pequena | Captura vertical a 390×844, 393×852 ou resolução nativa do celular, sem esticar a imagem |
| `nome-projeto-demo.mp4` | Um fluxo completo: entrada → ação → resultado | 15–40 segundos, 1080p, 30 fps, H.264/MP4; cursor visível, movimentos calmos, sem cortes rápidos. Preferencialmente sem música/narração |
| `nome-projeto-poster.png` | O frame mais representativo do vídeo | Mesma proporção do vídeo; será exibido antes de carregar o arquivo |

Objetivo após otimização: miniaturas em WebP abaixo de 100 KB, screenshots normalmente abaixo de 500 KB e clipes abaixo de 8 MB. Pode enviar originais maiores; não sacrifique a legibilidade do texto para atingir esses tamanhos manualmente.

## Roteiro específico por projeto

| Projeto | Screenshots prioritárias | Vídeo recomendado |
| --- | --- | --- |
| **QuantIA (MVP)** | Tela de envio/seleção de uma planta; análise com ambientes/áreas; quantitativos de materiais e memória de cálculo, se disponíveis na versão atual | Selecionar uma planta que você pode divulgar → iniciar análise → mostrar quantitativos → abrir a explicação/cálculo de um resultado. Não exponha plantas privadas de clientes |
| **EcoFinance** | Dashboard financeiro com dados de demonstração; criação ou categorização de transação; mapa/relatório ou recurso de IA que esteja funcionando; uma tela do app Android | Registrar uma movimentação → verificar atualização do painel → explorar uma visualização real. Oculte números de conta, saldos pessoais e tokens de integrações |
| **Portfolio Cósmico 3D** | Visão geral das cinco ilhas; nave próxima de uma ilha; conteúdo de uma ilha; versão mobile com controles visíveis | Iniciar exploração → aproximar da ilha → entrar → abrir um projeto → voltar. Faça a captura final depois de substituir as próprias mídias de teste para evitar referências recursivas a testes |
| **NutriLife** | Visão principal de acompanhamento; rotina/refeição ou hábito cadastrado; evolução/resumo que exista na versão atual; tela mobile | Cadastrar uma refeição/hábito → marcar atividade → conferir o acompanhamento atualizado. Use uma conta de demonstração sem dados de saúde de terceiros |

As sugestões partem das descrições já presentes em `portfolioData.ts`. Se uma função ainda não existir ou tiver mudado, capture o fluxo que funciona hoje e diga o que mudou; não é necessário fabricar uma tela para cumprir o roteiro.

## Certificados, diplomas e formação

| Arquivo | Conteúdo desejado |
| --- | --- |
| `certificado-web-curso-em-video-2024.pdf` | Certificado real do curso de Desenvolvimento Web cadastrado (150h), caso emitido |
| `certificado-python-rocketseat-2025.pdf` | Documento real da formação em Python cadastrada (30h), caso emitido |
| `certificado-marketing-2023.pdf` | Documento real do curso de Marketing Digital cadastrado (50h), caso emitido |
| `certificado-ingles-ccaa.pdf` | Certificado/declaração correspondente ao nível ou módulo efetivamente concluído |
| `puc-ads-declaracao.pdf` e `cefet-transportes-declaracao.pdf` | Apenas se desejar divulgar: declaração de matrícula ou vínculo. Cursos em andamento não devem aparecer como diplomas concluídos |

Prefira PDFs originais. Se tiver somente papel, digitalize reto, sem reflexos, com todas as bordas visíveis e texto legível (aproximadamente 200–300 dpi). JPG/PNG também servem. Remova CPF, matrícula e outros dados pessoais que não queira publicar. A galeria atual amplia imagens; dos PDFs fornecidos serão preparadas prévias em imagem, sem exigir um leitor PDF pesado no modal.

## Informações junto dos arquivos

Envie uma pasta/ZIP ou os arquivos aqui, acompanhados de uma lista simples:

- Projeto/curso a que cada arquivo pertence e ordem de exibição desejada.
- Legenda de 1–2 frases: o que está acontecendo, qual resultado é visível e sua participação.
- Data/versão da captura e se a aplicação está em produção, MVP, demonstração ou desenvolvimento.
- Para documentos: nome oficial do curso, instituição, data de conclusão e carga horária.
- Para vídeo com fala: texto da narração ou legenda, para preparar legendas acessíveis.
- Correções nos cargos, períodos, disponibilidade ou cursos, se o conteúdo atual do repositório estiver desatualizado.

## Integração

Os vínculos ficam nos campos opcionais `ProjectItem.media` e `EducationItem.certificates` de `src/data/portfolioData.ts`. Cada item tem `id`, `kind`, `src`, `thumbnail`, `alt` e `caption`. Os testes estão centralizados em `src/data/mediaTestAssets.ts` e `public/assets/test-media/`.

Ao receber o material, substituir os vínculos por mídias reais, escrever alternativas textuais específicas, remover `testOnly` apenas dos arquivos reais e retirar os fixtures que não forem mais usados. Até essa substituição, o critério original “zero placeholder” permanece intencionalmente pendente.
