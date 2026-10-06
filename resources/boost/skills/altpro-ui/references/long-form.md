# Long form (pattern)

No class. A form longer than a screen is split into sections. Each section is a `<fieldset>` whose `<legend>` holds the section's `h2`, so screen readers announce the group name on entering it and list the heading among the page's headings. The [save bar](save-bar.md) is the form's last child. A form of a handful of fields needs no sections.

```vue
<!-- resources/js/pages/customers/Edit.vue -->
<script setup>
import { useForm } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";

const props = defineProps({
  customer: { type: Object, required: true },
  countries: { type: Array, required: true },
});

const form = useForm({
  name: props.customer.name,
  email: props.customer.email,
  phone: props.customer.phone,
  address_line_1: props.customer.address_line_1,
  address_line_2: props.customer.address_line_2,
  city: props.customer.city,
  postcode: props.customer.postcode,
  country: props.customer.country,
  newsletter: props.customer.newsletter,
});

const save = () => form.put(`/customers/${props.customer.id}`, { preserveScroll: true });
const discard = () => {
  form.reset();
  form.clearErrors();
};
</script>

<template>
  <div class="flex flex-col gap-gap">
    <h1 class="text-2xl font-semibold tracking-tight break-words">{{ customer.name }}</h1>

    <form class="flex max-w-3xl flex-col gap-2gap" novalidate @submit.prevent="save">
      <fieldset class="min-w-0">
        <legend><h2 class="text-lg font-semibold">Contact</h2></legend>
        <div class="mt-4 grid gap-x-gap gap-y-4 sm:grid-cols-2">
          <Field v-model="form.name" name="name" :errors="form.errors" required autocomplete="name" class="sm:col-span-2" />
          <Field v-model="form.email" name="email" type="email" :errors="form.errors" required autocomplete="email" />
          <Field v-model="form.phone" name="phone" type="tel" :errors="form.errors" autocomplete="tel" />
        </div>
      </fieldset>

      <fieldset class="min-w-0" aria-describedby="address-hint">
        <legend><h2 class="text-lg font-semibold">Address</h2></legend>
        <p id="address-hint" class="mt-1 text-sm muted">Where orders are delivered.</p>
        <div class="mt-4 grid gap-x-gap gap-y-4 sm:grid-cols-2">
          <Field v-model="form.address_line_1" name="address_line_1" label="Address line 1" :errors="form.errors" required autocomplete="address-line1" class="sm:col-span-2" />
          <Field v-model="form.address_line_2" name="address_line_2" label="Address line 2" :errors="form.errors" autocomplete="address-line2" class="sm:col-span-2" />
          <Field v-model="form.city" name="city" label="Town or city" :errors="form.errors" required autocomplete="address-level2" />
          <Field v-model="form.postcode" name="postcode" :errors="form.errors" required autocomplete="postal-code" />
          <Field v-model="form.country" name="country" type="select" :options="countries" :errors="form.errors" required autocomplete="country" />
        </div>
      </fieldset>

      <fieldset class="min-w-0">
        <legend><h2 class="text-lg font-semibold">Preferences</h2></legend>
        <div class="mt-4">
          <Field v-model="form.newsletter" name="newsletter" type="checkbox" label="Send the monthly newsletter" :errors="form.errors" />
        </div>
      </fieldset>

      <div class="sticky bottom-0 z-10 -mx-gap flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-gap py-3">
        <p class="me-auto text-sm" role="status">{{ form.isDirty ? "Unsaved changes" : form.recentlySuccessful ? "Saved." : "" }}</p>
        <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="discard">Discard</button>
        <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
      </div>
    </form>
  </div>
</template>
```

The controller and form request follow the edit page in [recipes.md](recipes.md). A Blade form has the same sections with `<x-ui::field>` inside:

```blade
<fieldset class="min-w-0">
  <legend><h2 class="text-lg font-semibold">Contact</h2></legend>
  <div class="mt-4 grid gap-x-gap gap-y-4 sm:grid-cols-2">
    <x-ui::field name="name" :value="$customer->name" required autocomplete="name" class="sm:col-span-2" />
    <x-ui::field name="email" type="email" :value="$customer->email" required autocomplete="email" />
    <x-ui::field name="phone" type="tel" :value="$customer->phone" autocomplete="tel" />
  </div>
</fieldset>
```

- The legend holds the `h2`; do not put a second heading above the fieldset. The headings follow the scale in SKILL.md: the page's `h1`, then one `h2` per section.
- `min-w-0` on every section fieldset: a fieldset will not shrink below its content otherwise, and a long value pushes it wider than a phone.
- A fieldset ignores `gap` for its legend, so the space under the legend is `mt-*` on the next element, not `gap` on the fieldset. Sections are spaced by `gap-2gap` on the form, not `space-y-*` (a dialog in a `space-y-*` parent does not centre).
- A section description is a `<p class="text-sm muted">` straight after the legend, tied to the fieldset with `aria-describedby`.
- `disabled` on a section's fieldset disables every control in it, and each `.field` dims its label.
- A one-question group (radios, a set of checkboxes) is a `<fieldset class="field">` with a plain `<legend>` instead, inside a section: see [check.md](check.md). A `Field` with `type="radio"` writes it.
- A setting that applies the moment it is switched goes outside the form as a switch that saves itself ([check.md](check.md)); a checkbox inside the form waits for Save.
