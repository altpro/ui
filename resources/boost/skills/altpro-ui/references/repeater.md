# Repeater: `Repeater.vue`

A list of rows the user can add to, remove from and reorder: order lines, contact methods, product attributes, links. Each row is a `.card` with its title ("Line 2") and move up, move down and remove buttons; the row's fields come from the slot. Vue only, and it does not need Inertia, though it takes `useForm`'s shape. There is no Blade version.

```vue
<script setup>
import { useForm } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";
import Repeater from "@ui/Repeater.vue";

const props = defineProps({
  order: { type: Object, required: true }, // { id, lines: [{ product_id, qty }] }
  products: { type: Array, required: true }, // [{ value, label }]
});
const form = useForm({ lines: props.order.lines });
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="form.put(`/orders/${order.id}`)">
    <Repeater v-model="form.lines" name="lines" item="line" :make="() => ({ product_id: '', qty: 1 })" :errors="form.errors" :disabled="form.processing" v-slot="{ row, index, errors }">
      <Field v-model="row.product_id" :name="`lines.${index}.product_id`" label="Product" type="select" :options="products" :errors="errors" />
      <Field v-model="row.qty" :name="`lines.${index}.qty`" label="Quantity" type="number" :errors="errors" />
    </Repeater>
    <div><button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button></div>
  </form>
</template>
```

| Prop | Meaning |
|------|---------|
| `v-model` | The array of rows. Rows are objects, edited in place through the slot's `row`; add, remove and move hand back a new array of the same objects. |
| `make` | Required. Returns a new row for "Add". |
| `name` | The array's key in the errors, `lines` for `lines.0.qty`. |
| `item` | What a row is called, default `row`. Titles read "Line 2", buttons "Add line", "Move line 2 up", "Remove line 2". |
| `errors` | `form.errors`, or a 422 body's `errors`. `lines` itself shows under the list. |
| `disabled` | `form.processing`: add, remove and move are off while saving. |

After mount:

- **v-model** replaced (`reset()`, a reload): rows are matched to keys by object identity. `useForm`'s `reset()` clones its defaults, so every row is new: their errors no longer show. Call `clearErrors()` with it.
- **`errors`**: any change (a response, `setError()`, `clearErrors()`) re-reads them by position and ties them to the rows. After a move that position can be stale; see the caveat below.
- **`make`** runs on each "Add", so it can read current state (a default currency).
- **`disabled`** applies at once to add, remove and move.

| Slot prop | Gets |
|-----------|------|
| `row` | The row object; bind its fields with `v-model="row.qty"`. |
| `index` | Its position now, for `name`: `lines.${index}.qty` is only where it sits in what is submitted. |
| `errors` | Its errors, keyed by its current position, so `<Field :errors="errors">` finds them. |

- Each row gets a key held in the component, not in the data, so nothing extra is submitted. Server errors are read by position when they change (Inertia replaces `form.errors` on every response), then belong to the row: they move with it, and go when it is removed.
- Focus: after a move it stays on the moved row's button, or its other move button at the top or bottom; after a remove it goes to the remove button of the row now in that place, else the previous row's, else "Add"; after an add, to the new row's first field. A polite live region says what happened.
- Errors are read by position whenever they change. After a move, a `form.setError('lines.1.qty', …)` or a partial `form.clearErrors('lines.1.qty')` names the position the row had when the errors last arrived, not where it is now. Errors from a response are always right; set or clear them in the client only before rows move, or replace the whole object.
- Moving the first row up and the last row down are disabled. Drag reordering is not there yet; when it comes it sits beside the buttons.
