# Circuito Cósmico — issue #36

Ao se aproximar do portal dourado em `[18, 1, 18]`, clique em **Iniciar Corrida** ou pressione **E**. A nave vai ao grid do circuito externo em `[0, 1, 112,8]`, perde a inércia e fica alinhada à pista durante a contagem. A câmera acompanha a traseira com enquadramento e horizonte estáveis mesmo durante o boost. A volta passa pelos portais 1–11 e termina novamente no portal 0.

O traçado percorre os quatro lados do mapa em aproximadamente 747 unidades, com curvas assimétricas e cinco sequências de curvas em S. As bordas ficam a 36 unidades uma da outra (cerca de 32 unidades livres entre as rochas), com largura constante e sem curvas fechadas abruptas. Os 12 portais têm espaçamento uniforme por distância e o radar mostra o contorno completo. A faixa escura e a linha central tornam a direção legível. A interface usa um mapa compacto, velocidade e nitro, deixando o centro da tela livre. Todo o corredor permanece dentro da zona segura da barreira cósmica.

Durante a corrida, a direção tem resposta rápida em baixa velocidade, suavização breve ao alternar teclas, maior aderência lateral e menos inclinação nas curvas. A aceleração é progressiva e a velocidade horizontal fica limitada a 46 unidades/s em cruzeiro e 54 unidades/s com nitro ou impulso de portal. Ao terminar o impulso, o limite volta suavemente ao cruzeiro. O nitro acelera progressivamente. A direção suavizada gira menos em alta velocidade para facilitar pequenas correções. A exploração mantém a pilotagem anterior.

- **WASD / setas / joystick:** acelerar, frear e virar.
- **Shift / Espaço / Turbo no celular:** nitro, com carga inicial de 100 e consumo de 24 por segundo. Na corrida, nitro também acelera a nave.
- **Portais:** a travessia vale em toda a largura útil. Passar no centro (faixa de 4,4 unidades) concede nitro por 1,1 s e recarga de 30 pontos, preservando a direção da nave. A passagem deve ser no sentido correto; aproximar-se ou atravessar de ré não conta.
- **Esc / Cancelar:** encerra a tentativa, remove as barreiras e devolve a câmera isométrica. Abrir outro modal ou voltar ao início também cancela a tentativa.
- **Aba oculta:** pausa o cronômetro, o fantasma e a contagem regressiva.

As duas bordas são instâncias de rochas com colisores fixos Rapier sobrepostos. A nave usa CCD e mantém a altitude da pista durante a corrida, impedindo atravessar ou subir por cima das barreiras. Uma guia contínua baseada no traçado remove as irregularidades de contato entre pedras. A primeira batida reduz a velocidade e redireciona a nave para deslizar ao longo da borda; enquanto houver contato e movimento, saem faíscas pequenas e breves, sem clarão ou onda de explosão. As faíscas aparecem apenas durante contato. O efeito geral de explosão fica desabilitado na corrida, inclusive para eventos vindos de outros objetos da cena.

Dezesseis obstáculos fixos alternam entre as laterais e o centro, incluindo sequências de desvio. As rochas marrons contrastam com a pista azul sem anéis, cones ou faixas de aviso; todos ficam afastados dos portais e deixam espaço para desviar dos dois lados. O contato reduz a velocidade e permite deslizar com faíscas, sem explosão. Zebras discretas acompanham as curvas.

O melhor percurso completo fica em `galactic_portfolio_bestRunTrajectory`, amostrado em até 20 Hz, com posições e rotações interpoladas na nave holográfica. Tentativas canceladas ou mais lentas não substituem o fantasma. O formato tem versão e validação; armazenamento indisponível não impede jogar. A gravação é limitada a 12.001 amostras para limitar memória e armazenamento (cerca de dez minutos); voltas acima desse limite continuam válidas para o cronômetro, mas não geram fantasma.

Tempos e ranking usam chaves `galactic_portfolio_best_race_time_v7` e `galactic_portfolio_race_ranking_v7`. Os dados antigos permanecem no navegador, mas pertencem ao percurso anterior e não são comparados com esta volta ampliada. Fantasmas de outras versões de pista são ignorados.

## Validação

Execute `npm run lint`, `npm run test:performance` e `npm run build`. A suíte inclui batidas frontais e oblíquas com o corpo Rapier real a até 54 unidades/s e a 30, 60 e 144 FPS, progressão de aceleração, frenagem e travessia ampla dos portais. Também cobre fechamento e folga do circuito, continuidade das duas bordas, colisão Rapier com CCD a 100 unidades/s e 30 FPS, limpeza dos colisores, cruzamento dos portais, consumo de nitro, validação e persistência do fantasma e pausa do relógio.

Para validação manual, teste a largada parado e em movimento, nitro até esgotar, passagem central e lateral pelos portais, colisão nas duas bordas, cancelamento durante contagem/corrida, conclusão, nova tentativa com fantasma e recarga da página. Verifique também o botão Turbo em tela estreita. O instancing reduz draw calls; FPS depende do dispositivo e deve ser medido em hardware real, sem garantia de 60 FPS.
