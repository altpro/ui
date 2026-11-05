import { reactive, watch } from 'vue';
import catalogue from './catalogue.json';
const initial = structuredClone(catalogue);
let saved;
try { saved = JSON.parse(sessionStorage.getItem('demo-workspace')); } catch {}
export const store = reactive(saved?.products?.length && Array.isArray(saved.activity) ? saved : initial);
watch(store, () => sessionStorage.setItem('demo-workspace', JSON.stringify(store)), { deep: true });
export const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
export const categories = ['Headphones', 'Speakers', 'Turntables'];
// a status badge: soft with a dot, success when it is on sale, neutral while a draft, outlined once archived
export const statusClass = status => ({ Active: 'soft success dot', Draft: 'soft dot', Archived: 'outlined dot' })[status];
export const seededName = id => catalogue.products.find(p => p.id === id)?.name;
export function record(title, detail, product, type = 'Product') {
  // subject: the product's name when this happened, which a later rename mustn't turn into part of the title
  const subject = store.products.find(p => p.id === product)?.name;
  store.activity.unshift({ id: Math.max(Date.now(), ...store.activity.map(a => a.id + 1)), title, detail, product, type, subject, time: 'Just now' });
}
// a day as a date input writes it, and n days on from one
export const day = date => date.toLocaleDateString('en-CA');
export const shift = (iso, n) => { const d = new Date(`${iso}T12:00`); d.setDate(d.getDate() + n); return day(d); };
// made-up sales that never change for a given day: what each active product sold, so the stats, chart, categories and top products add up
const noise = (n, salt) => { const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };
const selling = catalogue.products.filter(p => p.status === 'Active');
export function daySales(iso) {
  const date = new Date(`${iso}T12:00`), n = Math.round(date / 864e5);
  const pace = (1 + .22 * Math.sin(n / 9)) * ([0, 6].includes(date.getDay()) ? 1.3 : 1);
  const lines = selling.map((p, i) => {
    const units = Math.floor(p.sales / 45 * pace * (.45 + 1.1 * noise(n, i + 1)) + noise(n, i + 11));
    return { id: p.id, units, revenue: units * p.price };
  });
  const units = lines.reduce((sum, l) => sum + l.units, 0);
  const orders = Math.max(1, Math.round(units * (.86 + .12 * noise(n, 21))));
  return { revenue: lines.reduce((sum, l) => sum + l.revenue, 0), orders, visits: Math.round(orders / (.032 + .012 * noise(n, 22))), lines };
}
export function resetWorkspace() { store.products = structuredClone(catalogue.products); store.activity = structuredClone(catalogue.activity); }
