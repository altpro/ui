# Accordion: `.accordion`

A stack of native `<details>`, each a bordered row that slides open. The `<summary>` is the trigger and the one element after it is the panel. No JavaScript; the chevron is drawn in CSS.

```html
<div class="accordion">
  <details name="faq" open>
    <summary>Is it accessible?</summary>
    <div>Yes. A native disclosure.</div>
  </details>
  <details name="faq">
    <summary>Is it styled?</summary>
    <div>Yes.</div>
  </details>
</div>
```

| Kind | Attributes |
|------|------------|
| Exclusive | The same `name` on every `<details>` in the group. Opening one closes the rest. Omit it to let several stay open. |
| Start open | `open` on the `<details>`. |

- The panel is one element after the summary: a `<p>`, or a `<div>` holding several things. Two siblings after the summary break the slide.
- Items are divided by a line; the last has none. Wrap the accordion in a `.card` for an outer border.
- Width is the container's. Use `max-w-xl` or similar.
- The slide and the chevron turn stop under `prefers-reduced-motion`.

Custom properties: `--accordion-fg --accordion-border --accordion-py --accordion-text --accordion-duration`.
