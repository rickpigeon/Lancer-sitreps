/**
 * "Encerrar cena": the GM ends the sitrep and takes everybody back to the scene that was active
 * before it (remembered when the sitrep scene was activated), optionally ending its combat.
 */
import { MODULE_ID, MODULE_TITLE } from "./constants.mjs";
import { esc } from "./briefing.mjs";
import { getMap } from "./scene-builder.mjs";

/** preUpdateScene (client that activates): remember which scene was active before a sitrep scene. */
export function onPreUpdateScene(scene, changes) {
  if ( !game.user.isGM || changes?.active !== true || !getMap(scene) ) return;
  const prev = game.scenes.active;
  if ( prev && prev.id !== scene.id ) foundry.utils.setProperty(changes, `flags.${MODULE_ID}.returnTo`, prev.id);
}

export async function closeSitrepScene(scene) {
  if ( !game.user.isGM ) return;
  const remembered = game.scenes.get(scene.getFlag(MODULE_ID, "returnTo") ?? "");
  const others = game.scenes.filter(s => s.id !== scene.id).sort((a, b) => a.name.localeCompare(b.name));
  if ( !others.length ) return ui.notifications.warn(`${MODULE_TITLE}: não há outra cena para onde voltar.`);
  const def = remembered ?? others.find(s => s.active) ?? others[0];
  const combat = game.combats.find(c => c.scene?.id === scene.id);
  const content = `<div class="lsr-close">
    <p>Encerrar <b>${esc(scene.name)}</b> e levar todos de volta para:</p>
    <select name="target">${others.map(s => `<option value="${s.id}"${s.id === def.id ? " selected" : ""}>${esc(s.name)}${remembered?.id === s.id ? " (cena anterior)" : ""}</option>`).join("")}</select>
    ${combat ? `<label class="lsr-check"><input type="checkbox" name="endCombat" checked> Encerrar o combate desta cena</label>` : ""}
    <label class="lsr-check"><input type="checkbox" name="announce" checked> Anunciar no chat</label>
  </div>`;
  const data = await foundry.applications.api.DialogV2.prompt({
    window: { title: "Encerrar sitrep" },
    content,
    ok: {
      label: "Encerrar e voltar", icon: "fa-solid fa-right-from-bracket",
      callback: (event, button) => {
        const f = button.form;
        return { target: f.elements.target.value, endCombat: !!f.elements.endCombat?.checked, announce: !!f.elements.announce?.checked };
      }
    },
    rejectClose: false
  });
  if ( !data ) return;
  const target = game.scenes.get(data.target);
  if ( !target ) return;
  if ( data.endCombat && combat ) await combat.delete();
  if ( data.announce ) {
    await CONFIG.ChatMessage.documentClass.create({ content: `<div class="lsr-chat"><h3>Sitrep encerrado</h3><p>Voltando para <b>${esc(target.name)}</b>.</p></div>`, speaker: { alias: MODULE_TITLE } });
  }
  await target.activate({ pullUsers: true });
  if ( typeof target.pullUsers === "function" ) target.pullUsers();
  foundry.applications.instances.get(`${MODULE_ID}-panel`)?.close();
}
