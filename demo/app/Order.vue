<!-- The order edit page. `form` has the shape of Inertia's useForm without Inertia: lines as v-model,
     errors keyed by position (`lines.0.qty`), and processing while it saves. save() stands in for the server. -->
<script setup>
import { computed, reactive, ref } from "vue";
import Field from "../../resources/js/Field.vue";
import Repeater from "../../resources/js/Repeater.vue";

const products = [
  { id: 1, name: "Paracetamol 500mg · 16 tablets", price: 0.65, stock: 40 },
  { id: 2, name: "Ibuprofen 200mg · 16 tablets", price: 0.85, stock: 12 },
  { id: 3, name: "Cetirizine 10mg · 30 tablets", price: 3.99, stock: 2 },
  { id: 4, name: "Vitamin D 1000IU · 90 tablets", price: 5.49, stock: 25 },
];
const form = reactive({
  lines: [{ product_id: 1, qty: 2 }, { product_id: 3, qty: 5 }, { product_id: 2, qty: 1 }],
  errors: {},
  processing: false,
});
const saved = ref("");

const money = (n) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
const product = (line) => products.find((p) => p.id === Number(line.product_id));
const lineTotal = (line) => (product(line)?.price ?? 0) * (Number(line.qty) || 0);
const total = computed(() => form.lines.reduce((sum, line) => sum + lineTotal(line), 0));

// Laravel's validation, as a 422 would return it: a new errors object keyed by position
function save() {
  form.processing = true;
  saved.value = "";
  setTimeout(() => {
    const errors = {};
    if (!form.lines.length) errors.lines = "Add at least one line.";
    form.lines.forEach((line, i) => {
      const p = product(line);
      if (!p) errors[`lines.${i}.product_id`] = "Choose a product.";
      if (!Number.isInteger(line.qty) || line.qty < 1) errors[`lines.${i}.qty`] = "The quantity must be at least 1.";
      else if (p && line.qty > p.stock) errors[`lines.${i}.qty`] = `Only ${p.stock} in stock.`;
    });
    form.errors = errors;
    form.processing = false;
    if (!Object.keys(errors).length) saved.value = "Order saved.";
  }, 400);
}
</script>

<template>
  <form class="grid gap-gap xl:grid-cols-[minmax(0,1fr)_19rem]" novalidate @submit.prevent="save">
    <section class="min-w-0 space-y-4" aria-labelledby="lines-title">
      <div><h2 id="lines-title" class="text-lg font-semibold">Lines</h2><p class="mt-1 text-sm muted">What the customer is sent, in picking order.</p></div>
      <Repeater v-model="form.lines" name="lines" item="line" :make="() => ({ product_id: '', qty: 1 })" :errors="form.errors" :disabled="form.processing" v-slot="{ row, index, errors }">
        <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem_6rem]">
          <Field v-model="row.product_id" :name="`lines.${index}.product_id`" label="Product" type="select" :options="products" placeholder="Choose a product" :errors="errors" />
          <Field v-model="row.qty" :name="`lines.${index}.qty`" label="Quantity" type="number" min="1" step="1" :hint="product(row) ? `${money(product(row).price)} each` : null" :errors="errors" />
          <div class="text-sm sm:text-right"><p class="font-medium">Line total</p><p class="mt-2 tabular-nums">{{ money(lineTotal(row)) }}</p></div>
        </div>
      </Repeater>
    </section>
    <div class="space-y-4">
      <section class="card divided">
        <header><h2>Summary</h2></header>
        <dl class="dl horizontal [--dl-gap:0.75rem] [--dl-label:6rem]">
          <div><dt>Customer</dt><dd class="text-end">Priya Shah</dd></div>
          <div><dt>Lines</dt><dd class="text-end tabular-nums">{{ form.lines.length }}</dd></div>
          <div class="font-semibold"><dt class="text-foreground">Total</dt><dd class="text-end tabular-nums">{{ money(total) }}</dd></div>
        </dl>
        <footer>
          <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save order</button>
          <p class="text-sm" role="status">{{ saved }}</p>
        </footer>
      </section>
    </div>
  </form>
</template>
