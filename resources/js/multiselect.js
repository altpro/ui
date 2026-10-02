// <ui-multiselect>: keeps a .multiselect button showing what is ticked.
// Blade and Vue render the first state; this follows the boxes as they change.
// Each box has a span in the button, in the same order: it unhides the ticked
// ones, sets data-count, and sets :state(overflow) when the ticked items do
// not fit, which shows the count. A CSS counter would need no JS, but WebKit
// miscounts it. A box ticked from code fires no change event: dispatch one.
//
// Form-associated, so `required` and `form` on it work as on a select: an
// empty required multiselect stops the submit with the browser's own "select
// an item" message on the button. The bubble points at the button, not into
// the panel. Firefox draws that bubble over the opening panel and it eats
// clicks until the button blurs, so opening the panel blurs and refocuses it.
// :state(touched):invalid stands in for :user-invalid, which Chrome and Safari
// never match on a custom element and Firefox matches before any input.
// `max` disables the unticked boxes once that many are ticked.
class Multiselect extends HTMLElement {
  static formAssociated = true;
  static observedAttributes = ["required", "max"];
  #internals = this.attachInternals();

  connectedCallback() {
    this.addEventListener("change", this.touch);
    this.addEventListener("invalid", this.touch);
    // toggle does not bubble, so catch it on the way down
    this.addEventListener("toggle", this.dismiss, true);
    // Vue sets hidden itself when v-model changes from code, so watch the spans, not the boxes
    const items = this.querySelector("[popovertarget] > span:last-child");
    this.observers = [new ResizeObserver(this.fit), new MutationObserver(this.fit)];
    this.observers[0].observe(items);
    this.observers[1].observe(items, { subtree: true, attributeFilter: ["hidden"] });
    // a microtask, so Vue has ticked its boxes first (v-model does that after connecting)
    queueMicrotask(this.update);
  }

  disconnectedCallback() {
    this.observers.forEach((o) => o.disconnect());
  }

  attributeChangedCallback() {
    if (this.observers) this.update();
  }

  // the boxes reset after this runs, so update once they have
  formResetCallback() {
    this.#internals.states.delete("touched");
    setTimeout(this.update);
  }

  dismiss = (event) => {
    if (event.newState !== "open" || this.#internals.validity.valid) return;
    const button = this.querySelector("[popovertarget]");
    button.blur();
    button.focus();
  };

  touch = () => {
    this.#internals.states.add("touched");
    this.update();
  };

  update = () => {
    const button = this.querySelector("[popovertarget]");
    const boxes = [...this.querySelectorAll("input[type=checkbox]")];
    const items = button.lastElementChild.children;
    const count = boxes.filter((box) => box.checked).length;
    const max = this.hasAttribute("max") ? +this.getAttribute("max") : Infinity;
    boxes.forEach((box, i) => {
      if (items[i]) items[i].hidden = !box.checked;
      if (max < Infinity) box.disabled = !box.checked && count >= max;
    });
    button.setAttribute("data-count", count);

    const missing = this.hasAttribute("required") && !button.disabled && count === 0;
    const message = missing && Object.assign(document.createElement("select"), { required: true }).validationMessage;
    this.#internals.setValidity({ valueMissing: missing }, message || "", button);
  };

  fit = () => {
    const items = this.querySelector("[popovertarget] > span:last-child");
    this.#internals.states[items.scrollWidth > items.clientWidth ? "add" : "delete"]("overflow");
  };
}

if (!customElements.get("ui-multiselect")) customElements.define("ui-multiselect", Multiselect);
