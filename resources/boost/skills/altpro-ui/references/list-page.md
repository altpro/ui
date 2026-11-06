# Hand-built list (pattern)

No class. A list page with no `DataTable.vue`, which needs Inertia: a `.table` with its search and filters in the URL, columns that appear when they fit, and a folded row on the phone. In an Inertia app use the list page in [recipes.md](recipes.md).

A composable holds the state:

```js
// resources/js/composables/useListState.js
import { onMounted, onUnmounted, ref } from "vue";

// A list's state in its URL, so a reload, Back and a record's way back all return to it as it was left.
// `defaults` names each parameter; a value at its default stays out of the URL.
export function useListState(defaults) {
  const read = () => {
    const url = new URLSearchParams(location.search);
    return Object.fromEntries(Object.keys(defaults).map((key) => [key, url.get(key) ?? defaults[key]]));
  };
  const state = ref(read());
  const onPopState = () => (state.value = read());
  onMounted(() => addEventListener("popstate", onPopState));
  onUnmounted(() => removeEventListener("popstate", onPopState));

  const query = () => new URLSearchParams(Object.entries(state.value).filter(([key, value]) => value !== defaults[key])).toString();
  // a search replaces the entry as it is typed; a filter adds one, so Back steps through the filters
  const set = (changes, method = "pushState") => {
    state.value = { ...state.value, ...changes };
    history[method](null, "", `${location.pathname}${query() ? `?${query()}` : ""}`);
  };

  return { state, set, query, clear: () => set(defaults) };
}
```

and the page, here a list of orders:

```vue
<script setup>
import { computed, nextTick, ref } from "vue";
import { Search } from "@lucide/vue";
import { useListState } from "@/composables/useListState";

const props = defineProps({ orders: { type: Array, required: true } });
const statuses = ["Processing", "Shipped", "Delivered"];

const { state, set, query, clear } = useListState({ q: "", status: "" });
const filtered = computed(() => Boolean(state.value.q.trim() || state.value.status));
const rows = computed(() => props.orders.filter((order) =>
  order.customer.toLowerCase().includes(state.value.q.trim().toLowerCase())
  && (!state.value.status || order.status === state.value.status)));

// Clear takes its own button away, so focus moves to the list it reset
const results = ref();
async function reset() {
  clear();
  await nextTick();
  results.value.focus();
}
const href = (order) => `/orders/${order.id}${query() ? `?list=${encodeURIComponent(query())}` : ""}`;
</script>

<template>
  <div class="@container/page flex flex-col gap-gap">
    <h1 class="text-2xl font-semibold tracking-tight">Orders</h1>

    <div class="grid grid-cols-2 items-center gap-3 @4xl/page:flex" role="search" aria-label="Orders">
      <label class="input col-span-2 @4xl/page:flex-1">
        <Search class="size-4" aria-hidden="true" />
        <input type="search" placeholder="Search customers" aria-label="Search customers" :value="state.q" @input="set({ q: $event.target.value }, 'replaceState')">
      </label>
      <select class="input min-w-0 @4xl/page:w-44" aria-label="Status" :value="state.status" @change="set({ status: $event.target.value })">
        <option value="">All statuses</option>
        <option v-for="status in statuses" :key="status" :value="status">{{ status }}</option>
      </select>
      <div class="flex min-h-8 items-center justify-end gap-2 @4xl/page:min-w-44">
        <p class="text-sm whitespace-nowrap muted" role="status">{{ filtered ? `${rows.length} of ${orders.length} orders` : "" }}</p>
        <button v-if="filtered" type="button" class="btn ghost sm -me-3 text-muted-foreground hover:text-foreground" @click="reset">Clear</button>
      </div>
    </div>

    <div ref="results" tabindex="-1" class="rounded-(--radius) outline-none focus:outline-3 focus:outline-ring/50">
      <div v-if="!rows.length" class="card items-center py-3gap text-center">
        <h2 class="font-semibold">No orders match</h2>
        <p class="text-sm muted">Try another name or status.</p>
      </div>

      <div v-else class="card">
        <table class="table hover table-fixed">
          <caption class="sr-only">Orders, newest first</caption>
          <colgroup>
            <col>
            <col class="hidden @4xl/page:table-column @4xl/page:w-32">
            <col class="hidden @4xl/page:table-column @4xl/page:w-44">
            <col class="w-24">
          </colgroup>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col" class="hidden @4xl/page:table-cell">Placed</th>
              <th scope="col" class="hidden @4xl/page:table-cell">Status</th>
              <th scope="col" class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in rows" :key="order.id" class="relative">
              <td class="align-top">
                <a class="font-medium hover:underline focus-visible:underline after:absolute after:inset-0" :href="href(order)">{{ order.customer }}</a>
                <span class="block [font-feature-settings:'case']">{{ order.code }}</span>
                <!-- the phone's folded lines run across the row, under the total -->
                <div class="-me-20 mt-1 flex flex-col gap-1 @4xl/page:hidden">
                  <p><span class="badge soft info dot">{{ order.status }}</span></p>
                  <p class="muted"><span class="whitespace-nowrap">Placed {{ order.placed }}</span></p>
                </div>
              </td>
              <td class="hidden align-top @4xl/page:table-cell">{{ order.placed }}</td>
              <td class="hidden align-top @4xl/page:table-cell"><span class="badge soft info dot">{{ order.status }}</span></td>
              <td class="text-right align-top tabular-nums">{{ order.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
```

- The columns fold together at one tier. Beside the shell's sidebar `@4xl/page` is 56rem, which a 1280 laptop reaches and 1024 doesn't. Add the fixed columns' widths and leave the name at least 16rem before moving a tier or adding a column, and put the same threshold on the `col`, `th` and `td`.
- A row's `relative` and the link's `after:` pseudo-element stretch the link over the row. A checkbox in the row needs `relative z-10` to stay above it.
- The status line is `role="status"`, so a screen reader hears the count, and the count and Clear share the toolbar's row, so the table stays where it is when a filter starts.
- Read `list` on the record page and hand it to the breadcrumb's link, so the way back returns to this list as it was left.
- Without a filter, an empty list says what belongs there: [empty-state.md](empty-state.md).
