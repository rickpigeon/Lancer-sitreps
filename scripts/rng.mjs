/** Seeded randomness and value noise (pure, no Foundry). */

export function hashString(str) {
  let h = 1779033703 ^ String(str).length;
  for ( let i = 0; i < String(str).length; i++ ) {
    h = Math.imul(h ^ String(str).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 */
export function makeRng(seed) {
  let a = (typeof seed === "number" ? seed : hashString(seed)) >>> 0;
  const rng = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.int = (min, max) => min + Math.floor(rng() * (max - min + 1));
  rng.pick = arr => arr[Math.floor(rng() * arr.length)];
  rng.chance = p => rng() < p;
  rng.range = (min, max) => min + (rng() * (max - min));
  rng.weighted = entries => {
    const total = entries.reduce((s, e) => s + e[1], 0);
    let r = rng() * total;
    for ( const [v, w] of entries ) {
      r -= w;
      if ( r <= 0 ) return v;
    }
    return entries[entries.length - 1][0];
  };
  return rng;
}

export function newSeed() {
  const words = ["ALFA", "BRAVO", "COBALTO", "DELTA", "ECO", "FOXTROT", "GOLFE", "HÉLIO", "ÍNDIGO", "JULIETA", "KILO", "LIMA",
    "MERIDIANO", "NOVEMBRO", "ÓRBITA", "PAPA", "QUASAR", "ROMEU", "SIERRA", "TANGO", "UNIFORME", "VETOR", "WHISKEY", "XENON", "YANKEE", "ZULU"];
  const r = Math.random;
  return `${words[Math.floor(r() * words.length)]}-${String(Math.floor(r() * 900) + 100)}`;
}

/** Smooth 2D value noise with octaves, deterministic per seed. */
export function makeNoise(seed) {
  const base = hashString(`noise:${seed}`);
  const lattice = (x, y) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ base;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = t => t * t * (3 - (2 * t));
  const value = (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const a = lattice(x0, y0);
    const b = lattice(x0 + 1, y0);
    const c = lattice(x0, y0 + 1);
    const d = lattice(x0 + 1, y0 + 1);
    return (a + ((b - a) * fx)) + (((c + ((d - c) * fx)) - (a + ((b - a) * fx))) * fy);
  };
  return (x, y, octaves = 4, persistence = 0.5) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for ( let o = 0; o < octaves; o++ ) {
      sum += value((x * freq) + (o * 17.31), (y * freq) - (o * 9.77)) * amp;
      norm += amp;
      amp *= persistence;
      freq *= 2;
    }
    return sum / norm;
  };
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + ((b - a) * t);
