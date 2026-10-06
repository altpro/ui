# Dialog: `.dialog`

A card in the top layer, on a native `<dialog>`. Everything in [card.md](card.md) applies inside it: `header`, `hgroup`, `footer`, media bleed, `divided`, `--card-p`. Open and close with button commands, no JavaScript. The browser handles Esc, focus trapping, the backdrop and returning focus to the trigger.

```html
<button class="btn primary" command="show-modal" commandfor="confirm">Delete project</button>
<dialog id="confirm" class="dialog" aria-labelledby="confirm-title">
  <header>
    <hgroup><h3 id="confirm-title">Delete this project?</h3><p>This cannot be undone.</p></hgroup>
    <button class="btn ghost sm" command="close" commandfor="confirm" aria-label="Close">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </header>
  <p>Members lose access as soon as you press delete.</p>
  <footer class="justify-end">
    <button class="btn ghost" command="close" commandfor="confirm">Cancel</button>
    <button class="btn danger" command="close" commandfor="confirm">Delete</button>
  </footer>
</dialog>
```

| Kind | Attributes |
|------|------------|
| Open | `command="show-modal" commandfor="id"` on any button. |
| Open from code | `showModal()` and `close()` on the element, for a dialog that opens when something finishes, such as a request. See the Vue example below. |
| Close | `command="close" commandfor="id"` on any button, inside or outside the dialog. |
| Non-modal | Add `popover="manual"` to the dialog and open it with `command="show-popover"`, close with `command="hide-popover"`. Same box, centred, no backdrop, the page stays usable. There is no non-modal dialog command. |
| Dismiss | Esc by default. `closedby="any"` on the dialog adds click on the backdrop. `closedby="none"` removes Esc, for a dialog that must end with a button. |
| Width | 32rem, capped at the viewport minus a `gap` each side. Narrower with `max-w-sm`, wider with `w-[48rem]`. |
| Height | Capped at the viewport minus a `gap` each side; taller content scrolls inside. The header and footer scroll with it. |
| Drawer | `drawer`: a full-height panel, 24rem wide, that slides in from the end edge. `drawer start` slides from the start edge. Everything else is unchanged. `mt-auto` on the footer pins it to the bottom. |

- The close cross is a `btn ghost sm` with `aria-label="Close"`, placed straight after the heading or `hgroup` so the header pushes it to the far side. The dialog pulls it onto the heading line.
- Put `aria-labelledby` on the dialog pointing at its heading. Without it the dialog has no name.
- Form: the `<header>` and `<footer>` stay direct children of the dialog. Wrap only the fields in `<form id="f" method="dialog" class="contents">` and give the footer's submit button `form="f"`. `method="dialog"` closes on submit. Cancel is a `command="close"` button.
- Focus goes to the first focusable thing, which is the close cross. Put `autofocus` on the first field of a form instead.
- Place the dialog where a `div` card would go: inside `main`, `section` or another sectioned element, so its `header` is not announced as the page banner. Not as a direct child of a `space-y-*` or `space-x-*` container: those set margins on every child, and the dialog centres with `margin: auto`.

```html
<button class="btn" command="show-modal" commandfor="filters">Filters</button>
<dialog id="filters" class="dialog drawer divided" closedby="any" aria-labelledby="filters-title">
  <header>
    <h3 id="filters-title">Filters</h3>
    <button class="btn ghost sm" command="close" commandfor="filters" aria-label="Close">…x…</button>
  </header>
  <div class="field">…</div>
  <footer class="mt-auto justify-end"><button class="btn primary" command="close" commandfor="filters">Apply</button></footer>
</dialog>
```

A dialog that opens after a request succeeds has no button to carry the command. Drive it from a `v-model`, and let `@close` write back, because Esc, a `command="close"` button and `closedby` all close it without Vue:

```vue
<script setup>
import { useTemplateRef, watch } from "vue";

const open = defineModel("open", { type: Boolean });
const dialog = useTemplateRef("dialog");
watch(open, (value) => (value ? dialog.value.showModal() : dialog.value.close()));
</script>

<template>
  <dialog id="setup" ref="dialog" class="dialog" aria-labelledby="setup-title" @close="open = false">
    <header>
      <h3 id="setup-title">Set up two-factor authentication</h3>
      <button class="btn ghost sm" command="close" commandfor="setup" aria-label="Close">…x…</button>
    </header>
    …
  </dialog>
</template>
```

Custom properties: `--dialog-w --dialog-shadow --dialog-backdrop`, plus the card ones.
