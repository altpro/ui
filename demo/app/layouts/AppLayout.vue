<script>
// module scope, shared by every mount: the first is the page load, each later one a visit to a new page
let loaded = false;
</script>

<script setup>
import { onMounted, ref } from "vue";
import { Link, usePage } from "@inertiajs/vue3";
import { House, Menu, Package, Settings, ShoppingCart, X } from "@lucide/vue";
import UserMenu from "@/components/UserMenu.vue";

defineProps({
  // [{ label: "Orders", href: "/orders" }, { label: "Order 1042" }]: the last item is this page
  breadcrumb: { type: Array, default: () => [] },
});

const appName = import.meta.env.VITE_APP_NAME;
const menu = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

// the link for this URL or a page under it
const page = usePage();
const current = (href) => {
  const path = page.url.split("?")[0];
  return path === href || path.startsWith(href + "/") ? "page" : undefined;
};

// Each page wraps itself in this layout, so a visit to a new page mounts it again, drawer closed. The link that was
// clicked has gone with the old page: move focus to main, where a screen reader starts reading and the next Tab
// goes into the page. Not on the page load, where the skip link comes first.
const main = ref();
onMounted(() => {
  if (loaded) main.value.focus({ preventScroll: true });
  loaded = true;
});
</script>

<template>
  <a href="#main" class="btn primary sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50">Skip to content</a>

  <div class="flex min-h-dvh">
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-e border-border bg-card p-3 lg:flex print:hidden">
      <Link href="/dashboard" class="flex h-11 items-center px-3 font-semibold">{{ appName }}</Link>
      <nav class="nav" aria-label="Main">
        <Link v-for="item in menu" :key="item.href" :href="item.href" :aria-current="current(item.href)">
          <component :is="item.icon" class="size-4" aria-hidden="true" /> {{ item.label }}
        </Link>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-gap print:hidden">
        <button class="btn ghost sm -ms-2 px-2 lg:hidden" command="show-modal" commandfor="sidebar" aria-label="Open menu">
          <Menu class="size-4" aria-hidden="true" />
        </button>
        <nav class="breadcrumb min-w-0" aria-label="Breadcrumb">
          <template v-for="(crumb, i) in breadcrumb" :key="i">
            <span v-if="i === breadcrumb.length - 1" aria-current="page">{{ crumb.label }}</span>
            <Link v-else :href="crumb.href">{{ crumb.label }}</Link>
          </template>
        </nav>
        <UserMenu class="ms-auto" />
      </header>

      <main id="main" ref="main" tabindex="-1" class="flex-1 p-gap outline-none">
        <slot />
      </main>
    </div>
  </div>

  <dialog id="sidebar" class="dialog drawer start w-72" closedby="any" aria-label="Menu">
    <div class="flex items-center justify-between">
      <Link href="/dashboard" class="px-3 font-semibold">{{ appName }}</Link>
      <button class="btn ghost sm px-2" command="close" commandfor="sidebar" aria-label="Close menu">
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
    <nav class="nav" aria-label="Main">
      <Link v-for="item in menu" :key="item.href" :href="item.href" :aria-current="current(item.href)">
        <component :is="item.icon" class="size-4" aria-hidden="true" /> {{ item.label }}
      </Link>
    </nav>
  </dialog>
</template>
