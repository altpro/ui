<!--
  <PageHeading :title="product.name" :breadcrumb="[{ label: 'Products', href: listHref }, { label: product.name }]">
    <template #before><UserAvatar :user="user" size="lg" /></template>
    <template #badges><span class="badge soft success dot">Active</span></template>
    <p class="mt-1 text-sm muted">SKU ARC-SL · Updated <LocalDate :value="product.updated_at" in-sentence /></p>
    <template #actions><Link href="…" class="btn outlined">Tags and photos</Link></template>
  </PageHeading>

  The top of a page: the breadcrumb (deeper pages only), then the page's one h1 with whatever sits before it (an avatar)
  and beside it (status badges), the lines under it (default slot: a facts line, a count), and the page's actions, at
  the far end once there is room and under the title, each filling the row, on a phone. The h1 has tabindex="-1" and a
  focus ring, so the app layout can put focus on it after a visit (app-shell.md), and it wraps anywhere, as a record's
  name may be one long word. ListHeader.vue is this with a list's count line and status cards. See page-heading.md.
-->
<script setup lang="ts">
import type { InertiaLinkProps } from "@inertiajs/vue3";
import PageBreadcrumb from "./PageBreadcrumb.vue";

defineProps<{
  /** The h1: the nav item's label on a page the nav links to, the record's name on a record. */
  title: string;
  /** Only on a page reached from another: the list, then this page. */
  breadcrumb?: ReadonlyArray<{ label: string; href?: InertiaLinkProps["href"] }>;
}>();
const slots = defineSlots<{
  default?: () => unknown;
  before?: () => unknown;
  badges?: () => unknown;
  actions?: () => unknown;
}>();
</script>

<template>
  <div class="flex flex-col gap-1">
    <PageBreadcrumb v-if="breadcrumb?.length" :items="breadcrumb" />
    <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div class="flex min-w-0 items-center gap-4" :class="{ 'mt-1': slots.before && breadcrumb?.length }">
        <slot name="before" />
        <div class="min-w-0">
          <div class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <h1 tabindex="-1" class="text-2xl font-semibold tracking-tight wrap-anywhere focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring/50">{{ title }}</h1>
            <slot name="badges" />
          </div>
          <slot />
        </div>
      </div>
      <div v-if="slots.actions" class="flex flex-wrap gap-2 max-md:basis-full max-md:*:grow max-md:*:justify-center">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
