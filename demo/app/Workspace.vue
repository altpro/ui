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
const sorts = { name: (a, b) => a.name.localeCompare(b.name), 'price-high': (a, b) => b.price - a.price, 'price-low': (a, b) => a.price - b.price, 'stock-low': (a, b) => a.stock - b.stock };
const filtered = computed(() => store.products.filter(p =>
  (status.value === 'All' || p.status === status.value) &&
  (!category.value || p.category === category.value) &&
  (!stockFilter.value || (stockFilter.value === 'low' ? stockAlert(p) : p.stock === 0)) &&
  `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.value.toLowerCase())
).sort(sorts[sort.value]));
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 6)));
const visible = computed(() => filtered.value.slice((pageNumber.value - 1) * 6, pageNumber.value * 6));
const allSelected = computed(() => visible.value.length > 0 && visible.value.every(p => selected.value.includes(p.id)));
const activeProducts = computed(() => store.products.filter(p => p.status === 'Active'));
const lowStock = computed(() => activeProducts.value.filter(stockAlert).sort((a, b) => a.stock - b.stock));
// how many filters narrow the list besides the status tabs and the search; the Filters button on a phone counts them
const filterCount = computed(() => [category.value, stockFilter.value].filter(Boolean).length);
const timeline = computed(() => store.activity.filter(a => activityType.value === 'All' || a.type === activityType.value));
const productActivity = computed(() => store.activity.filter(a => a.product === product.value?.id));
// the time of the latest change as it reads inside a sentence
const lastChange = computed(() => productActivity.value[0]?.time.replace(/^(Today|Yesterday|Just now)/, t => t.toLowerCase()));
// a product saved before channels existed is on in both
const channel = (p, key) => p.channels?.[key] ?? true;
const availability = computed(() => {
  const p = product.value;
  if (p.status === 'Draft') return 'Only your team can see this product.';
  if (p.status === 'Archived') return 'This product is no longer listed in your store.';
  if (!p.stock) return 'Listed, but nobody can order it until stock arrives.';
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
const change = c => `${c < 0 ? 'Down' : 'Up'} ${Math.abs(c).toFixed(1)}%`;
// what each product sold in the period, best first
const sold = computed(() => {
  const totals = {};
  salesDays.value.flatMap(d => daySales(d).lines).forEach(l => {
    totals[l.id] ??= { units: 0, revenue: 0 };
    totals[l.id].units += l.units; totals[l.id].revenue += l.revenue;
  });
  return Object.entries(totals).map(([id, t]) => ({ ...t, product: store.products.find(p => p.id === id) })).filter(s => s.product && s.units).sort((a, b) => b.revenue - a.revenue);
});
const topProducts = computed(() => sold.value.slice(0, 5));
const chart = computed(() => {
  const now = salesDays.value.map(d => daySales(d).revenue), then = previousDays.value.map(d => daySales(d).revenue);
  const step = Math.ceil(Math.max(...now, ...then) / 3 / 500) * 500, top = step * 3, n = now.length;
  const y = v => 100 - v / top * 100;
  const x = i => n > 1 ? i / (n - 1) * 100 : 50;
  // one day is drawn as a flat line across the plot
  const line = values => (values.length > 1 ? values : [values[0], values[0]]).map((v, i, all) => `${(i / (all.length - 1) * 100).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const count = Math.min(n, 7);
  const labels = [...new Set(Array.from({ length: count }, (_, i) => Math.round(i * (n - 1) / Math.max(count - 1, 1))))]
    .map(i => ({ text: longDate(salesDays.value[i], n > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' }), x: x(i) }));
  const best = now.indexOf(Math.max(...now));
  return {
    line: line(now), prior: line(then), labels,
    axis: [3, 2, 1, 0].map(k => ({ text: k ? `£${step * k / 1000}k` : '£0', y: y(step * k) })),
    peak: `${longDate(salesDays.value[best], { weekday: 'long', day: 'numeric', month: 'long' })}, ${money(now[best])}`,
    points: now.map((v, i) => ({ x: x(i), y: y(v), priorY: y(then[i]), date: longDate(salesDays.value[i], { weekday: 'short', day: 'numeric', month: 'short' }), now: money(v), then: money(then[i]) })),
  };
});
// the day under the pointer or the arrow keys; the tip names it and both totals
const pointed = ref(-1);
const tip = computed(() => chart.value.points[pointed.value]);
function pointAt(event) {
  const box = event.currentTarget.getBoundingClientRect(), last = chart.value.points.length - 1;
  pointed.value = Math.round(Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * last);
}
function stepPoint(by) {
  const last = chart.value.points.length - 1;
  pointed.value = pointed.value < 0 ? last : Math.min(Math.max(pointed.value + by, 0), last);
}
watch(salesDays, () => { pointed.value = -1; });
const categoryIcon = { Headphones: 'headphones', Speakers: 'speaker', Turntables: 'disc' };
const activityIcon = type => ({ Inventory: 'blocks', Price: 'tag', Note: 'bubble' })[type] ?? 'package';
const stockLabel = p => p.stock ? `${p.stock} in stock` : 'Out of stock';
// out of stock on a live product is the loudest stock state, then low; a draft or archived product needs neither
const stockAlert = p => p.status !== 'Active' ? null : p.stock === 0 ? { class: 'soft danger', label: 'Out of stock' } : p.stock < 10 ? { class: 'soft warning', label: `${p.stock} left` } : null;
// shares that add up to 100: the largest remainders round up
const categorySales = computed(() => {
  const rows = categories.map(name => ({ name, value: sold.value.filter(s => s.product.category === name).reduce((n, s) => n + s.revenue, 0) })).sort((a, b) => b.value - a.value);
  const sum = rows.reduce((n, c) => n + c.value, 0) || 1;
  const shares = rows.map(c => ({ ...c, exact: c.value / sum * 100, share: Math.floor(c.value / sum * 100) }));
  [...shares].sort((a, b) => (b.exact - b.share) - (a.exact - a.share)).slice(0, 100 - shares.reduce((n, c) => n + c.share, 0)).forEach(c => c.share += 1);
  return shares;
});
watch([query, category, status, stockFilter, sort], () => { pageNumber.value = 1; selected.value = []; });
watch(() => store.products.length, () => { pageNumber.value = Math.min(pageNumber.value, pageCount.value); });
function shortcut(event) {
  if (event.key === '/' && props.screen === 'products' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
    event.preventDefault(); document.querySelector('input[aria-label="Search products"]')?.focus();
  }
}
onMounted(() => {
  document.addEventListener('keydown', shortcut);
  // the shell's breadcrumb and the tab name the record, as the page does
  if (props.screen === 'product' && product.value) {
    document.querySelector('.breadcrumb [aria-current="page"]').textContent = product.value.name;
    document.title = `${product.value.name} · Forma`;
  }
});
onUnmounted(() => { document.removeEventListener('keydown', shortcut); clearTimeout(toastTimer); });
function notify(message) { toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 6000); }
function clearFilters() { query.value = ''; category.value = ''; stockFilter.value = ''; status.value = 'All'; }
const closeFilters = () => document.getElementById('product-filters')?.hidePopover();
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
      <div class="demo-page-heading">
        <div><h1>Overview</h1><p class="muted">{{ rangeLabel }}, compared with the previous {{ periodName }}</p></div>
        <div class="demo-period" role="group" aria-label="Sales period">
          <div v-if="custom || !preset" class="join"><input type="date" class="input" aria-label="Sales from" :value="range[0]" @change="setDay(0, $event)"><input type="date" class="input" aria-label="Sales to" :value="range[1]" @change="setDay(1, $event)"></div>
          <select class="input" aria-label="Sales period preset" :value="custom ? '' : preset" @change="pickPeriod($event.target.value)">
            <option value="">Custom range</option>
            <option v-for="p in presets" :key="p.label">{{ p.label }}</option>
          </select>
        </div>
      </div>
      <div class="demo-summary-grid">
        <div v-for="stat in stats" :key="stat.label" class="card demo-stat">
          <p class="text-sm muted">{{ stat.label }}</p>
          <p class="demo-stat-value">{{ stat.value }}</p>
          <p class="text-sm font-medium" :class="stat.change < 0 ? 'text-danger' : 'text-success'">{{ change(stat.change) }}</p>
        </div>
      </div>
      <div class="demo-dashboard-main">
        <section class="card demo-revenue" aria-labelledby="revenue-heading">
          <header>
            <h2 id="revenue-heading">Sales over time</h2>
            <div class="demo-chart-key"><span><i></i> This period</span><span><i class="previous"></i> Previous {{ periodName }}</span></div>
          </header>
          <div class="demo-chart">
            <div class="demo-chart-axis"><span v-for="tick in chart.axis" :key="tick.text" :style="{ top: `${tick.y}%` }">{{ tick.text }}</span></div>
            <div class="demo-chart-plot" tabindex="0" role="group" aria-label="Revenue by day. Use the left and right arrow keys to read each day." @pointermove="pointAt" @pointerleave="pointed = -1" @blur="pointed = -1" @keydown.left.prevent="stepPoint(-1)" @keydown.right.prevent="stepPoint(1)" @keydown.esc="pointed = -1">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="`Revenue for ${rangeLabel}: ${stats[0].value}, ${stats[0].change < 0 ? 'down' : 'up'} ${Math.abs(stats[0].change).toFixed(1)} percent on the previous ${periodName}.`">
                <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--color-primary)" stop-opacity=".14"/><stop offset="1" stop-color="var(--color-primary)" stop-opacity="0"/></linearGradient></defs>
                <path class="demo-chart-grid" d="M0 0H100M0 33.33H100M0 66.67H100M0 100H100"/>
                <polygon :points="`0,100 ${chart.line} 100,100`" fill="url(#sales-fill)"/>
                <polyline :points="chart.prior" class="demo-chart-prior"/>
                <polyline :points="chart.line" class="demo-chart-line"/>
              </svg>
              <template v-if="tip">
                <span class="demo-chart-guide" :style="{ left: `${tip.x}%` }"></span>
                <span class="demo-chart-dot previous" :style="{ left: `${tip.x}%`, top: `${tip.priorY}%` }"></span>
                <span class="demo-chart-dot" :style="{ left: `${tip.x}%`, top: `${tip.y}%` }"></span>
                <div class="demo-chart-tip" role="status" :class="{ flip: tip.x > 60 }" :style="{ left: `${tip.x}%` }"><strong>{{ tip.date }}</strong><span><span class="muted">This period</span> {{ tip.now }}</span><span><span class="muted">Previous</span> {{ tip.then }}</span></div>
              </template>
            </div>
            <div class="demo-chart-labels"><span v-for="label in chart.labels" :key="label.text" :style="{ left: `${label.x}%` }">{{ label.text }}</span></div>
          </div>
          <p class="demo-card-footer demo-card-footer-split"><span>Best day: {{ chart.peak }}</span><span class="tabular-nums">Previous {{ periodName }}: {{ money(total(previousDays).revenue) }}</span></p>
        </section>
        <div class="demo-dashboard-side">
          <section class="card demo-low-stock" aria-labelledby="attention-heading">
            <header><h2 id="attention-heading">Low stock</h2><a href="products.html?stock=low" class="btn ghost sm">Review <span aria-hidden="true">→</span></a></header>
            <p v-if="!lowStock.length" class="text-sm muted">Every active product has 10 or more units.</p>
            <ul v-else class="demo-activity-list"><li v-for="p in lowStock" :key="p.id"><span class="demo-thumb sm"><ProductArt :kind="p.kind"/></span><div><a class="demo-title-link font-medium text-sm" :href="productLink(p)">{{ p.name }}</a></div><span class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span></li></ul>
          </section>
          <section class="card demo-categories" aria-labelledby="category-heading">
            <header><h2 id="category-heading">Sales by category</h2></header>
            <div class="demo-category-list">
              <div v-for="c in categorySales" :key="c.name" class="field">
                <label :for="`share-${c.name}`" class="flex items-center justify-between gap-2 font-normal">
                  <span class="flex items-center gap-2"><Icon :name="categoryIcon[c.name]" class="muted"/> {{ c.name }}</span>
                  <span class="tabular-nums"><span class="muted">{{ money(c.value) }}</span> <output :for="`share-${c.name}`" class="demo-share">{{ c.share }}%</output></span>
                </label>
                <progress :id="`share-${c.name}`" class="progress sm" :value="c.share" max="100"></progress>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div class="demo-bottom-grid">
        <section class="card demo-top-products" aria-labelledby="top-heading">
          <header><h2 id="top-heading">Top products</h2><a class="btn ghost sm" href="products.html">View all <span aria-hidden="true">→</span></a></header>
          <table class="table hover table-fixed demo-row-links">
            <colgroup><col><col class="w-20 max-md:hidden"><col class="w-32 max-md:hidden"><col class="w-28"></colgroup>
            <thead><tr><th>Product</th><th class="text-right max-md:hidden">Sold</th><th class="text-right max-md:hidden">Inventory</th><th class="text-right">Revenue</th></tr></thead>
            <tbody>
              <tr v-for="s in topProducts" :key="s.product.id">
                <td><span class="demo-row-product"><span class="demo-thumb sm"><ProductArt :kind="s.product.kind"/></span><span class="min-w-0"><a class="demo-title-link font-medium" :href="productLink(s.product)">{{ s.product.name }}</a><span class="block text-xs muted md:hidden">{{ s.units }} sold · {{ stockAlert(s.product)?.label ?? stockLabel(s.product) }}</span></span></span></td>
                <td class="text-right tabular-nums max-md:hidden">{{ s.units }}</td>
                <td class="text-right max-md:hidden"><span v-if="stockAlert(s.product)" class="badge sm" :class="stockAlert(s.product).class">{{ stockAlert(s.product).label }}</span><span v-else class="tabular-nums muted">{{ s.product.stock }}</span></td>
                <td class="text-right font-medium tabular-nums">{{ money(s.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section class="card" aria-labelledby="recent-heading">
          <header><h2 id="recent-heading">Recent activity</h2><a href="activity.html" class="btn ghost sm">View all <span aria-hidden="true">→</span></a></header>
          <ol class="demo-activity-list"><li v-for="a in store.activity.slice(0, 5)" :key="a.id"><span class="avatar sm secondary"><Icon :name="activityIcon(a.type)"/></span><div><a v-if="a.product" class="demo-title-link font-medium text-sm" :href="`product.html?id=${a.product}`">{{ a.title }}</a><p v-else class="font-medium text-sm">{{ a.title }}</p><p class="muted text-xs">{{ a.time }}</p></div></li></ol>
        </section>
      </div>
    </template>

    <template v-else-if="screen === 'products'">
      <div class="demo-page-heading">
        <div><h1>Products</h1><p class="muted">Everything you sell online and at the London studio</p></div>
        <div class="demo-page-actions"><button class="btn outlined" @click="exportProducts"><Icon name="upload"/> Export</button><button class="btn primary" @click="edit()"><Icon name="plus"/> Add product</button></div>
      </div>
      <section class="card demo-catalogue" aria-label="Product catalogue">
        <div class="tabs demo-list-tabs" role="radiogroup" aria-label="Product status"><label v-for="s in ['All', 'Active', 'Draft', 'Archived']" :key="s"><input v-model="status" type="radio" name="listing-status" :value="s"/>{{ s }} <span class="badge sm">{{ s === 'All' ? store.products.length : store.products.filter(p => p.status === s).length }}</span></label></div>
        <div class="demo-table-toolbar">
          <label class="input demo-search"><Icon name="search"/><input v-model="query" type="search" placeholder="Search products or SKU…" aria-label="Search products"/><kbd class="hidden xl:inline">/</kbd></label>
          <select v-model="category" class="input max-md:hidden" aria-label="Product category"><option value="">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select>
          <select v-model="stockFilter" class="input max-md:hidden" aria-label="Stock level"><option value="">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
          <button class="btn outlined md:hidden" popovertarget="product-filters"><Icon name="sliders"/> Filters <span v-if="filterCount" class="badge primary sm">{{ filterCount }}</span></button>
          <select v-model="sort" class="input ml-auto max-md:hidden" aria-label="Sort products"><option value="name">Name: A to Z</option><option value="price-high">Price: high to low</option><option value="price-low">Price: low to high</option><option value="stock-low">Stock: low to high</option></select>
          <div class="join demo-view-toggle" role="group" aria-label="Product layout"><button class="btn outlined" :aria-pressed="mode === 'table'" aria-label="Table view" @click="mode = 'table'"><Icon name="list"/></button><button class="btn outlined" :aria-pressed="mode === 'grid'" aria-label="Grid view" @click="mode = 'grid'"><Icon name="grid"/></button></div>
        </div>
        <div id="product-filters" popover class="dropdown space-y-4">
          <div class="field"><label for="filter-category">Category</label><select id="filter-category" v-model="category" class="input"><option value="">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select></div>
          <div class="field"><label for="filter-stock">Stock level</label><select id="filter-stock" v-model="stockFilter" class="input"><option value="">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div>
          <div class="field"><label for="filter-sort">Sort by</label><select id="filter-sort" v-model="sort" class="input"><option value="name">Name: A to Z</option><option value="price-high">Price: high to low</option><option value="price-low">Price: low to high</option><option value="stock-low">Stock: low to high</option></select></div>
          <div class="flex justify-between gap-2"><button class="btn ghost sm -ms-3" @click="category = ''; stockFilter = ''; sort = 'name'">Reset</button><button class="btn outlined sm" @click="closeFilters">Done</button></div>
        </div>
        <div v-if="selected.length" class="demo-selection"><p class="font-medium">{{ selected.length }} selected</p><button class="btn outlined sm" @click="requestArchive(selected)"><Icon name="archive"/> Archive selected</button><button class="btn ghost sm ml-auto" @click="selected = []">Clear selection</button></div>
        <div v-if="mode === 'table' && visible.length" class="demo-table-scroll" tabindex="0" role="region" aria-label="Products table">
          <table class="table hover table-fixed demo-products-table demo-row-links">
            <colgroup><col class="w-16"><col><col class="w-32 max-md:hidden"><col class="w-40 max-md:hidden"><col class="w-36 max-md:hidden"><col class="w-24 max-md:w-20"></colgroup>
            <thead><tr><th><input class="checkbox" type="checkbox" aria-label="Select all visible products" :checked="allSelected" @change="toggleAll($event.target.checked)"/></th><th>Product</th><th>Status</th><th>Inventory</th><th>Category</th><th class="text-right">Price</th></tr></thead>
            <tbody>
              <tr v-for="p in visible" :key="p.id">
                <td><input v-model="selected" class="checkbox" type="checkbox" :value="p.id" :aria-label="`Select ${p.name}`"/></td>
                <td><span class="demo-table-product"><span class="demo-thumb"><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></span><span class="min-w-0"><a :href="productLink(p)" class="demo-title-link"><strong>{{ p.name }}</strong></a><span class="muted demo-sku">{{ p.sku }}</span></span><span class="demo-table-meta"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><span v-if="stockAlert(p)" class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span><span v-else class="muted">{{ stockLabel(p) }}</span></span></span></td>
                <td><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span></td>
                <td class="whitespace-nowrap"><span v-if="stockAlert(p)" class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span><span v-else class="muted">{{ stockLabel(p) }}</span></td>
                <td class="muted">{{ p.category }}</td>
                <td class="text-right font-medium tabular-nums">{{ money(p.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="mode === 'grid' && visible.length" class="demo-product-grid demo-catalogue-grid"><a v-for="p in visible" :key="p.id" class="card demo-product-card" :href="productLink(p)"><div class="demo-product-stage"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></div><div class="demo-product-card-body"><div><h3>{{ p.name }}</h3><p class="demo-stock text-xs"><span v-if="stockAlert(p)" class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span><span v-else class="muted">{{ stockLabel(p) }}</span></p></div><strong>{{ money(p.price) }}</strong></div></a></div>
        <div v-else class="demo-empty"><Icon name="search"/><h2>{{ query ? `No products match “${query}”` : 'No products match' }}</h2><p class="muted">Try another name or SKU, or clear the filters.</p><button class="btn outlined" @click="clearFilters">Clear filters</button></div>
        <footer class="demo-table-footer"><p class="muted text-sm" role="status">{{ filtered.length ? `${(pageNumber - 1) * 6 + 1}–${Math.min(pageNumber * 6, filtered.length)} of ${filtered.length} products` : '0 products' }}</p><nav class="flex items-center gap-2" aria-label="Product pagination"><button class="btn outlined sm" :disabled="pageNumber === 1" @click="pageNumber--; selected = []" aria-label="Previous product page"><Icon name="arrow-left"/></button><span class="text-sm muted">Page {{ pageNumber }} of {{ pageCount }}</span><button class="btn outlined sm" :disabled="pageNumber === pageCount" @click="pageNumber++; selected = []" aria-label="Next product page"><Icon name="arrow-right"/></button></nav></footer>
      </section>
    </template>

    <template v-else-if="screen === 'product' && !product">
      <a href="products.html" class="btn ghost sm self-start -ml-2"><Icon name="arrow-left"/> All products</a>
      <div class="card demo-empty"><Icon name="search"/><h1>Product not found</h1><p class="muted">This link doesn’t match a product in your workspace. It may have been removed, or added in another browser tab.</p><a class="btn outlined" href="products.html">Back to all products</a></div>
    </template>

    <template v-else-if="screen === 'product'">
      <a href="products.html" class="btn ghost sm self-start -ml-2 md:hidden"><Icon name="arrow-left"/> All products</a>
      <div class="demo-page-heading">
        <div class="min-w-0">
          <div class="demo-record-title">
            <h1>{{ product.name }}</h1>
            <button class="badge" :class="statusClass(product.status)" popovertarget="status-popover" :aria-label="`${product.status}, change status`">{{ product.status }} <Icon name="chevron-down"/></button>
            <span v-if="stockAlert(product)" class="badge" :class="stockAlert(product).class">{{ stockAlert(product).label }}</span>
          </div>
          <p class="muted">{{ product.category }}<template v-if="lastChange"> · Last updated {{ lastChange }}</template></p>
        </div>
        <div class="demo-page-actions demo-record-actions"><button class="btn outlined" @click="preview.showModal()">Preview</button><button class="btn primary" @click="edit(product)"><Icon name="field"/> Edit product</button><button class="btn outlined" popovertarget="product-more" aria-label="More product actions"><Icon name="ellipsis"/></button></div>
      </div>
      <div id="status-popover" popover class="dropdown"><div class="nav"><button v-for="s in ['Active', 'Draft', 'Archived']" :key="s" :aria-current="product.status === s || null" @click="changeStatus(s)"><span class="badge sm" :class="statusClass(s)">{{ s }}</span><span v-if="product.status === s" aria-hidden="true">✓</span></button></div></div>
      <div id="product-more" popover class="dropdown right"><div class="nav"><button @click="duplicate"><Icon name="copy"/> Duplicate product</button><button v-if="product.status !== 'Archived'" @click="requestArchive([product.id]); $event.target.closest('[popover]').hidePopover()"><Icon name="archive"/> Archive product</button></div></div>
      <div class="demo-detail-grid">
        <div class="demo-detail-main">
          <div class="demo-detail-top">
            <section class="card demo-gallery" aria-label="Product images">
              <div class="demo-gallery-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="`${product.name}, ${product.finish} finish`" :angle="angle"/></div>
              <div class="demo-gallery-views"><button v-for="(a, i) in [0, 18, -18]" :key="a" class="demo-gallery-view" :aria-label="`Product image ${i + 1}`" :aria-pressed="angle === a" @click="angle = a"><ProductArt :kind="product.kind" :name="`${product.name} view ${i + 1}`" :angle="a"/></button></div>
            </section>
            <section class="card demo-description" aria-labelledby="details-heading">
              <header><h2 id="details-heading">Description</h2><button class="btn ghost sm" aria-label="Edit description" @click="edit(product, '[name=description]')">Edit</button></header>
              <div class="space-y-2 text-sm"><p class="font-medium">{{ product.subtitle }}</p><p class="leading-relaxed muted">{{ product.description }}</p></div>
              <div class="demo-tags"><span v-for="tag in product.tags" :key="tag" class="badge outlined sm">{{ tag }}</span><span v-if="!product.tags.length" class="muted text-sm">No tags yet.</span></div>
            </section>
          </div>
          <section class="card demo-finishes" aria-labelledby="finishes-heading">
            <header><h2 id="finishes-heading">Finishes</h2><button class="btn ghost sm" @click="openVariant()">Add finish</button></header>
            <div class="demo-table-scroll" tabindex="0" role="region" aria-label="Product finishes">
              <table class="table hover table-fixed demo-row-links">
                <colgroup><col><col class="w-36 max-md:hidden"><col class="w-28"><col class="w-24"></colgroup>
                <thead><tr><th>Finish</th><th class="max-md:hidden">SKU</th><th class="text-right">Available</th><th class="text-right">Price</th></tr></thead>
                <tbody><tr v-for="(v, i) in product.variants" :key="i"><td><button class="demo-title-link font-medium" :aria-label="`Edit ${v.name} finish`" @click="openVariant(i)">{{ v.name }}</button><span class="block text-xs muted demo-sku md:hidden">{{ v.sku }}</span></td><td class="muted demo-sku max-md:hidden">{{ v.sku }}</td><td class="text-right tabular-nums">{{ v.stock }}</td><td class="text-right font-medium tabular-nums">{{ money(v.price) }}</td></tr></tbody>
              </table>
            </div>
          </section>
          <section class="card demo-history demo-product-history" aria-labelledby="history-heading">
            <header><h2 id="history-heading">History</h2><button class="btn ghost sm" @click="startNote">Add note</button></header>
            <ol class="timeline"><li v-for="a in productActivity" :key="a.id"><span class="avatar secondary sm"><Icon :name="activityIcon(a.type)"/></span><p class="font-medium">{{ a.title }}</p><blockquote v-if="a.type === 'Note'">{{ a.detail }}</blockquote><p v-else class="text-sm muted">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol>
            <p v-if="!productActivity.length" class="muted text-sm">Changes to this product will appear here.</p>
          </section>
        </div>
        <div class="demo-detail-side">
          <section class="card demo-availability" aria-labelledby="availability-heading">
            <header><h2 id="availability-heading">Availability</h2></header>
            <p class="text-sm muted">{{ availability }}</p>
            <div class="demo-channels">
              <div class="demo-channel"><div><strong>Online store</strong><span class="muted">forma.audio</span></div><label class="switch"><input :checked="channel(product, 'online')" type="checkbox" role="switch" aria-label="Online store availability" @change="setChannel('online', $event.target.checked)"/></label></div>
              <div class="demo-channel"><div><strong>London studio</strong><span class="muted">In-person collection</span></div><label class="switch"><input :checked="channel(product, 'studio')" type="checkbox" role="switch" aria-label="London studio availability" @change="setChannel('studio', $event.target.checked)"/></label></div>
            </div>
          </section>
          <section class="card demo-pricing" aria-labelledby="pricing-heading">
            <header><h2 id="pricing-heading">Pricing</h2><button class="btn ghost sm" @click="openPrice">Edit pricing</button></header>
            <p class="demo-price">{{ money(product.price) }}</p>
            <dl class="dl horizontal demo-figures"><div><dt>Cost per item</dt><dd>{{ money(product.cost) }}</dd></div><div><dt>Margin</dt><dd>{{ product.price > 0 ? Math.round((product.price - product.cost) / product.price * 100) : 0 }}%</dd></div></dl>
            <p class="demo-card-footer">Includes VAT. No compare-at price set.</p>
          </section>
          <section class="card demo-inventory" aria-labelledby="inventory-heading">
            <header><h2 id="inventory-heading">Inventory</h2><button class="btn ghost sm" @click="openInventory">Adjust inventory</button></header>
            <p class="demo-price">{{ product.stock }} <span class="muted text-sm font-normal">available</span></p>
            <p class="demo-card-footer">Across {{ product.variants.length }} {{ product.variants.length === 1 ? 'finish' : 'finishes' }} at the London studio</p>
          </section>
          <section class="card demo-details" aria-labelledby="organisation-heading">
            <header><h2 id="organisation-heading">Details</h2><button class="btn ghost sm" aria-label="Edit details" @click="edit(product, '[name=category]')">Edit</button></header>
            <dl class="dl horizontal demo-figures"><div><dt>Category</dt><dd>{{ product.category }}</dd></div><div><dt>Collection</dt><dd>Studio series</dd></div><div><dt>SKU</dt><dd class="demo-sku">{{ product.sku }}</dd></div></dl>
          </section>
        </div>
      </div>
    </template>

    <template v-else-if="screen === 'activity'">
      <div class="demo-page-heading"><div><h1>Activity</h1><p class="muted">Every change to products, prices and stock, newest first.</p></div><button class="btn primary" @click="startNote"><Icon name="plus"/> Add note</button></div>
      <div class="demo-activity-layout"><section class="card demo-history" aria-labelledby="activity-heading"><header><h2 id="activity-heading">Store activity</h2><select class="input sm" v-model="activityType" aria-label="Activity type"><option>All</option><option>Product</option><option>Inventory</option><option>Price</option><option>Note</option></select></header><ol class="timeline"><li v-for="a in timeline" :key="a.id"><span class="avatar secondary sm"><Icon :name="activityIcon(a.type)"/></span><div class="flex items-start gap-2"><p class="font-medium"><a v-if="a.product" class="demo-title-link" :href="`product.html?id=${a.product}`">{{ a.title }}</a><template v-else>{{ a.title }}</template></p><span class="badge outlined sm ml-auto">{{ a.type }}</span></div><blockquote v-if="a.type === 'Note'">{{ a.detail }}</blockquote><p v-else class="text-sm muted mt-1">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol><p v-if="!timeline.length" class="muted text-sm">No {{ activityType.toLowerCase() }} activity yet.</p></section><div class="demo-side-cards"><section class="card"><header><h2>Sample workspace</h2></header><p class="muted text-sm">Explore the collection, change a price or add a finish. Your changes stay in this browser tab until you start fresh.</p><button class="btn outlined sm self-start" @click="pending = 'reset'; confirmation.showModal()">Reset workspace</button></section><section class="card"><header><h2>Built with altpro/ui</h2></header><p class="muted text-sm">The same components, from a simple field to a complete workspace.</p><a class="btn ghost sm self-start -ms-3" href="../index.html">Explore the library <span aria-hidden="true">→</span></a></section></div></div>
    </template>

  </div>

  <ProductEditor ref="editor" @save="saveProduct"/>
  <!-- the product's own editors; an unknown id has no product to edit -->
  <template v-if="product">
  <dialog ref="pricing" class="dialog divided" aria-labelledby="price-dialog-title"><header><hgroup><p>{{ product.name }}</p><h2 id="price-dialog-title">Edit pricing</h2></hgroup><button class="btn ghost sm" aria-label="Close pricing" @click="pricing.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="savePrice"><div class="grid grid-cols-2 gap-4"><Field v-model="priceDraft.price" name="retailPrice" label="Retail price" type="number" prepend="£" min="0" step="0.01" required/><Field v-model="priceDraft.cost" name="itemCost" label="Cost per item" type="number" prepend="£" min="0" step="0.01" required/></div><p class="text-sm muted">Prices include VAT. A new retail price moves every finish by the same amount.</p><div class="demo-form-footer"><button type="button" class="btn outlined" @click="pricing.close()">Cancel</button><button class="btn primary">Save pricing</button></div></form></dialog>
  <dialog ref="inventory" class="dialog drawer divided demo-editor" aria-labelledby="stock-dialog-title"><header><hgroup><p>{{ product.name }}</p><h2 id="stock-dialog-title">Adjust inventory</h2></hgroup><button class="btn ghost sm" aria-label="Close inventory" @click="inventory.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveInventory"><p class="text-sm muted">Available stock at the London studio. Update each finish below.</p><Repeater v-model="inventoryDraft" name="inventory" item="finish" :make="makeFinish" :errors="inventoryErrors" v-slot="{ row, index, errors }"><div class="grid grid-cols-2 gap-3"><Field v-model="row.name" :name="`inventory.${index}.name`" label="Finish name" required/><Field v-model="row.sku" :name="`inventory.${index}.sku`" label="Finish SKU" :errors="errors" required/></div><Field v-model="row.stock" :name="`inventory.${index}.stock`" :label="`${row.name || 'New finish'} available units`" type="number" min="0" step="1" required/></Repeater><div class="demo-form-footer"><button type="button" class="btn outlined" @click="inventory.close()">Cancel</button><button class="btn primary">Save inventory</button></div></form></dialog>
  <dialog ref="variantDialog" class="dialog divided" aria-labelledby="finish-dialog-title"><header><h2 id="finish-dialog-title">{{ variantIndex >= 0 ? 'Edit finish' : 'Add finish' }}</h2><button class="btn ghost sm" aria-label="Close finish editor" @click="variantDialog.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveVariant"><Field v-model="variantDraft.name" name="finishName" label="Finish name" required/><Field v-model="variantDraft.sku" name="finishSku" label="Finish SKU" required/><div class="grid grid-cols-2 gap-4"><Field v-model="variantDraft.price" name="finishPrice" label="Finish price" type="number" min="0" step="0.01" prepend="£" required/><Field v-model="variantDraft.stock" name="finishStock" label="Available units" type="number" min="0" step="1" required/></div><div class="demo-form-footer"><button type="button" class="btn outlined" @click="variantDialog.close()">Cancel</button><button class="btn primary">Save finish</button></div></form></dialog>
  <dialog ref="preview" class="dialog demo-preview" aria-labelledby="preview-title"><header><span class="demo-eyebrow">Forma / Studio series</span><button class="btn ghost sm ml-auto" aria-label="Close preview" @click="preview.close()"><Icon name="x"/></button></header><div class="demo-product-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="product.name" :angle="angle"/></div><div class="flex justify-between gap-4 items-start"><div><h2 id="preview-title" class="text-2xl font-semibold">{{ product.name }}</h2><p class="muted mt-2">{{ product.subtitle }}</p></div><strong class="text-xl">{{ money(product.price) }}</strong></div><p class="text-sm muted leading-relaxed">{{ product.description }}</p><button class="btn primary" :disabled="product.status !== 'Active' || product.stock === 0" @click="preview.close(); notify('Added to your demo bag.')">{{ product.stock === 0 ? 'Out of stock' : product.status !== 'Active' ? 'Not available' : 'Add to bag' }}</button></dialog>
  </template>
  <dialog ref="confirmation" class="dialog divided" aria-labelledby="confirm-title"><header><h2 id="confirm-title">{{ pending === 'reset' ? 'Start fresh?' : archiveName ? `Archive “${archiveName}”?` : `Archive ${archiveCount} products?` }}</h2></header><p class="text-sm muted">{{ pending === 'reset' ? 'Your changes in this tab will be cleared and the original collection restored.' : archiveName ? 'It will be removed from your store. You can make it active again from its product page.' : `These ${archiveCount} products will be removed from your store. You can make each one active again from its product page.` }}</p><footer class="justify-end"><button class="btn outlined" @click="confirmation.close()">Cancel</button><button class="btn" :class="pending === 'reset' ? 'primary' : 'danger'" @click="pending === 'reset' ? (resetWorkspace(), confirmation.close(), notify('Workspace reset.')) : archiveProducts()">{{ pending === 'reset' ? 'Reset workspace' : archiveName ? 'Archive product' : `Archive ${archiveCount} products` }}</button></footer></dialog>
  <dialog ref="noteDialog" class="dialog divided" aria-labelledby="note-title"><header><h2 id="note-title">Add a note</h2><button class="btn ghost sm" aria-label="Close note" @click="noteDialog.close()"><Icon name="x"/></button></header><form class="space-y-5" @submit.prevent="saveNote"><Field v-model="note" name="note" label="Your note" type="textarea" rows="5" required placeholder="What should your team know?"/><div class="demo-form-footer"><button class="btn outlined" type="button" @click="noteDialog.close()">Cancel</button><button class="btn primary">Add note</button></div></form></dialog>
  <div class="toaster" role="region" aria-label="Workspace notifications" aria-live="polite"><div v-if="toast" class="alert success"><Icon name="check"/><p>{{ toast }}</p><button class="btn ghost sm" aria-label="Dismiss notification" @click="toast = ''"><Icon name="x"/></button></div></div>
</template>
