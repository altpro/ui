# Alert: `.alert`

A callout box. Children are styled by element and position.

```html
<div class="alert warning">
  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">…</svg>
  <h4>Payment overdue</h4>
  <p>The invoice for March was due a week ago.</p>
</div>
```

| Child | Role |
|-------|------|
| leading `<svg>` | The icon, in the accent colour. `size-4`, `aria-hidden`. |
| `<h2>` to `<h6>`, `<strong>` | The title. |
| direct-child `<button>` | Pinned to the far side of the title row. For a dismiss cross: `btn ghost xs` with `aria-label="Dismiss"` and `onclick="this.closest('.alert').remove()"`. |
| anything else | Body, on its own line, indented past the icon. Paragraphs, a list, a `div class="flex gap-2"` of buttons. |

The first thing after the icon shares its row, so `<svg>` then `<p>` is a one-line alert.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). Tints the box and colours the border and icon. No colour = a bordered box on the card colour. Text is always the page foreground. |

- Content present at page load needs no role. Something that appears after an action gets `role="status"` (polite) or `role="alert"` (interrupts); the role goes on the box so screen readers announce it.
- The radius is `--radius` capped at 1rem, like a card.

Custom properties: `--alert-accent --alert-bg --alert-fg --alert-border --alert-radius --alert-p --alert-text --alert-icon`.
