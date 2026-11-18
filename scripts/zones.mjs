/**
 * Zones on the canvas: hex sets → outline polygons (Drawings the GM can move and reshape),
 * and the reverse (which tokens / hexes are inside a zone drawing).
 */
import { MODULE_ID, FLAG_ZONE } from "./constants.mjs";
import { shade } from "./color.mjs";
import { labelCell } from "./render.mjs";

const key = p => `${Math.round(p.x * 2)},${Math.round(p.y * 2)}`;

function signedArea(pts) {
  let a = 0;
  for ( let i = 0; i < pts.length; i++ ) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += (p.x * q.y) - (q.x * p.y);
  }
  return a / 2;
}

export function pointInPolygon(x, y, pts) {
  let inside = false;
  for ( let i = 0, j = pts.length - 1; i < pts.length; j = i++ ) {
    const a = pts[i];
    const b = pts[j];
    if ( ((a.y > y) !== (b.y > y)) && (x < (((b.x - a.x) * (y - a.y)) / ((b.y - a.y) || 1e-9)) + a.x) ) inside = !inside;
  }
  return inside;
}

/** Remove points that sit on a straight line between their neighbours. */
function simplify(pts) {
  const out = [];
  for ( let i = 0; i < pts.length; i++ ) {
    const a = pts[(i - 1 + pts.length) % pts.length];
    const b = pts[i];
    const c = pts[(i + 1) % pts.length];
    const cross = ((b.x - a.x) * (c.y - b.y)) - ((b.y - a.y) * (c.x - b.x));
    if ( Math.abs(cross) > 0.5 ) out.push(b);
  }
  return out.length >= 3 ? out : pts;
}

/**
 * Outline polygons of a set of cells: one polygon per connected piece, holes bridged in.
 * Returns [[{x, y}, ...], ...] in canvas coordinates.
 */
export function outlinePolygons(geo, cells) {
  const set = new Set(cells);
  const next = new Map();
  for ( const k of cells ) {
    const vs = geo.verts[k];
    for ( let i = 0; i < vs.length; i++ ) {
      const a = vs[i];
      const b = vs[(i + 1) % vs.length];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const c = geo.centers[k];
      const tx = c.x + (2 * (mid.x - c.x));
      const ty = c.y + (2 * (mid.y - c.y));
      const shared = geo.neighbors[k].some(n => set.has(n) && Math.hypot(geo.centers[n].x - tx, geo.centers[n].y - ty) < geo.size * 0.3);
      if ( shared ) continue;
      const ka = key(a);
      if ( !next.has(ka) ) next.set(ka, []);
      next.get(ka).push({ a, b });
    }
  }
  const loops = [];
  const used = new Set();
  for ( const [start, list] of next ) {
    for ( const edge of list ) {
      if ( used.has(edge) ) continue;
      const loop = [];
      let e = edge;
      let guard = 0;
      while ( e && !used.has(e) && guard++ < 100000 ) {
        used.add(e);
        loop.push(e.a);
        const cand = (next.get(key(e.b)) ?? []).filter(x => !used.has(x));
        e = cand[0];
      }
      if ( loop.length >= 3 ) loops.push(simplify(loop));
      void start;
    }
  }
  if ( !loops.length ) return [];
  /* outer loops share the orientation of a single hex outline */
  const hexSign = Math.sign(signedArea(geo.verts[cells[0]]));
  const outers = loops.filter(l => Math.sign(signedArea(l)) === hexSign);
  const holes = loops.filter(l => Math.sign(signedArea(l)) !== hexSign);
  const polys = outers.map(o => [...o]);
  for ( const h of holes ) {
    const owner = polys.findIndex(p => pointInPolygon(h[0].x + 0.1, h[0].y + 0.1, p)) ;
    const target = owner >= 0 ? owner : 0;
    const poly = polys[target];
    let best = { i: 0, j: 0, d: Infinity };
    for ( let i = 0; i < poly.length; i++ ) {
      for ( let j = 0; j < h.length; j++ ) {
        const d = Math.hypot(poly[i].x - h[j].x, poly[i].y - h[j].y);
        if ( d < best.d ) best = { i, j, d };
      }
    }
    const holeSeq = [...h.slice(best.j), ...h.slice(0, best.j + 1)];
    polys[target] = [...poly.slice(0, best.i + 1), ...holeSeq, ...poly.slice(best.i)];
  }
  return polys;
}

/* ------------------------------------------------------------------ */
/* Drawings                                                           */
/* ------------------------------------------------------------------ */

export function zoneDrawingsData(map, geo, zone, opts = {}) {
  const out = [];
  const polys = outlinePolygons(geo, zone.cells);
  const S = geo.size;
  polys.forEach((poly, part) => {
    const xs = poly.map(p => p.x);
    const ys = poly.map(p => p.y);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    out.push({
      author: game.user.id,
      x: x0, y: y0,
      shape: { type: "p", width: Math.max(...xs) - x0, height: Math.max(...ys) - y0, points: poly.flatMap(p => [p.x - x0, p.y - y0]) },
      bezierFactor: 0,
      fillType: CONST.DRAWING_FILL_TYPES.SOLID, fillColor: zone.color, fillAlpha: opts.fillAlpha ?? 0.16,
      strokeWidth: Math.max(3, Math.round(S * 0.06)), strokeColor: zone.color, strokeAlpha: 0.95,
      text: "",
      hidden: !!opts.hidden, locked: false,
      flags: { [MODULE_ID]: { [FLAG_ZONE]: { id: zone.id, part } } }
    });
  });
  /* the dark label box, like the zone labels of the book's diagrams */
  const at = labelCell(map, geo, zone);
  if ( at >= 0 ) {
    const c = geo.centers[at];
    const fontSize = Math.max(18, Math.round(S * 0.3));
    const w = Math.max(S * 1.2, (zone.label.length * fontSize * 0.62) + (S * 0.4));
    const h = fontSize * 1.6;
    out.push({
      author: game.user.id,
      x: c.x - (w / 2), y: c.y - (h / 2),
      shape: { type: "r", width: w, height: h },
      fillType: CONST.DRAWING_FILL_TYPES.SOLID, fillColor: shade(zone.color, -0.5), fillAlpha: 0.92,
      strokeWidth: 2, strokeColor: zone.color, strokeAlpha: 1,
      text: zone.label, fontSize, textColor: "#ffffff", textAlpha: 1, fontFamily: "Signika",
      hidden: !!opts.hidden, locked: false,
      flags: { [MODULE_ID]: { [FLAG_ZONE]: { id: zone.id, label: true } } }
    });
  }
  return out;
}

/** Polygon (canvas points) of a zone drawing, rotation included. */
export function drawingPolygon(drawing) {
  const d = drawing;
  const sh = d.shape;
  let pts;
  if ( sh.type === "p" && sh.points?.length >= 6 ) {
    pts = [];
    for ( let i = 0; i < sh.points.length; i += 2 ) pts.push({ x: d.x + sh.points[i], y: d.y + sh.points[i + 1] });
  } else {
    pts = [{ x: d.x, y: d.y }, { x: d.x + sh.width, y: d.y }, { x: d.x + sh.width, y: d.y + sh.height }, { x: d.x, y: d.y + sh.height }];
  }
  if ( d.rotation ) {
    const cx = d.x + (sh.width / 2);
    const cy = d.y + (sh.height / 2);
    const a = Math.toRadians ? Math.toRadians(d.rotation) : d.rotation * Math.PI / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    pts = pts.map(p => ({ x: cx + (((p.x - cx) * cos) - ((p.y - cy) * sin)), y: cy + (((p.x - cx) * sin) + ((p.y - cy) * cos)) }));
  }
  return pts;
}

/** Zone drawings of a scene grouped by zone id (outline parts only). */
export function zoneShapes(scene) {
  const out = new Map();
  for ( const d of scene.drawings ) {
    const f = d.getFlag(MODULE_ID, FLAG_ZONE);
    if ( !f || f.label ) continue;
    if ( !out.has(f.id) ) out.set(f.id, []);
    out.get(f.id).push(drawingPolygon(d));
  }
  return out;
}

/** Is a canvas point inside any of the polygons? */
export function inShapes(shapes, x, y) {
  return (shapes ?? []).some(poly => pointInPolygon(x, y, poly));
}

/** Delete our zone drawings (all, or one zone) and create them again from the map. */
export async function rebuildZoneDrawings(scene, map, geo, onlyId = null, opts = {}) {
  const old = scene.drawings.filter(d => {
    const f = d.getFlag(MODULE_ID, FLAG_ZONE);
    return f && (!onlyId || f.id === onlyId);
  }).map(d => d.id);
  if ( old.length ) await scene.deleteEmbeddedDocuments("Drawing", old);
  const data = map.zones.filter(z => !onlyId || z.id === onlyId).filter(z => z.cells.length).flatMap(z => zoneDrawingsData(map, geo, z, { hidden: z.hidden, ...opts }));
  if ( data.length ) await scene.createEmbeddedDocuments("Drawing", data);
}
