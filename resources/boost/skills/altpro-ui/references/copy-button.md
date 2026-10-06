# Copy button: `CopyButton.vue`

A `.btn` that copies a value to the clipboard: order numbers, tracking codes, emails. The tooltip shows `label`, then "Copied" (or "Copy failed") for two seconds. Vue only; in Blade, show the value in a `readonly` `.input` so it can be selected.

```vue
<script setup>
import CopyButton from "@ui/CopyButton.vue";

defineProps({ order: { type: Object, required: true } }); // { number, tracking }
</script>

<template>
  <p>Order {{ order.number }} <CopyButton :value="order.number" label="Copy order number" /></p>

  <div class="join flex">
    <input class="input flex-1" aria-label="Tracking code" readonly :value="order.tracking">
    <CopyButton class="outlined" :value="order.tracking" label="Copy tracking code" />
  </div>
</template>
```

| Prop | |
|------|-|
| `value` | The string copied. Required. |
| `label` | Accessible name and resting tooltip. Default `Copy`. Say what is copied: `Copy order number`. |
| `class` | Replaces the default look (`ghost sm -my-1.5 align-middle`, which sits in a line of text without making it taller). Use `outlined` beside an `.input` in a `.join`; add a size class if the input has one. |
| default slot | Replaces the copy icon, which turns to a tick once copied. Start `label` with the slot's visible words (`Copy` → `Copy reference`). |

- Screen readers do not read the tooltip, so "Copied" or "Copy failed" also goes to a polite live region teleported to `<body>`.
- Uses `navigator.clipboard.writeText`, which needs HTTPS (or localhost). Anywhere else, and when the browser refuses, the button says "Copy failed".
- Every other attribute lands on the `<button>`, which is `type="button"`.
