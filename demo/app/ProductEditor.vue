<script setup>
import { computed, reactive, ref, nextTick } from 'vue';
import Field from '@ui/Field.vue';
import FileInput from '@ui/FileInput.vue';
import Icon from './Icon.vue';
import { categories } from './store.js';
// checkSku answers with what to enter when the code is taken, or nothing
const props = defineProps({ checkSku: Function });
const emit = defineEmits(['save', 'leave']);
const skuError = ref('');
const dialog = ref();
const draft = reactive({});
const files = ref(null);
const saving = ref(false);
const imageError = computed(() => files.value?.size > 1024 * 1024 ? "Choose an image smaller than 1 MB." : "");
const creating = ref(false);
// a product with finishes (a duplicate) takes its price and stock from them
const hasFinishes = computed(() => draft.variants?.length > 0);
const comparable = () => JSON.stringify(draft, (key, v) => typeof v === 'number' ? String(v) : v);
let opened = '';
// the product's name as it was when the editor opened, over the title; a new product has none yet
const editingName = ref('');
// focus: a selector for the field the caller asked to edit, such as the description
function open(product, create = false, focus) {
  creating.value = create || !product;
  editingName.value = product?.name ?? '';
  Object.keys(draft).forEach(key => delete draft[key]);
  Object.assign(draft, product ? structuredClone(JSON.parse(JSON.stringify(product))) : { name: '', subtitle: '', description: '', category: 'Headphones', kind: 'headphones', sku: '', price: 149, cost: 60, stock: 0, status: 'Draft', finish: 'Slate', tags: [], variants: [] });
  files.value = null;
  skuError.value = '';
  opened = comparable();
  nextTick(() => { dialog.value.showModal(); dialog.value.querySelector(focus || '[name=name]')?.focus(); });
}
async function save() {
  if (imageError.value) return;
  // nothing to save, so nothing goes in the history
  if (!creating.value && clean()) return dialog.value.close();
  skuError.value = props.checkSku?.(draft.sku) ?? '';
  if (skuError.value) return void nextTick(() => dialog.value.querySelector('[name=sku]')?.focus());
  saving.value = true;
  const product = JSON.parse(JSON.stringify(draft));
  if (files.value) product.image = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(files.value);
  });
  emit('save', product); saving.value = false; dialog.value.close();
}
const clean = () => comparable() === opened && !files.value;
const requestClose = () => emit('leave', clean());
defineExpose({ open, dialog, clean });
</script>
<template>
  <dialog ref="dialog" class="dialog drawer divided demo-editor" aria-labelledby="product-editor-title" @cancel.prevent="requestClose">
    <header><hgroup><p>{{ creating ? 'New product' : editingName }}</p><h2 id="product-editor-title">{{ creating ? 'Add product' : 'Edit product' }}</h2></hgroup><button class="btn ghost sm" aria-label="Close product editor" @click="requestClose"><Icon name="x"/></button></header>
    <form id="product-form" @submit.prevent="save" class="space-y-5">
      <Field v-model="draft.name" name="name" label="Product name" required maxlength="100" placeholder="e.g. Arc headphones"/>
      <Field v-model="draft.subtitle" name="subtitle" label="Short description" maxlength="140"/>
      <div class="grid grid-cols-2 gap-4"><Field v-model="draft.category" name="category" type="select" :options="categories"/><Field v-model="draft.sku" name="sku" label="SKU" :errors="skuError || undefined" required/></div>
      <Field v-model="draft.description" name="description" type="textarea" label="Description" rows="5"/>
      <Field v-model="draft.tags" name="tags" label="Tags" type="combobox" multiple :options="['Wireless', 'Analog', 'Bestseller', 'New arrival', 'Studio', 'Coming soon']" hint="Help your team organise the collection."/>
      <div class="field"><label for="product-photo">Product image</label><FileInput id="product-photo" v-model="files" name="photo" accept="image/*" :errors="imageError || undefined"><span>Any image up to 1 MB.</span></FileInput></div>
      <template v-if="creating && !hasFinishes"><div class="grid grid-cols-2 gap-4"><Field v-model="draft.price" name="price" label="Retail price" type="number" min="0" step="0.01" prepend="£" required/><Field v-model="draft.stock" name="stock" label="Stock" type="number" min="0" step="1" required/></div></template>
    </form>
    <footer class="justify-end"><button type="button" class="btn outlined" @click="requestClose">Cancel</button><button form="product-form" class="btn primary" :disabled="saving || !!imageError" :class="{ loading: saving }" :aria-busy="saving">{{ creating ? 'Add product' : 'Save changes' }}</button></footer>
  </dialog>
</template>
