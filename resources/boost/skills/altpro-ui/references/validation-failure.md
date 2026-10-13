# Validation failure (pattern)

No class. What a form does when the server sends back errors: an error summary at the top of the form, announced and focused, and each [`Field`](field.md) showing its own message. And where focus goes after an Inertia visit, which the [app shell](app-shell.md) handles. The edit page in [recipes.md](recipes.md) is this pattern in full; `demo/app/recipe-product.html` in the altpro/ui repository runs it.

```vue
<script setup>
import { nextTick, ref } from "vue";
import { useForm } from "@inertiajs/vue3";
import { CircleAlert } from "@lucide/vue";
import Field from "@ui/Field.vue";

const props = defineProps({ product: { type: Object, required: true } });
const form = useForm({ name: props.product.name, price: props.product.price });

// a failed save focuses the error summary: it is read out, and Tab goes on to the first field
const summary = ref();
const save = () => form.put(`/products/${props.product.id}`, {
  preserveScroll: true,
  onError: () => nextTick(() => summary.value.focus()),
});
</script>

<template>
  <form class="flex max-w-xl flex-col gap-4" novalidate @submit.prevent="save">
    <div v-if="form.hasErrors" ref="summary" class="alert danger" role="alert" tabindex="-1">
      <CircleAlert class="size-4" aria-hidden="true" />
      <h2>The product was not saved</h2>
      <ul class="list-disc ps-5">
        <li v-for="(message, field) in form.errors" :key="field">{{ message }}</li>
      </ul>
    </div>
    <Field v-model="form.name" name="name" :errors="form.errors" required />
    <Field v-model="form.price" name="price" type="number" prepend="£" step="0.01" min="0" :errors="form.errors" required />
    <div>
      <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
    </div>
  </form>
</template>
```

- The summary is the first thing in the form. `role="alert"` announces it as it appears. Focusing it (`tabindex="-1"`) reads it again on a second failed try, when it is already there, scrolls it into view above a long form, and puts the next Tab on the first field. Without the focus, focus stays at the bottom of the form, or on `<body>` once Save is disabled.
- Laravel's messages name their field, so the summary lists them as they come. Each `Field` shows its own as well, with `aria-invalid` and `aria-describedby`, so tabbing through the form reads each error with its field.
- `onError` runs before Vue renders the errors, so the focus waits for `nextTick`.
- `v-if="form.hasErrors"`: the summary goes with the errors, after a good save or a Discard (`clearErrors()`). Clearing a field's error as it is typed (`@input="form.clearErrors('name')"`) shortens the list without moving focus.
- `novalidate`, so all the errors come from the server in one round trip and the browser's bubbles never disagree with Laravel's messages.
- A form of one or two fields (a dialog, a search) needs no summary: focus the first invalid field instead, as [destructive-action.md](destructive-action.md) does.

## With Inertia's `<Form>`

The same rules apply when the page uses `<Form>` rather than `useForm`, as Laravel's starter kit does. `Field` needs no `v-model` inside it, because `<Form>` reads the inputs by name. The slot gives the errors.

```vue
<script setup>
import { nextTick } from "vue";
import { Form, usePage } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";

const user = usePage().props.auth.user;

// two fields, so no summary: a failed submit focuses the first field the server marked invalid
const focusFirstInvalid = () => nextTick(() => document.querySelector('[aria-invalid="true"]')?.focus());
</script>

<template>
  <Form action="/settings/profile" method="patch" novalidate class="flex max-w-xl flex-col gap-4" @error="focusFirstInvalid" v-slot="{ errors, processing }">
    <Field name="name" :value="user.name" :errors="errors" required autocomplete="name" />
    <Field name="email" type="email" :value="user.email" :errors="errors" required autocomplete="email" />
    <div>
      <button class="btn primary" :class="{ loading: processing }" :disabled="processing" :aria-busy="processing">Save</button>
    </div>
  </Form>
</template>
```

- With Wayfinder, `v-bind="store.form()"` replaces `action` and `method`.
- A longer form adds the summary above its first `Field`: `v-if="hasErrors"` from the slot, listing `errors`. `@error` focuses it through a template ref, as `save` does above.

## Where focus goes

| After | Focus goes to | Done by |
|-------|---------------|---------|
| A visit to a new page: a link, a redirect to another URL, Back | The new page's `<main>` | `AppLayout`, which every page wraps itself in, so it mounts again on each new page ([app-shell.md](app-shell.md)) |
| The first page load | Nowhere: the first Tab reaches the skip link | The browser |
| A failed save | The error summary | The page's `onError`, above |
| A save, a DataTable change, any visit that keeps the page (`preserveState`) | Not moved by the layout | The page, if anything |
| A dialog closing | The button that opened it | The browser |
