<!--
  <Combobox v-model="status" name="status" label="Status" :options="statuses" />
  <Combobox v-model="tags" name="tags" label="Tags" :options="tags" multiple :max="3" />
  <Combobox v-model="customerId" name="customer_id" label="Customer" src="/customers/search" :options="[{ value: 42, label: 'Acme Ltd' }]" />
  One trigger styled like .input, showing the value, that opens a popover. The semantics follow the mode:
  - single, no search: the trigger is a select-only combobox (WAI-ARIA APG) and keeps focus; arrows move
    aria-activedescendant through the listbox, Enter or Space picks, typing jumps to a label.
  - with search (searchable, over 12 options, src or create): the trigger is a combobox whose popup is a
    dialog; in it the search box is the combobox for the listbox, with aria-activedescendant.
  - multiple without search: a dialog of checkboxes, as multiselect was.
  The value is submitted by a hidden <select>, so a native form reset and Inertia's reset() put it back as
  they would a select: its options' defaultSelected hold the starting value.
  `src` is a URL (GET src?q=…, answering [{ value, label }]) or (q) => Promise<[{ value, label }]>.
  `create` is a URL (POST { label }, answering { value, label }; a 422 shows its error) or (label) => Promise<{ value, label }>.
  `options` seeds the labels of selected values, so with `src` pass the selected records there.
  aria-* attributes go on the trigger, everything else on the wrapper.
-->
<script setup>
import { computed, nextTick, onMounted, reactive, ref, useAttrs, useId, watch } from "vue";
import { useDomModel } from "./domModel.js";

const model = defineModel();
const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  name: String,
  form: String,
  multiple: Boolean,
  searchable: { type: Boolean, default: undefined },
  src: [String, Function],
  create: [String, Function],
  max: Number,
  required: Boolean,
  disabled: Boolean,
  autofocus: Boolean,
});
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const split = (aria) => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-") === aria));

const id = useId();
const root = ref(), trigger = ref(), pop = ref(), input = ref(), hidden = ref();
const search = computed(() => !!(props.src || props.create) || (props.searchable ?? props.options.length > 12));
const selectOnly = computed(() => !props.multiple && !search.value);
const checkboxes = computed(() => props.multiple && !search.value);

// what is selected, as strings, and the labels of everything ever selected or offered
const keys = computed(() => [model.value ?? []].flat().filter((v) => v != null && v !== "").map(String));
const labels = reactive(new Map());
watch(() => props.options, (list) => list.forEach((o) => labels.set(String(o.value), o)), { immediate: true });
const selected = computed(() => keys.value.map((k) => labels.get(k) ?? { value: k, label: k }));
const has = (o) => keys.value.includes(String(o.value));
const capped = (o) => props.multiple && keys.value.length >= props.max && !has(o);

const open = ref(false), q = ref(""), active = ref(-1);
const remote = ref([]), loading = ref(false), creating = ref(false), error = ref("");
const list = computed(() => {
  const found = props.src ? remote.value : props.options.filter((o) => o.label.toLowerCase().includes(q.value.trim().toLowerCase()));
  if (!props.multiple || q.value) return found;
  // nothing typed: what is selected but not in the results comes first, so it can be unticked
  const shown = new Set(found.map((o) => String(o.value)));
  return [...selected.value.filter((o) => !shown.has(String(o.value))), ...found];
});
const canCreate = computed(() => {
  const label = q.value.trim().toLowerCase();
  return !!props.create && !!label && !loading.value && !list.value.some((o) => o.label.toLowerCase() === label);
});
const count = computed(() => list.value.length + (canCreate.value ? 1 : 0));
const status = computed(() => error.value || (creating.value ? "Adding…" : loading.value ? "Searching…" : search.value && !count.value ? "No results" : ""));
const optionId = (i) => `${id}-${i}`;
const activeId = computed(() => (open.value && active.value >= 0 && active.value < count.value ? optionId(active.value) : null));

// The hidden select. The template binds `selected` to the starting values only: Vue writes that as the
// attribute too, which is what a reset goes back to. What is selected now is written here, as the property.
const initial = keys.value;
const submitted = computed(() => [...new Set([...initial, ...keys.value])]);
const domKeys = () => [...hidden.value.selectedOptions].map((o) => o.value).filter(Boolean).join("\n");
let written;
onMounted(() => (written = domKeys()));
watch(() => keys.value.join("\n"), () => {
  for (const o of hidden.value.options) o.selected = o.value ? keys.value.includes(o.value) : !keys.value.length;
  written = domKeys();
  // a real change event, so Inertia's <Form> sees the field change (isDirty) and @change on the wrapper fires
  hidden.value.dispatchEvent(new Event("change", { bubbles: true }));
}, { flush: "post" });
// read the select only when something else wrote to it: a reset
useDomModel(model, root, () => {
  if (domKeys() === written) return model.value;
  const values = domKeys().split("\n").filter(Boolean).map((k) => labels.get(k)?.value ?? k);
  return props.multiple ? values : values[0] ?? null;
});

const close = (refocus) => {
  if (pop.value?.matches(":popover-open")) pop.value.hidePopover();
  if (refocus) trigger.value.focus();
};

function choose(o) {
  if (capped(o)) return;
  labels.set(String(o.value), o);
  if (!props.multiple) {
    model.value = o.value;
    return close(true);
  }
  model.value = has(o) ? model.value.filter((v) => String(v) !== String(o.value)) : [...(model.value ?? []), o.value];
}

function clear() {
  model.value = props.multiple ? [] : null;
  trigger.value.focus();
}

const xsrf = () => decodeURIComponent(document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)?.[1] ?? "");
async function request(url, body) {
  const headers = { Accept: "application/json", "X-XSRF-TOKEN": xsrf(), ...(body && { "Content-Type": "application/json" }) };
  const res = await fetch(url, { method: body ? "POST" : "GET", headers, body: body && JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  if (res.status === 422) throw new Error(data?.errors?.label?.[0] ?? data?.message);
  if (!res.ok || data == null) throw new Error();
  return data;
}

// debounced; a response for an older query is dropped
let seq = 0, timer;
function find(wait = 250) {
  clearTimeout(timer);
  const n = ++seq;
  loading.value = true;
  error.value = "";
  timer = setTimeout(async () => {
    try {
      const term = q.value.trim();
      const found = typeof props.src === "function" ? await props.src(term) : await request(`${props.src}${props.src.includes("?") ? "&" : "?"}q=${encodeURIComponent(term)}`);
      if (!Array.isArray(found)) throw new Error();
      if (n === seq) remote.value = found;
    } catch {
      if (n === seq) error.value = "Could not load results.";
    } finally {
      if (n === seq) loading.value = false;
    }
  }, wait);
}
watch(q, () => props.src && open.value && find());
// a new query or new results put the first option forward, so Enter picks it
watch([q, remote], () => open.value && (active.value = count.value ? 0 : -1));

async function add() {
  const label = q.value.trim();
  creating.value = true;
  error.value = "";
  try {
    const o = typeof props.create === "function" ? await props.create(label) : await request(props.create, { label });
    q.value = "";
    choose(o);
  } catch (e) {
    error.value = e.message || `Could not add “${label}”.`;
  } finally {
    creating.value = false;
  }
}

const pick = (i) => (i === list.value.length ? add() : list.value[i] && choose(list.value[i]));

// beforetoggle runs as the popover opens or closes, so keys that follow at once see the new state;
// toggle runs after, when the search box can take focus
function beforetoggle(e) {
  open.value = e.newState === "open";
  clearTimeout(timer);
  seq++;
  [q.value, loading.value, error.value] = ["", false, ""];
  active.value = open.value ? Math.max(0, list.value.findIndex(has)) : -1;
  if (open.value && props.src) find(0);
}
const toggle = (e) => e.newState === "open" && search.value && input.value.focus();

// select-only: type-ahead jumps to the first label starting with what was typed in the last half second
let typed = "", typedAt = 0;
const typeahead = (ch) => {
  typed = (Date.now() - typedAt > 500 ? "" : typed) + ch.toLowerCase();
  typedAt = Date.now();
  const i = list.value.findIndex((o) => o.label.toLowerCase().startsWith(typed));
  if (i >= 0) active.value = i;
};

function keydown(e) {
  const char = e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey;
  const last = count.value - 1;
  const moves = { ArrowDown: Math.min(active.value + 1, last), ArrowUp: Math.max(active.value - 1, 0) };
  // Home and End move the caret in a search box, and through the options otherwise
  if (selectOnly.value) Object.assign(moves, { Home: 0, End: last });
  if (e.target === trigger.value && !open.value) {
    if (!(e.key in moves) && !(selectOnly.value && char)) return;
    e.preventDefault();
    // a click, so the trigger is the popover's anchor
    trigger.value.click();
    if (e.key === "Home" || e.key === "End") active.value = moves[e.key];
    if (char) typeahead(e.key);
    return;
  }
  if (e.key in moves) {
    e.preventDefault();
    active.value = moves[e.key];
  } else if (e.key === "Enter" || (selectOnly.value && e.key === " ")) {
    e.preventDefault();
    pick(active.value);
  } else if (selectOnly.value && char) {
    typeahead(e.key);
  }
}

// Escape closes this popover only, not a dialog it sits in; focus leaving the trigger and panel closes it
const escape = (e) => open.value && (e.preventDefault(), close(true));
const focusout = (e) => ![trigger.value, pop.value].some((el) => el.contains(e.relatedTarget)) && close();
watch(activeId, (v) => v && nextTick(() => document.getElementById(v)?.scrollIntoView({ block: "nearest" })));
</script>

<template>
  <div ref="root" class="combobox" v-bind="split(false)" @keydown.esc="escape" @focusout="focusout">
    <select ref="hidden" hidden :name="name && (multiple ? `${name}[]` : name)" :form="form" :multiple="multiple" :disabled="disabled">
      <option v-if="!multiple" value="" :selected="!initial.length" />
      <option v-for="k in submitted" :key="k" :value="k" :selected="initial.includes(k)" />
    </select>
    <button ref="trigger" type="button" class="input" role="combobox" :aria-label="label" :aria-haspopup="selectOnly ? 'listbox' : 'dialog'" :aria-controls="selectOnly ? `${id}-list` : id" :aria-expanded="open" :aria-activedescendant="selectOnly ? activeId : null" :aria-required="required || null" :popovertarget="id" :data-count="multiple && keys.length > 1 ? keys.length : null" :disabled="disabled" :autofocus="autofocus" v-bind="split(true)" @keydown="keydown"><span>{{ selected.map((o) => o.label).join(", ") }}</span></button>
    <div :id="id" ref="pop" popover class="dropdown" :role="selectOnly ? null : 'dialog'" :aria-label="selectOnly ? null : label" @beforetoggle="beforetoggle" @toggle="toggle">
      <input v-if="search" ref="input" v-model="q" class="input" type="text" role="combobox" autocomplete="off" aria-autocomplete="list" aria-expanded="true" :aria-label="`Search ${label}`" :aria-controls="`${id}-list`" :aria-activedescendant="activeId" @keydown="keydown">
      <div v-if="checkboxes">
        <label v-for="o in options" :key="o.value" class="checkbox"><input type="checkbox" :checked="has(o)" :disabled="capped(o)" @change="choose(o)"> {{ o.label }}</label>
      </div>
      <!-- tabindex: Firefox would put the scrolling list in the tab order -->
      <ul v-else :id="`${id}-list`" role="listbox" tabindex="-1" :aria-label="label" :aria-multiselectable="multiple || null">
        <li v-for="(o, i) in list" :id="optionId(i)" :key="o.value" role="option" :aria-selected="has(o)" :aria-disabled="capped(o) || null" :data-active="i === active || null" @mousedown.prevent @pointermove="active = i" @click="pick(i)">{{ o.label }}</li>
        <li v-if="canCreate" :id="optionId(list.length)" role="option" aria-selected="false" :data-active="active === list.length || null" @mousedown.prevent @pointermove="active = list.length" @click="pick(list.length)">Add “{{ q.trim() }}”</li>
      </ul>
      <p v-if="search" role="status">{{ status }}</p>
    </div>
    <button v-if="!disabled && keys.length && (multiple || !required)" type="button" class="btn ghost" :aria-label="`Clear ${label}`" @click="clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg></button>
  </div>
</template>
