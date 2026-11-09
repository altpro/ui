<script>
// the server's half reads the URL with these too, as a controller does through TableQuery
export const listNames = ["one", "two", "drawer"];
const declared = [{ key: "type", label: "Type", type: "select", options: ["x", "y", "none"].map((value) => ({ value, label: value })) }];
export const listOptions = (name) => ({ name, defaultSort: "name", defaultDirection: "asc", sortable: ["name"], filters: declared });
</script>

<script setup>
import DataList from "@ui/DataList.vue";
import { useDataList } from "@ui/dataTable";

const props = defineProps({ one: Object, two: Object, drawer: Object });

const serverList = (name, extra = {}) => useDataList(() => ({ rows: props[name], filters: declared, name, only: [name], unfilteredTotal: 30, perPage: 10, sort: "name", direction: "asc", sortable: ["name"], ...extra }));
const one = serverList("one");
const two = serverList("two");
const drawer = serverList("drawer", { sortOptions: [{ key: "name", direction: "asc", label: "A to Z" }, { key: "name", direction: "desc", label: "Z to A" }] });
const browser = useDataList(() => ({ rows: Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Local ${i}`, type: i % 2 ? "x" : "y" })), filters: declared, name: "browser", searchable: ["name"] }));
const lists = [
  { list: one, caption: "One", attrs: { scrollOnPage: true } },
  { list: two, caption: "Two" },
  { list: drawer, caption: "Drawer", attrs: { filterDisplay: "drawer", sortLabel: "Order" } },
  { list: browser, caption: "Browser" },
];
</script>

<template>
  <section v-for="{ list, caption, attrs } in lists" :key="caption" class="space-y-3">
    <h2 class="text-xl font-semibold">{{ caption }}</h2>
    <DataList :list="list" :caption="caption" v-bind="attrs" v-slot="{ rows, busy }">
      <ul class="list-none p-0" :aria-busy="busy || undefined">
        <li v-for="row in rows" :key="row.id" class="py-1">{{ row.name }} ({{ row.type }})</li>
      </ul>
    </DataList>
  </section>
</template>
