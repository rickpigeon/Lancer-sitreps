/**
 * Map renderers (Canvas 2D, pure apart from the canvas):
 *  - renderTopDown: the scene background. Hex tops sit exactly on the grid; height shows as cliff walls
 *    falling toward the viewer (south), ambient occlusion and a diorama base with rock strata around the map.
 *  - renderDiorama: an isometric "tabletop" view of the same map for the briefing.
 */
import { BIOMES } from "./data/biomes.mjs";
import { mix, rgb, rgba, shade } from "./color.mjs";
import { drawProp } from "./props.mjs";
import { makeRng } from "./rng.mjs";
import { cellOf } from "./generator.mjs";

const LIQ = "wWli";
const BASE_LEVEL = -1.6;

export function biomeOf(map) {
  return BIOMES[map.biome] ?? BIOMES.grassland;
}

const level = (map, k) => (LIQ.includes(map.t[k]) ? -0.35 : map.h[k]);

function topColor(map, biome, k) {
  const t = map.t[k];
  const h = map.h[k];
  const [shallow, deep] = biome.liquidColors;
  if ( t === "W" ) return deep;
  if ( t === "w" ) return shallow;
  if ( t === "l" ) return mix(shallow, deep, 0.35);
  if ( t === "i" ) return shallow;
  const maxH = Math.max(1, map.maxH);
  const idx = Math.max(0, Math.min(3, Math.round((h / maxH) * 3)));
  let c = shade(biome.tops[idx], 0.025 * h);
  if ( t === "d" ) c = mix(c, biome.rough, 0.55);
  else if ( t === "x" ) c = mix(c, biome.hazard.color, 0.32);
  else if ( t === "f" ) c = shade(mix(c, biome.tops[1], 0.4), -0.1);
  else if ( t === "b" ) c = mix(shallow, deep, 0.3);
  return c;
}

function pathPoly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
}

/** Neighbour across an edge (or -1). */
function across(geo, k, mid) {
  const c = geo.centers[k];
  const tx = c.x + (2 * (mid.x - c.x));
  const ty = c.y + (2 * (mid.y - c.y));
  let best = -1;
  let bd = geo.size * 0.3;
  for ( const n of geo.neighbors[k] ) {
    const d = Math.hypot(geo.centers[n].x - tx, geo.centers[n].y - ty);
    if ( d < bd ) {
      bd = d;
      best = n;
    }
  }
  return best;
}

/** Precomputed edges of every cell: [{a, b, mid, nx, ny, n}] */
function edgesOf(geo) {
  if ( geo._edges ) return geo._edges;
  geo._edges = geo.verts.map((vs, k) => {
    const c = geo.centers[k];
    return vs.map((a, i) => {
      const b = vs[(i + 1) % vs.length];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const len = Math.hypot(mid.x - c.x, mid.y - c.y) || 1;
      return { a, b, mid, nx: (mid.x - c.x) / len, ny: (mid.y - c.y) / len, n: across(geo, k, mid) };
    });
  });
  return geo._edges;
}

/* ------------------------------------------------------------------ */
/* Ground details                                                     */
/* ------------------------------------------------------------------ */

function details(ctx, map, biome, geo, k, rng, S) {
  const t = map.t[k];
  const c = geo.centers[k];
  const base = topColor(map, biome, k);
  const u = S / 100;
  const jitter = () => ({ x: c.x + ((rng() - 0.5) * S * 0.62), y: c.y + ((rng() - 0.5) * S * 0.62) });
  ctx.save();
  pathPoly(ctx, geo.verts[k]);
  ctx.clip();
  /* soft light gradient on every top */
  const g = ctx.createLinearGradient(c.x - (S * 0.5), c.y - (S * 0.5), c.x + (S * 0.5), c.y + (S * 0.5));
  g.addColorStop(0, rgba("#ffffff", 0.1));
  g.addColorStop(1, rgba("#000000", 0.06));
  ctx.fillStyle = g;
  ctx.fillRect(c.x - S, c.y - S, S * 2, S * 2);
  if ( t === "w" || t === "W" ) {
    ctx.strokeStyle = rgba("#ffffff", t === "W" ? 0.22 : 0.35);
    ctx.lineWidth = 2 * u;
    for ( let i = 0; i < 3; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.arc(p.x, p.y, S * 0.08, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else if ( t === "l" ) {
    ctx.strokeStyle = rgba(biome.liquidColors[0], 0.9);
    ctx.lineWidth = 3 * u;
    ctx.shadowColor = biome.liquidColors[0];
    ctx.shadowBlur = 8 * u;
    for ( let i = 0; i < 3; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + ((rng() - 0.5) * S * 0.4), p.y + ((rng() - 0.5) * S * 0.3));
      ctx.lineTo(p.x + ((rng() - 0.5) * S * 0.5), p.y + ((rng() - 0.5) * S * 0.4));
      ctx.stroke();
    }
    ctx.fillStyle = rgba("#2a1a1a", 0.35);
    for ( let i = 0; i < 2; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, S * 0.12, S * 0.07, rng() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if ( t === "i" ) {
    ctx.strokeStyle = rgba("#ffffff", 0.6);
    ctx.lineWidth = 1.5 * u;
    for ( let i = 0; i < 3; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.moveTo(p.x - (S * 0.15), p.y);
      ctx.lineTo(p.x + (S * 0.12), p.y - (S * 0.06));
      ctx.stroke();
    }
  } else if ( t === "b" ) {
    ctx.strokeStyle = rgba("#ffffff", 0.3);
    ctx.lineWidth = 2 * u;
    for ( let i = 0; i < 2; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.arc(p.x, p.y, S * 0.07, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else if ( t === "x" ) {
    ctx.strokeStyle = biome.hazard.color;
    ctx.shadowColor = biome.hazard.color;
    ctx.shadowBlur = 10 * u;
    ctx.lineWidth = 2.5 * u;
    for ( let i = 0; i < 3; i++ ) {
      const p = jitter();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      for ( let s = 0; s < 3; s++ ) ctx.lineTo(p.x + ((rng() - 0.5) * S * 0.45), p.y + ((rng() - 0.5) * S * 0.45));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    /* hazard chevrons on the rim */
    ctx.fillStyle = rgba(biome.hazard.color, 0.25);
    ctx.beginPath();
    ctx.arc(c.x, c.y, S * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else {
    /* tufts, pebbles, cracks */
    const n = t === "d" ? 9 : 6;
    for ( let i = 0; i < n; i++ ) {
      const p = jitter();
      if ( t === "d" ) {
        ctx.fillStyle = rgba(rng() < 0.5 ? "#000000" : "#ffffff", 0.16);
        ctx.beginPath();
        ctx.arc(p.x, p.y, S * (0.025 + (rng() * 0.03)), 0, Math.PI * 2);
        ctx.fill();
      } else if ( t === "r" ) {
        /* the road itself is drawn by roads() */
      } else {
        ctx.strokeStyle = rgba(rng() < 0.6 ? shade(base, -0.35) : shade(base, 0.35), 0.45);
        ctx.lineWidth = 1.6 * u;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (2 * u), p.y - (6 * u));
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + (2.5 * u), p.y - (5 * u));
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/** Roads: a band from each road cell centre toward road / bridge neighbours. */
function roads(ctx, map, biome, geo, S) {
  const isRoad = k => map.t[k] === "r" || map.t[k] === "b";
  const segs = [];
  for ( let k = 0; k < map.t.length; k++ ) {
    if ( !isRoad(k) ) continue;
    const c = geo.centers[k];
    let links = 0;
    for ( const n of geo.neighbors[k] ) {
      if ( !isRoad(n) || n < k ) {
        if ( isRoad(n) ) links++;
        continue;
      }
      links++;
      segs.push([c, geo.centers[n], map.t[k] === "b" || map.t[n] === "b"]);
    }
    if ( !links ) segs.push([c, c, map.t[k] === "b"]);
  }
  const width = biome.urban ? S * 0.78 : S * 0.36;
  const draw = (w, colorFor) => {
    ctx.lineCap = "round";
    for ( const [a, b, bridge] of segs ) {
      ctx.strokeStyle = colorFor(bridge);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x + (a === b ? 0.1 : 0), b.y);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  };
  draw(width + (S * 0.06), bridge => (bridge ? "#5a3a22" : rgba(shade(biome.road, -0.35), 0.55)));
  draw(width, bridge => (bridge ? "#a8784a" : biome.road));
  if ( biome.urban ) {
    ctx.setLineDash([S * 0.12, S * 0.12]);
    draw(S * 0.03, () => rgba("#ffffff", 0.55));
    ctx.setLineDash([]);
  } else {
    draw(width * 0.35, bridge => (bridge ? rgba("#ffffff", 0.08) : rgba(shade(biome.road, 0.25), 0.6)));
  }
}

/* ------------------------------------------------------------------ */
/* Top-down (scene background)                                        */
/* ------------------------------------------------------------------ */

/**
 * ctx: 2D context of a canvas of width × height.
 * view: { ox, oy, scale } — canvas pixel = (point - o) * scale.
 */
export function renderTopDown(ctx, map, geo, view = {}, options = {}) {
  const biome = biomeOf(map);
  const S = geo.size;
  const lift = S * (options.lift ?? map.lift ?? 0.15);
  const { ox = 0, oy = 0, scale = 1 } = view;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const N = map.cols * map.rows;
  const edges = edgesOf(geo);
  const rng = makeRng(`${map.seed}|paint`);

  /* void */
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, biome.sky[0]);
  sky.addColorStop(1, biome.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  if ( rgb(biome.sky[0]).reduce((a, v) => a + v, 0) < 200 ) {
    /* dark sky: stars */
    for ( let i = 0; i < (W * H) / 9000; i++ ) {
      ctx.fillStyle = rgba("#ffffff", 0.2 + (rng() * 0.6));
      ctx.fillRect(rng() * W, rng() * H, 1.4, 1.4);
    }
  }
  ctx.setTransform(scale, 0, 0, scale, -ox * scale, -oy * scale);

  /* soft shadow of the whole island */
  ctx.save();
  ctx.fillStyle = rgba("#000000", 0.18);
  ctx.filter = typeof ctx.filter === "string" ? `blur(${Math.round(S * 0.25 * scale)}px)` : "none";
  ctx.beginPath();
  for ( let k = 0; k < N; k++ ) {
    geo.verts[k].forEach((v, i) => (i ? ctx.lineTo(v.x + (S * 0.12), v.y + (lift * 2.2)) : ctx.moveTo(v.x + (S * 0.12), v.y + (lift * 2.2))));
    ctx.closePath();
  }
  ctx.fill("nonzero");
  ctx.restore();

  /* A. tops */
  const tops = new Array(N);
  for ( let k = 0; k < N; k++ ) {
    let c = topColor(map, biome, k);
    /* ambient occlusion from higher cells to the north */
    let occ = 0;
    for ( const e of edges[k] ) {
      if ( e.n < 0 || e.ny > 0.1 ) continue;
      occ += Math.max(0, level(map, e.n) - level(map, k));
    }
    if ( occ > 0 ) c = shade(c, -Math.min(0.28, occ * 0.07));
    tops[k] = c;
    pathPoly(ctx, geo.verts[k]);
    ctx.fillStyle = c;
    ctx.fill();
  }
  for ( let k = 0; k < N; k++ ) details(ctx, map, biome, geo, k, makeRng(`${map.seed}|cell|${k}`), S);
  roads(ctx, map, biome, geo, S);
  /* hex rims: light on the upper left, dark on the lower right */
  for ( let k = 0; k < N; k++ ) {
    for ( const e of edges[k] ) {
      const lit = (e.nx * -0.7) + (e.ny * -0.7);
      ctx.strokeStyle = lit > 0 ? rgba("#ffffff", 0.22 * lit) : rgba("#000000", 0.2 * -lit);
      ctx.lineWidth = S * 0.025;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }
    pathPoly(ctx, geo.verts[k]);
    ctx.strokeStyle = rgba("#000000", 0.16);
    ctx.lineWidth = S * 0.012;
    ctx.stroke();
  }

  /* B. walls and objects, back to front */
  const order = [...Array(N).keys()].sort((a, b) => (geo.centers[a].y - geo.centers[b].y) || (geo.centers[a].x - geo.centers[b].x));
  for ( const k of order ) {
    const lv = level(map, k);
    const liquid = LIQ.includes(map.t[k]);
    for ( const e of edges[k] ) {
      if ( e.ny < 0.15 ) continue;
      let wallH;
      let border = false;
      if ( e.n < 0 ) {
        border = true;
        wallH = (lv - BASE_LEVEL) * lift;
      } else {
        const d = lv - level(map, e.n);
        if ( d <= 0 ) continue;
        wallH = d * lift;
      }
      const lightK = e.nx < 0 ? 0.06 : -0.14;
      const quad = [e.a, e.b, { x: e.b.x, y: e.b.y + wallH }, { x: e.a.x, y: e.a.y + wallH }];
      if ( liquid && border ) {
        /* translucent liquid face, then rock below */
        const liqH = 0.6 * lift;
        pathPoly(ctx, [e.a, e.b, { x: e.b.x, y: e.b.y + liqH }, { x: e.a.x, y: e.a.y + liqH }]);
        ctx.fillStyle = rgba(biome.liquidColors[1], 0.75);
        ctx.fill();
        pathPoly(ctx, [{ x: e.a.x, y: e.a.y + liqH }, { x: e.b.x, y: e.b.y + liqH }, quad[2], quad[3]]);
        ctx.fillStyle = shade(biome.side[2], lightK);
        ctx.fill();
        continue;
      }
      if ( liquid ) continue;
      const g = ctx.createLinearGradient(0, Math.min(e.a.y, e.b.y), 0, Math.max(e.a.y, e.b.y) + wallH);
      const grassBand = Math.min(1, (lift * 0.32) / Math.max(1, wallH));
      g.addColorStop(0, shade(biome.side[0], lightK));
      g.addColorStop(grassBand, shade(biome.side[0], lightK - 0.05));
      g.addColorStop(Math.min(1, grassBand + 0.01), shade(biome.side[1], lightK));
      if ( border ) {
        const deep = Math.min(1, ((lv + 0.4) * lift) / Math.max(1, wallH));
        g.addColorStop(Math.max(grassBand + 0.02, Math.min(0.98, deep)), shade(biome.side[1], lightK - 0.05));
        g.addColorStop(Math.min(1, Math.max(grassBand + 0.03, deep + 0.02)), shade(biome.side[2], lightK));
        g.addColorStop(1, shade(biome.side[2], lightK - 0.12));
      } else {
        g.addColorStop(1, shade(biome.side[1], lightK - 0.1));
      }
      pathPoly(ctx, quad);
      ctx.fillStyle = g;
      ctx.fill();
      /* strata */
      ctx.strokeStyle = rgba("#000000", 0.12);
      ctx.lineWidth = S * 0.012;
      for ( let y = lift; y < wallH - 1; y += lift ) {
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y + y);
        ctx.lineTo(e.b.x, e.b.y + y);
        ctx.stroke();
      }
      ctx.strokeStyle = rgba("#000000", 0.28);
      pathPoly(ctx, quad);
      ctx.stroke();
      /* lip highlight */
      ctx.strokeStyle = rgba("#ffffff", 0.25);
      ctx.lineWidth = S * 0.018;
      ctx.beginPath();
      ctx.moveTo(e.a.x, e.a.y);
      ctx.lineTo(e.b.x, e.b.y);
      ctx.stroke();
    }
    const p = map.p[k];
    if ( p && p !== "." ) {
      const c = geo.centers[k];
      drawProp(ctx, p, Number(map.s[k]) || 1, c.x, c.y + (S * 0.04), S * 1.18, biome, makeRng(`${map.seed}|prop|${k}`), tops[k]);
    }
  }

  /* C. optional overlays */
  if ( options.numbers ) {
    ctx.font = `bold ${Math.round(S * 0.16)}px Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for ( let k = 0; k < N; k++ ) {
      if ( LIQ.includes(map.t[k]) ) continue;
      const vs = geo.verts[k];
      const c = geo.centers[k];
      const tl = vs.reduce((a, v) => ((v.x + v.y) < (a.x + a.y) ? v : a), vs[0]);
      const x = c.x + ((tl.x - c.x) * 0.55);
      const y = c.y + ((tl.y - c.y) * 0.55);
      ctx.lineWidth = S * 0.03;
      ctx.strokeStyle = rgba("#000000", 0.55);
      ctx.strokeText(String(map.h[k]), x, y);
      ctx.fillStyle = rgba("#ffffff", 0.9);
      ctx.fillText(String(map.h[k]), x, y);
    }
  }
  if ( options.zones ) drawZoneOverlay(ctx, map, geo, S, options.trueCz);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** Zone fills, outlines and labels (generator preview and briefing). */
export function drawZoneOverlay(ctx, map, geo, S, trueCz = null) {
  const edges = edgesOf(geo);
  for ( const z of map.zones ) {
    const set = new Set(z.cells);
    ctx.fillStyle = rgba(z.color, 0.26);
    for ( const k of z.cells ) {
      pathPoly(ctx, geo.verts[k]);
      ctx.fill();
    }
    ctx.strokeStyle = z.color;
    ctx.lineWidth = S * 0.07;
    ctx.lineCap = "round";
    for ( const k of z.cells ) {
      for ( const e of edges[k] ) {
        if ( e.n >= 0 && set.has(e.n) ) continue;
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.stroke();
      }
    }
    ctx.lineCap = "butt";
  }
  for ( const z of map.zones ) {
    const pos = labelCell(map, geo, z);
    if ( pos < 0 ) continue;
    const c = geo.centers[pos];
    const text = z.label + (trueCz && z.id === trueCz ? " ★" : "");
    ctx.font = `bold ${Math.round(S * 0.3)}px Arial, sans-serif`;
    const w = ctx.measureText(text).width + (S * 0.3);
    ctx.fillStyle = shade(z.color, -0.45);
    ctx.fillRect(c.x - (w / 2), c.y - (S * 0.22), w, S * 0.44);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, c.x, c.y + (S * 0.01));
  }
}

/** The zone cell closest to the zone's centre (label spot). */
export function labelCell(map, geo, z) {
  if ( !z.cells.length ) return -1;
  let x = 0;
  let y = 0;
  for ( const k of z.cells ) {
    x += geo.centers[k].x;
    y += geo.centers[k].y;
  }
  x /= z.cells.length;
  y /= z.cells.length;
  let best = z.cells[0];
  let bd = Infinity;
  for ( const k of z.cells ) {
    const d = Math.hypot(geo.centers[k].x - x, geo.centers[k].y - y);
    if ( d < bd ) {
      bd = d;
      best = k;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Isometric diorama (briefing)                                       */
/* ------------------------------------------------------------------ */

export function renderDiorama(ctx, map, geo, options = {}) {
  const biome = biomeOf(map);
  const S = geo.size;
  const K = 0.66;
  const liftI = S * 0.4 * ((map.lift ?? 0.15) / 0.15);
  const BASE = -2.4;
  const N = map.cols * map.rows;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const edges = edgesOf(geo);
  const proj = (p, lv) => ({ x: p.x, y: (p.y * K) - (lv * liftI) });
  const lvOf = k => (LIQ.includes(map.t[k]) ? -0.3 : map.h[k]);
  /* bounds */
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for ( let k = 0; k < N; k++ ) {
    for ( const v of geo.verts[k] ) {
      const a = proj(v, lvOf(k) + 1.4);
      const b = proj(v, BASE - 0.4);
      x0 = Math.min(x0, a.x);
      x1 = Math.max(x1, a.x);
      y0 = Math.min(y0, a.y);
      y1 = Math.max(y1, b.y);
    }
  }
  const pad = 0.04;
  const sc = Math.min((W * (1 - (2 * pad))) / (x1 - x0), (H * (1 - (2 * pad))) / (y1 - y0));
  const offX = (W - ((x1 - x0) * sc)) / 2;
  const offY = (H - ((y1 - y0) * sc)) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.45, W * 0.1, W / 2, H / 2, W * 0.75);
  g.addColorStop(0, shade(biome.sky[1], 0.05));
  g.addColorStop(1, shade(biome.sky[0], -0.08));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.setTransform(sc, 0, 0, sc, offX - (x0 * sc), offY - (y0 * sc));

  const order = [...Array(N).keys()].sort((a, b) => (geo.centers[a].y - geo.centers[b].y) || (geo.centers[a].x - geo.centers[b].x));
  const zoneOf = new Map();
  if ( options.zones ) for ( const z of map.zones ) for ( const k of z.cells ) if ( !zoneOf.has(k) ) zoneOf.set(k, z);
  for ( const k of order ) {
    const lv = lvOf(k);
    const liquid = LIQ.includes(map.t[k]);
    for ( const e of edges[k] ) {
      if ( e.ny < 0.15 ) continue;
      if ( e.n >= 0 && lvOf(e.n) >= lv ) continue;
      const bottom = e.n >= 0 ? lvOf(e.n) : BASE;
      const lightK = e.nx < 0 ? 0.05 : -0.16;
      const quad = [proj(e.a, lv), proj(e.b, lv), proj(e.b, bottom), proj(e.a, bottom)];
      if ( liquid ) {
        ctx.fillStyle = rgba(biome.liquidColors[1], 0.7);
        pathPoly(ctx, quad);
        ctx.fill();
        continue;
      }
      const gr = ctx.createLinearGradient(0, quad[0].y, 0, quad[3].y);
      const band = Math.min(0.5, 0.3 / Math.max(0.3, lv - bottom));
      gr.addColorStop(0, shade(biome.side[0], lightK));
      gr.addColorStop(band, shade(biome.side[0], lightK));
      gr.addColorStop(band + 0.001, shade(biome.side[1], lightK));
      gr.addColorStop(1, shade(e.n < 0 ? biome.side[2] : biome.side[1], lightK - 0.1));
      ctx.fillStyle = gr;
      pathPoly(ctx, quad);
      ctx.fill();
      ctx.strokeStyle = rgba("#000000", 0.25);
      ctx.lineWidth = S * 0.012;
      ctx.stroke();
    }
    const topPts = geo.verts[k].map(v => proj(v, lv));
    pathPoly(ctx, topPts);
    const tc = topColor(map, biome, k);
    ctx.fillStyle = map.t[k] === "r" ? mix(tc, biome.road, 0.7) : map.t[k] === "b" ? "#a8784a" : tc;
    ctx.fill();
    const z = zoneOf.get(k);
    if ( z ) {
      pathPoly(ctx, topPts);
      ctx.fillStyle = rgba(z.color, 0.38);
      ctx.fill();
    }
    pathPoly(ctx, topPts);
    ctx.strokeStyle = rgba("#000000", 0.18);
    ctx.lineWidth = S * 0.015;
    ctx.stroke();
    const p = map.p[k];
    if ( p && p !== "." ) {
      const cc = proj(geo.centers[k], lv);
      ctx.save();
      ctx.translate(cc.x, cc.y);
      ctx.scale(0.9, 0.9);
      drawProp(ctx, p, Number(map.s[k]) || 1, 0, 0, S, biome, makeRng(`${map.seed}|prop|${k}`), topColor(map, biome, k));
      ctx.restore();
    }
  }
  if ( options.zones ) {
    for ( const z of map.zones ) {
      const pos = labelCell(map, geo, z);
      if ( pos < 0 ) continue;
      const c = proj(geo.centers[pos], lvOf(pos) + 0.9);
      ctx.font = `bold ${Math.round(S * 0.42)}px Arial, sans-serif`;
      const w = ctx.measureText(z.label).width + (S * 0.36);
      ctx.fillStyle = shade(z.color, -0.45);
      ctx.fillRect(c.x - (w / 2), c.y - (S * 0.3), w, S * 0.6);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = S * 0.04;
      ctx.strokeRect(c.x - (w / 2), c.y - (S * 0.3), w, S * 0.6);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(z.label, c.x, c.y + (S * 0.02));
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export { cellOf };
