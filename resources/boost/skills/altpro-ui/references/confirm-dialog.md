# Confirm dialog: `ConfirmDialog.vue`

A [`.dialog`](dialog.md) that asks before an action and holds still while it runs: a title, an optional description, any body (a password field), Cancel and one confirm button. Opened like any dialog, with `command="show-modal"`. While `busy` nothing closes it, which takes four separate guards on a hand-written dialog, so use this for every confirm that sends a request. [destructive-action.md](destructive-action.md) is the full page, with the controller.

```vue
<script setup>
import { ref } from "vue";
import { useForm } from "@inertiajs/vue3";
import ConfirmDialog from "@ui/ConfirmDialog.vue";

const props = defineProps({ product: { type: Object, required: true } });
const dialog = ref();
const form = useForm({});
const destroy = () => form.delete(`/products/${props.product.id}`, { onSuccess: () => dialog.value.close() });
</script>

<template>
  <button type="button" class="btn outlined danger" command="show-modal" commandfor="delete-product">Delete</button>
  <ConfirmDialog id="delete-product" ref="dialog" :title="`Delete ${product.name}?`" description="It goes from the shop at once. This can't be undone."
      confirm-label="Delete product" tone="danger" :busy="form.processing" @confirm="destroy" />
</template>
```

| Prop | |
|------|---|
| `id` | Required. The `commandfor` of the button that opens it. |
| `title` | Required. The question, as the heading: "Delete Arc studio?". |
| `confirm-label` | Required. Names the action ("Delete product"), never "OK" or "Yes". |
| `description` | What happens, under the title. The `#description` slot takes markup instead. |
| `tone` | `primary` (default) or `danger`, the confirm button's colour. `danger` for anything that can't be undone. |
| `cancel-label` | Default "Cancel". "Keep editing" and the like where Cancel would be unclear. |
| `busy` | True while the request runs: `form.processing`. |

| Slot, event, method | |
|------|---|
| default slot | The body, inside the dialog's own `novalidate` form, so Enter in a field confirms. Put `autofocus` on its first field. No `<form>` of your own here. |
| `#description` | Replaces `description`. |
| `@confirm` | The confirm button or Enter in the body. Not sent while `busy`. |
| `@close` | However it closed: Cancel, Esc, the cross or `close()`. Reset the form here, so it opens empty next time. |
| `showModal()`, `close()` | Through a template ref. `close()` works while busy too, for `onSuccess`. |

- Focus starts on Cancel, so a stray Enter does not confirm; a body field with `autofocus` takes it instead. The browser returns focus to the button that opened the dialog.
- While busy, the cross and Cancel are `disabled`, the dialog is `closedby="none"`, the first Esc is cancelled, and a close that still gets through (a Safari without `closedby`, a repeated Esc that fires no `cancel`) opens it again. The confirm button is `loading`, `aria-busy` and `aria-disabled` rather than `disabled`, so it keeps focus and a second press does nothing.
- A 422 keeps it open: show the error in the body (a `Field` with `:errors`), and put focus back in the field in `onError`, as [destructive-action.md](destructive-action.md) does.
- When the trigger goes with the action (a row's Delete in a list), the browser has nowhere to return focus: focus the list's heading (`tabindex="-1"`) in `onSuccess` after `close()`.
- A dialog that edits rather than confirms is a plain `.dialog` with its own footer ([dialog.md](dialog.md)). Asking before leaving a page uses `confirm()`, not this ([unsaved-changes.md](unsaved-changes.md)).
