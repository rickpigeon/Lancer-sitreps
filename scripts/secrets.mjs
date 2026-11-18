/**
 * GM-only secrets (the True CZ of Recon). Scene flags reach every client, so secrets live in a
 * journal entry nobody else can see; Foundry never sends it to players.
 */
import { MODULE_ID } from "./constants.mjs";

const NAME = "Lancer Sitreps — segredos do mestre";

function vault() {
  return game.journal?.find(j => j.getFlag(MODULE_ID, "vault")) ?? null;
}

async function ensureVault() {
  const found = vault();
  if ( found ) return found;
  return CONFIG.JournalEntry.documentClass.create({
    name: NAME,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE },
    pages: [{ name: "Leia-me", type: "text", text: { content: "<p>Guardado pelo módulo Lancer Sitreps (CZ Verdadeira do Recon). Não compartilhe.</p>", format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML } }],
    flags: { [MODULE_ID]: { vault: true, secrets: {} } }
  });
}

export function getSecrets(sceneId) {
  if ( !game.user.isGM ) return {};
  return foundry.utils.deepClone(vault()?.getFlag(MODULE_ID, "secrets")?.[sceneId] ?? {});
}

export async function setSecrets(sceneId, data) {
  if ( !game.user.isGM ) return;
  const v = await ensureVault();
  await v.update({ [`flags.${MODULE_ID}.secrets.${sceneId}`]: data });
}
