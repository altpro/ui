# List header: `ListHeader.vue`

A list page's title row, for the `#header` slot of [`DataTable`](datatable.md#a-list-page), [`DataList`](datalist.md) or [`DataTimeline`](datatimeline.md): the page's `h1`, a count line, a quiet Clear, the primary action, and a card per status that filters the rows. Bind the slot's props with `v-bind` and it has the count, Clear and the links. It is [`PageHeading`](page-heading.md) with a list's parts.

```vue
<script setup lang="ts">
import { computed } from "vue";
import { Link } from "@inertiajs/vue3";
import { Archive, CircleCheck, PencilLine, Plus } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import ListHeader from "@ui/ListHeader.vue";

const props = defineProps<{ /* products, filters, unfilteredTotal, … */ statusCounts: Record<string, number> }>();
const stats = computed(() => [
  { value: "Active", count: props.statusCounts.Active, icon: CircleCheck, hue: "green" },
  { value: "Draft", count: props.statusCounts.Draft, icon: PencilLine },
  { value: "Archived", count: props.statusCounts.Archived, icon: Archive },
]);
</script>

<template>
  <DataTable caption="Products" class="framed" … empty-message="No products yet." no-matches-message="No products match.">
    <template #header="list">
      <ListHeader v-bind="list" title="Products" noun="product" :stats="stats">
        <template #actions>
          <Link href="/products/create" class="btn primary"><Plus class="size-4" aria-hidden="true" /> Add product</Link>
        </template>
      </ListHeader>
    </template>
  </DataTable>
</template>
```

| Prop or slot | What |
|--------------|------|
| `v-bind="list"` | The slot's `total`, `unfilteredTotal`, `narrowed`, `clear`, `values` and `filterLink`. Outside a list component, pass `total` alone for a count with no Clear and no cards. |
| `title` | The `h1`, the nav item's label. |
| `noun`, `plural` | What a row is, for the count line: "14 products", "1 product". `plural` defaults to `noun` plus s ("entry", `plural="entries"`). |
| `qualifier` | After the count while nothing narrows the list, saying what the base includes: `", including suspended"`. |
| `breadcrumb` | Only on a list that is not a nav item of its own, such as a record's sub-list. |
| `stats` | `[{ value, label?, count, icon?, hue? }]`: one [`StatLink`](stat.md#a-stat-that-filters-a-list) per value of the `stat-key` filter. `count` is the rows its link would show (below). `icon` is a Lucide component, drawn in an `.avatar` of the `hue` word, hidden on a phone. |
| `stat-key`, `stats-label` | The filter the cards set, `status`; the cards' nav name, "Filter by status". Declare it as any filter; give it `control: false` when the cards are the only way to set it, as a toolbar select beside them would be the same choice twice. |
| `#actions` | The primary action, "Add {thing}" with a `Plus` icon, a `btn primary`. It fills the row on a phone. |
| `#count` | `{ total, all, narrowed }`: other words for the count line. Clear stays beside them. |
| default | After the cards, inside the header. |

- The count line is always there and keeps its height, so the rows do not jump when a filter starts. Unfiltered it reads "14 products"; narrowed by a search or filter, "4 of 14 products", saying its base, with Clear beside it.
- Clear empties the search and every filter; the list then moves focus to its search box, or its Filters button with no search.
- The cards sit two, three or four across (two by two on a phone for four), after the title row. The current card has `aria-current="true"` and the secondary fill, and a second click takes its filter off. Each card's link is the list with that filter, for a new tab, and a plain click changes the filter as the drawer would, keeping a search still on its way.
- With a header, an empty list leaves Clear to it: the list's own no-matches message has no button.

## Status counts from the server

Each card's count is what its link would show: the search and the other filters apply, and the card's own status takes the place of any status chosen. So a card reading 4 leads to 4 rows. In server mode the index sends them as a prop beside the rows, in the `only` list so a table change reloads them:

```php
'statusCounts' => fn () => $this->statusCounts($request, $values),
```

```php
/** @return array<string, int> */
private function statusCounts(Request $request, array $values): array
{
    // the index's own scope and filter(), with the status filter left out
    $query = $this->filter(Product::visibleTo($request->user()), [...$values, 'status' => []]);
    TableQuery::search($query, self::SEARCHABLE, TableQuery::view($request)['search']);
    $counts = $query->toBase()->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

    return array_map(fn (string $status): int => (int) ($counts[$status] ?? 0), array_combine(Product::STATUSES, Product::STATUSES));
}
```

A status that is not one column (a user is Invited until they set a password, Suspended while `suspended_at` is set) counts each one with its own `when()`, as `filter()` reads it: `collect(Status::cases())->mapWithKeys(fn ($s) => [$s->value => $this->filter($base(), [...$values, 'status' => [$s->value]])->count()])`, one query per card. [recipes.md](recipes.md#2-list-page) has the whole controller.
