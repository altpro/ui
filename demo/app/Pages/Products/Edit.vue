<script setup>
import { Link, useForm } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";
import Icon from "../../Icon.vue";

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

const save = () => form.put(`/products/${props.product.id}`, { preserveScroll: true });
const discard = () => {
  form.reset();
  form.clearErrors();
};
const statusClass = { Active: "success", Draft: "", Archived: "outlined" };
const updated = (timestamp) => new Date(timestamp).toLocaleDateString(document.documentElement.lang, { day: "numeric", month: "short", year: "numeric" });
</script>

<template>
  <div class="space-y-gap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Dashboard</Link>
      <Link href="/products">Products</Link>
      <span aria-current="page">{{ product.name }}</span>
    </nav>

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 class="text-2xl font-semibold tracking-tight break-words">{{ product.name }}</h1>
          <span class="badge" :class="statusClass[product.status]">{{ product.status }}</span>
        </div>
        <p class="mt-1 text-sm muted">SKU {{ product.sku }} · {{ product.category }} · Updated <time :datetime="product.updated_at">{{ updated(product.updated_at) }}</time></p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Link :href="`/products/${product.id}/media`" class="btn outlined"><Icon name="upload" /> Tags and photos</Link>
      </div>
    </div>

    <form class="grid max-w-3xl gap-x-gap gap-y-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <Field v-model="form.name" name="name" :errors="form.errors" required class="sm:col-span-2" />
      <Field v-model="form.sku" name="sku" label="SKU" :errors="form.errors" required />
      <Field v-model="form.category" name="category" type="select" :options="categories" :errors="form.errors" required />
      <Field v-model="form.price" name="price" type="number" prepend="£" step="0.01" min="0" :errors="form.errors" required />
      <Field v-model="form.stock" name="stock" type="number" step="1" min="0" hint="Units on the shelf." :errors="form.errors" required />
      <Field v-model="form.status" name="status" type="select" :options="statuses" :errors="form.errors" />
      <Field v-model="form.description" name="description" type="textarea" rows="4" :errors="form.errors" class="sm:col-span-2" />

      <div class="sticky bottom-0 z-10 col-span-full -mx-gap flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-gap py-3">
        <p class="me-auto text-sm" role="status">{{ form.isDirty ? "Unsaved changes" : form.recentlySuccessful ? "Saved." : "" }}</p>
        <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="discard">Discard</button>
        <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
      </div>
    </form>
  </div>
</template>
