<script setup>
import { computed, reactive, ref, nextTick } from 'vue';
import Field from '@ui/Field.vue';
import FileInput from '@ui/FileInput.vue';
import Icon from './Icon.vue';
import { categories } from './store.js';
const emit = defineEmits(['save']);
const dialog = ref();
const draft = reactive({});
const files = ref(null);
const saving = ref(false);
const imageError = computed(() => files.value?.size > 1024 * 1024 ? "Choose an image smaller than 1 MB." : "");
const creating = ref(false);
function open(product, create = false) {
  creating.value = create || !product;
  Object.keys(draft).forEach(key => delete draft[key]);
  Object.assign(draft, product ? structuredClone(JSON.parse(JSON.stringify(product))) : { name: '', subtitle: '', description: '', category: 'Headphones', kind: 'headphones', sku: '', price: 149, cost: 60, stock: 0, status: 'Draft', finish: 'Slate', tags: [], variants: [] });
  files.value = null;
  nextTick(() => dialog.value.showModal());
}
async function save() {
  if (imageError.value) return;
  saving.value = true;
  const product = JSON.parse(JSON.stringify(draft));
  if (files.value) product.image = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(files.value);
  });
  emit('save', product); saving.value = false; dialog.value.close();
}
defineExpose({ open });
</script>
<template>
  <dialog ref="dialog" class="dialog drawer divided demo-editor" aria-labelledby="product-editor-title">
    <header><hgroup><p>{{ creating ? 'Grow your collection' : 'Product information' }}</p><h2 id="product-editor-title">{{ creating ? 'Add product' : 'Edit product' }}</h2></hgroup><button class="btn ghost sm" aria-label="Close product editor" @click="dialog.close()"><Icon name="x"/></button></header>
    <form @submit.prevent="save" class="space-y-5">
      <Field v-model="draft.name" name="name" label="Product name" required maxlength="100" placeholder="e.g. Arc headphones"/>
      <Field v-model="draft.subtitle" name="subtitle" label="Short description" maxlength="140"/>
      <div class="grid grid-cols-2 gap-4"><Field v-model="draft.category" name="category" type="select" :options="categories"/><Field v-model="draft.sku" name="sku" label="SKU" required/></div>
      <Field v-model="draft.description" name="description" type="textarea" label="Description" rows="5"/>
      <Field v-model="draft.tags" name="tags" label="Tags" type="combobox" multiple :options="['Wireless', 'Analog', 'Bestseller', 'New arrival', 'Studio', 'Coming soon']" hint="Help your team organise the collection."/>
      <div class="field"><label for="product-photo">Product image</label><FileInput id="product-photo" v-model="files" name="photo" accept="image/*" :errors="imageError || undefined"><span>Choose an image up to 1 MB to preview on this product.</span></FileInput></div>
      <template v-if="creating"><div class="grid grid-cols-2 gap-4"><Field v-model="draft.price" name="price" label="Retail price" type="number" min="0" step="0.01" prepend="£" required/><Field v-model="draft.stock" name="stock" label="Stock" type="number" min="0" step="1" required/></div></template>
      <div class="demo-form-footer"><button type="button" class="btn outlined" @click="dialog.close()">Cancel</button><button class="btn primary" :disabled="saving || !!imageError" :class="{ loading: saving }" :aria-busy="saving">{{ creating ? 'Add product' : 'Save changes' }}</button></div>
    </form>
  </dialog>
</template>
