/**
 * Objects standing on a hex, drawn as small extruded models seen from above and slightly south
 * (the same light as the terrain: from the upper left). S = hex size in pixels.
 */
import { mix, rgba, shade } from "./color.mjs";

function shadow(ctx, cx, cy, rx, ry, a = 0.28) {
  ctx.save();
  ctx.fillStyle = `rgba(0,0,0,${a})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function poly(ctx, pts, fill, stroke, lw = 1) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if ( fill ) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if ( stroke ) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
}

/** Box with footprint w × d centred at (cx, cy), height hg: top + front + right side. */
export function box(ctx, cx, cy, w, d, hg, color, opts = {}) {
  const x0 = cx - (w / 2);
  const x1 = cx + (w / 2);
  const y0 = cy - (d / 2);
  const y1 = cy + (d / 2);
  const side = Math.min(w, d) * 0.12;
  const outline = opts.outline ?? rgba("#000000", 0.35);
  shadow(ctx, cx + (w * 0.18) + (hg * 0.15), cy + (d * 0.32), (w * 0.62) + (hg * 0.12), d * 0.42, 0.22);
  /* right side (lit less) */
  poly(ctx, [[x1, y0 - hg], [x1 + side, y0 - hg + side], [x1 + side, y1 + side], [x1, y1]], shade(color, -0.38), outline);
  /* front (south) face */
  poly(ctx, [[x0, y1 - hg], [x1, y1 - hg], [x1, y1], [x0, y1]], opts.front ?? shade(color, -0.22), outline);
  /* top */
  poly(ctx, [[x0, y0 - hg], [x1, y0 - hg], [x1, y1 - hg], [x0, y1 - hg]], opts.top ?? color, outline);
  return { x0, x1, y0, y1, top: y0 - hg, frontTop: y1 - hg };
}

function windows(ctx, x0, x1, top, bottom, rng, lit) {
  const cols = Math.max(1, Math.floor((x1 - x0) / 7));
  const rows = Math.max(1, Math.floor((bottom - top) / 8));
  const ww = (x1 - x0) / ((cols * 2) + 1);
  const wh = (bottom - top) / ((rows * 2) + 1);
  for ( let r = 0; r < rows; r++ ) {
    for ( let c = 0; c < cols; c++ ) {
      ctx.fillStyle = rng() < 0.35 ? lit : "rgba(20,30,45,0.55)";
      ctx.fillRect(x0 + (ww * ((c * 2) + 1)), top + (wh * ((r * 2) + 1)), ww, wh);
    }
  }
}

/* ---------------- vegetation ---------------- */

function tree(ctx, style, x, y, sz, biome, rng) {
  const green = biome.tops[1];
  const dark = shade(green, -0.35);
  const trunk = "#7a4a2a";
  switch ( style ) {
    case "pine": {
      shadow(ctx, x + (sz * 0.25), y + (sz * 0.1), sz * 0.45, sz * 0.18);
      ctx.fillStyle = trunk;
      ctx.fillRect(x - (sz * 0.06), y - (sz * 0.25), sz * 0.12, sz * 0.3);
      const c1 = mix("#2f8f4e", dark, 0.3);
      for ( let i = 0; i < 3; i++ ) {
        const w = sz * (0.5 - (i * 0.12));
        const yb = y - (sz * 0.18) - (i * sz * 0.28);
        poly(ctx, [[x - w, yb], [x + w, yb], [x, yb - (sz * 0.55)]], i === 2 ? shade(c1, 0.15) : c1, rgba("#0b2a14", 0.5));
        poly(ctx, [[x, yb - (sz * 0.55)], [x + w, yb], [x + (w * 0.2), yb]], rgba("#000000", 0.18));
      }
      break;
    }
    case "round":
    case "acacia": {
      const flat = style === "acacia";
      shadow(ctx, x + (sz * 0.3), y + (sz * 0.1), sz * 0.5, sz * 0.2);
      ctx.fillStyle = trunk;
      ctx.fillRect(x - (sz * 0.06), y - (sz * (flat ? 0.55 : 0.4)), sz * 0.12, sz * (flat ? 0.6 : 0.45));
      const c = flat ? mix(green, "#8a9a3a", 0.4) : mix(green, "#3a9a4a", 0.4);
      ctx.fillStyle = shade(c, -0.25);
      ctx.beginPath();
      if ( flat ) ctx.ellipse(x, y - (sz * 0.62), sz * 0.6, sz * 0.2, 0, 0, Math.PI * 2);
      else ctx.arc(x, y - (sz * 0.55), sz * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      if ( flat ) ctx.ellipse(x - (sz * 0.05), y - (sz * 0.68), sz * 0.52, sz * 0.15, 0, 0, Math.PI * 2);
      else ctx.arc(x - (sz * 0.08), y - (sz * 0.62), sz * 0.33, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba("#ffffff", 0.22);
      ctx.beginPath();
      ctx.arc(x - (sz * 0.18), y - (sz * (flat ? 0.72 : 0.75)), sz * 0.12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "palm": {
      shadow(ctx, x + (sz * 0.3), y + (sz * 0.1), sz * 0.5, sz * 0.18);
      ctx.strokeStyle = "#8a6a3a";
      ctx.lineWidth = sz * 0.1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (sz * 0.15), y - (sz * 0.4), x + (sz * 0.05), y - (sz * 0.8));
      ctx.stroke();
      const leaf = mix(green, "#2aa84a", 0.5);
      for ( let i = 0; i < 6; i++ ) {
        const a = (i / 6) * Math.PI * 2;
        const lx = x + (sz * 0.05) + (Math.cos(a) * sz * 0.55);
        const ly = y - (sz * 0.8) + (Math.sin(a) * sz * 0.3);
        ctx.strokeStyle = i % 2 ? leaf : shade(leaf, -0.2);
        ctx.lineWidth = sz * 0.13;
        ctx.beginPath();
        ctx.moveTo(x + (sz * 0.05), y - (sz * 0.8));
        ctx.quadraticCurveTo((lx + x) / 2, y - (sz * 0.95), lx, ly);
        ctx.stroke();
      }
      break;
    }
    case "cactus": {
      shadow(ctx, x + (sz * 0.2), y + (sz * 0.06), sz * 0.3, sz * 0.12);
      const c = "#4f9a4a";
      ctx.lineCap = "round";
      ctx.strokeStyle = shade(c, -0.25);
      ctx.lineWidth = sz * 0.22;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - (sz * 0.75));
      ctx.moveTo(x, y - (sz * 0.35));
      ctx.lineTo(x - (sz * 0.25), y - (sz * 0.4));
      ctx.lineTo(x - (sz * 0.25), y - (sz * 0.6));
      ctx.moveTo(x, y - (sz * 0.45));
      ctx.lineTo(x + (sz * 0.22), y - (sz * 0.5));
      ctx.lineTo(x + (sz * 0.22), y - (sz * 0.68));
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = sz * 0.12;
      ctx.stroke();
      ctx.lineCap = "butt";
      break;
    }
    case "dead": {
      shadow(ctx, x + (sz * 0.2), y + (sz * 0.06), sz * 0.3, sz * 0.12);
      ctx.strokeStyle = "#5a4a3e";
      ctx.lineWidth = sz * 0.09;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - (sz * 0.7));
      ctx.moveTo(x, y - (sz * 0.4));
      ctx.lineTo(x - (sz * 0.28), y - (sz * 0.7));
      ctx.moveTo(x, y - (sz * 0.52));
      ctx.lineTo(x + (sz * 0.26), y - (sz * 0.82));
      ctx.moveTo(x, y - (sz * 0.7));
      ctx.lineTo(x + (sz * 0.1), y - (sz * 0.92));
      ctx.stroke();
      ctx.lineCap = "butt";
      break;
    }
    case "mushroom": {
      shadow(ctx, x + (sz * 0.25), y + (sz * 0.08), sz * 0.45, sz * 0.16);
      ctx.fillStyle = "#efe2d0";
      ctx.fillRect(x - (sz * 0.08), y - (sz * 0.55), sz * 0.16, sz * 0.58);
      const cap = rng() < 0.5 ? mix(biome.tops[0], "#ff6aa6", 0.4) : mix(biome.tops[0], "#a66aff", 0.4);
      ctx.fillStyle = shade(cap, -0.25);
      ctx.beginPath();
      ctx.ellipse(x, y - (sz * 0.55), sz * 0.45, sz * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cap;
      ctx.beginPath();
      ctx.ellipse(x, y - (sz * 0.62), sz * 0.42, sz * 0.24, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = rgba("#ffffff", 0.7);
      for ( let i = 0; i < 3; i++ ) {
        ctx.beginPath();
        ctx.arc(x + ((i - 1) * sz * 0.16), y - (sz * 0.7) + ((i % 2) * sz * 0.05), sz * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "crystal":
    case "ice": {
      crystalShards(ctx, x, y, sz * 0.8, style === "ice" ? "#dff4ff" : mix(biome.tops[2], "#c88aff", 0.35), rng);
      break;
    }
    default:
      break;
  }
}

function crystalShards(ctx, x, y, sz, color, rng) {
  shadow(ctx, x + (sz * 0.25), y + (sz * 0.06), sz * 0.45, sz * 0.15);
  const shards = 3;
  for ( let i = 0; i < shards; i++ ) {
    const dx = (i - 1) * sz * 0.22;
    const hgt = sz * (0.7 + (rng() * 0.6)) * (i === 1 ? 1.25 : 0.85);
    const w = sz * 0.16;
    const bx = x + dx;
    poly(ctx, [[bx - w, y], [bx, y - hgt], [bx, y + (w * 0.4)]], shade(color, 0.15), rgba("#1a1a3a", 0.35));
    poly(ctx, [[bx, y - hgt], [bx + w, y], [bx, y + (w * 0.4)]], shade(color, -0.25), rgba("#1a1a3a", 0.35));
    ctx.strokeStyle = rgba("#ffffff", 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - (w * 0.4), y - (hgt * 0.3));
    ctx.lineTo(bx - (w * 0.1), y - (hgt * 0.8));
    ctx.stroke();
  }
}

/* ---------------- props ---------------- */

/**
 * Draw the object of a cell.
 * code: PROPS key, size: 1..3, (cx, cy): centre of the hex top, S: hex size, top: colour of the hex top.
 */
export function drawProp(ctx, code, size, cx, cy, S, biome, rng, top) {
  const u = S / 100;
  const lift = S * 0.2 * size;
  switch ( code ) {
    case "T": {
      const n = biome.tree === "palm" || biome.tree === "acacia" ? 2 : 3;
      const spots = [[-0.18, -0.1], [0.2, -0.05], [0.0, 0.2], [-0.22, 0.18]].slice(0, n + (rng() < 0.4 ? 1 : 0));
      spots.sort((a, b) => a[1] - b[1]);
      for ( const [dx, dy] of spots ) tree(ctx, biome.tree, cx + (dx * S) + ((rng() - 0.5) * 6 * u), cy + (dy * S), S * (0.32 + (rng() * 0.1)), biome, rng);
      break;
    }
    case "R": {
      const n = 2 + Math.floor(rng() * 2);
      const base = mix(biome.side[1], "#8a8a8a", 0.35);
      for ( let i = 0; i < n; i++ ) {
        const x = cx + ((rng() - 0.5) * S * 0.45);
        const y = cy + ((rng() - 0.3) * S * 0.35);
        const r = S * (0.1 + (rng() * 0.1));
        shadow(ctx, x + (r * 0.5), y + (r * 0.3), r * 1.2, r * 0.6);
        poly(ctx, [[x - r, y], [x - (r * 0.7), y - (r * 0.9)], [x + (r * 0.2), y - (r * 1.2)], [x + r, y - (r * 0.5)], [x + (r * 0.9), y + (r * 0.2)]], shade(base, -0.15), rgba("#000", 0.35));
        poly(ctx, [[x - (r * 0.7), y - (r * 0.9)], [x + (r * 0.2), y - (r * 1.2)], [x + (r * 0.1), y - (r * 0.4)], [x - (r * 0.6), y - (r * 0.3)]], shade(base, 0.18));
      }
      break;
    }
    case "B": {
      const w = S * 0.62;
      const d = S * 0.5;
      const hg = S * 0.22 * size;
      const col = biome.side[1];
      const b = box(ctx, cx, cy + (S * 0.05), w, d, hg, mix(top, col, 0.25), { front: shade(col, -0.05) });
      ctx.strokeStyle = rgba("#000000", 0.18);
      ctx.lineWidth = 1.2 * u;
      for ( let i = 1; i < 3; i++ ) {
        const yy = b.frontTop + ((b.y1 - b.frontTop) * i / 3);
        ctx.beginPath();
        ctx.moveTo(b.x0, yy);
        ctx.lineTo(b.x1, yy);
        ctx.stroke();
      }
      if ( biome.foliage > 0.05 && rng() < 0.5 ) tree(ctx, biome.tree, cx - (S * 0.1), b.top + (d * 0.6), S * 0.22, biome, rng);
      break;
    }
    case "H": {
      const roof = biome.roof[Math.floor(rng() * biome.roof.length)];
      const wall = biome.urban ? mix("#c8ccd2", biome.tops[1], 0.3) : "#efe6d6";
      const w = S * (size >= 2 ? 0.66 : 0.52);
      const d = S * (size >= 2 ? 0.52 : 0.42);
      const hg = S * (0.16 + (0.17 * size));
      const b = box(ctx, cx, cy + (S * 0.06), w, d, hg, biome.urban ? shade(wall, -0.08) : roof, { front: shade(wall, -0.12) });
      windows(ctx, b.x0 + (2 * u), b.x1 - (2 * u), b.frontTop + (3 * u), b.y1 - (4 * u), rng, "#ffe9a6");
      if ( biome.urban ) {
        /* flat roof with units */
        ctx.fillStyle = shade(roof, 0.1);
        ctx.fillRect(b.x0 + (w * 0.12), b.top + (d * 0.15), w * 0.3, d * 0.3);
        ctx.fillStyle = rgba("#000", 0.25);
        ctx.fillRect(b.x0 + (w * 0.55), b.top + (d * 0.45), w * 0.22, d * 0.22);
      } else {
        /* pitched roof */
        const ridge = b.top + (d * 0.5);
        poly(ctx, [[b.x0 - (2 * u), b.top + (d * 1.0)], [b.x0 + (w * 0.1), ridge - (d * 0.35)], [b.x1 - (w * 0.1), ridge - (d * 0.35)], [b.x1 + (2 * u), b.top + d]], shade(roof, -0.1), rgba("#3a1a0a", 0.45));
        poly(ctx, [[b.x0 + (w * 0.1), ridge - (d * 0.35)], [b.x1 - (w * 0.1), ridge - (d * 0.35)], [b.x1 - (w * 0.02), ridge - (d * 0.62)], [b.x0 + (w * 0.02), ridge - (d * 0.62)]], shade(roof, 0.12), rgba("#3a1a0a", 0.45));
        ctx.fillStyle = shade(roof, -0.35);
        ctx.fillRect(b.x1 - (w * 0.3), ridge - (d * 0.95), w * 0.1, d * 0.3);
      }
      break;
    }
    case "C": {
      const colors = ["#d0503a", "#3a7ad0", "#e8b43a", "#4aa86a", "#7a6ad0"];
      const n = 2 + Math.floor(rng() * 2);
      for ( let i = 0; i < n; i++ ) {
        const c = colors[Math.floor(rng() * colors.length)];
        const stack = i === n - 1 && rng() < 0.5 ? 1 : 0;
        const b = box(ctx, cx + ((i - ((n - 1) / 2)) * S * 0.12), cy - (S * 0.12) + (i * S * 0.13) - (stack * S * 0.12), S * 0.5, S * 0.15, S * 0.13, c);
        ctx.strokeStyle = rgba("#000000", 0.25);
        ctx.lineWidth = u;
        for ( let k = 1; k < 6; k++ ) {
          const x = b.x0 + (((b.x1 - b.x0) * k) / 6);
          ctx.beginPath();
          ctx.moveTo(x, b.frontTop);
          ctx.lineTo(x, b.y1);
          ctx.stroke();
        }
      }
      break;
    }
    case "K":
      crystalShards(ctx, cx, cy + (S * 0.15), S * 0.38 * (0.8 + (size * 0.35)), biome.tree === "ice" ? "#e6f6ff" : mix(biome.tops[2], "#b08aff", 0.45), rng);
      break;
    case "F": {
      const concrete = "#b8b4aa";
      const n = size >= 2 ? 3 : 2;
      for ( let i = 0; i < n; i++ ) {
        const x = cx + ((i - ((n - 1) / 2)) * S * 0.22);
        box(ctx, x, cy + (S * 0.1) + ((i % 2) * S * 0.05), S * 0.2, S * 0.14, S * 0.11 * (size + 0.5), concrete, { front: "#9a968c" });
      }
      ctx.fillStyle = "#e8c23a";
      ctx.fillRect(cx - (S * 0.32), cy + (S * 0.06) - (S * 0.11 * (size + 0.5)) + (S * 0.08), S * 0.64, S * 0.025);
      /* sandbags */
      ctx.fillStyle = "#c2a878";
      for ( let i = 0; i < 4; i++ ) {
        ctx.beginPath();
        ctx.ellipse(cx - (S * 0.24) + (i * S * 0.16), cy + (S * 0.3), S * 0.08, S * 0.045, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "X": {
      shadow(ctx, cx + (S * 0.08), cy + (S * 0.1), S * 0.36, S * 0.16, 0.35);
      const metal = "#5a5e66";
      poly(ctx, [[cx - (S * 0.3), cy + (S * 0.1)], [cx - (S * 0.18), cy - (S * 0.16)], [cx + (S * 0.05), cy - (S * 0.22)], [cx + (S * 0.3), cy - (S * 0.05)], [cx + (S * 0.22), cy + (S * 0.15)]], metal, rgba("#000", 0.5));
      poly(ctx, [[cx - (S * 0.12), cy - (S * 0.12)], [cx + (S * 0.08), cy - (S * 0.17)], [cx + (S * 0.12), cy - (S * 0.02)], [cx - (S * 0.08), cy + (S * 0.02)]], "#3a3e46");
      ctx.fillStyle = "#c03a2a";
      ctx.fillRect(cx + (S * 0.1), cy - (S * 0.1), S * 0.1, S * 0.05);
      ctx.strokeStyle = "#2a2a30";
      ctx.lineWidth = 3 * u;
      ctx.beginPath();
      ctx.moveTo(cx - (S * 0.2), cy - (S * 0.05));
      ctx.lineTo(cx - (S * 0.42), cy - (S * 0.28));
      ctx.stroke();
      ctx.fillStyle = rgba("#5a5a5a", 0.35);
      ctx.beginPath();
      ctx.arc(cx + (S * 0.05), cy - (S * 0.35), S * 0.1, 0, Math.PI * 2);
      ctx.arc(cx + (S * 0.12), cy - (S * 0.5), S * 0.08, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "P": {
      const c = "#d8d4ca";
      const x = cx - (S * 0.08);
      const y = cy + (S * 0.1);
      const r = S * (0.15 + (0.04 * size));
      const hg = S * 0.18 * (size + 0.6);
      shadow(ctx, x + (r * 0.6), y + (r * 0.2), r * 1.4, r * 0.55);
      ctx.fillStyle = shade(c, -0.25);
      ctx.fillRect(x - r, y - hg, r * 2, hg);
      ctx.fillStyle = shade(c, -0.05);
      ctx.fillRect(x - r, y - hg, r * 0.9, hg);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI);
      ctx.fillStyle = shade(c, -0.25);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x, y - hg, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.strokeStyle = rgba("#000", 0.35);
      ctx.stroke();
      ctx.strokeStyle = "#8a8a8a";
      ctx.lineWidth = 4 * u;
      ctx.beginPath();
      ctx.moveTo(x + r, y - (hg * 0.4));
      ctx.lineTo(cx + (S * 0.4), y - (hg * 0.4));
      ctx.lineTo(cx + (S * 0.4), y);
      ctx.stroke();
      ctx.fillStyle = "#e8b43a";
      ctx.fillRect(x - r, y - (hg * 0.55), r * 2, S * 0.03);
      break;
    }
    case "A": {
      const hg = S * 0.42 * size;
      shadow(ctx, cx + (S * 0.15), cy + (S * 0.12), S * 0.25, S * 0.1);
      ctx.strokeStyle = "#7a7e86";
      ctx.lineWidth = 2.5 * u;
      ctx.beginPath();
      ctx.moveTo(cx - (S * 0.14), cy + (S * 0.12));
      ctx.lineTo(cx, cy + (S * 0.12) - hg);
      ctx.lineTo(cx + (S * 0.14), cy + (S * 0.12));
      for ( let i = 1; i < 5; i++ ) {
        const yy = cy + (S * 0.12) - ((hg * i) / 5);
        const ww = S * 0.14 * (1 - (i / 5));
        ctx.moveTo(cx - ww, yy);
        ctx.lineTo(cx + ww, yy);
      }
      ctx.stroke();
      ctx.fillStyle = "#ff3a2a";
      ctx.beginPath();
      ctx.arc(cx, cy + (S * 0.12) - hg, 3.5 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#c8ccd4";
      ctx.beginPath();
      ctx.ellipse(cx + (S * 0.05), cy + (S * 0.12) - (hg * 0.7), S * 0.08, S * 0.05, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "M": {
      const hg = S * 0.3 * (size + 0.6);
      const c = biome.key === "monolith" ? "#3a3e4a" : mix(biome.side[2], "#2a2a34", 0.5);
      const b = box(ctx, cx, cy + (S * 0.1), S * 0.3, S * 0.18, hg, shade(c, 0.1), { front: c });
      ctx.fillStyle = rgba("#6ae0ff", 0.85);
      ctx.fillRect(cx - (S * 0.015), b.frontTop + (S * 0.05), S * 0.03, (b.y1 - b.frontTop) * 0.7);
      break;
    }
    case "S": {
      for ( let i = 0; i < 4; i++ ) {
        ctx.fillStyle = rgba(i % 2 ? "#d8d8d8" : "#a8a8a8", 0.32);
        ctx.beginPath();
        ctx.arc(cx + ((rng() - 0.5) * S * 0.3), cy - (S * 0.12 * i), S * (0.14 + (i * 0.05)), 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default:
      break;
  }
  return lift;
}
