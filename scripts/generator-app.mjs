/**
 * Sitrep generator (GM): sitrep, world (d20 tables), biome and map options, with a live preview
 * (top-down with zones, or the isometric diorama). "Criar cena" builds the Foundry scene.
 */
import { MODULE_ID, MODULE_TITLE, PAGES } from "./constants.mjs";
import { HtmlApp, opt, readInputs } from "./html-app.mjs";
import { guardActions } from "./errors.mjs";
import { SITREPS, SITREP_ORDER, sitrepByRoll } from "./data/sitreps.mjs";
import { BIOMES, BIOME_GROUPS } from "./data/biomes.mjs";
import { ANTHRO_FEATURES, ENVIRONMENTS, NATURAL_FEATURES, WORLD_TYPES } from "./data/worlds.mjs";
import { DEFAULTS, generateMap } from "./generator.mjs";
import { gridModel, makeGeometry } from "./hexgrid.mjs";
import { renderDiorama, renderTopDown } from "./render.mjs";
import { esc, sitrepRulesHTML } from "./briefing.mjs";
import { makeRng, newSeed } from "./rng.mjs";
import { createSitrepScene, MARGIN } from "./scene-builder.mjs";

const APP_ID = `${MODULE_ID}-generator`;
const SIZES = { pequeno: [20, 14], medio: [30, 20], grande: [40, 26], enorme: [50, 32] };

async function rollDie(formula, flavor) {
  const roll = await new Roll(formula).evaluate();
  if ( game.dice3d ) await game.dice3d.showForRoll(roll, game.user, true);
  return { total: roll.total, flavor };
}

export class GeneratorApp extends HtmlApp {
  constructor(options = {}) {
    super(options);
    const last = game.settings.get(MODULE_ID, "lastOptions") ?? {};
    this.opts = { ...DEFAULTS, ...last, seed: newSeed() };
    this.world = last.world ?? null;
    this.view = "top";
    this.name = "";
    this.activate = false;
    this.briefing = game.settings.get(MODULE_ID, "briefing");
  }

  static DEFAULT_OPTIONS = {
    id: APP_ID,
    classes: ["lancer-sitreps", "lsr-generator"],
    window: { title: "Lancer Sitreps — gerador de sitrep e mapa", icon: "fa-solid fa-satellite-dish", resizable: true },
    position: { width: 1180, height: 820 },
    actions: guardActions({
      rollSitrep: GeneratorApp.#onRollSitrep,
      rollWorld: GeneratorApp.#onRollWorld,
      clearWorld: GeneratorApp.#onClearWorld,
      reseed: GeneratorApp.#onReseed,
      size: GeneratorApp.#onSize,
      view: GeneratorApp.#onView,
      create: GeneratorApp.#onCreate
    })
  };

  static open() {
    if ( !game.user.isGM ) {
      ui.notifications.warn(`${MODULE_TITLE}: só o mestre gera sitreps.`);
      return null;
    }
    const existing = foundry.applications.instances.get(APP_ID);
    if ( existing ) {
      existing.render({ force: true });
      existing.bringToFront?.();
      return existing;
    }
    const app = new GeneratorApp();
    app.render({ force: true });
    return app;
  }

  renderBody() {
    const o = this.opts;
    const s = SITREPS[o.sitrep];
    const biomeOpts = BIOME_GROUPS.map(g => `<optgroup label="${g}">${Object.entries(BIOMES).filter(([, b]) => b.group === g).map(([k, b]) => opt(k, b.name, k === o.biome)).join("")}</optgroup>`).join("");
    const w = this.world ?? {};
    const envOpts = [opt(0, "— nenhum —", !w.env), ...ENVIRONMENTS.map(e => opt(e.n, `${e.n}. ${e.name}`, w.env === e.n))].join("");
    const worldLines = [];
    if ( w.type ) worldLines.push(`<li><b>Mundo ${w.type}:</b> ${esc(WORLD_TYPES[w.type - 1].text)}</li>`);
    if ( w.natural ) worldLines.push(`<li><b>Natural ${w.natural}:</b> ${esc(NATURAL_FEATURES[w.natural - 1])}</li>`);
    if ( w.anthro ) worldLines.push(`<li><b>Humano ${w.anthro}:</b> ${esc(ANTHRO_FEATURES[w.anthro - 1])}</li>`);
    if ( w.env ) worldLines.push(`<li><b>Ambiente ${w.env} — ${esc(ENVIRONMENTS[w.env - 1].name)}:</b> ${esc(ENVIRONMENTS[w.env - 1].rule)}</li>`);
    return `
    <div class="lsr-gen">
      <form class="lsr-gen-form" data-keep-scroll autocomplete="off">
        <fieldset><legend>Sitrep <small>(p. ${PAGES.sitreps})</small></legend>
          <div class="lsr-row"><select name="sitrep">${SITREP_ORDER.map(k => opt(k, `${SITREPS[k].roll}. ${SITREPS[k].pt} (${SITREPS[k].name})`, k === o.sitrep)).join("")}</select>
          <button type="button" data-action="rollSitrep" data-tooltip="Sitrep aleatório (1d6)"><i class="fa-solid fa-dice-six"></i> 1d6</button></div>
          <details class="lsr-rules" open><summary>${esc(s.pt)} — regras</summary>${sitrepRulesHTML(o.sitrep)}</details>
        </fieldset>
        <fieldset><legend>Mundo <small>(pp. ${PAGES.worlds}–279)</small></legend>
          <div class="lsr-row">
            <button type="button" data-action="rollWorld" data-tooltip="Rola as 4 tabelas d20 e escolhe um bioma que combina"><i class="fa-solid fa-earth-americas"></i> Rolar mundo (4 × d20)</button>
            <button type="button" data-action="clearWorld" data-tooltip="Limpar o mundo"><i class="fa-solid fa-eraser"></i></button>
          </div>
          ${worldLines.length ? `<ul class="lsr-world">${worldLines.join("")}</ul>` : `<p class="lsr-hint">Opcional: o resultado vai para o briefing e sugere o bioma.</p>`}
          <label>Ambiente (regra de combate)<select name="env">${envOpts}</select></label>
        </fieldset>
        <fieldset><legend>Terreno</legend>
          <label>Bioma<select name="biome">${biomeOpts}</select></label>
          <div class="lsr-row lsr-sizes">
            ${Object.entries(SIZES).map(([k, [c, r]]) => `<button type="button" data-action="size" data-size="${k}" class="${o.cols === c && o.rows === r ? "active" : ""}">${k[0].toUpperCase()}${k.slice(1)} ${c}×${r}</button>`).join("")}
          </div>
          <div class="lsr-grid2">
            <label>Colunas<input type="number" name="cols" min="10" max="60" value="${o.cols}"></label>
            <label>Linhas<input type="number" name="rows" min="8" max="50" value="${o.rows}"></label>
            <label>Hexágonos<select name="columns">${opt("0", "Ponta para cima (linhas)", !o.columns)}${opt("1", "Lado para cima (colunas)", o.columns)}</select></label>
            <label>Altura máxima<input type="number" name="maxH" min="1" max="8" value="${o.maxH}"></label>
          </div>
          <label>Relevo <output>${o.relief.toFixed(2)}</output><input type="range" name="relief" min="0.2" max="1.6" step="0.05" value="${o.relief}"></label>
          <label>Cobertura <output>${o.cover.toFixed(2)}</output><input type="range" name="cover" min="0.2" max="2.5" step="0.05" value="${o.cover}"></label>
          <label>Líquido <output>${o.water == null ? "padrão do bioma" : `${Math.round(o.water * 100)}%`}</output><input type="range" name="water" min="-0.02" max="0.6" step="0.02" value="${o.water ?? -0.02}"></label>
          <label class="lsr-check"><input type="checkbox" name="roads" ${o.roads ? "checked" : ""}> Estradas ligando as zonas</label>
          <div class="lsr-row"><label class="lsr-grow">Código do mapa<input type="text" name="seed" value="${esc(o.seed)}"></label>
            <button type="button" data-action="reseed" data-tooltip="Novo código (outro mapa)"><i class="fa-solid fa-shuffle"></i></button></div>
        </fieldset>
        <fieldset><legend>Cena</legend>
          <label>Nome<input type="text" name="sceneName" placeholder="Sitrep: ${esc(s.pt)} — ${esc(BIOMES[o.biome].name)}" value="${esc(this.name)}"></label>
          <label class="lsr-check"><input type="checkbox" name="briefing" ${this.briefing ? "checked" : ""}> Criar diário de briefing (diorama + regras) visível aos jogadores</label>
          <label class="lsr-check"><input type="checkbox" name="activate" ${this.activate ? "checked" : ""}> Ativar a cena para todos</label>
        </fieldset>
      </form>
      <section class="lsr-gen-preview">
        <div class="lsr-row lsr-tabs">
          <button type="button" data-action="view" data-view="top" class="${this.view === "top" ? "active" : ""}"><i class="fa-solid fa-map"></i> Mapa da cena</button>
          <button type="button" data-action="view" data-view="iso" class="${this.view === "iso" ? "active" : ""}"><i class="fa-solid fa-cube"></i> Diorama</button>
          <span class="lsr-grow"></span>
          <button type="button" data-action="reseed"><i class="fa-solid fa-rotate"></i> Gerar outro</button>
          <button type="button" class="lsr-primary" data-action="create"><i class="fa-solid fa-flag-checkered"></i> Criar cena</button>
        </div>
        <div class="lsr-canvas-box"><canvas class="lsr-preview"></canvas></div>
        <p class="lsr-hint lsr-stats"></p>
      </section>
    </div>`;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const form = this.element.querySelector(".lsr-gen-form");
    form.addEventListener("input", ev => {
      const t = ev.target;
      if ( t.type === "range" ) {
        const out = t.closest("label")?.querySelector("output");
        if ( out ) out.textContent = t.name === "water" ? (Number(t.value) < 0 ? "padrão do bioma" : `${Math.round(Number(t.value) * 100)}%`) : Number(t.value).toFixed(2);
      }
    });
    form.addEventListener("change", ev => this.#readForm(ev.target?.name));
    this.#drawPreview();
  }

  #readForm(changed) {
    const v = readInputs(this.element.querySelector(".lsr-gen-form"));
    const before = this.opts.sitrep;
    const beforeBiome = this.opts.biome;
    Object.assign(this.opts, {
      sitrep: v.sitrep, biome: v.biome,
      cols: Math.max(10, Math.min(60, v.cols || 30)), rows: Math.max(8, Math.min(50, v.rows || 20)),
      columns: v.columns === "1", maxH: Math.max(1, Math.min(8, v.maxH || 4)),
      relief: v.relief, cover: v.cover, water: v.water < 0 ? null : v.water, roads: v.roads, seed: v.seed || newSeed()
    });
    this.name = v.sceneName;
    this.briefing = v.briefing;
    this.activate = v.activate;
    const env = Number(v.env) || 0;
    if ( env !== (this.world?.env ?? 0) ) this.world = { ...(this.world ?? {}), env: env || null };
    if ( changed === "sitrep" || changed === "env" || before !== this.opts.sitrep || beforeBiome !== this.opts.biome ) this.render();
    else this.#drawPreview();
  }

  #build(size) {
    const grid = gridModel({ size, columns: this.opts.columns, even: false });
    const geo = makeGeometry(grid, { cols: this.opts.cols, rows: this.opts.rows }, MARGIN, MARGIN);
    const map = generateMap(this.opts, geo);
    map.world = this.world ? { ...this.world } : null;
    return { map, geo };
  }

  #drawPreview() {
    const cv = this.element?.querySelector("canvas.lsr-preview");
    if ( !cv ) return;
    const box = cv.parentElement;
    const W = Math.max(300, box.clientWidth - 4);
    const H = Math.max(240, box.clientHeight - 4);
    const t0 = performance.now();
    const { map, geo } = this.#build(40);
    this.preview = map;
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    if ( this.view === "iso" ) renderDiorama(ctx, map, geo, { zones: true });
    else {
      const b = geo.bounds;
      const pad = geo.size * 0.8;
      const scale = Math.min(W / (b.x1 - b.x0 + (pad * 2)), H / (b.y1 - b.y0 + (pad * 2.6)));
      const ox = b.x0 - pad - (((W / scale) - (b.x1 - b.x0 + (pad * 2))) / 2);
      const oy = b.y0 - pad - (((H / scale) - (b.y1 - b.y0 + (pad * 2.6))) / 2);
      renderTopDown(ctx, map, geo, { ox, oy, scale }, { zones: true, numbers: false });
    }
    const counts = { hard: 0, soft: 0, liquid: 0 };
    for ( let k = 0; k < map.t.length; k++ ) {
      if ( "wWli".includes(map.t[k]) ) counts.liquid++;
      if ( map.p[k] === "T" || map.p[k] === "S" || map.t[k] === "f" ) counts.soft++;
      else if ( map.p[k] !== "." ) counts.hard++;
    }
    const stats = this.element.querySelector(".lsr-stats");
    if ( stats ) stats.textContent = `${map.cols} × ${map.rows} hexágonos · ${counts.hard} com cobertura pesada · ${counts.soft} com cobertura leve · ${counts.liquid} de líquido · ${Math.round(performance.now() - t0)} ms`;
  }

  static async #onRollSitrep() {
    const r = await rollDie("1d6");
    this.opts.sitrep = sitrepByRoll(r.total);
    ui.notifications.info(`${MODULE_TITLE}: 1d6 = ${r.total} → ${SITREPS[this.opts.sitrep].pt}`);
    this.opts.seed = newSeed();
    this.render();
  }

  static async #onRollWorld() {
    const roll = await new Roll("1d20 + 1d20 + 1d20 + 1d20").evaluate();
    if ( game.dice3d ) await game.dice3d.showForRoll(roll, game.user, true);
    const d = roll.dice.map(x => x.total);
    this.world = { type: d[0], natural: d[1], anthro: d[2], env: d[3] };
    const fromType = WORLD_TYPES[d[0] - 1].biomes;
    const fromEnv = ENVIRONMENTS[d[3] - 1].biomes;
    const both = fromType.filter(b => fromEnv.includes(b));
    const rng = makeRng(`${d.join("-")}|${Date.now()}`);
    this.opts.biome = rng.pick(both.length ? both : fromType);
    this.opts.seed = newSeed();
    this.render();
  }

  static #onClearWorld() {
    this.world = null;
    this.render();
  }

  static #onReseed() {
    this.opts.seed = newSeed();
    const input = this.element.querySelector("input[name=seed]");
    if ( input ) input.value = this.opts.seed;
    this.#drawPreview();
  }

  static #onSize(event, target) {
    const [c, r] = SIZES[target.dataset.size] ?? SIZES.medio;
    this.opts.cols = c;
    this.opts.rows = r;
    this.render();
  }

  static #onView(event, target) {
    this.view = target.dataset.view;
    this.render();
  }

  static async #onCreate(event, target) {
    this.#readForm();
    const map = this.preview ?? this.#build(40).map;
    target.disabled = true;
    try {
      await game.settings.set(MODULE_ID, "lastOptions", { ...this.opts, world: this.world });
      await createSitrepScene(foundry.utils.deepClone(map), { name: this.name, activate: this.activate, briefing: this.briefing });
      this.close();
    } finally {
      target.disabled = false;
    }
  }
}
