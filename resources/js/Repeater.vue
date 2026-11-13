<!--
  <Repeater v-model="form.lines" name="lines" item="line" :make="() => ({ product_id: '', qty: 1 })" :errors="form.errors" :disabled="form.processing" v-slot="{ row, index, errors }">
    <Field v-model="row.qty" :name="`lines.${index}.qty`" type="number" :errors="errors" />
  </Repeater>
  Rows are objects, edited in place. Each gets a key held here, outside the data, so `lines.0` is only a position.
  Errors are read from position whenever they change (Inertia replaces form.errors on every response; setError writes into it),
  then belong to the row's key: they move with it and go when it is removed. The slot gets them keyed by the row's current position.
  As in Field, errors can also be a string or an array: the list's own messages, shown under it.
  Row titles are h3 unless heading-level says otherwise.
  Rows reorder by the move buttons or by dragging the grip. The grip is for pointers only (aria-hidden, not focusable):
  the buttons are the way for a keyboard or a screen reader, and WCAG 2.5.7's single-pointer alternative to the drag.
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, toRaw, watch } from "vue";

const model = defineModel({ type: Array, required: true });
const props = defineProps({
  make: { type: Function, required: true },
  name: String,
  item: { type: String, default: "row" },
  headingLevel: { type: Number, default: 3 },
  errors: [String, Array, Object],
  disabled: Boolean,
});

// as Field takes them: a string or an array is the list's own messages, an object is Laravel's errors
const own = computed(() => typeof props.errors === "string" || Array.isArray(props.errors));
const bag = computed(() => (own.value ? {} : props.errors ?? {}));
const messages = computed(() => [...new Set([own.value ? props.errors : (props.name && bag.value[props.name]) ?? []].flat(Infinity))]);

const keys = new WeakMap();
let last = 0;
const keyOf = (row) => keys.get(toRaw(row)) ?? keys.set(toRaw(row), ++last).get(toRaw(row));

// { rowKey: { ".qty": message } }; "" holds an error on the row itself (`lines.0`)
const byKey = ref({});
// deep, so setError (which writes into the same object) is seen too.
// ponytail: an in-place setError or a partial clearErrors after a move maps stale positions; fine while errors come from responses
watch(bag, (errors) => {
  const next = {}, prefix = `${props.name}.`;
  for (const [k, m] of Object.entries(errors)) {
    const [, i, rest] = (k.startsWith(prefix) && k.slice(prefix.length).match(/^(\d+)((?:\..*)?)$/)) || [];
    const row = i && model.value[i];
    if (row) (next[keyOf(row)] ??= {})[rest] = m;
  }
  byKey.value = next;
}, { immediate: true, deep: true });
const rowErrors = (row, i) => Object.fromEntries(Object.entries(byKey.value[keyOf(row)] ?? {}).map(([rest, m]) => [`${props.name}.${i}${rest}`, m]));

const title = (i) => `${props.item[0].toUpperCase()}${props.item.slice(1)} ${i + 1}`;
const list = ref();
const addButton = ref();
const status = ref({ n: 0, text: "" });
const announce = (text) => (status.value = { n: status.value.n + 1, text });
// the wanted button in the row now at `index`, or its other move button when that one is disabled; the add button when no rows are left
const focus = async (index, ...wanted) => {
  await nextTick();
  const row = list.value?.children[index];
  const button = wanted.map((w) => row?.querySelector(`[data-${w}]:enabled`)).find(Boolean);
  (button ?? addButton.value).focus();
};

// model.value still reads the old array until the parent re-renders, so each step works from its own copy
async function add() {
  announce(`${title(model.value.length)} added.`);
  model.value = [...model.value, props.make()];
  await nextTick();
  const row = list.value.lastElementChild;
  (row.querySelector(":scope > :not(header) :is(input, select, textarea):enabled, :scope > :is(input, select, textarea):enabled") ?? row.querySelector("[data-remove]")).focus();
}
function remove(i) {
  delete byKey.value[keyOf(model.value[i])];
  const rows = model.value.filter((_, j) => j !== i);
  model.value = rows;
  announce(`${title(i)} removed.`);
  focus(Math.min(i, rows.length - 1), "remove");
}
function reorder(from, to) {
  const rows = [...model.value];
  rows.splice(to, 0, ...rows.splice(from, 1));
  model.value = rows;
  announce(`${title(from)} moved ${to < from ? "up" : "down"}, now ${props.item} ${to + 1}.`);
}
function move(i, by) {
  reorder(i, i + by);
  focus(i + by, by < 0 ? "up" : "down", by < 0 ? "down" : "up");
}

// Dragging by the grip. Pointer events rather than HTML drag and drop, which phones barely support and which
// fights text selection in the fields. While dragging, the cards move by `translate` only and the data stays put;
// the drop is one reorder, so keys, errors and the announcement work as the buttons' do.
// Positions are read from offsetTop, which neither translate nor scrolling changes.
// The grip captures its pointer, and the moves and the lift are heard on the window, so a drag ends even when the
// capture is lost; events from any other pointer (a second finger) are ignored. A drag is put back when `disabled`
// turns on, when any row is replaced under it (a reload, a splice), when the component goes (a visit away), when the
// window loses focus, and when a mouse moves with its button up (the release went to another window).
let drag = null;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// Whatever scrolls the list, nearest first, then the page. Not the page when the list is in something fixed (a drawer) or
// a modal dialog however the app positions it, where scrolling the page behind moves nothing, nor when the app has locked it (overflow hidden on the
// root, or on the body, whose overflow is the page's while the root's is visible). Script scrolls a locked page all the same.
const scrollersOf = (el) => {
  const found = [], root = getComputedStyle(document.documentElement).overflowY;
  for (let p = el.parentElement; p && p !== document.documentElement && !(p === document.body && root === "visible"); p = p.parentElement) {
    const style = getComputedStyle(p);
    if (/auto|scroll/.test(style.overflowY) && p.scrollHeight > p.clientHeight) found.push(p);
    if (style.position === "fixed" || p.matches(":modal")) return found;
  }
  const page = root === "visible" ? getComputedStyle(document.body).overflowY : root;
  return /hidden|clip/.test(page) ? found : [...found, document.scrollingElement];
};
const ms = (time) => (/ms$/.test(time) ? parseFloat(time) : /s$/.test(time) ? parseFloat(time) * 1000 : NaN);
// off as the buttons are: by `disabled`, or by a disabled fieldset around the list (the grip is a span, which it cannot disable)
const off = () => props.disabled || !!list.value?.closest("fieldset:disabled");
function grab(event, i) {
  if (drag || off() || model.value.length < 2 || event.button !== 0 || !event.isPrimary) return;
  event.preventDefault(); // no text selection, and focus stays where it was
  // first, so a pointer that cannot be captured (a synthetic event in a test) starts no drag rather than half of one
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    return;
  }
  const ol = list.value, items = [...ol.children], first = items[0].offsetTop;
  items.forEach((li) => li.getAnimations().forEach((a) => a.cancel())); // the last drop's glide
  drag = {
    pointer: event.pointerId, rows: model.value.map(toRaw), from: i, to: i, y: event.clientY,
    moved: false, frame: 0, list: ol, items, listTop: ol.getBoundingClientRect().top,
    tops: items.map((li) => li.offsetTop - first), heights: items.map((li) => li.offsetHeight),
    gap: parseFloat(getComputedStyle(ol).rowGap) || 0,
    start: event.clientY - ol.getBoundingClientRect().top,
    scrollers: scrollersOf(ol),
  };
  addEventListener("pointermove", slide, true);
  addEventListener("pointerup", drop, true);
  addEventListener("pointercancel", putBack, true);
  addEventListener("keydown", escape, true);
  addEventListener("blur", putBack);
}
// where the dragged card is drawn, which slot it is over, and the cards between moved aside to show that slot
function layout() {
  const { tops, heights, from, items } = drag, last = items.length - 1;
  const dy = Math.min(Math.max(drag.y - drag.list.getBoundingClientRect().top - drag.start, -tops[from]), tops[last] + heights[last] - heights[from] - tops[from]);
  // it takes a card's place once its leading edge passes that card's middle
  const top = tops[from] + dy, bottom = top + heights[from], middle = (j) => tops[j] + heights[j] / 2;
  let to = from;
  for (let j = from + 1; j <= last && bottom > middle(j); j++) to = j;
  for (let j = from - 1; j >= 0 && top < middle(j); j--) to = j;
  const aside = heights[from] + drag.gap;
  items.forEach((li, j) => {
    li.style.translate = j === from ? `0 ${dy}px` : j > from && j <= to ? `0 ${-aside}px` : j < from && j >= to ? `0 ${aside}px` : "";
  });
  drag.to = to;
}
// Every frame: near the top or bottom of what scrolls (a drawer, then the page once it can go no further), scroll it,
// faster the closer the pointer; and if the list has moved on screen (that, or a wheel), draw the card under the pointer
// again. `instant`, as an app's scroll-smooth would start a new glide each frame. It does not stop at the end of the list:
// a drawer's sticky header can cover the list's start, so only the end of what scrolls is sure to show it.
function frame(now) {
  const { y } = drag, edge = 48;
  // in 60ths of a second since the last frame, so the speed is the same on a 120Hz screen
  const pace = drag.last ? Math.min((now - drag.last) / (1000 / 60), 4) : 1;
  drag.last = now;
  for (const scroller of drag.scrollers) {
    const box = scroller === document.scrollingElement ? { top: 0, bottom: innerHeight } : scroller.getBoundingClientRect();
    // only the part of it on screen: a drawer taller than the viewport has its edge where the pointer can reach
    const top = Math.max(box.top, 0), bottom = Math.min(box.bottom, innerHeight);
    const by = y < top + edge ? y - top - edge : y > bottom - edge ? y - bottom + edge : 0;
    if (!by) break;
    const before = scroller.scrollTop;
    scroller.scrollBy({ top: Math.max(-20, Math.min(20, by / 3)) * pace, behavior: "instant" });
    if (scroller.scrollTop !== before) break;
  }
  const listTop = drag.list.getBoundingClientRect().top;
  if (listTop !== drag.listTop) {
    drag.listTop = listTop;
    layout();
  }
  drag.frame = requestAnimationFrame(frame);
}
function slide(event) {
  if (event.pointerId !== drag?.pointer) return;
  if ((event.pointerType !== "touch" && !(event.buttons & 1)) || off()) return release(false);
  drag.y = event.clientY;
  if (!drag.moved) {
    drag.moved = true;
    drag.list.dataset.sorting = "";
    drag.items[drag.from].dataset.dragging = "";
    drag.frame = requestAnimationFrame(frame);
  }
  layout();
}
const drop = (event) => event.pointerId === drag?.pointer && release(true);
const putBack = (event) => (event.type === "blur" || event.pointerId === drag?.pointer) && release(false);
const escape = (event) => {
  if (event.key !== "Escape" || !drag) return;
  event.preventDefault(); // nor does it close a dialog the list is in
  event.stopPropagation();
  release(false);
};
watch(() => props.disabled, (off) => off && release(false));
const unchanged = (d) => model.value.length === d.rows.length && model.value.every((row, j) => toRaw(row) === d.rows[j]);
// each row's identity, so a splice is seen as well as a new array; edits inside a row are not
watch(() => model.value.map(toRaw), () => drag && !unchanged(drag) && release(false));
onBeforeUnmount(() => release(false));
onDeactivated(() => release(false));
// drop, or put back: every card glides from where it is drawn to where it now sits
async function release(commit) {
  const d = drag;
  if (!d) return;
  drag = null;
  cancelAnimationFrame(d.frame);
  removeEventListener("pointermove", slide, true);
  removeEventListener("pointerup", drop, true);
  removeEventListener("pointercancel", putBack, true);
  removeEventListener("keydown", escape, true);
  removeEventListener("blur", putBack);
  const drawn = d.items.map((li) => li.getBoundingClientRect().top);
  delete d.list.dataset.sorting;
  delete d.items[d.from].dataset.dragging;
  d.items.forEach((li) => (li.style.translate = ""));
  if (commit && d.to !== d.from && !off() && unchanged(d)) {
    // Vue moves a row's element to reorder, and an element that is moved loses focus: give it back, or, as the buttons
    // do, to the row's other move button when its own is now disabled at the top or bottom
    const active = document.activeElement;
    reorder(d.from, d.to);
    await nextTick();
    const back = active?.disabled ? active.closest("header")?.querySelector("[data-up]:enabled, [data-down]:enabled") : active;
    if (back && back !== document.body && back.isConnected && document.activeElement !== back) back.focus({ preventScroll: true });
  }
  if (reduced() || !d.list.isConnected) return;
  const root = getComputedStyle(document.documentElement);
  const duration = ms(root.getPropertyValue("--duration-fast").trim()) || 150, easing = root.getPropertyValue("--ease-smooth").trim() || "ease-out";
  d.items.forEach((li, j) => {
    const by = drawn[j] - li.getBoundingClientRect().top;
    const z = j === d.from ? 1 : 0;
    if (by) li.animate([{ translate: `0 ${by}px`, zIndex: z }, { translate: "0 0", zIndex: z }], { duration, easing });
  });
}
</script>

<template>
  <div class="repeater">
    <ol ref="list">
      <li v-for="(row, i) in model" :key="keyOf(row)" class="card">
        <header>
          <span data-handle aria-hidden="true" :data-disabled="disabled || model.length < 2 || undefined" @pointerdown="grab($event, i)">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>
          </span>
          <component :is="`h${headingLevel}`">{{ title(i) }}</component>
          <div>
            <button type="button" class="btn ghost sm" data-up :aria-label="`Move ${item} ${i + 1} up`" :disabled="disabled || i === 0" @click="move(i, -1)">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
            </button>
            <button type="button" class="btn ghost sm" data-down :aria-label="`Move ${item} ${i + 1} down`" :disabled="disabled || i === model.length - 1" @click="move(i, 1)">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
            </button>
            <button type="button" class="btn ghost danger sm" data-remove :aria-label="`Remove ${item} ${i + 1}`" :disabled="disabled" @click="remove(i)">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </button>
          </div>
        </header>
        <slot :row="row" :index="i" :errors="rowErrors(row, i)" />
      </li>
    </ol>
    <p v-if="messages.length === 1" class="error">{{ messages[0] }}</p>
    <ul v-else-if="messages.length" class="error">
      <li v-for="m in messages" :key="m">{{ m }}</li>
    </ul>
    <button ref="addButton" type="button" class="btn outlined sm" :disabled="disabled" @click="add">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      Add {{ item }}
    </button>
    <div class="sr-only" aria-live="polite"><p :key="status.n">{{ status.text }}</p></div>
  </div>
</template>
