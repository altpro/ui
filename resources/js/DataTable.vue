<!--
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" sort="name" />
  An array of rows is searched, sorted and paged here; a Laravel paginator means the server did it (TableQuery).
  State lives in the query string, so this needs an Inertia app. See the DataTable section of SKILL.md.
-->
<script setup lang="ts" generic="TRow extends object">
import { computed, onMounted, ref, useId, watch } from "vue";
import Multiselect from "./Multiselect.vue";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  formatCellValue,
  isPaginated,
  pageWindow,
  paginationMeta,
  readPreference,
  useTableState,
  writePreference,
  type DataTableColumn,
  type DataTableDirection,
  type DataTableFilter,
  type DataTableRows,
  type DataTableSelection,
} from "./dataTable";

const props = defineProps<{
  columns: ReadonlyArray<DataTableColumn<TRow>>;
  rows: DataTableRows<TRow>;
  /** Names the table (an sr-only caption), its search box and its pagination. */
  caption: string;
  /** Prefixes the query parameters and the stored preferences. Needed when two tables share a page. */
  name?: string;
  paginate?: number;
  /** Keys to search. Defaults to every data column. */
  searchable?: ReadonlyArray<keyof TRow & string>;
  filters?: ReadonlyArray<DataTableFilter<TRow>>;
  sort?: string;
  direction?: DataTableDirection;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noMatchesMessage?: string;
  selectable?: boolean;
  /** Server mode: the row count before any search or filter, so an empty table can say which kind of empty it is. */
  unfilteredTotal?: number;
  /** Server mode: the props a change reloads. */
  only?: string[];
}>();

const emit = defineEmits<{ "update:selection": [selection: DataTableSelection | null] }>();

// the slot names are built from column keys, so the compiler cannot infer `row`'s type without this
defineSlots<{
  [key: `cell-${string}`]: ((props: { row: TRow; value: unknown }) => unknown) | undefined;
  filters?: () => unknown;
  empty?: () => unknown;
  "bulk-actions"?: (props: { selection: DataTableSelection; count: number; clear: () => void }) => unknown;
}>();

const id = useId();
const meta = computed(() => (isPaginated(props.rows) ? paginationMeta(props.rows) : null));
const server = computed(() => meta.value !== null);
const sourceRows = computed<TRow[]>(() => (isPaginated(props.rows) ? props.rows.data : [...props.rows]));
const storeKey = `datatable:${props.name || props.columns.map((c) => c.key).join("|")}`;

const defaultSort = props.sort ?? props.columns.find((c) => c.sortable)?.key ?? "";
const state = useTableState({
  name: props.name,
  defaultSort,
  defaultDirection: props.direction ?? "asc",
  filters: () => (props.filters ?? []).map((f) => ({ key: f.key, multiple: f.type === "multiple", defaults: [...(f.default ?? [])] })),
  server: () => server.value,
  only: () => props.only ?? [],
});

// page size and hidden columns are preferences, not the view: a link you send shows the rows, not your column choices
const storedSize = readPreference(`${storeKey}:per-page`);
const preferredSize = ref(typeof storedSize === "number" && PAGE_SIZES.includes(storedSize) ? storedSize : (props.paginate ?? DEFAULT_PAGE_SIZE));
const storedHidden = readPreference(`${storeKey}:hidden-columns`);
const hiddenColumns = ref<string[]>(Array.isArray(storedHidden) ? storedHidden.filter((k) => typeof k === "string") : []);
const pageSize = computed(() => meta.value?.per_page ?? preferredSize.value);

const setPageSize = (size: number) => {
  preferredSize.value = size;
  writePreference(`${storeKey}:per-page`, size);
  state.apply({ perPage: size, page: 1 });
};

// ponytail: the first server visit does not carry a stored page size, so a changed one costs one extra request.
// Store the preference on the user server-side if that ever matters.
onMounted(() => {
  if (meta.value && meta.value.per_page !== preferredSize.value && !state.hasParameter("per_page")) state.apply({ perPage: preferredSize.value });
});

const hideableColumns = computed(() => props.columns.filter((c) => c.hideable ?? c.virtual !== true));
const visibleColumns = computed(() => props.columns.filter((c) => !hiddenColumns.value.includes(c.key)));
const toggleColumn = (key: string) => {
  hiddenColumns.value = hiddenColumns.value.includes(key) ? hiddenColumns.value.filter((k) => k !== key) : [...hiddenColumns.value, key];
  writePreference(`${storeKey}:hidden-columns`, hiddenColumns.value);
};

const rowValue = (row: TRow, key: string): unknown => (row as Record<string, unknown>)[key];
const cellText = (row: TRow, column: DataTableColumn<TRow>) => formatCellValue(rowValue(row, column.key), column.format, column.currency);

// a virtual column has no field, so searching it would compare undefined
const searchKeys = computed<string[]>(() => (props.searchable ? [...props.searchable] : props.columns.filter((c) => !c.virtual).map((c) => c.key)));
const matchesSearch = (row: TRow) => {
  const term = state.searchInput.value.trim().toLowerCase();
  return term === "" || searchKeys.value.some((key) => String(rowValue(row, key) ?? "").toLowerCase().includes(term));
};
const matchesFilters = (row: TRow) =>
  (props.filters ?? []).every((filter) => {
    const values = state.filters.value[filter.key] ?? [];
    if (values.length === 0) return true;
    if (filter.match) return filter.match(row, values);
    const value = rowValue(row, filter.field ?? filter.key);
    return filter.type === "boolean" ? Boolean(value) === (values[0] === "1") : values.includes(String(value));
  });

const compare = (a: unknown, b: unknown): number => {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
};
const sortColumn = computed(() => props.columns.find((c) => c.key === state.sort.value));
const sortValue = (row: TRow, column: DataTableColumn<TRow>) => (column.virtual ? (column.sortValue?.(row) ?? null) : rowValue(row, column.key));

const matchingRows = computed(() => {
  if (server.value) return sourceRows.value;
  const rows = sourceRows.value.filter((row) => matchesSearch(row) && matchesFilters(row));
  const column = sortColumn.value;
  if (!column) return rows;
  const sign = state.direction.value === "asc" ? 1 : -1;
  return rows.sort((a, b) => sign * compare(sortValue(a, column), sortValue(b, column)));
});

const total = computed(() => meta.value?.total ?? matchingRows.value.length);
const unfilteredTotal = computed(() => (server.value ? props.unfilteredTotal : sourceRows.value.length));
const lastPage = computed(() => meta.value?.last_page ?? Math.max(1, Math.ceil(total.value / pageSize.value)));
const currentPage = computed(() => meta.value?.current_page ?? Math.min(state.page.value, lastPage.value));
const displayedRows = computed(() => {
  if (server.value) return matchingRows.value;
  const start = (currentPage.value - 1) * pageSize.value;
  return matchingRows.value.slice(start, start + pageSize.value);
});
const rangeFrom = computed(() => meta.value?.from ?? (total.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1));
const rangeTo = computed(() => meta.value?.to ?? Math.min(currentPage.value * pageSize.value, total.value));
const goTo = (page: number) => state.apply({ page: Math.min(Math.max(page, 1), lastPage.value) });

// The status is always the count and the empty cell always the message, so neither repeats the other.
// It is in the DOM in every state: a live region inserted with its text announces nothing.
const summary = computed(() => {
  const all = unfilteredTotal.value;
  const filtered = all !== undefined && all !== total.value ? `, filtered from ${all}` : "";
  return total.value === 0 ? `Showing 0 of 0${filtered}` : `Showing ${rangeFrom.value}–${rangeTo.value} of ${total.value}${filtered}`;
});

// "nothing yet" offers a way to create, "nothing matches" a way to clear. Server mode tells them apart by unfiltered-total.
const hasQuery = computed(() => state.searchInput.value.trim() !== "" || state.activeFilterCount.value > 0);
const emptyOfEverything = computed(() => (unfilteredTotal.value === undefined ? !hasQuery.value : unfilteredTotal.value === 0));

// aria-sort on the th is the one place sort state lives; .table draws the arrow from it
const ariaSort = (key: string) => (state.sort.value !== key ? undefined : state.direction.value === "asc" ? "ascending" : "descending");
const toggleSort = (key: string) => state.apply({ sort: key, direction: state.sort.value === key && state.direction.value === "asc" ? "desc" : "asc" });

const filterValue = (key: string) => state.filters.value[key]?.[0] ?? "";
const setFilter = (key: string, values: string[]) => state.apply({ filters: { ...state.filters.value, [key]: values } });

const rowId = (row: TRow, index: number): string | number => (row as { id?: string | number }).id ?? index;
const selectedIds = ref<Array<string | number>>([]);
const allMatching = ref(false);
const visibleIds = computed(() => displayedRows.value.map(rowId));
const allVisibleSelected = computed(() => visibleIds.value.length > 0 && visibleIds.value.every((i) => selectedIds.value.includes(i)));
const selectionCount = computed(() => (allMatching.value ? total.value : selectedIds.value.length));
// ticking the page is not ticking every match: the rest is an explicit offer, and taking it hands over the query, not ids
const canSelectAllMatching = computed(() => allVisibleSelected.value && !allMatching.value && total.value > visibleIds.value.length);
const selection = computed<DataTableSelection | null>(() =>
  allMatching.value
    ? { mode: "matching", search: state.searchInput.value.trim(), filters: state.filters.value, count: total.value }
    : selectedIds.value.length
      ? { mode: "ids", ids: [...selectedIds.value] }
      : null,
);
const clearSelection = () => {
  selectedIds.value = [];
  allMatching.value = false;
};
const toggleAllVisible = () => {
  allMatching.value = false;
  selectedIds.value = allVisibleSelected.value ? [] : [...visibleIds.value];
};
watch(selection, (value) => emit("update:selection", value));
// a selection describes a list; change the list and it means nothing
watch([state.searchInput, state.filters, state.sort, state.direction, currentPage], clearSelection);

const columnCount = computed(() => visibleColumns.value.length + (props.selectable ? 1 : 0));
// a checkbox reading "Select row 4" names a position that moves with the sort; the first readable cell names the record
const rowLabel = (row: TRow, index: number) => {
  const column = visibleColumns.value.find((c) => !c.virtual);
  return (column && cellText(row, column)) || `row ${rangeFrom.value + index}`;
};
</script>

<template>
  <div class="datatable">
    <div class="controls">
      <input
        :value="state.searchInput.value"
        class="input search"
        type="search"
        :aria-label="`Search ${caption}`"
        :placeholder="searchPlaceholder ?? 'Search…'"
        @input="state.setSearch(($event.target as HTMLInputElement).value)"
      />

      <template v-for="filter in filters ?? []" :key="filter.key">
        <div v-if="filter.type === 'select'" class="field">
          <label :for="`${id}-${filter.key}`">{{ filter.label }}</label>
          <select :id="`${id}-${filter.key}`" class="input" :value="filterValue(filter.key)" @change="setFilter(filter.key, [($event.target as HTMLSelectElement).value])">
            <option v-if="!filter.default" value="">All</option>
            <option v-for="o in filter.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <label v-else-if="filter.type === 'boolean'" class="checkbox">
          <input type="checkbox" :checked="filterValue(filter.key) === '1'" @change="setFilter(filter.key, ($event.target as HTMLInputElement).checked ? ['1'] : [])" />
          {{ filter.label }}
        </label>
        <div v-else class="field">
          <label>{{ filter.label }}</label>
          <Multiselect :label="filter.label" :options="[...(filter.options ?? [])]" :model-value="state.filters.value[filter.key] ?? []" @update:model-value="setFilter(filter.key, $event)" />
        </div>
      </template>

      <slot name="filters" />

      <template v-if="hideableColumns.length">
        <button type="button" class="btn" :popovertarget="`${id}-columns`">Columns</button>
        <fieldset :id="`${id}-columns`" popover class="dropdown right" :aria-label="`${caption} columns`">
          <label v-for="column in hideableColumns" :key="column.key" class="checkbox">
            <input type="checkbox" :checked="!hiddenColumns.includes(column.key)" @change="toggleColumn(column.key)" />
            {{ column.label }}
          </label>
        </fieldset>
      </template>
    </div>

    <div v-if="selectable && selection" class="bulk">
      <p>{{ selectionCount }} selected</p>
      <button v-if="canSelectAllMatching" type="button" class="btn sm" @click="allMatching = true">Select all {{ total }} matching</button>
      <slot name="bulk-actions" :selection="selection" :count="selectionCount" :clear="clearSelection" />
      <button type="button" class="btn sm ghost" @click="clearSelection">Clear</button>
    </div>

    <div class="scroll" tabindex="0" role="region" :aria-labelledby="`${id}-caption`">
      <table class="table hover" :aria-busy="state.busy.value || undefined">
        <caption :id="`${id}-caption`" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="select">
              <label class="checkbox"><input type="checkbox" :checked="allVisibleSelected" :aria-label="`Select every ${caption} row on this page`" @change="toggleAllVisible" /></label>
            </th>
            <th v-for="column in visibleColumns" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)" :class="column.thClass">
              <button v-if="column.sortable" type="button" @click="toggleSort(column.key)">{{ column.label }}</button>
              <template v-else>{{ column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in displayedRows" :key="rowId(row, index)">
            <td v-if="selectable" class="select">
              <label class="checkbox"><input v-model="selectedIds" type="checkbox" :value="rowId(row, index)" :aria-label="`Select ${rowLabel(row, index)}`" /></label>
            </td>
            <td v-for="column in visibleColumns" :key="column.key" :class="column.tdClass">
              <slot :name="`cell-${column.key}`" :row="row" :value="rowValue(row, column.key)">{{ cellText(row, column) }}</slot>
            </td>
          </tr>
          <!-- the empty message is the table's content, under the caption that names it -->
          <tr v-if="displayedRows.length === 0">
            <td :colspan="columnCount">
              <template v-if="emptyOfEverything">
                {{ emptyMessage ?? "No records found." }}
                <slot name="empty" />
              </template>
              <template v-else>
                {{ noMatchesMessage ?? `No ${caption.toLowerCase()} match your search.` }}
                <button type="button" class="btn sm" @click="state.clearAll()">Clear filters</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="foot">
      <p role="status">{{ summary }}</p>
      <label v-if="total > PAGE_SIZES[0]!">
        Per page
        <select class="input sm" :value="pageSize" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="size in PAGE_SIZES" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <nav v-if="lastPage > 1" class="join" :aria-label="`${caption} pagination`">
        <button type="button" class="btn outlined sm" aria-label="Previous page" :disabled="currentPage === 1" @click="goTo(currentPage - 1)">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <template v-for="(page, i) in pageWindow(currentPage, lastPage)" :key="page ?? `gap-${i}`">
          <span v-if="page === null" class="btn outlined sm pointer-events-none">…</span>
          <button v-else type="button" class="btn sm" :class="page === currentPage ? 'primary' : 'outlined'" :aria-current="page === currentPage ? 'page' : undefined" @click="goTo(page)">{{ page }}</button>
        </template>
        <button type="button" class="btn outlined sm" aria-label="Next page" :disabled="currentPage === lastPage" @click="goTo(currentPage + 1)">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </button>
      </nav>
    </div>
  </div>
</template>
