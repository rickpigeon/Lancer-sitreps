/**
 * Retrograde-style minis: players (or the GM) turn a transparent sprite into a token that stands
 * on its hex (fit, scale, foot anchor, mirror), and tokens take the terrain height as elevation.
 */
import { MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { HtmlApp } from "./html-app.mjs";
import { guardActions } from "./errors.mjs";
import { esc } from "./briefing.mjs";
import { getMap, sceneGeometry } from "./scene-builder.mjs";

const APP_ID = `${MODULE_ID}-minis`;

function ownedSelected() {
  return (canvas?.tokens?.controlled ?? []).map(t => t.document).filter(d => d.isOwner);
}

export class MiniApp extends HtmlApp {
  constructor(options = {}) {
    super(options);
    const first = ownedSelected()[0];
    const tex = first?.texture ?? {};
    this.cfg = {
      src: first?.getFlag(MODULE_ID, "mini")?.src ?? tex.src ?? "",
      scale: first?.getFlag(MODULE_ID, "mini")?.scale ?? 1.45,
      anchorY: first?.getFlag(MODULE_ID, "mini")?.anchorY ?? 0.66,
      mirror: (tex.scaleX ?? 1) < 0,
      prototype: true
    };
  }

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["lancer-sitreps", "lsr-minis"],
    window: { title: "Mini do mech (estilo Retrograde)", icon: "fa-solid fa-robot", resizable: true },
    position: { width: 520, height: "auto" },
    actions: guardActions({ browse: MiniApp.#onBrowse, apply: MiniApp.#onApply, reset: MiniApp.#onReset })
  };

  static open() {
    if ( !ownedSelected().length ) return ui.notifications.warn(`${MODULE_TITLE}: selecione no mapa o token do seu mech primeiro.`);
    foundry.applications.instances.get(APP_ID)?.close();
    const app = new MiniApp();
    app.render({ force: true });
    return app;
  }

  renderBody() {
    const c = this.cfg;
    const tokens = ownedSelected();
    return `<div class="lsr-minis-body">
      <p class="lsr-hint">Tokens: <b>${tokens.map(t => esc(t.name)).join(", ") || "nenhum"}</b>. Use um PNG/WebP com fundo transparente (como os sprites da Retrograde Minis). O token fica do tamanho do mech no Lancer; a imagem pode passar da borda do hexágono para o mech "ficar de pé".</p>
      <div class="lsr-mini-grid">
        <div class="lsr-mini-preview" style="--anchor:${c.anchorY};--scale:${c.scale};--flip:${c.mirror ? -1 : 1}">
          <div class="lsr-mini-hex"></div>
          ${c.src ? `<img src="${esc(c.src)}" alt="">` : `<span>sem imagem</span>`}
        </div>
        <div class="lsr-mini-form">
          <label>Imagem<div class="lsr-row"><input type="text" name="src" value="${esc(c.src)}"><button type="button" data-action="browse"><i class="fa-solid fa-folder-open"></i></button></div></label>
          <label>Escala da imagem <output>${c.scale.toFixed(2)}</output><input type="range" name="scale" min="0.6" max="3" step="0.05" value="${c.scale}"></label>
          <label>Altura dos pés <output>${c.anchorY.toFixed(2)}</output><input type="range" name="anchorY" min="0.4" max="0.95" step="0.01" value="${c.anchorY}"></label>
          <label class="lsr-check"><input type="checkbox" name="mirror" ${c.mirror ? "checked" : ""}> Espelhar (virar para o outro lado)</label>
          <label class="lsr-check"><input type="checkbox" name="prototype" ${c.prototype ? "checked" : ""}> Guardar também no token-protótipo do ator</label>
        </div>
      </div>
      <div class="lsr-row lsr-foot">
        <button type="button" data-action="reset"><i class="fa-solid fa-rotate-left"></i> Token normal</button>
        <span class="lsr-grow"></span>
        <button type="button" class="lsr-primary" data-action="apply"><i class="fa-solid fa-check"></i> Aplicar</button>
      </div>
    </div>`;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    root.querySelectorAll("[name]").forEach(el => el.addEventListener(el.type === "range" ? "input" : "change", () => {
      const n = el.name;
      this.cfg[n] = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
      const out = el.closest("label")?.querySelector("output");
      if ( out ) out.textContent = Number(el.value).toFixed(2);
      const pv = root.querySelector(".lsr-mini-preview");
      pv?.style.setProperty("--anchor", this.cfg.anchorY);
      pv?.style.setProperty("--scale", this.cfg.scale);
      pv?.style.setProperty("--flip", this.cfg.mirror ? -1 : 1);
      if ( n === "src" ) this.render();
    }));
  }

  static #onBrowse() {
    const FP = foundry.applications.apps.FilePicker.implementation;
    new FP({ type: "image", current: this.cfg.src, callback: path => {
      this.cfg.src = path;
      this.render();
    } }).render({ force: true });
  }

  static async #onApply() {
    const c = this.cfg;
    if ( !c.src ) return ui.notifications.warn(`${MODULE_TITLE}: escolha a imagem da mini.`);
    const sx = c.scale * (c.mirror ? -1 : 1);
    const patch = {
      "texture.src": c.src, "texture.fit": "contain", "texture.scaleX": sx, "texture.scaleY": c.scale,
      "texture.anchorX": 0.5, "texture.anchorY": c.anchorY, lockRotation: true, "ring.enabled": false,
      [`flags.${MODULE_ID}.mini`]: { src: c.src, scale: c.scale, anchorY: c.anchorY }
    };
    for ( const t of ownedSelected() ) {
      await t.update(patch);
      if ( c.prototype && t.actor?.isOwner ) {
        const proto = Object.fromEntries(Object.entries(patch).map(([k, v]) => [`prototypeToken.${k}`, v]));
        await t.actor.update(proto);
      }
    }
    ui.notifications.info(`${MODULE_TITLE}: mini aplicada.`);
  }

  static async #onReset() {
    for ( const t of ownedSelected() ) {
      await t.update({ "texture.scaleX": 1, "texture.scaleY": 1, "texture.anchorX": 0.5, "texture.anchorY": 0.5, "texture.fit": "contain" });
      await t.unsetFlag(MODULE_ID, "mini");
    }
    this.close();
  }
}

/* ------------------------------------------------------------------ */
/* Terrain elevation                                                  */
/* ------------------------------------------------------------------ */

/** Highest terrain level under a token (0 if outside the map). */
export function terrainHeight(token) {
  const scene = token.parent;
  const map = getMap(scene);
  if ( !map ) return null;
  const geo = sceneGeometry(scene, map);
  let pts;
  try {
    pts = token.getOccupiedGridSpaceOffsets?.().map(o => scene.grid.getCenterPoint(o));
  } catch {
    pts = null;
  }
  if ( !pts?.length ) pts = [{ x: token.x + ((token.width * scene.grid.sizeX) / 2), y: token.y + ((token.height * scene.grid.sizeY) / 2) }];
  let h = null;
  for ( const p of pts ) {
    const k = geo.cellAt(p.x, p.y);
    if ( k < 0 ) continue;
    const lv = "wWli".includes(map.t[k]) ? 0 : map.h[k];
    h = Math.max(h ?? 0, lv);
  }
  return h;
}

/** moveToken hook: the client that moved the token sets its elevation to the ground after the animation. */
export async function onMoveToken(token, movement, operation, user) {
  if ( user?.id !== game.user.id || !game.settings.get(MODULE_ID, "autoElevation") ) return;
  if ( token.getFlag(MODULE_ID, "flying") ) return;
  const h = terrainHeight(token);
  if ( h === null || h === token.elevation ) return;
  try {
    await token.object?.movementAnimationPromise;
  } catch {
    /* animation interrupted */
  }
  if ( token.elevation !== h ) await token.update({ elevation: h });
}

/** Token HUD button: "voando" keeps the elevation the player typed. */
export function onRenderTokenHUD(hud, html) {
  const token = hud.document ?? hud.object?.document;
  if ( !token || !getMap(token.parent) || !game.settings.get(MODULE_ID, "autoElevation") ) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  const col = root?.querySelector(".col.left") ?? root?.querySelector(".col");
  if ( !col ) return;
  const flying = !!token.getFlag(MODULE_ID, "flying");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `control-icon${flying ? " active" : ""}`;
  btn.dataset.tooltip = flying ? "Voando: o módulo não mexe na elevação" : "No chão: elevação = altura do terreno (clique para voar)";
  btn.innerHTML = `<i class="fa-solid ${flying ? "fa-jet-fighter-up" : "fa-shoe-prints"}"></i>`;
  btn.addEventListener("click", async ev => {
    ev.preventDefault();
    ev.stopPropagation();
    await token.setFlag(MODULE_ID, "flying", !flying);
    if ( flying ) {
      const h = terrainHeight(token);
      if ( h !== null ) await token.update({ elevation: h });
    }
    hud.render();
  });
  col.appendChild(btn);
}
