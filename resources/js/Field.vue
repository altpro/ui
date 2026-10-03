<!--
  <Field v-model="form.email" name="email" type="email" :errors="form.errors" required />
  <Field v-model="form.tags" name="tags" type="multiselect" :options="tags" hint="Up to three." :max="3" />
  Same markup as resources/views/components/field.blade.php; tests/browsers.spec.js checks they match.
  Options take [{ value, label }], { value: label }, a list of strings, or models with id and name.
  A model or a list of models in v-model is handed straight back as ids, so an untouched field never submits models.
  Without v-model (Inertia's <Form>), `value` is the starting value and the inputs are the truth.
  `now` fills an empty date, time, datetime-local or month with the current one, in the browser's timezone, and emits it.
  Errors take a string, an array, or Laravel's errors object (Inertia's, or a 422 body's `errors`).
  `class` lands on the .field, every other attribute on the control.
-->
<script setup>
import { computed, ref, useAttrs, useId, useSlots, watch } from "vue";
import Multiselect from "./Multiselect.vue";
import { useDomModel } from "./domModel.js";

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

const isObject = (v) => v !== null && typeof v === "object";
const toId = (v) => (isObject(v) ? v.id ?? v.value : v);
const options = computed(() => (Array.isArray(props.options)
  ? props.options.map((o) => (isObject(o) ? { value: toId(o), label: o.name ?? o.label } : { value: o, label: o }))
  : Object.entries(props.options).map(([value, label]) => ({ value, label }))));
const group = computed(() => options.value.length > 0 && ["radio", "checkbox"].includes(props.type));
const multi = computed(() => props.type === "multiselect" || (group.value && props.type === "checkbox"));
const boolean = computed(() => !group.value && ["checkbox", "switch"].includes(props.type));

// the model as option values: models become ids, and 1 matches the "1" an object key gives
const match = (v) => options.value.find((o) => String(o.value) === String(v))?.value ?? v;
const picked = computed({
  get: () => (multi.value ? [model.value ?? []].flat().map((v) => match(toId(v))) : match(toId(model.value) ?? "")),
  set: (v) => (model.value = v),
});
// a watch rather than once, as useForm's reset() puts its default models back
watch(model, () => options.value.length && [model.value].flat().some(isObject) && (model.value = picked.value), { immediate: true });

const root = ref();
useDomModel(model, root, (el) => {
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
const file = (e) => (model.value = e.target.multiple ? [...e.target.files] : e.target.files[0]);
</script>

<template>
  <component :is="group ? 'fieldset' : 'div'" ref="root" class="field" :class="$attrs.class" :id="group ? id : null" :aria-describedby="group ? describedby : null">
    <template v-if="group">
      <legend>{{ label }}</legend>
      <label v-for="o in options" :key="o.value" :class="type"><input v-model="picked" :type="type" :name="multi ? `${base}[]` : name" :value="o.value" :aria-invalid="invalid" v-bind="control()"> {{ o.label }}</label>
    </template>
    <label v-else-if="boolean" :class="type === 'switch' ? 'switch' : 'checkbox'"><input v-model="model" type="checkbox" value="1" :role="type === 'switch' ? 'switch' : null" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()"> {{ label }}</label>
    <template v-else-if="type === 'multiselect'">
      <!-- no `for`: it would become the button's whole name and hide the ticked items -->
      <label>{{ label }}</label>
      <Multiselect v-model="picked" :name="base" :label="label" :options="options" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()" />
    </template>
    <template v-else>
      <label :for="id">{{ label }}</label>
      <textarea v-if="type === 'textarea'" v-model="model" class="input" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()" />
      <select v-else-if="type === 'select'" v-model="picked" class="input" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()">
        <option v-if="$attrs.placeholder != null" value="">{{ $attrs.placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>
      <!-- a string sits in a span; a slot (a currency select, say) goes in as written -->
      <label v-else-if="prepend || append || $slots.prepend || $slots.append" class="input">
        <slot name="prepend"><span v-if="prepend">{{ prepend }}</span></slot>
        <input v-model="model" :type="type" :id="id" :name="name" :aria-describedby="describedby" :aria-invalid="invalid" v-bind="control()">
        <slot name="append"><span v-if="append">{{ append }}</span></slot>
      </label>
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
