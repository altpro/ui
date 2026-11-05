<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Field from '@ui/Field.vue';
import Repeater from '@ui/Repeater.vue';
import ProductArt from './ProductArt.vue';
import ProductEditor from './ProductEditor.vue';
import Icon from './Icon.vue';
import { datePresets } from '@ui/dataTable';
import { store, money, categories, statusClass, record, resetWorkspace, daySales, day, shift } from './store.js';
const props = defineProps({ screen: String });
const editor = ref();
const pricing = ref();
const inventory = ref();
const variantDialog = ref();
const preview = ref();
const confirmation = ref();
const noteDialog = ref();
const query = ref('');
const category = ref('');
const stockFilter = ref(new URLSearchParams(location.search).get('stock') === 'low' ? 'low' : '');
const status = ref('All');
const sort = ref('name');
const mode = ref('table');
const pageNumber = ref(1);
const selected = ref([]);
const activeFinish = ref(0);
const angle = ref(0);
const activityType = ref('All');
const note = ref('');
const toast = ref('');
let toastTimer;
const editing = ref(null);
const priceDraft = reactive({ price: 0, cost: 0 });
const inventoryDraft = ref([]);
const inventoryErrors = ref({});
const makeFinish = () => ({ name: "", sku: "", stock: 0, price: product.value.price });
const variantDraft = reactive({ name: '', sku: '', price: 0, stock: 0 });
const variantIndex = ref(-1);
const pending = ref(null);
const productId = new URLSearchParams(location.search).get('id') || 'arc';
// an id that matches nothing shows a not-found state, never another product
const product = computed(() => store.products.find(p => p.id === productId));
const productLink = p => `product.html?id=${encodeURIComponent(p.id)}`;
const filtered = computed(() => store.products.filter(p =>
  (status.value === 'All' || p.status === status.value) &&
  (!category.value || p.category === category.value) &&
  (!stockFilter.value || (stockFilter.value === 'low' ? p.stock > 0 && p.stock < 10 : p.stock === 0)) &&
  `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.value.toLowerCase())
).sort((a, b) => sort.value === 'name' ? a.name.localeCompare(b.name) : sort.value === 'price' ? b.price - a.price : b.stock - a.stock));
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 6)));
const visible = computed(() => filtered.value.slice((pageNumber.value - 1) * 6, pageNumber.value * 6));
const allSelected = computed(() => visible.value.length > 0 && visible.value.every(p => selected.value.includes(p.id)));
const activeProducts = computed(() => store.products.filter(p => p.status === 'Active'));
const lowStock = computed(() => activeProducts.value.filter(p => p.stock < 10));
const bestsellers = computed(() => [...activeProducts.value].sort((a, b) => b.sales - a.sales).slice(0, 4));
const totalStock = computed(() => store.products.reduce((sum, p) => sum + p.stock, 0));
const timeline = computed(() => store.activity.filter(a => activityType.value === 'All' || a.type === activityType.value));
const productActivity = computed(() => store.activity.filter(a => a.product === product.value?.id));
// a product saved before channels existed is on in both
const channel = (p, key) => p.channels?.[key] ?? true;
const availability = computed(() => {
  const p = product.value;
  if (p.status === 'Draft') return 'Only your team can see this product.';
  if (p.status === 'Archived') return 'This product is no longer listed in your store.';
  const online = channel(p, 'online'), studio = channel(p, 'studio');
  return online && studio ? 'Visible in your store and ready to order.'
    : online ? 'Sold online only, not at the London studio.'
    : studio ? 'Hidden online. Available at the London studio only.'
    : 'Switched off in every channel, so nobody can order it.';
});
const archiveCount = computed(() => Array.isArray(pending.value) ? pending.value.length : 0);
const archiveName = computed(() => archiveCount.value === 1 ? store.products.find(p => p.id === pending.value[0])?.name : '');
// the dashboard period is the DataTable date filter: a preset or any two dates
const today = day(new Date());
const presets = datePresets();
const range = ref([...presets[1].range]);
const preset = computed(() => presets.find(p => p.range.join() === range.value.join())?.label ?? '');
// Custom range shows the two dates; picking a preset hides them again
const custom = ref(false);
function pickPeriod(label) {
  custom.value = !label;
  if (label) range.value = [...presets.find(p => p.label === label).range];
}
function setDay(i, event) {
  if (!event.target.value) return void (event.target.value = range.value[i]);
  range.value = range.value.with(i, event.target.value);
}
// the days with sales: none after today, and a reversed range reads forwards
const salesDays = computed(() => {
  const [from, to] = [...range.value].sort().map(d => d > today ? today : d);
  const days = [];
  for (let d = from; d <= to; d = shift(d, 1)) days.push(d);
  return days;
});
const previousDays = computed(() => salesDays.value.map(d => shift(d, -salesDays.value.length)));
const periodName = computed(() => salesDays.value.length === 1 ? 'day' : `${salesDays.value.length} days`);
const longDate = (d, options) => new Date(`${d}T12:00`).toLocaleDateString('en-GB', options);
const rangeLabel = computed(() => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  .formatRange(new Date(`${salesDays.value[0]}T12:00`), new Date(`${salesDays.value.at(-1)}T12:00`)));
const total = days => days.map(daySales).reduce((t, s) => ({ revenue: t.revenue + s.revenue, orders: t.orders + s.orders, visits: t.visits + s.visits }), { revenue: 0, orders: 0, visits: 0 });
const stats = computed(() => {
  const figures = t => [t.revenue, t.orders, t.revenue / t.orders, t.orders / t.visits * 100];
  const now = figures(total(salesDays.value)), then = figures(total(previousDays.value));
  return [['Total revenue', money(now[0])], ['Orders', now[1].toLocaleString('en-GB')], ['Average order', money(Math.round(now[2] * 100) / 100)], ['Conversion rate', `${now[3].toFixed(1)}%`]]
    .map(([label, value], i) => ({ label, value, change: (now[i] / then[i] - 1) * 100 }));
});
const change = c => `${c < 0 ? '↘︎' : '↗︎'} ${Math.abs(c).toFixed(1)}%`;
const chart = computed(() => {
  const now = salesDays.value.map(d => daySales(d).revenue), then = previousDays.value.map(d => daySales(d).revenue);
  const step = Math.ceil(Math.max(...now, ...then) / 3 / 500) * 500, top = step * 3;
  // one day is drawn as a flat line across the plot
  const line = values => (values.length > 1 ? values : [values[0], values[0]]).map((v, i, all) => `${i / (all.length - 1) * 560},${(200 - v / top * 195).toFixed(1)}`).join(' ');
  const n = now.length, count = Math.min(n, 7);
  const labels = [...new Set(Array.from({ length: count }, (_, i) => Math.round(i * (n - 1) / Math.max(count - 1, 1))))]
    .map(i => longDate(salesDays.value[i], n > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' }));
  return { line: line(now), prior: line(then), axis: [3, 2, 1, 0].map(k => k ? `£${step * k / 1000}k` : '£0'), labels, peak: longDate(salesDays.value[now.indexOf(Math.max(...now))], { weekday: 'long', day: 'numeric', month: 'long' }) };
});
const categoryIcon = { Headphones: 'headphones', Speakers: 'speaker', Turntables: 'disc' };
const activityIcon = type => ({ Inventory: 'blocks', Price: 'tag', Note: 'bubble' })[type] ?? 'package';
const stockLabel = p => p.stock ? `${p.stock} in stock` : 'Out of stock';
// out of stock on a live product is the loudest stock state, then low; a draft or archived product needs neither
const stockAlert = p => p.status !== 'Active' ? null : p.stock === 0 ? { class: 'red', label: 'Out' } : p.stock < 10 ? { class: 'amber', label: 'Low' } : null;
const categorySales = computed(() => {
  const totals = categories.map(name => {
    const sold = store.products.filter(p => p.category === name);
    return { name, value: sold.reduce((n, p) => n + p.sales * p.price, 0), units: sold.reduce((n, p) => n + p.sales, 0) };
  }).sort((a, b) => b.value - a.value);
  const sum = totals.reduce((n, c) => n + c.value, 0) || 1;
  return totals.map(c => ({ ...c, share: Math.round(c.value / sum * 100) }));
});
watch([query, category, status, stockFilter, sort], () => { pageNumber.value = 1; selected.value = []; });
watch(() => store.products.length, () => { pageNumber.value = Math.min(pageNumber.value, pageCount.value); });
function shortcut(event) {
  if (event.key === '/' && props.screen === 'products' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
    event.preventDefault(); document.querySelector('input[aria-label="Search products"]')?.focus();
  }
}
onMounted(() => document.addEventListener('keydown', shortcut));
onUnmounted(() => { document.removeEventListener('keydown', shortcut); clearTimeout(toastTimer); });
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 6000); }
function clearFilters() { query.value = ''; category.value = ''; stockFilter.value = ''; status.value = 'All'; }
function toggleAll(checked) { selected.value = checked ? [...new Set([...selected.value, ...visible.value.map(p => p.id)])] : selected.value.filter(id => !visible.value.some(p => p.id === id)); }
function edit(p, focus) { editing.value = p?.id || null; editor.value.open(p, false, focus); }
function saveProduct(draft) {
  // a product keeps its drawing while it stays in a category that has it; a new or moved one takes the category's first
  const kinds = { Headphones: ['headphones', 'studio', 'earbuds'], Speakers: ['speaker', 'stereo', 'mini'], Turntables: ['turntable'] }[draft.category];
  if (!kinds.includes(draft.kind)) draft.kind = kinds[0];
  if (editing.value) {
    const target = store.products.find(p => p.id === editing.value);
    Object.assign(target, draft);
    record(`${draft.name} updated`, 'Alex Morgan updated the product information.', target.id);
  } else {
    draft.id = `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    draft.sales = 0;
    if (!draft.variants.length) draft.variants = [{ name: draft.finish, sku: draft.sku, stock: draft.stock, price: draft.price }];
    store.products.unshift(draft);
    record(`${draft.name} added`, 'Alex Morgan added a new draft product.', draft.id);
  }
  // a duplicate made on a product page opens, so the next edit lands on the copy
  if (!editing.value && props.screen === 'product') return void nextTick(() => location.assign(productLink(draft)));
  notify(editing.value ? 'Product updated.' : 'Product added.');
}
function openPrice() { Object.assign(priceDraft, { price: product.value.price, cost: product.value.cost }); pricing.value.showModal(); }
function savePrice() {
  const p = product.value, old = p.price, difference = Number(priceDraft.price) - old;
  p.price = Number(priceDraft.price); p.cost = Number(priceDraft.cost);
  p.variants.forEach(v => v.price = Math.max(0, v.price + difference));
  record(`${p.name} price updated`, `Retail price changed from ${money(old)} to ${money(p.price)}.`, p.id, 'Price');
  pricing.value.close(); notify('Pricing updated.');
}
function openInventory() { inventoryErrors.value = {}; inventoryDraft.value = product.value.variants.map(v => ({ ...v })); inventory.value.showModal(); }
function saveInventory() {
  const errors = {};
  if (!inventoryDraft.value.length) errors.inventory = 'Add at least one finish.';
  const skus = new Set();
  inventoryDraft.value.forEach((v, i) => {
    const sku = v.sku.trim().toLowerCase();
    if (skus.has(sku)) errors[`inventory.${i}.sku`] = 'Each finish needs a unique SKU.';
    skus.add(sku);
  });
  inventoryErrors.value = errors;
  if (Object.keys(errors).length) return;
  const p = product.value;
  p.variants = inventoryDraft.value.map(v => ({ ...v, stock: Number(v.stock) }));
  p.stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
  record(`${p.name} inventory updated`, `${p.stock} units available at the London studio.`, p.id, 'Inventory');
  inventory.value.close(); notify('Inventory updated.');
}
function openVariant(index = -1) {
  variantIndex.value = index;
  Object.assign(variantDraft, index >= 0 ? product.value.variants[index] : { name: '', sku: '', price: product.value.price, stock: 0 });
  variantDialog.value.showModal();
}
function saveVariant() {
  const variant = { ...variantDraft, price: Number(variantDraft.price), stock: Number(variantDraft.stock) };
  if (variantIndex.value >= 0) product.value.variants[variantIndex.value] = variant;
  else product.value.variants.push(variant);
  product.value.stock = product.value.variants.reduce((sum, v) => sum + v.stock, 0);
  record(`${product.value.name} finish updated`, `${variant.name} is available with ${variant.stock} units.`, product.value.id, 'Inventory');
  variantDialog.value.close(); notify('Finish saved.');
}
function setChannel(key, on) {
  const p = product.value, place = key === 'online' ? 'the online store' : 'the London studio';
  p.channels = { online: channel(p, 'online'), studio: channel(p, 'studio'), [key]: on };
  record(`${p.name} ${on ? 'added to' : 'removed from'} ${place}`, `Alex Morgan turned ${on ? 'on' : 'off'} ${place} for this product.`, p.id);
  notify(on ? `${p.name} is available in ${place}.` : `${p.name} is no longer available in ${place}.`);
}
function changeStatus(next) {
  const p = product.value;
  p.status = next;
  record(`${p.name} ${next.toLowerCase()}`, `Alex Morgan changed the product status to ${next.toLowerCase()}.`, p.id);
  document.getElementById('status-popover').hidePopover(); notify('Product status updated.');
}
function requestArchive(ids) { pending.value = ids; confirmation.value.showModal(); }
function archiveProducts() {
  pending.value.forEach(id => { const p = store.products.find(p => p.id === id); if (p) { p.status = 'Archived'; record(`${p.name} archived`, 'The product was removed from the online store.', id); } });
  selected.value = []; confirmation.value.close(); notify(pending.value.length === 1 ? 'Product archived.' : 'Products archived.');
}
function duplicate() {
  const p = JSON.parse(JSON.stringify(product.value)); p.name += ' (copy)'; p.sku += '-COPY'; p.status = 'Draft'; p.image = undefined;
  document.getElementById('product-more').hidePopover(); editing.value = null; editor.value.open(p, true);
}
function exportProducts() {
  const csv = [['Product', 'SKU', 'Status', 'Price', 'Stock'], ...filtered.value.map(p => [p.name, p.sku, p.status, p.price, p.stock])].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'forma-products.csv' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify('Product list exported.');
}
function saveNote() { record('Alex Morgan left a note', note.value, props.screen === 'product' ? product.value.id : null, 'Note'); note.value = ''; noteDialog.value.close(); notify('Note added.'); }
function startNote() { note.value = ''; noteDialog.value.showModal(); }
</script>

<template>
  <div class="demo-page">
    <template v-if="screen === 'dashboard'">
      <div class="demo-page-heading"><div><h1>Good morning, Alex</h1><p class="muted">Sales, stock and changes across your store.</p></div><a class="btn outlined" href="products.html"><Icon name="blocks"/> Manage products</a></div>
      <div class="demo-summary-grid">
        <div v-for="stat in stats" :key="stat.label" class="card demo-stat"><p class="muted">{{ stat.label }}</p><p class="demo-stat-value">{{ stat.value }}</p><p class="demo-stat-context"><span :class="stat.change < 0 ? 'text-danger' : 'text-success'">{{ change(stat.change) }}</span><span class="muted">vs. previous {{ periodName }}</span></p></div>
      </div>
      <div class="demo-dashboard-main">
        <section class="card demo-revenue" aria-labelledby="revenue-heading">
          <header>
            <hgroup><h2 id="revenue-heading">Sales over time</h2><p>{{ rangeLabel }}</p></hgroup>
            <div class="demo-period" role="group" aria-label="Sales period">
              <select class="input sm" aria-label="Sales period preset" :value="custom ? '' : preset" @change="pickPeriod($event.target.value)">
                <option value="">Custom range</option>
                <option v-for="p in presets" :key="p.label">{{ p.label }}</option>
              </select>
              <div v-if="custom || !preset" class="join"><input type="date" class="input sm" aria-label="Sales from" :value="range[0]" @change="setDay(0, $event)"><input type="date" class="input sm" aria-label="Sales to" :value="range[1]" @change="setDay(1, $event)"></div>
            </div>
          </header>
          <div class="demo-chart-key"><span><i></i> This period</span><span><i class="previous"></i> Previous {{ periodName }}</span></div>
          <div class="demo-chart"><div class="demo-chart-axis"><span v-for="tick in chart.axis" :key="tick">{{ tick }}</span></div><div class="demo-chart-plot"><svg viewBox="0 0 560 210" preserveAspectRatio="none" role="img" :aria-label="`Revenue for ${rangeLabel}: ${stats[0].value}, ${stats[0].change < 0 ? 'down' : 'up'} ${Math.abs(stats[0].change).toFixed(1)} percent on the previous ${periodName}.`"><defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--color-primary)" stop-opacity=".14"/><stop offset="1" stop-color="var(--color-primary)" stop-opacity="0"/></linearGradient></defs><path class="demo-chart-grid" d="M0 5h560M0 70h560M0 135h560M0 200h560"/><polyline :points="chart.prior" class="demo-chart-prior"/><polygon :points="`0,210 ${chart.line} 560,210`" fill="url(#sales-fill)"/><polyline :points="chart.line" class="demo-chart-line"/></svg><div class="demo-chart-labels"><span v-for="label in chart.labels" :key="label">{{ label }}</span></div></div></div>
          <div class="demo-chart-footer"><span class="muted">Your strongest day was {{ chart.peak }}.</span><span class="muted tabular-nums">Previous {{ periodName }}: <span class="text-foreground font-medium">{{ money(total(previousDays).revenue) }}</span></span></div>
        </section>
        <section class="card demo-categories" aria-labelledby="category-heading">
          <header><hgroup><h2 id="category-heading">Sales by category</h2><p>Share of revenue, all time</p></hgroup></header>
          <p class="demo-price">{{ money(categorySales.reduce((n, c) => n + c.value, 0)) }} <span class="muted text-sm font-normal">from {{ categorySales.reduce((n, c) => n + c.units, 0) }} sold</span></p>
          <div class="demo-category-list">
          <div v-for="c in categorySales" :key="c.name" class="field">
            <label :for="`share-${c.name}`" class="flex items-center justify-between gap-2 font-normal">
              <span class="flex items-center gap-2"><Icon :name="categoryIcon[c.name]" class="muted"/> {{ c.name }}</span>
              <output :for="`share-${c.name}`" class="tabular-nums muted">{{ c.share }}%</output>
            </label>
            <progress :id="`share-${c.name}`" class="progress sm" :value="c.share" max="100"></progress>
            <p class="text-xs muted">{{ money(c.value) }} · {{ c.units }} sold</p>
          </div>
          </div>
        </section>
      </div>
      <div class="demo-section-heading"><div><h2>Popular this week</h2><p class="muted text-sm">The objects finding their way into more homes.</p></div><a class="btn ghost sm" href="products.html">View all products <span aria-hidden="true">→</span></a></div>
      <div class="demo-product-grid"><a v-for="p in bestsellers" :key="p.id" class="card demo-product-card" :href="productLink(p)"><div class="demo-product-stage"><span class="badge secondary sm">{{ p.sales }} sold</span><ProductArt :kind="p.kind" :name="p.name"/></div><div class="demo-product-card-body"><div><h3>{{ p.name }}</h3><p class="muted text-xs">{{ p.category }}</p></div><strong>{{ money(p.price) }}</strong></div></a></div>
      <div class="demo-bottom-grid"><section class="card" aria-labelledby="recent-heading"><header><h2 id="recent-heading">Recent activity</h2><a href="activity.html" class="btn ghost sm">View all <span aria-hidden="true">→</span></a></header><ol class="demo-activity-list"><li v-for="a in store.activity.slice(0, 3)" :key="a.id"><span class="avatar sm secondary"><Icon :name="activityIcon(a.type)"/></span><div><p class="font-medium text-sm">{{ a.title }}</p><p class="muted text-xs">{{ a.time }}</p></div><a v-if="a.product" class="btn ghost sm px-2" :href="`product.html?id=${a.product}`" :aria-label="`View ${a.title}`"><Icon name="chevron-right"/></a></li></ol></section><section class="card" aria-labelledby="attention-heading"><header><h2 id="attention-heading">Low stock</h2><a href="products.html?stock=low" class="btn ghost sm">Review <span aria-hidden="true">→</span></a></header><p v-if="!lowStock.length" class="text-sm muted">Every active product has 10 or more units.</p><ul v-else class="demo-activity-list"><li v-for="p in lowStock" :key="p.id"><span class="demo-thumb sm"><ProductArt :kind="p.kind"/></span><div><p class="font-medium text-sm"><a class="demo-title-link" :href="productLink(p)">{{ p.name }}</a></p><p class="muted text-xs">{{ p.category }}</p></div><span class="badge sm" :class="p.stock ? 'amber' : 'red'">{{ p.stock ? `${p.stock} left` : 'Out' }}</span></li></ul><div class="demo-chart-footer mt-auto"><span class="muted">{{ lowStock.length }} of {{ activeProducts.length }} active products under 10 units</span></div></section></div>
    </template>

    <template v-else-if="screen === 'products'">
      <div class="demo-page-heading"><div><h1>Products</h1><p class="muted">Everything you sell online and at the London studio.</p></div><div class="flex gap-2"><button class="btn outlined" @click="exportProducts"><Icon name="upload"/> Export</button><button class="btn primary" @click="edit()"><Icon name="plus"/> Add product</button></div></div>
      <div class="demo-catalogue-summary"><div><strong>{{ store.products.length }}</strong><span class="muted">products</span></div><div><strong>{{ lowStock.length }}</strong><span class="muted">low on stock</span></div><div><strong>{{ totalStock }}</strong><span class="muted">units in stock</span></div></div>
      <section class="card demo-catalogue" aria-label="Product catalogue">
        <div class="tabs demo-list-tabs" role="radiogroup" aria-label="Product status"><label v-for="s in ['All', 'Active', 'Draft', 'Archived']" :key="s"><input v-model="status" type="radio" name="listing-status" :value="s"/>{{ s }} <span class="badge sm">{{ s === 'All' ? store.products.length : store.products.filter(p => p.status === s).length }}</span></label></div>
        <div class="demo-table-toolbar"><label class="input demo-search"><Icon name="search"/><input v-model="query" type="search" placeholder="Search products or SKU…" aria-label="Search products"/><kbd class="hidden xl:inline">/</kbd></label><select v-model="category" class="input" aria-label="Product category"><option value="">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select><button class="btn outlined" popovertarget="product-filters"><Icon name="sliders"/> <span class="max-md:sr-only">Filters</span> <span v-if="stockFilter" class="badge primary sm">1</span></button><div class="join ml-auto demo-view-toggle" role="group" aria-label="Product layout"><button class="btn outlined" :aria-pressed="mode === 'table'" aria-label="Table view" @click="mode = 'table'"><Icon name="list"/></button><button class="btn outlined" :aria-pressed="mode === 'grid'" aria-label="Grid view" @click="mode = 'grid'"><Icon name="grid"/></button></div></div>
        <div id="product-filters" popover class="dropdown right space-y-4"><div class="field"><label for="stock-filter">Inventory</label><select id="stock-filter" v-model="stockFilter" class="input"><option value="">All stock levels</option><option value="low">Low stock (under 10)</option><option value="out">Out of stock</option></select></div><div class="field"><label for="product-sort">Sort by</label><select id="product-sort" v-model="sort" class="input"><option value="name">Product name</option><option value="price">Price: high to low</option><option value="stock">Stock: high to low</option></select></div><button class="btn ghost sm" @click="stockFilter = ''; sort = 'name'">Reset filters</button></div>
        <div v-if="selected.length" class="demo-selection"><p>{{ selected.length }} selected</p><button class="btn outlined sm" @click="requestArchive(selected)">Archive selected</button><button class="btn ghost sm" @click="selected = []">Clear selection</button></div>
        <div v-if="mode === 'table' && visible.length" class="demo-table-scroll" tabindex="0" role="region" aria-label="Products table"><table class="table hover demo-products-table"><thead><tr><th class="w-12"><input class="checkbox" type="checkbox" aria-label="Select all visible products" :checked="allSelected" @change="toggleAll($event.target.checked)"/></th><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th class="text-right">Price</th></tr></thead><tbody><tr v-for="p in visible" :key="p.id"><td><input v-model="selected" class="checkbox" type="checkbox" :value="p.id" :aria-label="`Select ${p.name}`"/></td><td><a :href="productLink(p)" class="demo-table-product"><span class="demo-thumb"><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></span><span><strong>{{ p.name }}</strong><span class="muted demo-sku">{{ p.sku }}</span><span class="demo-table-meta"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><span class="demo-stock"><span class="muted">{{ stockLabel(p) }}</span><span v-if="stockAlert(p)" class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span></span></span></span></a></td><td><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span></td><td class="whitespace-nowrap"><span class="demo-stock"><span class="muted">{{ stockLabel(p) }}</span><span v-if="stockAlert(p)" class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span></span></td><td class="muted">{{ p.category }}</td><td class="text-right font-medium tabular-nums">{{ money(p.price) }}</td></tr></tbody></table></div>
        <div v-else-if="mode === 'grid' && visible.length" class="demo-product-grid demo-catalogue-grid"><a v-for="p in visible" :key="p.id" class="card demo-product-card" :href="productLink(p)"><div class="demo-product-stage"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></div><div class="demo-product-card-body"><div><h3>{{ p.name }}</h3><p class="demo-stock text-xs"><span class="muted">{{ stockLabel(p) }}</span><span v-if="stockAlert(p)" class="badge xs" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span></p></div><strong>{{ money(p.price) }}</strong></div></a></div>
        <div v-else class="demo-empty"><Icon name="search"/><h2>{{ query ? `No products match “${query}”` : 'No products match' }}</h2><p class="muted">Try a different name or clear your filters to see the collection.</p><button class="btn outlined" @click="clearFilters">Clear filters</button></div>
        <footer class="demo-table-footer"><p class="muted text-sm" role="status">{{ filtered.length ? `${(pageNumber - 1) * 6 + 1}–${Math.min(pageNumber * 6, filtered.length)} of ${filtered.length} products` : '0 products' }}</p><nav class="flex items-center gap-2" aria-label="Product pagination"><button class="btn outlined sm" :disabled="pageNumber === 1" @click="pageNumber--; selected = []" aria-label="Previous product page"><Icon name="arrow-left"/></button><span class="text-sm muted">Page {{ pageNumber }} of {{ pageCount }}</span><button class="btn outlined sm" :disabled="pageNumber === pageCount" @click="pageNumber++; selected = []" aria-label="Next product page"><Icon name="arrow-right"/></button></nav></footer>
      </section>
    </template>

    <template v-else-if="screen === 'product' && !product">
      <a href="products.html" class="btn ghost sm self-start -ml-2"><Icon name="arrow-left"/> All products</a>
      <div class="card demo-empty"><Icon name="search"/><h1>Product not found</h1><p class="muted">This link doesn’t match a product in your workspace. It may have been removed, or added in another browser tab.</p><a class="btn outlined" href="products.html">Back to all products</a></div>
    </template>

    <template v-else-if="screen === 'product'">
      <a href="products.html" class="btn ghost sm self-start -ml-2"><Icon name="arrow-left"/> All products</a>
      <div class="demo-page-heading"><div><p class="demo-eyebrow">{{ product.category }}</p><h1>{{ product.name }}</h1><p class="muted">{{ product.subtitle }}</p></div><div class="flex flex-wrap gap-2"><button class="btn outlined" @click="preview.showModal()">Preview</button><button class="btn primary" @click="edit(product)"><Icon name="field"/> Edit product</button><button class="btn outlined" popovertarget="product-more" aria-label="More product actions"><Icon name="ellipsis"/></button></div></div>
      <div id="product-more" popover class="dropdown right"><div class="nav"><button @click="duplicate"><Icon name="copy"/> Duplicate product</button><button @click="requestArchive([product.id]); $event.target.closest('[popover]').hidePopover()"><Icon name="x"/> Archive product</button></div></div>
      <div class="demo-detail-grid">
        <section class="card demo-gallery" aria-label="Product images"><div class="demo-gallery-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="`${product.name}, ${product.variants[activeFinish]?.name || product.finish} finish`" :angle="angle"/><button class="btn outlined sm demo-gallery-expand" aria-label="Enlarge product image" @click="preview.showModal()"><Icon name="expand"/></button><span class="demo-gallery-caption">{{ product.variants[activeFinish]?.name || product.finish }} / Studio series</span></div><div class="demo-gallery-views"><button v-for="(a, i) in [0, 18, -18]" :key="a" class="demo-gallery-view" :aria-label="`Product image ${i + 1}`" :aria-pressed="angle === a" @click="angle = a"><ProductArt :kind="product.kind" :name="`${product.name} view ${i + 1}`" :angle="a"/></button></div></section>
        <div class="demo-detail-side">
          <section class="card" aria-labelledby="availability-heading"><header><h2 id="availability-heading">Availability</h2><button class="badge" :class="statusClass(product.status)" popovertarget="status-popover" :aria-label="`${product.status}, change status`">{{ product.status }} <Icon name="chevron-down"/></button></header><p class="text-sm muted">{{ availability }}</p><div class="demo-channel"><div><strong>Online store</strong><span class="muted">forma.audio</span></div><label class="switch"><input :checked="channel(product, 'online')" type="checkbox" role="switch" aria-label="Online store availability" @change="setChannel('online', $event.target.checked)"/></label></div><div class="demo-channel"><div><strong>London studio</strong><span class="muted">In-person collection</span></div><label class="switch"><input :checked="channel(product, 'studio')" type="checkbox" role="switch" aria-label="London studio availability" @change="setChannel('studio', $event.target.checked)"/></label></div></section>
          <div id="status-popover" popover class="dropdown right"><div class="nav"><button v-for="s in ['Active', 'Draft', 'Archived']" :key="s" :aria-current="product.status === s || null" @click="changeStatus(s)"><span class="badge sm" :class="statusClass(s)">{{ s }}</span><span v-if="product.status === s" aria-hidden="true">✓</span></button></div></div>
          <section class="card" aria-labelledby="pricing-heading"><header><h2 id="pricing-heading">Pricing</h2><button class="btn ghost sm" @click="openPrice">Edit pricing</button></header><p class="demo-price">{{ money(product.price) }}</p><dl class="dl horizontal demo-figures"><div><dt>Cost per item</dt><dd>{{ money(product.cost) }}</dd></div><div><dt>Margin</dt><dd>{{ product.price > 0 ? Math.round((product.price - product.cost) / product.price * 100) : 0 }}%</dd></div></dl><p class="demo-small-note">Includes VAT. No compare-at price set.</p></section>
          <section class="card" aria-labelledby="inventory-heading"><header><h2 id="inventory-heading">Inventory</h2><button class="btn ghost sm" @click="openInventory">Adjust inventory</button></header><div class="flex items-center gap-3"><p class="demo-price">{{ product.stock }} <span class="muted text-sm font-normal">available</span></p><span class="badge sm" :class="product.stock === 0 ? 'red' : product.stock < 10 ? 'amber' : 'green'">{{ product.stock === 0 ? 'Out of stock' : product.stock < 10 ? 'Low stock' : 'In stock' }}</span></div><p class="text-xs muted">Across {{ product.variants.length }} {{ product.variants.length === 1 ? 'finish' : 'finishes' }} · London studio</p></section>
        </div>
      </div>
      <div class="tabs demo-detail-tabs">
        <label><input type="radio" name="product-panel" checked/> Overview</label><label><input type="radio" name="product-panel"/> Finishes <span class="badge sm">{{ product.variants.length }}</span></label><label><input type="radio" name="product-panel"/> Activity</label>
        <div class="pt-6"><div class="demo-bottom-grid"><section class="card" aria-labelledby="details-heading"><header><h2 id="details-heading">Description</h2><button class="btn ghost sm" @click="edit(product, '[name=description]')">Edit description</button></header><p class="text-sm leading-relaxed muted">{{ product.description }}</p><div class="demo-tags"><span v-for="tag in product.tags" :key="tag" class="badge secondary outlined sm">{{ tag }}</span><span v-if="!product.tags.length" class="muted text-sm">No tags yet.</span></div></section><section class="card" aria-labelledby="organisation-heading"><header><h2 id="organisation-heading">Details</h2><button class="btn ghost sm" @click="edit(product, '[name=category]')">Edit details</button></header><dl class="dl horizontal demo-figures"><div><dt>Category</dt><dd>{{ product.category }}</dd></div><div><dt>Collection</dt><dd>Studio series</dd></div><div><dt>SKU</dt><dd class="demo-sku">{{ product.sku }}</dd></div></dl></section></div></div>
        <div class="pt-6"><section class="card" aria-labelledby="finishes-heading"><header><hgroup><h2 id="finishes-heading">A finish for every space</h2><p>Manage each finish, price and stock level.</p></hgroup><button class="btn outlined sm" @click="openVariant()"><Icon name="plus"/> Add finish</button></header><div class="demo-table-scroll" tabindex="0" role="region" aria-label="Product finishes"><table class="table hover"><thead><tr><th>Finish</th><th>SKU</th><th>Available</th><th>Price</th><th><span class="sr-only">Edit finish</span></th></tr></thead><tbody><tr v-for="(v, i) in product.variants" :key="i"><td><button class="btn ghost sm" :aria-pressed="activeFinish === i" @click="activeFinish = i; angle = 0">{{ v.name }}</button></td><td class="muted demo-sku">{{ v.sku }}</td><td>{{ v.stock }} units</td><td>{{ money(v.price) }}</td><td><button class="btn ghost sm" :aria-label="`Edit ${v.name} finish`" @click="openVariant(i)"><Icon name="field"/></button></td></tr></tbody></table></div></section></div>
        <div class="pt-6"><section class="card" aria-labelledby="history-heading"><header><h2 id="history-heading">Product history</h2><button class="btn outlined sm" @click="startNote">Add note</button></header><ol class="timeline"><li v-for="a in productActivity" :key="a.id"><p class="font-medium">{{ a.title }}</p><p class="text-sm muted mt-1">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol><p v-if="!productActivity.length" class="muted text-sm">Changes to this product will appear here.</p></section></div>
      </div>
    </template>

    <template v-else-if="screen === 'activity'">
      <div class="demo-page-heading"><div><h1>Activity</h1><p class="muted">Every change to products, prices and stock, newest first.</p></div><button class="btn primary" @click="startNote"><Icon name="plus"/> Add note</button></div>
      <div class="demo-activity-layout"><section class="card demo-history" aria-labelledby="activity-heading"><header><h2 id="activity-heading">Store activity</h2><select class="input sm" v-model="activityType" aria-label="Activity type"><option>All</option><option>Product</option><option>Inventory</option><option>Price</option><option>Note</option></select></header><ol class="timeline"><li v-for="a in timeline" :key="a.id"><span class="avatar secondary sm"><Icon :name="activityIcon(a.type)"/></span><div class="flex items-start gap-2"><p class="font-medium"><a v-if="a.product" class="demo-title-link" :href="`product.html?id=${a.product}`">{{ a.title }}</a><template v-else>{{ a.title }}</template></p><span class="badge outlined sm ml-auto">{{ a.type }}</span></div><blockquote v-if="a.type === 'Note'">{{ a.detail }}</blockquote><p v-else class="text-sm muted mt-1">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol><p v-if="!timeline.length" class="muted text-sm">No {{ activityType.toLowerCase() }} activity yet.</p></section><div class="demo-side-cards"><section class="card"><header><h2>Sample workspace</h2></header><p class="muted text-sm">Explore the collection, change a price or add a finish. Your changes stay in this browser tab until you start fresh.</p><button class="btn outlined sm self-start" @click="pending = 'reset'; confirmation.showModal()">Reset workspace</button></section><section class="card"><header><h2>Built with altpro/ui</h2></header><p class="muted text-sm">The same components, from a simple field to a complete workspace.</p><a class="btn ghost sm self-start -ms-3" href="../index.html">Explore the library <span aria-hidden="true">→</span></a></section></div></div>
    </template>

    <p class="demo-page-footer"><span>Forma / Audio objects</span><span>Sample workspace · Autumn 2026</span></p>
  </div>

  <ProductEditor ref="editor" @save="saveProduct"/>
  <!-- the product's own editors; an unknown id has no product to edit -->
  <template v-if="product">
  <dialog ref="pricing" class="dialog divided" aria-labelledby="price-dialog-title"><header><hgroup><p>{{ product.name }}</p><h2 id="price-dialog-title">Edit pricing</h2></hgroup><button class="btn ghost sm" aria-label="Close pricing" @click="pricing.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="savePrice"><div class="grid grid-cols-2 gap-4"><Field v-model="priceDraft.price" name="retailPrice" label="Retail price" type="number" prepend="£" min="0" step="0.01" required/><Field v-model="priceDraft.cost" name="itemCost" label="Cost per item" type="number" prepend="£" min="0" step="0.01" required/></div><p class="demo-small-note">Prices include VAT. The price change applies to all finishes.</p><div class="demo-form-footer"><button type="button" class="btn outlined" @click="pricing.close()">Cancel</button><button class="btn primary">Save pricing</button></div></form></dialog>
  <dialog ref="inventory" class="dialog drawer divided demo-editor" aria-labelledby="stock-dialog-title"><header><hgroup><p>{{ product.name }}</p><h2 id="stock-dialog-title">Adjust inventory</h2></hgroup><button class="btn ghost sm" aria-label="Close inventory" @click="inventory.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveInventory"><p class="text-sm muted">Available stock at the London studio. Update each finish below.</p><Repeater v-model="inventoryDraft" name="inventory" item="finish" :make="makeFinish" :errors="inventoryErrors" v-slot="{ row, index, errors }"><div class="grid grid-cols-2 gap-3"><Field v-model="row.name" :name="`inventory.${index}.name`" label="Finish name" required/><Field v-model="row.sku" :name="`inventory.${index}.sku`" label="Finish SKU" :errors="errors" required/></div><Field v-model="row.stock" :name="`inventory.${index}.stock`" :label="`${row.name || 'New finish'} available units`" type="number" min="0" step="1" required/></Repeater><div class="demo-form-footer"><button type="button" class="btn outlined" @click="inventory.close()">Cancel</button><button class="btn primary">Save inventory</button></div></form></dialog>
  <dialog ref="variantDialog" class="dialog divided" aria-labelledby="finish-dialog-title"><header><h2 id="finish-dialog-title">{{ variantIndex >= 0 ? 'Edit finish' : 'Add finish' }}</h2><button class="btn ghost sm" aria-label="Close finish editor" @click="variantDialog.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveVariant"><Field v-model="variantDraft.name" name="finishName" label="Finish name" required/><Field v-model="variantDraft.sku" name="finishSku" label="Finish SKU" required/><div class="grid grid-cols-2 gap-4"><Field v-model="variantDraft.price" name="finishPrice" label="Finish price" type="number" min="0" step="0.01" prepend="£" required/><Field v-model="variantDraft.stock" name="finishStock" label="Available units" type="number" min="0" step="1" required/></div><div class="demo-form-footer"><button type="button" class="btn outlined" @click="variantDialog.close()">Cancel</button><button class="btn primary">Save finish</button></div></form></dialog>
  <dialog ref="preview" class="dialog demo-preview" aria-labelledby="preview-title"><header><span class="demo-eyebrow">Forma / Studio series</span><button class="btn ghost sm ml-auto" aria-label="Close preview" @click="preview.close()"><Icon name="x"/></button></header><div class="demo-product-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="product.name" :angle="angle"/></div><div class="flex justify-between gap-4 items-start"><div><h2 id="preview-title" class="text-2xl font-semibold">{{ product.name }}</h2><p class="muted mt-2">{{ product.subtitle }}</p></div><strong class="text-xl">{{ money(product.price) }}</strong></div><p class="text-sm muted leading-relaxed">{{ product.description }}</p><button class="btn primary" :disabled="product.status !== 'Active' || product.stock === 0" @click="preview.close(); notify('Added to your demo bag.')">{{ product.stock === 0 ? 'Out of stock' : product.status !== 'Active' ? 'Not available' : 'Add to bag' }}</button></dialog>
  </template>
  <dialog ref="confirmation" class="dialog divided" aria-labelledby="confirm-title"><header><h2 id="confirm-title">{{ pending === 'reset' ? 'Start fresh?' : archiveName ? `Archive “${archiveName}”?` : `Archive ${archiveCount} products?` }}</h2></header><p class="text-sm muted">{{ pending === 'reset' ? 'Your changes in this tab will be cleared and the original collection restored.' : archiveName ? 'It will be removed from your store. You can make it active again from its product page.' : `These ${archiveCount} products will be removed from your store. You can make each one active again from its product page.` }}</p><footer class="justify-end"><button class="btn outlined" @click="confirmation.close()">Cancel</button><button class="btn" :class="pending === 'reset' ? 'primary' : 'danger'" @click="pending === 'reset' ? (resetWorkspace(), confirmation.close(), notify('Workspace reset.')) : archiveProducts()">{{ pending === 'reset' ? 'Reset workspace' : archiveName ? 'Archive product' : `Archive ${archiveCount} products` }}</button></footer></dialog>
  <dialog ref="noteDialog" class="dialog divided" aria-labelledby="note-title"><header><h2 id="note-title">Add a note</h2><button class="btn ghost sm" aria-label="Close note" @click="noteDialog.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveNote"><Field v-model="note" name="note" label="Your note" type="textarea" rows="5" required placeholder="What should your team know?"/><div class="demo-form-footer"><button class="btn outlined" type="button" @click="noteDialog.close()">Cancel</button><button class="btn primary">Add note</button></div></form></dialog>
  <div class="toaster" role="region" aria-label="Workspace notifications" aria-live="polite"><div v-if="toast" class="alert success"><Icon name="check"/><p>{{ toast }}</p><button class="btn ghost sm" aria-label="Dismiss notification" @click="toast = ''"><Icon name="x"/></button></div></div>
</template>
