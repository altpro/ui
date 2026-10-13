# Badge: `.badge`

Small label for status, counts and tags. Same modifier words as the button. A `<span>` is static. An `<a>` or `<button>` badge gets hover, a focus ring and a pointer, so a badge can open a popover or link somewhere.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). No colour = neutral grey. |
| Hue | Any Tailwind hue name, the same set the avatar takes: `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`. |
| Style | `outlined`, `ghost` |
| Size | `xs` `sm` `lg` `xl`. No size = default (1.5rem tall, 24px, the minimum for a link or button badge, so `xs` and `sm` are for a `<span>`). |

```html
<span class="badge success">Active</span>
<span class="badge outlined danger sm">Overdue</span>
```

Icons inside a badge are `size-3`. Badges can sit inside `.join`.

Use a semantic colour for status and a hue for a tag or category. Hues are a tint in light and a deep shade in dark; the text and outline colours are derived from the fill, so any hue is readable in both schemes and in all three styles.

Custom properties: `--badge-bg --badge-fg --badge-accent --badge-outline --badge-hover --badge-radius --badge-h --badge-px --badge-text`.
