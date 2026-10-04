<!--
  <CopyButton value="ORD-1042" label="Copy order number" />
  A .btn that copies `value` to the clipboard. The tooltip shows `label`, then "Copied" (or "Copy failed") for two seconds,
  and a polite live region says the same, because screen readers do not read the tooltip.
  Default look is `ghost sm`, a square copy icon that turns to a tick, with negative block margin and align-middle so it does not stretch a line of text. Any `class` replaces that look:
  `class="outlined"` beside an `.input` in a `.join`. The default slot replaces the icon; keep `label` starting with its text.
-->
<script setup>
import { onBeforeUnmount, ref } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, default: "Copy" },
});

const said = ref(null), n = ref(0);
let timer;
const copy = async () => {
  clearTimeout(timer);
  try {
    await navigator.clipboard.writeText(props.value);
    said.value = "Copied";
  } catch {
    said.value = "Copy failed"; // insecure context, permission refused, or no clipboard API
  }
  n.value++; // a new node, so the same words are announced again on a second click
  timer = setTimeout(() => (said.value = null), 2000);
};
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <button v-bind="{ ...$attrs, class: undefined }" type="button" :class="['btn', $attrs.class ?? 'ghost sm -my-1.5 align-middle', !$slots.default && 'px-2']" :aria-label="label" :data-tooltip="said ?? label" @click="copy">
    <slot>
      <svg v-if="said === 'Copied'" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      <svg v-else class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
    </slot>
    <Teleport to="body"><div class="sr-only" aria-live="polite"><p v-if="said" :key="n">{{ said }}</p></div></Teleport>
  </button>
</template>
