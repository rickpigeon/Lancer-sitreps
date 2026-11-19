/**
 * Lancer Sitreps — entry point (Foundry VTT v13).
 * Hex map + sitrep generator for LANCER (core book pp. 267-279), zone drawings the GM can adjust,
 * a sitrep panel with scoring, Retrograde-style minis and terrain elevation for tokens.
 */
import { MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { watchUncaught, guard } from "./errors.mjs";
import { GeneratorApp } from "./generator-app.mjs";
import { EditorApp } from "./editor-app.mjs";
import { PanelApp, onCombatRound } from "./panel-app.mjs";
import { MiniApp, onMoveToken, onRenderTokenHUD } from "./minis.mjs";
import { initInspect, isInspecting, setInspect } from "./inspect.mjs";
import { generateMap } from "./generator.mjs";
import { createSitrepScene, getMap, repaintScene } from "./scene-builder.mjs";
import { applyFx, stopFx } from "./effects.mjs";
import { refreshHud, renderHud } from "./initiative-hud.mjs";
import { closeSitrepScene, onPreUpdateScene } from "./closing.mjs";

Hooks.once("init", () => {
  const S = (key, data) => game.settings.register(MODULE_ID, key, data);
  S("gridSize", {
    name: "Tamanho do hexágono (px)", hint: "Pixels por espaço nas cenas novas (50–200). Mapas grandes encolhem sozinhos para a imagem não passar de 8192 px.",
    scope: "world", config: true, type: Number, default: 100, range: { min: 50, max: 200, step: 10 }
  });
  S("numbers", {
    name: "Elevação escrita nos hexágonos", hint: "Pinta o número da elevação no canto de cada hexágono do fundo (vale para as próximas cenas ou ao repintar).",
    scope: "world", config: true, type: Boolean, default: true
  });
  S("briefing", {
    name: "Criar diário de briefing", hint: "Ao criar a cena, cria um diário com o diorama, as regras do sitrep, o mundo e a legenda do terreno, visível aos jogadores.",
    scope: "world", config: true, type: Boolean, default: true
  });
  S("autoScore", {
    name: "Fechar rodadas automaticamente", hint: "Quando o rastreador de combate da cena passa de rodada, o mestre ativo pontua a rodada que terminou e anuncia no chat.",
    scope: "world", config: true, type: Boolean, default: true
  });
  S("autoElevation", {
    name: "Elevação dos tokens = altura do terreno", hint: "Depois de mover, o token assume a altura do hexágono (a maior, se ocupar vários). No HUD do token dá para marcar \"voando\".",
    scope: "world", config: true, type: Boolean, default: true
  });
  S("autoPanel", {
    name: "Abrir o painel do sitrep", hint: "Abre o painel ao entrar numa cena de sitrep.",
    scope: "client", config: true, type: Boolean, default: true
  });
  S("effects", {
    name: "Efeitos de ambiente na tela", hint: "Mostra neve, tempestades, poeira, calor, radiação etc. conforme o ambiente da cena de sitrep (o mestre escolhe no painel).",
    scope: "client", config: true, type: Boolean, default: true, onChange: () => applyFx()
  });
  S("initiativeHud", {
    name: "HUD de iniciativa no topo", hint: "Barra de ativações do combate (sincronizada com o sistema Lancer) no topo da tela.",
    scope: "client", config: true, type: String, default: "sitrep",
    choices: { sitrep: "Só em cenas de sitrep", always: "Em qualquer cena com combate", never: "Nunca" },
    onChange: () => renderHud()
  });
  S("lastOptions", { scope: "world", config: false, type: Object, default: {} });
  watchUncaught();
});

Hooks.once("ready", () => {
  initInspect();
  Hooks.on("canvasTearDown", () => stopFx());
  const mod = game.modules.get(MODULE_ID);
  if ( mod ) {
    mod.api = {
      gerador: () => GeneratorApp.open(),
      editor: scene => EditorApp.open(scene),
      painel: scene => PanelApp.open(scene),
      mini: () => MiniApp.open(),
      encerrar: scene => closeSitrepScene(scene ?? canvas.scene),
      efeitos: applyFx, hud: renderHud,
      generateMap, createSitrepScene, repaintScene, getMap
    };
  }
});

Hooks.on("getSceneControlButtons", controls => {
  const tokens = controls?.tokens;
  if ( !tokens?.tools ) return;
  let order = Object.keys(tokens.tools).length;
  const isSitrep = !!getMap(canvas?.scene);
  const add = tool => {
    tokens.tools[tool.name] = { order: order++, ...tool };
  };
  add({ name: "lsrGenerator", title: `${MODULE_TITLE}: gerar sitrep e mapa`, icon: "fa-solid fa-satellite-dish", button: true, visible: game.user.isGM, onChange: guard(() => GeneratorApp.open(), "gerador") });
  add({ name: "lsrEditor", title: `${MODULE_TITLE}: zonas e terreno`, icon: "fa-solid fa-draw-polygon", button: true, visible: game.user.isGM && isSitrep, onChange: guard(() => EditorApp.open(), "editor") });
  add({ name: "lsrPanel", title: `${MODULE_TITLE}: painel do sitrep`, icon: "fa-solid fa-flag", button: true, visible: isSitrep, onChange: guard(() => PanelApp.open(), "painel") });
  add({ name: "lsrInspect", title: `${MODULE_TITLE}: inspecionar terreno`, icon: "fa-solid fa-magnifying-glass-location", toggle: true, active: isInspecting(), visible: isSitrep, onChange: (event, active) => setInspect(active) });
  add({ name: "lsrMini", title: `${MODULE_TITLE}: mini do mech (Retrograde)`, icon: "fa-solid fa-robot", button: true, visible: true, onChange: guard(() => MiniApp.open(), "mini") });
});

Hooks.on("moveToken", guard(onMoveToken, "elevação"));
Hooks.on("renderTokenHUD", guard(onRenderTokenHUD, "HUD"));
Hooks.on("updateCombat", guard(onCombatRound, "rodada"));

/* keep the panel live */
const refresh = foundry.utils.debounce(() => PanelApp.refresh(), 150);
for ( const hook of ["createToken", "updateToken", "deleteToken", "createDrawing", "updateDrawing", "deleteDrawing", "updateCombat", "updateCombatant", "deleteCombat", "updateJournalEntry", "updateActor"] ) {
  Hooks.on(hook, () => refresh());
}
Hooks.on("updateScene", (scene, changed) => {
  if ( foundry.utils.hasProperty(changed, `flags.${MODULE_ID}`) ) refresh();
  if ( scene.id === canvas?.scene?.id && foundry.utils.hasProperty(changed, `flags.${MODULE_ID}.fx`) ) applyFx(scene);
});
Hooks.on("preUpdateScene", guard(onPreUpdateScene, "cena anterior"));

/* initiative HUD in sync with the combat (Lancer activations) */
for ( const hook of ["createCombat", "updateCombat", "deleteCombat", "combatStart", "combatRound", "combatTurn", "createCombatant", "updateCombatant", "deleteCombatant", "updateToken"] ) {
  Hooks.on(hook, () => refreshHud());
}

Hooks.on("canvasReady", guard(cv => {
  const isSitrep = !!getMap(cv.scene);
  ui.controls?.render?.();
  if ( isSitrep && game.settings.get(MODULE_ID, "autoPanel") ) PanelApp.open(cv.scene);
  applyFx(cv.scene);
  renderHud();
  if ( !isSitrep ) {
    setInspect(false);
    foundry.applications.instances.get(`${MODULE_ID}-panel`)?.close();
  }
}, "cena"));
