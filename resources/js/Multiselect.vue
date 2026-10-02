<!--
  <Multiselect v-model="sizes" name="size" label="Size" :options="[{ value: 's', label: 'Small' }]" />
  Same markup as resources/views/components/multiselect.blade.php; tests/browsers.spec.js checks they match.
-->
<script setup>
import { useId } from "vue";
import "./multiselect.js";

const model = defineModel({ type: Array, default: () => [] });
defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true }, // [{ value, label }]
  name: String,
});
const id = useId();
</script>

<template>
  <!-- <component is> renders the custom element without Vue's "failed to resolve component" warning -->
  <component is="ui-multiselect" class="multiselect">
    <button type="button" class="input" :popovertarget="id"><span :data-count="options.filter((o) => model.includes(o.value)).length">{{ label }}</span></button>
    <fieldset :id="id" popover class="dropdown" :aria-label="label">
      <label v-for="o in options" :key="o.value" class="checkbox"><input v-model="model" type="checkbox" :name="name ? `${name}[]` : null" :value="o.value"> {{ o.label }}</label>
    </fieldset>
  </component>
</template>
