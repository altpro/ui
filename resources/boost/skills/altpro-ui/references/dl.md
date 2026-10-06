# Description list: `.dl`

Label and value pairs for record pages: customer details, order summaries, addresses, publication metadata. Each pair sits in its own `<div>`.

```html
<dl class="dl horizontal">
  <div><dt>Placed</dt><dd><time datetime="2026-09-15T09:30">15 September 2026, 09:30</time></dd></div>
  <div><dt>Delivery address</dt><dd>14 Park Row<br>Leeds<br>LS1 5HD</dd></div>
  <div><dt>Total</dt><dd class="tabular-nums">£42.50</dd></div>
</dl>
```

| Kind | Classes |
|------|---------|
| Layout | Stacked by default: the muted label above its value. `horizontal` puts the labels in a column beside the values. |

- `horizontal` falls back to stacked on any row narrower than the label column plus 9rem, so it needs no breakpoint classes in a sidebar card or on a phone. Narrow the label column in a tight space: `[--dl-label:6.5rem]`.
- The `<dl>` is a grid. Stacked pairs go into columns with grid utilities: `class="dl sm:grid-cols-3"`.
- Text is `text-sm`. A value can hold anything: a badge, a link, a `<time>`, several lines.

Custom properties: `--dl-gap --dl-label`.
