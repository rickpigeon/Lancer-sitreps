/**
 * Biomes: palette, relief and what grows or stands on the hexes.
 * shape: rolling | terraces | islands | cones | flat | canyon | spires | dunes | plates | crater
 * props: weighted [code, weight] (see terrain.mjs PROPS). tree: style of "T".
 * tops: [low, mid, high, peak] top colours; side: [top band, rock, deep rock]; sky: [top, bottom] of the void.
 */
export const BIOMES = {
  grassland: {
    name: "Pradaria temperada", group: "Temperado", shape: "rolling", relief: 0.55, water: 0.16,
    tops: ["#5fcf74", "#4dbf68", "#7fc96a", "#b6c27a"], side: ["#4f9a3c", "#8a5a3b", "#5e3b2a"], sky: ["#bfe6ff", "#e9f6ff"],
    liquid: "water", liquidName: "água", liquidColors: ["#4fc3e8", "#2f8fd0"],
    road: "#d9b77c", rough: "#8fae5a", hazard: { name: "pântano de turfa em brasa", damage: "queimadura", color: "#b0603a" },
    tree: "round", foliage: 0.16, roughness: 0.05, hazards: 0.01,
    props: [["T", 6], ["R", 2], ["H", 1.5], ["C", 0.6], ["X", 0.4]], roof: ["#e8743b", "#d65a31", "#f09a4a"]
  },
  forest: {
    name: "Floresta de coníferas", group: "Temperado", shape: "rolling", relief: 0.7, water: 0.12,
    tops: ["#47b86a", "#3aa85f", "#5aa266", "#a9b6a2"], side: ["#3d7f3a", "#7a5236", "#523625"], sky: ["#cde9f2", "#eef7f7"],
    liquid: "water", liquidName: "água", liquidColors: ["#58c8e0", "#2c86b8"],
    road: "#c9a774", rough: "#6f9a56", hazard: { name: "incêndio florestal", damage: "queimadura", color: "#c4552d" },
    tree: "pine", foliage: 0.34, roughness: 0.04, hazards: 0.01,
    props: [["T", 10], ["R", 2], ["B", 1], ["H", 0.6], ["X", 0.3]], roof: ["#e46c3a", "#c8553a"]
  },
  jungle: {
    name: "Selva enevoada", group: "Temperado", shape: "rolling", relief: 0.65, water: 0.2,
    tops: ["#33b85e", "#25a352", "#3f9a4f", "#7aa36a"], side: ["#2e7a3a", "#6e4a2c", "#4a3020"], sky: ["#d6efe0", "#f1faf3"],
    liquid: "water", liquidName: "água turva", liquidColors: ["#4bb9a8", "#2a8a86"],
    road: "#b8935e", rough: "#4f8f45", hazard: { name: "flora carnívora", damage: "cinético", color: "#9c3f6e" },
    tree: "palm", foliage: 0.42, roughness: 0.08, hazards: 0.02,
    props: [["T", 12], ["R", 1.5], ["M", 0.5], ["X", 0.3]], roof: ["#d9a441"]
  },
  swamp: {
    name: "Pântano primordial", group: "Temperado", shape: "flat", relief: 0.3, water: 0.32,
    tops: ["#6fae5a", "#5f9e4f", "#7d8f55", "#9a9a6a"], side: ["#56743a", "#5e4a2e", "#3c2e1f"], sky: ["#d9e4cf", "#eef2e6"],
    liquid: "water", liquidName: "lodo", liquidColors: ["#7fa86a", "#4f7a4a"],
    road: "#a68c5e", rough: "#7a8a4a", hazard: { name: "lama fervente", damage: "queimadura", color: "#a0763a" },
    tree: "dead", foliage: 0.22, roughness: 0.18, hazards: 0.04,
    props: [["T", 6], ["R", 1], ["X", 0.6], ["P", 0.4]], roof: ["#8a6a3a"]
  },
  savanna: {
    name: "Savana seca", group: "Temperado", shape: "rolling", relief: 0.45, water: 0.08,
    tops: ["#d8c25a", "#cbb24e", "#c39a4c", "#c98e5a"], side: ["#b0913a", "#a0663a", "#6e432a"], sky: ["#ffe7b8", "#fff5e0"],
    liquid: "water", liquidName: "água", liquidColors: ["#5cc0d8", "#3a8fb8"],
    road: "#e2c48c", rough: "#b49a4a", hazard: { name: "capim em chamas", damage: "queimadura", color: "#d0662e" },
    tree: "acacia", foliage: 0.1, roughness: 0.08, hazards: 0.01,
    props: [["T", 5], ["R", 3], ["B", 1.5], ["H", 0.6], ["X", 0.4]], roof: ["#d4683a"]
  },
  dunes: {
    name: "Mar de dunas", group: "Árido", shape: "dunes", relief: 0.55, water: 0.0,
    tops: ["#f2d68c", "#ecc874", "#e3b45e", "#d79a52"], side: ["#d9b46a", "#c08a4a", "#8a5a33"], sky: ["#ffd9a8", "#fff1d6"],
    liquid: "none", liquidName: "", liquidColors: ["#e0c070", "#c9a35a"],
    road: "#f6e2b0", rough: "#e8c070", hazard: { name: "areia movediça", damage: "cinético", color: "#b8894a" },
    tree: "cactus", foliage: 0.03, roughness: 0.2, hazards: 0.025,
    props: [["B", 2], ["R", 2], ["X", 1.2], ["T", 1], ["H", 0.5], ["M", 0.4]], roof: ["#e0a060", "#f2f0e8"]
  },
  canyon: {
    name: "Cânion de mesas", group: "Árido", shape: "canyon", relief: 0.9, water: 0.06,
    tops: ["#e8a46a", "#d98a52", "#c9733e", "#e2b483"], side: ["#c9743e", "#a3532e", "#7a3a22"], sky: ["#ffcfa8", "#ffeedd"],
    liquid: "water", liquidName: "rio", liquidColors: ["#5cc6d6", "#2f8fb0"],
    road: "#f0cf9a", rough: "#c98a5a", hazard: { name: "desmoronamento", damage: "cinético", color: "#8a4a2a" },
    tree: "cactus", foliage: 0.04, roughness: 0.14, hazards: 0.02,
    props: [["B", 4], ["R", 3], ["T", 1], ["X", 0.5], ["A", 0.3]], roof: ["#f2e2c2"]
  },
  highlands: {
    name: "Planalto de rochas", group: "Temperado", shape: "terraces", relief: 1, water: 0.1,
    tops: ["#76c77a", "#8fbf73", "#a8a890", "#e9eef2"], side: ["#6a9a52", "#857a6e", "#5c544c"], sky: ["#c6e4ff", "#eef6ff"],
    liquid: "water", liquidName: "água", liquidColors: ["#66cfe8", "#3a96c8"],
    road: "#d6c09a", rough: "#9aa080", hazard: { name: "avalanche de pedras", damage: "cinético", color: "#7a6a5a" },
    tree: "pine", foliage: 0.12, roughness: 0.12, hazards: 0.015,
    props: [["R", 4], ["B", 3], ["T", 3], ["A", 0.5], ["H", 0.5]], roof: ["#d9603a"]
  },
  tundra: {
    name: "Tundra congelada", group: "Gelado", shape: "rolling", relief: 0.45, water: 0.12,
    tops: ["#dfeee8", "#c9e0dc", "#b6c9c9", "#f4fbff"], side: ["#a9c4c2", "#6e7f86", "#4a575e"], sky: ["#d6ecff", "#f4faff"],
    liquid: "ice", liquidName: "gelo", liquidColors: ["#b8e6f5", "#86c6e2"],
    road: "#a6a29a", rough: "#a8bcc0", hazard: { name: "fendas de gelo", damage: "cinético", color: "#5f8fa8" },
    tree: "pine", foliage: 0.07, roughness: 0.16, hazards: 0.02,
    props: [["R", 3], ["T", 3], ["B", 1], ["H", 0.8], ["X", 0.5], ["A", 0.4]], roof: ["#d0503a", "#3a6ad0"]
  },
  glacier: {
    name: "Geleira e gelo azul", group: "Gelado", shape: "terraces", relief: 0.8, water: 0.18,
    tops: ["#eef8ff", "#d6ecf8", "#bfe0f2", "#ffffff"], side: ["#a6d6ee", "#6fa6c8", "#3f6f94"], sky: ["#cfe7ff", "#f6fbff"],
    liquid: "water", liquidName: "água gelada", liquidColors: ["#58b8e8", "#1f6fb0"],
    road: "#9fb6c4", rough: "#c4dcea", hazard: { name: "fendas de gelo", damage: "cinético", color: "#4f86b0" },
    tree: "ice", foliage: 0.05, roughness: 0.22, hazards: 0.02,
    props: [["K", 3], ["R", 2], ["B", 1.5], ["X", 0.4], ["A", 0.3]], roof: ["#d0503a"]
  },
  archipelago: {
    name: "Arquipélago", group: "Oceânico", shape: "islands", relief: 0.6, water: 0.5,
    tops: ["#f3e3a6", "#72cf73", "#56b864", "#a7b59a"], side: ["#d8c07a", "#9a6a42", "#6a4630"], sky: ["#bfeaff", "#effaff"],
    liquid: "water", liquidName: "mar", liquidColors: ["#4fd2e8", "#1f86c8"],
    road: "#e8d2a0", rough: "#c9b47a", hazard: { name: "recife cortante", damage: "cinético", color: "#d07a6a" },
    tree: "palm", foliage: 0.2, roughness: 0.05, hazards: 0.01,
    props: [["T", 7], ["R", 2], ["H", 1], ["C", 0.8], ["X", 0.3]], roof: ["#e8743b", "#f2f0e8"]
  },
  volcanic: {
    name: "Campos de lava", group: "Inóspito", shape: "cones", relief: 0.95, water: 0.16,
    tops: ["#4a3f3f", "#5a4a46", "#3e3434", "#6e5a52"], side: ["#3a2e2e", "#2a2222", "#1a1414"], sky: ["#4a1e1a", "#8a3a22"],
    liquid: "lava", liquidName: "lava", liquidColors: ["#ffb02e", "#ff5a1a"],
    road: "#7a6a5e", rough: "#5e4e48", hazard: { name: "fumarola", damage: "queimadura", color: "#e0562a" },
    tree: "dead", foliage: 0.02, roughness: 0.2, hazards: 0.05,
    props: [["R", 4], ["B", 2], ["K", 1], ["X", 0.8], ["S", 1]], roof: ["#8a8a8a"]
  },
  ashland: {
    name: "Terra cinza queimada", group: "Inóspito", shape: "rolling", relief: 0.5, water: 0.06,
    tops: ["#8a8580", "#7a7470", "#6a6460", "#a8a29c"], side: ["#6a6460", "#4e4844", "#34302e"], sky: ["#b8a69a", "#d8ccc2"],
    liquid: "lava", liquidName: "brasas", liquidColors: ["#ff8a3a", "#c83a1a"],
    road: "#a89c90", rough: "#6e6660", hazard: { name: "incêndio sem fim", damage: "queimadura", color: "#e06a2a" },
    tree: "dead", foliage: 0.08, roughness: 0.16, hazards: 0.05,
    props: [["T", 4], ["X", 2], ["H", 1], ["R", 2], ["S", 1]], roof: ["#6a6a6a"]
  },
  irradiated: {
    name: "Ermo irradiado", group: "Inóspito", shape: "crater", relief: 0.5, water: 0.1,
    tops: ["#b9c27a", "#a8b46a", "#8f9a5e", "#c9cfa0"], side: ["#8a9450", "#6a6448", "#463f30"], sky: ["#d9e6a6", "#f2f6da"],
    liquid: "acid", liquidName: "lodo radioativo", liquidColors: ["#b8ff3a", "#6ad02a"],
    road: "#c9c2a0", rough: "#9a9a6a", hazard: { name: "bolsão de radiação", damage: "energia", color: "#9aff3a" },
    tree: "dead", foliage: 0.05, roughness: 0.14, hazards: 0.05,
    props: [["X", 3], ["H", 1.5], ["R", 2], ["P", 1], ["A", 0.5]], roof: ["#8a7a5a"]
  },
  regolith: {
    name: "Regolito lunar", group: "Árido", shape: "crater", relief: 0.55, water: 0.0,
    tops: ["#c9c6c2", "#b6b2ae", "#a29e9a", "#dedad6"], side: ["#9a9692", "#77736f", "#55524f"], sky: ["#0c0f1e", "#22263a"],
    liquid: "none", liquidName: "", liquidColors: ["#8a8682", "#6a6662"],
    road: "#dedad2", rough: "#a8a49e", hazard: { name: "radiação solar direta", damage: "energia", color: "#e8e070" },
    tree: "none", foliage: 0, roughness: 0.18, hazards: 0.015,
    props: [["R", 4], ["B", 2], ["C", 1], ["A", 0.8], ["H", 0.6], ["X", 0.5]], roof: ["#e8e8e8", "#d6a03a"]
  },
  quarry: {
    name: "Mina a céu aberto", group: "Industrial", shape: "terraces", relief: 0.9, water: 0.08,
    tops: ["#c79a6a", "#b78a5c", "#a67a52", "#d8b48a"], side: ["#a8784e", "#86593a", "#5e3c28"], sky: ["#f2d6b8", "#fbefe2"],
    liquid: "water", liquidName: "água de rejeito", liquidColors: ["#6ab8a8", "#3a8a7a"],
    road: "#e2c49a", rough: "#a08060", hazard: { name: "explosivos de mineração", damage: "explosivo", color: "#e0a03a" },
    tree: "none", foliage: 0, roughness: 0.22, hazards: 0.02,
    props: [["C", 3], ["R", 3], ["P", 1.5], ["A", 1], ["X", 0.8], ["H", 1]], roof: ["#f0b43a", "#3a7ad0"]
  },
  toxic: {
    name: "Pântano tóxico", group: "Inóspito", shape: "flat", relief: 0.35, water: 0.28,
    tops: ["#8c7aa6", "#7a6a96", "#6a5a86", "#a69aba"], side: ["#6a5a86", "#4a3e62", "#302842"], sky: ["#c6b8d8", "#e8e0f0"],
    liquid: "acid", liquidName: "ácido", liquidColors: ["#c6ff4a", "#6ac82a"],
    road: "#b8aac8", rough: "#7a6a8a", hazard: { name: "gás corrosivo", damage: "energia", color: "#a6ff3a" },
    tree: "mushroom", foliage: 0.14, roughness: 0.14, hazards: 0.05,
    props: [["T", 5], ["P", 1.5], ["X", 1], ["R", 1], ["S", 1]], roof: ["#5a5a6a"]
  },
  fungal: {
    name: "Floresta fúngica", group: "Exótico", shape: "rolling", relief: 0.6, water: 0.14,
    tops: ["#c47ab0", "#b06aa0", "#9a5a90", "#d8a6c8"], side: ["#9a5a8a", "#6a3e66", "#442844"], sky: ["#f2d0ea", "#fbeef8"],
    liquid: "water", liquidName: "água luminosa", liquidColors: ["#6af0e0", "#2ab8c8"],
    road: "#e8c6dc", rough: "#a0709a", hazard: { name: "esporos", damage: "energia", color: "#e8ff6a" },
    tree: "mushroom", foliage: 0.32, roughness: 0.06, hazards: 0.025,
    props: [["T", 10], ["K", 1], ["R", 1], ["X", 0.3]], roof: ["#7a4a8a"]
  },
  crystal: {
    name: "Campos de cristal", group: "Exótico", shape: "spires", relief: 0.85, water: 0.1,
    tops: ["#a8c8f2", "#94b6ea", "#b2a6ea", "#e6eeff"], side: ["#7a96c8", "#5a6aa6", "#3a4278"], sky: ["#1a1e3a", "#3a3a6a"],
    liquid: "mercury", liquidName: "mercúrio", liquidColors: ["#dfe6f0", "#9aa6b8"],
    road: "#c6d0e8", rough: "#8a9ac0", hazard: { name: "ressonância cristalina", damage: "energia", color: "#e06aff" },
    tree: "crystal", foliage: 0.06, roughness: 0.1, hazards: 0.03,
    props: [["K", 8], ["R", 1], ["M", 1], ["X", 0.3]], roof: ["#e8e8ff"]
  },
  mercury: {
    name: "Ilhas de cádmio e mares de mercúrio", group: "Exótico", shape: "islands", relief: 0.6, water: 0.42,
    tops: ["#b8b0a0", "#a69e90", "#94a0a6", "#d6dce0"], side: ["#8a8478", "#6a645a", "#4a4640"], sky: ["#3a3e4a", "#6a707e"],
    liquid: "mercury", liquidName: "mercúrio", liquidColors: ["#e8eef6", "#9aa8ba"],
    road: "#d0ccc2", rough: "#9a948a", hazard: { name: "vapor de mercúrio", damage: "energia", color: "#c0d0e0" },
    tree: "crystal", foliage: 0.04, roughness: 0.12, hazards: 0.02,
    props: [["R", 3], ["K", 2], ["M", 1], ["A", 0.5], ["X", 0.5]], roof: ["#c0c0c8"]
  },
  monolith: {
    name: "Planos de metal (mundo morto)", group: "Exótico", shape: "plates", relief: 0.9, water: 0.0,
    tops: ["#9aa4b0", "#8a96a4", "#7a8898", "#c0c8d2"], side: ["#6a7684", "#4e5866", "#343c48"], sky: ["#5a4a6a", "#9a8aa6"],
    liquid: "none", liquidName: "", liquidColors: ["#6a7684", "#4e5866"],
    road: "#b6bec8", rough: "#7e8894", hazard: { name: "descarga de energia", damage: "energia", color: "#6ae0ff" },
    tree: "none", foliage: 0, roughness: 0.08, hazards: 0.025,
    props: [["M", 5], ["A", 1], ["R", 1], ["X", 0.5]], roof: ["#9aa4b0"]
  },
  ruins: {
    name: "Ruínas antigas", group: "Urbano", shape: "rolling", relief: 0.45, water: 0.1,
    tops: ["#a6b88a", "#94a87c", "#b0a690", "#c8c2b0"], side: ["#868a6a", "#6e6456", "#4a443c"], sky: ["#d8e2d0", "#f2f4ee"],
    liquid: "water", liquidName: "água parada", liquidColors: ["#6ab8b0", "#3a8a8a"],
    road: "#d0c6ae", rough: "#9a9480", hazard: { name: "estrutura instável", damage: "cinético", color: "#8a7a6a" },
    tree: "round", foliage: 0.14, roughness: 0.2, hazards: 0.02,
    props: [["H", 5], ["R", 2], ["T", 3], ["M", 1], ["X", 1]], roof: ["#9a9488", "#b08a6a"]
  },
  redgiant: {
    name: "Planície sob a gigante vermelha", group: "Árido", shape: "rolling", relief: 0.6, water: 0.04,
    tops: ["#d86a4a", "#c85a3e", "#b04a36", "#e8946a"], side: ["#a84a32", "#7a3224", "#4e2018"], sky: ["#ff8a5a", "#ffd0a0"],
    liquid: "water", liquidName: "salmoura", liquidColors: ["#e8a6a0", "#b8605a"],
    road: "#f0b48a", rough: "#b8604a", hazard: { name: "sol escaldante", damage: "calor", color: "#ffb03a" },
    tree: "cactus", foliage: 0.04, roughness: 0.12, hazards: 0.02,
    props: [["B", 3], ["R", 3], ["M", 1.5], ["X", 0.5]], roof: ["#f2e0c8"]
  },
  urban: {
    name: "Metrofaixa urbana", group: "Urbano", shape: "flat", relief: 0.25, water: 0.06,
    tops: ["#a6aeb8", "#98a0aa", "#8a929c", "#c2c8d0"], side: ["#7a828c", "#5a626c", "#3c424a"], sky: ["#c8d6e8", "#eef2f8"],
    liquid: "water", liquidName: "canal", liquidColors: ["#5ab0d0", "#2a78a8"],
    road: "#5e646c", rough: "#8a8a8a", hazard: { name: "cabos expostos", damage: "energia", color: "#3ad0ff" },
    tree: "round", foliage: 0.05, roughness: 0.08, hazards: 0.015, urban: 0.34,
    props: [["H", 10], ["C", 2], ["T", 1.5], ["A", 0.6], ["X", 0.6]], roof: ["#e8743b", "#3a8ad0", "#e8c23a", "#d8d8d8", "#5ac06a"]
  },
  industrial: {
    name: "Complexo industrial", group: "Industrial", shape: "flat", relief: 0.3, water: 0.08,
    tops: ["#b8b0a2", "#a8a092", "#989082", "#cac4b8"], side: ["#8a8274", "#6a6256", "#4a443a"], sky: ["#d8d0c4", "#f2eee8"],
    liquid: "acid", liquidName: "resíduo químico", liquidColors: ["#d0ff5a", "#7ac83a"],
    road: "#6a6a6a", rough: "#9a9286", hazard: { name: "vazamento químico", damage: "energia", color: "#c6ff3a" },
    tree: "none", foliage: 0, roughness: 0.1, hazards: 0.03, urban: 0.2,
    props: [["P", 5], ["C", 4], ["H", 3], ["A", 1.5], ["X", 0.6]], roof: ["#e8b43a", "#3a7ad0", "#d04a3a"]
  },
  station: {
    name: "Convés de estação orbital", group: "Industrial", shape: "plates", relief: 0.35, water: 0.0,
    tops: ["#c8ced6", "#b6bec8", "#a4aeba", "#e2e6ec"], side: ["#8a94a2", "#5e6878", "#3a4250"], sky: ["#05070f", "#141a2e"],
    liquid: "none", liquidName: "", liquidColors: ["#3a4250", "#2a303c"],
    road: "#6a7280", rough: "#9aa4b0", hazard: { name: "plasma vazando", damage: "energia", color: "#5ae0ff" },
    tree: "none", foliage: 0, roughness: 0.06, hazards: 0.02, urban: 0.12,
    props: [["C", 5], ["P", 3], ["H", 2], ["A", 1], ["X", 0.5]], roof: ["#e8743b", "#3a8ad0"]
  }
};

for ( const [key, biome] of Object.entries(BIOMES) ) biome.key = key;

export const BIOME_ORDER = Object.keys(BIOMES);
export const BIOME_GROUPS = [...new Set(Object.values(BIOMES).map(b => b.group))];
