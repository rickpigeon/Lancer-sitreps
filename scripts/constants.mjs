/** Shared constants of Lancer-sitreps. */
export const MODULE_ID = "lancer-sitreps";
export const MODULE_TITLE = "Lancer Sitreps";
export const FLAG_MAP = "map";       // scene flag: the generated map (cells, zones, world)
export const FLAG_STATE = "state";   // scene flag: the running sitrep (scores, IZ history, objective HP...)
export const FLAG_ZONE = "zone";     // drawing flag: {id, part}
export const FLAG_MARKER = "marker"; // tile flag: objective marker

/** Lancer core book pages used by the module (printed page = PDF page in the core book PDF). */
export const PAGES = {
  sitreps: 267, control: 268, escort: 269, extraction: 270, gauntlet: 271, holdout: 272, recon: 273,
  worlds: 274, features: 275, anthro: 276, environments: 278,
  movement: 61, climbing: 62, cover: 65
};

export const isGM = () => !!game.user?.isGM;
