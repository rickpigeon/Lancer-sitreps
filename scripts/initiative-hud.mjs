/**
 * Tactical initiative HUD at the top of the screen, in sync with the LANCER system combat
 * (foundryvtt-lancer: activations instead of turns — LancerCombat#activateCombatant /
 * #deactivateCombatant, Combatant system.activations {value, max}, sorted by disposition).
 * Without the Lancer combat class it falls back to Foundry turns.
 */
import { MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { guard } from "./errors.mjs";
import { esc } from "./briefing.mjs";
import { getMap } from "./scene-builder.mjs";
import { SITREPS } from "./data/sitreps.mjs";

let el = null;
let collapsed = false;

const isLancer = combat => typeof combat?.activateCombatant === "function";

function viewedCombat() {
  const scene = canvas?.scene;
  const list = game.combats?.contents ?? [...(game.combats ?? [])];
  return list.find(c => c.active && c.scene?.id === scene?.id) ?? list.find(c => c.scene?.id === scene?.id) ?? (game.combat && !game.combat.scene ? game.combat : null);
}

function wanted() {
  const mode = game.settings.get(MODULE_ID, "initiativeHud");
  if ( mode === "never" ) return false;
  if ( mode === "sitrep" && !getMap(canvas?.scene) ) return false;
  return true;
}

function side(c) {
  const d = typeof c.disposition === "number" ? c.disposition : (c.token?.disposition ?? -2);
  if ( d >= 2 ) return "player";
  if ( d === 1 ) return "ally";
  if ( d === 0 ) return "neutral";
  return "enemy";
}

const SIDE_ORDER = { player: 0, ally: 1, neutral: 2, enemy: 3 };

function cardHTML(combat, c, activeId, lancer) {
  const act = lancer ? (c.system?.activations ?? c.activations ?? {}) : null;
  const max = Math.max(0, Number(act?.max ?? 1));
  const val = Math.max(0, Number(act?.value ?? 0));
  const pips = lancer ? Array.from({ length: max }, (_, i) => `<i class="${i < val ? "on" : ""}"></i>`).join("") : `<b class="lsr-ini">${c.initiative ?? "—"}</b>`;
  const img = c.token?.texture?.src ?? c.img ?? c.actor?.img ?? "icons/svg/mystery-man.svg";
  const cls = [
    "lsr-ihud-card", `lsr-${side(c)}`,
    c.id === activeId ? "active" : "",
    c.isDefeated ? "defeated" : "",
    lancer && !val && c.id !== activeId ? "spent" : "",
    c.hidden ? "hidden-c" : "",
    c.isOwner ? "mine" : ""
  ].join(" ");
  const tip = lancer
    ? (c.id === activeId ? "Em ação. Clique para encerrar a ativação." : val ? `${val}/${max} ativações. Clique para agir.` : "Sem ativações nesta rodada.")
    : `Iniciativa ${c.initiative ?? "—"}`;
  return `<button type="button" class="${cls}" data-cid="${c.id}" data-tooltip="${esc(`${c.name} — ${tip}`)}">
    <span class="lsr-ihud-img"><img src="${esc(img)}" alt=""></span>
    <span class="lsr-ihud-name">${esc(c.name)}</span>
    <span class="lsr-ihud-pips">${pips}</span>
  </button>`;
}

function html() {
  const combat = viewedCombat();
  const gm = game.user.isGM;
  const map = getMap(canvas?.scene);
  const sitrep = map ? SITREPS[map.sitrep] : null;
  const head = `<div class="lsr-ihud-head">
      <span class="lsr-ihud-tag">${sitrep ? `SITREP // ${esc(sitrep.name.toUpperCase())}` : "COMBATE"}</span>
      <span class="lsr-ihud-round">RODADA <b>${combat?.round || "—"}</b>${sitrep ? `<small>/${sitrep.rounds}</small>` : ""}</span>
      <button type="button" class="lsr-ihud-min" data-act="collapse" data-tooltip="${collapsed ? "Mostrar" : "Recolher"}"><i class="fa-solid ${collapsed ? "fa-chevron-down" : "fa-chevron-up"}"></i></button>
    </div>`;
  if ( collapsed ) return head;
  if ( !combat ) {
    return `${head}<div class="lsr-ihud-empty">SEM COMBATE ATIVO ${gm ? `<button type="button" data-act="create"><i class="fa-solid fa-swords"></i> Iniciar com os tokens da cena</button>` : ""}</div>`;
  }
  const lancer = isLancer(combat);
  const activeId = combat.turn !== null && combat.turn !== undefined ? combat.combatant?.id ?? null : null;
  const list = (combat.combatants?.contents ?? [...combat.combatants]).filter(c => gm || !c.hidden)
    .sort((a, b) => (SIDE_ORDER[side(a)] - SIDE_ORDER[side(b)]) || ((b.initiative ?? 0) - (a.initiative ?? 0)) || a.name.localeCompare(b.name));
  const groups = ["player", "ally", "neutral", "enemy"].map(s => list.filter(c => side(c) === s)).filter(g => g.length);
  const cards = groups.map(g => `<div class="lsr-ihud-group">${g.map(c => cardHTML(combat, c, activeId, lancer)).join("")}</div>`).join(`<span class="lsr-ihud-sep"></span>`);
  const pending = lancer ? list.filter(c => !c.isDefeated && (c.system?.activations?.value ?? 0) > 0).length : null;
  const status = !combat.started && !combat.round ? "AGUARDANDO INÍCIO"
    : activeId ? `EM AÇÃO: ${esc(combat.combatant?.name ?? "")}`
      : lancer ? (pending ? `${pending} AINDA PODEM AGIR` : "RODADA ENCERRADA — TODOS AGIRAM") : "";
  const gmBtns = gm ? `<div class="lsr-ihud-ctl">
      ${!combat.round ? `<button type="button" data-act="start"><i class="fa-solid fa-play"></i> Iniciar</button>` : ""}
      ${activeId ? `<button type="button" data-act="endTurn"><i class="fa-solid fa-stop"></i> Fim da ativação</button>` : ""}
      ${combat.round ? `<button type="button" data-act="nextRound"><i class="fa-solid fa-forward-step"></i> Próxima rodada</button>` : ""}
    </div>` : "";
  return `${head}<div class="lsr-ihud-row">${cards}</div><div class="lsr-ihud-foot"><span class="lsr-ihud-status">${status}</span>${gmBtns}</div>`;
}

export function renderHud() {
  if ( !game.ready ) return;
  if ( !wanted() ) {
    if ( el ) el.hidden = true;
    return;
  }
  if ( !el?.isConnected ) {
    el = document.createElement("section");
    el.className = "lsr-ihud";
    el.addEventListener("click", guard(onClick, "iniciativa"));
    el.addEventListener("contextmenu", guard(onContext, "iniciativa"));
    (document.getElementById("interface") ?? document.body).appendChild(el);
  }
  el.hidden = false;
  el.classList.toggle("collapsed", collapsed);
  el.innerHTML = html();
}

async function onClick(ev) {
  const actBtn = ev.target.closest("[data-act]");
  const combat = viewedCombat();
  if ( actBtn ) {
    const act = actBtn.dataset.act;
    if ( act === "collapse" ) {
      collapsed = !collapsed;
      return renderHud();
    }
    if ( act === "create" ) return createCombatFromScene();
    if ( !combat || !game.user.isGM ) return;
    if ( act === "start" ) return combat.startCombat();
    if ( act === "nextRound" ) return combat.nextRound();
    if ( act === "endTurn" ) return combat.nextTurn();
    return;
  }
  const card = ev.target.closest("[data-cid]");
  if ( !card || !combat ) return;
  const id = card.dataset.cid;
  const c = combat.combatants.get(id);
  if ( !c ) return;
  const activeId = combat.turn !== null && combat.turn !== undefined ? combat.combatant?.id : null;
  if ( isLancer(combat) ) {
    if ( id === activeId ) return combat.deactivateCombatant(id);
    if ( !combat.round ) return ui.notifications.warn(`${MODULE_TITLE}: o combate ainda não começou.`);
    if ( activeId && !game.user.isGM ) return ui.notifications.warn(`${MODULE_TITLE}: ${combat.combatant?.name} ainda está agindo.`);
    return combat.activateCombatant(id);
  }
  if ( game.user.isGM ) {
    const turn = combat.turns.findIndex(t => t.id === id);
    if ( turn >= 0 ) return combat.update({ turn });
  }
  return c.token?.object?.control?.({ releaseOthers: true });
}

/** Right click: pan to the token. */
function onContext(ev) {
  const card = ev.target.closest("[data-cid]");
  if ( !card ) return;
  ev.preventDefault();
  const c = viewedCombat()?.combatants.get(card.dataset.cid);
  const t = c?.token?.object;
  if ( t?.center ) canvas.animatePan?.({ x: t.center.x, y: t.center.y, duration: 400 });
}

async function createCombatFromScene() {
  if ( !game.user.isGM ) return;
  const scene = canvas.scene;
  const tokens = scene.tokens.filter(t => t.actor && t.actor.type !== "deployable");
  if ( !tokens.length ) return ui.notifications.warn(`${MODULE_TITLE}: não há tokens com ator nesta cena.`);
  const combat = await CONFIG.Combat.documentClass.create({ scene: scene.id, active: true });
  await combat.createEmbeddedDocuments("Combatant", tokens.map(t => ({ tokenId: t.id, sceneId: scene.id, actorId: t.actorId, hidden: t.hidden })));
}

export const refreshHud = foundry.utils.debounce(() => renderHud(), 60);

export function hideHud() {
  if ( el ) el.hidden = true;
}
