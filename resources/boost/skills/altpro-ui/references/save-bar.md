# Save bar: `.save-bar`

The status line, Discard and Save of a long edit screen, stuck to the bottom of the viewport while the form is on screen. The app tracks unsaved changes and saving; with Inertia's `useForm` that is `form.isDirty` and `form.processing`.

```vue
<script setup>
import { useSaveStatus } from "@ui/useSaveStatus";

// Save on an unchanged form sends nothing and says so, as Save stays enabled
const { saveStatus, noteNothingToSave } = useSaveStatus(form);
const save = () => {
  if (!form.isDirty) return noteNothingToSave();
  const sent = form.data();
  // what was sent is what was saved: anything typed while the save was under way stays unsaved
  form.put(url, { preserveScroll: true, onSuccess: () => JSON.stringify(form.data()) !== JSON.stringify(sent) && form.defaults(sent) });
};
</script>

<template>
  <form novalidate @submit.prevent="save">
    <!-- fields -->
    <div class="save-bar">
      <p role="status">{{ saveStatus }}</p>
      <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="form.reset(); form.clearErrors()">Discard</button>
      <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save changes</button>
    </div>
  </form>
</template>
```

`useSaveStatus(form)` from `@ui/useSaveStatus` gives the status line's words and `noteNothingToSave()` for a Save with nothing changed. It takes any `{ isDirty, recentlySuccessful }`, such as Inertia's `useForm`. A form saved by more than one button, such as Save draft and Publish, names what the last save did with `useSaveStatus(form, { saved: () => (published.value ? "Published." : "Draft saved.") })`, and a second button with nothing to send gives its own reason, `noteNothingToSave("No changes to publish.")`; the note goes once the form changes again or a save starts.

| Child | Role |
|-------|------|
| `<p role="status">` | Muted, takes the leading space and keeps one line's height, so text arriving does not move the buttons. In a bar narrower than 30rem (a phone) it takes a line of its own above the buttons, which stay together; while empty it takes no line. |
| buttons | Pushed to the end, Discard then Save. |

- The bar is the last child of the `<form>`, so Tab reaches it after the last field and Enter in a field submits. It is `sticky`, not `fixed`: at the end of the form it sits in its own place under the last field instead of covering it, and it never shows outside the form. It hides itself in print.
- `scroll-pb-28` on `<html>` (the bar's height on a phone, where the status takes its own line, plus a little) stops the browser tabbing a field behind the bar. The [app shell](app-shell.md)'s root view has it. Inside a scrolling panel instead of the page, put it on that panel.
- On a page of cards, the bar goes under the last card in the form's column, as in the record layout ([recipes.md](recipes.md#1-edit-page)). In a form that runs to the page's edges, `-mx-gap px-gap` takes the bar to the edges of a `p-gap` container, such as the app shell's `main`; match whatever padding the page has. The bar is opaque, since fields scroll behind it: on a card give it the card's colour with `[--save-bar-bg:var(--color-card)]`. In a grid form give it `col-span-full`.
- Save stays enabled while the form is clean: a disabled Save gives no reason. Pressing it then sends nothing and the status says "No changes to save." While saving it is `loading`, `disabled` and `aria-busy`, as in [button.md](button.md). Discard is a `type="button"` (never `type="reset"`, which bypasses `v-model`) and is disabled while there is nothing to discard or a save is running.
- Inertia takes the saved data as the new defaults after a successful save, so `isDirty` goes false by itself. It takes the form as it is when the answer comes, though, so text typed while the save was under way would count as saved; `onSuccess` gives the defaults what was sent instead, and the save bar goes on saying "Unsaved changes". `form.data()` copies the top level only: in a form with nested fields edited in place (`form.address.city`, rows in a Repeater left enabled while saving), copy what was sent deeply, or a change typed during the save lands in it too. If a `Field` makes `isDirty` start true, call `form.defaults()` on mount (see [field.md](field.md)).
- The primary is "Save changes" on an edit page; on a create page it is the verb ("Add product"), and Discard is a "Cancel" link back to the list.
- The status line says "Unsaved changes" once, when the form first changes, "Saved." after a save and "No changes to save." for a Save with nothing changed: what `useSaveStatus` returns. Keep the element in the page at load and change only its text; keep `{{ saveStatus }}` its only content, so an empty status is `:empty`.
- Always shown, not `v-if="form.isDirty"`: a bar that appears shifts the page and hides Save until something changes.
- Leaving with unsaved changes asks first: [unsaved-changes.md](unsaved-changes.md) has the composable, one line per page.

Custom properties: `--save-bar-bg --save-bar-py`.
