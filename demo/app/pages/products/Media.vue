<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Head, useForm, useHttp } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";
import FileInput from "@ui/FileInput.vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps({
  product: { type: Object, required: true },
  // the selected tags as [{ value, label }], so the combobox can name them before any search
  tags: { type: Array, required: true },
});

// Tags: a form like any other. The combobox searches /tags and creates through POST /tags.
const form = useForm({ tag_ids: props.product.tag_ids });
const saveTags = () => form.put(`/products/${props.product.id}/tags`, { preserveScroll: true });

// Photos: each file uploads as it is added, one request per file, so each has its own progress and errors.
const photos = ref([]);
const uploads = reactive(new Map()); // File → { percent, id, error, request }

watch(photos, (now, before = []) => {
  for (const file of now) if (!uploads.has(file)) upload(file);
  for (const file of before) if (!now.includes(file)) remove(file);
});

function upload(file) {
  const state = reactive({ percent: 0, id: null, error: null, request: useHttp({ photo: file }) });
  uploads.set(file, state);
  state.request.post(`/products/${props.product.id}/photos`, {
    onProgress: (event) => (state.percent = event.percentage),
    onSuccess: (photo) => (state.id = photo.id),
    onError: (errors) => (state.error = errors.photo),
    onFinish: () => (state.percent = null),
  }).catch(() => (state.error ??= "The upload failed. Remove the file and try again.")); // a 422 resolves; this is a 500 or no network (or a cancel, whose file has gone)
}

function remove(file) {
  const state = uploads.get(file);
  uploads.delete(file);
  if (state?.id) useHttp({}).delete(`/photos/${state.id}`);
  else state?.request.cancel();
}

// FileInput takes progress by position, and errors as `photos.0`, `photos.1`… by position
const progress = computed(() => photos.value.map((file) => uploads.get(file)?.percent ?? null));
const errors = computed(() => Object.fromEntries(
  photos.value.flatMap((file, i) => (uploads.get(file)?.error ? [[`photos.${i}`, uploads.get(file).error]] : [])),
));
const uploading = computed(() => progress.value.filter((p) => p != null).length);
</script>

<template>
  <Head :title="`Tags and photos · ${product.name}`" />
  <AppLayout :breadcrumb="[{ label: 'Products', href: '/products' }, { label: product.name, href: `/products/${product.id}/edit` }, { label: 'Tags and photos' }]">
    <div class="flex flex-col gap-gap">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight break-words">Tags and photos</h1>
        <p class="mt-1 text-sm muted">{{ product.name }} · SKU {{ product.sku }}</p>
      </div>

      <div class="grid items-start gap-gap lg:grid-cols-2">
        <form class="card" @submit.prevent="saveTags">
          <h2 class="text-lg font-semibold">Tags</h2>
          <Field v-model="form.tag_ids" name="tag_ids" label="Tags" type="combobox" multiple :max="5"
              src="/tags" create="/tags" :options="tags" :errors="form.errors" hint="Up to five. Type to search, or add a new one." />
          <div class="flex items-center justify-end gap-2">
            <p class="me-auto text-sm" role="status">{{ form.recentlySuccessful ? "Saved." : "" }}</p>
            <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save tags</button>
          </div>
        </form>

        <section class="card" aria-labelledby="photos-heading">
          <h2 id="photos-heading" class="text-lg font-semibold">Photos</h2>
          <div class="field">
            <label for="photos">Add photos</label>
            <FileInput v-model="photos" id="photos" name="photos" accept="image/*" multiple :progress="progress" :errors="errors">
              <span>PNG or JPEG, up to 5 MB each. Each one uploads as you add it.</span>
            </FileInput>
          </div>
          <p class="text-sm muted" role="status">{{ uploading ? `Uploading ${uploading} of ${photos.length}…` : "" }}</p>
        </section>
      </div>
    </div>
  </AppLayout>
</template>
