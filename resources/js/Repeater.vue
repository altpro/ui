<!--
  <Repeater v-model="form.lines" name="lines" item="line" :make="() => ({ product_id: '', qty: 1 })" :errors="form.errors" :disabled="form.processing" v-slot="{ row, index, errors }">
    <Field v-model="row.qty" :name="`lines.${index}.qty`" type="number" :errors="errors" />
  </Repeater>
  Rows are objects, edited in place. Each gets a key held here, outside the data, so `lines.0` is only a position.
  Errors are read from position whenever they change (Inertia replaces form.errors on every response; setError writes into it),
  then belong to the row's key: they move with it and go when it is removed. The slot gets them keyed by the row's current position.
  As in Field, errors can also be a string or an array: the list's own messages, shown under it.
  Row titles are h3 unless heading-level says otherwise.
-->
<script setup>
import { computed, nextTick, ref, toRaw, watch } from "vue";

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
function move(i, by) {
  const rows = [...model.value];
  rows.splice(i + by, 0, ...rows.splice(i, 1));
  model.value = rows;
  announce(`${title(i)} moved ${by < 0 ? "up" : "down"}, now ${props.item} ${i + by + 1}.`);
  focus(i + by, by < 0 ? "up" : "down", by < 0 ? "down" : "up");
}
</script>

<template>
  <div class="repeater">
    <ol ref="list">
      <li v-for="(row, i) in model" :key="keyOf(row)" class="card">
        <header>
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
