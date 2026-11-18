/**
 * The running sitrep: who stands in which zone, round scores and victory checks
 * (Control, Gauntlet, Holdout, Recon scoring; Escort/Extraction objective tracking).
 */
import { FLAG_STATE, MODULE_ID } from "./constants.mjs";
import { SITREPS } from "./data/sitreps.mjs";
import { inShapes, zoneShapes } from "./zones.mjs";

export function newState(map) {
  return {
    v: 1, sitrep: map.sitrep, round: 0, scores: { pc: map.sitrep === "holdout" ? 4 : 0, enemy: 0 },
    history: [], iz: [], objective: { size: 1, hp: 10, max: 10, extracted: false, destroyed: false },
    checked: [], finished: null
  };
}

export function getState(scene) {
  const s = scene?.getFlag(MODULE_ID, FLAG_STATE);
  return s ? foundry.utils.deepClone(s) : null;
}

export async function saveState(scene, state) {
  /* arrays are always replaced whole; every key of the state is always present */
  await scene.update({ [`flags.${MODULE_ID}.${FLAG_STATE}`]: state });
}

/* ------------------------------------------------------------------ */
/* Sides and weights                                                  */
/* ------------------------------------------------------------------ */

const DISP = () => CONST.TOKEN_DISPOSITIONS;

export function sideOf(token) {
  const d = token.disposition;
  if ( d === DISP().FRIENDLY ) return "pc";
  if ( d === DISP().HOSTILE || d === DISP().SECRET ) return "enemy";
  return null;
}

function isDefeated(token) {
  const actor = token.actor;
  const dead = CONFIG.specialStatusEffects?.DEFEATED ?? "dead";
  if ( actor?.statuses?.has?.(dead) ) return true;
  if ( token.combatant?.defeated ) return true;
  return false;
}

/** Characters that count for zones: visible, not defeated, not deployables. */
export function countingTokens(scene) {
  return scene.tokens.filter(t => !t.hidden && sideOf(t) && !isDefeated(t) && t.actor?.type !== "deployable");
}

/** Gauntlet weights: Ultra 4, Elite 2, Grunt 1/4 (NPC templates of the Lancer system). */
export function npcWeight(token) {
  const manual = Number(token.getFlag?.(MODULE_ID, "weight"));
  if ( manual > 0 ) return manual;
  const items = token.actor?.items ?? [];
  const names = items.filter(i => i.type === "npc_template" || i.type === "template").map(i => i.name.toLowerCase());
  if ( names.some(n => n.includes("ultra")) ) return 4;
  if ( names.some(n => n.includes("elite")) ) return 2;
  if ( names.some(n => n.includes("grunt")) ) return 0.25;
  return 1;
}

/** Grid space centres a token occupies. */
function occupiedCenters(scene, token) {
  try {
    const offs = token.getOccupiedGridSpaceOffsets?.();
    if ( offs?.length ) return offs.map(o => scene.grid.getCenterPoint(o));
  } catch {
    /* fall back to the centre */
  }
  const w = token.width * scene.grid.sizeX;
  const h = token.height * scene.grid.sizeY;
  return [{ x: token.x + (w / 2), y: token.y + (h / 2) }];
}

/**
 * Presence in every zone: Map zoneId → { pc: [tokens], enemy: [tokens], control: "pc"|"enemy"|"contested"|null }
 */
export function presence(scene, map) {
  const shapes = zoneShapes(scene);
  const out = new Map();
  for ( const z of map.zones ) out.set(z.id, { pc: [], enemy: [], control: null });
  for ( const token of countingTokens(scene) ) {
    const pts = occupiedCenters(scene, token);
    const side = sideOf(token);
    for ( const z of map.zones ) {
      if ( pts.some(p => inShapes(shapes.get(z.id), p.x, p.y)) ) out.get(z.id)[side].push(token);
    }
  }
  for ( const v of out.values() ) {
    v.control = v.pc.length && v.enemy.length ? "contested" : v.pc.length ? "pc" : v.enemy.length ? "enemy" : null;
  }
  return out;
}

const czZones = map => map.zones.filter(z => z.kinds.includes("CZ") || z.cz);

/**
 * Live reading of the sitrep (no writes): what would be scored now and who leads.
 */
export function evaluate(scene, map, state, secrets = {}) {
  const sitrep = SITREPS[map.sitrep];
  const pres = presence(scene, map);
  const res = { mode: sitrep.scoringMode, lines: [], round: { pc: 0, enemy: 0 }, presence: pres };
  switch ( sitrep.scoringMode ) {
    case "control": {
      const cz = czZones(map);
      let pc = 0;
      let enemy = 0;
      for ( const z of cz ) {
        const p = pres.get(z.id);
        if ( p.control === "pc" ) pc++;
        if ( p.control === "enemy" ) enemy++;
        res.lines.push({ zone: z, control: p.control, pc: p.pc.length, enemy: p.enemy.length });
      }
      res.round = { pc: pc + (pc === cz.length && cz.length ? 1 : 0), enemy: enemy + (enemy === cz.length && cz.length ? 1 : 0) };
      res.projected = { pc: state.scores.pc + res.round.pc, enemy: state.scores.enemy + res.round.enemy };
      break;
    }
    case "recon": {
      for ( const z of czZones(map) ) {
        const p = pres.get(z.id);
        res.lines.push({ zone: z, control: p.control, pc: p.pc.length, enemy: p.enemy.length, isTrue: secrets.trueCz === z.id, checked: (state.checked ?? []).includes(z.id) });
      }
      const t = secrets.trueCz ? pres.get(secrets.trueCz) : null;
      res.trueControl = t ? t.control : null;
      res.pcWinning = res.trueControl === "pc";
      break;
    }
    case "holdout": {
      const z = czZones(map)[0];
      const p = z ? pres.get(z.id) : { pc: [], enemy: [] };
      res.lines.push({ zone: z, control: p.control, pc: p.pc.length, enemy: p.enemy.length });
      res.projected = { pc: 4 - p.enemy.length, enemy: 0 };
      res.pcWinning = res.projected.pc >= 1;
      break;
    }
    case "gauntlet": {
      const z = czZones(map)[0];
      const p = z ? pres.get(z.id) : { pc: [], enemy: [] };
      const enemyW = p.enemy.reduce((a, t) => a + npcWeight(t), 0);
      res.lines.push({ zone: z, control: p.control, pc: p.pc.length, enemy: p.enemy.length, enemyW });
      res.pcWinning = p.pc.length > enemyW;
      res.projected = { pc: p.pc.length, enemy: enemyW };
      break;
    }
    case "objective": {
      res.pcWinning = !!state.objective?.extracted;
      for ( const z of map.zones.filter(x => x.kinds.includes("EZ") || x.kinds.includes("OZ")) ) {
        const p = pres.get(z.id);
        res.lines.push({ zone: z, control: p.control, pc: p.pc.length, enemy: p.enemy.length });
      }
      break;
    }
    default: break;
  }
  return res;
}

/**
 * Close a round: add the round's points (Control), log it, and at the last round give the verdict.
 * Returns { state, message } (message = HTML for the chat).
 */
export function closeRound(scene, map, state, roundNumber, secrets = {}) {
  const sitrep = SITREPS[map.sitrep];
  const ev = evaluate(scene, map, state, secrets);
  const s = foundry.utils.deepClone(state);
  const entry = { round: roundNumber };
  const parts = [];
  if ( ev.mode === "control" ) {
    s.scores.pc += ev.round.pc;
    s.scores.enemy += ev.round.enemy;
    entry.pc = ev.round.pc;
    entry.enemy = ev.round.enemy;
    parts.push(ev.lines.map(l => `${l.zone.label}: ${controlLabel(l.control)}`).join(" · "));
    parts.push(`<strong>+${ev.round.pc}</strong> PJs, <strong>+${ev.round.enemy}</strong> inimigos → placar <strong>${s.scores.pc} × ${s.scores.enemy}</strong>`);
  } else if ( ev.mode === "holdout" ) {
    const l = ev.lines[0];
    parts.push(`${l?.enemy ?? 0} inimigo(s) dentro da CZ agora → os PJs ficariam com <strong>${ev.projected.pc}</strong> ponto(s).`);
  } else if ( ev.mode === "gauntlet" ) {
    const l = ev.lines[0];
    parts.push(`Dentro da CZ: <strong>${l?.pc ?? 0}</strong> PJ(s) × <strong>${fmt(l?.enemyW ?? 0)}</strong> inimigo(s) (peso Ultra 4, Elite 2, Grunt ¼).`);
  } else if ( ev.mode === "recon" ) {
    parts.push(`CZ Verdadeira: ${controlLabel(ev.trueControl)}.`);
  } else if ( ev.mode === "objective" ) {
    parts.push(state.objective?.extracted ? "O Objetivo já foi extraído." : state.objective?.destroyed ? "O Objetivo foi destruído." : `Objetivo: ${state.objective?.hp ?? "?"}/${state.objective?.max ?? "?"} PV.`);
  }
  s.history = [...(s.history ?? []).filter(h => h.round !== roundNumber), entry].sort((a, b) => a.round - b.round);
  s.round = roundNumber;
  let verdict = null;
  if ( roundNumber >= sitrep.rounds && !s.finished ) {
    verdict = verdictOf(map, s, ev);
    s.finished = verdict;
  }
  const html = `<div class="lsr-chat"><h3>${sitrep.pt} · fim da rodada ${roundNumber}/${sitrep.rounds}</h3><p>${parts.join("<br>")}</p>${verdict ? `<p class="lsr-verdict lsr-${verdict.side}">${verdict.text}</p>` : ""}</div>`;
  return { state: s, html, verdict };
}

export function verdictOf(map, s, ev) {
  switch ( ev.mode ) {
    case "control":
      if ( s.scores.pc > s.scores.enemy ) return { side: "pc", text: `Vitória dos PJs (${s.scores.pc} × ${s.scores.enemy}).` };
      if ( s.scores.enemy > s.scores.pc ) return { side: "enemy", text: `Vitória inimiga (${s.scores.enemy} × ${s.scores.pc}).` };
      return { side: "draw", text: `Empate (${s.scores.pc} × ${s.scores.enemy}): ninguém vence e os dois lados recuam.` };
    case "holdout":
      return ev.projected.pc >= 1
        ? { side: "pc", text: `Vitória dos PJs: pontuação final ${ev.projected.pc}.` }
        : { side: "enemy", text: `Vitória inimiga: pontuação final ${ev.projected.pc}. PJs ainda em campo são capturados ou massacrados.` };
    case "gauntlet":
      return ev.pcWinning
        ? { side: "pc", text: "Vitória dos PJs: mais PJs que inimigos dentro da CZ." }
        : { side: "enemy", text: "Vitória inimiga: pelo menos tantos inimigos quanto PJs dentro da CZ." };
    case "recon":
      return ev.pcWinning
        ? { side: "pc", text: "Vitória dos PJs: eles controlam a CZ Verdadeira." }
        : { side: "enemy", text: "Vitória inimiga: os PJs não controlam a CZ Verdadeira." };
    case "objective":
      if ( s.objective?.extracted ) return { side: "pc", text: "Vitória dos PJs: o Objetivo foi extraído." };
      if ( s.objective?.destroyed ) return { side: "draw", text: "Sem vencedor: o Objetivo foi destruído." };
      return { side: "enemy", text: "Vitória inimiga: o Objetivo não foi extraído a tempo. PJs ainda em campo são capturados ou massacrados." };
    default:
      return null;
  }
}

export function controlLabel(c) {
  return c === "pc" ? "PJs" : c === "enemy" ? "inimigos" : c === "contested" ? "contestada" : "ninguém";
}

const fmt = n => String(Math.round(n * 100) / 100).replace(".", ",");
export { fmt };
