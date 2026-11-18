/**
 * Turns a generated map into a Foundry scene: hex grid, painted background (uploaded to
 * Data/worlds/<world>/lancer-sitreps/), zone drawings, objective marker and the briefing journal.
 */
import { FLAG_MAP, FLAG_MARKER, FLAG_STATE, MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { gridModel, makeGeometry } from "./hexgrid.mjs";
import { renderDiorama, renderTopDown, labelCell } from "./render.mjs";
import { rebuildZoneDrawings } from "./zones.mjs";
import { SITREPS } from "./data/sitreps.mjs";
import { BIOMES } from "./data/biomes.mjs";
import { briefingHTML } from "./briefing.mjs";
import { newState } from "./scoring.mjs";

export const MARGIN = 2;           // empty hexes around the map (even, so row/column parity is kept)
const MAX_SIDE = 8192;

export function gridTypeOf(map) {
  const T = CONST.GRID_TYPES;
  if ( map.columns ) return map.even ? T.HEXEVENQ : T.HEXODDQ;
  return map.even ? T.HEXEVENR : T.HEXODDR;
}

export function getMap(scene) {
  const m = scene?.getFlag(MODULE_ID, FLAG_MAP);
  if ( !m ) return null;
  return foundry.utils.deepClone(m);
}

/** Geometry of a scene that holds a map. */
export function sceneGeometry(scene, map = getMap(scene)) {
  if ( !scene || !map ) return null;
  return makeGeometry(scene.grid, map, MARGIN, MARGIN);
}

/** Pixel size of a grid space for a map (shrinks big maps to keep the image under 8192 px). */
export function pickGridSize(map) {
  const wanted = Math.max(50, Math.min(200, Number(game.settings.get(MODULE_ID, "gridSize")) || 100));
  for ( let size = wanted; size >= 40; size -= 10 ) {
    const g = gridModel({ size, columns: map.columns, even: map.even });
    const geo = makeGeometry(g, { cols: map.cols + (MARGIN * 2), rows: map.rows + (MARGIN * 2) + 1 }, 0, 0);
    if ( geo.bounds.x1 <= MAX_SIDE && geo.bounds.y1 <= MAX_SIDE ) return { size, width: Math.ceil(geo.bounds.x1), height: Math.ceil(geo.bounds.y1) };
  }
  return { size: 40, width: MAX_SIDE, height: MAX_SIDE };
}

async function canvasToFile(cv, name) {
  const blob = await new Promise(res => cv.toBlob(res, "image/webp", 0.9));
  if ( !blob ) throw new Error("O navegador não conseguiu gerar a imagem do mapa.");
  const ext = blob.type === "image/webp" ? "webp" : "png";
  return new File([blob], `${name}.${ext}`, { type: blob.type });
}

export async function uploadFile(file) {
  const FP = foundry.applications.apps.FilePicker.implementation;
  const dir = `worlds/${game.world.id}/${MODULE_ID}`;
  try {
    await FP.createDirectory("data", dir);
  } catch {
    /* already there */
  }
  const up = await FP.upload("data", dir, file, {}, { notify: false });
  if ( up === false || up?.status === "error" ) throw new Error(`Falha no upload de ${file.name}. O mestre precisa de permissão de upload de arquivos.`);
  return up?.path ?? `${dir}/${file.name}`;
}

const slug = s => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

/** Paint the background of a scene from its map and upload it. Returns the file path. */
export async function paintBackground(scene, map) {
  const geo = sceneGeometry(scene, map);
  const dims = scene.dimensions;
  const cv = document.createElement("canvas");
  cv.width = Math.round(dims.sceneWidth);
  cv.height = Math.round(dims.sceneHeight);
  const ctx = cv.getContext("2d");
  renderTopDown(ctx, map, geo, { ox: dims.sceneX, oy: dims.sceneY, scale: 1 }, { numbers: game.settings.get(MODULE_ID, "numbers") });
  const file = await canvasToFile(cv, `${slug(scene.name)}-${Date.now()}`);
  return uploadFile(file);
}

/** The isometric picture for the briefing. */
export async function paintDiorama(scene, map, name) {
  const geo = sceneGeometry(scene, map);
  const cv = document.createElement("canvas");
  cv.width = 1800;
  cv.height = Math.round(1800 * Math.min(0.85, Math.max(0.5, (map.rows * 0.9) / map.cols)));
  renderDiorama(cv.getContext("2d"), map, geo, { zones: true });
  return uploadFile(await canvasToFile(cv, `${slug(name)}-briefing-${Date.now()}`));
}

/**
 * Create the scene.
 * opts: { name, activate, briefing, world }
 */
export async function createSitrepScene(map, opts = {}) {
  if ( !game.user.isGM ) throw new Error("Só o mestre cria cenas.");
  const sitrep = SITREPS[map.sitrep];
  const biome = BIOMES[map.biome];
  const name = opts.name || `Sitrep: ${sitrep.pt} — ${biome.name}`;
  const { size, width, height } = pickGridSize(map);
  ui.notifications.info(`${MODULE_TITLE}: montando "${name}" (${map.cols} × ${map.rows} hexágonos)…`);

  const scene = await CONFIG.Scene.documentClass.create({
    name,
    width, height, padding: 0,
    backgroundColor: biome.sky[0],
    grid: { type: gridTypeOf(map), size, distance: 1, units: "", alpha: 0.12, color: "#000000", thickness: 1 },
    tokenVision: false,
    fog: { exploration: false },
    flags: { [MODULE_ID]: { [FLAG_MAP]: map, [FLAG_STATE]: newState(map) } }
  });

  const src = await paintBackground(scene, map);
  await scene.update({ "background.src": src });
  const geo = sceneGeometry(scene, map);
  await rebuildZoneDrawings(scene, map, geo);
  await placeObjectiveMarker(scene, map, geo);

  if ( opts.briefing ?? game.settings.get(MODULE_ID, "briefing") ) {
    const img = await paintDiorama(scene, map, name);
    const journal = await CONFIG.JournalEntry.documentClass.create({
      name: `Briefing — ${name}`,
      ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
      pages: [
        { name: "Mapa", type: "image", src: img, image: { caption: `${sitrep.pt} (${sitrep.name}) · ${biome.name}` } },
        { name: "Sitrep", type: "text", text: { content: briefingHTML(map), format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML } }
      ],
      flags: { [MODULE_ID]: { scene: scene.id } }
    });
    await scene.update({ journal: journal.id });
  }
  if ( opts.activate ) await scene.activate();
  else await scene.view();
  ui.notifications.info(`${MODULE_TITLE}: cena "${name}" pronta.`);
  return scene;
}

/** Re-paint the background of an existing sitrep scene after edits. */
export async function repaintScene(scene, map = getMap(scene)) {
  const src = await paintBackground(scene, map);
  await scene.update({ "background.src": src, [`flags.${MODULE_ID}.${FLAG_MAP}`]: map });
  return src;
}

/** Objective marker (Escort / Extraction) as a tile the GM can move. */
export async function placeObjectiveMarker(scene, map, geo) {
  if ( !["escort", "extraction"].includes(map.sitrep) ) return null;
  const zone = map.zones.find(z => (map.sitrep === "escort" ? z.kinds.includes("ADZ") : z.kinds.includes("OZ")));
  if ( !zone ) return null;
  const at = labelCell(map, geo, zone);
  const c = geo.centers[geo.neighbors[at].find(n => n > at) ?? at];
  const s = geo.size;
  const [tile] = await scene.createEmbeddedDocuments("Tile", [{
    texture: { src: `modules/${MODULE_ID}/assets/objective.svg` },
    x: c.x - (s / 2), y: c.y - (s / 2), width: s, height: s, elevation: 0,
    hidden: false, locked: false,
    flags: { [MODULE_ID]: { [FLAG_MARKER]: "objective" } }
  }]);
  return tile;
}
