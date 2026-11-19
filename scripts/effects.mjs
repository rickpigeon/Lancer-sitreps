/**
 * Environment effects on top of the map (every client): particles on one screen-space canvas plus
 * CSS washes (tint, vignette, glare, heat haze), lightning flashes, quake shakes and glitches.
 * Driven by the scene flag `fx` = { on, preset, intensity }; each user can switch them off.
 */
import { MODULE_ID } from "./constants.mjs";
import { FX_PRESETS } from "./data/effects.mjs";

let root = null;
let cv = null;
let ctx = null;
let parts = [];
let preset = null;
let intensity = 1;
let raf = 0;
let last = 0;
let nextFlash = 0;
let nextShake = 0;
let current = "";

const reducedMotion = () => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export function getFx(scene) {
  return scene?.getFlag(MODULE_ID, "fx") ?? null;
}

function build() {
  if ( root?.isConnected ) return;
  root = document.createElement("div");
  root.className = "lsr-fx";
  root.innerHTML = `<div class="lsr-fx-tint"></div><div class="lsr-fx-haze"></div><canvas></canvas><div class="lsr-fx-glare"></div><div class="lsr-fx-vignette"></div><div class="lsr-fx-flash"></div>`;
  const board = document.getElementById("board");
  if ( board?.parentElement ) board.after(root);
  else document.body.prepend(root);
  cv = root.querySelector("canvas");
  ctx = cv.getContext("2d");
  window.addEventListener("resize", resize);
  resize();
}

function resize() {
  if ( !cv ) return;
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
  spawnAll();
}

function spawn(def, anywhere = true) {
  const W = cv.width;
  const H = cv.height;
  return {
    def,
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : -20,
    ph: Math.random() * Math.PI * 2,
    sp: def.speed * (0.7 + (Math.random() * 0.6)),
    sz: def.size * (0.6 + (Math.random() * 0.8)),
    a: def.alpha * (0.5 + (Math.random() * 0.5))
  };
}

function spawnAll() {
  parts = [];
  if ( !preset || !cv ) return;
  const area = (cv.width * cv.height) / 1e6;
  for ( const def of preset.particles ?? [] ) {
    const n = Math.round(def.n * area * intensity);
    for ( let i = 0; i < n; i++ ) parts.push(spawn(def));
  }
}

function drawPart(p, t) {
  const d = p.def;
  const rad = d.angle * Math.PI / 180;
  ctx.globalAlpha = Math.max(0, Math.min(1, p.a));
  switch ( d.kind ) {
    case "flake":
    case "dot":
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "streak":
      ctx.strokeStyle = d.color;
      ctx.lineWidth = d.kind === "streak" && p.sz > 40 ? 1 : 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (Math.cos(rad) * p.sz), p.y - (Math.sin(rad) * p.sz));
      ctx.stroke();
      break;
    case "ember": {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = p.sz * 0.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (Math.cos(rad) * p.sz * 4), p.y - (Math.sin(rad) * p.sz * 4));
      ctx.stroke();
      ctx.fillStyle = "#fff4c8";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = "butt";
      break;
    }
    case "blob": {
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.sz);
      g.addColorStop(0, d.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(p.x - p.sz, p.y - p.sz, p.sz * 2, p.sz * 2);
      break;
    }
    case "spark": {
      ctx.globalAlpha = Math.max(0, p.a * Math.sin((t * 2) + p.ph));
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x - p.sz / 2, p.y);
      ctx.lineTo(p.x + p.sz / 2, p.y);
      ctx.moveTo(p.x, p.y - p.sz / 2);
      ctx.lineTo(p.x, p.y + p.sz / 2);
      ctx.stroke();
      break;
    }
    default: break;
  }
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  if ( !preset || !ctx ) return;
  const dt = Math.min(0.05, (now - (last || now)) / 1000);
  last = now;
  const t = now / 1000;
  const W = cv.width;
  const H = cv.height;
  ctx.clearRect(0, 0, W, H);
  for ( const p of parts ) {
    const d = p.def;
    const rad = d.angle * Math.PI / 180;
    p.x += Math.cos(rad) * p.sp * dt;
    p.y += Math.sin(rad) * p.sp * dt;
    if ( d.wobble ) p.x += Math.sin((t * 1.3) + p.ph) * d.wobble * dt;
    const m = d.kind === "blob" ? p.sz : 80;
    if ( p.x < -m ) p.x = W + m;
    if ( p.x > W + m ) p.x = -m;
    if ( p.y < -m ) p.y = H + m;
    if ( p.y > H + m ) p.y = -m;
    drawPart(p, t);
  }
  ctx.globalAlpha = 1;
  if ( preset.glitch && Math.random() < 0.06 * intensity ) {
    for ( let i = 0; i < 4; i++ ) {
      ctx.fillStyle = `rgba(${Math.random() < 0.5 ? "200,120,255" : "120,255,240"},${0.08 + (Math.random() * 0.12)})`;
      ctx.fillRect(0, Math.random() * H, W, 2 + (Math.random() * 10));
    }
  }
  if ( preset.flicker ) root.querySelector(".lsr-fx-tint").style.opacity = String(0.7 + (Math.random() * 0.3));
  const motion = !reducedMotion();
  if ( preset.flash && motion && now > nextFlash ) {
    if ( nextFlash ) flash(preset.flash.color);
    nextFlash = now + (preset.flash.every * 1000 * (0.5 + Math.random()) / Math.max(0.3, intensity));
  }
  if ( preset.shake && motion && now > nextShake ) {
    if ( nextShake ) shake();
    nextShake = now + (preset.shake.every * 1000 * (0.6 + Math.random()) / Math.max(0.3, intensity));
  }
}

function flash(color) {
  const el = root?.querySelector(".lsr-fx-flash");
  if ( !el ) return;
  el.style.background = color;
  el.classList.remove("on");
  void el.offsetWidth;
  el.classList.add("on");
}

function shake() {
  const board = document.getElementById("board");
  if ( !board ) return;
  board.classList.remove("lsr-shake");
  void board.offsetWidth;
  board.classList.add("lsr-shake");
  setTimeout(() => board.classList.remove("lsr-shake"), 900);
}

export function stopFx() {
  preset = null;
  current = "";
  parts = [];
  cancelAnimationFrame(raf);
  raf = 0;
  if ( root ) root.hidden = true;
}

/** Apply the effect of a scene (or stop). */
export function applyFx(scene = canvas?.scene) {
  const fx = getFx(scene);
  const userOn = game.settings.get(MODULE_ID, "effects");
  const p = fx?.on && userOn ? FX_PRESETS[fx.preset] : null;
  const key = p ? `${scene.id}|${fx.preset}|${fx.intensity}` : "";
  if ( key === current ) return;
  if ( !p ) return stopFx();
  build();
  current = key;
  preset = p;
  intensity = Math.max(0.2, Math.min(2, Number(fx.intensity) || 1));
  root.hidden = false;
  const k = Math.min(1.4, intensity);
  const css = (sel, prop, v) => {
    const el = root.querySelector(sel);
    if ( el ) el.style[prop] = v;
  };
  css(".lsr-fx-tint", "background", p.tint ?? "transparent");
  css(".lsr-fx-tint", "opacity", String(k));
  css(".lsr-fx-vignette", "background", p.vignette ? `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, ${p.vignette} 100%)` : "none");
  css(".lsr-fx-vignette", "opacity", String(k));
  css(".lsr-fx-glare", "background", p.glare ? `radial-gradient(circle at 88% 6%, ${p.glare} 0%, rgba(255,255,255,0) 45%)` : "none");
  root.querySelector(".lsr-fx-haze")?.classList.toggle("on", !!p.haze && !reducedMotion());
  nextFlash = 0;
  nextShake = 0;
  spawnAll();
  if ( !raf ) raf = requestAnimationFrame(frame);
}
