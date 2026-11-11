<!--
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" sort="name" />
  An array of rows is searched, sorted and paged here; a Laravel paginator means the server did it (TableQuery).
  State lives in the query string, so this needs an Inertia app. See references/datatable.md in the skill.
-->
<script setup lang="ts" generic="TRow extends object">
import { computed, nextTick, onMounted, ref, useId, useSlots, watch } from "vue";
import DataList from "./DataList.vue";
import {
  formatCellValue,
  handOff,
  keyOf,
  readPreference,
  useDataList,
  writePreference,
  type DataListProps,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableSelection,
} from "./dataTable";

const props = withDefaults(
  defineProps<
    DataListProps<TRow> & {
      columns: ReadonlyArray<DataTableColumn<TRow>>;
      sort?: string;
      selectable?: boolean;
      /** For `v-model:selection`. Setting it to null clears the ticks; to `{ mode: "ids", ids }` ticks those rows. */
      selection?: DataTableSelection | null;
      /** The field that identifies a row, and what a selection hands over. Default `id`; selectable rows must have it. */
      rowKey?: keyof TRow & string;
    }
  >(),
  { search: true },
);

const slots = useSlots();
const emit = defineEmits<{ "update:selection": [selection: DataTableSelection | null] }>();

// the slot names are built from column keys, so the compiler cannot infer `row`'s type without this
defineSlots<{
  [key: `cell-${string}`]: ((props: { row: TRow; value: unknown }) => unknown) | undefined;
  [key: `filter-${string}`]: ((props: { filter: DataTableFilter<TRow>; values: string[]; set: (values: string[]) => void }) => unknown) | undefined;
  filters?: () => unknown;
  empty?: () => unknown;
  "bulk-actions"?: (props: { selection: DataTableSelection; count: number; clear: () => void }) => unknown;
}>();

const id = useId();
const columnKeys = props.columns.map((c) => c.key).join("|");
const storeKey = `datatable:${props.name || columnKeys}`;

const list = useDataList<TRow>(() => ({
  rows: props.rows,
  columns: props.columns,
  filters: props.filters,
  searchable: props.searchable,
  search: props.search,
  name: props.name,
  storageKey: props.name || columnKeys,
  perPage: props.perPage,
  sort: props.sort ?? props.columns.find((c) => c.sortable)?.key ?? "",
  direction: props.direction ?? "asc",
  sortable: props.columns.filter((c) => c.sortable).map((c) => c.key),
  unfilteredTotal: props.unfilteredTotal,
  only: props.only,
}));
const { state, view, server } = list;

// hidden columns are a preference, not the view: a link you send shows the rows, not your column choices.
// They are read on mount, so a server render and the hydrating browser start from the same table.
const hiddenColumns = ref<string[]>([]);

onMounted(() => {
  const storedHidden = readPreference(`${storeKey}:hidden-columns`);
  if (Array.isArray(storedHidden)) hiddenColumns.value = storedHidden.filter((k) => typeof k === "string");
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

const selectedCount = ref<HTMLElement>();
const selectAllBox = ref<HTMLInputElement>();
const bulkBar = ref<HTMLElement>();

// aria-sort on the th is the one place sort state lives; .table draws the arrow from it
const ariaSort = (key: string) => (state.sort.value !== key ? undefined : state.direction.value === "asc" ? "ascending" : "descending");
const toggleSort = (key: string) => state.apply({ sort: key, direction: state.latestSort.value === key && state.latestDirection.value === "asc" ? "desc" : "asc" });


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
      { mode: "matching", search: !list.searchable.value ? "" : server.value ? state.search.value : state.searchInput.value.trim(), filters: state.filters.value, count: view.value.total }
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

const filterSlots = computed(() => Object.keys(slots).filter((name): name is `filter-${string}` => name.startsWith("filter-")));

const columnCount = computed(() => visibleColumns.value.length + (props.selectable ? 1 : 0));
// a checkbox reading "Select row 4" names a position that moves with the sort; the first readable cell names the record
const rowLabel = (row: TRow, index: number) => {
  const column = visibleColumns.value.find((c) => !c.virtual);
  return (column && cellText(row, column)) || `row ${view.value.from + index}`;
};
</script>

<template>
  <DataList :list="list" :caption="caption" :search-placeholder="searchPlaceholder" :filter-display="filterDisplay" :filter-count="filterCount">
    <template v-for="name in filterSlots" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>
    <template #filters><slot name="filters" /></template>
    <template #controls>
      <template v-if="hideableColumns.length">
        <button type="button" class="btn" :popovertarget="`${id}-columns`">Columns</button>
        <fieldset :id="`${id}-columns`" popover class="dropdown right" :aria-label="`${caption} columns`">
          <label v-for="column in hideableColumns" :key="column.key" class="checkbox">
            <input type="checkbox" :checked="!hiddenColumns.includes(column.key)" :disabled="column.key === lastDataColumn" @change="toggleColumn(column.key)" />
            {{ column.label }}
          </label>
        </fieldset>
      </template>
    </template>

    <template #default="{ rows, busy, empty, clearFilters }">
      <div v-if="selectable && selection" ref="bulkBar" class="bulk">
        <p ref="selectedCount" tabindex="-1">{{ selectionCount }} selected</p>
        <button v-if="canSelectAllMatching" type="button" class="btn sm" @click="selectAllMatching">Select all {{ view.total }} matching</button>
        <slot name="bulk-actions" :selection="selection" :count="selectionCount" :clear="clearSelection" />
        <button type="button" class="btn sm ghost" @click="clearSelection">Clear</button>
      </div>

      <div class="scroll" tabindex="0" role="region" :aria-labelledby="`${id}-caption`">
        <table class="table hover" :aria-busy="busy || undefined">
          <caption :id="`${id}-caption`" class="sr-only">{{ caption }}</caption>
          <thead>
            <tr>
              <th v-if="selectable" scope="col" class="select">
                <label class="checkbox"><input ref="selectAllBox" type="checkbox" :checked="allVisibleSelected" :indeterminate="someVisibleSelected" :aria-label="`Select every ${caption} row on this page`" @change="toggleAllVisible" /></label>
              </th>
              <th v-for="column in visibleColumns" :key="column.key" scope="col" :aria-sort="ariaSort(column.key)" :class="column.thClass">
                <button v-if="column.sortable" type="button" @click="toggleSort(column.key)">{{ column.label }}</button>
                <span v-else-if="column.srOnlyLabel" class="sr-only">{{ column.label }}</span>
                <template v-else>{{ column.label }}</template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="rowId(row, index)">
              <td v-if="selectable" class="select">
                <label class="checkbox"><input v-model="selectedIds" type="checkbox" :value="rowId(row, index)" :aria-label="`Select ${rowLabel(row, index)}`" @change="allMatching = false" /></label>
              </td>
              <td v-for="column in visibleColumns" :key="column.key" :class="column.tdClass">
                <slot :name="`cell-${column.key}`" :row="row" :value="rowValue(row, column.key)">{{ cellText(row, column) }}</slot>
              </td>
            </tr>
            <!-- the empty message is the table's content, under the caption that names it -->
            <tr v-if="empty">
              <td :colspan="columnCount">
                <template v-if="empty === 'nothing-yet'">
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
    </template>
  </DataList>
</template>
