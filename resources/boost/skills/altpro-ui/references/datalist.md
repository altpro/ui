# DataList: `DataList.vue` and `useDataList`

The frame round any list of records: search, filters, the count, page size and pagination, around markup you write. For an Inertia app. [datatable.md](datatable.md) and [datatimeline.md](datatimeline.md) are this frame with their rows drawn for you, so use one of those if it fits. Reach for `DataList` for anything else, such as a card grid. Everything in those two references about filters, the URL and `TableQuery` applies here. It renders in the browser only, for the same reason DataTable does.

```vue
<script setup lang="ts">
import DataList from "@ui/DataList.vue";
import { useDataList } from "@ui/dataTable";
import type { DataTableFilter, DataTablePaginated } from "@ui/dataTable";

interface Product { id: number; name: string; price: number; }

const props = defineProps<{
  products: DataTablePaginated<Product>;
  filters: DataTableFilter<Product>[];
  unfilteredTotal: number;
}>();

const list = useDataList<Product>(() => ({
  rows: props.products,
  filters: props.filters,
  unfilteredTotal: props.unfilteredTotal,
  only: ["products"],
  name: "products",
  sortOptions: [
    { key: "name", direction: "asc", label: "Name" },
    { key: "price", direction: "desc", label: "Price, high to low" },
  ],
}));
</script>

<template>
  <DataList :list="list" caption="Products" filter-display="drawer">
    <template #default="{ rows, busy, empty, clearFilters }">
      <ul class="grid list-none gap-gap p-0 sm:grid-cols-2 lg:grid-cols-3" :aria-busy="busy || undefined">
        <li v-for="product in rows" :key="product.id" class="card">{{ product.name }}</li>
      </ul>
      <div v-if="empty === 'no-matches'" class="card items-center py-3gap text-center">
        <h2 class="font-semibold">No products match</h2>
        <button type="button" class="btn sm" @click="clearFilters">Clear filters</button>
      </div>
      <p v-else-if="empty" class="muted">No products yet.</p>
    </template>
  </DataList>
</template>
```

On the server, `sortable` lists the keys in `sortOptions`, and the defaults match the first of them, or the select names one order while the rows are in another:

```php
'products' => fn () => TableQuery::paginate($query, $request, name: 'products', sortable: ['name', 'price'], defaultSort: 'name', defaultDirection: 'asc'),
```

Put `aria-busy` on a direct child of the frame, as above, and it dims while the rows reload. Slot content has no wrapper, so that child is a direct child of `.datatable`.

**`useDataList(() => source)`** takes a function returning:

| Field | Meaning |
|------|---------|
| `rows` | An array (client mode) or a Laravel paginator (server mode). |
| `filters` | Declared filters, as in [datatable.md](datatable.md). |
| `name` | Prefixes the query parameters. Required when two lists share a page. |
| `storageKey` | Names the stored page size. Defaults to `name`; with neither, the page size is not kept. |
| `perPage` | Rows per page until the reader picks another. |
| `searchable` | Client mode: the keys to search. Without it there is no search box, as it could find nothing. |
| `search` | `false` removes the search box in either mode, and a `search` in the URL is then ignored. |
| `sortOptions` | `[{ key, direction, label }]`. Draws a sort select, and adds the keys to what a URL may sort by. In server mode list them in `TableQuery`'s `sortable` too. |
| `sort`, `direction` | The default sort. Defaults to the first of `sortOptions`. |
| `sortable` | Further keys a URL may sort by. |
| `sortValue` | `(row, key) => …`, what client-mode sort compares, if not the field. |
| `unfilteredTotal`, `only` | Server mode, as in [datatable.md](datatable.md). |

It returns what `DataList` needs, and what your own script can read:

| Field | Meaning |
|------|---------|
| `view` | Computed: `rows`, `total`, `page`, `lastPage`, `perPage`, `from`, `to`, `summary`, `empty`, `unfiltered` (the count before any search or filter). |
| `state` | `search` and `filters`, the query the rows on screen answer; `searchInput` and `latestFilters`, what has been asked for and may be ahead of them; `sort`, `direction`, `page`, `busy`; `apply(patch)`, `setSearch`, `clearAll`; `href(patch)`, the URL `apply` would visit. |
| `narrowed` | Computed: a search or a filter is in force, a default included. |
| `setFilter(key, values)`, `setFilters(all)`, `setPageSize(size)` | Change the view. |
| `filterLink(key, values)` | `{ href, onClick }` for an `<a>` that sets one filter, as `#header` below gives it. |

To export or re-run what is on screen, send `state.search.value` and `state.filters.value`.

**`<DataList>` props:** `list`, `caption` (required; names the search box and pagination), `search-placeholder`, `sort-label` (default "Sort"), `filter-display`, `filter-count`, `scroll-on-page`, which goes back to the top of the list on a page change, for rows tall enough that the next page would start out of sight.

**Slots:** the default slot gets `{ rows, busy, empty, clearFilters }`. `header` goes above the toolbar, for the page's title row and stat cards that filter the list, and gets `{ total, unfilteredTotal, narrowed, clear, values, filterLink }`, as [datatable.md](datatable.md#a-list-page) shows. `filters` and `controls` add to the toolbar. `filter-<key>` draws a declared filter. `foot` replaces the count, page size and pagination, for a list that loads more as it scrolls.

## Filters in a drawer

`filter-display="drawer"` puts the filters in a `.dialog.drawer` behind one Filters button. It is the same on `DataTable` and `DataTimeline`.

- Use it when filters would take over the toolbar, on a screen where people mostly read the list. A list people filter constantly keeps them `inline`.
- Search, Columns and the `filters` slot stay in the toolbar. Declared filters, `filter-<key>` slots and the sort select go in the drawer.
- Controls change a draft, the order included. Apply commits it as one visit and goes to page one, unless nothing changed. Escape, the cross or a click on the backdrop let it go, with no prompt. Clear filters empties the search as well, as it does anywhere on a list, and closes the drawer. Focus returns to the button.
- The button's badge counts filters, one each however many values a filter holds. The order is not a filter, so it never counts, and Clear filters leaves it alone. With none to count there is no badge.

| `filter-count` | Counts |
|------|---------|
| `in-force` (default) | Every filter holding a value, a `default` included, so a list narrowed by a default says so. A date range with a default keeps its badge after Clear, as clearing it brings the default back. |
| `changed` | Only filters the reader has set to a value other than the default. A default the reader has emptied does not count, so Clear filters always removes the badge. |

A `#filter-<key>` slot is counted like the rest, because the filter is declared. Declare it with the `type` its values need, as that sets how the URL holds them: `select` keeps one value, `multiple` any number, `daterange` two dates. Its `set` writes to the draft in the drawer and to the URL inline. The `#filters` slot is not counted: the frame cannot know what is in it.

```vue
<template #filter-customer="{ values, set }">
  <div class="field">
    <label>Customer</label>
    <Combobox label="Customer" src="/customers/search" :model-value="values[0]" @update:model-value="set($event ? [String($event)] : [])" />
  </div>
</template>
```
