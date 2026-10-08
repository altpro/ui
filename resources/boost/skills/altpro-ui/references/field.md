# Field: `.field`

Stacks a label, a control, an optional hint and optional errors. Children are styled by element and by the bare words `hint` and `error`; DOM order is display order. Put the `.input` directly inside, or inside a `.join` when it sits beside a button.

```html
<div class="field">
  <label for="email">Email</label>
  <input class="input" id="email" type="email" aria-invalid="true" aria-describedby="email-error">
  <p class="error" id="email-error">Enter a full email address.</p>
</div>
```

| Child | Role |
|-------|------|
| `<label for>` | The label. Bold. Dims when the control is disabled. |
| `.input` or `.join` | The control, bare or as a wrapper with addons. A join stretches to the column and the input inside takes the slack. |
| `.hint` | Help text, muted. Point `aria-describedby` at it. |
| `.error` | Error text, red. A `<p>` for one, a `<ul>` of `<li>` for several. Hidden when empty, so a template can always render it. |

The control turns red when the field holds a non-empty `.error`, when the control has `aria-invalid="true"`, or when native validation fails after interaction, unless the form is `novalidate`: there the server's errors decide, so a `required` field never turns red without a message. Always set `aria-invalid` and `aria-describedby` alongside an `.error`; the colour alone does not reach screen readers.

Disabled: `disabled` on the control, or `<fieldset class="field" disabled>` to disable everything inside it natively.

## Field component: `<x-ui::field>` and `Field.vue`

Writes the whole `.field` from a name and a type: the label, generated ids tying label, hint and errors to the control, and the errors for that name. Prefer it over hand-written fields in forms.

```blade
<x-ui::field name="email" type="email" required autocomplete="email" hint="We never share it." />
<x-ui::field name="category_id" type="select" :options="$categories" :value="$post->category" placeholder="Choose one" />
<x-ui::field name="price" type="number" prepend="£" step="0.01" :value="$product->price" />
<x-ui::field name="published" type="switch" :value="$post->published" />
```

```vue
<script setup>
import { useForm } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";

const props = defineProps({
  post: { type: Object, required: true },
  categories: { type: Array, required: true }, // [{ value, label }]
  tags: { type: Array, required: true }, // [{ value, label }]
});
const form = useForm({ category_id: props.post.category_id, tags: props.post.tags });
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="form.put(`/posts/${post.id}`)">
    <Field v-model="form.category_id" name="category_id" type="select" :options="categories" placeholder="Choose one" :errors="form.errors" />
    <Field v-model="form.tags" name="tags" type="combobox" multiple :options="tags" :errors="form.errors" :max="3" hint="Up to three." />
    <div><button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button></div>
  </form>
</template>
```

| Prop | Blade | Vue |
|------|-------|-----|
| `name` | Field name. Brackets work: `post[title]`, `tags[]`. | Same; optional, but the label guess and error lookup need it. |
| `type` | Any input type (`text` by default), or `textarea`, `select`, `switch`. `radio`, or `checkbox` with options, renders a `<fieldset>` group. `checkbox` without options is one box. | Same, plus `combobox`, which renders `Combobox.vue`; add `multiple` for several. |
| `label` | Defaults to the name: `category_id`, `post[categoryId]` both read "Category". | Same. |
| `hint` | Text under the control, read with it. A `<x-slot:hint>` takes markup. | Same; `#hint` slot. |
| `prepend` / `append` | Text inside the input's border (`£`, `kg`). A slot goes in as written, for a select or an icon. Inputs only. | Same; `#prepend` / `#append` slots. |
| `reveal` | None: showing a password needs JavaScript. | On a `password`: an eye button inside the border that shows and hides it (`aria-pressed`). `<Field name="password" type="password" reveal autocomplete="current-password" />` |
| `options` | `value => label`, a list of strings (value is the string), or a collection of models or arrays: value from `id` (else `value`), label from `name` (else `label`). | `[{ value, label }]`, `{ value: label }`, strings, or models as above. |
| `value` / `v-model` | Current value. `old()` wins automatically. A model or collection of models becomes its ids. | `v-model` with `useForm`; models are handed straight back as ids. `value` without v-model, in Inertia's `<Form>`. `type="number"` emits a number, `file` a `File` (an array when `multiple`). |
| `errors` | Defaults to the page's `$errors`. Also takes a `MessageBag`, an array keyed by field (`tags.0` counts for `tags`), or a string or list for this field. `bag` picks a named error bag. | A string, an array, or Laravel's errors object keyed by field: Inertia's `form.errors`, or a 422 body's `errors`. |
| `id` | Generated when left off. | Same. |
| `now` | On a `date`, `time`, `datetime-local` or `month`, an empty value becomes the current one, in the app's timezone. | Same, in the browser's timezone; the value goes into v-model too. |

After mount (Vue):

- **v-model** changes: the control follows. A model or list of models is turned into ids again, so `useForm`'s `reset()` putting default models back submits ids too.
- **`value`** is read once, when there is no v-model. Changing it later does nothing; the inputs are the truth.
- **`now`** fills an empty date once, at mount. A later `reset()` to an empty default leaves it empty.
- **`options`** change: the list re-renders and the value is matched to the new options (`1` matches `"1"`). A value missing from the new options stays in the model; a select then shows no option chosen.
- **`errors`** change: messages, `aria-invalid` and the red border follow at once, so `clearErrors()` clears them.
- **The form's defaults** (`form.defaults()`) only matter when the form resets. Without v-model, a native or `<Form>` reset reads the inputs back into the field. A file field empties on a native or `<Form>` reset even with v-model, since nothing can write a file input.

- `class` lands on the `.field`; every other attribute (`required`, `placeholder`, `min`, `rows`, `autocomplete`, `max`, `disabled`…) on the control. On a `combobox` they go to `Combobox.vue`, so `multiple`, `max`, `src` and `create` work there.
- `placeholder` on a select adds an empty first option, so `required` works on it.
- After a failed submit, an unticked box or checkbox group stays empty rather than falling back to `value`, since the browser sends nothing for it.
- Errors set `aria-invalid` and turn the control red; one shows as a `<p class="error">`, several as a `<ul>`.
- A single checkbox or switch submits `1`, which Laravel's `boolean` rule accepts. Unticked, it submits nothing: read it with `$request->boolean('name')`.
- A one-time code (two-factor, email confirmation) is a plain text field, so a pasted code and the phone's suggested code both work: `<Field name="code" label="Authentication code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" />`. Don't split it into one box per digit.
- `autofocus` works on the first page load and in a dialog opened with `showModal()`. After an Inertia visit, browsers ignore it: focus the field from the page's `onMounted`. On a Blade page every visit is a page load, so `:autofocus` works, as the sign-in pages in [app-shell.md](app-shell.md) use it.

Inertia, Vue:

- `useForm`: `<Field v-model="form.title" name="title" :errors="form.errors" />`. Model ids and `now` are written into the form after `useForm` took its defaults, so `isDirty` starts true. Call `onMounted(() => form.defaults())` if you show it.
- `<Form>`: no v-model. Give the start as `value` and pass the slot's `errors`: `<Form #default="{ errors }"><Field name="title" :value="post.title" :errors="errors" /></Form>`. Values come from the inputs, so every field needs a `name`. `reset()` and `reset("field")` work, including the combobox.
- Precognition: listeners land on the control, so `@change="form.validate('title')"` works. On a combobox they land on the wrapper: use `@change` or `@focusout`, since `blur` does not bubble.
