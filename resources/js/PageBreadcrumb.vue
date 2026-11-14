<!--
  <PageBreadcrumb :items="[{ label: 'Products', href: listHref }, { label: product.name }]" />

  The way back from a page reached from another: a .breadcrumb nav of Inertia links, the last item this page as
  <span aria-current="page">, with the h1's words. It goes on second-level and deeper pages only (an edit page, a
  create page), as the first line of the page's heading block, directly above the h1; never in the app's top bar, and
  not on a page the main nav links to. PageHeading.vue draws it from its `breadcrumb` prop. A level with no page of its
  own leaves out `href` and shows as text. See breadcrumb.md.
-->
<script setup lang="ts">
import { Link } from "@inertiajs/vue3";
import type { InertiaLinkProps } from "@inertiajs/vue3";

defineProps<{
  /** The path from the list to this page; the last item is this page, and its `href` is not used. */
  items: ReadonlyArray<{ label: string; href?: InertiaLinkProps["href"] }>;
}>();
</script>

<template>
  <nav class="breadcrumb min-w-0 print:hidden" aria-label="Breadcrumb">
    <template v-for="(crumb, index) in items" :key="index">
      <span v-if="index === items.length - 1" aria-current="page">{{ crumb.label }}</span>
      <Link v-else-if="crumb.href" :href="crumb.href">{{ crumb.label }}</Link>
      <span v-else>{{ crumb.label }}</span>
    </template>
  </nav>
</template>
