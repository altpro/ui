# Link: `.link`

A link in content: in a sentence, a `.dl` value, an `.alert`, a table cell, a hint. Tailwind's reset leaves a bare `<a>` looking like the text around it, which fails WCAG 1.4.1, so every such link takes `class="link"`.

| Kind | Classes |
|------|---------|
| Base | `link`: the primary colour and an underline; hover thickens the underline. No modifiers. |

```html
<p>The order ships once the <a class="link" href="/payments/1">payment clears</a>.</p>
<dd><a class="link" href="mailto:ann@example.com">ann@example.com</a></dd>
```

- Not for a link that is already a component: `.btn`, `.badge`, `.nav`, `.tabs`, `.breadcrumb`, `.tree`, `.steps` and dropdown items style their own.
- Keep the underline. Removing it (`no-underline`) leaves colour as the only difference, which 1.4.1 forbids.
- An Inertia `<Link>` takes the class too: `<Link class="link" href="/orders/1">ORD-10482</Link>`.
- The colour reads at 4.5:1 on `background`, `card`, `muted` and every `.alert` tint in both schemes. If you change it, keep that.

Custom property: `--link-fg`.
