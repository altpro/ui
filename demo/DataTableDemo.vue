<script setup>
import { ref } from "vue";
import DataTable from "../resources/js/DataTable.vue";

const members = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com", role: "Admin" },
  { id: 2, name: "Grace Hopper", email: "grace@example.com", role: "Editor" },
  { id: 3, name: "Linus Torvalds", email: "linus@example.com", role: "Viewer" },
  { id: 4, name: "Margaret Hamilton", email: "margaret@example.com", role: "Editor" },
  { id: 5, name: "Barbara Liskov", email: "barbara@example.com", role: "Viewer" },
  { id: 6, name: "Donald Knuth", email: "donald@example.com", role: "Admin" },
  { id: 7, name: "Edsger Dijkstra", email: "edsger@example.com", role: "Viewer" },
];
const memberColumns = [
  { key: "name", label: "Name", sortable: true, tdClass: "font-medium" },
  { key: "email", label: "Email", sortable: true },
  { key: "role", label: "Role", sortable: true },
];

const products = [
  ["Trail Tee", "TS-1001", "Northline", "S", true, 24, "2026-01-14"],
  ["Trail Tee", "TS-1002", "Northline", "M", true, 24, "2026-01-14"],
  ["Trail Tee", "TS-1003", "Northline", "L", false, 24, "2026-01-14"],
  ["Summit Hoodie", "HD-2201", "Orbit", "S", false, 59, "2026-02-03"],
  ["Summit Hoodie", "HD-2202", "Orbit", "M", true, 59, "2026-02-03"],
  ["Summit Hoodie", "HD-2203", "Orbit", "L", true, 59, "2026-02-03"],
  ["Core Jogger", "JG-3011", "Acme", "S", true, 42, "2026-03-22"],
  ["Core Jogger", "JG-3012", "Acme", "M", true, 42, "2026-03-22"],
  ["Core Jogger", "JG-3013", "Acme", "L", false, 42, "2026-03-22"],
  ["Pulse Tank", "TK-4011", "Northline", "S", true, 19, "2026-04-08"],
  ["Pulse Tank", "TK-4012", "Northline", "M", false, 19, "2026-04-08"],
  ["Pulse Tank", "TK-4013", "Northline", "L", true, 19.5, "2026-04-08"],
].map(([name, sku, brand, size, in_stock, price, added], i) => ({ id: i + 1, name, sku, brand, size, in_stock, price, added }));
const productColumns = [
  { key: "name", label: "Name", sortable: true, tdClass: "font-medium" },
  { key: "sku", label: "SKU", sortable: true, tdClass: "whitespace-nowrap" },
  { key: "brand", label: "Brand", sortable: true },
  { key: "size", label: "Size", sortable: true },
  // no availability field: built from in_stock, so virtual, and it says what to sort on
  { key: "availability", label: "Availability", virtual: true, sortable: true, sortValue: (p) => p.in_stock },
  { key: "added", label: "Added", sortable: true, format: "date" },
  { key: "price", label: "Price", sortable: true, format: "currency", thClass: "text-right", tdClass: "text-right tabular-nums" },
];
const options = (...values) => values.map((value) => ({ value, label: value }));
// the review table has no availability slot, so it leaves that column out
const reviewColumns = productColumns.filter((c) => c.key !== "availability");
const productFilters = [
  {
    key: "availability", label: "Availability", type: "select",
    options: [{ value: "in_stock", label: "In stock" }, { value: "out_of_stock", label: "Out of stock" }],
    match: (p, [value]) => (value === "in_stock") === p.in_stock,
  },
  { key: "size", label: "Size", type: "multiple", options: options("S", "M", "L") },
  { key: "brand", label: "Brand", type: "multiple", options: options("Northline", "Orbit", "Acme") },
  { key: "added", label: "Added", type: "daterange", presets: true },
];

const selection = ref(null);
const done = ref("");
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Columns and rows</h2>
    <p class="text-sm muted">All a searchable, sortable, paged table needs. <code>caption</code> is required: it names the table, the search box and the pagination. <code>name</code> prefixes the query parameters, so two tables on a page do not share one: sort this one and the URL gains <code>basic_sort</code>.</p>
    <DataTable caption="Team members" name="basic" :columns="memberColumns" :rows="members" :searchable="['name', 'email', 'role']" sort="name" :paginate="5" />
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Filters and formats</h2>
    <p class="text-sm muted">Declared filters belong to the table: it keeps them in the URL, counts what they hide, and offers to clear them when nothing matches. <code>format</code> renders dates, money and booleans in the page's <code>lang</code>; a <code>#cell-&lt;key&gt;</code> slot on the same column wins.</p>
    <DataTable caption="Products" name="products" :columns="productColumns" :rows="products" :filters="productFilters" :searchable="['name', 'sku', 'brand']" :paginate="10" empty-message="No products yet." no-matches-message="No products match the selected filters.">
      <template #cell-availability="{ row }">
        <span class="badge sm" :class="row.in_stock ? 'success' : 'warning'">{{ row.in_stock ? "In stock" : "Out of stock" }}</span>
      </template>
    </DataTable>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Selection and bulk actions</h2>
    <p class="text-sm muted">The header box ticks the page and no more. Once the page is ticked and more rows match, the bar offers the rest, and that selection carries the search and filters instead of ids, so the action re-runs the query on the server.</p>
    <DataTable caption="Products under review" name="review" :columns="reviewColumns" :rows="products" :searchable="['name', 'sku', 'brand']" :paginate="10" selectable @update:selection="selection = $event">
      <template #bulk-actions="{ count, clear }">
        <button type="button" class="btn sm primary" @click="done = `${count} discontinued.`; clear()">Discontinue</button>
      </template>
    </DataTable>
    <output class="block text-sm">{{ done || `selection: ${JSON.stringify(selection)}` }}</output>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">Nothing to show</h2>
    <p class="text-sm muted">The message is the table's only row, one cell spanning every column, under the caption that names it. "Nothing yet" shows <code>empty-message</code> and the <code>#empty</code> slot; "nothing matches" shows <code>no-matches-message</code> and a button to clear. The count beneath is a <code>role="status"</code> present in every state, so a search that empties the table is announced.</p>
    <DataTable caption="Archived team members" name="archived" :columns="memberColumns" :rows="[]" empty-message="No archived members." />
  </section>
</template>
