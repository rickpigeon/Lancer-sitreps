/** HTML of the sitrep briefing (journal page and panel). */
import { SITREPS, ZONE_KINDS } from "./data/sitreps.mjs";
import { BIOMES } from "./data/biomes.mjs";
import { ENVIRONMENTS, WORLD_TYPES, NATURAL_FEATURES, ANTHRO_FEATURES } from "./data/worlds.mjs";
import { GROUND, PROPS } from "./data/terrain.mjs";
import { PAGES } from "./constants.mjs";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]);

export function sitrepRulesHTML(key) {
  const s = SITREPS[key];
  if ( !s ) return "";
  const row = (label, text) => (text ? `<p><strong>${label}:</strong> ${esc(text)}</p>` : "");
  return `
    <p class="lsr-pitch"><em>${esc(s.pitch)}</em></p>
    <p><strong>Vitória</strong> (${s.rounds} rodadas):</p>
    <ul>${s.victory.map(v => `<li>${esc(v)}</li>`).join("")}</ul>
    ${row("Zonas", s.zones)}
    ${row("Objetivo", s.objective)}
    ${row("Forças inimigas", s.forces)}
    ${row("Posicionamento", s.deployment)}
    ${row("Reforços", s.reinforcements)}
    ${row("Extração", s.extraction)}
    ${row("Pontuação", s.scoring)}
    <p class="lsr-cite">Lancer, livro básico, p. ${s.page} (sitreps: p. ${PAGES.sitreps}).</p>`;
}

export function worldHTML(world) {
  if ( !world ) return "";
  const parts = [];
  if ( world.type ) parts.push(`<li><strong>Tipo de mundo (d20 = ${world.type}):</strong> ${esc(WORLD_TYPES[world.type - 1]?.text)}</li>`);
  if ( world.natural ) parts.push(`<li><strong>Característica natural (d20 = ${world.natural}):</strong> ${esc(NATURAL_FEATURES[world.natural - 1])}</li>`);
  if ( world.anthro ) parts.push(`<li><strong>Presença humana (d20 = ${world.anthro}):</strong> ${esc(ANTHRO_FEATURES[world.anthro - 1])}</li>`);
  if ( world.env ) {
    const e = ENVIRONMENTS[world.env - 1];
    parts.push(`<li><strong>Ambiente (d20 = ${world.env}): ${esc(e?.name)}.</strong> ${esc(e?.rule)}</li>`);
  }
  if ( !parts.length ) return "";
  return `<h3>Mundo</h3><ul>${parts.join("")}</ul><p class="lsr-cite">Iterative World-Building, pp. ${PAGES.worlds}–279.</p>`;
}

export function legendHTML(map) {
  const biome = BIOMES[map.biome];
  const usedT = new Set(map.t.split(""));
  const usedP = new Set(map.p.split("").filter(x => x !== "."));
  const g = [...usedT].filter(k => GROUND[k]).map(k => {
    let name = GROUND[k].name;
    if ( k === "x" ) name += ` (${biome.hazard.name}, dano ${biome.hazard.damage})`;
    if ( "wW".includes(k) && biome.liquidName ) name += ` (${biome.liquidName})`;
    return `<li><strong>${esc(name)}:</strong> ${esc(GROUND[k].rule)}</li>`;
  });
  const p = [...usedP].filter(k => PROPS[k]).map(k => `<li><strong>${esc(PROPS[k].name)}:</strong> cobertura ${PROPS[k].cover}${PROPS[k].obstruction ? "; obstrução do tamanho indicado (passe o mouse no hex com a ferramenta Inspecionar)" : ""}.</li>`);
  return `<h3>Terreno</h3><ul>${g.join("")}${p.join("")}</ul>
    <p>Números no canto dos hexágonos = elevação em espaços. Subir custa o dobro de movimento (escalar, p. ${PAGES.climbing}); quedas de 3+ espaços causam dano (p. ${PAGES.climbing}).</p>`;
}

export function zonesHTML(map) {
  return `<h3>Zonas</h3><ul>${map.zones.map(z => `<li><span class="lsr-chip" style="background:${esc(z.color)}"></span> <strong>${esc(z.label)}</strong> — ${esc(z.title)}</li>`).join("")}</ul>
    <p class="lsr-cite">${Object.values(ZONE_KINDS).map(k => `${k.short}: ${esc(k.hint)}`).join(" ")}</p>`;
}

export function briefingHTML(map) {
  const s = SITREPS[map.sitrep];
  const biome = BIOMES[map.biome];
  return `<div class="lsr-briefing">
    <h2>${esc(s.pt)} <small>(${esc(s.name)})</small></h2>
    <p><strong>Teatro:</strong> ${esc(biome.name)} · mapa de ${map.cols} × ${map.rows} hexágonos · código ${esc(map.seed)}</p>
    ${sitrepRulesHTML(map.sitrep)}
    ${zonesHTML(map)}
    ${worldHTML(map.world)}
    ${legendHTML(map)}
  </div>`;
}
