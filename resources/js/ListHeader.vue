<!--
  <DataTable … class="framed" empty-message="No products yet." no-matches-message="No products match.">
    <template #header="list">
      <ListHeader v-bind="list" title="Products" noun="product" :stats="[
        { value: 'Active', count: statusCounts.Active, icon: CircleCheck, hue: 'green' },
        { value: 'Draft', count: statusCounts.Draft, icon: PencilLine },
      ]">
        <template #actions><Link href="/products/create" class="btn primary"><Plus class="size-4" aria-hidden="true" /> Add product</Link></template>
      </ListHeader>
    </template>
  </DataTable>

  A list page's title row, for the #header slot of DataTable, DataList or DataTimeline: v-bind the slot's props and it
  has the count and Clear. The h1 (PageHeading.vue), then a count line that is always there, so the rows do not jump
  when a filter starts: "14 products" (plus `qualifier`, such as ", including suspended"), or "4 of 14 products" with a
  quiet Clear beside it while a search or filter narrows the list. Clear empties both, and the list moves focus to its
  search box. The `actions` slot holds the primary action ("Add product"), which fills the row on a phone. `stats`
  draws one StatLink per value of the `stat-key` filter, each counting what its link would show, the current one
  taking its filter off again. The default slot comes after them. See list-header.md.
-->
<script lang="ts">
import type { Component } from "vue";

/** One status card. */
export interface ListHeaderStat {
  /** The filter value the card sets. */
  value: string;
  /** Defaults to the value. */
  label?: string;
  /** The rows its link would show: the search and the other filters, with this value for its own. */
  count: number;
  /** Any component, such as a Lucide icon. */
  icon?: Component;
  /** An `.avatar` hue word for the icon, such as `green`. */
  hue?: string;
}
</script>

<script setup lang="ts">
import { computed } from "vue";
import type { InertiaLinkProps } from "@inertiajs/vue3";
import type { DataListHeader } from "./dataTable";
import PageHeading from "./PageHeading.vue";
import StatLink from "./StatLink.vue";

const props = withDefaults(
  defineProps<
    Partial<DataListHeader> & {
      title: string;
      /** What one row is, for the count line: "product". */
      noun: string;
      /** Defaults to `noun` with an s. */
      plural?: string;
      /** After the count when nothing narrows the list, saying what it includes: ", including suspended". */
      qualifier?: string;
      breadcrumb?: ReadonlyArray<{ label: string; href?: InertiaLinkProps["href"] }>;
      stats?: ReadonlyArray<ListHeaderStat>;
      /** The filter the cards set. */
      statKey?: string;
      /** Names the cards' nav. */
      statsLabel?: string;
      /** Formats the counts. Defaults to `<html lang>`. */
      locale?: string;
    }
  >(),
  {
    total: 0,
    unfilteredTotal: undefined,
    narrowed: false,
    clear: undefined,
    values: () => ({}),
    filterLink: undefined,
    plural: undefined,
    qualifier: "",
    breadcrumb: undefined,
    stats: () => [],
    statKey: "status",
    statsLabel: "Filter by status",
    locale: undefined,
  },
);
defineSlots<{
  default?: () => unknown;
  actions?: () => unknown;
  /** Replaces the words of the count line; Clear stays beside them. */
  count?: (props: { total: number; all: number; narrowed: boolean }) => unknown;
}>();

const number = (n: number) => n.toLocaleString(props.locale ?? (globalThis.document?.documentElement.lang || "en-GB"));
// client mode, or a server list given no unfiltered total: the rows there are
const all = computed(() => props.unfilteredTotal ?? props.total);
const countLine = computed(() => {
  const noun = all.value === 1 ? props.noun : (props.plural ?? `${props.noun}s`);
  return props.narrowed ? `${number(props.total)} of ${number(all.value)} ${noun}` : `${number(all.value)} ${noun}${props.qualifier}`;
});
const current = (stat: ListHeaderStat) => props.values[props.statKey]?.[0] === stat.value;
// four go two by two on a phone; more fill the row once there is room
const grid = computed(() =>
  props.stats.length <= 3 ? ["", "grid-cols-1", "grid-cols-2", "grid-cols-3"][props.stats.length] : props.stats.length === 4 ? "grid-cols-2 @3xl/page:grid-cols-4" : "grid-cols-2 @3xl/page:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]",
);
</script>

<template>
  <div class="flex flex-col gap-gap">
    <PageHeading :title="title" :breadcrumb="breadcrumb">
      <div class="mt-1 flex min-h-8 items-center gap-2 text-sm muted">
        <p><slot name="count" :total="total" :all="all" :narrowed="narrowed">{{ countLine }}</slot></p>
        <button v-if="narrowed && clear" type="button" class="btn ghost sm -me-3" @click="clear">Clear</button>
      </div>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PageHeading>

    <nav v-if="stats.length && filterLink" class="grid gap-gap" :class="grid" :aria-label="statsLabel">
      <StatLink
        v-for="stat in stats"
        :key="stat.value"
        v-bind="filterLink(statKey, current(stat) ? [] : [stat.value])"
        :label="stat.label ?? stat.value"
        :count="stat.count"
        :icon="stat.icon"
        :hue="stat.hue"
        :current="current(stat)"
        :locale="locale"
      />
    </nav>
    <slot />
  </div>
</template>
