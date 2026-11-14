# Stat (pattern)

No class. A `.card` with a muted label, a big number and an optional change line, several in a grid.

```html
<div class="grid gap-gap sm:grid-cols-2 lg:grid-cols-4">
  <div class="card">
    <p class="text-sm muted">Revenue</p>
    <p class="text-3xl font-semibold tabular-nums">£12,400</p>
    <p class="text-sm text-success">Up 12% on last month</p>
  </div>
</div>
```

- The label is a `p`, not a heading, so a dashboard of many stats is not many sections.
- The change line says the direction in words (`Up 12%`) and what it compares to, not colour alone. `text-success` up, `text-danger` down, `muted` for no change or a plain note.
- An icon on the right: a `<header>` holding the label `p` and the svg, so the card pushes the svg to the far side. A limit: a `.meter` under the number.
- Loading: a `.skeleton h-9 w-32` for the number and `h-5 w-40` for the change line, with `aria-busy="true"` on the card.

## A stat that filters a list

`StatLink.vue`: the whole card is a link, with a chevron. The current one takes `aria-current="true"` and the `secondary` fill, and its chevron becomes a cross, as a second click takes its filter off. Its figure counts the rows its link would show. On a `DataTable`, `DataList` or `DataTimeline` page, [`ListHeader`](list-header.md) draws a row of them from its `stats` prop, which is the usual way in. On its own, build it in the list's `#header` slot and bind `filterLink` (see [datatable.md](datatable.md#a-list-page)):

```vue
<script setup>
import StatLink from "@ui/StatLink.vue";
</script>

<template>
  <nav class="grid grid-cols-3 gap-gap" aria-label="Filter by status">
    <StatLink v-for="status in statuses" :key="status" v-bind="filterLink('status', values.status?.[0] === status ? [] : [status])"
        :label="status" :count="counts[status]" :icon="icons[status]" :hue="hues[status]" :current="values.status?.[0] === status" />
  </nav>
</template>
```

| Prop | What |
|------|------|
| `label` | The status, muted, above the figure. |
| `count` | A number, formatted for `<html lang>` (`locale` to set another): "1,204". |
| `icon`, `hue` | A Lucide component in an `.avatar` before the label, in the status's colour word (`green`), the badge's colour; no hue is neutral. It goes on a phone, where the cards are narrow. |
| `current` | The list's filter is this card's value: `aria-current="true"`, the fill, a cross and a screen reader's ", remove this filter". |

- The `href` and click handler come from `filterLink`, bound with `v-bind`, so the link opens in a new tab as the filtered list and a plain click changes the filter in place, keeping a search on its way.
- The nav names what the cards do: `aria-label="Filter by status"`.
- The server counts each card as its link would show it: [list-header.md](list-header.md#status-counts-from-the-server).
