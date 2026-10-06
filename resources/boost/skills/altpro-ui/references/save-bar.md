# Save bar (pattern)

No class. The Save and Discard buttons of a long edit screen, stuck to the bottom of the viewport while the form is on screen. The app tracks unsaved changes and saving; with Inertia's `useForm` that is `form.isDirty` and `form.processing`.

```html
<html class="scroll-pb-20">
…
<form @submit.prevent="form.put(url)">
  <!-- fields -->
  <div class="sticky bottom-0 z-10 -mx-gap flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-gap py-3 print:hidden">
    <p class="me-auto text-sm" role="status">{{ form.isDirty ? "Unsaved changes" : form.recentlySuccessful ? "Saved." : "" }}</p>
    <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="form.reset(); form.clearErrors()">Discard</button>
    <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
  </div>
</form>
```

- The bar is the last child of the `<form>`, so Tab reaches it after the last field and Enter in a field submits. `sticky`, not `fixed`: at the end of the form it sits in its own place under the last field instead of covering it, and it never shows outside the form.
- `print:hidden` keeps it off a printed form.
- `scroll-pb-20` on `<html>` (the bar's height plus a little) stops the browser tabbing a field behind the bar. Inside a scrolling panel instead of the page, put it on that panel.
- `-mx-gap px-gap` takes the bar to the edges of a `p-gap` container; match whatever padding the page has. `bg-background` must be opaque, since fields scroll behind it; on a card use `bg-card`. In a grid form give it `col-span-full`.
- Save stays enabled while the form is clean: a disabled Save gives no reason, and saving unchanged data does no harm. While saving it is `loading`, `disabled` and `aria-busy`, as in [button.md](button.md). Discard is a `type="button"` (never `type="reset"`, which bypasses `v-model`) and is disabled while there is nothing to discard or a save is running.
- Inertia takes the saved data as the new defaults after a successful save, so `isDirty` goes false by itself. If a `Field` makes `isDirty` start true, call `form.defaults()` on mount (see [field.md](field.md)).
- The `role="status"` line says "Unsaved changes" once, when the form first changes, and "Saved." after a save. Keep the element in the page at load and change only its text.
- Always shown, not `v-if="form.isDirty"`: a bar that appears shifts the page and hides Save until something changes.
- Warning about unsaved changes on leaving is the app's job (`beforeunload`, and Inertia's `router.on("before")` for in-app visits).
