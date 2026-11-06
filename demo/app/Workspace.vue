<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import Field from '@ui/Field.vue';
import Repeater from '@ui/Repeater.vue';
import ProductArt from './ProductArt.vue';
import ProductEditor from './ProductEditor.vue';
import Icon from './Icon.vue';
import { datePresets } from '@ui/dataTable';
import { fieldErrors, withoutField } from './validate.js';
import { store, money, categories, statusClass, record, resetWorkspace, daySales, day, shift, seededName } from './store.js';
const props = defineProps({ screen: String });
const editor = ref();
const pricing = ref();
const inventory = ref();
const variantDialog = ref();
const preview = ref();
const confirmation = ref();
const noteDialog = ref();
// the list's state lives in the query string, so a reload or the way back from a product finds it as it was
const listParams = new URLSearchParams(location.search);
const query = ref(listParams.get('q') ?? '');
const category = ref(categories.includes(listParams.get('category')) ? listParams.get('category') : '');
const stockFilter = ref(['low', 'out'].includes(listParams.get('stock')) ? listParams.get('stock') : '');
const status = ref(['Active', 'Draft', 'Archived'].includes(listParams.get('status')) ? listParams.get('status') : stockFilter.value ? 'Active' : 'All');
// a stock filter only applies to the Active tab
if (status.value !== 'Active') stockFilter.value = '';
// arriving to restock, the worst product comes first
const sort = ref(['name', 'price-high', 'price-low', 'stock-low'].includes(listParams.get('sort')) ? listParams.get('sort') : stockFilter.value === 'low' ? 'stock-low' : 'name');
const mode = ref(listParams.get('view') === 'grid' ? 'grid' : 'table');
const pageNumber = ref(Math.max(1, Math.floor(Number(listParams.get('page'))) || 1));
const selected = ref([]);
const angle = ref(0);
const activityType = ref('All');
const note = ref('');
const noteError = ref('');
const pricingErrors = ref({});
const finishErrors = ref({});
watch(note, () => { noteError.value = ''; });
const toast = ref('');
const toastPlain = ref(false);
let toastTimer;
const editing = ref(null);
const priceDraft = reactive({ price: 0, cost: 0 });
const inventoryDraft = ref([]);
const inventoryErrors = ref({});
const makeFinish = () => ({ name: "", sku: "", stock: 0, price: "" });
const variantDraft = reactive({ name: '', sku: '', price: 0, stock: 0 });
const variantIndex = ref(0);
const dateError = ref('');
const discardDialog = ref();
const pending = ref(null);
const productId = new URLSearchParams(location.search).get('id') || 'arc';
// an id that matches nothing shows a not-found state, never another product
const product = computed(() => store.products.find(p => p.id === productId));
const productLink = p => `product.html?id=${encodeURIComponent(p.id)}`;
// the way back from a record finds the list as it was left, filtered queue and all
const listUrl = ref(`products.html${sessionStorage.getItem('demo-list-search') ?? ''}`);
// a SKU pasted with a stray space still finds its product
const searchTerm = computed(() => query.value.trim().toLowerCase());
// the finish a search found by its SKU, which the row then names
const matchedFinish = p => {
  const q = searchTerm.value;
  return q && !`${p.name} ${p.sku}`.toLowerCase().includes(q) ? p.variants.find(v => `${v.name} ${v.sku}`.toLowerCase().includes(q)) : null;
};
const skuMatched = p => searchTerm.value && (p.sku.toLowerCase().includes(searchTerm.value) || matchedFinish(p));
// a row found through a finish shows that finish's stock and price, not the product's total and lowest
const shown = p => { const finish = matchedFinish(p); return finish ? { ...p, stock: finish.stock, price: finish.price, variants: [finish] } : p; };
const sorts = { name: (a, b) => a.name.localeCompare(b.name), 'price-high': (a, b) => b.price - a.price, 'price-low': (a, b) => a.price - b.price, 'stock-low': (a, b) => a.stock - b.stock };
const filtered = computed(() => store.products.filter(p =>
  (status.value === 'All' || p.status === status.value) &&
  (!category.value || p.category === category.value) &&
  (!stockFilter.value || (stockFilter.value === 'low' ? stockAlert(shown(p)) : p.status === 'Active' && shown(p).stock === 0)) &&
  `${p.name} ${p.sku} ${p.category} ${p.variants.map(v => `${v.name} ${v.sku}`).join(' ')}`.toLowerCase().includes(searchTerm.value)
).sort((a, b) => sorts[sort.value](shown(a), shown(b))));
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
// on its own page an entry doesn't repeat the product's name
const historyTitle = a => {
  const name = [a.subject, seededName(a.product), product.value?.name].find(n => n && a.title.startsWith(`${n} `));
  if (!name) return a.title;
  const rest = a.title.slice(name.length + 1);
  return rest[0].toUpperCase() + rest.slice(1);
};
const lastChange = computed(() => productActivity.value.find(a => a.type !== 'Note')?.time.replace(/^(Today|Yesterday|Just now)/, t => t.toLowerCase()));
// a product saved before channels existed is on in both
const channel = (p, key) => p.channels?.[key] ?? true;
// the channels a product is on in, as they read in a sentence; live in none of them, it's off sale whatever its status says
const channelNames = p => [channel(p, 'online') && 'your online store', channel(p, 'studio') && 'the London studio'].filter(Boolean).join(' and ');
const offSale = p => p.status === 'Active' && !channelNames(p);
const availability = computed(() => {
  const p = product.value;
  if (p.status === 'Draft') return channelNames(p) ? 'Goes live in these channels when published.' : 'Off in every channel, so publishing won\'t put it on sale.';
  if (p.status === 'Archived') return 'Not listed. Make it active to sell it again.';
  const online = channel(p, 'online'), studio = channel(p, 'studio');
  if (!online && !studio) return 'Switched off in every channel, so nobody can order it.';
  if (!p.stock) return 'Listed, but nobody can order it until stock arrives.';
  return online && studio ? 'Visible in your store and ready to order.'
    : online ? 'Sold online only, not at the London studio.'
    : 'Hidden online. Available at the London studio only.';
});
// the one thing this record is waiting for; it takes the header's primary button
const nextAction = computed(() => {
  const p = product.value;
  if (!p) return null;
  if (p.status === 'Draft') return { label: 'Publish', run: () => changeStatus('Active') };
  if (p.status === 'Archived') return { label: 'Make active', run: () => changeStatus('Active') };
  if (offSale(p)) return { label: 'Choose channels', run: () => document.querySelector('.demo-availability input:not(:checked)')?.focus() };
  return stockAlert(p) ? { label: 'Adjust inventory', run: openInventory } : null;
});
// retail prices include VAT at 20%; costs do not, so margin is on the net price
const margin = p => { const net = p.price / 1.2; return net > 0 ? Math.round((net - p.cost) / net * 100) : 0; };
const archiveCount = computed(() => Array.isArray(pending.value) ? pending.value.length : 0);
const archiveName = computed(() => archiveCount.value === 1 ? store.products.find(p => p.id === pending.value[0])?.name : '');
// a selection can span pages, so the dialog names what it will archive
const archiveLive = computed(() => Array.isArray(pending.value) && pending.value.some(id => { const p = store.products.find(p => p.id === id); return p?.status === 'Active' && channelNames(p); }));
const archiveNames = computed(() => Array.isArray(pending.value) ? new Intl.ListFormat('en-GB').format(pending.value.map(id => store.products.find(p => p.id === id)?.name).filter(Boolean)) : '');
// the dashboard period is the DataTable date filter: a preset or any two dates
const today = day(new Date());
const presets = datePresets();
const range = ref([...presets[1].range]);
const preset = computed(() => presets.find(p => p.range.join() === range.value.join())?.label ?? '');
// Custom range shows the two dates; picking a preset hides them again
const custom = ref(false);
function pickPeriod(label) {
  custom.value = !label;
  dateError.value = '';
  // a preset can run past today, as This month does; the dates shown never do
  if (!label) range.value = range.value.map(d => d > today ? today : d);
  if (label) range.value = [...presets.find(p => p.label === label).range];
}
function setDay(i, event) {
  const value = event.target.value, next = range.value.with(i, value);
  dateError.value = !value ? '' : value > today ? 'Choose a date up to today.' : next[0] > next[1] ? 'The end date must be on or after the start date.' : '';
  if (!value || dateError.value) return void (event.target.value = range.value[i]);
  range.value = next;
}
// the days with sales: none after today, and a reversed range reads forwards
const salesDays = computed(() => {
  const [from, to] = range.value.map(d => d > today ? today : d);
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
  return [['Total sales', money(now[0])], ['Orders', now[1].toLocaleString('en-GB')], ['Average order', money(Math.round(now[2] * 100) / 100)], ['Conversion rate', `${now[3].toFixed(1)}%`]]
    // a rate moves in points; the other figures move by a percentage of themselves
    .map(([label, value], i) => ({ label, value, unit: i === 3 ? ' pts' : '%', change: i === 3 ? now[3] - then[3] : (now[i] / then[i] - 1) * 100 }));
});
// a change too small to show at one decimal is no change, in words and in colour
const flat = stat => Math.abs(stat.change) < .05;
const change = stat => flat(stat) ? 'No change' : `${stat.change < 0 ? 'Down' : 'Up'} ${Math.abs(stat.change).toFixed(1)}${stat.unit}`;
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
const dayName = d => d === today ? 'Today' : d === shift(today, -1) ? 'Yesterday' : longDate(d, { day: 'numeric', month: 'short' });
const chart = computed(() => {
  const now = salesDays.value.map(d => daySales(d).revenue), then = previousDays.value.map(d => daySales(d).revenue);
  // one day's bars carry their figures above them, so its scale leaves room for those
  const n = now.length, step = Math.ceil(Math.max(...now, ...then) / (n === 1 ? 2.6 : 3) / 500) * 500, top = step * 3;
  const y = v => 100 - v / top * 100;
  const x = i => n > 1 ? i / (n - 1) * 100 : 50;
  // one day is drawn as a flat line across the plot
  const line = values => (values.length > 1 ? values : [values[0], values[0]]).map((v, i, all) => `${(i / (all.length - 1) * 100).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  // both ends, with even steps from the first day; a step that lands right beside the last is dropped
  const tickStep = Math.max(1, Math.ceil((n - 1) / 6));
  const ticks = Array.from({ length: Math.ceil((n - 1) / tickStep) }, (_, k) => k * tickStep);
  if (ticks.length > 1 && n - 1 - ticks.at(-1) < tickStep / 2) ticks.pop();
  const labels = [...ticks, n - 1]
    .map(i => ({ text: longDate(salesDays.value[i], n > 7 ? { day: 'numeric', month: 'short' } : { weekday: 'short' }), x: x(i) }));
  const best = now.indexOf(Math.max(...now));
  if (n === 1) labels.splice(0, 1, { text: dayName(previousDays.value[0]), x: 33 }, { text: dayName(salesDays.value[0]), x: 67 });
  return {
    line: line(now), prior: line(then), labels,
    axis: [3, 2, 1, 0].map(k => ({ text: k ? `£${step * k / 1000}k` : '£0', y: y(step * k) })),
    peak: `${longDate(salesDays.value[best], { weekday: 'short', day: 'numeric', month: 'short' })}, ${money(now[best])}`,
    points: now.map((v, i) => ({ x: x(i), y: y(v), priorY: y(then[i]), date: longDate(salesDays.value[i], { weekday: 'short', day: 'numeric', month: 'short' }), priorDate: longDate(previousDays.value[i], { weekday: 'short', day: 'numeric', month: 'short' }), now: money(v), then: money(then[i]) })),
  };
});
// the day under the pointer or the arrow keys; the tip names it and both totals
const pointed = ref(-1);
const tip = computed(() => chart.value.points[pointed.value]);
const singleDay = computed(() => salesDays.value.length === 1);
function pointAt(event) {
  if (singleDay.value) return;
  const box = event.currentTarget.getBoundingClientRect(), last = chart.value.points.length - 1;
  pointed.value = Math.round(Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) * last);
}
function stepPoint(by) {
  if (singleDay.value) return;
  const last = chart.value.points.length - 1;
  pointed.value = pointed.value < 0 ? last : Math.min(Math.max(pointed.value + by, 0), last);
}
watch(salesDays, () => { pointed.value = -1; });
const categoryIcon = { Headphones: 'headphones', Speakers: 'speaker', Turntables: 'disc' };
const activityIcon = type => ({ Inventory: 'layers', Price: 'tag', Note: 'bubble' })[type] ?? 'package';
// the lowest price, marked when the finishes differ
const priceVaries = p => new Set(p.variants.map(v => Number(v.price))).size > 1;
const priceLabel = p => `${priceVaries(p) ? 'From ' : ''}${money(p.price)}`;
const previewFinish = ref(0);
const previewed = computed(() => product.value?.variants[previewFinish.value] ?? product.value?.variants[0]);
const previewBlock = computed(() => {
  const p = product.value;
  return p.status !== 'Active' ? 'Not available' : !channel(p, 'online') ? 'Not sold online' : !previewed.value?.stock ? 'Out of stock' : '';
});
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
// only active products have a stock state to act on, so a stock filter opens the Active tab
// the list's own message goes as soon as there's a finish again
watch(() => inventoryDraft.value.length, length => { if (length && inventoryErrors.value.inventory) inventoryErrors.value = withoutField(inventoryErrors.value, { target: { name: 'inventory' } }); });
watch(stockFilter, value => { if (value) status.value = 'Active'; });
watch(status, value => { if (value !== 'Active') stockFilter.value = ''; });
// grid view has no checkboxes, so a selection can't be carried into it unseen
watch(mode, () => { selected.value = []; });
// when the header's primary button goes with what it did, focus moves to the one that takes its place
watch(() => nextAction.value?.label, () => nextTick(() => { if (document.activeElement === document.body) document.querySelector('.demo-record-actions .btn.primary')?.focus(); }), { flush: 'post' });
watch(pageCount, n => { pageNumber.value = Math.min(pageNumber.value, n); }, { immediate: true });
watch([query, category, status, stockFilter, sort, mode, pageNumber], () => { if (props.screen === 'products') writeListUrl(); });
function writeListUrl() {
  const entries = { q: query.value, category: category.value, stock: stockFilter.value, status: status.value === 'All' ? '' : status.value, sort: sort.value === (stockFilter.value === 'low' ? 'stock-low' : 'name') ? '' : sort.value, view: mode.value === 'grid' ? 'grid' : '', page: pageNumber.value > 1 ? pageNumber.value : '' };
  const search = new URLSearchParams(Object.entries(entries).filter(([, v]) => v)).toString();
  history.replaceState(null, '', search ? `?${search}` : location.pathname);
  sessionStorage.setItem('demo-list-search', search ? `?${search}` : '');
}
function shortcut(event) {
  if (event.key === '/' && props.screen === 'products' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
    event.preventDefault(); document.querySelector('input[aria-label="Search products"]')?.focus();
  }
}
onMounted(() => {
  // arriving on a filtered list counts as leaving it that way, even if no control is touched
  if (props.screen === 'products') writeListUrl();
  document.addEventListener('keydown', shortcut);
  window.addEventListener('beforeunload', warnUnsaved);
});
// the shell's breadcrumb and the tab name the record, as the page does, through a rename too
watch(() => product.value?.name, name => {
  if (props.screen !== 'product' || !name) return;
  nextTick(() => {
    document.querySelector('.breadcrumb [aria-current="page"]').textContent = name;
    document.title = `${name} · Forma`;
  });
}, { immediate: true });
onUnmounted(() => { document.removeEventListener('keydown', shortcut); window.removeEventListener('beforeunload', warnUnsaved); clearTimeout(toastTimer); });
// plain: a fact, not a success, so it takes no green tick
function notify(message, plain = false) { toastPlain.value = plain; toast.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.value = '', 6000); }
function clearFilters() { query.value = ''; category.value = ''; stockFilter.value = ''; status.value = 'All'; }
const narrowed = computed(() => query.value || filterCount.value > 0);
const emptyHint = { All: 'Add a product to start your catalogue.', Active: 'Publish a draft and it appears here.', Draft: 'New and duplicated products start here.', Archived: 'Products you archive appear here.' };
const clearNarrowing = () => { clearFilters(); sort.value = 'name'; };
// the button that cleared goes with what it cleared, so focus moves to the search field
const clearAndFocus = () => {
  clearNarrowing();
  // on touch the list takes focus instead, or the keyboard would cover what was just restored
  nextTick(() => document.querySelector(matchMedia('(pointer: coarse)').matches ? '.demo-catalogue' : 'input[aria-label="Search products"]')?.focus());
};
// the count names its base: the tab it is counted against, once anything narrows the list
const countBase = computed(() => stockFilter.value ? 'Active' : status.value);
const tabCount = computed(() => countBase.value === 'All' ? store.products.length : store.products.filter(p => p.status === countBase.value).length);
const countLabel = computed(() => {
  const n = filtered.value.length, base = countBase.value === 'All' ? '' : ` ${countBase.value.toLowerCase()}`;
  if (pageCount.value > 1) return `${(pageNumber.value - 1) * 6 + 1}–${Math.min(pageNumber.value * 6, n)} of ${n}${base} products`;
  return n < tabCount.value ? `${n} of ${tabCount.value}${base} products` : `${n}${base} ${n === 1 ? 'product' : 'products'}`;
});
const closeFilters = () => document.getElementById('product-filters')?.hidePopover();
function toggleAll(checked) { selected.value = checked ? [...new Set([...selected.value, ...visible.value.map(p => p.id)])] : selected.value.filter(id => !visible.value.some(p => p.id === id)); }
// an editor closes straight away when nothing changed; otherwise it asks first
const comparable = value => JSON.stringify(value, (key, v) => typeof v === 'number' ? String(v) : v);
let discardTarget = null;
function leave(dialog, clean) {
  if (clean) return dialog.close();
  discardTarget = dialog; discardDialog.value.showModal();
}
function discardChanges() { discardDialog.value.close(); discardTarget?.close(); discardTarget = null; }
const finishFields = list => list.map(({ name, sku, stock, price }) => ({ name, sku, stock, price }));
const pricingClean = () => comparable({ ...priceDraft }) === comparable({ price: product.value.price, cost: product.value.cost });
const inventoryClean = () => comparable(finishFields(inventoryDraft.value)) === comparable(finishFields(product.value.variants));
const variantClean = () => comparable(finishFields([variantDraft])) === comparable(finishFields([product.value.variants[variantIndex.value]]));
const noteClean = () => !note.value.trim();
const closePricing = () => leave(pricing.value, pricingClean());
const closeInventory = () => leave(inventory.value, inventoryClean());
const closeVariant = () => leave(variantDialog.value, variantClean());
const closeNote = () => leave(noteDialog.value, noteClean());
// leaving the page with an editor's changes unsaved: the browser asks, as a close does here
function warnUnsaved(event) {
  const open = [[pricing, pricingClean], [inventory, inventoryClean], [variantDialog, variantClean], [noteDialog, noteClean]];
  if (open.some(([dialog, clean]) => dialog.value?.open && !clean()) || editor.value?.dialog?.open && !editor.value.clean()) event.preventDefault();
}
function edit(p, focus) { editing.value = p?.id || null; editor.value.open(p, false, focus); }
// a product's stock is its finishes' total and its retail price the lowest of theirs
function syncFinishes(p) {
  p.stock = p.variants.reduce((sum, v) => sum + Number(v.stock), 0);
  p.price = Math.min(...p.variants.map(v => Number(v.price)));
}
// a SKU is taken if any other product or finish uses it; a product's own finishes may share its SKU
const sameSku = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
const skuTaken = (sku, productId) => store.products.some(p => p.id !== productId && [p.sku, ...p.variants.map(v => v.sku)].some(other => sameSku(other, sku)));
const skuError = 'Enter a SKU no other product or finish uses.';
const checkProductSku = sku => skuTaken(sku, editing.value) ? skuError : '';
function saveProduct(draft) {
  // a product keeps its drawing while it stays in a category that has it; a new or moved one takes the category's first
  const kinds = { Headphones: ['headphones', 'studio', 'earbuds'], Speakers: ['speaker', 'stereo', 'mini'], Turntables: ['turntable', 'deck'] }[draft.category];
  if (!kinds.includes(draft.kind)) draft.kind = kinds[0];
  if (editing.value) {
    const target = store.products.find(p => p.id === editing.value);
    const fields = { name: 'name', subtitle: 'short description', description: 'description', category: 'category', sku: 'SKU', tags: 'tags', image: 'image' };
    const changed = Object.keys(fields).filter(key => JSON.stringify(target[key]) !== JSON.stringify(draft[key]));
    const exact = changed.filter(key => ['name', 'sku'].includes(key)).map(key => `${fields[key] === 'name' ? 'Name' : fields[key]} changed from ${target[key]} to ${draft[key]}.`);
    const others = changed.filter(key => !['name', 'sku'].includes(key)).map(key => fields[key]);
    if (others.length) exact.push(`Alex Morgan changed the ${new Intl.ListFormat('en-GB').format(others)}.`);
    Object.assign(target, draft);
    record(`${draft.name} details updated`, exact.join(' '), target.id);
  } else {
    draft.id = `${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    draft.sales = 0;
    if (!draft.variants.length) draft.variants = [{ name: draft.finish, sku: draft.sku, stock: Number(draft.stock), price: Number(draft.price) }];
    syncFinishes(draft);
    store.products.unshift(draft);
    record(`${draft.name} added as a draft`, 'Alex Morgan added the product.', draft.id);
  }
  // a new product or a duplicate opens, so the next step (Publish, stock) lands on it; the list may not even show it
  if (!editing.value) return void nextTick(() => location.assign(productLink(draft)));
  notify('Product updated.');
}
// an editor opens on its first field, not its close button
function openEditor(dialog, field) { dialog.showModal(); dialog.querySelector(field)?.focus(); }
function openPrice() { pricingErrors.value = {}; Object.assign(priceDraft, { price: product.value.price, cost: product.value.cost }); openEditor(pricing.value, '[name=retailPrice]'); }
function savePrice(event) {
  pricingErrors.value = fieldErrors(event.target);
  if (Object.keys(pricingErrors.value).length) return;
  if (pricingClean()) return pricing.value.close();
  const p = product.value, oldPrice = p.price, oldCost = p.cost, difference = Number(priceDraft.price) - oldPrice;
  p.price = Number(priceDraft.price); p.cost = Number(priceDraft.cost);
  p.variants.forEach(v => v.price = Math.max(0, Math.round((v.price + difference) * 100) / 100));
  const changes = [p.price !== oldPrice && `Retail price changed from ${money(oldPrice)} to ${money(p.price)}.`, p.cost !== oldCost && `Cost per item changed from ${money(oldCost)} to ${money(p.cost)}.`].filter(Boolean);
  record(`${p.name} ${p.price !== oldPrice ? 'price' : 'cost'} updated`, changes.join(' '), p.id, 'Price');
  pricing.value.close(); notify('Pricing updated.');
}
function openInventory() { inventoryErrors.value = {}; inventoryDraft.value = product.value.variants.map((v, origin) => ({ ...v, origin })); nextTick(() => openEditor(inventory.value, '[name="inventory.0.stock"]')); }
function saveInventory(event) {
  const errors = fieldErrors(event.target);
  if (Object.keys(errors).length) return void (inventoryErrors.value = errors);
  if (inventoryClean()) return inventory.value.close();
  if (!inventoryDraft.value.length) errors.inventory = 'Add at least one finish.';
  const skus = new Set();
  inventoryDraft.value.forEach((v, i) => {
    const sku = v.sku.trim().toLowerCase();
    if (skus.has(sku) || skuTaken(sku, product.value.id)) errors[`inventory.${i}.sku`] = skuError;
    skus.add(sku);
  });
  inventoryErrors.value = errors;
  if (Object.keys(errors).length) return void nextTick(() => inventory.value.querySelector('[aria-invalid="true"]')?.focus());
  const p = product.value, before = p.variants, rows = inventoryDraft.value;
  p.variants = rows.map(({ origin, ...v }) => ({ ...v, stock: Number(v.stock), price: Number(v.price) }));
  syncFinishes(p);
  const priceChanged = rows.some(v => v.origin !== undefined && before[v.origin].price !== Number(v.price));
  const stockChanged = rows.some(v => v.origin !== undefined && before[v.origin].stock !== Number(v.stock));
  const otherChanged = rows.length !== before.length || rows.some((v, i) => v.origin !== i || before[v.origin].name !== v.name || before[v.origin].sku !== v.sku);
  const kind = otherChanged || (priceChanged && stockChanged) ? 'finishes' : priceChanged ? 'price' : 'stock';
  record(`${p.name} ${kind} updated`, inventoryChanges(before, rows), p.id, kind === 'price' ? 'Price' : 'Inventory');
  inventory.value.close(); notify({ price: 'Prices updated.', stock: 'Stock updated.', finishes: 'Finishes updated.' }[kind]);
}
// what an inventory save moved, each row matched to the finish it started as
function inventoryChanges(before, rows) {
  const kept = rows.filter(v => v.origin !== undefined);
  const changes = kept.flatMap(v => {
    const old = before[v.origin];
    return [
      old.name !== v.name && `${old.name} renamed ${v.name}`,
      old.sku !== v.sku && `${v.name} SKU changed from ${old.sku} to ${v.sku}`,
      old.stock !== Number(v.stock) && `${v.name} stock changed from ${old.stock} to ${v.stock}`,
      old.price !== Number(v.price) && `${v.name} price changed from ${money(old.price)} to ${money(v.price)}`,
    ];
  }).filter(Boolean);
  rows.filter(v => v.origin === undefined).forEach(v => changes.push(`${v.name} added at ${money(v.price)} with ${v.stock} in stock`));
  before.filter((old, i) => !kept.some(v => v.origin === i)).forEach(old => changes.push(`${old.name} removed`));
  if (kept.some((v, i) => i > 0 && v.origin < kept[i - 1].origin)) changes.push('Finishes reordered');
  return `${changes.join('. ')}.`;
}
function openVariant(index) {
  variantIndex.value = index; finishErrors.value = {};
  Object.assign(variantDraft, product.value.variants[index]);
  openEditor(variantDialog.value, '[name=finishName]');
}
function saveVariant(event) {
  finishErrors.value = fieldErrors(event.target);
  if (Object.keys(finishErrors.value).length) return;
  if (variantClean()) return variantDialog.value.close();
  const p = product.value, variant = { ...variantDraft, price: Number(variantDraft.price), stock: Number(variantDraft.stock) };
  if (skuTaken(variant.sku, p.id) || p.variants.some((v, i) => i !== variantIndex.value && sameSku(v.sku, variant.sku))) {
    finishErrors.value = { finishSku: skuError };
    return void nextTick(() => variantDialog.value.querySelector('[name=finishSku]')?.focus());
  }
  const old = p.variants[variantIndex.value];
  p.variants[variantIndex.value] = variant;
  syncFinishes(p);
  const changes = [
    old.name !== variant.name && `${old.name} renamed ${variant.name}.`,
    old.sku !== variant.sku && `${variant.name} SKU changed from ${old.sku} to ${variant.sku}.`,
    old.price !== variant.price && `${variant.name} price changed from ${money(old.price)} to ${money(variant.price)}.`,
    old.stock !== variant.stock && `${variant.name} stock changed from ${old.stock} to ${variant.stock}.`,
  ].filter(Boolean);
  const only = changes.length > 1 ? 'finish' : old.price !== variant.price ? 'price' : old.stock !== variant.stock ? 'stock' : 'finish';
  record(`${p.name} ${only} updated`, changes.join(' '), p.id, only === 'price' ? 'Price' : 'Inventory');
  variantDialog.value.close(); notify({ price: 'Price updated.', stock: 'Stock updated.', finish: 'Finish updated.' }[only]);
}
// the last channel going off takes the product off sale, which asks first as Draft and Archive do
let channelPending = null;
function requestChannel(key, event) {
  const p = product.value, on = event.target.checked, other = key === 'online' ? 'studio' : 'online';
  if (on || p.status !== 'Active' || channel(p, other)) return setChannel(key, on);
  event.target.checked = true;
  channelPending = key; pending.value = 'channel'; confirmation.value.showModal();
}
const channelKey = () => channelPending;
function setChannel(key, on) {
  const p = product.value, place = key === 'online' ? 'the online store' : 'the London studio';
  p.channels = { online: channel(p, 'online'), studio: channel(p, 'studio'), [key]: on };
  record(`${p.name} ${on ? 'added to' : 'removed from'} ${place}`, `Alex Morgan turned it ${on ? 'on' : 'off'}.`, p.id);
  if (p.status !== 'Active') return notify(on ? `${p.name} will go live in ${place}.` : `${p.name} will stay out of ${place}.`);
  if (on && !p.stock) return notify(`${p.name} is listed in ${place}, with no stock to sell.`);
  if (!on && !channelNames(p)) return notify(`Off sale: ${p.name}.`, true);
  notify(on ? `${p.name} is available in ${place}.` : `${p.name} is no longer available in ${place}.`);
}
function changeStatus(next) {
  const p = product.value;
  document.getElementById('status-popover').hidePopover();
  if (next === p.status) return;
  // archiving takes a product out of the store, so it asks first however it is reached
  if (next === 'Archived') return requestArchive([p.id]);
  if (next === 'Draft' && p.status === 'Active') { pending.value = 'draft'; return confirmation.value.showModal(); }
  applyStatus(next);
}
function applyStatus(next) {
  const p = product.value;
  p.status = next;
  record(`${p.name} ${next === 'Active' ? 'published' : 'moved to draft'}`, `Alex Morgan changed the product status to ${next.toLowerCase()}.`, p.id);
  const blocked = next !== 'Active' ? '' : !channelNames(p) ? ', but off in every channel' : !p.stock ? ', with no stock to sell' : '';
  notify(`${p.name} is now ${next.toLowerCase()}${blocked}.`, !!blocked);
}
// a product already archived stays out of the count and gets no second history entry
function requestArchive(ids) {
  pending.value = ids.filter(id => store.products.find(p => p.id === id)?.status !== 'Archived');
  if (pending.value.length) confirmation.value.showModal();
  else notify('Already archived.', true);
}
function archiveProducts() {
  pending.value.forEach(id => { const p = store.products.find(p => p.id === id); if (p) { const left = p.status === 'Active' && channelNames(p); p.status = 'Archived'; record(`${p.name} archived`, left ? `Alex Morgan archived the product, so it left ${left}.` : 'Alex Morgan archived the product.', id); } });
  confirmation.value.close(); clearSelection(); notify(pending.value.length === 1 ? 'Product archived.' : 'Products archived.');
}
function duplicate() {
  const p = JSON.parse(JSON.stringify(product.value)); p.name += ' (copy)'; p.status = 'Draft'; p.image = undefined;
  // the first free -COPY suffix, so duplicating twice still gives every code its own
  let suffix = '-COPY', n = 1;
  while ([p, ...p.variants].some(item => skuTaken(item.sku + suffix))) suffix = `-COPY-${++n}`;
  p.sku += suffix; p.stock = 0; p.variants.forEach(v => { v.sku += suffix; v.stock = 0; });
  document.getElementById('product-more').hidePopover(); editing.value = null; editor.value.open(p, true);
}
function exportProducts() {
  const csv = [['Product', 'Finish', 'SKU', 'Category', 'Status', 'Price', 'Stock'], ...filtered.value.filter(p => !selected.value.length || selected.value.includes(p.id)).map(p => { const finish = matchedFinish(p), row = shown(p); return [p.name, finish?.name ?? '', finish?.sku ?? p.sku, p.category, p.status, row.price, row.stock]; })].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'forma-products.csv' }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); const count = csv.split('\n').length - 1;
  notify(`${count} ${count === 1 ? 'product' : 'products'} exported.`);
}
function saveNote() {
  if (noteClean()) { noteError.value = 'Enter a note before adding it.'; return void noteDialog.value.querySelector('[name=note]')?.focus(); }
  record('Alex Morgan left a note', note.value, props.screen === 'product' ? product.value.id : null, 'Note'); note.value = ''; noteDialog.value.close(); notify('Note added.');
}
function startNote() { note.value = ''; nextTick(() => { noteError.value = ''; }); openEditor(noteDialog.value, '[name=note]'); }
// the bar that held the focus goes with the selection, so focus moves to the checkbox beside it
const selectAll = ref();
function clearSelection() { selected.value = []; nextTick(() => (selectAll.value ?? document.querySelector('.demo-page-actions .btn.primary'))?.focus()); }
const partlySelected = computed(() => !allSelected.value && visible.value.some(p => selected.value.includes(p.id)));
</script>

<template>
  <div class="demo-page">
    <template v-if="screen === 'dashboard'">
      <div class="demo-page-heading">
        <div><h1>Overview</h1><p class="muted">{{ rangeLabel }}, compared with the previous {{ periodName }}</p></div>
        <div class="demo-period" role="group" aria-label="Sales period">
          <p v-if="dateError" class="demo-period-error text-sm text-danger" role="alert">{{ dateError }}</p>
          <div v-if="custom || !preset" class="join"><label class="input"><span class="muted">From</span><input type="date" aria-label="Sales from" :value="range[0]" :max="range[1]" @change="setDay(0, $event)"></label><label class="input"><span class="muted">To</span><input type="date" aria-label="Sales to" :value="range[1]" :min="range[0]" :max="today" @change="setDay(1, $event)"></label></div>
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
          <p class="text-sm max-md:text-xs font-medium" :class="flat(stat) ? 'muted' : stat.change < 0 ? 'text-danger' : 'text-success'">{{ change(stat) }}</p>
        </div>
      </div>
      <div class="demo-dashboard-main">
        <section class="card demo-revenue" aria-labelledby="revenue-heading">
          <header>
            <h2 id="revenue-heading">Sales over time</h2>
            <div class="demo-chart-key" :class="{ bars: singleDay }"><template v-if="singleDay"><span><i class="previous"></i> {{ chart.labels[0].text }}</span><span><i></i> {{ chart.labels[1].text }}</span></template><template v-else><span><i></i> This period</span><span><i class="previous"></i> Previous {{ periodName }}</span></template></div>
          </header>
          <div class="demo-chart">
            <div class="demo-chart-axis"><span v-for="tick in chart.axis" :key="tick.text" :style="{ top: `${tick.y}%` }">{{ tick.text }}</span></div>
            <div class="demo-chart-plot" :tabindex="singleDay ? null : 0" role="group" :aria-label="singleDay ? 'Sales for the day and the day before' : 'Sales by day. Use the left and right arrow keys to read each day.'" @pointerdown="pointAt" @pointermove="pointAt" @pointerleave="$event.pointerType === 'mouse' && (pointed = -1)" @pointercancel="pointed = -1" @blur="pointed = -1" @keydown.left.prevent="stepPoint(-1)" @keydown.right.prevent="stepPoint(1)" @keydown.esc="pointed = -1">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="`Sales for ${rangeLabel}: ${stats[0].value}, ${change(stats[0]).toLowerCase()} on the previous ${periodName}.`">
                <defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--color-primary)" stop-opacity=".14"/><stop offset="1" stop-color="var(--color-primary)" stop-opacity="0"/></linearGradient></defs>
                <path class="demo-chart-grid" d="M0 0H100M0 33.33H100M0 66.67H100M0 100H100"/>
                <template v-if="!singleDay">
                  <polygon :points="`0,100 ${chart.line} 100,100`" fill="url(#sales-fill)"/>
                  <polyline :points="chart.prior" class="demo-chart-prior"/>
                  <polyline :points="chart.line" class="demo-chart-line"/>
                </template>
                <template v-else>
                  <rect class="demo-chart-bar previous" x="27" width="12" :y="chart.points[0].priorY" :height="100 - chart.points[0].priorY"/>
                  <rect class="demo-chart-bar" x="61" width="12" :y="chart.points[0].y" :height="100 - chart.points[0].y"/>
                </template>
              </svg>
              <span class="sr-only" aria-live="polite" aria-atomic="true">{{ tip ? `${tip.date}: ${tip.now}. ${tip.priorDate}: ${tip.then}.` : '' }}</span>
              <template v-if="singleDay">
                <span class="demo-chart-bar-value muted" :style="{ left: '33%', top: `${chart.points[0].priorY}%` }">{{ chart.points[0].then }}</span>
                <span class="demo-chart-bar-value" :style="{ left: '67%', top: `${chart.points[0].y}%` }">{{ chart.points[0].now }}</span>
              </template>
              <template v-else-if="tip">
                <span class="demo-chart-guide" :style="{ left: `${tip.x}%` }"></span>
                <span class="demo-chart-dot previous" :style="{ left: `${tip.x}%`, top: `${tip.priorY}%` }"></span>
                <span class="demo-chart-dot" :style="{ left: `${tip.x}%`, top: `${tip.y}%` }"></span>
                <div class="demo-chart-tip" :class="{ flip: tip.x > 50 }" :style="{ '--x': `${tip.x}%` }"><strong><span>{{ tip.date }}</span> {{ tip.now }}</strong><span class="muted"><span>{{ tip.priorDate }}</span> {{ tip.then }}</span></div>
              </template>
            </div>
            <div class="demo-chart-labels" :class="{ dense: chart.points.length > 7, bars: singleDay }"><span v-for="label in chart.labels" :key="label.text" :style="{ left: `${label.x}%` }">{{ label.text }}</span></div>
          </div>
          <p class="demo-card-footer demo-card-footer-split"><span v-if="singleDay">Same day last week: {{ money(daySales(shift(salesDays[0], -7)).revenue) }}</span><span v-else>Best day: {{ chart.peak }}</span><span v-if="!singleDay" class="tabular-nums">Previous {{ periodName }}: {{ money(total(previousDays).revenue) }}</span></p>
        </section>
        <div class="demo-dashboard-side">
          <section class="card demo-low-stock" aria-labelledby="attention-heading">
            <header><h2 id="attention-heading">Low stock</h2><a href="products.html?status=Active&stock=low" class="btn ghost sm">Review stock <span aria-hidden="true">→</span></a></header>
            <p v-if="!lowStock.length" class="text-sm muted">Every active product has 10 or more units.</p>
            <ul v-else class="demo-activity-list demo-row-links"><li v-for="p in lowStock" :key="p.id"><span class="demo-thumb sm"><ProductArt :kind="p.kind"/></span><div><a class="demo-title-link font-medium text-sm" :href="productLink(p)">{{ p.name }}</a></div><span class="badge sm" :class="stockAlert(p).class">{{ stockAlert(p).label }}</span></li></ul>
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
            <p class="demo-card-footer">Share of total sales</p>
          </section>
        </div>
      </div>
      <div class="demo-bottom-grid">
        <section class="card demo-top-products" aria-labelledby="top-heading">
          <header><h2 id="top-heading">Top products</h2><a class="btn ghost sm" href="products.html">All products <span aria-hidden="true">→</span></a></header>
          <table class="table hover table-fixed demo-row-links">
            <colgroup><col><col class="w-24 max-md:hidden"><col class="w-36 max-md:hidden"><col class="w-28"></colgroup>
            <thead><tr><th>Product</th><th class="text-right max-md:hidden">Units</th><th class="text-right max-md:hidden">In stock</th><th class="text-right">Sales</th></tr></thead>
            <tbody>
              <tr v-for="s in topProducts" :key="s.product.id">
                <td><span class="demo-row-product"><span class="demo-thumb sm"><ProductArt :kind="s.product.kind"/></span><span class="min-w-0"><a class="demo-title-link font-medium" :href="productLink(s.product)">{{ s.product.name }}</a><span class="demo-row-meta md:hidden"><span class="muted">{{ s.units }} sold</span><span v-if="stockAlert(s.product)" class="badge sm" :class="stockAlert(s.product).class">{{ stockAlert(s.product).label }}</span><span v-else class="muted">{{ stockLabel(s.product) }}</span></span></span></span></td>
                <td class="text-right tabular-nums max-md:hidden">{{ s.units }}</td>
                <td class="text-right max-md:hidden"><span v-if="stockAlert(s.product)" class="badge sm" :class="stockAlert(s.product).class">{{ stockAlert(s.product).label }}</span><span v-else class="tabular-nums muted">{{ s.product.stock || 'Out of stock' }}</span></td>
                <td class="text-right font-medium tabular-nums">{{ money(s.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section class="card" aria-labelledby="recent-heading">
          <header><h2 id="recent-heading">Recent activity</h2><a href="activity.html" class="btn ghost sm">View all <span aria-hidden="true">→</span></a></header>
          <ol class="demo-activity-list demo-row-links"><li v-for="a in store.activity.slice(0, 5)" :key="a.id"><span class="avatar sm secondary"><Icon :name="activityIcon(a.type)"/></span><div><a v-if="a.product" class="demo-title-link font-medium text-sm" :href="`product.html?id=${a.product}`">{{ a.title }}</a><p v-else class="font-medium text-sm">{{ a.title }}</p><p class="muted text-xs">{{ a.time }}</p></div></li></ol>
        </section>
      </div>
    </template>

    <template v-else-if="screen === 'products'">
      <div class="demo-page-heading">
        <div><h1>Products</h1></div>
        <div class="demo-page-actions"><button class="btn outlined" :disabled="!filtered.length" @click="exportProducts"><Icon name="download"/> <span class="tabular-nums">{{ selected.length ? `Export ${selected.length} selected` : 'Export' }}</span></button><button class="btn primary" @click="edit()"><Icon name="plus"/> Add product</button></div>
      </div>
      <section class="card demo-catalogue" tabindex="-1" aria-label="Product catalogue">
        <div class="tabs demo-list-tabs" role="radiogroup" aria-label="Product status"><label v-for="s in ['All', 'Active', 'Draft', 'Archived']" :key="s"><input v-model="status" type="radio" name="listing-status" :value="s"/>{{ s }} <span class="badge sm">{{ s === 'All' ? store.products.length : store.products.filter(p => p.status === s).length }}</span></label></div>
        <div class="demo-table-toolbar">
          <label class="input demo-search"><Icon name="search"/><input v-model="query" type="search" placeholder="Search products or SKU…" aria-label="Search products"/><kbd v-if="!query" class="hidden xl:inline">/</kbd></label>
          <select v-model="category" class="input demo-inline-filter" aria-label="Product category"><option value="">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select>
          <select v-model="stockFilter" class="input demo-inline-filter" aria-label="Stock level"><option value="">All stock levels</option><option value="low">Low or out of stock</option><option value="out">Out of stock</option></select>
          <button class="btn outlined demo-filter-button" popovertarget="product-filters"><Icon name="sliders"/> Filters <span v-if="filterCount" class="badge primary sm">{{ filterCount }}</span></button>
          <button v-if="filterCount && filtered.length" class="btn ghost sm demo-inline-filter text-muted-foreground hover:text-foreground" @click="clearAndFocus">Clear</button>
          <select v-model="sort" class="input ml-auto demo-inline-filter" aria-label="Sort products"><option value="name">Name: A to Z</option><option value="price-high">Price: high to low</option><option value="price-low">Price: low to high</option><option value="stock-low">Stock: low to high</option></select>
          <div class="join demo-view-toggle" role="group" aria-label="Product layout"><button class="btn outlined" :aria-pressed="mode === 'table'" aria-label="Table view" @click="mode = 'table'"><Icon name="list"/></button><button class="btn outlined" :aria-pressed="mode === 'grid'" aria-label="Grid view" @click="mode = 'grid'"><Icon name="grid"/></button></div>
        </div>
        <div id="product-filters" popover class="dropdown space-y-4">
          <div class="field"><label for="filter-category">Category</label><select id="filter-category" v-model="category" class="input"><option value="">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select></div>
          <div class="field"><label for="filter-stock">Stock level</label><select id="filter-stock" v-model="stockFilter" class="input"><option value="">All stock levels</option><option value="low">Low or out of stock</option><option value="out">Out of stock</option></select></div>
          <div class="field"><label for="filter-sort">Sort by</label><select id="filter-sort" v-model="sort" class="input"><option value="name">Name: A to Z</option><option value="price-high">Price: high to low</option><option value="price-low">Price: low to high</option><option value="stock-low">Stock: low to high</option></select></div>
          <div class="flex justify-between gap-2"><button class="btn ghost sm -ms-3" @click="clearNarrowing">Reset</button><button class="btn outlined sm" @click="closeFilters">Done</button></div>
        </div>
        <div v-if="mode === 'table' && visible.length" class="demo-table-scroll">
          <table class="table hover table-fixed demo-products-table demo-row-links">
            <colgroup><col class="w-16 max-md:w-13"><col><col class="w-48 @max-[56rem]/page:w-32 max-md:hidden"><col class="w-36 max-md:hidden"><col class="w-36"><col class="w-32 max-md:w-24"></colgroup>
            <thead><tr><th class="max-md:pe-0"><input ref="selectAll" class="checkbox" type="checkbox" aria-label="Select all visible products" :checked="allSelected" :indeterminate.prop="partlySelected" @change="toggleAll($event.target.checked)"/></th><th>Product<div v-if="selected.length" class="demo-selection"><p class="font-medium whitespace-nowrap" role="status">{{ selected.length }} selected</p><button class="btn outlined sm" :disabled="selected.every(id => store.products.find(p => p.id === id)?.status === 'Archived')" @click="requestArchive(selected)"><Icon name="archive"/> <span>Archive<span class="max-md:sr-only"> selected</span></span></button><button class="btn ghost sm ml-auto -me-3" @click="clearSelection"><span>Clear<span class="max-md:sr-only"> selection</span></span></button></div></th><th>Status</th><th class="text-right pe-10">In stock</th><th>Category</th><th class="text-right max-md:ps-0">Price</th></tr></thead>
            <tbody>
              <tr v-for="p in visible" :key="p.id">
                <td class="max-md:pe-0"><input v-model="selected" class="checkbox" type="checkbox" :value="p.id" :aria-label="`Select ${p.name}`"/></td>
                <td><span class="demo-table-product"><span class="demo-thumb"><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></span><span class="min-w-0"><a :href="productLink(p)" class="demo-title-link"><strong>{{ p.name }}</strong></a><span class="muted demo-sku" :class="{ 'demo-sku-match': skuMatched(p) }">{{ matchedFinish(p) ? `${matchedFinish(p).name} · ${matchedFinish(p).sku}` : p.sku }}<span class="demo-sku-category"> · {{ p.category }}</span></span><span class="muted demo-row-category">{{ p.category }}</span></span><span class="demo-table-meta"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><span v-if="offSale(p)" class="badge sm soft warning">Off sale</span><span v-if="stockAlert(shown(p))" class="badge sm" :class="stockAlert(shown(p)).class">{{ stockAlert(shown(p)).label }}</span><span v-else class="muted">{{ stockLabel(shown(p)) }}</span></span></span></td>
                <td><span class="demo-stock"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span><span v-if="offSale(p)" class="badge sm soft warning">Off sale</span></span></td>
                <td class="whitespace-nowrap text-right ps-0 pe-10"><span v-if="stockAlert(shown(p))" class="badge sm" :class="stockAlert(shown(p)).class">{{ stockAlert(shown(p)).label }}</span><span v-else-if="shown(p).stock" class="muted tabular-nums">{{ shown(p).stock }}</span><span v-else class="muted">Out of stock</span></td>
                <td class="muted">{{ p.category }}</td>
                <td class="text-right font-medium tabular-nums whitespace-nowrap max-md:ps-0">{{ priceLabel(shown(p)) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else-if="mode === 'grid' && visible.length" class="demo-product-grid demo-catalogue-grid"><a v-for="p in visible" :key="p.id" class="card demo-product-card" :href="productLink(p)"><div class="demo-product-stage"><span class="demo-stage-badges"><span class="badge sm" :class="statusClass(p.status)">{{ p.status }}</span></span><img v-if="p.image" :src="p.image" alt=""/><ProductArt v-else :kind="p.kind"/></div><div class="demo-product-card-body"><div><h2>{{ p.name }}</h2><p class="muted text-xs">{{ p.category }}</p><p v-if="matchedFinish(p)" class="muted text-xs demo-sku">{{ matchedFinish(p).name }} · {{ matchedFinish(p).sku }}</p><p class="demo-stock text-xs"><span v-if="offSale(p)" class="badge sm soft warning">Off sale</span><span v-if="stockAlert(shown(p))" class="badge sm" :class="stockAlert(shown(p)).class">{{ stockAlert(shown(p)).label }}</span><span v-else class="muted">{{ stockLabel(shown(p)) }}</span></p></div><strong>{{ priceLabel(shown(p)) }}</strong></div></a></div>
        <div v-else-if="narrowed" class="demo-empty" role="status"><Icon name="search" class="[&_svg]:size-8"/><h2>{{ query ? `No products match “${query}”` : 'No products match' }}</h2><p class="muted">{{ !query ? 'Clear the filters to see more.' : filterCount || status !== 'All' ? 'Try another name or SKU, or clear the filters.' : 'Try another name or SKU.' }}</p><button class="btn outlined" @click="clearAndFocus">{{ query && !filterCount && status === 'All' ? 'Clear search' : 'Clear filters' }}</button></div>
        <div v-else class="demo-empty" role="status"><Icon name="package" class="[&_svg]:size-8"/><h2>No {{ status === 'All' ? '' : status.toLowerCase() }} products</h2><p class="muted">{{ emptyHint[status] }}</p></div>
        <footer v-if="filtered.length" class="demo-table-footer"><p class="muted text-sm" role="status">{{ countLabel }}</p><nav v-if="pageCount > 1" class="flex items-center gap-2" aria-label="Product pagination"><button class="btn outlined sm" :aria-disabled="pageNumber === 1 || null" @click="pageNumber > 1 && pageNumber--" aria-label="Previous product page"><Icon name="arrow-left"/></button><span class="text-sm muted">Page {{ pageNumber }} of {{ pageCount }}</span><button class="btn outlined sm" :aria-disabled="pageNumber === pageCount || null" @click="pageNumber < pageCount && pageNumber++" aria-label="Next product page"><Icon name="arrow-right"/></button></nav></footer>
      </section>
    </template>

    <template v-else-if="screen === 'product' && !product">
      <a href="products.html" class="btn ghost sm self-start -ml-2"><Icon name="arrow-left"/> All products</a>
      <div class="card demo-empty"><Icon name="search" class="[&_svg]:size-8"/><h1>Product not found</h1><p class="muted">This link doesn’t match a product in your workspace. It may have been removed, or added in another browser tab.</p><a class="btn outlined" href="products.html">Back to all products</a></div>
    </template>

    <template v-else-if="screen === 'product'">
      <a :href="listUrl" class="btn ghost sm self-start -ms-3 md:hidden"><Icon name="arrow-left"/> Back to products</a>
      <div class="demo-page-heading">
        <div class="min-w-0">
          <div class="demo-record-title">
            <h1>{{ product.name }}</h1>
            <button class="badge" :class="statusClass(product.status)" popovertarget="status-popover" :aria-label="`${product.status}, change status`">{{ product.status }} <Icon name="chevron-down"/></button>
            <span v-if="offSale(product)" class="badge soft warning whitespace-nowrap">Off sale</span>
            <span v-if="stockAlert(product)" class="badge whitespace-nowrap" :class="stockAlert(product).class">{{ stockAlert(product).label }}</span>
          </div>
          <p v-if="lastChange" class="muted">Last updated {{ lastChange }}</p>
        </div>
        <div class="demo-page-actions demo-record-actions">
          <button class="btn outlined" :class="{ 'demo-preview-button': nextAction }" @click="preview.showModal()">Preview</button>
          <button class="btn" :class="nextAction ? 'outlined' : 'primary'" @click="edit(product)">Edit product</button>
          <button v-if="nextAction" class="btn primary" @click="nextAction.run">{{ nextAction.label }}</button>
          <button class="btn outlined" popovertarget="product-more" aria-label="More product actions"><Icon name="ellipsis"/></button>
        </div>
      </div>
      <div id="status-popover" popover class="dropdown"><div class="nav"><button v-for="s in ['Active', 'Draft', 'Archived']" :key="s" :aria-current="product.status === s || null" @click="changeStatus(s)"><span class="badge sm" :class="statusClass(s)">{{ s }}</span><span v-if="product.status === s" aria-hidden="true">✓</span></button></div></div>
      <div id="product-more" popover class="dropdown right"><div class="nav"><button v-if="nextAction" class="demo-preview-item" @click="$event.target.closest('[popover]').hidePopover(); preview.showModal()"><Icon name="expand"/> Preview</button><button @click="duplicate"><Icon name="copy"/> Duplicate product</button><button v-if="product.status !== 'Archived'" @click="$event.target.closest('[popover]').hidePopover(); requestArchive([product.id])"><Icon name="archive"/> Archive product</button></div></div>
      <div class="demo-detail-grid" :class="{ 'demo-restock': stockAlert(product), 'demo-offsale': offSale(product) }">
        <div class="demo-detail-main">
          <div class="demo-detail-top">
            <section class="card demo-gallery" aria-label="Product images">
              <div class="demo-gallery-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="`${product.name}, ${product.finish} finish`" :angle="angle"/></div>
              <div v-if="!product.image" class="demo-gallery-views"><button v-for="(a, i) in [0, 18, -18]" :key="a" class="demo-gallery-view" :aria-label="['Front view', 'Angled right', 'Angled left'][i]" :aria-pressed="angle === a" @click="angle = a"><ProductArt :kind="product.kind" :angle="a"/></button></div>
            </section>
            <section class="card demo-description" aria-labelledby="details-heading">
              <header><h2 id="details-heading">Description</h2><button class="btn ghost sm" aria-label="Edit description" @click="edit(product, '[name=description]')">Edit</button></header>
              <div class="space-y-2 text-sm"><p v-if="product.subtitle" class="font-medium">{{ product.subtitle }}</p><p v-if="product.description" class="leading-relaxed muted">{{ product.description }}</p><p v-if="!product.subtitle && !product.description" class="muted">No description yet.</p></div>
              <div class="demo-card-footer demo-tags"><span>Tags</span><span v-for="tag in product.tags" :key="tag" class="badge outlined sm">{{ tag }}</span><span v-if="!product.tags.length">None</span></div>
            </section>
          </div>
          <section class="card demo-finishes" aria-labelledby="finishes-heading">
            <header><h2 id="finishes-heading">Inventory</h2><button v-if="nextAction?.label !== 'Adjust inventory'" class="btn ghost sm" @click="openInventory">Adjust inventory</button></header>
            <div class="demo-table-scroll">
              <table class="table hover table-fixed demo-row-links">
                <colgroup><col><col class="demo-finish-sku w-36"><col class="w-32 max-md:w-28"><col class="w-24 max-md:w-20"><col class="w-14 max-md:w-12"></colgroup>
                <thead><tr><th>Finish</th><th class="demo-finish-sku">SKU</th><th class="text-right">In stock</th><th class="text-right">Price</th><th><span class="sr-only">Edit</span></th></tr></thead>
                <tbody><tr v-for="(v, i) in product.variants" :key="i"><td><span class="font-medium">{{ v.name }}</span><span class="demo-finish-sku-line text-xs muted demo-sku">{{ v.sku }}</span></td><td class="muted demo-sku demo-finish-sku">{{ v.sku }}</td><td class="text-right tabular-nums ps-0"><span v-if="stockAlert({ status: product.status, stock: v.stock })" class="badge sm" :class="stockAlert({ status: product.status, stock: v.stock }).class">{{ stockAlert({ status: product.status, stock: v.stock }).label }}</span><span v-else-if="!v.stock" class="muted">Out of stock</span><template v-else>{{ v.stock }}</template></td><td class="text-right font-medium tabular-nums">{{ money(v.price) }}</td><td class="text-right ps-0"><button class="btn ghost sm demo-row-action px-2 -me-2 text-muted-foreground hover:text-foreground" :aria-label="`Edit ${v.name} finish`" @click="openVariant(i)"><Icon name="field"/></button></td></tr></tbody>
                <tfoot v-if="product.variants.length > 1" class="tabular-nums"><tr><td>Total<span class="demo-finish-place"> at the London studio</span></td><td class="demo-finish-sku"></td><td class="text-right">{{ product.stock }}</td><td colspan="2"></td></tr></tfoot>
              </table>
            </div>
          </section>
          <section class="card demo-history demo-product-history" aria-labelledby="history-heading">
            <header><h2 id="history-heading">History</h2><button class="btn ghost sm" @click="startNote">Add note</button></header>
            <ol class="timeline"><li v-for="a in productActivity" :key="a.id"><span class="avatar secondary sm"><Icon :name="activityIcon(a.type)"/></span><p class="font-medium">{{ historyTitle(a) }}</p><blockquote v-if="a.type === 'Note'">{{ a.detail }}</blockquote><p v-else class="text-sm muted">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol>
            <p v-if="!productActivity.length" class="muted text-sm">Changes to this product will appear here.</p>
          </section>
        </div>
        <div class="demo-detail-side">
          <section class="card demo-availability" aria-labelledby="availability-heading">
            <header><h2 id="availability-heading">Availability</h2></header>
            <p class="text-sm muted">{{ availability }}</p>
            <div class="demo-channels">
              <div class="demo-channel"><div><strong>Online store</strong><span class="muted">forma.audio</span></div><label class="switch"><input :checked="product.status !== 'Archived' && channel(product, 'online')" type="checkbox" role="switch" aria-label="Online store availability" :disabled="product.status === 'Archived'" @change="requestChannel('online', $event)"/></label></div>
              <div class="demo-channel"><div><strong>London studio</strong><span class="muted">In-person collection</span></div><label class="switch"><input :checked="product.status !== 'Archived' && channel(product, 'studio')" type="checkbox" role="switch" aria-label="London studio availability" :disabled="product.status === 'Archived'" @change="requestChannel('studio', $event)"/></label></div>
            </div>
          </section>
          <section class="card demo-pricing" aria-labelledby="pricing-heading">
            <header><h2 id="pricing-heading">Pricing</h2><button class="btn ghost sm" @click="openPrice">Edit pricing</button></header>
            <p class="demo-price">{{ priceLabel(product) }}</p>
            <dl class="dl horizontal demo-figures"><div><dt>Cost per item</dt><dd>{{ money(product.cost) }}</dd></div><div><dt>{{ priceVaries(product) ? 'Lowest margin after VAT' : 'Margin after VAT' }}</dt><dd>{{ margin(product) }}%</dd></div></dl>
            <p class="demo-card-footer">Retail price includes 20% VAT</p>
          </section>
          <section class="card demo-details" aria-labelledby="organisation-heading">
            <header><h2 id="organisation-heading">Details</h2><button class="btn ghost sm" aria-label="Edit details" @click="edit(product, '[name=category]')">Edit</button></header>
            <dl class="dl horizontal demo-figures"><div><dt>Category</dt><dd>{{ product.category }}</dd></div><div><dt>SKU</dt><dd class="demo-sku">{{ product.sku }}</dd></div></dl>
          </section>
        </div>
      </div>
    </template>

    <template v-else-if="screen === 'activity'">
      <div class="demo-page-heading"><div><h1>Activity</h1><p class="muted">Every change to products, prices and stock, newest first.</p></div><button class="btn primary" @click="startNote"><Icon name="plus"/> Add note</button></div>
      <div class="demo-activity-layout"><section class="card demo-history" aria-labelledby="activity-heading"><header><h2 id="activity-heading">Store activity</h2><select class="input sm" v-model="activityType" aria-label="Activity type"><option>All</option><option>Product</option><option>Inventory</option><option>Price</option><option>Note</option></select></header><ol class="timeline"><li v-for="a in timeline" :key="a.id"><span class="avatar secondary sm"><Icon :name="activityIcon(a.type)"/></span><div class="flex items-start gap-2"><p class="font-medium"><a v-if="a.product" class="demo-title-link" :href="`product.html?id=${a.product}`">{{ a.title }}</a><template v-else>{{ a.title }}</template></p><span class="badge outlined sm ml-auto">{{ a.type }}</span></div><blockquote v-if="a.type === 'Note'">{{ a.detail }}</blockquote><p v-else class="text-sm muted mt-1">{{ a.detail }}</p><time>{{ a.time }}</time></li></ol><p v-if="!timeline.length" class="muted text-sm">No {{ activityType.toLowerCase() }} activity yet.</p></section><div class="demo-side-cards"><section class="card"><header><h2>Sample workspace</h2></header><p class="muted text-sm">Explore the collection, change a price or add a finish. Your changes stay in this browser tab until you start fresh.</p><button class="btn outlined sm self-start" @click="pending = 'reset'; confirmation.showModal()">Reset workspace</button></section><section class="card"><header><h2>Built with altpro/ui</h2></header><p class="muted text-sm">The same components, from a simple field to a complete workspace.</p><a class="btn ghost sm self-start -ms-3" href="../index.html">Explore the library <span aria-hidden="true">→</span></a></section></div></div>
    </template>

  </div>

  <ProductEditor ref="editor" :check-sku="checkProductSku" @save="saveProduct" @leave="clean => leave(editor.dialog, clean)"/>
  <!-- the product's own editors; an unknown id has no product to edit -->
  <template v-if="product">
  <dialog ref="pricing" class="dialog divided" aria-labelledby="price-dialog-title" @cancel.prevent="closePricing"><header><hgroup><p>{{ product.name }}</p><h2 id="price-dialog-title">Edit pricing</h2></hgroup><button class="btn ghost sm" aria-label="Close pricing" @click="closePricing"><Icon name="x"/></button></header><form id="pricing-form" novalidate class="space-y-4" @submit.prevent="savePrice" @input="pricingErrors = withoutField(pricingErrors, $event)"><div class="grid grid-cols-2 gap-4"><Field v-model="priceDraft.price" name="retailPrice" label="Retail price" type="number" prepend="£" min="0" step="0.01" :errors="pricingErrors" required/><Field v-model="priceDraft.cost" name="itemCost" label="Cost per item" type="number" prepend="£" min="0" step="0.01" :errors="pricingErrors" required/></div><p class="text-sm muted">Retail price includes VAT; cost per item doesn't. A new retail price moves every finish by the same amount.</p></form><footer class="justify-end"><button type="button" class="btn outlined" @click="closePricing">Cancel</button><button form="pricing-form" class="btn primary">Save pricing</button></footer></dialog>
  <dialog ref="inventory" class="dialog drawer divided demo-editor" aria-labelledby="stock-dialog-title" @cancel.prevent="closeInventory"><header><hgroup><p>{{ product.name }}</p><h2 id="stock-dialog-title">Adjust inventory</h2></hgroup><button class="btn ghost sm" aria-label="Close inventory" @click="closeInventory"><Icon name="x"/></button></header><form id="inventory-form" novalidate class="space-y-5" @submit.prevent="saveInventory" @input="inventoryErrors = withoutField(inventoryErrors, $event)"><p class="text-sm muted">Stock and price of each finish at the London studio. Add, reorder or remove finishes here.</p><Repeater v-model="inventoryDraft" name="inventory" item="finish" :make="makeFinish" :errors="inventoryErrors" v-slot="{ row, index, errors }"><div class="grid grid-cols-2 gap-3"><Field v-model="row.name" :name="`inventory.${index}.name`" label="Finish name" :errors="errors" required/><Field v-model="row.sku" :name="`inventory.${index}.sku`" label="Finish SKU" :errors="errors" required/></div><div class="grid grid-cols-2 gap-3"><Field v-model="row.stock" :name="`inventory.${index}.stock`" :label="`${row.name || 'New finish'} in stock`" type="number" min="0" step="1" :errors="errors" required/><Field v-model="row.price" :name="`inventory.${index}.price`" :label="`${row.name || 'New finish'} price`" type="number" min="0" step="0.01" prepend="£" :errors="errors" required/></div></Repeater></form><footer class="justify-end"><button type="button" class="btn outlined" @click="closeInventory">Cancel</button><button form="inventory-form" class="btn primary">Save inventory</button></footer></dialog>
  <dialog ref="variantDialog" class="dialog divided" aria-labelledby="finish-dialog-title" @cancel.prevent="closeVariant"><header><hgroup><p>{{ product.name }}</p><h2 id="finish-dialog-title">Edit finish</h2></hgroup><button class="btn ghost sm" aria-label="Close finish editor" @click="closeVariant"><Icon name="x"/></button></header><form id="finish-form" novalidate class="space-y-4" @submit.prevent="saveVariant" @input="finishErrors = withoutField(finishErrors, $event)"><Field v-model="variantDraft.name" name="finishName" label="Finish name" :errors="finishErrors" required/><Field v-model="variantDraft.sku" name="finishSku" label="Finish SKU" :errors="finishErrors" required/><div class="grid grid-cols-2 gap-4"><Field v-model="variantDraft.stock" name="finishStock" label="In stock" type="number" min="0" step="1" :errors="finishErrors" required/><Field v-model="variantDraft.price" name="finishPrice" label="Finish price" type="number" min="0" step="0.01" prepend="£" :errors="finishErrors" required/></div></form><footer class="justify-end"><button type="button" class="btn outlined" @click="closeVariant">Cancel</button><button form="finish-form" class="btn primary">Save finish</button></footer></dialog>
  <dialog ref="preview" class="dialog demo-preview" aria-labelledby="preview-title"><header><p class="muted text-sm">Store preview</p><button class="btn ghost sm ml-auto" aria-label="Close preview" @click="preview.close()"><Icon name="x"/></button></header><div class="demo-product-stage"><img v-if="product.image" :src="product.image" :alt="product.name"/><ProductArt v-else :kind="product.kind" :name="product.name" :angle="angle"/></div><div class="flex justify-between gap-4 items-start"><div><h2 id="preview-title" class="text-xl font-semibold">{{ product.name }}</h2><p v-if="product.subtitle" class="muted mt-1">{{ product.subtitle }}</p></div><strong class="text-xl tabular-nums">{{ money(previewed?.price ?? product.price) }}</strong></div><div v-if="product.variants.length > 1" class="field"><label for="preview-finish">Finish</label><select id="preview-finish" v-model.number="previewFinish" class="input"><option v-for="(v, i) in product.variants" :key="i" :value="i">{{ v.name }}{{ v.stock ? '' : ' (out of stock)' }}</option></select></div><p v-if="product.description" class="text-sm muted leading-relaxed">{{ product.description }}</p><button class="btn primary" :disabled="!!previewBlock" @click="preview.close(); notify('Preview only, so nothing was added.', true)">{{ previewBlock || 'Add to bag' }}</button></dialog>
  </template>
  <dialog ref="confirmation" class="dialog divided" aria-labelledby="confirm-title"><header><h2 id="confirm-title">{{ pending === 'reset' ? 'Reset workspace?' : pending === 'draft' ? `Move “${product?.name}” to draft?` : pending === 'channel' ? `Take “${product?.name}” off sale?` : archiveName ? `Archive “${archiveName}”?` : `Archive ${archiveCount} products?` }}</h2></header><p class="text-sm muted">{{ pending === 'reset' ? 'Your changes in this tab will be cleared and the original catalogue restored.' : pending === 'draft' ? (channelNames(product) ? `It comes off sale in ${channelNames(product)} until you publish it again.` : 'It moves to Draft.') : pending === 'channel' ? 'It is off in every other channel, so nobody can order it.' : archiveName ? (archiveLive ? `It comes off sale in ${channelNames(store.products.find(p => p.id === pending[0]))}. You can make it active again from ${screen === 'product' ? 'this page' : 'its product page'}.` : 'It moves to Archived. Making it active later publishes it.') : `${archiveNames} move to Archived.${archiveLive ? ' Any that are live come off sale.' : ''} You can make each one active again from its product page.` }}</p><footer class="justify-end"><button class="btn outlined" @click="confirmation.close()">Cancel</button><button class="btn" :class="pending === 'reset' ? 'primary' : 'danger'" @click="pending === 'reset' ? (resetWorkspace(), confirmation.close(), notify('Workspace reset.')) : pending === 'draft' ? (confirmation.close(), applyStatus('Draft')) : pending === 'channel' ? (confirmation.close(), setChannel(channelKey(), false)) : archiveProducts()">{{ pending === 'reset' ? 'Reset workspace' : pending === 'draft' ? 'Move to draft' : pending === 'channel' ? 'Take off sale' : archiveName ? 'Archive product' : `Archive ${archiveCount} products` }}</button></footer></dialog>
  <dialog ref="noteDialog" class="dialog divided" aria-labelledby="note-title" @cancel.prevent="closeNote"><header><hgroup v-if="product && screen === 'product'"><p>{{ product.name }}</p><h2 id="note-title">Add note</h2></hgroup><h2 v-else id="note-title">Add note</h2><button class="btn ghost sm" aria-label="Close note" @click="closeNote"><Icon name="x"/></button></header><form id="note-form" @submit.prevent="saveNote"><Field v-model="note" name="note" label="Your note" type="textarea" rows="5" :errors="noteError || undefined" placeholder="What should your team know?"/></form><footer class="justify-end"><button class="btn outlined" type="button" @click="closeNote">Cancel</button><button form="note-form" class="btn primary">Add note</button></footer></dialog>
  <dialog ref="discardDialog" class="dialog divided" aria-labelledby="discard-title"><header><h2 id="discard-title">Discard your changes?</h2></header><p class="text-sm muted">What you changed here has not been saved.</p><footer class="justify-end"><button class="btn outlined" @click="discardDialog.close()">Keep editing</button><button class="btn danger" @click="discardChanges">Discard changes</button></footer></dialog>
  <div class="toaster" role="region" aria-label="Workspace notifications" aria-live="polite"><div v-if="toast" class="alert" :class="{ success: !toastPlain }"><svg v-if="!toastPlain" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg><p>{{ toast }}</p><button class="btn ghost sm" aria-label="Dismiss notification" @click="toast = ''"><Icon name="x"/></button></div></div>
</template>
