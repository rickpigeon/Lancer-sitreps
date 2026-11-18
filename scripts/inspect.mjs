/**
 * Terrain inspector: while the tool is on, a small card follows the mouse with the hex under it
 * (elevation, ground, object, cover, zone) and the Lancer rule that applies.
 */
import { MODULE_ID } from "./constants.mjs";
import { getMap, sceneGeometry } from "./scene-builder.mjs";
import { BIOMES } from "./data/biomes.mjs";
import { describeCell } from "./data/terrain.mjs";
import { cellOf } from "./generator.mjs";
import { esc } from "./briefing.mjs";
import { inShapes, zoneShapes } from "./zones.mjs";

let active = false;
let card = null;
let cache = null;
let last = -2;

function onMove(ev) {
  if ( !active || !canvas?.ready || ev.target !== canvas.app?.view ) {
    if ( card && ev.target !== canvas?.app?.view ) card.hidden = true;
    return;
  }
  const scene = canvas.scene;
  if ( !cache || cache.scene !== scene.id ) {
    const map = getMap(scene);
    cache = map ? { scene: scene.id, map, geo: sceneGeometry(scene, map) } : { scene: scene.id, map: null };
  }
  if ( !cache.map ) return;
  const p = canvas.canvasCoordinatesFromClient?.({ x: ev.clientX, y: ev.clientY }) ?? canvas.mousePosition;
  const k = cache.geo.cellAt(p.x, p.y);
  card ??= Object.assign(document.createElement("div"), { className: "lsr-inspect" });
  if ( !card.isConnected ) document.body.appendChild(card);
  card.style.left = `${ev.clientX + 18}px`;
  card.style.top = `${ev.clientY + 14}px`;
  if ( k < 0 ) {
    card.hidden = true;
    last = -1;
    return;
  }
  card.hidden = false;
  if ( k === last ) return;
  last = k;
  const biome = BIOMES[cache.map.biome];
  const lines = describeCell(cellOf(cache.map, k), biome);
  const c = cache.geo.centers[k];
  const shapes = zoneShapes(scene);
  const zones = cache.map.zones.filter(z => inShapes(shapes.get(z.id), c.x, c.y) && (game.user.isGM || !z.hidden));
  card.innerHTML = `${zones.length ? `<div class="lsr-inspect-zones">${zones.map(z => `<span style="background:${esc(z.color)}">${esc(z.label)}</span>`).join("")}</div>` : ""}
    ${lines.map(l => `<div><b>${esc(l.label)}:</b> ${esc(l.value)}${l.rule ? `<small>${esc(l.rule)}</small>` : ""}</div>`).join("")}`;
}

export function setInspect(on) {
  active = !!on;
  last = -2;
  cache = null;
  if ( !active && card ) card.hidden = true;
}

export function isInspecting() {
  return active;
}

export function initInspect() {
  document.addEventListener("pointermove", onMove, { passive: true });
  Hooks.on("canvasReady", () => {
    cache = null;
  });
  Hooks.on("updateScene", (scene, changed) => {
    if ( foundry.utils.hasProperty(changed, `flags.${MODULE_ID}`) ) cache = null;
  });
}
