# Record header (pattern)

No class. The top of a record page (an order, a customer, a CMS page): the record's name as the `h1`, a status `.badge`, one muted line of facts, and the page's actions, on the right once the page is wide enough and under the title before that.

```html
<div class="flex flex-wrap items-start justify-between gap-4">
  <div class="min-w-0 grow basis-full @4xl/page:basis-0">
    <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
      <hgroup class="min-w-0">
        <p class="text-sm muted [font-feature-settings:'case']">ORD-10482</p>
        <h1 class="text-2xl font-semibold tracking-tight wrap-anywhere">Ann Okafor's kitchen order</h1>
      </hgroup>
      <span class="badge soft info dot">Processing</span>
    </div>
    <p class="mt-1 text-sm muted">Placed <time datetime="2026-10-03">3 Oct</time> · Next-day delivery</p>
  </div>
  <div class="flex shrink-0 flex-wrap gap-2">
    <a href="/orders/10482/slip" class="btn outlined">Packing slip</a>
    <button class="btn outlined danger">Cancel order</button>
  </div>
</div>
```

- The title's width follows the page, not the name's length, so the actions stay in one place on every record. It needs `@container/page` round the page, which the [app shell](app-shell.md)'s `main` is.
- The `h1` is the name people use for the record, and a code is the caption above it in the `hgroup`.
- The badge sits beside the `h1`, not inside it, so the heading's name is just the record's name.
- The status is a `soft` badge with a `dot` in a semantic colour (`success` active or paid, `info` in progress, `warning` waiting on someone, `danger` failed, no colour for draft, `outlined dot` for archived), the same classes the list uses for that status. A hue badge is a tag, not a status. Overdue is a flag beside the status, not a status: `badge soft danger`, no dot.
- Two or three actions at most, `outlined`, with a destructive one `outlined danger`. The rest go behind a "More" button opening a `.dropdown`. `primary` is for the page's one main action: what the record is waiting for, or on an edit screen Save, in the save bar, so the header has none.
- The [app shell](app-shell.md)'s header draws the breadcrumb. Outside the shell, a `.breadcrumb` back to the list goes above, outside the flex row.
- The facts line is a sentence, not a list of labels. Label/value details go in a `.dl` further down.
