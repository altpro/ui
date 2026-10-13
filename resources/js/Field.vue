<!--
  <Field v-model="form.email" name="email" type="email" :errors="form.errors" required />
  <Field v-model="form.tags" name="tags" type="combobox" multiple :options="tags" hint="Up to three." :max="3" />
  Same markup as resources/views/components/field.blade.php; tests/browsers.spec.js checks they match.
  `combobox` is Vue only: the Blade field has no twin for it. Its other attributes (multiple, max, src, create) go to Combobox.vue.
  Options take [{ value, label }], { value: label }, a list of strings, or models with id and name.
  A model or a list of models in v-model is handed straight back as ids, so an untouched field never submits models.
  Without v-model (Inertia's <Form>), `value` is the starting value and the inputs are the truth.
  `reveal` on a password adds a button that shows and hides it. Vue only: the Blade field has no twin for it.
  `now` fills an empty date, time, datetime-local or month with the current one, in the browser's timezone, and emits it.
  On those types an ISO string (Inertia's 2026-10-13T09:30:00.000000Z) is trimmed to what the input takes, in v-model too.
  Errors take a string, an array, or Laravel's errors object (Inertia's, or a 422 body's `errors`).
  `class` lands on the .field, every other attribute on the control.
-->
<script setup>
import { computed, ref, useAttrs, useId, useSlots, watch } from "vue";
import Combobox from "./Combobox.vue";
import { onFormReset, useDomModel } from "./domModel.js";

defineOptions({ inheritAttrs: false });
const model = defineModel();
const props = defineProps({
  name: String,
  type: { type: String, default: "text" },
  label: String,
  hint: String,
  prepend: String,
  append: String,
  options: { type: [Array, Object], default: () => [] },
  value: null,
  errors: [String, Array, Object],
  id: String,
  now: Boolean,
  reveal: Boolean,
});
const attrs = useAttrs();
const slots = useSlots();
const uid = useId();

const id = computed(() => props.id ?? uid);
const base = computed(() => props.name?.replace(/\[\]$/, ""));
const key = computed(() => base.value?.replaceAll("[", ".").replaceAll("]", "").replace(/^\.+|\.+$/g, "") ?? "");
const label = computed(() => {
  if (props.label != null) return props.label;
  const words = key.value.split(".").pop().replace(/_id$/, "").replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
});

if (model.value === undefined && props.value !== undefined) model.value = props.value;
if (props.now && (model.value == null || model.value === "")) {
  const d = new Date(), p = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  const value = { date, time, month: date.slice(0, 7), "datetime-local": `${date}T${time}` }[props.type];
  if (value) model.value = value;
}
// Inertia sends a date cast as 2026-10-13T09:30:00.000000Z, which a date input rejects: keep the part the type takes,
// as the Blade field formats a Carbon. A watch, as useForm's reset() puts the default string back.
const iso = { date: [0, 10], month: [0, 7], "datetime-local": [0, 16], time: [11, 16] };
watch(model, (v) => iso[props.type] && /^\d{4}-\d\d-\d\dT\d\d:\d\d:/.test(v) && (model.value = v.slice(...iso[props.type])), { immediate: true });

const isObject = (v) => v !== null && typeof v === "object";
const toId = (v) => (isObject(v) ? v.id ?? v.value : v);
const options = computed(() => (Array.isArray(props.options)
  ? props.options.map((o) => (isObject(o) ? { value: toId(o), label: o.name ?? o.label } : { value: o, label: o }))
  : Object.entries(props.options).map(([value, label]) => ({ value, label }))));
const group = computed(() => options.value.length > 0 && ["radio", "checkbox"].includes(props.type));
const multi = computed(() => (props.type === "combobox" && ![undefined, false].includes(attrs.multiple)) || (group.value && props.type === "checkbox"));
const boolean = computed(() => !group.value && ["checkbox", "switch"].includes(props.type));
// ticked as Blade's @checked reads it, so an uncast column's 1 or "1" ticks the box; v-model would want true
const ticked = computed(() => ![false, 0, "0", "", null, undefined].includes(model.value));

// the model as option values: models become ids, and 1 matches the "1" an object key gives
const match = (v) => options.value.find((o) => String(o.value) === String(v))?.value ?? v;
const picked = computed({
  get: () => (multi.value ? [model.value ?? []].flat().map((v) => match(toId(v))) : match(toId(model.value) ?? "")),
  set: (v) => (model.value = v),
});
// a watch rather than once, as useForm's reset() puts its default models back
watch(model, () => options.value.length && [model.value].flat().some(isObject) && (model.value = picked.value), { immediate: true });

const root = ref();
const shown = ref(false);
useDomModel(model, root, (el) => {
  // the combobox reads its own resets into the model
  if (props.type === "combobox") return model.value;
  const boxes = [...el.querySelectorAll("input:is([type=checkbox], [type=radio])")];
  if (multi.value) return boxes.filter((b) => b.checked).map((b) => match(b.value));
  if (group.value) return boxes.some((b) => b.checked) ? match(boxes.find((b) => b.checked).value) : null;
  if (boolean.value) return boxes[0].checked;
  return props.type === "file" ? model.value : el.querySelector(`#${CSS.escape(id.value)}`).value;
});

const messages = computed(() => {
  const e = props.errors ?? [];
  const list = typeof e === "string" || Array.isArray(e) ? [e]
    : Object.entries(e).filter(([k]) => k === key.value || k.startsWith(`${key.value}.`)).map(([, m]) => m);
  return [...new Set(list.flat(Infinity))];
});
const hasHint = computed(() => !!(props.hint || slots.hint));
const describedby = computed(() => [hasHint.value && `${id.value}-hint`, messages.value.length && `${id.value}-error`].filter(Boolean).join(" ") || null);
const invalid = computed(() => (messages.value.length ? "true" : null));
// attrs is not reactive, so read it at render time rather than in a computed
const control = () => {
  const { class: _, placeholder, ...rest } = attrs;
  return props.type === "select" ? rest : { ...rest, placeholder };
};
const file = (e) => (model.value = e.target.multiple ? [...e.target.files] : e.target.files[0] ?? null);
// nothing can write a file input, so even with v-model a reset empties the model as it empties the input
onFormReset(root, () => props.type === "file" && file({ target: root.value.querySelector("input") }));
</script>

<template>
  <component :is="group ? 'fieldset' : 'div'" ref="root" class="field" :class="$attrs.class" :id="group ? id : null" :aria-describedby="group ? describedby : null">
    <template v-if="group">
      <legend>{{ label }}</legend>
      <label v-for="o in options" :key="o.value" :class="type"><input v-model="picked" :type="type" :name="multi ? `${base}[]` : name" :value="o.value" :aria-invalid="invalid" v-bind="control()"> {{ o.label }}</label>
    </template>
    <label v-else-if="boolean" :class="type === 'switch' ? 'switch' : 'checkbox'"><input :checked="ticked" type="checkbox" value="1" @change="model = $event.target.checked" :role="type === 'switch' ? 'switch' : null" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()"> {{ label }}</label>
    <template v-else-if="type === 'combobox'">
      <!-- no `for`: the trigger is named by its own aria-label, and its text is the value -->
      <label>{{ label }}</label>
      <Combobox v-model="picked" :name="base" :label="label" :options="options" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()" />
    </template>
    <template v-else>
      <label :for="id">{{ label }}</label>
      <textarea v-if="type === 'textarea'" v-model="model" class="input" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()" />
      <select v-else-if="type === 'select'" v-model="picked" class="input" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()">
        <option v-if="$attrs.placeholder != null" value="">{{ $attrs.placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <!-- a string sits in a span; a slot (a currency select, say) goes in as written. With the reveal button the
           wrapper is a div: a wrapping label would add the button's name to the input's -->
      <component :is="reveal ? 'div' : 'label'" v-else-if="prepend || append || $slots.prepend || $slots.append || reveal" class="input">
        <slot name="prepend"><span v-if="prepend">{{ prepend }}</span></slot>
        <input v-model="model" :type="reveal && shown ? 'text' : type" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()">
        <slot name="append"><span v-if="append">{{ append }}</span></slot>
        <button v-if="reveal" type="button" class="btn ghost sm -me-2 px-2" aria-label="Show password" :aria-pressed="String(shown)" @click="shown = !shown">
          <svg v-if="shown" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
          <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </component>
      <!-- a file input cannot take a value: it hands back the File, or an array of them when multiple -->
      <input v-else-if="type === 'file'" class="input" type="file" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()" @change="file">
      <input v-else v-model="model" :class="type === 'range' ? 'range' : 'input'" :type="type" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()">
    </template>
    <p v-if="hasHint" class="hint" :id="`${id}-hint`"><slot name="hint">{{ hint }}</slot></p>
    <p v-if="messages.length === 1" class="error" :id="`${id}-error`">{{ messages[0] }}</p>
    <ul v-else-if="messages.length" class="error" :id="`${id}-error`">
      <li v-for="m in messages" :key="m">{{ m }}</li>
    </ul>
  </component>
</template>
