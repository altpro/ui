<!--
  <DataTimeline caption="Audit log" :rows="entries" date-key="created_at">
    <template #marker="{ row }"><span class="avatar">…</span></template>
    <template #entry="{ row }"><p>…</p></template>
  </DataTimeline>
  A .timeline per calendar day, on the DataList frame: the same search, filters, paging and TableQuery as DataTable.
  State lives in the query string, so this needs an Inertia app. See references/datatimeline.md in the skill.
-->
<script setup lang="ts" generic="TRow extends object">
import { computed, useSlots } from "vue";
import DataList from "./DataList.vue";
import { groupByDay, instantOf, keyOf, timeOfDay, useDataList, type DataListProps, type DataTableFilter } from "./dataTable";

const props = withDefaults(
  defineProps<
    DataListProps<TRow> & {
      /** The field holding each entry's date. Newest first, unless `direction` says otherwise. */
      dateKey: keyof TRow & string;
      /** The field that identifies an entry. Default `id`. */
      rowKey?: keyof TRow & string;
      /** The day headings, and the empty state's. Default 2, for `<h2>`. */
      headingLevel?: 2 | 3 | 4 | 5 | 6;
      /** Classes for an entry's `<li>`, where a colour word recolours its dot. */
      entryClass?: (row: TRow) => string | string[] | Record<string, boolean> | undefined;
      /** Which timezone a day starts in. Defaults to the browser's; pass the app's so day headings agree with date filters. */
      timeZone?: string;
    }
  >(),
  { search: true },
);

const slots = useSlots();
defineSlots<{
  marker?: (props: { row: TRow }) => unknown;
  entry?: (props: { row: TRow }) => unknown;
  time?: (props: { row: TRow; label: string; datetime?: string }) => unknown;
  empty?: () => unknown;
  filters?: () => unknown;
  foot?: () => unknown;
  [key: `filter-${string}`]: ((props: { filter: DataTableFilter<TRow>; values: string[]; set: (values: string[]) => void }) => unknown) | undefined;
}>();

const dateOf = (row: TRow): unknown => (row as Record<string, unknown>)[props.dateKey];

const list = useDataList<TRow>(() => ({
  rows: props.rows,
  filters: props.filters,
  searchable: props.searchable,
  search: props.search,
  // the days a date filter picks are the days the headings show
  timeZone: props.timeZone,
  name: props.name,
  storageKey: props.name || props.caption,
  perPage: props.perPage,
  sort: props.dateKey,
  direction: props.direction ?? "desc",
  // any other order would break the days up and repeat their headings
  sortOptions: [
    { key: props.dateKey, direction: "desc", label: "Newest first" },
    { key: props.dateKey, direction: "asc", label: "Oldest first" },
  ],
  sortValue: (row) => instantOf(dateOf(row)),
  unfilteredTotal: props.unfilteredTotal,
  only: props.only,
}));

const days = computed(() => groupByDay(list.view.value.rows, dateOf, { locale: props.locale, timeZone: props.timeZone }));
const heading = computed(() => `h${props.headingLevel ?? 2}`);
const timeOf = (row: TRow) => timeOfDay(dateOf(row), { locale: props.locale, timeZone: props.timeZone });
const entryKey = (row: TRow, index: number) => keyOf(row, props.rowKey ?? "id", index);
const filterSlots = computed(() => Object.keys(slots).filter((name): name is `filter-${string}` => name.startsWith("filter-")));
</script>

<template>
  <DataList :list="list" :caption="caption" :search-placeholder="searchPlaceholder" :filter-display="filterDisplay" :filter-count="filterCount" sort-label="Order" scroll-on-page>
    <template v-for="name in filterSlots" :key="name" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>
    <template #filters><slot name="filters" /></template>
    <template v-if="$slots.foot" #foot><slot name="foot" /></template>

    <template #default="{ busy, empty, clearFilters }">
      <div class="flex flex-col gap-gap" :aria-busy="busy || undefined">
        <div v-for="(day, dayIndex) in days" :key="`${day.key}-${dayIndex}`">
          <component :is="heading" class="mb-3 text-lg font-semibold">{{ day.label }}</component>
          <ol class="timeline trailing">
            <li v-for="(row, index) in day.rows" :key="entryKey(row, index)" :class="entryClass?.(row)">
              <slot name="marker" :row="row" />
              <slot name="entry" :row="row" />
              <template v-if="timeOf(row)">
                <slot name="time" :row="row" :label="timeOf(row)!.label" :datetime="timeOf(row)!.datetime">
                  <time :datetime="timeOf(row)!.datetime">{{ timeOf(row)!.label }}</time>
                </slot>
              </template>
            </li>
          </ol>
        </div>

        <div v-if="empty" class="card items-center py-3gap text-center">
          <template v-if="empty === 'nothing-yet'">
            <component :is="heading" class="font-semibold">{{ emptyMessage ?? "Nothing recorded yet." }}</component>
            <slot name="empty" />
          </template>
          <template v-else>
            <component :is="heading" class="font-semibold">{{ noMatchesMessage ?? `No ${caption.toLowerCase()} match your search.` }}</component>
            <button type="button" class="btn sm" @click="clearFilters">Clear filters</button>
          </template>
        </div>
      </div>
    </template>
  </DataList>
</template>
