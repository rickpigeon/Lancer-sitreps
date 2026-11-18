/** Tiny colour helpers for canvas drawing. */
export function rgb(hex) {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const toHex = ([r, g, b]) => `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export function mix(a, b, t) {
  const A = rgb(a);
  const B = rgb(b);
  return toHex(A.map((v, i) => v + ((B[i] - v) * t)));
}
/** amount > 0 lightens, < 0 darkens */
export function shade(c, amount) {
  return amount >= 0 ? mix(c, "#ffffff", amount) : mix(c, "#000000", -amount);
}
export function rgba(c, a) {
  const [r, g, b] = rgb(c);
  return `rgba(${r},${g},${b},${a})`;
}
