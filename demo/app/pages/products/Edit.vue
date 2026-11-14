<script setup>
import { nextTick, onMounted, ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import { CircleAlert, Trash2, Upload } from "@lucide/vue";
import ConfirmDialog from "@ui/ConfirmDialog.vue";
import Field from "@ui/Field.vue";
import LocalDate from "@ui/LocalDate.vue";
import PageHeading from "@ui/PageHeading.vue";
import { useSaveStatus } from "@ui/useSaveStatus";
import { useUnsavedChanges } from "@ui/useUnsavedChanges";
import AppLayout from "@/layouts/AppLayout.vue";

const props = defineProps({
  product: { type: Object, required: true },
  categories: { type: Array, required: true },
  statuses: { type: Array, required: true },
});

// the defaults are the saved record; Discard goes back to them, and a successful save makes the saved data the new defaults
const form = useForm({
  name: props.product.name,
  sku: props.product.sku,
  category: props.product.category,
  price: props.product.price,
  stock: props.product.stock,
  status: props.product.status,
  description: props.product.description,
});
const { allowLeaving } = useUnsavedChanges(form);

// the way back is the list as it was left: its search, filters, sort and page, which the list page keeps for the tab
const listHref = ref("/products");
onMounted(() => {
  try {
    listHref.value += sessionStorage.getItem("products:list-query") ?? "";
  } catch {
    // the list as it starts
  }
});

// a failed save focuses the error summary: it is read out, and Tab goes on to the first field
const summary = ref();
// Save on an unchanged form sends nothing and says so, as Save stays enabled
const { saveStatus, noteNothingToSave } = useSaveStatus(form);
const save = () => {
  if (!form.isDirty) return noteNothingToSave();
  const sent = form.data();
  form.put(`/products/${props.product.id}`, {
    preserveScroll: true,
    // what was sent is what was saved: anything typed while the save was under way stays unsaved
    onSuccess: () => JSON.stringify(form.data()) !== JSON.stringify(sent) && form.defaults(sent),
    onError: () => nextTick(() => summary.value.focus()),
  });
};
const discard = () => {
  form.reset();
  form.clearErrors();
};

// deleting the record ends the form's need: the guard lets that visit go, and the server lands on the list
const deleting = useForm({});
const destroy = () => deleting.delete(`/products/${props.product.id}`, { onBefore: allowLeaving });

const statusClass = { Active: "soft success dot", Draft: "soft dot", Archived: "outlined dot" };
</script>

<template>
  <Head :title="product.name" />
  <AppLayout>
    <PageHeading :title="product.name" :breadcrumb="[{ label: 'Products', href: listHref }, { label: product.name }]">
      <template #badges><span class="badge" :class="statusClass[product.status]">{{ product.status }}</span></template>
      <p class="mt-1 text-sm muted">SKU {{ product.sku }} · {{ product.category }} · Updated <LocalDate :value="product.updated_at" in-sentence /></p>
      <template #actions>
        <Link :href="`/products/${product.id}/media`" class="btn outlined"><Upload class="size-4" aria-hidden="true" /> Tags and photos</Link>
      </template>
    </PageHeading>

    <div class="grid items-start gap-gap @4xl/page:grid-cols-3">
      <form class="flex min-w-0 flex-col gap-gap @4xl/page:col-span-2" novalidate @submit.prevent="save">
        <div v-if="form.hasErrors" ref="summary" class="alert danger" role="alert" tabindex="-1">
          <CircleAlert class="size-4" aria-hidden="true" />
          <h2>The product was not saved</h2>
          <ul class="list-disc ps-5">
            <li v-for="(message, field) in form.errors" :key="field">{{ message }}</li>
          </ul>
        </div>

        <section class="card divided" aria-labelledby="product-heading">
          <header>
            <h2 id="product-heading">Product</h2>
            <p>What the shop shows, and what it sells it for.</p>
          </header>
          <div class="grid gap-x-gap gap-y-4 @3xl/page:grid-cols-2">
            <Field v-model="form.name" name="name" :errors="form.errors" required class="@3xl/page:col-span-2" />
            <Field v-model="form.sku" name="sku" label="SKU" :errors="form.errors" required />
            <Field v-model="form.category" name="category" type="select" :options="categories" :errors="form.errors" required />
            <Field v-model="form.price" name="price" inputmode="decimal" prepend="£" :errors="form.errors" required />
            <Field v-model="form.stock" name="stock" type="number" step="1" min="0" hint="Units on the shelf." :errors="form.errors" required />
            <Field v-model="form.status" name="status" type="select" :options="statuses" :errors="form.errors" />
            <Field v-model="form.description" name="description" type="textarea" rows="4" :errors="form.errors" class="@3xl/page:col-span-2" />
          </div>
        </section>

        <div class="save-bar">
          <p role="status">{{ saveStatus }}</p>
          <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="discard">Discard</button>
          <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save changes</button>
        </div>
      </form>

      <aside aria-label="About this product" class="flex min-w-0 flex-col gap-gap @4xl/page:sticky @4xl/page:top-gap">
        <section class="card divided" aria-labelledby="stock-heading">
          <header><h2 id="stock-heading">Stock</h2></header>
          <p class="text-3xl font-semibold tracking-tight tabular-nums">
            {{ product.stock }} <span class="text-sm font-normal tracking-normal muted">{{ product.stock === 1 ? "unit" : "units" }} on the shelf</span>
          </p>
        </section>

        <section class="card divided" aria-labelledby="delete-heading">
          <header><h2 id="delete-heading">Delete product</h2></header>
          <p class="text-sm muted">It goes from the shop and the list at once, with its tags and photos. This can't be undone.</p>
          <button type="button" class="btn outlined danger justify-center" command="show-modal" commandfor="delete-product"><Trash2 class="size-4" aria-hidden="true" /> Delete product</button>
        </section>
      </aside>
    </div>

    <ConfirmDialog id="delete-product" class="[&_h2]:wrap-anywhere" :title="`Delete ${product.name}?`" description="It goes from the shop at once. This can't be undone."
        confirm-label="Delete product" tone="danger" :busy="deleting.processing" @confirm="destroy" />
  </AppLayout>
</template>
