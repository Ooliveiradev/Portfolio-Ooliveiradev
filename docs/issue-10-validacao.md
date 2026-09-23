# Implementação incremental e validação — issue #10

## Arquitetura preservada

React 19/TypeScript/Vite, Tailwind, `motion/react` e cena React Three Fiber permanecem como base. `App` continua controlando navegação, desafios e XP; `IslandModal` continua selecionando conteúdo por ilha; `ProjectDetailModal` mantém as abas README, visão geral, arquitetura e Quickstart. `portfolioData.ts` e `getPortfolioContent` continuam sendo as fontes do conteúdo PT/EN.

Módulos compartilhados em `src/components/ui/narrative/`, sem dependências novas:

| Etapa | Implementação | Teste isolado |
| --- | --- | --- |
| 1. Entrada | `CinematicDialog`: zoom de 0,84 a 1 com curva `[0.22, 1, 0.36, 1]` em 560ms; opacidade sincronizada com superfície de blur fixo | Abrir/fechar cada ilha e projeto. Desktop tem zoom; mobile/qualidade baixa usam fade; movimento reduzido usa fade de 180ms |
| 2. Parallax | `NarrativeHero`: duas camadas, listener passivo, um rAF pendente por vez, deslocamento limitado, pausa fora da região visível | Rolar lentamente no desktop: fundo e texto seguem velocidades diferentes. Abaixo de 768px, qualidade baixa ou movimento reduzido não há parallax |
| 3. Mídias | `MediaGallery`: thumbnails lazy, imagens ampliadas, setas, Escape, erro de carregamento e vídeo nativo com `src` anexado por IntersectionObserver | Abrir um projeto → README → ampliar cada mídia. O vídeo só é solicitado após abrir; play manual, sem autoplay. Setas no player mantêm o comportamento nativo |
| 4. Código | `CodeStory` e lexer próprio: revelação por linha com intervalo configurável, pausa manual/fora da viewport/aba oculta, repetir e mostrar tudo | Tecnologias → código real de `pausableClock.ts`; projetos → README/Quickstart. Pausar e verificar que não avança. Rolar para fora e retornar: retoma do ponto anterior. Código completo continua disponível para leitores de tela |
| 5. Carreira | `NarrativeTimeline`: lista cronológica vertical com revelação uma única vez por marco | Rolar por todos os cargos, conferindo as datas e descrições existentes. Redução de movimento mostra todos sem animação |
| 6. Educação | Mesmo `MediaGallery`, com dados em `EducationItem.certificates` | Abrir o documento de teste; ampliar; Tab fica na camada superior; Escape restaura o foco à miniatura |

Não há `will-change` permanente. Animações de entrada/timeline/parallax usam `transform` e `opacity`; o blur tem valor fixo e sua camada entra por opacidade. A digitação reserva a altura total do código para evitar mudanças de layout. Timers/listeners/observers são limpos na desmontagem.

O hook de foco isola a aplicação e os diálogos inferiores com `inert`, contém Tab/Shift+Tab e captura Escape antes dos atalhos globais. Os diálogos usam portais para que transforms no modal pai não alterem a geometria do lightbox. Desafios usam o mesmo diálogo; o de carreira passou a ler os três registros profissionais mais recentes em vez das empresas fictícias que estavam fixas no componente. A mecânica de três marcos e a recompensa foram preservadas.

## Como executar

```sh
npm run dev
npm run lint
npm run test:narrative
npm run test:performance
npm run build
```

Com Vite na porta 3000:

- Aplicação completa: `http://127.0.0.1:3000/pt/`.
- Bancada sem a cena 3D: `http://127.0.0.1:3000/tests/narrative/pt/`.
- Movimento completo simulado: `http://127.0.0.1:3000/tests/narrative/pt/?motion=full`.
- Movimento reduzido simulado: `http://127.0.0.1:3000/tests/narrative/pt/?motion=reduced`.

A bancada usa os componentes reais e não entra no build de produção. Os parâmetros simulam a consulta de preferência apenas nessa bancada, sem modificar as configurações do sistema. A preferência CSS do sistema continua válida; a simulação é destinada à lógica React. A opção “Qualidade baixa” testa a degradação independente da largura. Use os links de idioma para conferir PT/EN.

Mantenha o processo Vite aberto ao revisar: o service worker existente oferece uma versão offline quando o servidor está indisponível, que pode conter módulos antigos. Após reiniciar o servidor, recarregue a página antes de testar.

## Regressão manual

1. Abrir ilha → detalhes → lightbox. Pressionar Escape uma vez por camada; a página não deve saltar diretamente para a navegação. Confirmar restauração de foco.
2. Tab e Shift+Tab devem permanecer no diálogo superior. O fundo e os diálogos inferiores não devem aparecer como controles acessíveis ativos.
3. Passar por todos os projetos com os botões de anterior/próximo. Links GitHub e botões de cópia continuam disponíveis. URLs de demo `#` não são oferecidas como demos reais.
4. Abrir o desafio de uma ilha e voltar. Conferir XP/inspeção no aplicativo completo; a bancada não grava pontuação.
5. Testar 390×844 e desktop. As galerias reorganizam as colunas; o modal continua rolável e o fechamento acessível.
6. Nos DevTools, verificar rede antes de abrir um vídeo; não deve existir download de vídeo. Reproduzir, trocar de mídia, fechar e alternar de aba; reprodução deve parar quando não visível/desmontada.
7. Em Performance, gravar scroll e abertura/fechamento com mídia carregada. Verificar frames e tarefas longas em hardware real e sob throttling. Transform/opacity e testes de lógica não constituem garantia universal de 60fps.

## Resultados e limites

- TypeScript e build de produção validados; permanece o aviso de tamanho do chunk de física Rapier já presente na arquitetura.
- No checkout isolado baseado em main, passaram 59 testes de regressão e os dois testes novos de narrativa (61 no total). Na área de trabalho original, passaram também oito testes das alterações locais de foguete/áudio, que não fazem parte desta entrega. Os testes novos verificam preservação literal do código pelo lexer e existência/tamanho/identificação das mídias de teste.
- Revisão no navegador: entrada, isolamento das camadas, setas da galeria, vídeo até o final na bancada, foco retornando à miniatura, parallax com velocidades distintas, pausa/repetição do código, layout mobile e lightbox acadêmico.
- Na validação final da aplicação completa, o MP4 reproduziu seus quatro segundos até o fim sem erro. Troca QuantIA → EcoFinance manteve um único modal de projeto; Escape fechou mídia → projeto → ilha, restaurou foco e removeu `inert` do aplicativo. Uma execução anterior do navegador embutido havia encerrado durante o teste; o problema não se repetiu nesta validação final.
- Mídias de teste foram autorizadas pelo usuário. O critério de conteúdo real para screenshots/certificados depende dos arquivos listados em `issue-10-capturas.md`. Os dados profissionais existentes foram preservados, sem alegar verificação externa de sua atualidade.
- Não foi feita uma medição de FPS em matriz de dispositivos; 60fps continua sendo alvo de validação em hardware real.
