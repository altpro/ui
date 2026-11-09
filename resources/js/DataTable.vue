<!--
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" sort="name" />
  An array of rows is searched, sorted and paged here; a Laravel paginator means the server did it (TableQuery).
  State lives in the query string, so this needs an Inertia app. See references/datatable.md in the skill.
-->
<script setup lang="ts" generic="TRow extends object">
import { computed, nextTick, onMounted, ref, useId, watch } from "vue";
import Combobox from "./Combobox.vue";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  datePresets,
  filterIsSet,
  formatCellValue,
  isPaginated,
  keyOf,
  pageWindow,
  readPreference,
  tableView,
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
  /** Rows per page until the reader picks another; one of the page sizes on offer. */
  perPage?: number;
  /** Keys to search. Defaults to every data column. */
  searchable?: ReadonlyArray<keyof TRow & string>;
  filters?: ReadonlyArray<DataTableFilter<TRow>>;
  sort?: string;
  direction?: DataTableDirection;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noMatchesMessage?: string;
  selectable?: boolean;
  /** For `v-model:selection`. Setting it to null clears the ticks; to `{ mode: "ids", ids }` ticks those rows. */
  selection?: DataTableSelection | null;
  /** The field that identifies a row, and what a selection hands over. Default `id`; selectable rows must have it. */
  rowKey?: keyof TRow & string;
  /** Server mode: the row count before any search or filter, so an empty table can say which kind of empty it is. */
  unfilteredTotal?: number;
  /** Server mode: the props a change reloads. */
  only?: string[];
  /** Formats dates and money. Defaults to `<html lang>` in the browser; pass it when the page is rendered on the server too. */
  locale?: string;
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
const server = computed(() => isPaginated(props.rows));
const storeKey = `datatable:${props.name || props.columns.map((c) => c.key).join("|")}`;

const defaultSort = props.sort ?? props.columns.find((c) => c.sortable)?.key ?? "";
const state = useTableState({
  url: () => ({
    name: props.name,
    defaultSort,
    defaultDirection: props.direction ?? "asc",
    sortable: props.columns.filter((c) => c.sortable).map((c) => c.key),
    filters: props.filters ?? [],
  }),
  server: () => server.value,
  only: () => props.only ?? [],
});

// page size and hidden columns are preferences, not the view: a link you send shows the rows, not your column choices.
// They are read on mount, so a server render and the hydrating browser start from the same table.
const preferredSize = ref(props.perPage ?? DEFAULT_PAGE_SIZE);
const hiddenColumns = ref<string[]>([]);

const setPageSize = (size: number) => {
  preferredSize.value = size;
  writePreference(`${storeKey}:per-page`, size);
  state.apply({ perPage: size, page: 1 }, true);
};

// ponytail: the first server visit does not carry a stored page size, so a changed one costs one extra request.
// Store the preference on the user server-side if that ever matters.
onMounted(() => {
  const storedSize = readPreference(`${storeKey}:per-page`);
  if (typeof storedSize === "number" && PAGE_SIZES.includes(storedSize)) preferredSize.value = storedSize;
  const storedHidden = readPreference(`${storeKey}:hidden-columns`);
  if (Array.isArray(storedHidden)) hiddenColumns.value = storedHidden.filter((k) => typeof k === "string");
  if (server.value && view.value.perPage !== preferredSize.value && state.perPage.value === null) state.apply({ perPage: preferredSize.value }, true);
});

const hideableColumns = computed(() => props.columns.filter((c) => c.hideable ?? c.virtual !== true));
const visibleColumns = computed(() => props.columns.filter((c) => !hiddenColumns.value.includes(c.key)));
// with every data column hidden, nothing tells one row from another
const lastDataColumn = computed(() => {
  const shown = visibleColumns.value.filter((c) => !c.virtual);
  return shown.length === 1 ? shown[0]!.key : null;
});
const toggleColumn = (key: string) => {
  hiddenColumns.value = hiddenColumns.value.includes(key) ? hiddenColumns.value.filter((k) => k !== key) : [...hiddenColumns.value, key];
  writePreference(`${storeKey}:hidden-columns`, hiddenColumns.value);
};

const rowValue = (row: TRow, key: string): unknown => (row as Record<string, unknown>)[key];
const cellText = (row: TRow, column: DataTableColumn<TRow>) => formatCellValue(rowValue(row, column.key), column.format, column.currency, props.locale);

// the summary sits in the DOM in every state: a live region inserted with its text announces nothing
const view = computed(() =>
  tableView(
    props,
    { search: state.searchInput.value, filters: state.filters.value, sort: state.sort.value, direction: state.direction.value, page: state.page.value },
    preferredSize.value,
  ),
);

// A button that disables or removes itself drops focus to the body, and a keyboard or screen reader user loses their
// place: once the table has redrawn without it, focus goes to `to`. Only if the focus went with it, so a click elsewhere
// in the meantime keeps its own; and only from a focused button, which a mouse click in Safari never makes.
type Target = () => HTMLElement | null | undefined;
const handOff = (from: Element | null, to: Target) => {
  if (!(from instanceof HTMLElement) || from === document.body) return;
  const gone = !from.isConnected || (from as HTMLButtonElement).disabled;
  if (gone && [document.body, from].includes(document.activeElement as HTMLElement)) to()?.focus();
};
// a page change or a cleared search redraws when the URL changes, which in server mode is after the response
let pending: [Element | null, Target] | null = null;
watch([() => view.value.page, () => view.value.empty], () => {
  if (pending) handOff(...pending);
  pending = null;
}, { flush: "post" });

const searchBox = ref<HTMLInputElement>();
const pager = ref<HTMLElement>();
const selectedCount = ref<HTMLElement>();
const selectAllBox = ref<HTMLInputElement>();
const bulkBar = ref<HTMLElement>();

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

// aria-sort on the th is the one place sort state lives; .table draws the arrow from it
const ariaSort = (key: string) => (state.sort.value !== key ? undefined : state.direction.value === "asc" ? "ascending" : "descending");
const toggleSort = (key: string) => state.apply({ sort: key, direction: state.sort.value === key && state.direction.value === "asc" ? "desc" : "asc" });

const filterValue = (key: string) => state.filters.value[key]?.[0] ?? "";
const setFilter = (key: string, values: string[]) => state.apply({ filters: { ...state.filters.value, [key]: values } });
// a preset is only a way to fill in the dates: the select names one while both dates still match it
const presetOf = (key: string) => {
  const [from, to] = state.filters.value[key] ?? [];
  return datePresets().find((p) => p.range[0] === from && p.range[1] === to)?.label ?? "";
};
const applyPreset = (key: string, label: string) => setFilter(key, [...datePresets().find((p) => p.label === label)!.range]);
// clearing a range brings its default back, so a default leaves nothing to clear
const rangeClearable = (filter: DataTableFilter<TRow>) => filterIsSet(filter, state.filters.value[filter.key]);

const rowId = (row: TRow, index: number) => keyOf(row, props.rowKey ?? "id", index, props.selectable);
const selectedIds = ref<Array<string | number>>([]);
const allMatching = ref(false);
const visibleIds = computed(() => view.value.rows.map(rowId));
const allVisibleSelected = computed(() => visibleIds.value.length > 0 && visibleIds.value.every((i) => selectedIds.value.includes(i)));
const someVisibleSelected = computed(() => !allVisibleSelected.value && visibleIds.value.some((i) => selectedIds.value.includes(i)));
const selectionCount = computed(() => (allMatching.value ? view.value.total : selectedIds.value.length));
// ticking the page is not ticking every match: the rest is an explicit offer, and taking it hands over the query, not ids.
// Unticking a row after that drops back to the page's ids, less that row: a query cannot say "except this one".
const canSelectAllMatching = computed(() => allVisibleSelected.value && !allMatching.value && view.value.total > visibleIds.value.length);
const selection = computed<DataTableSelection | null>(() =>
  allMatching.value
    ? // the query the rows on screen answer: in server mode the box can be ahead of a response still on its way
      { mode: "matching", search: server.value ? state.search.value : state.searchInput.value.trim(), filters: state.filters.value, count: view.value.total }
    : selectedIds.value.length
      ? { mode: "ids", ids: [...selectedIds.value] }
      : null,
);
const clearSelection = () => {
  selectedIds.value = [];
  allMatching.value = false;
};
// the offer goes once taken: focus reads the new count
const selectAllMatching = () => {
  const from = document.activeElement;
  allMatching.value = true;
  nextTick(() => handOff(from, () => selectedCount.value));
};
// the bulk bar goes with the selection, whether its Clear, a bulk action or the parent cleared it: the box that ticks every row takes focus.
// pre-flush, so the bar and whatever in it had focus are still there
watch(() => selection.value === null, (none) => {
  const from = document.activeElement;
  if (none && bulkBar.value?.contains(from)) nextTick(() => handOff(from, () => selectAllBox.value));
});
const toggleAllVisible = () => {
  allMatching.value = false;
  selectedIds.value = allVisibleSelected.value ? [] : [...visibleIds.value];
};
// by content: a matching selection reads the view, which every parent render rebuilds (an inline :searchable array is
// new each time), so emitting each new object would re-render the parent and come straight back, without end
watch(() => JSON.stringify(selection.value), () => emit("update:selection", selection.value));
// and back: a parent that clears its copy after a bulk action clears the ticks. The emit above comes back here equal, and stops.
watch(
  () => props.selection,
  (value) => {
    if (value === undefined || JSON.stringify(value) === JSON.stringify(selection.value)) return;
    allMatching.value = value?.mode === "matching";
    selectedIds.value = value?.mode === "ids" ? [...value.ids] : allMatching.value ? [...visibleIds.value] : [];
  },
  { immediate: true },
);
// a selection describes a list; change the list and it means nothing
watch([state.searchInput, state.filters, state.sort, state.direction, () => view.value.page], clearSelection);

const columnCount = computed(() => visibleColumns.value.length + (props.selectable ? 1 : 0));
// a checkbox reading "Select row 4" names a position that moves with the sort; the first readable cell names the record
const rowLabel = (row: TRow, index: number) => {
  const column = visibleColumns.value.find((c) => !c.virtual);
  return (column && cellText(row, column)) || `row ${view.value.from + index}`;
};
</script>

<template>
  <div class="datatable">
    <div class="controls">
      <input
        ref="searchBox"
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
            <option value="">All</option>
            <option v-for="o in filter.options ?? []" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <label v-else-if="filter.type === 'boolean'" class="checkbox">
          <input type="checkbox" :checked="filterValue(filter.key) === '1'" @change="setFilter(filter.key, ($event.target as HTMLInputElement).checked ? ['1'] : [])" />
          {{ filter.label }}
        </label>
        <fieldset v-else-if="filter.type === 'daterange'" class="field">
          <legend>{{ filter.label }}</legend>
          <select v-if="filter.presets" class="input" :aria-label="`${filter.label} preset`" :value="presetOf(filter.key)" @change="applyPreset(filter.key, ($event.target as HTMLSelectElement).value)">
            <option value="" hidden>{{ state.filters.value[filter.key]?.length ? "Custom" : "Any time" }}</option>
            <option v-for="p in datePresets()" :key="p.label">{{ p.label }}</option>
          </select>
          <div class="join">
            <input type="date" class="input" :aria-label="`${filter.label} from`" :value="filterValue(filter.key)" @change="setFilter(filter.key, [($event.target as HTMLInputElement).value, state.filters.value[filter.key]?.[1] ?? ''])" />
            <input type="date" class="input" :aria-label="`${filter.label} to`" :value="state.filters.value[filter.key]?.[1] ?? ''" @change="setFilter(filter.key, [filterValue(filter.key), ($event.target as HTMLInputElement).value])" />
            <!-- aria-disabled, as `disabled` would drop the focus of whoever just pressed it, and it stays in the join so the toolbar holds still -->
            <button type="button" class="btn outlined" :aria-label="filter.clearLabel ? undefined : `Clear ${filter.label}`" :aria-disabled="rangeClearable(filter) ? undefined : 'true'" @click="rangeClearable(filter) && setFilter(filter.key, [])">{{ filter.clearLabel ?? "Clear" }}</button>
          </div>
        </fieldset>
        <div v-else class="field">
          <label>{{ filter.label }}</label>
          <Combobox multiple :label="filter.label" placeholder="All" :options="[...(filter.options ?? [])]" :model-value="state.filters.value[filter.key] ?? []" @update:model-value="setFilter(filter.key, $event)" />
        </div>
      </template>

      <slot name="filters" />

      <template v-if="hideableColumns.length">
        <button type="button" class="btn" :popovertarget="`${id}-columns`">Columns</button>
        <fieldset :id="`${id}-columns`" popover class="dropdown right" :aria-label="`${caption} columns`">
          <label v-for="column in hideableColumns" :key="column.key" class="checkbox">
            <input type="checkbox" :checked="!hiddenColumns.includes(column.key)" :disabled="column.key === lastDataColumn" @change="toggleColumn(column.key)" />
            {{ column.label }}
          </label>
        </fieldset>
      </template>
    </div>

    <div v-if="selectable && selection" ref="bulkBar" class="bulk">
      <p ref="selectedCount" tabindex="-1">{{ selectionCount }} selected</p>
      <button v-if="canSelectAllMatching" type="button" class="btn sm" @click="selectAllMatching">Select all {{ view.total }} matching</button>
      <slot name="bulk-actions" :selection="selection" :count="selectionCount" :clear="clearSelection" />
      <button type="button" class="btn sm ghost" @click="clearSelection">Clear</button>
    </div>

    <div class="scroll" tabindex="0" role="region" :aria-labelledby="`${id}-caption`">
      <table class="table hover" :aria-busy="state.busy.value || undefined">
        <caption :id="`${id}-caption`" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="select">
              <label class="checkbox"><input ref="selectAllBox" type="checkbox" :checked="allVisibleSelected" :indeterminate="someVisibleSelected" :aria-label="`Select every ${caption} row on this page`" @change="toggleAllVisible" /></label>
            </th>
            <th v-for="column in visibleColumns" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)" :class="column.thClass">
              <button v-if="column.sortable" type="button" @click="toggleSort(column.key)">{{ column.label }}</button>
              <template v-else>{{ column.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in view.rows" :key="rowId(row, index)">
            <td v-if="selectable" class="select">
              <label class="checkbox"><input v-model="selectedIds" type="checkbox" :value="rowId(row, index)" :aria-label="`Select ${rowLabel(row, index)}`" @change="allMatching = false" /></label>
            </td>
            <td v-for="column in visibleColumns" :key="column.key" :class="column.tdClass">
              <slot :name="`cell-${column.key}`" :row="row" :value="rowValue(row, column.key)">{{ cellText(row, column) }}</slot>
            </td>
          </tr>
          <!-- the empty message is the table's content, under the caption that names it -->
          <tr v-if="view.empty">
            <td :colspan="columnCount">
              <template v-if="view.empty === 'nothing-yet'">
                {{ emptyMessage ?? "No records found." }}
                <slot name="empty" />
              </template>
              <template v-else>
                {{ noMatchesMessage ?? `No ${caption.toLowerCase()} match your search.` }}
                <button type="button" class="btn sm" @click="clearFilters">Clear filters</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="foot">
      <p role="status">{{ view.summary }}</p>
      <label v-if="view.total > PAGE_SIZES[0]!">
        Per page
        <select class="input sm" :value="view.perPage" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
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
  </div>
</template>
