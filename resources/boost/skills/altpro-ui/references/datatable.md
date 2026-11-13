# DataTable: `DataTable.vue` and `TableQuery`

For rows that are not a table, [datalist.md](datalist.md) is the same frame round your own markup, and [datatimeline.md](datatimeline.md) a `.timeline` grouped by day.

A Vue component for Inertia apps: search, sortable columns, declared filters, page size, hideable columns, row selection with bulk actions, and empty states. Hand it an array and it does the work in the browser. Hand it a Laravel paginator and the server did it, through `Altpro\Ui\TableQuery`. Search, sort, page and filters live in the query string, so the view is a link you can send and the back button works; page size and hidden columns are kept in `localStorage`. It needs `@inertiajs/vue3`. There is no Blade version. It is rendered in the browser only: stored preferences and date formatting would differ from a server render, so an SSR app keeps it out of the server render with a `v-if` on a flag set in `onMounted`.

```vue
<script setup lang="ts">
import { Link } from "@inertiajs/vue3";
import { ChevronRight } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import type { DataTableColumn, DataTableFilter } from "@ui/dataTable";

interface Brand {
  id: number;
  name: string;
  featured: boolean;
  created_at: string;
}

defineProps<{ brands: Brand[] }>();

const columns: DataTableColumn<Brand>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "created_at", label: "Added", sortable: true, format: "date" },
  { key: "open", label: "Open", virtual: true, srOnlyLabel: true, thClass: "w-10" },
];
const filters: DataTableFilter<Brand>[] = [
  { key: "featured", label: "Featured only", type: "boolean" },
];
</script>

<template>
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" :filters="filters" sort="name" empty-message="No brands yet.">
    <!-- the name is the row's link, stretched over the row; DataTable keeps a row's checkbox above it -->
    <template #cell-name="{ row }">
      <Link :href="`/brands/${row.id}/edit`" class="font-medium after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-3 focus-visible:outline-ring/50">{{ row.name }}</Link>
    </template>
    <template #cell-open>
      <ChevronRight class="ms-auto block size-4 muted" aria-hidden="true" />
    </template>
  </DataTable>
</template>
```

Type the columns (`DataTableColumn<Brand>[]`): without it `key` is any string and a typo is not caught.

| Prop | Meaning |
|------|---------|
| `columns` | `{ key, label, srOnlyLabel?, sortable?, hideable?, thClass?, tdClass?, format?, currency? }`. `format` is `date`, `datetime`, `currency` or `boolean`, in `locale` or the page's `<html lang>`; `currency` is an ISO code, default `GBP`. A column with no field behind it (actions, a status built from several fields) sets `virtual: true`; search skips it, and `sortValue: (row) => …` makes it sortable. `srOnlyLabel: true` keeps the header's `label` for screen readers and hides it on screen, for a column whose cells say what it is, such as a chevron linking to each row: `{ key: "open", label: "Open", virtual: true, srOnlyLabel: true, thClass: "w-px" }`. Never leave a `label` empty instead: the header has no name. A sortable column ignores it, as its button needs a visible name. |
| `rows` | An array (client mode) or a Laravel paginator, flat or under `meta` (server mode). |
| `caption` | Required. Names the table (sr-only caption), the search box and the pagination. |
| `name` | Prefixes the query parameters (`brands_sort`) and the stored preferences. Required when two tables share a page. |
| `searchable` | Keys to search. Defaults to every data column. Client mode only; the server searches what `TableQuery` is given. |
| `filters` | `{ key, label, type: "select" \| "multiple" \| "boolean" \| "daterange", options?: [{ value, label }], default?, field?, match?, presets?, clearLabel? }`. `default` applies when the URL says nothing. A select always offers "All", and an empty multiple reads "All". `match(row, values)` covers what a field comparison cannot. |
| `sort`, `direction` | Default sort. Without `sort`, the first sortable column, ascending. |
| `per-page` | Rows per page until the user picks another (10, 25, 50, 100). Default 25. The same as `TableQuery`'s `perPage:`; the URL calls it `per_page`. |
| `selectable` | Adds the checkbox column and the bulk bar. |
| `v-model:selection` | `null`, `{ mode: "ids", ids }` or `{ mode: "matching", search, filters, count }`. Both ways: set it to `null` and the ticks clear, as the bulk bar's `clear` does. |
| `row-key` | The field that identifies a row, and what `ids` holds. Default `id`. A selectable table throws on a row without it rather than hand over positions. |
| `empty-message`, `no-matches-message` | "Nothing yet" and "nothing matches", which show differently: the second offers to clear the search. |
| `unfiltered-total` | Server mode: the count before search and filters, so the table can say "filtered from" and pick the right empty message. |
| `only` | Server mode: the props a change reloads, e.g. `['brands']`. Give it, with the controller's other props as closures (below), so a table change skips their queries. |
| `search-placeholder` | Defaults to "Search…". |
| `:search="false"` | Removes the search box. Give it when the server has nothing to search: `TableQuery` ignores a term with no searchable columns, and a box that does nothing is worse than none. |
| `filter-display` | `inline` (default) or `drawer`, which keeps the filters in a panel behind one Filters button. See [datalist.md](datalist.md). |
| `filter-count` | What the Filters button's badge counts: `in-force` (default) or `changed`. See [datalist.md](datalist.md). |
| `sort-options` | `[{ key, direction, label }]`: a sort select in the toolbar, for a page too narrow for the headers that sort. Each `key` is a sortable column, or a key `TableQuery`'s `sortable` allows. It shows the order the headers set, and "Custom order" for one it does not offer. |
| `sort-select-class` | Classes for that select: `@5xl/page:hidden` hides it once the last sortable header it stands in for has room. |
| `table-class` | Classes for the `<table>`: `table-fixed`, so the columns hold still as the rows change, with a width on each `th` through `thClass`. |
| `class="framed"` | Draws the table in a card: border, radius and the card colour round the scroll box. |
| `locale` | Formats `date`, `datetime` and `currency` columns, e.g. `$page.props.locale`. Defaults to `<html lang>` in the browser. Pass it if the app renders on the server (SSR), which has no `<html lang>` to read and would format as `en-GB`. |

| Slot | Gets |
|------|------|
| `header` | `{ total, unfilteredTotal, narrowed, clear, values, filterLink }`. The page's title row and anything above the toolbar, such as stat cards that filter the rows: see below. |
| `cell-<key>` | `{ row, value }`. Replaces the cell, and wins over `format`. |
| `bulk-actions` | `{ selection, count, clear }`. Buttons for the bar shown while rows are selected. |
| `filters` | Extra controls in the toolbar. Filtering in the parent works, but then the table cannot count what was hidden. |
| `empty` | Under `empty-message`, e.g. a "Create one" link. |
| `filter-<key>` | `{ filter, values, set }`. Draws a declared filter yourself, such as a customer picked from thousands of records. Unlike the `filters` slot it is counted, cleared and drafted like the rest, and goes in the drawer. Its declared `type` sets how the URL holds the value: `select` keeps one, `multiple` any number. |

- The header checkbox ticks the visible page only, and shows a dash when part of it is ticked. Once the page is ticked and more rows match, the bar offers "Select all N matching", which hands over the query instead of ids: on the server, read it with `TableQuery::selection()` and run it again with the index's filter clauses and `TableQuery::search()` (below). In server mode that query is the one the rows on screen answer, not a search still on its way. Unticking a row afterwards goes back to `ids`: the page's, less that row.
- A change to this table's search, filters, sort or page size goes back to page one. A change to its search, filters, sort or page clears the selection. Another table's changes on the same page leave both alone.
- Sort, page and filter changes add a history entry, so Back steps through views. A search rewrites the current entry as it is typed, and a page size change rewrites it too.
- Clearing a filter that has a `default` (unticking a boolean defaulting to `["1"]`, emptying a multiple, picking "All") writes it present but empty (`featured=`, `tags[]=`), so it stays clear. Setting it back to its default takes it out of the URL. "Clear filters" in the no-matches message clears the search and every filter the same way, so a default that matches nothing does not come straight back; a `daterange` default still does, as below. Laravel's page URL says `tags[0]=` where the table wrote `tags[]=`; the table reads and replaces both, so an app needs no URL workaround.
- The Columns panel will not hide the last data column.
- A `daterange` filter is two native date inputs and a Clear button, for orders placed, tasks due or content scheduled. Its value is `[from, to]` as `Y-m-d`, either of which may be `""`, or `[]` for no range; the URL holds `{key}_from` and `{key}_to`, and either works alone. An impossible or oddly written date is dropped, and a reversed range is turned round. Clear removes both, so a `default` (`["2026-01-01", ""]`) comes back: give one only when the table should never show all time. The button stays in place, inactive until there is a range other than the default to clear. `clearLabel: "Clear dates"` changes its words and its accessible name, for when "Clear" alone says too little. Both ends are inclusive. Client mode compares the field's calendar day where the reader is: a bare date (`2026-06-01`) is that day everywhere, a timestamp with an offset or `Z`, as Laravel serialises a Carbon, falls on the reader's local day (00:30 BST on 2 June arrives as `2026-06-01T23:30:00.000000Z` and counts as 2 June in London), and a value that is no date matches no range. Server mode filters in the app's timezone instead, as `TableQuery` below. `match` covers anything else.
- `presets: true` on a `daterange` adds a select beside the dates: Today, Last 7 days, Last 30 days, This month (the whole calendar month), counted in the browser's local time. A preset only fills in both dates, so the URL and `TableQuery` see plain `from` and `to`. The select names a preset while both dates still match it, and says "Custom" once either is edited ("Any time" with no range). Give it to backward-looking ranges such as orders placed; a schedule looking forward is better without. `{ key: "placed", label: "Placed", type: "daterange", presets: true }`.
- Markup: `.datatable` wraps `.header` (with the slot), `.controls`, `.bulk`, a scrolling `.scroll` region holding a `.table.hover`, and `.foot` (count, page size, pagination). Utilities on `thClass`/`tdClass` handle alignment and wrapping (`text-right tabular-nums`, `whitespace-nowrap`). Each body row is `position: relative`, so a link in it can cover the row with `after:absolute after:inset-0`, and the checkbox cell sits above that link. Anything else a cell holds that must take its own clicks, such as a button, takes `relative z-1`.
- The search box fills the room the other controls leave. On a phone it takes the toolbar's first row, and the Filters button, the sort select and Columns share the next.

### A list page

The list page in [recipes.md](recipes.md#2-list-page) puts these together: the title row and status cards in `#header`, a `framed` table with `table-class="table-fixed"`, title-link rows, columns that appear as the page has room and fold into the name's cell until they do, `sort-options` for the narrow page, and filters in a drawer. The `#header` slot gets:

| Key | Meaning |
|-----|---------|
| `total`, `unfilteredTotal` | The rows that match, and the rows before any search or filter: "4 of 14 products", or "14 products" while nothing narrows them. |
| `narrowed` | A search or a filter is in force, a default included. Show the "of" count and a Clear button while it is true. |
| `clear` | Empties the search and every filter, as the empty table's "Clear filters" does, and hands focus to the search box once its button has gone. With a `#header` the empty table drops its own button, as the one under the title does the job. |
| `values` | Each filter's values as last asked for, to mark the current card with `aria-current="true"`. |
| `filterLink(key, values)` | `{ href, onClick }` for `v-bind` on an `<a>`: the URL of the list with that filter set, for a new tab or a copied link, and a plain click that changes the filter as a control would, building on a change still on its way. A link of your own to `?status=Draft` would lose a search typed just before it. |

```vue
<template #header="{ total, unfilteredTotal, narrowed, clear, values, filterLink }">
  <div class="flex flex-wrap items-start justify-between gap-4">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
      <div class="mt-1 flex min-h-8 items-center gap-2 text-sm muted">
        <p>{{ narrowed ? `${total} of ${unfilteredTotal}` : unfilteredTotal }} products</p>
        <button v-if="narrowed" type="button" class="btn ghost sm" @click="clear">Clear</button>
      </div>
    </div>
  </div>
  <nav class="grid grid-cols-3 gap-gap" aria-label="Filter by status">
    <a v-for="status in ['Active', 'Draft']" :key="status" v-bind="filterLink('status', values.status?.[0] === status ? [] : [status])"
        :aria-current="values.status?.[0] === status ? 'true' : undefined" class="card aria-[current=true]:bg-secondary">…</a>
  </nav>
</template>
```

Each card's count comes from the server, counting the rows its link would show: the search and the other filters, with no status. `recipes.md` has the controller.

Server mode, in the controller:

```php
use Altpro\Ui\TableQuery;

$filters = [
    ['key' => 'featured', 'label' => 'Featured only', 'type' => 'boolean'],
];
$values = TableQuery::filters($request, $filters, name: 'brands');
$query = Brand::query()->when($values['featured'], fn ($q) => $q->where('featured', true));

// closures, so a reload with `only` runs the table's query and none of the others
return Inertia::render('brands/Index', [
    'brands' => fn () => TableQuery::paginate($query, $request, name: 'brands', searchable: ['name', 'slug'], sortable: ['name', 'created_at'], defaultSort: 'name'),
    'filters' => $filters,
    'unfilteredTotal' => fn () => Brand::count(),
]);
```

```vue
<DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" :filters="filters" :unfiltered-total="unfilteredTotal" :only="['brands']" sort="name" />
```

- `sortable` is the allow-list of column keys: a sort column from the URL that is not on it falls back to `defaultSort`, so user input never reaches `order by`. List the key the column has in `columns` (`created_at` above). When that key is not the database column, map it: a column `{ key: "added" }` over rows whose `added` the controller derives from `created_at` takes `sortable: ['added' => 'created_at']`.
- `defaultSort` and `defaultDirection` must match the component's `sort` and `direction`: a bare URL sorts by the controller's, and the header arrow shows the component's. Left out, both sort by their first sortable key, ascending: the first entry in `sortable` and the first `sortable: true` column, which agree when they come in the same order.
- Declare the filters once and pass the same array to the page as the `filters` prop. `TableQuery::filters()` reads it the way the component writes it and returns each filter's values by key: `[]` for none, the `default` when the URL says nothing. A boolean is `['1']` when ticked. What a value means stays in the controller, as `when()` clauses.
- A bulk action over "Select all N matching" posts `{ mode: "matching", search, filters, count }`. `TableQuery::selection($request, $filters)` reads `selection.search` and `selection.filters` from the body with the same checks and in the same shapes as `view()` and `filters()`: `['search' => 'anad', 'filters' => [...]]`. Give it the same declared `$filters`, and `key:` when the app posts the selection under a name other than `selection`. Read the body only through it: a nested array, a NUL byte, invalid UTF-8 or a value of the wrong shape reads as absent, so the filter takes its default, and a null (ConvertEmptyStringsToNull makes one of an empty search or date) is empty. `TableQuery::search()` takes a null term as no search.

  ```php
  ['search' => $search, 'filters' => $values] = TableQuery::selection($request, $filters);
  $query = Brand::query()->when($values['featured'], fn ($q) => $q->where('featured', true));
  TableQuery::search($query, ['name', 'slug'], $search);
  ```

- A `daterange` on a timestamp column: start inclusive, end exclusive at the start of the next day, both in the app's timezone, so the whole of the last day is in.

  ```php
  use Illuminate\Support\Facades\Date;

  [$from, $to] = $values['placed'] + ['', ''];
  $query
      ->when($from !== '', fn ($q) => $q->where('placed_at', '>=', Date::parse($from)->startOfDay()))
      ->when($to !== '', fn ($q) => $q->where('placed_at', '<', Date::parse($to)->addDay()->startOfDay()));
  ```

- After the sort, rows are ordered by the model's key in the same direction, so rows tied on a repeated name, status or date fall on the same side of a page break every time.
- `per_page` is honoured only for `TableQuery::pageSizes()` (10, 25, 50, 100); `perPage:` defaults to 25. A page past the end shows the last page.
- A parameter with a NUL byte or invalid UTF-8 in it reads as absent, since Postgres refuses both even when bound: no search, the default sort or filter. In a `multiple` filter only that value is dropped. The browser reads the same view.
- Search is a case-insensitive `LIKE %term%` on each `searchable` column (`ilike` on Postgres), and a typed `%` or `_` is a wildcard. A JSON path such as `'data->postcode'` is searchable too; it is lowered on both sides, since MySQL compares JSON values case-sensitively. Client mode matches a case-insensitive substring.
