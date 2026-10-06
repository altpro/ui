# DataTable: `DataTable.vue` and `TableQuery`

A Vue component for Inertia apps: search, sortable columns, declared filters, page size, hideable columns, row selection with bulk actions, and empty states. Hand it an array and it does the work in the browser. Hand it a Laravel paginator and the server did it, through `Altpro\Ui\TableQuery`. Search, sort, page and filters live in the query string, so the view is a link you can send and the back button works; page size and hidden columns are kept in `localStorage`. It needs `@inertiajs/vue3`. There is no Blade version. It is rendered in the browser only: stored preferences and date formatting would differ from a server render, so an SSR app keeps it out of the server render with a `v-if` on a flag set in `onMounted`.

```vue
<script setup lang="ts">
import DataTable from "@ui/DataTable.vue";
import type { DataTableColumn, DataTableFilter } from "@ui/dataTable";

defineProps<{ brands: Brand[] }>();

const columns: DataTableColumn<Brand>[] = [
  { key: "name", label: "Name", sortable: true, tdClass: "font-medium" },
  { key: "created_at", label: "Added", sortable: true, format: "date" },
  { key: "actions", label: "Actions", virtual: true, thClass: "w-px" },
];
const filters: DataTableFilter<Brand>[] = [
  { key: "featured", label: "Featured only", type: "boolean" },
];
</script>

<template>
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" :filters="filters" sort="name" empty-message="No brands yet.">
    <template #cell-actions="{ row }">
      <Link :href="`/brands/${row.id}/edit`" class="btn ghost sm">Edit <span class="sr-only">{{ row.name }}</span></Link>
    </template>
  </DataTable>
</template>
```

Type the columns (`DataTableColumn<Brand>[]`): without it `key` is any string and a typo is not caught.

| Prop | Meaning |
|------|---------|
| `columns` | `{ key, label, sortable?, hideable?, thClass?, tdClass?, format?, currency? }`. `format` is `date`, `datetime`, `currency` or `boolean`, in `locale` or the page's `<html lang>`; `currency` is an ISO code, default `GBP`. A column with no field behind it (actions, a status built from several fields) sets `virtual: true`; search skips it, and `sortValue: (row) => …` makes it sortable. |
| `rows` | An array (client mode) or a Laravel paginator, flat or under `meta` (server mode). |
| `caption` | Required. Names the table (sr-only caption), the search box and the pagination. |
| `name` | Prefixes the query parameters (`brands_sort`) and the stored preferences. Required when two tables share a page. |
| `searchable` | Keys to search. Defaults to every data column. Client mode only; the server searches what `TableQuery` is given. |
| `filters` | `{ key, label, type: "select" \| "multiple" \| "boolean" \| "daterange", options?: [{ value, label }], default?, field?, match?, presets? }`. `default` applies when the URL says nothing. A select always offers "All". `match(row, values)` covers what a field comparison cannot. |
| `sort`, `direction` | Default sort. Without `sort`, the first sortable column, ascending. |
| `paginate` | Rows per page until the user picks another (10, 25, 50, 100). Default 25. |
| `selectable` | Adds the checkbox column and the bulk bar. `@update:selection` gives `null`, `{ mode: "ids", ids }` or `{ mode: "matching", search, filters, count }`. |
| `row-key` | The field that identifies a row, and what `ids` holds. Default `id`. A selectable table throws on a row without it rather than hand over positions. |
| `empty-message`, `no-matches-message` | "Nothing yet" and "nothing matches", which show differently: the second offers to clear the search. |
| `unfiltered-total` | Server mode: the count before search and filters, so the table can say "filtered from" and pick the right empty message. |
| `only` | Server mode: the props a change reloads, e.g. `['brands']`. Give it, with the controller's other props as closures (below), so a table change skips their queries. |
| `search-placeholder` | Defaults to "Search…". |
| `locale` | Formats `date`, `datetime` and `currency` columns, e.g. `$page.props.locale`. Defaults to `<html lang>` in the browser. Pass it if the app renders on the server (SSR), which has no `<html lang>` to read and would format as `en-GB`. |

| Slot | Gets |
|------|------|
| `cell-<key>` | `{ row, value }`. Replaces the cell, and wins over `format`. |
| `bulk-actions` | `{ selection, count, clear }`. Buttons for the bar shown while rows are selected. |
| `filters` | Extra controls in the toolbar. Filtering in the parent works, but then the table cannot count what was hidden. |
| `empty` | Under `empty-message`, e.g. a "Create one" link. |

- The header checkbox ticks the visible page only, and shows a dash when part of it is ticked. Once the page is ticked and more rows match, the bar offers "Select all N matching", which hands over the query instead of ids: run it again on the server with `TableQuery::search()`. In server mode that query is the one the rows on screen answer, not a search still on its way. Unticking a row afterwards goes back to `ids`: the page's, less that row.
- A change to this table's search, filters, sort or page size goes back to page one. A change to its search, filters, sort or page clears the selection. Another table's changes on the same page leave both alone.
- Sort, page and filter changes add a history entry, so Back steps through views. A search rewrites the current entry as it is typed, and a page size change rewrites it too.
- Clearing a filter that has a `default` (unticking a boolean defaulting to `["1"]`, emptying a multiple, picking "All") writes it present but empty (`featured=`, `tags[]=`), so it stays clear. Setting it back to its default takes it out of the URL. "Clear filters" in the no-matches message puts every filter back to its default.
- The Columns panel will not hide the last data column.
- A `daterange` filter is two native date inputs and a Clear button, for orders placed, tasks due or content scheduled. Its value is `[from, to]` as `Y-m-d`, either of which may be `""`, or `[]` for no range; the URL holds `{key}_from` and `{key}_to`, and either works alone. An impossible or oddly written date is dropped, and a reversed range is turned round. Clear removes both, so a `default` (`["2026-01-01", ""]`) comes back: give one only when the table should never show all time. Client mode compares the first ten characters of the field, both ends inclusive, so a timestamp must arrive in the app's timezone; `match` covers anything else.
- `presets: true` on a `daterange` adds a select beside the dates: Today, Last 7 days, Last 30 days, This month (the whole calendar month), counted in the browser's local time. A preset only fills in both dates, so the URL and `TableQuery` see plain `from` and `to`. The select names a preset while both dates still match it, and says "Custom" once either is edited ("Any time" with no range). Give it to backward-looking ranges such as orders placed; a schedule looking forward is better without. `{ key: "placed", label: "Placed", type: "daterange", presets: true }`.
- Markup: `.datatable` wraps `.controls`, `.bulk`, a scrolling `.scroll` region holding a `.table.hover`, and `.foot` (count, page size, pagination). Utilities on `thClass`/`tdClass` handle alignment and wrapping (`text-right tabular-nums`, `whitespace-nowrap`).

Server mode, in the controller:

```php
use Altpro\Ui\TableQuery;

$filters = [
    ['key' => 'featured', 'label' => 'Featured only', 'type' => 'boolean'],
];
$values = TableQuery::filters($request, $filters, name: 'brands');
$query = Brand::query()->when($values['featured'], fn ($q) => $q->where('featured', true));

// closures, so a reload with `only` runs the table's query and none of the others
return Inertia::render('Brands/Index', [
    'brands' => fn () => TableQuery::paginate($query, $request, name: 'brands', searchable: ['name', 'slug'], sortable: ['name', 'added' => 'created_at'], defaultSort: 'name'),
    'filters' => $filters,
    'unfilteredTotal' => fn () => Brand::count(),
]);
```

```vue
<DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" :filters="filters" :unfiltered-total="unfilteredTotal" :only="['brands']" sort="name" />
```

- `sortable` is the allow-list: a sort column from the URL that is not on it falls back to `defaultSort`, so user input never reaches `order by`. `['added' => 'created_at']` maps the column key to a database column.
- `defaultSort` and `defaultDirection` must match the component's `sort` and `direction`: a bare URL sorts by the controller's, and the header arrow shows the component's.
- Declare the filters once and pass the same array to the page as the `filters` prop. `TableQuery::filters()` reads it the way the component writes it and returns each filter's values by key: `[]` for none, the `default` when the URL says nothing. A boolean is `['1']` when ticked. What a value means stays in the controller, as `when()` clauses.
- A `daterange` on a timestamp column: start inclusive, end exclusive at the start of the next day, both in the app's timezone, so the whole of the last day is in.

  ```php
  [$from, $to] = $values['placed'] + ['', ''];
  $query
      ->when($from !== '', fn ($q) => $q->where('placed_at', '>=', Date::parse($from)->startOfDay()))
      ->when($to !== '', fn ($q) => $q->where('placed_at', '<', Date::parse($to)->addDay()->startOfDay()));
  ```

- After the sort, rows are ordered by the model's key in the same direction, so rows tied on a repeated name, status or date fall on the same side of a page break every time.
- `per_page` is honoured only for `TableQuery::pageSizes()` (10, 25, 50, 100); `perPage:` defaults to 25. A page past the end shows the last page.
- Search is `LIKE %term%` on each `searchable` column, so case follows the collation (MySQL and SQLite ignore it, Postgres does not) and a typed `%` or `_` is a wildcard. Client mode matches a case-insensitive substring.
