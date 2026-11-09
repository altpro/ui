<!--
  The frame round any list of records: search, filters, the rows you give it, the count, page size and pagination.
    const list = useDataList(() => ({ rows: props.products, filters: props.filters, name: "products" }));
    <DataList :list="list" caption="Products" v-slot="{ rows, busy }">
      <ul class="grid sm:grid-cols-2 lg:grid-cols-3" :aria-busy="busy || undefined">…</ul>
    </DataList>
  DataTable and DataTimeline are built on it. See references/datalist.md in the skill.
-->
<script setup lang="ts" generic="TRow extends object">
import { computed, ref, useId, watch } from "vue";
import DataFilters from "./DataFilters.vue";
import { PAGE_SIZES, countFilters, handOff, pageWindow, type DataListController, type DataListEmpty, type DataListFilterCount, type DataTableFilter } from "./dataTable";

const props = defineProps<{
  list: DataListController<TRow>;
  /** Names the search box and the pagination. */
  caption: string;
  searchPlaceholder?: string;
  /** Names the sort select, when the list has `sortOptions`. Default "Sort". */
  sortLabel?: string;
  /** `drawer` keeps the filters in a panel behind one Filters button. Default `inline`, in the toolbar. */
  filterDisplay?: "inline" | "drawer";
  /** What the Filters button's badge counts: `in-force` (default) or `changed`. */
  filterCount?: DataListFilterCount;
  /** Back to the top of the list on a page change, for rows tall enough that the next page would start out of sight. */
  scrollOnPage?: boolean;
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

const { list } = props;
const { state, view, filters, sortOptions } = list;

const id = useId();
const root = ref<HTMLElement>();
const searchBox = ref<HTMLInputElement>();
const pager = ref<HTMLElement>();
const filterButton = ref<HTMLButtonElement>();
const filterDialog = ref<HTMLDialogElement>();
const summary = ref<HTMLElement>();

const inDrawer = computed(() => props.filterDisplay === "drawer" && filters.value.length > 0);
// the rows as they are, not the draft: the badge says what the list is showing
const badge = computed(() => countFilters(filters.value, state.filters.value, props.filterCount));

type Target = () => HTMLElement | null | undefined;
// a page change or a cleared search redraws when the URL changes, which in server mode is after the response
let pending: [Element | null, Target] | null = null;
let paged: { keyboard: boolean } | null = null;
watch([() => view.value.page, () => view.value.empty], () => {
  const moved = paged;
  paged = null;
  if (moved && root.value && root.value.getBoundingClientRect().top < 0) root.value.scrollIntoView();
  // the pager has scrolled out of sight with the rows it was under, and a keyboard's focus goes with them
  if (moved?.keyboard) root.value?.focus({ preventScroll: true });
  else if (pending) handOff(...pending, { preventScroll: moved !== null });
  pending = null;
}, { flush: "post" });

// Previous on page two and Next on the last page but one disable themselves: the current page's button takes focus
const goTo = (page: number) => {
  const from = document.activeElement;
  const target = Math.min(Math.max(page, 1), view.value.lastPage);
  pending = [from, () => pager.value?.querySelector<HTMLElement>("[aria-current]")];
  if (props.scrollOnPage && target !== view.value.page) paged = { keyboard: from instanceof HTMLElement && from.matches(":focus-visible") };
  state.apply({ page: target });
};
// the button sits in the row it removes; the search box it emptied comes first, and a list without one has its Filters button or its count
const clearFilters = () => {
  pending = [document.activeElement, () => searchBox.value ?? filterButton.value ?? summary.value];
  state.clearAll();
};

// The drawer edits a draft, as filtering live behind a modal would change rows nobody can see and cost a visit per
// control. Apply commits it once. However else the drawer closes, the draft goes, with no prompt: it is only a query.
const copyOf = (values: Record<string, string[]>) => Object.fromEntries(Object.entries(values).map(([key, given]) => [key, [...given]]));
const draft = ref(copyOf(state.latestFilters.value));
const resetDraft = () => {
  draft.value = copyOf(state.latestFilters.value);
};
// Back or a link while it is open; the same object until a value changes, so a poll does not lose what is being picked
watch(state.latestFilters, resetDraft);
const setDraft = (key: string, values: string[]) => {
  draft.value = { ...draft.value, [key]: values };
};
const applyDraft = () => list.setFilters(draft.value);
// the browser hands focus back to the Filters button as the dialog closes
const clearFromDrawer = () => {
  filterDialog.value?.close();
  clearFilters();
};

const sortChoice = computed(() => String(sortOptions.value.findIndex((o) => o.key === state.sort.value && o.direction === state.direction.value)));
const setSort = (index: number) => {
  const option = sortOptions.value[index];
  if (option) state.apply({ sort: option.key, direction: option.direction });
};

const filterSlots = (slots: Record<string, unknown>) => Object.keys(slots).filter((name): name is `filter-${string}` => name.startsWith("filter-"));
</script>

<template>
  <div ref="root" class="datatable" :tabindex="scrollOnPage ? -1 : undefined">
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

      <template v-if="inDrawer">
        <button ref="filterButton" type="button" class="btn relative" command="show-modal" :commandfor="`${id}-filters`">
          Filters
          <span v-if="badge" class="badge sm primary absolute -end-2 -top-2">{{ badge }}<span class="sr-only"> set</span></span>
        </button>
        <dialog :id="`${id}-filters`" ref="filterDialog" class="dialog drawer divided" closedby="any" :aria-labelledby="`${id}-filters-title`" @close="resetDraft">
          <header>
            <h2 :id="`${id}-filters-title`">Filters</h2>
            <button type="button" class="btn ghost sm" command="close" :commandfor="`${id}-filters`" aria-label="Close">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </header>
          <form :id="`${id}-filters-form`" method="dialog" class="contents" @submit="applyDraft">
            <DataFilters :filters="filters" :values="draft" focus-first @change="setDraft">
              <template v-for="name in filterSlots($slots)" :key="name" #[name]="scope">
                <slot :name="name" v-bind="scope" />
              </template>
            </DataFilters>
          </form>
          <footer class="mt-auto justify-between">
            <button type="button" class="btn ghost" @click="clearFromDrawer">Clear filters</button>
            <button class="btn primary" :form="`${id}-filters-form`">Apply</button>
          </footer>
        </dialog>
      </template>
      <DataFilters v-else :filters="filters" :values="state.latestFilters.value" @change="list.setFilter">
        <template v-for="name in filterSlots($slots)" :key="name" #[name]="scope">
          <slot :name="name" v-bind="scope" />
        </template>
      </DataFilters>

      <div v-if="sortOptions.length" class="field">
        <label :for="`${id}-sort`">{{ sortLabel ?? "Sort" }}</label>
        <select :id="`${id}-sort`" class="input" :value="sortChoice" @change="setSort(Number(($event.target as HTMLSelectElement).value))">
          <!-- a link can ask for a direction this list does not offer -->
          <option v-if="sortChoice === '-1'" value="-1" hidden>Custom</option>
          <option v-for="(option, index) in sortOptions" :key="index" :value="String(index)">{{ option.label }}</option>
        </select>
      </div>

      <slot name="filters" />
      <slot name="controls" />
    </div>

    <slot :rows="view.rows" :busy="state.busy.value" :empty="view.empty" :clear-filters="clearFilters" />

    <slot name="foot">
      <div class="foot">
        <p ref="summary" role="status" :tabindex="list.searchable.value || inDrawer ? undefined : -1">{{ view.summary }}</p>
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
