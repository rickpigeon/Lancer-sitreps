/** ApplicationV2 that renders a plain HTML string (no Handlebars templates). */
const { ApplicationV2 } = foundry.applications.api;

export class HtmlApp extends ApplicationV2 {
  /** Subclasses return the inner HTML. */
  renderBody(_context) {
    return "";
  }

  async _renderHTML(context, _options) {
    return this.renderBody(context);
  }

  _replaceHTML(result, content, _options) {
    const scroll = content.querySelector("[data-keep-scroll]")?.scrollTop ?? 0;
    content.innerHTML = result;
    const box = content.querySelector("[data-keep-scroll]");
    if ( box ) box.scrollTop = scroll;
  }
}

/** Read named inputs of an element into an object. */
export function readInputs(root) {
  const out = {};
  for ( const el of root.querySelectorAll("[name]") ) {
    const name = el.getAttribute("name");
    if ( el.type === "checkbox" ) out[name] = el.checked;
    else if ( el.type === "number" || el.type === "range" ) out[name] = Number(el.value);
    else out[name] = el.value;
  }
  return out;
}

export const opt = (value, label, selected) => `<option value="${value}"${selected ? " selected" : ""}>${label}</option>`;
