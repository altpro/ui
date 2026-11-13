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
| `useUnsavedChanges(() => boolean)` | Asks while the function returns true, for a dirty test that is not a form's `isDirty`. It lets every `put`, `post` and `delete` go, as it cannot tell a form's save from Log out; for a form, guard the form itself. `{ get isDirty() { return uploading.value > 0 } }` asks on them too, for a test with no save of its own, such as uploads still running. A page with two forms guards each: `useUnsavedChanges(profile, { remember: "profile" })` and `useUnsavedChanges(address, { remember: "address" })`. |
| `useUnsavedChanges(form, "Leave without saving the order?")` | Another question. The default is "Leave this page? Your changes won't be saved." Also `{ message: "…" }`. |
| `useUnsavedChanges(form, { remember: "address" })` | Names the history slot the draft keeps for Back and Forward (below). Needed only by a second `useForm` guarded on the same page, as both would take the default slot. `remember: false` keeps no draft. |
| `const { allowLeaving } = useUnsavedChanges(form)` | Call `allowLeaving()` as a visit starts that ends the page's need for the form, such as deleting the record it edits (`onBefore: allowLeaving`; `onStart` comes after the guard has asked). The draft goes too, so Back to the deleted record's page brings none. If that visit fails, or is stopped (another guard's Cancel), the guard and the draft are back. |
| `leaveWithoutAsking()` | Also exported. Turns every guard off until the next page has landed in the app, for leaving that must not wait on a prompt, such as a logout for inactivity, where a prompt would keep the page on screen for whoever sits down next. The login page it lands on, and the next reader's forms after it, are guarded again. |

- It needs Inertia. With no Inertia, keep a `beforeunload` listener of your own: the `router` half has nothing to listen to.
- This covers leaving a page. A dialog or drawer asks inside the app, below.
- In the app, the question is a native `confirm()`: the browser makes it modal, focuses it and reads it out, and it holds up the visit with no more code. OK goes, Cancel stays with the edits as they were.
- Leaving the app or reloading shows the browser's own prompt, with the browser's own wording; no page can change it. Browsers only show it after the user has interacted with the page, which anyone with unsaved changes has. Once the user has said OK to a visit, a full page load that follows it (a Blade page, an external redirect) does not ask again.
- Not leaving: a guarded form's own submit (its `put`, `post` or `delete`), a link prefetching on hover, a partial reload of this page (`only` or `except`, as a DataTable on the page sends), and a request in the background (`async`, as an optimistic switch sends). Any other `put`, `post` or `delete` asks, as it may land on another page: Log out (`<Link method="post">`), a Duplicate that opens the copy. An action of your own that comes back to this page (a row's Delete in a list here, Send test email) asks as well; give it `only: [...]`, the props it changes, or `async: true`, and it goes unasked. Another guarded form's save does not ask: it usually comes `back()`, keeping the page and this form's edits, and one that lands on another page leaves this form's draft in the history entry, so Back brings it. A form that keeps no draft (`remember: false`, a function source, its passwords) has nothing for Back to bring, so it loses those edits. Given a function, the guard cannot tell its form's save from the rest, so no `put`, `post` or `delete` asks; pass the form itself where the page has one. A visit to this same URL that keeps state (`preserveState: true`, as `router.reload()` sends) brings fresh props and keeps the draft. Any other visit to this same URL, such as a click on this page's own nav link, would remount the page and drop the draft, so it is cancelled without asking. Every other `get` asks.
- A successful save makes the saved data the defaults, so `isDirty` is false again and the next visit goes without asking. Discard (`reset()`) does the same.
- Back and Forward restore a page from history without a visit, so nothing can ask before they leave. Instead, given a `useForm`, it keeps the unsaved draft in the page's history entry: Back, then Forward, brings the page back with the draft, still unsaved, so the save bar says so, Discard goes back to the saved record and leaving asks again. It is the latest draft, even straight after typing; a Discard, a successful save and an OK to the app's question leave nothing to bring back, and a failed save keeps it. Leaving through the browser's own prompt (a typed URL, a closed tab) keeps it, so Back to the app can still bring it. A list on the same page that sorts, filters or searches (as a DataTable does) makes history entries of its own; they share the one draft, so Back through them keeps the latest edits. A save of this form that lands at another URL starts afresh there, and another form's save leaves this one's draft alone. A reload, or a new visit to the page from a link, starts from the server's data, and after a reload Back brings no draft the reader agreed to lose. A function source keeps no draft.
- After a full page load (a link out of the app, a typed URL), Back one step at a time brings the latest draft. A jump of several entries at once from the browser's history menu can bring the draft as that entry last held it, an older one.
- `password`, `password_confirmation` and `current_password` never go into the draft (Laravel's `dontFlash` list), at any depth (`user.password` too), as history state outlives the page and the session. They come back empty. A form holding any other secret (an API key, an SMTP password) passes `{ remember: false }`.
- A form edited in a dialog or drawer passes `{ remember: false }`: its draft would come back into a closed dialog, leaving the page dirty with nothing in sight to save or discard.
- Two guarded forms on one page ask one question between them: the first with unsaved changes asks, and the other takes the answer.
- Two guarded `useForm`s on one page each need their own `remember` key. Under one key the second keeps no draft and the console says so. A draft whose fields don't match the form's is not brought back.
- Don't also give `useForm` a remember key (`useForm("product", {...})`): Inertia brings that draft back as the form's defaults, so the form looks saved and Save sends nothing.
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
