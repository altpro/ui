# Save bar: `.save-bar`

The status line, Discard and Save of a long edit screen, stuck to the bottom of the viewport while the form is on screen. The app tracks unsaved changes and saving; with Inertia's `useForm` that is `form.isDirty` and `form.processing`.

```vue
<script setup>
import { computed, ref, watch } from "vue";

// Save on an unchanged form sends nothing and says so, as Save stays enabled
const unchanged = ref(false);
watch(() => form.isDirty, () => (unchanged.value = false));
const save = () => {
  if (!form.isDirty) return (unchanged.value = true);
  form.put(url, { preserveScroll: true });
};
const status = computed(() => (form.isDirty ? "Unsaved changes" : unchanged.value ? "No changes to save." : form.recentlySuccessful ? "Saved." : ""));
</script>

<template>
  <form novalidate @submit.prevent="save">
    <!-- fields -->
    <div class="save-bar -mx-gap px-gap">
      <p role="status">{{ status }}</p>
      <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="form.reset(); form.clearErrors()">Discard</button>
      <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
    </div>
  </form>
</template>
```

| Child | Role |
|-------|------|
| `<p role="status">` | Muted, takes the leading space and keeps one line's height, so text arriving does not move the buttons. In a bar narrower than 30rem (a phone) it takes a line of its own above the buttons, which stay together; while empty it takes no line. |
| buttons | Pushed to the end, Discard then Save. |

- The bar is the last child of the `<form>`, so Tab reaches it after the last field and Enter in a field submits. It is `sticky`, not `fixed`: at the end of the form it sits in its own place under the last field instead of covering it, and it never shows outside the form. It hides itself in print.
- `scroll-pb-28` on `<html>` (the bar's height on a phone, where the status takes its own line, plus a little) stops the browser tabbing a field behind the bar. The [app shell](app-shell.md)'s root view has it. Inside a scrolling panel instead of the page, put it on that panel.
- `-mx-gap px-gap` takes the bar to the edges of a `p-gap` container, such as the app shell's `main`; match whatever padding the page has. The bar is opaque, since fields scroll behind it: on a card give it the card's colour with `[--save-bar-bg:var(--color-card)]`. In a grid form give it `col-span-full`.
- Save stays enabled while the form is clean: a disabled Save gives no reason. Pressing it then sends nothing and the status says "No changes to save." While saving it is `loading`, `disabled` and `aria-busy`, as in [button.md](button.md). Discard is a `type="button"` (never `type="reset"`, which bypasses `v-model`) and is disabled while there is nothing to discard or a save is running.
- Inertia takes the saved data as the new defaults after a successful save, so `isDirty` goes false by itself. If a `Field` makes `isDirty` start true, call `form.defaults()` on mount (see [field.md](field.md)).
- The status line says "Unsaved changes" once, when the form first changes, "Saved." after a save and "No changes to save." for a Save with nothing changed. Keep the element in the page at load and change only its text; keep `{{ status }}` its only content, so an empty status is `:empty`.
- Always shown, not `v-if="form.isDirty"`: a bar that appears shifts the page and hides Save until something changes.
- Leaving with unsaved changes asks first: [unsaved-changes.md](unsaved-changes.md) has the composable, one line per page.

Custom properties: `--save-bar-bg --save-bar-py`.
