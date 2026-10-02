// <ui-multiselect>: keeps the count beside a .multiselect label current.
// Blade and Vue render the first data-count; this updates it as boxes change.
// A CSS counter would need no JS, but WebKit miscounts it.
// A box ticked from code fires no change event: dispatch one.
//
// No client-side `required`: Firefox stops taking clicks in a panel once its
// validation bubble points into it. Validate on the server and show the
// message in a .field, which turns the button red.
class Multiselect extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.update);
    this.closest("form")?.addEventListener("reset", () => setTimeout(this.update));
    // a microtask, so Vue has ticked its boxes first (v-model does that after connecting)
    queueMicrotask(this.update);
  }

  update = () => {
    const count = this.querySelectorAll("input[type=checkbox]:checked").length;
    this.querySelector("[popovertarget] > span")?.setAttribute("data-count", count);
  };
}

if (!customElements.get("ui-multiselect")) customElements.define("ui-multiselect", Multiselect);
