/**
 * Sitrep panel for everybody (players read, GM drives): rules, round, live zone control,
 * score, reinforcement IZs, the Objective and the True CZ of Recon.
 */
import { FLAG_MAP, FLAG_STATE, MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { HtmlApp, opt } from "./html-app.mjs";
import { guardActions } from "./errors.mjs";
import { SITREPS } from "./data/sitreps.mjs";
import { getMap } from "./scene-builder.mjs";
import { closeRound, controlLabel, evaluate, fmt, getState, newState, saveState, verdictOf } from "./scoring.mjs";
import { getSecrets, setSecrets } from "./secrets.mjs";
import { esc, sitrepRulesHTML } from "./briefing.mjs";
import { ENVIRONMENTS } from "./data/worlds.mjs";

const APP_ID = `${MODULE_ID}-panel`;

export function combatRound(scene) {
  const c = game.combats?.find(x => x.active && (x.scene?.id ?? null) === scene.id) ?? game.combats?.find(x => x.active && !x.scene);
  return c?.round ?? null;
}

export async function postChat(html, opts = {}) {
  return CONFIG.ChatMessage.documentClass.create({
    content: html,
    speaker: { alias: MODULE_TITLE },
    whisper: opts.gmOnly ? game.users.filter(u => u.isGM).map(u => u.id) : []
  });
}

export class PanelApp extends HtmlApp {
  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["lancer-sitreps", "lsr-panel"],
    window: { title: "Sitrep", icon: "fa-solid fa-flag", resizable: true },
    position: { width: 440, height: 680, top: 70 },
    actions: guardActions({
      score: PanelApp.#onScore,
      undo: PanelApp.#onUndo,
      reset: PanelApp.#onReset,
      iz: PanelApp.#onIz,
      objHp: PanelApp.#onObjHp,
      objFlag: PanelApp.#onObjFlag,
      trueCz: PanelApp.#onTrueCz,
      checkCz: PanelApp.#onCheckCz,
      verdict: PanelApp.#onVerdict,
      announce: PanelApp.#onAnnounce
    })
  };

  static open(scene = canvas?.scene) {
    if ( !scene?.getFlag(MODULE_ID, FLAG_MAP) ) return ui.notifications.warn(`${MODULE_TITLE}: esta cena não tem sitrep.`);
    const existing = foundry.applications.instances.get(APP_ID);
    if ( existing ) {
      existing.scene = scene;
      existing.render({ force: true });
      return existing;
    }
    const app = new PanelApp();
    app.scene = scene;
    app.render({ force: true });
    return app;
  }

  /** Re-render the open panel (zone control changes as tokens move). */
  static refresh() {
    const app = foundry.applications.instances.get(APP_ID);
    if ( app?.rendered ) app.render();
  }

  get title() {
    const map = getMap(this.scene);
    return map ? `Sitrep: ${SITREPS[map.sitrep]?.pt ?? "?"}` : "Sitrep";
  }

  renderBody() {
    const scene = this.scene;
    const map = getMap(scene);
    if ( !map ) return `<p class="lsr-hint">A cena não tem sitrep.</p>`;
    const state = getState(scene) ?? newState(map);
    const s = SITREPS[map.sitrep];
    const gm = game.user.isGM;
    const secrets = gm ? getSecrets(scene.id) : {};
    const ev = evaluate(scene, map, state, secrets);
    const cRound = combatRound(scene);
    const round = cRound ?? state.round;
    const parts = [];

    parts.push(`<div class="lsr-head"><div class="lsr-round"><span>Rodada</span><b>${round || "—"}</b><small>de ${s.rounds}</small></div>
      <div class="lsr-scoreboard">${this.#scoreboard(map, state, ev)}</div></div>`);
    if ( state.finished ) parts.push(`<p class="lsr-verdict lsr-${state.finished.side}">${esc(state.finished.text)}</p>`);

    /* zones */
    const rows = ev.lines.map(l => {
      if ( !l.zone ) return "";
      const extra = ev.mode === "gauntlet" ? ` · peso inimigo ${fmt(l.enemyW)}` : "";
      const tag = ev.mode === "recon" && gm ? (l.isTrue ? ` <i class="fa-solid fa-star" data-tooltip="CZ Verdadeira (só o mestre vê)"></i>` : "") : "";
      const checked = ev.mode === "recon" && l.checked ? ` <i class="fa-solid fa-magnifying-glass" data-tooltip="Já verificada"></i>` : "";
      const reconBtns = ev.mode === "recon" && gm ? `<button type="button" data-action="trueCz" data-zone="${l.zone.id}" data-tooltip="Marcar como CZ Verdadeira"><i class="fa-regular fa-star"></i></button><button type="button" data-action="checkCz" data-zone="${l.zone.id}" data-tooltip="Um PJ verificou esta CZ (ação completa): anuncia no chat se é a Verdadeira"><i class="fa-solid fa-magnifying-glass"></i></button>` : "";
      return `<li class="lsr-ctl lsr-ctl-${l.control ?? "none"}"><span class="lsr-chip" style="background:${esc(l.zone.color)}"></span><b>${esc(l.zone.label)}</b>${tag}${checked}
        <span class="lsr-grow">${controlLabel(l.control)} <small>(${l.pc} PJ × ${l.enemy} inim.${extra})</small></span>${reconBtns}</li>`;
    }).join("");
    if ( rows ) parts.push(`<h3>Zonas agora</h3><ul class="lsr-ctls">${rows}</ul>`);
    if ( ev.mode === "recon" && gm && !secrets.trueCz ) parts.push(`<p class="lsr-warn">Marque a CZ Verdadeira (estrela). Só o mestre vê.</p>`);

    /* objective */
    if ( ev.mode === "objective" ) {
      const o = state.objective;
      parts.push(`<h3>Objetivo</h3><div class="lsr-objective">
        <label>Tamanho ${gm ? `<select data-obj="size">${[0.5, 1, 2].map(v => opt(v, v === 0.5 ? "½" : String(v), Number(o.size) === v)).join("")}</select>` : `<b>${o.size === 0.5 ? "½" : o.size}</b>`}</label>
        <span>PV <b>${o.hp}</b>/${o.max}</span>
        ${gm ? `<button type="button" data-action="objHp" data-delta="-5">−5</button><button type="button" data-action="objHp" data-delta="-1">−1</button><button type="button" data-action="objHp" data-delta="1">+1</button>` : ""}
        <span>Evasão 10 · Def-E 10 · Blindagem 0</span>
        ${gm ? `<button type="button" data-action="objFlag" data-flag="extracted" class="${o.extracted ? "active" : ""}"><i class="fa-solid fa-helicopter"></i> Extraído</button>
        <button type="button" data-action="objFlag" data-flag="destroyed" class="${o.destroyed ? "active" : ""}"><i class="fa-solid fa-burst"></i> Destruído</button>` : `${o.extracted ? "<b>Extraído!</b>" : ""}${o.destroyed ? "<b>Destruído</b>" : ""}`}
      </div>`);
    }

    /* reinforcements */
    const izs = map.zones.filter(z => z.kinds.includes("IZ"));
    if ( izs.length && s.reinforcements ) {
      const last = state.iz?.[state.iz.length - 1];
      const prev = state.iz?.filter(e => e.round < (round || 0)).slice(-1)[0];
      const izBtns = izs.map(z => {
        const usedNow = last && last.round === round && last.zones.includes(z.id);
        const blocked = s.izRule?.distinct && prev && prev.zones.includes(z.id);
        return `<button type="button" ${gm ? `data-action="iz" data-zone="${z.id}"` : "disabled"} class="${usedNow ? "active" : ""} ${blocked ? "lsr-blocked" : ""}" data-tooltip="${blocked ? "Usada na rodada anterior: não pode repetir" : "Reforços chegaram aqui nesta rodada"}">${esc(z.label)}</button>`;
      }).join("");
      parts.push(`<h3>Reforços</h3><p class="lsr-hint">${esc(s.reinforcements)}</p><div class="lsr-row lsr-iz">${izBtns}</div>`);
    }

    /* GM controls */
    if ( gm ) {
      parts.push(`<div class="lsr-row lsr-foot">
        <button type="button" data-action="score" data-tooltip="Fecha a rodada ${round || state.round + 1}: pontua e anuncia no chat"><i class="fa-solid fa-flag-checkered"></i> Fechar rodada</button>
        <button type="button" data-action="undo" data-tooltip="Desfaz o último fechamento"><i class="fa-solid fa-rotate-left"></i></button>
        <button type="button" data-action="verdict" data-tooltip="Anuncia o resultado agora"><i class="fa-solid fa-trophy"></i></button>
        <button type="button" data-action="announce" data-tooltip="Mostra as regras do sitrep no chat"><i class="fa-solid fa-bullhorn"></i></button>
        <button type="button" data-action="reset" data-tooltip="Zera placar e rodadas"><i class="fa-solid fa-trash-can-arrow-up"></i></button>
      </div>
      <p class="lsr-hint">${game.settings.get(MODULE_ID, "autoScore") ? "Com combate ativo nesta cena, a rodada fecha sozinha quando o rastreador passa para a seguinte." : "Fechamento automático desligado nas configurações."} Lados: disposição Amistosa = PJs; Hostil/Secreta = inimigos; tokens escondidos, derrotados e deployables não contam.</p>`);
    }

    const env = map.world?.env ? ENVIRONMENTS[map.world.env - 1] : null;
    if ( env ) parts.push(`<details><summary>Ambiente: ${esc(env.name)}</summary><p>${esc(env.rule)}</p></details>`);
    parts.push(`<details ${round ? "" : "open"}><summary>Regras — ${esc(s.pt)} (${esc(s.name)})</summary>${sitrepRulesHTML(map.sitrep)}</details>`);
    return `<div class="lsr-panel-body" data-keep-scroll>${parts.join("")}</div>`;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector("[data-obj=size]")?.addEventListener("change", ev => {
      const size = Number(ev.target.value) || 1;
      this.#mutate(state => {
        const o = state.objective;
        o.size = size;
        o.max = Math.max(1, Math.round(10 * size));
        o.hp = Math.min(o.hp, o.max) || o.max;
        return state;
      });
    });
  }

  #scoreboard(map, state, ev) {
    switch ( ev.mode ) {
      case "control":
        return `<div><span>PJs</span><b>${state.scores.pc}</b><small>+${ev.round.pc} agora</small></div><div><span>Inimigos</span><b>${state.scores.enemy}</b><small>+${ev.round.enemy} agora</small></div>`;
      case "holdout":
        return `<div><span>Pontos dos PJs</span><b>${ev.projected.pc}</b><small>4 − inimigos na CZ</small></div>`;
      case "gauntlet":
        return `<div><span>PJs na CZ</span><b>${ev.projected.pc}</b></div><div><span>Inimigos (peso)</span><b>${fmt(ev.projected.enemy)}</b></div>`;
      case "recon":
        return game.user.isGM ? `<div><span>CZ Verdadeira</span><b>${controlLabel(ev.trueControl)}</b></div>` : `<div><span>CZ Verdadeira</span><b>?</b></div>`;
      case "objective": {
        const o = state.objective;
        return `<div><span>Objetivo</span><b>${o.extracted ? "Extraído" : o.destroyed ? "Destruído" : `${o.hp}/${o.max}`}</b></div>`;
      }
      default: return "";
    }
  }

  async #mutate(fn) {
    const map = getMap(this.scene);
    const state = getState(this.scene) ?? newState(map);
    const out = await fn(state, map);
    await saveState(this.scene, out ?? state);
  }

  static async #onScore() {
    const map = getMap(this.scene);
    const state = getState(this.scene) ?? newState(map);
    const round = combatRound(this.scene) ?? (state.round + 1);
    const r = closeRound(this.scene, map, state, round, getSecrets(this.scene.id));
    await saveState(this.scene, r.state);
    await postChat(r.html);
  }

  static async #onUndo() {
    await this.#mutate(state => {
      const last = state.history?.pop();
      if ( !last ) return state;
      state.scores.pc -= last.pc ?? 0;
      state.scores.enemy -= last.enemy ?? 0;
      state.round = Math.max(0, (last.round ?? 1) - 1);
      state.finished = null;
      return state;
    });
  }

  static async #onReset() {
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Zerar sitrep" }, content: "<p>Zerar placar, rodadas, reforços e objetivo?</p>", rejectClose: false });
    if ( ok ) await saveState(this.scene, newState(getMap(this.scene)));
  }

  static async #onIz(event, target) {
    const id = target.dataset.zone;
    const map = getMap(this.scene);
    const s = SITREPS[map.sitrep];
    await this.#mutate(state => {
      const round = combatRound(this.scene) ?? (state.round + 1);
      state.iz ??= [];
      let entry = state.iz.find(e => e.round === round);
      if ( !entry ) {
        entry = { round, zones: [] };
        state.iz.push(entry);
      }
      if ( entry.zones.includes(id) ) entry.zones = entry.zones.filter(z => z !== id);
      else {
        const prev = state.iz.filter(e => e.round < round).slice(-1)[0];
        if ( s.izRule?.distinct && prev?.zones.includes(id) ) ui.notifications.warn(`${MODULE_TITLE}: essa IZ foi usada na rodada anterior; a regra do sitrep não permite repetir.`);
        entry.zones.push(id);
        if ( s.izRule?.perRound && entry.zones.length > s.izRule.perRound ) ui.notifications.warn(`${MODULE_TITLE}: o sitrep permite reforços em ${s.izRule.perRound} IZ por rodada.`);
      }
      state.iz.sort((a, b) => a.round - b.round);
      return state;
    });
  }

  static async #onObjHp(event, target) {
    await this.#mutate(state => {
      const o = state.objective;
      o.hp = Math.max(0, Math.min(o.max, o.hp + Number(target.dataset.delta)));
      if ( o.hp === 0 ) o.destroyed = true;
      return state;
    });
  }

  static async #onObjFlag(event, target) {
    const flag = target.dataset.flag;
    await this.#mutate(async state => {
      state.objective[flag] = !state.objective[flag];
      if ( state.objective[flag] ) await postChat(`<div class="lsr-chat"><h3>Objetivo ${flag === "extracted" ? "extraído em segurança!" : "destruído."}</h3></div>`);
      return state;
    });
  }

  static async #onTrueCz(event, target) {
    await setSecrets(this.scene.id, { ...getSecrets(this.scene.id), trueCz: target.dataset.zone });
    this.render();
  }

  static async #onCheckCz(event, target) {
    const id = target.dataset.zone;
    const map = getMap(this.scene);
    const z = map.zones.find(x => x.id === id);
    const secrets = getSecrets(this.scene.id);
    if ( !secrets.trueCz ) return ui.notifications.warn(`${MODULE_TITLE}: marque antes qual é a CZ Verdadeira.`);
    await this.#mutate(state => {
      state.checked = [...new Set([...(state.checked ?? []), id])];
      return state;
    });
    const yes = secrets.trueCz === id;
    await postChat(`<div class="lsr-chat"><h3>Verificação: ${esc(z.label)}</h3><p>${yes ? "<b>É a CZ Verdadeira.</b>" : "Não é a CZ Verdadeira."}</p></div>`);
  }

  static async #onVerdict() {
    const map = getMap(this.scene);
    const state = getState(this.scene) ?? newState(map);
    const ev = evaluate(this.scene, map, state, getSecrets(this.scene.id));
    const v = verdictOf(map, state, ev);
    if ( v ) await postChat(`<div class="lsr-chat"><h3>${esc(SITREPS[map.sitrep].pt)}: resultado</h3><p class="lsr-verdict lsr-${v.side}">${esc(v.text)}</p></div>`);
  }

  static async #onAnnounce() {
    const map = getMap(this.scene);
    await postChat(`<div class="lsr-chat"><h3>Sitrep: ${esc(SITREPS[map.sitrep].pt)}</h3>${sitrepRulesHTML(map.sitrep)}</div>`);
  }
}

/** Close the round automatically when the combat tracker advances (active GM only). */
export async function onCombatRound(combat, changed) {
  if ( !game.users.activeGM?.isSelf || !("round" in changed) ) return;
  if ( !game.settings.get(MODULE_ID, "autoScore") ) return;
  const scene = combat.scene ?? game.scenes.viewed;
  const map = getMap(scene);
  if ( !map ) return;
  const ended = (changed.round ?? 0) - 1;
  const state = getState(scene) ?? newState(map);
  if ( ended < 1 || state.history?.some(h => h.round === ended) ) return;
  const r = closeRound(scene, map, state, ended, getSecrets(scene.id));
  await saveState(scene, r.state);
  await postChat(r.html);
}

export { FLAG_STATE };
