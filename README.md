# Lancer Sitreps

Módulo para **Foundry VTT v13** feito para o sistema **LANCER**. Ele gera sitreps e mapas hexagonais com altura (relevo em degraus, paredes de penhasco e base de diorama) para batalhas de mechs, e demarca no mapa as zonas do livro básico (pp. 267–273). O mestre pode ajustar essas zonas.

## O que faz

- **Gerador** (só o mestre; botão de antena na barra de tokens):
  - as seis sitreps (Control, Escort, Extraction, Gauntlet, Holdout, Recon), escolhidas ou roladas no 1d6;
  - as tabelas d20 de mundo: tipo de mundo, característica natural, presença humana e ambiente com a regra de combate (pp. 274–279). O mundo rolado sugere o bioma;
  - **25 biomas**: pradaria, floresta, selva, pântano, savana, dunas, cânion, planalto, tundra, geleira, arquipélago, lava, cinzas, ermo irradiado, regolito lunar, mina, pântano tóxico, floresta fúngica, cristal, mares de mercúrio, planos de metal, ruínas, gigante vermelha, metrofaixa urbana, complexo industrial e convés de estação orbital;
  - tamanho, orientação dos hexágonos, altura máxima, relevo, cobertura, líquido, estradas e código do mapa (o mesmo código gera o mesmo mapa);
  - prévia ao vivo, vista de cima ou como **diorama** isométrico.
- **Cena criada**:
  - a grade hex do Foundry, com o fundo pintado em cima dela, hexágono por hexágono;
  - as zonas (ADZ, EDZ, IZ, CZ, EZ, Zona do Objetivo) como **Desenhos** com a etiqueta escura dos diagramas do livro. O mestre pode mover e reformatar esses desenhos;
  - o marcador do Objetivo (Escort/Extraction);
  - um diário de **briefing** para os jogadores, com o diorama, as regras do sitrep, o mundo e a legenda do terreno.
- **Editor de zonas e terreno** (só o mestre):
  - pinta e apaga hexágonos de cada zona, renomeia, troca a cor, esconde dos jogadores e cria ou apaga zonas;
  - sobe e desce o terreno, troca o solo, põe e tira objetos, e depois repinta o fundo;
  - se os desenhos das zonas foram mexidos à mão, o editor relê os hexágonos deles ao abrir.
- **Painel do sitrep** (todos veem; o mestre controla):
  - rodada atual e quem controla cada zona, ao vivo;
  - placar do Control, com fechamento automático quando o combate passa de rodada;
  - contagem do Holdout (4 − inimigos na CZ) e do Gauntlet (Ultra 4, Elite 2, Grunt ¼, lidos dos templates de NPC do sistema Lancer);
  - CZ Verdadeira do Recon, guardada num diário que só o mestre vê, com anúncio no chat da verificação "é ou não é";
  - IZs de reforço, com aviso quando a mesma IZ é repetida em seguida;
  - PV e estado do Objetivo, e o resultado final.
  - Lados: disposição Amistosa = PJs; Hostil ou Secreta = inimigos. Tokens escondidos, derrotados e *deployables* não contam.
- **Inspetor de terreno** (lupa): ao passar o mouse sobre um hexágono, mostra a elevação, o terreno, a cobertura, a obstrução e a regra do livro que se aplica (movimento p. 61, escalar e cair p. 62, cobertura p. 65, ambientes p. 278).
- **Elevação automática**: depois de mover, o token fica na altura do hexágono. O botão "voando" no HUD do token desliga isso só para aquele token.
- **Efeitos de ambiente**: cada um dos 20 ambientes tem um efeito na tela (neve, tempestade elétrica com relâmpagos, tempestade de areia, lava com brasas, radiação, terremoto…), e há mais 4 extras. O mestre liga, troca e regula a intensidade no painel. Cada jogador pode desligar só para si.
- **HUD de iniciativa** no topo: os cards seguem as ativações do sistema Lancer (`activateCombatant` / `deactivateCombatant`), ficam agrupados por lado e destacam quem está agindo. As ativações que restam aparecem como barrinhas.
- **Encerrar cena e voltar**: o botão no painel leva todos de volta para a cena anterior e pode encerrar o combate.
- **Minis estilo Retrograde Minis** (qualquer jogador, para os próprios tokens):
  - o jogador escolhe a imagem com fundo transparente;
  - ajusta a escala e a altura dos pés, e pode espelhar a imagem;
  - aplica no token e, se quiser, no token-protótipo do ator.

## Instalação (manual)

Copie a pasta `lancer-sitreps` (ou o conteúdo do `module.zip`) para `Data/modules/lancer-sitreps` e ative o módulo no mundo.

As imagens geradas ficam em `Data/worlds/<mundo>/lancer-sitreps/`. O mestre precisa de permissão para enviar arquivos. Para enviar a imagem das minis, os jogadores também precisam dessa permissão; sem ela, o mestre envia a imagem e o jogador só escolhe o arquivo.

## Configurações

- tamanho do hexágono em px (padrão 100);
- número da elevação pintado nos hexágonos;
- criar diário de briefing;
- fechar rodadas automaticamente;
- elevação automática dos tokens;
- abrir o painel ao entrar numa cena de sitrep.

## API

`game.modules.get("lancer-sitreps").api` traz: `gerador()`, `editor(scene)`, `painel(scene)`, `mini()`, `generateMap(opts, geo)`, `createSitrepScene(map, opts)`, `repaintScene(scene)` e `getMap(scene)`.

## Créditos

Lancer Sitreps é um módulo de fã, não oficial. LANCER é da Massif Press. As regras aparecem resumidas em português, com a página do livro básico de onde vêm. Os gráficos do mapa são desenhados pelo próprio módulo (canvas) e não usam arte de terceiros.
