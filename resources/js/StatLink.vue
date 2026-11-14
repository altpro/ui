<!--
  <nav class="grid grid-cols-3 gap-gap" aria-label="Filter by status">
    <StatLink v-for="status in statuses" :key="status" v-bind="filterLink('status', values.status?.[0] === status ? [] : [status])"
        :label="status" :count="statusCounts[status]" :icon="icons[status]" :hue="hues[status]" :current="values.status?.[0] === status" />
  </nav>

  A stat card that filters a list: the whole card is an <a>, its label, the count of rows its link would show, and a
  chevron. Its href and click handler come from the list's `filterLink(key, values)` (DataTable, DataList and DataTimeline
  give it to their #header slot), bound with v-bind, so a card clicked while a search is on its way keeps it. The current
  card has aria-current="true" and the secondary fill, and its chevron becomes a cross with ", remove this filter" for a
  screen reader, as a second click takes the filter off. `icon` is any component (a Lucide icon), drawn in an .avatar in
  the `hue` colour word and hidden on a phone. ListHeader.vue draws a row of these from its `stats`. See stat.md.
-->
<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    count: number;
    icon?: Component;
    /** An `.avatar` hue word, such as `green`; none is the neutral grey. */
    hue?: string;
    current?: boolean;
    /** Formats the count. Defaults to `<html lang>`. */
    locale?: string;
  }>(),
  { icon: undefined, hue: undefined, current: false, locale: undefined },
);

const shown = computed(() => props.count.toLocaleString(props.locale ?? (globalThis.document?.documentElement.lang || "en-GB")));
</script>

<template>
  <a
    class="card group flex-row items-center gap-3 transition-colors hover:border-input focus-visible:outline-3 focus-visible:outline-ring/50 aria-[current=true]:bg-secondary aria-[current=true]:text-secondary-foreground"
    :aria-current="current ? 'true' : undefined"
  >
    <span v-if="icon" class="avatar max-md:hidden" :class="hue" aria-hidden="true"><component :is="icon" class="size-4" /></span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm muted group-aria-[current=true]:text-secondary-foreground">{{ label }}</span>
      <span class="block text-2xl font-semibold tracking-tight tabular-nums">{{ shown }}</span>
    </span>
    <span v-if="current" class="sr-only">, remove this filter</span>
    <svg class="size-4 shrink-0 muted group-aria-[current=true]:text-secondary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <template v-if="current"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></template>
      <path v-else d="m9 18 6-6-6-6" />
    </svg>
  </a>
</template>
