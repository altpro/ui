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
