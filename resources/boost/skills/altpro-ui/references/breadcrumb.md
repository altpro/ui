# Breadcrumb: `.breadcrumb`

The path to the current page. Put it on a `<nav>` with `aria-label="Breadcrumb"`. Children are styled by element; chevrons are drawn in CSS, so there is no separator markup.

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
  <span aria-current="page">Breadcrumb</span>
</nav>
```

| Child | Role |
|-------|------|
| `<a>` | A link, muted, full-strength on hover. |
| `<span aria-current="page">` | The current page, full-strength text, not a link. |
| `<button>` | Looks like a link. For collapsed levels: give it `aria-label`, `popovertarget`, an ellipsis icon, and put a `.dropdown` holding a `.nav` of the hidden links straight after it. |
| `<ol>` `<li>` | Optional list markup, flattened away. Renders the same as bare children. |

- An icon-only link (a house for home) needs `aria-label`. Icons are `size-4`.
- One row. A path wider than its container scrolls sideways; it never wraps.
- Text is `text-sm`; each link is at least 24px tall.

Custom properties: `--breadcrumb-fg --breadcrumb-active-fg --breadcrumb-gap --breadcrumb-text`.
