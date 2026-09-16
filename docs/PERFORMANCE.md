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

Os 13 testes cobrem limites 4K/8K, telas verticais/ultrawide, redução real de pixels, aquecimento e intervalo de adaptação, picos isolados, retorno de aba oculta e ciclo de vida do áudio. O teste de aceleração constante simula 12.000 frames com apenas 6 agendamentos de parâmetros (entrada em cruzeiro e em turbo), em vez dos 36.000 que o loop anterior agendava.

Para comparar FPS entre versões, use a mesma máquina, navegador, viewport e preset no build de produção. Após o carregamento, registre trajetos equivalentes de 30 segundos com o painel Performance do navegador: entrada, voo/turbo, aproximação das ilhas, corrida e retorno dos modais. Compare tempo dos frames e tarefas longas, além da média de FPS. Teste também resize e High → Low → Mid durante o voo: a cena e a posição da nave devem persistir.

As reduções estruturais e os testes não equivalem a uma medição de FPS em todos os computadores. O custo de compilação inicial de shaders/WASM ainda existe, e o motor Rapier continua sendo o maior chunk do build.

## Referências técnicas

- [React Three Fiber: atualizações rápidas e alocações](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- [React Three Fiber: instancing e resolução adaptativa](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js: compilação assíncrona de shaders](https://threejs.org/docs/pages/WebGLRenderer.html)
- [Three.js: ciclo de vida do EffectComposer](https://threejs.org/docs/pages/EffectComposer.html)
