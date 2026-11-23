<script>
// the server's half reads the URL with these too, as a controller does through TableQuery
export const peopleOptions = { name: "people", defaultSort: "name", defaultDirection: "asc", sortable: ["name"], filters: [] };
</script>

<script setup>
import { Link } from "@inertiajs/vue3";
import DataList from "@ui/DataList.vue";
import { useDataList } from "@ui/dataTable";

const props = defineProps({ people: Object });

const people = useDataList(() => ({ rows: props.people, name: "people", only: ["people"], unfilteredTotal: 30, perPage: 10, sort: "name", direction: "asc", sortable: ["name"], privateSearch: true }));
const nearby = useDataList(() => ({ rows: Array.from({ length: 12 }, (_, i) => ({ id: i, name: `Neighbour ${String(i + 1).padStart(2, "0")}` })), name: "nearby", searchable: ["name"], privateSearch: true }));
const lists = [
  { list: people, caption: "People" },
  { list: nearby, caption: "Nearby" },
];
</script>

<template>
  <div class="space-y-10">
    <Link href="/app/private-search.html">Everyone</Link>
    <p v-if="$page.props.errors?.notes" role="alert">{{ $page.props.errors.notes }}</p>
    <section v-for="{ list, caption } in lists" :key="caption" class="space-y-3">
      <h2 class="text-xl font-semibold">{{ caption }}</h2>
      <DataList :list="list" :caption="caption" v-slot="{ rows, busy }">
        <ul class="list-none p-0" :aria-busy="busy || undefined">
          <li v-for="row in rows" :key="row.id" class="py-1"><Link :href="`?record=${row.id}`">{{ row.name }}</Link></li>
        </ul>
      </DataList>
    </section>
  </div>
</template>
