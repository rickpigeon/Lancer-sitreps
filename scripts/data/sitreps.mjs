/**
 * The six sitreps of the Lancer core book (SECTION 5 // The GM's Toolkit, pp. 267-273),
 * rules summarised in Portuguese, plus the zone layout of each diagram turned into hex rectangles.
 * Layout coordinates are map cells: c = column (0..cols-1), r = row (0..rows-1).
 */
import { PAGES } from "../constants.mjs";

/** Zone kinds (KEY TERMS, p. 267). */
export const ZONE_KINDS = {
  ADZ: { short: "ADZ", label: "Zona de Implantação Aliada", color: "#2f8fe0", hint: "Ponto de partida dos PJs e dos NPCs aliados." },
  EDZ: { short: "EDZ", label: "Zona de Implantação Inimiga", color: "#d02a33", hint: "Ponto de partida dos NPCs hostis." },
  IZ: { short: "IZ", label: "Zona de Ingresso", color: "#ef7d1a", hint: "Onde chegam os reforços hostis." },
  CZ: { short: "CZ", label: "Zona de Controle", color: "#f2c418", hint: "Área que precisa ser defendida ou controlada." },
  EZ: { short: "EZ", label: "Zona de Extração", color: "#2db86e", hint: "Lugar que os PJs precisam alcançar para cumprir certos objetivos." },
  OZ: { short: "OZ", label: "Zona do Objetivo", color: "#a259e0", hint: "Onde fica o Objetivo (objeto ou pessoa que os PJs precisam alcançar)." }
};

export const OBJECTIVE_RULES = "Objetivo: objeto ou pessoa de Tamanho ½–2, com 10 PV por nível de Tamanho, Evasão 10, Defesa-E 10 e sem Blindagem. "
  + "Os inimigos querem o Objetivo e não o danificam de propósito. Quem começa o turno adjacente a ele o leva junto no movimento padrão. "
  + "Se ficar adjacente a personagens de dois lados opostos, ele para e não se move até ficar adjacente a um lado só. Ele nunca se move sozinho.";

export const EXTRACTION_RULES = "Dentro da EZ, um PJ pode extrair como ação livre no fim do turno e sai do campo de batalha. "
  + "Se o Objetivo estiver adjacente a esse PJ e não estiver contestado por ninguém do outro lado, ele também é extraído em segurança.";

export const SITREPS = {
  control: {
    key: "control", name: "Control", pt: "Controle", roll: 1, page: PAGES.control, rounds: 6,
    pitch: "Manter o controle de quatro CZs por seis rodadas (torres de transmissão, baterias, terminais, hangares…).",
    victory: [
      "Vitória dos PJs: maior pontuação no fim da 6ª rodada.",
      "Vitória inimiga: o inimigo tem a maior pontuação no fim da 6ª rodada.",
      "Empate no fim da 6ª rodada: ninguém vence e os dois lados recuam."
    ],
    zones: "Quatro CZs (em geral 4 espaços de lado), uma em cada quadrante, mais ou menos simétricas. Só um lado dentro da CZ = ele controla; dois ou mais lados = contestada.",
    forces: "Inimigos do tamanho de um encontro normal; o mestre pode guardar alguns como Reforços.",
    deployment: "O mestre e um jogador rolam 1d6 cada; quem tirar menos se posiciona primeiro.",
    reinforcements: "Reforços opcionais, na EDZ/IZ.",
    scoring: "No fim de cada rodada, cada lado ganha 1 ponto por CZ que controla; quem controla as quatro ganha +1 ponto extra.",
    scoringMode: "control"
  },
  escort: {
    key: "escort", name: "Escort", pt: "Escolta", roll: 2, page: PAGES.escort, rounds: 8,
    pitch: "Levar o OBJETIVO em segurança até a EZ e sair dali.",
    victory: [
      "Vitória dos PJs: o Objetivo é extraído em segurança.",
      "Vitória inimiga: o Objetivo não foi extraído até o fim da 8ª rodada; PJs ainda em campo são capturados ou massacrados.",
      "Sem vencedor: o Objetivo é destruído."
    ],
    objective: OBJECTIVE_RULES,
    forces: "Cerca do dobro dos inimigos de um encontro normal: metade posicionada e o resto como Reforços.",
    deployment: "Os PJs se posicionam primeiro, escolhendo onde ficam eles e o Objetivo na ADZ; depois o mestre posiciona os inimigos na EDZ.",
    reinforcements: "No início de qualquer rodada, o mestre pode trazer 1 NPC (ou até 4 grunts) em qualquer IZ. Não pode usar a mesma IZ duas vezes seguidas.",
    extraction: EXTRACTION_RULES,
    izRule: { perRound: 1, distinct: true },
    scoringMode: "objective"
  },
  extraction: {
    key: "extraction", name: "Extraction", pt: "Extração", roll: 3, page: PAGES.extraction, rounds: 10,
    pitch: "Atravessar o mapa correndo, pegar o objetivo e trazê-lo de volta em segurança para a extração.",
    victory: [
      "Vitória dos PJs: o Objetivo é extraído em segurança.",
      "Vitória inimiga: o Objetivo não foi extraído até o fim da 10ª rodada; PJs ainda em campo são capturados ou massacrados.",
      "Sem vencedor: o Objetivo é destruído."
    ],
    objective: OBJECTIVE_RULES,
    forces: "Cerca do dobro dos inimigos de um encontro normal. Nenhum começa em campo: todos são Reforços.",
    deployment: "Os PJs se posicionam primeiro na ADZ; depois o mestre coloca o Objetivo na Zona do Objetivo.",
    reinforcements: "No início de qualquer rodada, o mestre pode trazer 2 NPCs (ou até 4 grunts) em duas das IZs. Não pode usar a mesma IZ duas vezes seguidas.",
    extraction: "Dentro da EZ/ADZ, um PJ pode extrair como ação livre no fim do turno. " + EXTRACTION_RULES.split(". ").slice(1).join(". "),
    izRule: { perRound: 2, distinct: true },
    scoringMode: "objective"
  },
  gauntlet: {
    key: "gauntlet", name: "Gauntlet", pt: "Corredor Polonês", roll: 4, page: PAGES.gauntlet, rounds: 8,
    pitch: "Atravessar uma área perigosa, em território hostil, para tomar uma posição.",
    victory: [
      "Vitória dos PJs: no fim da 8ª rodada há mais PJs dentro da CZ do que inimigos (Ultra conta como 4, Elite como 2, Grunt como ¼).",
      "Vitória inimiga: no fim da 8ª rodada há pelo menos tantos inimigos dentro da CZ quanto PJs."
    ],
    zones: "A área em volta da EDZ/CZ é fortificada com cobertura pesada de Tamanho 1–2.",
    forces: "Inimigos do tamanho de um encontro normal, mas metade fica como Reforços.",
    deployment: "O mestre se posiciona primeiro na EDZ; depois os PJs escolhem posições na ADZ.",
    reinforcements: "No fim da 1ª rodada, o mestre traz todos os reforços em qualquer IZ.",
    fortify: true,
    scoringMode: "gauntlet"
  },
  holdout: {
    key: "holdout", name: "Holdout", pt: "Resistência", roll: 5, page: PAGES.holdout, rounds: 6,
    pitch: "Defender uma área contra uma avalanche de inimigos: ganhar tempo para os aliados ou sobreviver.",
    victory: [
      "Vitória dos PJs: no fim da 6ª rodada a pontuação dos PJs é 1 ou mais.",
      "Vitória inimiga: no fim da 6ª rodada a pontuação dos PJs é menor que 1; PJs ainda em campo são capturados ou massacrados."
    ],
    zones: "CZ de cerca de 10 × 5 espaços no meio do mapa (ou onde fizer sentido), cercada de cobertura pesada de Tamanho 1–2.",
    forces: "Cerca do dobro dos inimigos de um encontro normal: metade posicionada e o resto como Reforços.",
    deployment: "Os PJs se posicionam primeiro na ADZ/CZ; depois o mestre posiciona os inimigos na EDZ.",
    reinforcements: "No início de qualquer rodada, o mestre traz até 2 personagens como reforço na IZ.",
    scoring: "Os PJs começam com 4 pontos. No fim da 6ª rodada perdem 1 ponto por inimigo dentro da CZ (pode ficar negativo).",
    fortify: true,
    scoringMode: "holdout"
  },
  recon: {
    key: "recon", name: "Recon", pt: "Reconhecimento", roll: 6, page: PAGES.recon, rounds: 6,
    pitch: "Uma equipe pequena entra em território hostil para identificar alvos ou recuperar informação.",
    victory: [
      "Vitória dos PJs: no fim da 6ª rodada os PJs controlam a CZ Verdadeira.",
      "Vitória inimiga: no fim da 6ª rodada os PJs não controlam a CZ Verdadeira."
    ],
    zones: "Quatro CZs (em geral 4 espaços de lado), uma por quadrante. O mestre escolhe em segredo uma como CZ Verdadeira. "
      + "Dentro de uma CZ, um PJ pode gastar uma ação completa para descobrir se ela é a Verdadeira. "
      + "Só PJs dentro da CZ Verdadeira = eles a controlam; dois ou mais lados = contestada.",
    forces: "Inimigos do tamanho de um encontro normal; o mestre pode guardar alguns como Reforços.",
    deployment: "Os PJs se posicionam primeiro na ADZ; depois o mestre posiciona os inimigos na EDZ.",
    reinforcements: "No início de qualquer rodada, o mestre pode trazer 1 NPC (ou até 4 grunts) na IZ.",
    izRule: { perRound: 1, distinct: false },
    scoringMode: "recon"
  }
};

export const SITREP_ORDER = ["control", "escort", "extraction", "gauntlet", "holdout", "recon"];
export const sitrepByRoll = n => SITREP_ORDER[(Math.max(1, Math.min(6, n)) - 1)];

/* ------------------------------------------------------------------ */
/* Layouts                                                            */
/* ------------------------------------------------------------------ */

const R = (c0, r0, c1, r1) => ({ c0: Math.min(c0, c1), r0: Math.min(r0, r1), c1: Math.max(c0, c1), r1: Math.max(r0, r1) });

function zone(id, kinds, rects, extra = {}) {
  const k = ZONE_KINDS[kinds[0]];
  const label = extra.label ?? kinds.map(x => ZONE_KINDS[x].short).join("/");
  return { id, kinds, label, title: extra.title ?? kinds.map(x => ZONE_KINDS[x].label).join(" / "), color: extra.color ?? k.color, rects, ...extra };
}

/** Four ingress strips (two at the top, two at the bottom) as in the Escort/Extraction/Gauntlet diagrams. */
function fourIngress(C, Rw) {
  const w = Math.max(3, Math.round(C * 0.18));
  const a = Math.round(C * 0.2);
  const b = Math.round(C * 0.68);
  const h = Rw >= 22 ? 1 : 0;
  return [
    zone("iz1", ["IZ"], [R(a, 0, a + w - 1, h)], { label: "IZ 1" }),
    zone("iz2", ["IZ"], [R(b, 0, b + w - 1, h)], { label: "IZ 2" }),
    zone("iz3", ["IZ"], [R(a, Rw - 1 - h, a + w - 1, Rw - 1)], { label: "IZ 3" }),
    zone("iz4", ["IZ"], [R(b, Rw - 1 - h, b + w - 1, Rw - 1)], { label: "IZ 4" })
  ];
}

/** Four 4x4 CZs, one per quadrant, roughly symmetrical (Control / Recon). */
function fourCZ(C, Rw, rng, avoid) {
  const s = Math.min(C, Rw) >= 16 ? 4 : 3;
  const top = 3;
  const halfC = Math.floor(C / 2);
  const halfR = Math.floor(Rw / 2);
  const cMin = 2;
  const cMax = Math.max(cMin, halfC - s - 3);
  const rMax = Math.max(top, halfR - s - 2);
  for ( let tries = 0; tries < 40; tries++ ) {
    const cA = rng.int(cMin, cMax);
    const rA = rng.int(top, rMax);
    const j = () => rng.int(-1, 1);
    const spots = [
      [cA, rA], [C - 1 - cA - (s - 1) + j(), rA + j()],
      [C - 1 - cA - (s - 1) + j(), Rw - 1 - rA - (s - 1) + j()], [cA + j(), Rw - 1 - rA - (s - 1) + j()]
    ].map(([c, r]) => [Math.max(1, Math.min(C - s - 1, c)), Math.max(2, Math.min(Rw - s - 2, r))]);
    const rects = spots.map(([c, r]) => R(c, r, c + s - 1, r + s - 1));
    if ( avoid && rects.some(rc => overlaps(rc, avoid, 1)) ) continue;
    return ["A", "B", "C", "D"].map((L, n) => zone(`cz${L.toLowerCase()}`, ["CZ"], [rects[n]], { label: `CZ ${L}`, title: `Zona de Controle ${L} (Objetivo ${L})`, letter: L }));
  }
  return ["A", "B", "C", "D"].map((L, n) => {
    const c = n === 0 || n === 3 ? 2 : C - s - 2;
    const r = n < 2 ? 3 : Rw - s - 3;
    return zone(`cz${L.toLowerCase()}`, ["CZ"], [R(c, r, c + s - 1, r + s - 1)], { label: `CZ ${L}`, title: `Zona de Controle ${L} (Objetivo ${L})`, letter: L });
  });
}

function overlaps(a, b, pad = 0) {
  return !(a.c1 + pad < b.c0 || b.c1 + pad < a.c0 || a.r1 + pad < b.r0 || b.r1 + pad < a.r0);
}

/**
 * Zones of a sitrep for a map of C columns × Rw rows.
 * Returns [{id, kinds, label, title, color, rects, letter?}].
 */
export function layoutZones(key, C, Rw, rng) {
  const fx = f => Math.round(f * (C - 1));
  const fy = f => Math.round(f * (Rw - 1));
  const sw = C >= 24 ? 2 : 1; // strip width
  switch ( key ) {
    case "control":
      return [
        zone("edz", ["EDZ", "IZ"], [R(1, 0, C - 2, sw - 1)]),
        zone("adz", ["ADZ"], [R(1, Rw - sw, C - 2, Rw - 1)]),
        ...fourCZ(C, Rw, rng)
      ];
    case "escort":
      return [
        zone("adz", ["ADZ"], [R(0, 1, sw - 1, Rw - 2)]),
        zone("ez", ["EZ"], [R(C - sw, 1, C - 1, Rw - 2)]),
        zone("edz", ["EDZ"], [R(fx(0.46), fy(0.24), fx(0.78), fy(0.76))]),
        ...fourIngress(C, Rw)
      ];
    case "extraction":
      return [
        zone("adz", ["ADZ", "EZ"], [R(0, 1, sw - 1, Rw - 2)]),
        zone("oz", ["OZ"], [R(C - sw, 1, C - 1, Rw - 2)]),
        ...fourIngress(C, Rw)
      ];
    case "gauntlet":
      return [
        zone("adz", ["ADZ"], [R(0, 1, sw - 1, Rw - 2)]),
        zone("edz", ["EDZ", "OZ"], [R(fx(0.74), fy(0.22), C - 2, fy(0.78))], { cz: true, label: "EDZ/CZ", title: "Zona de Implantação Inimiga / Zona do Objetivo (CZ)" }),
        ...fourIngress(C, Rw)
      ];
    case "holdout": {
      const t = Rw >= 18 && C >= 24 ? 2 : 1;
      const w = Math.min(10, Math.max(4, Math.round(C * 0.38)));
      const h = Math.min(5, Math.max(3, Math.round(Rw * 0.3)));
      const c0 = Math.floor((C - w) / 2);
      const r0 = Math.floor((Rw - h) / 2);
      return [
        zone("edz", ["EDZ", "IZ"], [
          R(0, 0, C - 1, t - 1), R(0, Rw - t, C - 1, Rw - 1), R(0, t, t - 1, Rw - t - 1), R(C - t, t, C - 1, Rw - t - 1)
        ]),
        zone("adz", ["ADZ", "CZ"], [R(c0, r0, c0 + w - 1, r0 + h - 1)], { cz: true, label: "ADZ/CZ", title: "Zona de Implantação Aliada / Zona de Controle" })
      ];
    }
    case "recon": {
      const edz = R(fx(0.42), fy(0.36), fx(0.58), fy(0.64));
      return [
        zone("iz", ["IZ"], [R(1, 0, C - 2, sw - 1)]),
        zone("adz", ["ADZ", "EZ"], [R(1, Rw - sw, C - 2, Rw - 1)]),
        zone("edz", ["EDZ"], [edz]),
        ...fourCZ(C, Rw, rng, edz)
      ];
    }
    default:
      return [];
  }
}

/** Cells (r, c) covered by a zone, clipped to the map. */
export function rectCells(rects, C, Rw) {
  const out = [];
  const seen = new Set();
  for ( const rc of rects ) {
    for ( let r = Math.max(0, rc.r0); r <= Math.min(Rw - 1, rc.r1); r++ ) {
      for ( let c = Math.max(0, rc.c0); c <= Math.min(C - 1, rc.c1); c++ ) {
        const k = (r * C) + c;
        if ( !seen.has(k) ) {
          seen.add(k);
          out.push(k);
        }
      }
    }
  }
  return out;
}
