# Combobox: `Combobox.vue`

Use it for anything a native `<select>` can't do: a long list to search, records searched on the server (customer, product, author, assignee), several values (tags), or adding a new value. A native `<select class="input">` is still the right control for one choice from a short fixed list. Vue only; Blade pages use a native select or checkboxes. A trigger styled like `.input` shows the value and opens a `.dropdown`. A hidden `<select>` submits the value under `name`, or `name[]` with `multiple`. The visible label goes outside it, in a `.field`, with no `for`.

```vue
<script setup>
import Combobox from "@ui/Combobox.vue";
</script>

<div class="field">
  <label>Customer</label>
  <Combobox v-model="form.customer_id" name="customer_id" label="Customer"
      src="/customers/search" :options="[{ value: order.customer.id, label: order.customer.name }]"
      :aria-invalid="form.errors.customer_id ? 'true' : null" aria-describedby="customer-error" required />
  <p class="error" id="customer-error">{{ form.errors.customer_id }}</p>
</div>
```

| Prop | |
|------|-|
| `label` | Required. The trigger's and the list's accessible name. Not shown: put the visible label outside. |
| `options` | `[{ value, label }]`. With `src`, only the labels of the selected values, so "Acme Ltd" (not 42) shows before any search. |
| `v-model` | The value, or `null`. With `multiple`, an array. Without v-model (Inertia's `<Form>`), pass `model-value` as the starting value. |
| `name` / `form` | Field name, and the id of a form elsewhere on the page. |
| `multiple` | Pick several. The panel stays open while picking; the trigger lists them, with a count from two. A clear button sits beside the trigger. |
| `searchable` | Show the search box. It shows anyway over 12 options, or with `src` or `create`; `:searchable="false"` hides it. |
| `src` | Search on the server. A URL gets `GET src?q=…` by `fetch`, with the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`, and must answer `[{ value, label }]`. Or a function `(q) => Promise<[{ value, label }]>`. Debounced 250ms; older answers are dropped. Opening asks for `q=` empty, so answer with something useful (recent or first few). Limit the rows on the server (`->limit(20)`): the panel shows all it gets. |
| `create` | Offers "Add “xyz”" when no result matches exactly, ignoring case. A URL gets `POST create` with `{ label }` and must answer `{ value, label }`, which is selected. A 422 shows `errors.label[0]` (or `message`) in the panel. Or a function `(label) => Promise<{ value, label }>`; a rejection's message shows. The server decides whether to create or return an existing record, and checks permission. |
| `max` | With `multiple`, disables the rest once this many are picked. Say so in a `.hint`. |
| `required` | Sets `aria-required` only. Validate on the server and show its `.error`. |
| `disabled` | Cannot open; nothing is submitted. |
| `autofocus` | Focuses the trigger on load. |

After mount:

- **v-model** changes: the trigger follows, the hidden select is rewritten and fires `change`.
- **`options`** change: labels are added to what it already knows and never dropped, so a selected value keeps its label after a search or an options swap. A selected value missing from the new options stays selected.
- **The reset point** is the value at mount: it is written into the hidden select's `defaultSelected`, so a native or `<Form>` reset goes back to it. With `useForm`, `reset()` goes through v-model to the form's defaults, whatever they are now.
- **`src`** and **`create`** are read on each search and add, so swapping them (a different customer's contacts) applies to the next keystroke.
- It takes no `errors`: Field passes `aria-invalid` and the message for it.

- `aria-*` attributes (`aria-describedby`, `aria-invalid`) go on the trigger; everything else, `class="w-64"` and listeners such as `@change`, on the wrapper. The width is `12rem` unless a utility changes it.
- A native form reset, Inertia's `reset()` and `reset("field")` put the starting value back, and the trigger follows at once. Inertia's `<Form>` sees changes (`isDirty`).
- A picked value that is no longer in `options` stays picked, and with `multiple` it is listed first in the panel so it can be unticked.
- `Field.vue` renders it with `type="combobox"`, and DataTable's `multiple` filters use it.
- Keyboard: on the trigger, Down, Up, Enter or Space opens it. Without search, arrows, Home and End move, Enter or Space picks and typing jumps to a label. With search, typing filters, arrows move, Enter picks; Home and End move the caret. Escape closes, Tab leaves.
- Semantics: the trigger is a `combobox` whose value is its text. Without search it controls a `listbox` (select-only combobox, `aria-multiselectable` with `multiple`); with search it opens a dialog in which the search box is the `combobox` for the `listbox`, with `aria-activedescendant`.
- Laravel endpoint for `src`: `Customer::where('name', 'like', "%{$request->q}%")->orderBy('name')->limit(20)->get()->map(fn ($c) => ['value' => $c->id, 'label' => $c->name])`.
