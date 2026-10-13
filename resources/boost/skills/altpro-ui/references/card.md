# Card: `.card`

A bordered box on `--color-card`. Children are styled by element, so no item classes exist.

| Child | Role |
|-------|------|
| `<header>` | Title row. A heading (`h1` to `h6`; `h1` when the card is the whole page, such as a sign-in screen) sits left; the first thing after it is pushed to the far side. A `<p>` straight after the heading is a muted description on its own line. |
| `<hgroup>` | Groups the heading and its `<p>` description inside the header when a control shares the row. |
| `<footer>` | Action row. Flex, items centred, left-aligned; add `justify-end` to push buttons right. |
| anything else | Body. Stacks with the card gap. |
| first or last `<img>` `<picture>` `<video>` | Bleeds to the edges and takes the corner radius. |

```html
<div class="card">
  <header>
    <hgroup><h3>Billing</h3><p>Where invoices are sent.</p></hgroup>
    <button class="btn sm">Update address</button>
  </header>
  <p>Invoices go to accounts@example.com on the first of each month.</p>
  <footer><button class="btn primary">Save</button></footer>
</div>
```

| Kind | Classes |
|------|---------|
| Style | `divided`: a full-width line under the header and above the footer. |

- Which element: `div` for a box inside `main` or another sectioned area, `article` for a self-contained item in a list, `section` for a named region of the page. A `form` works too. A `header` or `footer` inside a `div` that has no `article`, `aside`, `main`, `nav` or `section` ancestor is announced as the page banner or contentinfo, so keep `div` cards inside one of those.
- Padding and the gap between children are `--card-p`, 1rem. Change it with `[--card-p:0.75rem]`, not `p-*`, so the media bleed and dividers follow. Gutters between cards are `gap-gap`.
- More than one control in the header goes in a `.join` or a `div class="flex gap-2"`.
- The radius is `--radius` capped at 1rem, so a pill theme does not round a card into an ellipse.

Custom properties: `--card-bg --card-fg --card-border --card-radius --card-p`. `--card-inner` is internal: the radius inside the border, worked out from `--card-radius`; set that instead.

In a `divided` card, a first-child header and last-child footer extend to the outer border and inherit its inner corners. Their contents keep the `--card-p` inset, so `bg-muted` on either section fills the edge without a padding strip. This also applies to divided dialogs.
