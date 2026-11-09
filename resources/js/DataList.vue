<!--
  The frame round any list of records: search, filters, the rows you give it, the count, page size and pagination.
    const list = useDataList(() => ({ rows: props.products, filters: props.filters, name: "products" }));
    <DataList :list="list" caption="Products" v-slot="{ rows, busy }">
      <ul class="grid sm:grid-cols-2 lg:grid-cols-3" :aria-busy="busy || undefined">…</ul>
    </DataList>
  DataTable and DataTimeline are built on it. See references/datalist.md in the skill.
-->
<script setup lang="ts" generic="TRow extends object">
import { ref, watch } from "vue";
import DataFilters from "./DataFilters.vue";
import { PAGE_SIZES, handOff, pageWindow, type DataListController, type DataListEmpty, type DataTableFilter } from "./dataTable";

const props = defineProps<{
  list: DataListController<TRow>;
  /** Names the search box and the pagination. */
  caption: string;
  searchPlaceholder?: string;
}>();

defineSlots<{
  /** The rows. Rendered with no wrapper, so what you put here is a child of the frame. */
  default?: (props: { rows: TRow[]; busy: boolean; empty: DataListEmpty; clearFilters: () => void }) => unknown;
  /** More controls in the toolbar. */
  filters?: () => unknown;
  controls?: () => unknown;
  /** Replaces the count, page size and pagination, for a list that loads more as it scrolls. */
  foot?: () => unknown;
  [key: `filter-${string}`]: ((props: { filter: DataTableFilter<TRow>; values: string[]; set: (values: string[]) => void }) => unknown) | undefined;
}>();

const { state, view, filters } = props.list;

const searchBox = ref<HTMLInputElement>();
const pager = ref<HTMLElement>();

type Target = () => HTMLElement | null | undefined;
// a page change or a cleared search redraws when the URL changes, which in server mode is after the response
let pending: [Element | null, Target] | null = null;
watch([() => view.value.page, () => view.value.empty], () => {
  if (pending) handOff(...pending);
  pending = null;
}, { flush: "post" });

// Previous on page two and Next on the last page but one disable themselves: the current page's button takes focus
const goTo = (page: number) => {
  pending = [document.activeElement, () => pager.value?.querySelector<HTMLElement>("[aria-current]")];
  state.apply({ page: Math.min(Math.max(page, 1), view.value.lastPage) });
};
// the button sits in the row it removes; the search box it emptied comes first
const clearFilters = () => {
  pending = [document.activeElement, () => searchBox.value];
  state.clearAll();
};

const filterSlots = (slots: Record<string, unknown>) => Object.keys(slots).filter((name): name is `filter-${string}` => name.startsWith("filter-"));
</script>

<template>
  <div class="datatable">
    <div class="controls">
      <input
        v-if="list.searchable.value"
        ref="searchBox"
        :value="state.searchInput.value"
        class="input search"
        type="search"
        :aria-label="`Search ${caption}`"
        :placeholder="searchPlaceholder ?? 'Search…'"
        @input="state.setSearch(($event.target as HTMLInputElement).value)"
      />

      <DataFilters :filters="filters" :values="state.latestFilters.value" @change="list.setFilter">
        <template v-for="name in filterSlots($slots)" :key="name" #[name]="scope">
          <slot :name="name" v-bind="scope" />
        </template>
      </DataFilters>

      <slot name="filters" />
      <slot name="controls" />
    </div>

    <slot :rows="view.rows" :busy="state.busy.value" :empty="view.empty" :clear-filters="clearFilters" />

    <slot name="foot">
      <div class="foot">
        <p role="status">{{ view.summary }}</p>
        <label v-if="view.total > PAGE_SIZES[0]!">
          Per page
          <select class="input sm" :value="view.perPage" @change="list.setPageSize(Number(($event.target as HTMLSelectElement).value))">
            <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
        <nav v-if="view.lastPage > 1" ref="pager" class="join" :aria-label="`${caption} pagination`">
          <button type="button" class="btn outlined sm" aria-label="Previous page" :disabled="view.page === 1" @click="goTo(view.page - 1)">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <template v-for="(page, i) in pageWindow(view.page, view.lastPage)" :key="page ?? `gap-${i}`">
            <span v-if="page === null" class="btn outlined sm pointer-events-none">…</span>
            <button v-else type="button" class="btn sm" :class="page === view.page ? 'primary' : 'outlined'" :aria-current="page === view.page ? 'page' : undefined" @click="goTo(page)">{{ page }}</button>
          </template>
          <button type="button" class="btn outlined sm" aria-label="Next page" :disabled="view.page === view.lastPage" @click="goTo(view.page + 1)">
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </nav>
      </div>
    </slot>
  </div>
</template>
