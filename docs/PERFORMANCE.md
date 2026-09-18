# Desempenho da experiência 3D

## Gargalos corrigidos

| Caminho | Comportamento anterior | Comportamento atual |
| --- | --- | --- |
| Qualidade e resize | A chave do Canvas remontava cena, shaders e física | Canvas persistente; atualização de resolução e dos recursos afetados |
| Monitor 4K | Piso de DPR 0,65 ultrapassava 1080p | Limite físico por preset, sem piso que viole o orçamento |
| Cronômetro e nave | Estado em App atualizado a cada frame da corrida e a ~20 Hz pela nave | Dados transitórios fora de App; relógios locais no radar e na corrida |
| Carregamento | Rapier duplicado, Preload síncrono/cubemap e saída antes dos shaders | Inicialização compartilhada e compilação assíncrona antes da entrada |
| Pós-processamento | Composer recriado; passes não liberados; bloom redimensionado para resolução cheia | Composer reutilizado, descarte explícito e buffers menores de bloom |
| Turbo | Aberração cromática permanecia habilitada após o primeiro uso | Intensidade chega a zero e a passagem é desativada |
| Janelas e contatos das ilhas | 96 meshes individuais | 6 grupos instanciados para esses detalhes |
| Partículas do horizonte | 20–56 meshes individuais | Uma malha instanciada |
| Explosões | Montagem/desmontagem de fragmentos e luzes a cada impacto | Pool de 4 explosões, fragmentos instanciados e uma luz reutilizada |
| Luzes locais | Muitas luzes decorativas e uma luz por mensagem | Emissão preservada e quantidade limitada de luzes dinâmicas |
| Som do motor | 3 automações de áudio por frame com entrada constante | Automação apenas ao acelerar, soltar, mudar turbo ou silenciar |
| Página oculta | Trabalho e amostras de FPS sem tratamento consistente de visibilidade | Renderização e relógios locais pausados; amostras reiniciadas ao voltar |

As contagens de meshes descrevem o trabalho removido nessas partes da cena, não o total de draw calls do frame. Sombras e pós-processamento também têm suas próprias passagens.

## Travamento nas interações (INP)

Na investigação de 17/09/2026, o build anterior apresentou uma interação de **8.800 ms** ao iniciar o voo: 5 ms de atraso de entrada, menos de 1 ms no handler e 8.795 ms até a apresentação. O mesmo intervalo criou 12 programas WebGL, com uma tarefa de renderização de 8.738 ms. Isso reproduz o padrão de atraso de apresentação da captura do DevTools.

Foram corrigidas duas causas de recompilação durante a interação:

- As luzes da nave estavam dentro de um grupo que se oculta na tela inicial e no respawn. Mostrar/ocultar o grupo alterava o número de luzes e invalidava os shaders dos materiais iluminados. Agora são oito luzes pontuais fixas (cinco ilhas, sol, nave e explosões), com intensidade variável; os brilhos decorativos usam materiais emissivos. A luz da nave permanece fora do grupo ocultável.
- O prewarm compilava para a tela, com conversão de cor e tone mapping, enquanto Mid/High renderizam a cena em um buffer HDR linear. O prewarm agora usa o mesmo tipo de destino do composer, incluindo materiais ocultos, com um buffer temporário de um pixel. O destino anterior é restaurado imediatamente, mesmo se a compilação falhar.

As variantes HDR/com sombras e tela/sem sombras são preparadas sequencialmente antes da entrada. A cena aguarda a conclusão sem chamar `render`, que forçaria a espera síncrona pelos shaders e interferiria na verificação assíncrona do Three. Os passes de pós-processamento são aquecidos atrás do carregamento e preservados entre presets; em Low, a renderização normal os ignora. Isso evita a recompilação em massa dos materiais na primeira troca de qualidade; recursos específicos de sombras e alterações de geometria ainda podem gerar programas adicionais.

Na mesma prévia local em Mid, a entrada corrigida registrou **64 ms**, com **zero novos programas**, contra 8.800 ms e 12 programas antes. Abrir o menu registrou 32 ms; depois de estabilizado, o contador confirmou zero passagens de renderização durante a pausa. A versão final também entrou em voo partindo de Low com 32 ms e zero novos programas. São amostras individuais em uma GeForce GT 1030, com o painel de diagnóstico ativo, não um benchmark estatístico. Na sequência de trocas de qualidade, o navegador integrado passou a espaçar frames em cerca de um segundo, sem bloqueio JavaScript correspondente; essa amostra não permite afirmar um INP final confiável para as trocas.

Menus sobre a cena usam renderização sob demanda e pausam a física e o relógio orbital compartilhado com o radar; cinematográficas, corridas em andamento e o carregamento continuam ativos. O tempo pausado não gera saltos das ilhas ao retomar. Teclado e joystick deixam de comandar a nave atrás de modais ou durante digitação. O joystick publica valores em uma ref, sem atualizar o App a cada movimento.

Para inspecionar localmente, abra a prévia com `?perf=1`. O painel opcional mostra Event Timing (separando entrada, processamento e apresentação), Long Animation Frames, programas WebGL e quantidade de luzes/passagens da cena. Clique em **Zerar amostra** depois do carregamento e repita a interação. Os dados ficam apenas na página, sem transmissão. Os tempos são amostras locais, não o INP de campo agregado nem uma garantia para todos os computadores.

## Qualidade

| Preset | Limite de largura × altura física | DPR máximo |
| --- | --- | --- |
| Low | 1280 × 720 | 1 |
| Mid (padrão) | 1600 × 900 | 1,25 |
| High | 1920 × 1080 | 2 |

O cálculo usa uma escala uniforme: telas verticais e ultrawide mantêm a proporção e respeitam ambas as dimensões. Os presets Low/Mid desativam o desfoque CSS sobre o Canvas em movimento. O modo Low também dispensa o pós-processamento.

A adaptação ignora os primeiros 4 segundos após carregamento, troca de qualidade ou retorno de uma aba oculta. Três amostras consecutivas abaixo de 48 FPS permitem reduzir um nível; há intervalo mínimo de 8 segundos entre reduções. A preferência escolhida pelo usuário continua salva. A renderização usa WebGL 2; detectar suporte a WebGPU não troca o renderer.

## Validação reproduzível

```bash
npm run lint
npm run test:performance
npm run build
npm run preview
```

Os 29 testes cobrem limites 4K/8K, telas verticais/ultrawide, redução real de pixels, aquecimento e intervalo de adaptação, picos isolados, retorno de aba oculta, ciclo de vida do áudio, bloqueio de controles durante digitação, relógio orbital pausável e preparação dos shaders para HDR/tela com restauração e descarte em caso de falha. O teste de aceleração constante simula 12.000 frames com apenas 6 agendamentos de parâmetros (entrada em cruzeiro e em turbo), em vez dos 36.000 que o loop anterior agendava.

Para comparar FPS entre versões, use a mesma máquina, navegador, viewport e preset no build de produção. Após o carregamento, registre trajetos equivalentes de 30 segundos com o painel Performance do navegador: entrada, voo/turbo, aproximação das ilhas, corrida e retorno dos modais. Compare tempo dos frames e tarefas longas, além da média de FPS. Teste também resize e High → Low → Mid durante o voo: a cena e a posição da nave devem persistir.

As reduções estruturais e os testes não equivalem a uma medição de FPS em todos os computadores. O custo de compilação inicial de shaders/WASM ainda existe, e o motor Rapier continua sendo o maior chunk do build.

## Referências técnicas

- [React Three Fiber: atualizações rápidas e alocações](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [React Three Fiber: instancing e resolução adaptativa](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js: compilação assíncrona de shaders](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js: ciclo de vida do EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)
- [web.dev: fases do INP e atraso de apresentação](https://web.dev/articles/optimize-inp)
