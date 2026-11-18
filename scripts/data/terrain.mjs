/**
 * Terrain codes of a map cell and their Lancer effect (core book p. 61 movement/obstruction,
 * p. 62 climbing/falling, p. 65 cover; environment rules p. 278).
 */
import { PAGES } from "../constants.mjs";

/** Ground of a cell (cells.t). */
export const GROUND = {
  g: { name: "Terreno aberto", rule: "Sem efeito." },
  r: { name: "Estrada / trilha", rule: "Sem efeito (terreno aberto)." },
  b: { name: "Ponte / passarela", rule: "Sem efeito (terreno aberto sobre o líquido)." },
  f: { name: "Vegetação densa", rule: `Cobertura leve: +1 Dificuldade nos ataques à distância contra quem está nela ou atrás dela (p. ${PAGES.cover}).` },
  d: { name: "Terreno difícil", rule: `Custa 2 espaços de movimento por espaço (p. ${PAGES.movement}).` },
  x: { name: "Terreno perigoso", rule: `Ao entrar pela primeira vez na rodada ou terminar o turno nele: teste de ENGENHARIA ou 5 de dano (1 teste por rodada) (p. ${PAGES.movement}).` },
  w: { name: "Líquido raso", rule: `Terreno difícil (p. ${PAGES.movement}).` },
  W: { name: "Líquido profundo", rule: "Terreno difícil; mechs afundam e andam no fundo, a menos que voem ou tenham Módulo EVA (Mundo Oceânico, p. 278)." },
  l: { name: "Lava / rocha derretida", rule: "Terreno perigoso: ao entrar pela primeira vez no turno ou começar o turno nela, 5 energia AP e 3 Calor (Mundo Derretido, p. 278)." },
  i: { name: "Gelo liso", rule: `Terreno difícil (p. ${PAGES.movement}).` }
};

/** Objects standing on a cell (cells.p) with their size (cells.s). */
export const PROPS = {
  T: { name: "Árvores / vegetação alta", cover: "leve", obstruction: false },
  R: { name: "Rocha", cover: "pesada", obstruction: true },
  B: { name: "Rochedo / mesa", cover: "pesada", obstruction: true },
  H: { name: "Prédio", cover: "pesada", obstruction: true },
  C: { name: "Contêineres", cover: "pesada", obstruction: true },
  K: { name: "Cristal", cover: "pesada", obstruction: true },
  F: { name: "Fortificação / barricada", cover: "pesada", obstruction: true },
  X: { name: "Destroços de mech", cover: "pesada", obstruction: true },
  P: { name: "Tanque / tubulação", cover: "pesada", obstruction: true },
  A: { name: "Torre / antena", cover: "pesada", obstruction: true },
  M: { name: "Monólito", cover: "pesada", obstruction: true },
  S: { name: "Fumaça / vapor", cover: "leve", obstruction: false }
};

export function describeCell(cell, biome) {
  const g = GROUND[cell.t] ?? GROUND.g;
  const lines = [];
  let groundName = g.name;
  if ( cell.t === "x" && biome?.hazard ) groundName = `${g.name} (${biome.hazard.name})`;
  if ( ["w", "W"].includes(cell.t) && biome?.liquidName ) groundName = `${g.name} (${biome.liquidName})`;
  lines.push({ label: "Elevação", value: `${cell.h} ${cell.h === 1 ? "espaço" : "espaços"}` });
  lines.push({ label: "Terreno", value: groundName, rule: g.rule + (cell.t === "x" && biome?.hazard ? ` Dano: ${biome.hazard.damage}.` : "") });
  if ( cell.p && PROPS[cell.p] ) {
    const p = PROPS[cell.p];
    const rule = p.obstruction
      ? `Cobertura ${p.cover} (+${p.cover === "pesada" ? 2 : 1}); obstrução de Tamanho ${cell.s}: bloqueia personagens de Tamanho ${cell.s} ou menor (p. ${PAGES.movement}); dá para escalar (p. ${PAGES.climbing}).`
      : `Cobertura ${p.cover} (+1) (p. ${PAGES.cover}).`;
    lines.push({ label: "Objeto", value: `${p.name}${p.obstruction ? ` · Tamanho ${cell.s}` : ""}`, rule });
  }
  return lines;
}
