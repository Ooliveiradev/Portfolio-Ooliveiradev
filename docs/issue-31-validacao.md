# Issue #31 — experiência mobile e joystick direcional

O joystick segue a direção **na tela**, como solicitado: baixo move para baixo;
diagonal superior direita move para cima e à direita. A nave orienta a proa
automaticamente. A distância do arrasto controla a velocidade, com zona morta
radial e resposta suave. A conversão considera a inclinação e a orientação da
câmera, inclusive o encurtamento visual das diagonais na projeção isométrica.

## Implementação

- Joystick flutuante na área inferior esquerda; origem neutra no primeiro toque.
- Controles limitados à metade inferior em retrato e paisagem, com safe areas.
- Turbo e joystick têm ponteiros independentes; docagem aceita um segundo dedo.
- Captura mantém o arrasto fora da área; cancelamento, perda de captura, blur,
  mudança de visibilidade, resize, abertura de modal e desmontagem limpam o input.
- A física Rapier e o fallback cinemático usam a mesma resposta direcional;
  o teclado mantém seus comandos. Câmera isométrica estável também na corrida
  mobile, para que manter uma direção não gire a câmera indefinidamente.
- FOV em retrato: 42°; afastamento adicional de 12%; adaptação à rotação da tela.
- HUD respeita notch; radar começa recolhido; transmissão e corrida não ocupam
  a zona de arrasto. Vinheta mais leve em touch.
- Ilhas, desafios, configurações e segredos usam bottom sheet/tela cheia no
  mobile. Fechar tem no mínimo 44 × 44 px. Rolagem nativa interna preservada;
  campos usam 16 px para evitar zoom automático ao editar em iOS.
- Primeiro acesso touch começa em `low`, preservando a preferência explícita
  salva. DPR limitado a 1 em low e 1,25 nos demais modos, além do orçamento
  existente de pixels. O redutor automático por FPS continua ativo.

## Validação executada

- `npm run lint`: TypeScript sem erros.
- `npm run build`: produção gerada; permanece o aviso existente sobre o tamanho
  do chunk Rapier, sem erro de build.
- `npm run test:mobile`: 9 testes, incluindo oito direções projetadas pela câmera,
  diagonais, zona morta, resposta contínua, DPR e Rapier real a 30/60/144 FPS.
- `npm run test:performance`: 67 testes de regressão.
- `npm run test:narrative`: 2 testes de regressão.
- Chromium com toque e DPR 3: 360×800, 390×844, 430×932 e 844×390; desktop
  1440×900. 128 verificações passaram com a cena real habilitada: gestos com
  dois dedos, captura fora da área, cancelamentos, ciclo de vida, quatro modais,
  rolagem por swipe, ausência de overflow horizontal e PT/EN dos controles.
- Cena completa: deslocamento físico confirmado para baixo e diagonal superior
  direita, preset inicial low e limite de DPR efetivo no canvas. Sem erros JS.

Os testes de navegador usam emulação no computador. FPS sustentado, temperatura,
notch físico e comportamento do Safari devem ser aferidos em aparelhos reais;
estes testes não demonstram 60 FPS ou consumo térmico em um smartphone.

## Reproduzir o teste de navegador

Inicie `npm run dev` na porta 3000. Com Playwright disponível:

```powershell
# Omitir estas duas variáveis se Playwright/Chromium estiverem instalados localmente.
$env:PLAYWRIGHT_MODULES_DIR = 'caminho/para/diretorio/com/node_modules'
$env:CHROMIUM_PATH = 'caminho/para/chrome.exe'
$env:MOBILE_TEST_SCENE = '1'
npm run test:mobile:browser
```

Os testes isolados ficam em `/tests/mobile/pt/`; não entram no build de produção.
As capturas da execução vão para `.tmp-mobile-artifacts/` (ignorado pelo Git).

## Capturas revisadas

- [Cena completa em 390 px](issue-31/game-390.png)
- [Configurações em 360 px](issue-31/settings-360.png)
- [Ilha em paisagem](issue-31/island-landscape.png)
- [Controles em paisagem](issue-31/controls-landscape.png)

As alterações locais preexistentes da narrativa e do lançamento de foguete foram
preservadas na integração desta versão.
