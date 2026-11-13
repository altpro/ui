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

The whole card is a link, with a chevron. The current one takes `aria-current="true"` and the `secondary` fill, and its chevron becomes a cross, as a second click takes its filter off. Its figure counts the rows its link would show. On a `DataTable`, `DataList` or `DataTimeline` page, build it in the `#header` slot and bind `filterLink` (see [datatable.md](datatable.md#a-list-page)):

```vue
<nav class="grid grid-cols-3 gap-gap" aria-label="Filter by status">
  <a v-for="status in statuses" :key="status" v-bind="filterLink('status', values.status?.[0] === status ? [] : [status])"
      :aria-current="values.status?.[0] === status ? 'true' : undefined"
      class="card group flex-row items-center gap-3 transition-colors hover:border-input focus-visible:outline-3 focus-visible:outline-ring/50 aria-[current=true]:bg-secondary aria-[current=true]:text-secondary-foreground">
    <span class="min-w-0 flex-1">
      <span class="block text-sm muted group-aria-[current=true]:text-secondary-foreground">{{ status }}</span>
      <span class="block text-2xl font-semibold tracking-tight tabular-nums">{{ counts[status] }}</span>
    </span>
    <span v-if="values.status?.[0] === status" class="sr-only">, remove this filter</span>
    <component :is="values.status?.[0] === status ? X : ChevronRight" class="size-4 shrink-0 muted group-aria-[current=true]:text-secondary-foreground" aria-hidden="true" />
  </a>
</nav>
```

- An `.avatar` before the label, in the status's colour word (`green`), holds its icon: `<span class="avatar max-md:hidden" aria-hidden="true">`. It goes on a phone, where three cards share the row.
