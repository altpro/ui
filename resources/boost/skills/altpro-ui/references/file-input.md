# File input and drop zone: `FileInput.vue` `.dropzone`

A drop zone round a native file input, then a list of the chosen files: name, size, an image preview, a remove button, and the app's progress and errors per file. Vue only; in Blade use `<input type="file" class="input">` (or `<x-ui::field type="file">`). It never uploads: the app sends the files from v-model and passes back progress and errors.

```vue
<script setup>
import { computed } from "vue";
import { useForm } from "@inertiajs/vue3";
import FileInput from "@ui/FileInput.vue";

const props = defineProps({ product: { type: Object, required: true } });
const form = useForm({ photos: [] });
// one request carries every file, so each shows the request's progress while it runs
const progress = computed(() => form.photos.map(() => form.progress?.percentage ?? null));
const upload = () => form.post(`/products/${props.product.id}/photos`, { onSuccess: () => form.reset() });
</script>

<template>
  <form class="flex flex-col gap-4" @submit.prevent="upload">
    <div class="field">
      <label for="photos">Photos</label>
      <FileInput v-model="form.photos" id="photos" name="photos" accept="image/*" multiple :errors="form.errors" :progress="progress">
        <span>PNG or JPEG, up to 5 MB each.</span>
      </FileInput>
    </div>
    <div><button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Upload</button></div>
  </form>
</template>
```

| Prop | |
|------|-|
| `v-model` | The chosen `File`, or an array of them with `multiple`. With `multiple`, choosing or dropping more adds to the list; without, a new file replaces the old one. |
| `accept` `multiple` `disabled` | As on the native input. `accept` also filters dropped files; refused ones are named in an alert and left out. |
| `errors` | A string or array for the whole field, or Laravel's errors object: `photos` shows under the zone, `photos.1` on the second file. A file's errors stay with it when another file is removed. |
| `progress` | Array of 0 to 100 by position in v-model; `null` (or a short array) shows no bar for that file. Draws a `.progress sm`. |
| `name` `id` | On the input. With `multiple` the name gets `[]` (`photos[]`), so a plain post or `<Form>` sends every file rather than PHP keeping the last. `name` also picks the errors. |
| default slot | An extra line inside the zone: limits, formats. |

After mount:

- **v-model** set from outside (`form.photos = []`, `reset()`): the list and the native input follow; previews of files that left are revoked.
- **`errors`** change, including an in-place `setError`: `photos` shows at once; `photos.1` is tied to whichever file is second at that moment, then stays with that file when others are removed.
- **`progress`** is read by position on every render; keep it in step with v-model when files are removed.
- **A form reset**, native or `<Form>`, empties the list and v-model even with v-model, since a file input cannot be written back. `useForm`'s `reset()` sets v-model to its default, normally `null` or `[]`.

- The native input covers the zone, invisible: click, Enter or Space opens the picker, and screen readers get the browser's file button. Dropping is the extra. The zone is a `<label>`, so the input is named by it and by any `<label for>` outside.
- The native input always holds the same files as v-model, from mount on, so `required`, a plain form post and Inertia's `<Form>` work. After a drop, a remove, or a pick added to the list, it fires `change` on the input, so `<Form>`'s `isDirty` and `@change` listeners see the files it ends up with. Setting v-model from outside fires nothing.
- A form reset, native or Inertia's `<Form>`, empties the list and v-model as it empties the input. Vue's `<Field type="file">` does the same.
- Image previews are object URLs, revoked when their file is removed or the component unmounts.
- Removing a file moves focus to the next remove button, or back to the zone.
- `class` lands on the `.dropzone`; every other attribute (`required`, `aria-describedby`, `form`) on the input.
- Uploading as files are added (a CMS media library): watch v-model, send each new file, and build `progress` from your own per-file state, e.g. `photos.map((f) => percent.get(f))`.

Custom properties, on the `.dropzone`: `--dropzone-border` (the dashed edge at rest; hover and invalid replace it), `--dropzone-ring` (focus and drag-over; invalid makes it danger), `--dropzone-radius` (the zone and each file row; `--radius` capped at 1rem).
