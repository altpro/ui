<!--
  <FileInput v-model="form.photos" name="photos" accept="image/*" multiple :errors="form.errors" :progress="progress" />
  A drop zone round a native file input, and the list of chosen files with previews and remove buttons.
  It never uploads: v-model is the File (an array of them when `multiple`), and the app sends them.
  Choosing or dropping more adds to the list when `multiple`, and replaces the file when not.
  The native input is kept holding the same files, so a plain form post, `required` and Inertia's <Form> see them,
  and it fires `change` after a drop, a remove or a pick added to the list.
  `accept` filters dropped files as the picker does; the rest are named in an error and left out.
  `progress` is an array of 0 to 100 by position in v-model; null shows no bar.
  Errors take a string, an array, or Laravel's errors object: `photos` shows under the zone and `photos.1` on the
  second file. Per-file errors stay with their file when another is removed.
  `class` lands on the .dropzone, every other attribute on the input. The default slot adds a line to the zone.
  A form reset (native or Inertia's <Form>) empties the list and v-model.
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useId, watch } from "vue";
import { onFormReset } from "./domModel.js";

defineOptions({ inheritAttrs: false });
const model = defineModel({ default: null });
const props = defineProps({
  name: String,
  accept: String,
  multiple: Boolean,
  disabled: Boolean,
  errors: [String, Array, Object],
  progress: Array,
  id: String,
});
const attrs = useAttrs();
const uid = useId();
const id = computed(() => props.id ?? uid);
const root = ref(), input = ref(), dragging = ref(false), rejected = ref([]);

const files = computed(() => [model.value ?? []].flat());
// own: the change is the component's (a pick, drop or remove), so the write announces itself
let own = false;
const set = (list) => {
  own = true;
  model.value = props.multiple ? list : list[0] ?? null;
};

// the browser's own reading of accept: extensions, exact types and type/* wildcards
const accepts = (file) => !props.accept || props.accept.split(",").map((a) => a.trim().toLowerCase()).some((a) =>
  a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a);
const add = (list) => {
  if (props.disabled) return;
  list = [...list];
  rejected.value = list.filter((f) => !accepts(f)).map((f) => f.name);
  const ok = list.filter(accepts);
  if (ok.length) set(props.multiple ? [...files.value, ...ok] : ok);
  else write(files.value, true); // the picker replaced the input's files with nothing usable
};
const drop = (e) => {
  dragging.value = false;
  add(e.dataTransfer.files);
};
const remove = async (i) => {
  set(files.value.filter((_, j) => j !== i));
  await nextTick();
  const buttons = root.value.querySelectorAll("li button");
  (buttons[Math.min(i, buttons.length - 1)] ?? input.value).focus();
};

// Setting files fires no event, so after its own changes the component sends the change a pick would have,
// for Inertia's <Form> dirty state and @change listeners. The browser's change for a pick came before the merge.
let announcing = false;
const write = (list, announce) => {
  const el = input.value;
  if (list.length === el.files.length && list.every((f, i) => f === el.files[i])) return;
  const dt = new DataTransfer();
  list.forEach((f) => dt.items.add(f));
  el.files = dt.files;
  announcing = announce;
  if (announce) el.dispatchEvent(new Event("change", { bubbles: true }));
  announcing = false;
};
// on mount as well, so a file passed in at the start is in the input too
onMounted(() => write(files.value));
watch(files, (list) => {
  write(list, own);
  own = false;
}, { flush: "post" });
// a reset empties the input, so the list and v-model follow, with or without v-model
onFormReset(root, () => {
  rejected.value = [];
  if (!input.value.files.length) set([]);
});

// object URLs for image previews, revoked once their file leaves the list
const urls = new Map();
const preview = (f) => {
  if (!f.type.startsWith("image/")) return null;
  if (!urls.has(f)) urls.set(f, URL.createObjectURL(f));
  return urls.get(f);
};
const revoke = (keep = []) => urls.forEach((url, f) => keep.includes(f) || (URL.revokeObjectURL(url), urls.delete(f)));
watch(files, (list) => revoke(list));
onBeforeUnmount(() => revoke());

const key = computed(() => props.name?.replace(/\[\]$/, "").replaceAll("[", ".").replaceAll("]", "") ?? "");
const bag = computed(() => (props.errors && typeof props.errors === "object" && !Array.isArray(props.errors) ? props.errors : null));
const messages = computed(() => [...new Set([bag.value ? bag.value[key.value] ?? [] : props.errors ?? []].flat(Infinity))]);
// per-file errors arrive by position; tie them to the file then, so removing one does not shift the rest
const fileErrors = shallowRef(new Map());
watch(bag, (b) => (fileErrors.value = new Map(files.value.map((f, i) => [f, [b?.[`${key.value}.${i}`] ?? []].flat()]))), { immediate: true, deep: true });

const size = (bytes) => (bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} kB` : `${(bytes / 1e6).toFixed(1)} MB`);
const describedby = computed(() => [attrs["aria-describedby"], messages.value.length && `${id.value}-error`].filter(Boolean).join(" ") || null);
const control = () => {
  const { class: _, ...rest } = attrs;
  return rest;
};
</script>

<template>
  <div ref="root" class="dropzone" :class="[$attrs.class, { dragging }]" @dragover.prevent="dragging = !disabled" @dragleave="dragging = false" @drop.prevent="drop">
    <label>
      <input ref="input" v-bind="control()" type="file" :id="id" :name="name && multiple ? `${name.replace(/\[\]$/, '')}[]` : name" :accept="accept" :multiple="multiple" :disabled="disabled" :aria-invalid="messages.length ? 'true' : null" :aria-describedby="describedby" @change="announcing || add($event.target.files)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>
      <span><strong>{{ multiple ? "Choose files" : "Choose a file" }}</strong> or drop {{ multiple ? "them" : "it" }} here</span>
      <slot />
    </label>
    <ul v-if="files.length">
      <li v-for="(f, i) in files" :key="f">
        <img v-if="preview(f)" :src="preview(f)" alt="">
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
        <div>
          <span>{{ f.name }}</span>
          <span>{{ size(f.size) }}</span>
          <progress v-if="progress?.[i] != null" class="progress sm" :value="progress[i]" max="100" :aria-label="`Uploading ${f.name}`"></progress>
          <p v-for="m in fileErrors.get(f)" :key="m" class="error">{{ m }}</p>
        </div>
        <button type="button" class="btn ghost sm px-2" :disabled="disabled" :aria-label="`Remove ${f.name}`" @click="remove(i)">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </li>
    </ul>
    <p v-if="rejected.length" class="error" role="alert">Not an accepted file type: {{ rejected.join(", ") }}.</p>
    <p v-if="messages.length === 1" class="error" :id="`${id}-error`">{{ messages[0] }}</p>
    <ul v-else-if="messages.length" class="error" :id="`${id}-error`">
      <li v-for="m in messages" :key="m">{{ m }}</li>
    </ul>
  </div>
</template>
