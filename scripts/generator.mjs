/**
 * Map generator (pure): heights, ground, objects, roads and sitrep zones on a hex map.
 * The result is plain data saved in the scene flag; render.mjs draws it.
 */
import { makeRng, makeNoise, clamp } from "./rng.mjs";
import { BIOMES } from "./data/biomes.mjs";
import { layoutZones, rectCells, SITREPS } from "./data/sitreps.mjs";
import { ringsAround } from "./hexgrid.mjs";

export const MAP_VERSION = 1;

export const DEFAULTS = {
  sitrep: "control", biome: "grassland", cols: 30, rows: 20, maxH: 4, relief: 1, cover: 1, water: null,
  roads: true, columns: false, even: false, seed: "ALFA-100", lift: 0.15
};

const PROP_SIZE = {
  T: [1, 1], R: [1, 1], B: [1, 2], H: [1, 3], C: [1, 1], K: [1, 2], F: [1, 2], X: [1, 1], P: [1, 2], A: [2, 3], M: [2, 3], S: [1, 1]
};

/** Height field 0..1 for a shape. */
function heightField(shape, cols, rows, rng, noise) {
  const out = new Float32Array(cols * rows);
  const aspect = cols / rows;
  const f = 2.6;
  const bumps = [];
  if ( shape === "cones" || shape === "crater" || shape === "spires" ) {
    const n = shape === "spires" ? Math.round(cols * rows / 28) : Math.max(2, Math.round(cols * rows / 160));
    for ( let b = 0; b < n; b++ ) bumps.push({ x: rng(), y: rng(), r: shape === "spires" ? rng.range(0.025, 0.05) : rng.range(0.08, 0.18), a: rng.range(0.6, 1) });
  }
  for ( let r = 0; r < rows; r++ ) {
    for ( let c = 0; c < cols; c++ ) {
      const x = c / cols;
      const y = r / rows;
      const n = noise(x * f * aspect, y * f, 4, 0.5);
      let e;
      switch ( shape ) {
        case "terraces": e = Math.pow(n, 1.15); break;
        case "islands": {
          const n2 = noise((x * 4.2 * aspect) + 40, (y * 4.2) + 40, 3, 0.55);
          e = (n * 0.55) + (n2 * 0.6) - 0.05;
          break;
        }
        case "cones": {
          e = n * 0.45;
          for ( const b of bumps ) {
            const d = Math.hypot((x - b.x) * aspect, y - b.y) / b.r;
            if ( d < 1.6 ) e += b.a * Math.max(0, 1 - (d * d / 2.2)) * (d < 0.35 ? 0.6 : 1);
          }
          break;
        }
        case "canyon": {
          const ridge = 1 - Math.abs((2 * noise(x * 2.2 * aspect, y * 2.2, 3, 0.5)) - 1);
          e = ridge > 0.82 ? 0.08 + (n * 0.1) : 0.45 + (n * 0.55);
          break;
        }
        case "spires": {
          e = n * 0.5;
          for ( const b of bumps ) {
            const d = Math.hypot((x - b.x) * aspect, y - b.y) / b.r;
            if ( d < 1 ) e = Math.max(e, 0.55 + (b.a * 0.45));
          }
          break;
        }
        case "dunes": {
          const w = Math.sin(((x * aspect) + (y * 0.6) + (n * 0.6)) * 9);
          e = (0.5 + (0.32 * w)) * 0.7 + (n * 0.3);
          break;
        }
        case "plates": {
          const bx = Math.floor(c / 5);
          const by = Math.floor(r / 4);
          const plate = noise(bx * 0.9, by * 0.9, 1, 0.5);
          e = Math.round(plate * 4) / 4 * 0.85 + (n * 0.15);
          break;
        }
        case "crater": {
          e = 0.35 + (n * 0.4);
          for ( const b of bumps ) {
            const d = Math.hypot((x - b.x) * aspect, y - b.y) / b.r;
            if ( d < 0.8 ) e -= 0.35 * (1 - (d / 0.8));
            else if ( d < 1.2 ) e += 0.3 * (1 - (Math.abs(d - 1) / 0.2));
          }
          break;
        }
        case "flat": e = 0.3 + (n * 0.4); break;
        default: e = n;
      }
      out[(r * cols) + c] = e;
    }
  }
  let min = Infinity;
  let max = -Infinity;
  for ( const v of out ) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }
  const span = Math.max(1e-6, max - min);
  for ( let k = 0; k < out.length; k++ ) out[k] = (out[k] - min) / span;
  return out;
}

const median = arr => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/**
 * Generate a map.
 * geo: geometry from hexgrid.makeGeometry (neighbours are needed for roads and fortifications).
 */
export function generateMap(options, geo) {
  const o = { ...DEFAULTS, ...options };
  const biome = BIOMES[o.biome] ?? BIOMES.grassland;
  const sitrep = SITREPS[o.sitrep] ?? SITREPS.control;
  const cols = clamp(Math.round(o.cols), 10, 60);
  const rows = clamp(Math.round(o.rows), 8, 50);
  const maxH = clamp(Math.round(o.maxH), 1, 8);
  const N = cols * rows;
  const rng = makeRng(`${o.seed}|${o.sitrep}|${o.biome}|${cols}x${rows}`);
  const noise = makeNoise(`${o.seed}|${o.biome}`);
  const noise2 = makeNoise(`${o.seed}|veg`);
  const noise3 = makeNoise(`${o.seed}|rough`);
  const nb = geo.neighbors;

  const h = new Array(N).fill(0);
  const t = new Array(N).fill("g");
  const p = new Array(N).fill("");
  const s = new Array(N).fill(0);

  /* 1. relief and liquid */
  const e = heightField(biome.shape, cols, rows, rng, noise);
  const hasLiquid = biome.liquid !== "none";
  const wl = hasLiquid ? clamp(o.water ?? biome.water, 0, 0.7) : 0;
  const relief = clamp(biome.relief * o.relief * 1.7, 0.15, 2.2);
  for ( let k = 0; k < N; k++ ) {
    if ( hasLiquid && e[k] < wl ) {
      const deep = e[k] < wl * 0.55;
      h[k] = 0;
      t[k] = biome.liquid === "lava" ? "l" : biome.liquid === "ice" ? "i" : (deep ? "W" : "w");
      continue;
    }
    const land = wl < 1 ? (e[k] - wl) / (1 - wl) : e[k];
    h[k] = clamp(Math.round(Math.pow(Math.max(0, land), 1.15) * maxH * relief), 0, maxH);
  }

  /* 2. zones */
  const zones = layoutZones(sitrep.key, cols, rows, rng).map(z => ({ ...z, cells: rectCells(z.rects, cols, rows) }));
  const zoneOf = new Array(N).fill(null);
  for ( const z of zones ) for ( const k of z.cells ) zoneOf[k] ??= z;
  const isDeploy = k => zoneOf[k] && !zoneOf[k].kinds.includes("CZ") && !zoneOf[k].cz;
  for ( const z of zones ) {
    const md = median(z.cells.filter(k => !"wWli".includes(t[k])).map(k => h[k]));
    const deploy = !z.kinds.includes("CZ") && !z.cz;
    for ( const k of z.cells ) {
      if ( "wWli".includes(t[k]) ) t[k] = "g";
      h[k] = deploy ? Math.round((h[k] + md + md) / 3) : Math.round((h[k] + md) / 2);
    }
  }

  /* 3. ground: vegetation, rough, hazards */
  const isLiquid = k => "wWli".includes(t[k]);
  const vegN = new Float32Array(N);
  const roughN = new Float32Array(N);
  for ( let k = 0; k < N; k++ ) {
    const r = Math.floor(k / cols);
    const c = k % cols;
    vegN[k] = noise2((c / cols) * 5 * (cols / rows), (r / rows) * 5, 3, 0.5);
    roughN[k] = noise3((c / cols) * 6 * (cols / rows), (r / rows) * 6, 3, 0.5);
  }
  const quantile = (arr, q) => {
    if ( q <= 0 ) return Infinity;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * (1 - q))))];
  };
  const vegCut = quantile(vegN, biome.foliage * 1.2);
  const roughCut = quantile(roughN, biome.roughness);
  for ( let k = 0; k < N; k++ ) {
    if ( isLiquid(k) ) continue;
    const veg = vegN[k];
    const rough = roughN[k];
    if ( biome.foliage > 0 && veg >= vegCut && !isDeploy(k) ) {
      t[k] = "f";
      if ( rng.chance(0.75) ) {
        p[k] = "T";
        s[k] = 1;
      }
    } else if ( biome.roughness > 0 && rough >= roughCut ) t[k] = "d";
  }
  const hazardClusters = Math.round(N * biome.hazards / 3);
  for ( let n = 0; n < hazardClusters; n++ ) {
    let k = rng.int(0, N - 1);
    const size = rng.int(1, 4);
    for ( let m = 0; m < size; m++ ) {
      if ( !isLiquid(k) && !zoneOf[k] ) {
        t[k] = "x";
        p[k] = biome.props.some(([code]) => code === "S") && rng.chance(0.3) ? "S" : "";
        s[k] = p[k] ? 1 : 0;
      }
      k = rng.pick(nb[k]);
    }
  }

  /* 4. urban street grid */
  if ( biome.urban ) {
    const bw = rng.int(3, 4);
    const bh = rng.int(2, 3);
    const offC = rng.int(0, bw);
    const offR = rng.int(0, bh);
    for ( let k = 0; k < N; k++ ) {
      if ( isLiquid(k) || isDeploy(k) ) continue;
      const r = Math.floor(k / cols);
      const c = k % cols;
      const street = ((c + offC) % (bw + 1) === 0) || ((r + offR) % (bh + 1) === 0);
      if ( street ) {
        t[k] = "r";
        p[k] = "";
        s[k] = 0;
      } else if ( rng.chance(biome.urban * 1.6 * o.cover) && !(zoneOf[k]?.kinds.includes("CZ")) ) {
        p[k] = rng.chance(0.85) ? "H" : rng.pick(["C", "P", "A"]);
        s[k] = p[k] === "H" ? rng.weighted([[1, 3], [2, 4], [3, 2]]) : rng.int(...PROP_SIZE[p[k]]);
      }
    }
  }

  /* 5. scattered cover */
  const coverPool = biome.props.filter(([code]) => code !== "T" && code !== "S");
  const density = 0.1 * o.cover;
  for ( let k = 0; k < N; k++ ) {
    if ( p[k] || isLiquid(k) || isDeploy(k) || t[k] === "r" || t[k] === "x" ) continue;
    const inCZ = zoneOf[k] && (zoneOf[k].kinds.includes("CZ") || zoneOf[k].cz);
    if ( !rng.chance(inCZ ? density * 0.7 : density) ) continue;
    const code = rng.weighted(coverPool.length ? coverPool : [["R", 1]]);
    p[k] = code;
    s[k] = rng.int(...PROP_SIZE[code]);
    /* small clusters of rocks / containers */
    if ( (code === "R" || code === "C" || code === "K") && rng.chance(0.45) ) {
      const n2 = rng.pick(nb[k]);
      if ( n2 !== undefined && !p[n2] && !isLiquid(n2) && !isDeploy(n2) && t[n2] !== "r" ) {
        p[n2] = code;
        s[n2] = 1;
      }
    }
  }

  /* 6. fortifications around the CZ (Gauntlet, Holdout) */
  if ( sitrep.fortify ) {
    const czCells = zones.filter(z => z.cz || z.kinds.includes("CZ")).flatMap(z => z.cells);
    const ring = ringsAround(geo, czCells, 2);
    const inside = new Set(czCells);
    for ( const [k, d] of ring ) {
      if ( inside.has(k) || d < 1 ) continue;
      if ( isLiquid(k) ) {
        t[k] = "g";
        h[k] = Math.max(h[k], 1);
      }
      if ( zoneOf[k] && !zoneOf[k].cz && !zoneOf[k].kinds.includes("CZ") ) continue;
      const chance = d === 1 ? 0.42 : 0.12;
      if ( rng.chance(chance) ) {
        p[k] = "F";
        s[k] = rng.weighted([[1, 3], [2, 2]]);
        if ( t[k] === "x" || t[k] === "f" ) t[k] = "g";
      }
    }
  }

  /* 7. roads between the deployment zone and the goals */
  if ( o.roads && !biome.urban ) {
    const centroid = z => {
      let best = z.cells[0];
      const cr = z.cells.reduce((a, k) => a + Math.floor(k / cols), 0) / z.cells.length;
      const cc = z.cells.reduce((a, k) => a + (k % cols), 0) / z.cells.length;
      let bd = Infinity;
      for ( const k of z.cells ) {
        const d = Math.hypot(Math.floor(k / cols) - cr, (k % cols) - cc);
        if ( d < bd ) {
          bd = d;
          best = k;
        }
      }
      return best;
    };
    const start = zones.find(z => z.kinds.includes("ADZ"));
    const goals = zones.filter(z => z !== start && (z.kinds.some(x => ["CZ", "EDZ", "EZ", "OZ"].includes(x)) || z.cz));
    if ( start ) {
      const from = centroid(start);
      const targets = goals.map(centroid).slice(0, 5);
      for ( const to of targets ) {
        const path = findPath(from, to, k => {
          if ( p[k] && p[k] !== "T" ) return 30;
          return 1 + (isLiquid(k) ? 5 : 0) + (t[k] === "x" ? 6 : 0) + (t[k] === "d" ? 1 : 0) + (t[k] === "r" ? -0.6 : 0);
        }, (a, b) => Math.abs(h[a] - h[b]) * 2.5, nb, geo.centers, N);
        for ( const k of path ) {
          if ( zoneOf[k] && isDeploy(k) ) continue;
          t[k] = isLiquid(k) ? "b" : "r";
          if ( p[k] === "T" || p[k] === "S" ) {
            p[k] = "";
            s[k] = 0;
          }
        }
      }
    }
  }

  /* 8. no objects in deployment zones; the liquid under a bridge stays at h 0 */
  for ( let k = 0; k < N; k++ ) {
    if ( isDeploy(k) && p[k] ) {
      p[k] = "";
      s[k] = 0;
    }
    if ( t[k] === "b" ) h[k] = Math.max(h[k], 0);
  }

  return {
    v: MAP_VERSION, seed: String(o.seed), sitrep: sitrep.key, biome: o.biome, cols, rows, maxH,
    columns: !!o.columns, even: !!o.even, cover: o.cover, relief: o.relief, water: o.water, roads: !!o.roads,
    h, t: t.join(""), p: p.map(x => x || ".").join(""), s: s.join(""),
    zones: zones.map(z => ({ id: z.id, kinds: z.kinds, label: z.label, title: z.title, color: z.color, cells: z.cells, letter: z.letter ?? null, cz: !!z.cz }))
  };
}

/** A* on the neighbour graph. */
function findPath(from, to, stepCost, edgeCost, nb, centers, N) {
  const g = new Float64Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const open = new Set([from]);
  const f = new Float64Array(N).fill(Infinity);
  const n0 = nb[from][0] ?? from;
  const unit = Math.max(1, Math.hypot(centers[n0].x - centers[from].x, centers[n0].y - centers[from].y));
  const dist = (a, b) => Math.hypot(centers[a].x - centers[b].x, centers[a].y - centers[b].y) / unit;
  g[from] = 0;
  f[from] = dist(from, to);
  let guard = 0;
  while ( open.size && guard++ < N * 8 ) {
    let cur = -1;
    let best = Infinity;
    for ( const k of open ) {
      if ( f[k] < best ) {
        best = f[k];
        cur = k;
      }
    }
    if ( cur === to ) break;
    open.delete(cur);
    for ( const n of nb[cur] ) {
      const cand = g[cur] + Math.max(0.2, stepCost(n)) + edgeCost(cur, n);
      if ( cand < g[n] ) {
        g[n] = cand;
        came[n] = cur;
        f[n] = cand + dist(n, to);
        open.add(n);
      }
    }
  }
  const path = [];
  for ( let k = to; k !== -1 && path.length < N; k = came[k] ) {
    path.push(k);
    if ( k === from ) break;
  }
  return path[path.length - 1] === from ? path.reverse() : [];
}

/* ------------------------------------------------------------------ */
/* Cell access helpers                                                */
/* ------------------------------------------------------------------ */

export function cellOf(map, k) {
  return { k, h: map.h[k], t: map.t[k], p: map.p[k] === "." ? "" : map.p[k], s: Number(map.s[k]) || 0 };
}

export function setCell(map, k, data) {
  if ( data.h !== undefined ) map.h[k] = clamp(Math.round(data.h), 0, 9);
  if ( data.t !== undefined ) map.t = map.t.slice(0, k) + data.t + map.t.slice(k + 1);
  if ( data.p !== undefined ) map.p = map.p.slice(0, k) + (data.p || ".") + map.p.slice(k + 1);
  if ( data.s !== undefined ) map.s = map.s.slice(0, k) + String(clamp(data.s, 0, 9)) + map.s.slice(k + 1);
}
