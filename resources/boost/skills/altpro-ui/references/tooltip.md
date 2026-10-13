# Tooltip: `data-tooltip`

One line of supplementary text in a bubble above an element, on hover and keyboard focus. An attribute, not a class, and no JavaScript. Works on any element; for something that is not focusable, add `tabindex="0"` so keyboard users can reach it.

```html
<button class="btn" data-tooltip="Saves and closes the editor">Save</button>
<button class="btn ghost" data-tooltip="Copy to clipboard" aria-label="Copy to clipboard">…</button>
```

- Screen readers do not read the tooltip. An icon-only control still needs `aria-label`; use the same words in both.
- Keep the tooltip redundant with a visible label or accessible name; never put essential instructions in it.
- One line, up to `20rem`, then an ellipsis. Anything longer, or anything with markup, is a `.dropdown`.
- Always above and centred. It does not flip, slide, or respond to Escape because CSS has no keyboard event handling. Use it only where the reserved space above means it cannot cover other content. Otherwise use a `.dropdown`, which has native Escape dismissal and viewport-aware placement.
- The bubble and its tail are the host's `::after` and `::before`. Put `data-tooltip` only on an element that draws no pseudo-elements of its own: a plain `.btn` or `.badge` is fine, but a `.btn.loading` would lose its spinner, and so would the marker, chevron or line on a `.checkbox`/`.radio`/`.switch` input, an `.accordion` summary, a `.nav`, `.tabs`, `.breadcrumb`, `.tree`, `.steps` or `.timeline` item, a `.combobox` button, or a sortable `.table` header. For those, wrap the element in a `<span data-tooltip="…">`. Focus lands on the control inside, not the span, so a wrapper's tooltip shows on hover only; that is one more reason to keep it redundant.
- The bubble inverts the region's colours (page foreground as fill), so it is correct inside `.light` `.dark` `.inverse` without extra classes.

Custom properties: `--tooltip-bg --tooltip-fg --tooltip-radius --tooltip-h --tooltip-px --tooltip-text --tooltip-gap --tooltip-tail`.
