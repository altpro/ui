# Unsaved changes: `useUnsavedChanges`

A composable, `@ui/useUnsavedChanges`, that asks before the user leaves a form with changes they have not saved: Inertia's `router.on("before")` for visits inside the app, and `beforeunload` for a reload, a closed tab or a typed URL. It goes with the [save bar](save-bar.md), whose status line already says "Unsaved changes" while `form.isDirty`. The edit page in [recipes.md](recipes.md) uses it, and `demo/app/recipe-product.html` in the altpro/ui repository runs it.

One line in each page with a form worth guarding:

```vue
<script setup>
import { useForm } from "@inertiajs/vue3";
import { useUnsavedChanges } from "@ui/useUnsavedChanges";

const props = defineProps({ product: { type: Object, required: true } });
const form = useForm({ name: props.product.name });
useUnsavedChanges(form);
</script>
```

| Call | Use |
|------|-----|
| `useUnsavedChanges(form)` | Asks while `form.isDirty`. |
| `useUnsavedChanges(() => boolean)` | Asks while the function returns true: a page with two forms (`() => profile.isDirty \|\| address.isDirty`), or one whose dirty test is not `isDirty`. |
| `useUnsavedChanges(form, "Leave without saving the order?")` | Another question. The default is "Leave this page? Your changes won't be saved." |
| `const { allowLeaving } = useUnsavedChanges(form)` | Call `allowLeaving()` as a visit starts that ends the page's need for the form, such as deleting the record it edits (`onStart: allowLeaving`). If that visit fails, the guard is back. |
| `leaveWithoutAsking()` | Also exported. Turns every guard off for the rest of the page's life, for leaving that must not wait on a prompt, such as a logout for inactivity, where a prompt would keep the page on screen for whoever sits down next. |

- It needs Inertia. With no Inertia, keep a `beforeunload` listener of your own: the `router` half has nothing to listen to.
- This covers leaving a page. A dialog or drawer asks inside the app, below.
- In the app, the question is a native `confirm()`: the browser makes it modal, focuses it and reads it out, and it holds up the visit with no more code. OK goes, Cancel stays with the edits as they were.
- Leaving the app or reloading shows the browser's own prompt, with the browser's own wording; no page can change it. Browsers only show it after the user has interacted with the page, which anyone with unsaved changes has. Once the user has said OK to a visit, a full page load that follows it (a Blade page, an external redirect) does not ask again.
- Not leaving: the form's own submit (a `put`, `post` or `delete`), a link prefetching on hover, and a partial reload of this page (`only` or `except`, as a DataTable on the page sends). A visit to this same URL that keeps state (`preserveState: true`, as `router.reload()` sends) brings fresh props and keeps the draft. Any other visit to this same URL, such as a click on this page's own nav link, would remount the page and drop the draft, so it is cancelled without asking. Every other `get` asks.
- A successful save makes the saved data the defaults, so `isDirty` is false again and the next visit goes without asking. Discard (`reset()`) does the same.
- Back and Forward restore the previous page from history without a visit, so neither event fires and nothing asks.
- A form that marks itself dirty on load (a `Field` turning models into ids, see [field.md](field.md)) asks on every visit; call `form.defaults()` on mount, as field.md says.

## A dirty dialog

A dialog or drawer can't use `confirm()`, whose buttons say OK and Cancel. It opens a second dialog with "Keep editing" and "Discard changes". `@cancel.prevent` catches Escape. A browser closes the dialog anyway on a repeated Escape, firing no `cancel`, so `@close` brings a dirty editor back and asks. A save closes the editor once the form is clean.

```vue
<script setup>
import { ref } from "vue";

const props = defineProps({ isDirty: { type: Boolean, required: true } });
const editor = ref();
const discard = ref();

let discarding = false;
const requestClose = () => (props.isDirty ? discard.value.showModal() : editor.value.close());
const discardChanges = () => {
  discarding = true;
  discard.value.close();
  editor.value.close();
};
const closed = () => {
  if (props.isDirty && !discarding) {
    editor.value.showModal();
    discard.value.showModal();
  }
  discarding = false;
};
</script>

<template>
  <dialog ref="editor" class="dialog divided" aria-labelledby="edit-title" @cancel.prevent="requestClose" @close="closed">
    <header>
      <h2 id="edit-title">Edit pricing</h2>
      <button type="button" class="btn ghost sm -my-1.5 -me-3" aria-label="Close" @click="requestClose"><X class="size-4" aria-hidden="true" /></button>
    </header>
    <!-- the form -->
    <footer class="justify-end">
      <button type="button" class="btn outlined" @click="requestClose">Cancel</button>
      <button class="btn primary" form="pricing">Save</button>
    </footer>
  </dialog>

  <dialog ref="discard" class="dialog divided" aria-labelledby="discard-title">
    <header><h2 id="discard-title">Discard your changes?</h2></header>
    <p class="text-sm muted">What you changed here won't be saved.</p>
    <footer class="justify-end">
      <button type="button" class="btn outlined" @click="discard.close()">Keep editing</button>
      <button type="button" class="btn primary" @click="discardChanges">Discard changes</button>
    </footer>
  </dialog>
</template>
```
