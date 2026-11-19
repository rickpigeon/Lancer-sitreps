/**
 * Zone and terrain editor (GM) for the scene being viewed.
 * Zones: paint / erase hexes, rename, recolour, hide from players, add or delete zones.
 * Terrain: raise / lower, change ground, put or remove objects; "Repintar" uploads a new background.
 * Zone drawings moved or reshaped by hand are read back into hexes when the editor opens.
 */
import { FLAG_MAP, MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { HtmlApp, opt } from "./html-app.mjs";
import { guard, guardActions } from "./errors.mjs";
import { ZONE_KINDS } from "./data/sitreps.mjs";
import { GROUND, PROPS } from "./data/terrain.mjs";
import { getMap, repaintScene, sceneGeometry } from "./scene-builder.mjs";
import { inShapes, rebuildZoneDrawings, zoneShapes } from "./zones.mjs";
import { cellOf, setCell } from "./generator.mjs";
import { esc } from "./briefing.mjs";
import { ringsAround } from "./hexgrid.mjs";

const APP_ID = `${MODULE_ID}-editor`;

export class EditorApp extends HtmlApp {
  constructor(scene, options = {}) {
    super(options);
    this.scene = scene;
    this.map = getMap(scene);
    this.geo = sceneGeometry(scene, this.map);
    this.brush = { mode: "off", zone: this.map.zones[0]?.id ?? null, ground: "g", prop: "R", size: 1, radius: 0, newKind: "CZ" };
    this.dirtyTerrain = false;
    this.dirtyZones = new Set();
    this.#syncFromDrawings();
    this.#bound = {
      down: guard(ev => this.#onPointer(ev, "down"), "pincel"),
      move: guard(ev => this.#onPointer(ev, "move"), "pincel"),
      up: guard(ev => this.#onPointer(ev, "up"), "pincel")
    };
  }

  #bound;
  #painting = false;
  #touched = new Set();
  #gfx = null;

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["lancer-sitreps", "lsr-editor"],
    window: { title: "Lancer Sitreps — zonas e terreno", icon: "fa-solid fa-draw-polygon", resizable: true },
    position: { width: 420, height: 720, left: 120, top: 80 },
    actions: guardActions({
      mode: EditorApp.#onMode,
      pickZone: EditorApp.#onPickZone,
      toggleHidden: EditorApp.#onToggleHidden,
      deleteZone: EditorApp.#onDeleteZone,
      addZone: EditorApp.#onAddZone,
      repaint: EditorApp.#onRepaint,
      redrawZones: EditorApp.#onRedrawZones,
      shiftAll: EditorApp.#onShiftAll
    })
  };

  static open(scene = canvas?.scene) {
    if ( !game.user.isGM ) return ui.notifications.warn(`${MODULE_TITLE}: só o mestre edita o mapa.`);
    if ( !scene?.getFlag(MODULE_ID, FLAG_MAP) ) return ui.notifications.warn(`${MODULE_TITLE}: esta cena não foi criada pelo gerador de sitreps.`);
    foundry.applications.instances.get(APP_ID)?.close();
    const app = new EditorApp(scene);
    app.render({ force: true });
    return app;
  }

  /** Read zone cells back from the drawings (the GM may have moved or reshaped them). */
  #syncFromDrawings() {
    const shapes = zoneShapes(this.scene);
    let changed = false;
    for ( const z of this.map.zones ) {
      const sh = shapes.get(z.id);
      if ( !sh?.length ) continue;
      const cells = [];
      for ( let k = 0; k < this.map.cols * this.map.rows; k++ ) {
        const c = this.geo.centers[k];
        if ( inShapes(sh, c.x, c.y) ) cells.push(k);
      }
      if ( cells.length && cells.join(",") !== [...z.cells].sort((a, b) => a - b).join(",") ) {
        z.cells = cells;
        changed = true;
      }
    }
    if ( changed ) this.scene.update({ [`flags.${MODULE_ID}.${FLAG_MAP}.zones`]: this.map.zones });
  }

  renderBody() {
    const b = this.brush;
    const modes = [
      ["off", "fa-hand", "Desligado (usar o canvas normalmente)"],
      ["paint", "fa-paintbrush", "Pintar a zona escolhida"],
      ["erase", "fa-eraser", "Tirar hexágonos da zona escolhida"],
      ["raise", "fa-arrow-up", "Subir 1 nível"],
      ["lower", "fa-arrow-down", "Descer 1 nível"],
      ["ground", "fa-mountain", "Trocar o terreno"],
      ["prop", "fa-cubes", "Pôr objeto"],
      ["clear", "fa-broom", "Tirar objeto"]
    ];
    const zones = this.map.zones.map(z => `
      <li class="lsr-zone ${z.id === b.zone ? "active" : ""}" data-zone="${z.id}">
        <input type="color" value="${esc(z.color)}" data-field="color" data-tooltip="Cor">
        <input type="text" value="${esc(z.label)}" data-field="label" data-tooltip="${esc(z.title)}">
        <span class="lsr-count">${z.cells.length}</span>
        <button type="button" data-action="pickZone" data-tooltip="Usar no pincel"><i class="fa-solid fa-paintbrush"></i></button>
        <button type="button" data-action="toggleHidden" data-tooltip="${z.hidden ? "Escondida dos jogadores" : "Visível aos jogadores"}"><i class="fa-solid ${z.hidden ? "fa-eye-slash" : "fa-eye"}"></i></button>
        <button type="button" data-action="deleteZone" data-tooltip="Apagar zona"><i class="fa-solid fa-trash"></i></button>
      </li>`).join("");
    return `
    <div class="lsr-editor-body" data-keep-scroll>
      <p class="lsr-hint">Cena: <b>${esc(this.scene.name)}</b>. Escolha um pincel e clique ou arraste no mapa. As zonas também podem ser movidas e reformatadas como desenhos comuns (camada de Desenhos); o editor lê o formato novo ao abrir.</p>
      <div class="lsr-modes">${modes.map(([m, icon, tip]) => `<button type="button" data-action="mode" data-mode="${m}" class="${b.mode === m ? "active" : ""}" data-tooltip="${tip}"><i class="fa-solid ${icon}"></i></button>`).join("")}</div>
      <div class="lsr-grid2">
        <label>Raio do pincel<select data-brush="radius">${[0, 1, 2, 3].map(r => opt(r, r ? `${r} (${(3 * r * (r + 1)) + 1} hex)` : "1 hex", r === b.radius)).join("")}</select></label>
        <label>Terreno<select data-brush="ground">${Object.entries(GROUND).map(([k, g]) => opt(k, g.name, k === b.ground)).join("")}</select></label>
        <label>Objeto<select data-brush="prop">${Object.entries(PROPS).map(([k, p]) => opt(k, p.name, k === b.prop)).join("")}</select></label>
        <label>Tamanho<select data-brush="size">${[1, 2, 3].map(s => opt(s, `Tamanho ${s}`, s === b.size)).join("")}</select></label>
      </div>
      <h3>Zonas</h3>
      <ul class="lsr-zones">${zones}</ul>
      <div class="lsr-row"><select data-brush="newKind">${Object.entries(ZONE_KINDS).map(([k, z]) => opt(k, `${z.short} — ${z.label}`, k === b.newKind)).join("")}</select>
        <button type="button" data-action="addZone"><i class="fa-solid fa-plus"></i> Nova zona</button></div>
      <h3>Altura dos hexágonos</h3>
      <label>Altura visual dos degraus <output>${(this.map.lift ?? 0.15).toFixed(2)}</output><input type="range" data-lift min="0.05" max="0.35" step="0.01" value="${this.map.lift ?? 0.15}"></label>
      <div class="lsr-row">
        <button type="button" data-action="shiftAll" data-delta="1" data-tooltip="Sobe 1 nível de elevação em todo o terreno (líquidos ficam)"><i class="fa-solid fa-arrow-up"></i> Todo o terreno +1</button>
        <button type="button" data-action="shiftAll" data-delta="-1" data-tooltip="Desce 1 nível de elevação em todo o terreno (mínimo 0)"><i class="fa-solid fa-arrow-down"></i> Todo o terreno −1</button>
      </div>
      <p class="lsr-hint">Para hexágonos soltos use os pincéis ↑ e ↓. Depois de mexer, clique em "Repintar fundo".</p>
      <div class="lsr-row lsr-foot">
        <button type="button" data-action="redrawZones" data-tooltip="Recria os desenhos das zonas a partir dos hexágonos"><i class="fa-solid fa-vector-square"></i> Redesenhar zonas</button>
        <button type="button" class="${this.dirtyTerrain ? "lsr-primary" : ""}" data-action="repaint" data-tooltip="Gera e envia a imagem de fundo nova"><i class="fa-solid fa-image"></i> Repintar fundo${this.dirtyTerrain ? " *" : ""}</button>
      </div>
    </div>`;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    root.querySelectorAll("[data-brush]").forEach(el => el.addEventListener("change", () => {
      const k = el.dataset.brush;
      this.brush[k] = ["radius", "size"].includes(k) ? Number(el.value) : el.value;
    }));
    root.querySelectorAll(".lsr-zone [data-field]").forEach(el => el.addEventListener("change", guard(async () => {
      const id = el.closest("[data-zone]").dataset.zone;
      const z = this.map.zones.find(x => x.id === id);
      z[el.dataset.field] = el.value;
      await this.#saveZones([id]);
    }, "zona")));
    root.querySelector("[data-lift]")?.addEventListener("input", ev => {
      const out = ev.target.closest("label")?.querySelector("output");
      if ( out ) out.textContent = Number(ev.target.value).toFixed(2);
    });
    root.querySelector("[data-lift]")?.addEventListener("change", ev => {
      this.map.lift = Number(ev.target.value) || 0.15;
      this.dirtyTerrain = true;
      this.render();
    });
    this.#listen(this.brush.mode !== "off");
  }

  async _onClose(options) {
    this.#listen(false);
    this.#clearGfx();
    if ( this.dirtyTerrain ) ui.notifications.warn(`${MODULE_TITLE}: o terreno mudou mas o fundo não foi repintado. Abra o editor e clique em "Repintar fundo" quando quiser.`);
    return super._onClose?.(options);
  }

  #listen(on) {
    const el = canvas?.app?.view;
    if ( !el ) return;
    for ( const [type, fn] of [["pointerdown", this.#bound.down], ["pointermove", this.#bound.move], ["pointerup", this.#bound.up]] ) {
      document.removeEventListener(type, fn, true);
      if ( on ) document.addEventListener(type, fn, true);
    }
  }

  #point(ev) {
    if ( typeof canvas.canvasCoordinatesFromClient === "function" ) return canvas.canvasCoordinatesFromClient({ x: ev.clientX, y: ev.clientY });
    return canvas.mousePosition;
  }

  #onPointer(ev, phase) {
    if ( this.brush.mode === "off" || canvas.scene?.id !== this.scene.id ) return;
    if ( phase === "down" ) {
      if ( ev.target !== canvas.app.view || ev.button !== 0 ) return;
      ev.stopPropagation();
      ev.preventDefault();
      this.#painting = true;
      this.#touched.clear();
    }
    if ( !this.#painting ) return;
    if ( phase === "move" ) ev.stopPropagation();
    const p = this.#point(ev);
    const k = this.geo.cellAt(p.x, p.y);
    if ( k >= 0 ) {
      const ring = ringsAround(this.geo, [k], this.brush.radius);
      for ( const c of ring.keys() ) this.#apply(c);
      this.#drawGfx();
    }
    if ( phase === "up" ) {
      ev.stopPropagation();
      this.#painting = false;
      this.#commit();
    }
  }

  #apply(k) {
    if ( this.#touched.has(k) ) return;
    this.#touched.add(k);
    const b = this.brush;
    const cell = cellOf(this.map, k);
    switch ( b.mode ) {
      case "paint":
      case "erase": {
        const z = this.map.zones.find(x => x.id === b.zone);
        if ( !z ) return;
        const set = new Set(z.cells);
        if ( b.mode === "paint" ) set.add(k);
        else set.delete(k);
        z.cells = [...set];
        this.dirtyZones.add(z.id);
        break;
      }
      case "raise": setCell(this.map, k, { h: Math.min(9, cell.h + 1) }); this.dirtyTerrain = true; break;
      case "lower": setCell(this.map, k, { h: Math.max(0, cell.h - 1) }); this.dirtyTerrain = true; break;
      case "ground": setCell(this.map, k, { t: b.ground, ...("wWli".includes(b.ground) ? { h: 0, p: "", s: 0 } : {}) }); this.dirtyTerrain = true; break;
      case "prop": setCell(this.map, k, { p: b.prop, s: b.size }); this.dirtyTerrain = true; break;
      case "clear": setCell(this.map, k, { p: "", s: 0 }); this.dirtyTerrain = true; break;
      default: break;
    }
  }

  #drawGfx() {
    if ( !globalThis.PIXI || !canvas.controls ) return;
    if ( !this.#gfx || this.#gfx.destroyed ) {
      this.#gfx = new PIXI.Graphics();
      canvas.controls.addChild(this.#gfx);
    }
    const g = this.#gfx;
    g.clear();
    const z = this.map.zones.find(x => x.id === this.brush.zone);
    const color = Number(`0x${(["paint", "erase"].includes(this.brush.mode) ? z?.color ?? "#ffffff" : "#ffffff").replace("#", "")}`);
    for ( const k of this.#touched ) {
      g.lineStyle(3, color, 0.9);
      g.beginFill(color, this.brush.mode === "erase" ? 0.05 : 0.3);
      g.drawPolygon(this.geo.verts[k].flatMap(v => [v.x, v.y]));
      g.endFill();
    }
  }

  #clearGfx() {
    if ( this.#gfx && !this.#gfx.destroyed ) this.#gfx.destroy();
    this.#gfx = null;
  }

  async #commit() {
    const ids = [...this.dirtyZones];
    this.dirtyZones.clear();
    if ( ids.length ) await this.#saveZones(ids);
    else if ( this.dirtyTerrain ) await this.scene.update({ [`flags.${MODULE_ID}.${FLAG_MAP}`]: this.map });
    setTimeout(() => this.#clearGfx(), 350);
    this.render();
  }

  async #saveZones(ids) {
    await this.scene.update({ [`flags.${MODULE_ID}.${FLAG_MAP}`]: this.map });
    for ( const id of ids ) await rebuildZoneDrawings(this.scene, this.map, this.geo, id);
  }

  static #onMode(event, target) {
    this.brush.mode = target.dataset.mode;
    if ( this.brush.mode !== "off" && canvas.scene?.id !== this.scene.id ) this.scene.view();
    this.render();
  }

  static #onPickZone(event, target) {
    this.brush.zone = target.closest("[data-zone]").dataset.zone;
    if ( !["paint", "erase"].includes(this.brush.mode) ) this.brush.mode = "paint";
    this.render();
  }

  static async #onToggleHidden(event, target) {
    const z = this.map.zones.find(x => x.id === target.closest("[data-zone]").dataset.zone);
    z.hidden = !z.hidden;
    await this.#saveZones([z.id]);
    this.render();
  }

  static async #onDeleteZone(event, target) {
    const z = this.map.zones.find(x => x.id === target.closest("[data-zone]").dataset.zone);
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Apagar zona" }, content: `<p>Apagar a zona <b>${esc(z.label)}</b> e os desenhos dela?</p>`, rejectClose: false });
    if ( !ok ) return;
    this.map.zones = this.map.zones.filter(x => x !== z);
    await this.scene.update({ [`flags.${MODULE_ID}.${FLAG_MAP}`]: this.map });
    await rebuildZoneDrawings(this.scene, { ...this.map, zones: [] }, this.geo, z.id);
    if ( this.brush.zone === z.id ) this.brush.zone = this.map.zones[0]?.id ?? null;
    this.render();
  }

  static #onAddZone() {
    const kind = this.brush.newKind;
    const k = ZONE_KINDS[kind];
    const n = this.map.zones.filter(z => z.kinds[0] === kind).length + 1;
    const id = `${kind.toLowerCase()}-${foundry.utils.randomID(6)}`;
    this.map.zones.push({ id, kinds: [kind], label: `${k.short} ${n}`, title: k.label, color: k.color, cells: [], letter: null, cz: kind === "CZ" });
    this.brush.zone = id;
    this.brush.mode = "paint";
    ui.notifications.info(`${MODULE_TITLE}: zona criada; pinte os hexágonos dela no mapa.`);
    this.render();
  }

  static async #onRedrawZones() {
    await rebuildZoneDrawings(this.scene, this.map, this.geo);
    ui.notifications.info(`${MODULE_TITLE}: desenhos das zonas recriados.`);
  }

  static #onShiftAll(event, target) {
    const d = Number(target.dataset.delta) || 0;
    for ( let k = 0; k < this.map.h.length; k++ ) {
      if ( "wWli".includes(this.map.t[k]) ) continue;
      this.map.h[k] = Math.max(0, Math.min(9, this.map.h[k] + d));
    }
    this.map.maxH = Math.max(1, Math.min(9, (this.map.maxH ?? 4) + d));
    this.dirtyTerrain = true;
    ui.notifications.info(`Lancer Sitreps: terreno ${d > 0 ? "subiu" : "desceu"} 1 nível. Clique em "Repintar fundo" para ver.`);
    this.render();
  }

  static async #onRepaint(event, target) {
    target.disabled = true;
    try {
      ui.notifications.info(`${MODULE_TITLE}: repintando o fundo…`);
      await repaintScene(this.scene, this.map);
      this.dirtyTerrain = false;
      ui.notifications.info(`${MODULE_TITLE}: fundo atualizado.`);
    } finally {
      target.disabled = false;
      this.render();
    }
  }
}
