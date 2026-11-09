<script setup>
import DataList from "@ui/DataList.vue";
import { useDataList } from "@ui/dataTable";

const brands = ["Northline", "Orbit", "Acme"];
const products = Array.from({ length: 23 }, (_, i) => ({ id: i + 1, name: `Sample ${String.fromCharCode(65 + i)}`, brand: brands[i % 3], price: 15 + i * 4, inStock: i % 4 !== 0 }));
const options = brands.map((value) => ({ value, label: value }));
const filters = [
  { key: "brand", label: "Brand", type: "select", options },
  { key: "inStock", label: "In stock", type: "boolean" },
  { key: "name", label: "Name contains", type: "select", match: (row, [value]) => row.name.toLowerCase().includes(value.toLowerCase()) },
];
const sortOptions = [
  { key: "name", direction: "asc", label: "Name" },
  { key: "price", direction: "asc", label: "Price, low to high" },
  { key: "price", direction: "desc", label: "Price, high to low" },
];
const list = useDataList(() => ({ rows: products, filters, name: "cards", searchable: ["name", "brand"], sortOptions, perPage: 10 }));
// no search box and a footer of its own, for a list too short to page
const plainRows = products.slice(0, 3);
const plainFilters = [{ key: "brand", label: "Brand", type: "select", options }];
const plain = useDataList(() => ({ rows: plainRows, filters: plainFilters, name: "plain", search: false }));
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-xl font-semibold">A card grid</h2>
    <p class="text-sm muted"><code>sort-options</code> on <code>useDataList</code> gives a list with no headers a sort select. A <code>#filter-&lt;key&gt;</code> slot draws a filter the built-in types cannot, here a text box, and it is drafted, counted and cleared like the rest.</p>
    <DataList :list="list" caption="Cards" filter-display="drawer">
      <template #filter-name="{ values, set }">
        <div class="field">
          <label for="name-contains">Name contains</label>
          <input id="name-contains" class="input" :value="values[0] ?? ''" @input="set([($event.target).value])" />
        </div>
      </template>
      <template #default="{ rows, busy, empty, clearFilters }">
        <ul class="grid list-none gap-gap p-0 sm:grid-cols-2 lg:grid-cols-3" :aria-busy="busy || undefined">
          <li v-for="row in rows" :key="row.id" class="card">
            <h3 class="font-semibold">{{ row.name }}</h3>
            <p class="text-sm muted">{{ row.brand }} · {{ money.format(row.price) }}</p>
          </li>
        </ul>
        <div v-if="empty === 'no-matches'" class="card items-center py-3gap text-center">
          <h3 class="font-semibold">No cards match</h3>
          <button type="button" class="btn sm" @click="clearFilters">Clear filters</button>
        </div>
      </template>
    </DataList>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">A footer of your own</h2>
    <p class="text-sm muted"><code>search: false</code> removes the search box, and a <code>#foot</code> slot replaces the count and pagination.</p>
    <DataList :list="plain" caption="Made to order">
      <template #foot><p class="mt-3 text-sm muted">Made to order, usually within a week.</p></template>
      <template #default="{ rows, empty, clearFilters }">
        <ul class="grid list-none gap-gap p-0 sm:grid-cols-3">
          <li v-for="row in rows" :key="row.id" class="card">{{ row.name }}</li>
        </ul>
        <div v-if="empty === 'no-matches'" class="card items-center py-3gap text-center">
          <h3 class="font-semibold">Nothing made to order matches</h3>
          <button type="button" class="btn sm" @click="clearFilters">Clear filters</button>
        </div>
      </template>
    </DataList>
  </section>
</template>
