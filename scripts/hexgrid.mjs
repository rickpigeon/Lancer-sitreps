/**
 * Hex geometry of a map (cell r, c = grid offset i = r + i0, j = c + j0).
 * In Foundry it asks the real grid model (foundry.grid.HexagonalGrid), so the picture always matches the
 * scene grid. Outside Foundry (tests) it uses the same conventions written out by hand.
 */
const SQRT3 = Math.sqrt(3);

function fallbackGrid({ size, columns, even }) {
  const sizeX = columns ? size * 2 / SQRT3 : size;
  const sizeY = columns ? size : size * 2 / SQRT3;
  const shifted = n => (even ? (n & 1) === 0 : (n & 1) === 1);
  const topLeft = ({ i, j }) => (columns
    ? { x: j * 0.75 * sizeX, y: (i + (shifted(j) ? 0.5 : 0)) * sizeY }
    : { x: (j + (shifted(i) ? 0.5 : 0)) * sizeX, y: i * 0.75 * sizeY });
  return {
    sizeX, sizeY, columns, even, size,
    getTopLeftPoint: topLeft,
    getCenterPoint(o) {
      const p = topLeft(o);
      return { x: p.x + (sizeX / 2), y: p.y + (sizeY / 2) };
    },
    getVertices(o) {
      const c = this.getCenterPoint(o);
      const hx = sizeX / 2;
      const hy = sizeY / 2;
      const pts = columns
        ? [[-hx, 0], [-hx / 2, -hy], [hx / 2, -hy], [hx, 0], [hx / 2, hy], [-hx / 2, hy]]
        : [[0, -hy], [hx, -hy / 2], [hx, hy / 2], [0, hy], [-hx, hy / 2], [-hx, -hy / 2]];
      return pts.map(([dx, dy]) => ({ x: c.x + dx, y: c.y + dy }));
    },
    getOffset({ x, y }) {
      /* nearest centre among a small neighbourhood (good enough for tests) */
      const i0 = Math.floor(y / (columns ? sizeY : 0.75 * sizeY));
      const j0 = Math.floor(x / (columns ? 0.75 * sizeX : sizeX));
      let best = { i: i0, j: j0, d: Infinity };
      for ( let di = -2; di <= 2; di++ ) {
        for ( let dj = -2; dj <= 2; dj++ ) {
          const o = { i: i0 + di, j: j0 + dj };
          const c = this.getCenterPoint(o);
          const d = Math.hypot(c.x - x, c.y - y);
          if ( d < best.d ) best = { ...o, d };
        }
      }
      return { i: best.i, j: best.j };
    }
  };
}

/** Smallest distance between the centre of a hex and the centres around it. */
function gridMeasure(grid) {
  const o = { i: 6, j: 6 };
  const c = grid.getCenterPoint(o);
  let best = Infinity;
  for ( let di = -1; di <= 1; di++ ) {
    for ( let dj = -1; dj <= 1; dj++ ) {
      if ( !di && !dj ) continue;
      const p = grid.getCenterPoint({ i: o.i + di, j: o.j + dj });
      best = Math.min(best, Math.hypot(p.x - c.x, p.y - c.y));
    }
  }
  return Number.isFinite(best) ? best : 0;
}

/** A grid model: the Foundry one when available. */
export function gridModel({ size, columns, even }) {
  const HG = globalThis.foundry?.grid?.HexagonalGrid;
  if ( HG ) {
    try {
      return new HG({ size, columns, even, distance: 1, units: "" });
    } catch ( err ) {
      console.warn("lancer-sitreps | HexagonalGrid indisponível, usando a geometria interna", err);
    }
  }
  return fallbackGrid({ size, columns, even });
}

/**
 * Geometry of a map placed at grid offset (i0, j0).
 * grid: a grid model (scene.grid in Foundry, or gridModel()).
 */
export function makeGeometry(grid, map, i0 = 0, j0 = 0) {
  const { cols, rows } = map;
  const centers = new Array(cols * rows);
  const verts = new Array(cols * rows);
  for ( let r = 0; r < rows; r++ ) {
    for ( let c = 0; c < cols; c++ ) {
      const o = { i: r + i0, j: c + j0 };
      const k = (r * cols) + c;
      const p = grid.getCenterPoint(o);
      centers[k] = { x: p.x, y: p.y };
      verts[k] = grid.getVertices(o).map(v => ({ x: v.x, y: v.y }));
    }
  }
  /* centre-to-centre distance of adjacent hexes, measured (does not rely on what grid.size means) */
  const probe = gridMeasure(grid);
  const size = probe || grid.size || Math.min(grid.sizeX, grid.sizeY);
  /* neighbours: cells whose centre is one grid size away */
  const neighbors = new Array(cols * rows);
  for ( let r = 0; r < rows; r++ ) {
    for ( let c = 0; c < cols; c++ ) {
      const k = (r * cols) + c;
      const out = [];
      for ( let dr = -1; dr <= 1; dr++ ) {
        for ( let dc = -1; dc <= 1; dc++ ) {
          if ( !dr && !dc ) continue;
          const rr = r + dr;
          const cc = c + dc;
          if ( rr < 0 || cc < 0 || rr >= rows || cc >= cols ) continue;
          const kk = (rr * cols) + cc;
          const d = Math.hypot(centers[kk].x - centers[k].x, centers[kk].y - centers[k].y);
          if ( Math.abs(d - size) < size * 0.08 ) out.push(kk);
        }
      }
      neighbors[k] = out;
    }
  }
  /* bounds of the map in canvas pixels */
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for ( const vs of verts ) {
    for ( const v of vs ) {
      x0 = Math.min(x0, v.x);
      y0 = Math.min(y0, v.y);
      x1 = Math.max(x1, v.x);
      y1 = Math.max(y1, v.y);
    }
  }
  return {
    grid, size, i0, j0, cols, rows, centers, verts, neighbors,
    bounds: { x0, y0, x1, y1 },
    /** Map cell index under a canvas point, or -1. */
    cellAt(x, y) {
      const o = grid.getOffset({ x, y });
      const r = o.i - i0;
      const c = o.j - j0;
      if ( r < 0 || c < 0 || r >= rows || c >= cols ) return -1;
      return (r * cols) + c;
    },
    offsetOf(k) {
      return { i: Math.floor(k / cols) + i0, j: (k % cols) + j0 };
    }
  };
}

/** Hex-distance between two cells (BFS on the neighbour graph, capped). */
export function ringsAround(geo, startCells, maxDist) {
  const dist = new Map();
  const queue = [];
  for ( const k of startCells ) {
    dist.set(k, 0);
    queue.push(k);
  }
  for ( let q = 0; q < queue.length; q++ ) {
    const k = queue[q];
    const d = dist.get(k);
    if ( d >= maxDist ) continue;
    for ( const n of geo.neighbors[k] ) {
      if ( dist.has(n) ) continue;
      dist.set(n, d + 1);
      queue.push(n);
    }
  }
  return dist;
}
