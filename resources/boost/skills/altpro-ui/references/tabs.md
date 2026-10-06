# Tabs: `.tabs`

A row of underlined tabs like GitHub's repository header. Two modes, no JavaScript.

Links, one page per tab:

```html
<nav class="tabs" aria-label="Repository">
  <a href="/code" aria-current="page"><svg class="size-4" aria-hidden="true">…</svg> Code</a>
  <a href="/pulls">Pull requests <span class="badge">1</span></a>
</nav>
```

Panels, switched in place:

```html
<div class="tabs">
  <label><input type="radio" name="repo" checked> Code</label>
  <label><input type="radio" name="repo"> Pull requests</label>
  <div>Code panel</div>
  <div>Pull requests panel</div>
</div>
```

| Kind | How |
|------|-----|
| Tab | A direct-child `<a>`, `<label>` or `<button>`. An `svg` before the text and a `.badge` after it are optional. |
| Active | `aria-current="page"` on a link, `checked` on the radio in a label, `aria-selected="true"` on a script-driven button. |
| Panels | Any elements after the labels, in the same order: the first non-label child belongs to the first label. Hidden until their radio is checked. Up to eight tabs. |

- One radio `name` per group. Arrow keys move between tabs like a tablist.
- Keep `display` utilities such as `grid` and `flex` on a child inside each panel. A display utility on the direct panel overrides its hidden state because Tailwind utilities win over component styles.
- Tabs wrap when the row is too narrow. Add `overflow-x-auto flex-nowrap` for a scrolling row instead.
- The active bar is `--tabs-active`, the primary colour by default. Text stays the page foreground.

Custom properties: `--tabs-fg --tabs-active-fg --tabs-active --tabs-hover --tabs-border --tabs-radius --tabs-h --tabs-px --tabs-text`.
