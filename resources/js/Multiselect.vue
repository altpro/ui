<!--
  <Multiselect v-model="sizes" name="size" label="Size" :options="[{ value: 's', label: 'Small' }]" required :max="2" />
  Same markup as resources/views/components/multiselect.blade.php; tests/browsers.spec.js checks they match.
-->
<script setup>
import { computed, ref, useAttrs, useId } from "vue";
import { useDomModel } from "./domModel.js";
import "./multiselect.js";

const model = defineModel({ type: Array, default: () => [] });
const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true }, // [{ value, label }]
  name: String,
  form: String,
  max: Number,
  required: Boolean,
  disabled: Boolean,
  autofocus: Boolean,
});
const count = computed(() => props.options.filter((o) => model.value.includes(o.value)).length);
const id = useId();
const root = ref();
useDomModel(model, root, (el) => [...el.querySelectorAll("input:checked")].map((b) => props.options.find((o) => String(o.value) === b.value)?.value ?? b.value));
// aria-* goes on the button, the control; the rest on the wrapper
defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const split = (aria) => Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith("aria-") === aria));
</script>

<template>
  <!-- <component is> renders the custom element without Vue's "failed to resolve component" warning.
       On a custom element Vue writes required="true" or "false"; a boolean attribute wants "" or none. -->
  <component is="ui-multiselect" ref="root" class="multiselect" v-bind="split(false)" :form="form" :max="max" :required="required ? '' : null">
    <button type="button" class="input" :popovertarget="id" :data-count="count" :disabled="disabled" :autofocus="autofocus" v-bind="split(true)"><span class="sr-only">{{ label }}</span><span><span v-for="o in options" :key="o.value" :hidden="!model.includes(o.value)">{{ o.label }}</span></span></button>
    <fieldset :id="id" popover class="dropdown" :aria-label="label" :disabled="disabled">
      <label v-for="o in options" :key="o.value" class="checkbox"><input v-model="model" type="checkbox" :name="name ? `${name}[]` : null" :form="form" :value="o.value" :disabled="count >= max && !model.includes(o.value)"> {{ o.label }}</label>
    </fieldset>
  </component>
</template>
