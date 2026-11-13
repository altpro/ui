# DataTimeline: `DataTimeline.vue`

A `.timeline` per calendar day, with search, filters, an order, a page size and numbered pages. For an audit log or an activity feed people need to search. For a short history on a record, a plain [`.timeline`](timeline.md) is enough. It is built on [DataList](datalist.md), needs `@inertiajs/vue3`, and takes the same `TableQuery` paginator as [DataTable](datatable.md). It is rendered in the browser only, as "Today" depends on the reader's clock: an SSR app keeps it out of the server render with a `v-if` on a flag set in `onMounted`.

```vue
<script setup lang="ts">
import DataTimeline from "@ui/DataTimeline.vue";
import type { DataTableFilter, DataTablePaginated } from "@ui/dataTable";

interface Entry { id: number; created_at: string; severity: string; sentence: string; actor: string; icon: string; }

defineProps<{
  entries: DataTablePaginated<Entry>;
  filters: DataTableFilter<Entry>[];
  unfilteredTotal: number;
}>();
</script>

<template>
  <DataTimeline
    caption="Audit log"
    :rows="entries"
    :filters="filters"
    :unfiltered-total="unfilteredTotal"
    :only="['entries']"
    date-key="created_at"
    filter-display="drawer"
    search-placeholder="Search names or emails"
    empty-message="Nothing has been recorded yet."
    :entry-class="(row) => (row.severity === 'high' ? 'danger' : undefined)"
  >
    <template #marker="{ row }">
      <span class="avatar">{{ row.actor[0] }}</span>
    </template>
    <template #entry="{ row }">
      <p class="text-pretty wrap-anywhere"><b>{{ row.actor }}</b> {{ row.sentence }}</p>
    </template>
  </DataTimeline>
</template>
```

On the server, `created_at` is the sort, newest first:

```php
'entries' => fn () => TableQuery::paginate($query, $request, searchable: ['actor', 'email'], sortable: ['created_at'], defaultSort: 'created_at', defaultDirection: 'desc'),
```

[datatable.md](datatable.md) covers search, declared filters and date ranges on the server.

| Prop | Meaning |
|------|---------|
| `date-key` | Required. The field holding each entry's date. |
| `caption` | Required. Names the search box and pagination, and keys the saved page size unless there is a `name`. |
| `rows`, `filters`, `name`, `per-page`, `searchable`, `:search="false"`, `search-placeholder`, `unfiltered-total`, `only`, `locale`, `filter-display`, `filter-count` | As in [datatable.md](datatable.md). In client mode, with no `searchable` there is no search box. |
| `direction` | `desc` (default) or `asc`. The reader can change it with Order, newest or oldest first. There is no other sort, which would break the days up. |
| `row-key` | The field that identifies an entry. Default `id`. |
| `heading-level` | The day headings and the empty state's. Default 2, for `<h2>`: set it to fit the page's outline. |
| `entry-class` | `(row) => classes` for the `<li>`, where a colour word recolours its dot. |
| `time-zone` | Which timezone a day starts in, for the day headings and, in client mode, the date filter. Defaults to the reader's. Pass the app's when people work across timezones and the rows are filtered on the server, so a day heading agrees with a date filter, which `TableQuery` applies in the app's timezone. |
| `empty-message`, `no-matches-message` | The heading of each empty state. |

| Slot | Gets |
|------|---------|
| `entry` | `{ row }`. Children of the `<li>`, so a `<blockquote>` or `<del>`/`<ins>` from [timeline.md](timeline.md) work. |
| `marker` | `{ row }`. An `.avatar` here takes the dot's place. With no marker, the dot shows. |
| `time` | `{ row, label, datetime }`. Replaces the `<time>`. |
| `empty` | Under `empty-message`, e.g. an explanation or the action that adds the first one. |
| `header`, `filters`, `filter-<key>`, `foot` | As in [datalist.md](datalist.md). With `header`, the no-matches state leaves Clear to it. |

- Days read "Today", "Yesterday", then "4 Nov", with the year only when it is not this one. Yesterday goes by the calendar, so a clock change does not move it.
- Each page groups its own rows, so a day that spans two pages has a heading on both.
- A date that cannot be read does not break the page: the entry sits under "No date" and its `<time>` shows the value as it came. A date with no time of day has no `<time>`, as the heading already says it.
- A page change goes back to the top of the list. From the keyboard, focus goes to the list too.
