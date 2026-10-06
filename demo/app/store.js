import { reactive, watch } from 'vue';
import catalogue from './catalogue.json';
const initial = structuredClone(catalogue);
let saved;
try { saved = JSON.parse(sessionStorage.getItem('demo-workspace')); } catch {}
export const store = reactive(saved?.products?.length && Array.isArray(saved.activity) ? saved : initial);
watch(store, () => sessionStorage.setItem('demo-workspace', JSON.stringify(store)), { deep: true });
export const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
export const categories = ['Headphones', 'Speakers', 'Turntables'];
export const statusClass = status => ({ Active: 'success', Draft: '', Archived: 'outlined' })[status];
export function record(title, detail, product, type = 'Product') {
  store.activity.unshift({ id: Math.max(Date.now(), ...store.activity.map(a => a.id + 1)), title, detail, product, type, time: 'Just now' });
}
// a day as a date input writes it, and n days on from one
export const day = date => date.toLocaleDateString('en-CA');
export const shift = (iso, n) => { const d = new Date(`${iso}T12:00`); d.setDate(d.getDate() + n); return day(d); };
// made-up sales that never change for a given day, so any range can be charted
const noise = (n, salt) => { const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); };
export function daySales(iso) {
  const date = new Date(`${iso}T12:00`), n = Math.round(date / 864e5);
  const revenue = Math.round((2100 + 500 * Math.sin(n / 9) + 900 * noise(n, 1)) * ([0, 6].includes(date.getDay()) ? 1.35 : 1));
  const orders = Math.max(1, Math.round(revenue / (128 + 36 * noise(n, 2))));
  return { revenue, orders, visits: Math.round(orders / (0.032 + 0.012 * noise(n, 3))) };
}
export function resetWorkspace() { store.products = structuredClone(catalogue.products); store.activity = structuredClone(catalogue.activity); }
