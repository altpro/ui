# Pagination (pattern)

No class. A `<nav aria-label="Pagination">` of `.btn` links, in a `.join` for a bar or `flex gap-1` with `ghost` buttons for a lighter row.

```html
<nav class="join" aria-label="Pagination">
  <a class="btn outlined" role="link" aria-label="Previous page" aria-disabled="true"><svg class="size-4" aria-hidden="true">…</svg></a>
  <a href="?page=1" class="btn primary" aria-current="page">1</a>
  <a href="?page=2" class="btn outlined">2</a>
  <a href="?page=3" class="btn outlined">3</a>
  <span class="btn outlined pointer-events-none">…</span>
  <a href="?page=12" class="btn outlined">12</a>
  <a href="?page=2" class="btn outlined" aria-label="Next page"><svg class="size-4" aria-hidden="true">…</svg></a>
</nav>
```

- Current page: `aria-current="page"` and the `primary` colour. The other pages are `outlined` (joined) or `ghost` (spaced).
- Arrows are icon-only, so each link has an `aria-label`. On the first or last page remove the disabled arrow's `href`, then add `role="link"` and `aria-disabled="true"`; a script-driven `<button>` uses `disabled`.
- Ellipsis: a `<span class="btn outlined pointer-events-none">…</span>`, so it lines up but is not a control.
- Previous and next only: two `btn outlined` links in a `flex justify-between`, with words instead of numbers.
- Table footer: a `div` (not a `nav`) holding the row count, a `select class="input sm"` for page size, a `p aria-live="polite"` saying "Page 2 of 12", and a `join` of `btn outlined sm` first, previous, next and last arrows.
