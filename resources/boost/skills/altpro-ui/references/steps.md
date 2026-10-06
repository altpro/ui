# Steps: `.steps`

An `<ol>` of numbered markers joined by a line. Put `aria-current="step"` on the current `<li>`; steps before it are drawn done (primary marker and line), the current one is bold, later ones are muted. No done or todo classes.

```html
<ol class="steps">
  <li><a href="/cart">Cart</a></li>
  <li><a href="/delivery">Delivery</a></li>
  <li aria-current="step">Payment</li>
  <li>Review</li>
</ol>
```

| Kind | Classes |
|------|---------|
| Layout | Horizontal, each step an equal column. `vertical` stacks them. |

- Done steps can hold an `<a>` back to that step. Current and later steps are plain text.
- Vertical: a one-line label sits on the marker's centre line. A description goes in a `span class="block font-normal leading-normal muted"` after the label.
- Width is the container's: `max-w-2xl` or a card.

Custom properties: `--steps-fg --steps-marker-bg --steps-marker-fg --steps-active-bg --steps-active-fg --steps-line --steps-marker`.
