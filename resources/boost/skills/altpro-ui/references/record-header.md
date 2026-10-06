# Record header (pattern)

No class. The top of a record page (an order, a customer, a CMS page): the record's name as the `h1`, a status `.badge`, one muted line of facts, and the page's actions on the right. On a phone the actions wrap under the title.

```html
<div class="flex flex-wrap items-start justify-between gap-4">
  <div class="min-w-0">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <h1 class="text-2xl font-semibold tracking-tight break-words">Order ORD-10482</h1>
      <span class="badge info">Processing</span>
    </div>
    <p class="mt-1 text-sm muted">Placed <time datetime="2026-10-03">3 Oct</time> by Ann Okafor · Next-day delivery</p>
  </div>
  <div class="flex flex-wrap gap-2">
    <a href="/orders/10482/slip" class="btn outlined">Packing slip</a>
    <button class="btn outlined danger">Cancel order</button>
  </div>
</div>
```

- The badge sits beside the `h1`, not inside it, so the heading's name is just the record's name.
- A semantic badge colour for status (`success` active or paid, `warning` waiting on someone, `danger` overdue or failed, plain for draft or archived). A hue badge is a tag, not a status.
- Two or three actions at most, `outlined`, with a destructive one `outlined danger`. The rest go behind a "More" button opening a `.dropdown`. `primary` is for the page's one main action; on an edit screen that is Save, in the save bar, so the header has none.
- A `.breadcrumb` back to the list goes above, outside the flex row.
- The facts line is a sentence, not a list of labels. Label/value details go in a `.dl` further down.
