# Tree: `.tree`

Nested lists of links and native `<details>`, for page hierarchies and category trees. No JavaScript; the chevron is drawn in CSS. Not the ARIA `tree` widget: every link and toggle is its own Tab stop, and there is no selection or reordering.

| Markup | Role |
|--------|------|
| `<ul class="tree">` | The root. Nested `<ul>` indent one level each. |
| `.tree.lines` | Adds a guide line down each nested level. |
| `<li><a href>…</a></li>` | A leaf. Its label lines up with branch labels. `aria-current="page"` marks the current one. |
| `<li><details><summary>Label</summary><ul>…</ul></details></li>` | A branch that is only a group. `open` starts it expanded. |
| `<li><a href>Label</a><details><summary aria-label="Label"></summary><ul>…</ul></details></li>` | A branch that is also a page. The empty summary is a 24px chevron toggle over the link's gutter; the link navigates. |

```html
<nav aria-label="Pages">
  <ul class="tree lines">
    <li><a href="/">Home</a></li>
    <li>
      <a href="/about">About us</a>
      <details open>
        <summary aria-label="About us"></summary>
        <ul>
          <li><a href="/about/team" aria-current="page">Team</a></li>
          <li><a href="/about/history">History</a></li>
        </ul>
      </details>
    </li>
    <li>
      <details>
        <summary>Archive</summary>
        <ul>
          <li><a href="/archive/2025">2025</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>
```

- Never put a link inside `<summary>`: a summary is a button, and a link inside it is nested interactive content. Use the page-branch markup above.
- Open the branches above the current page (`open`) so the current link is visible.
- An icon goes first in the link or summary, `size-4`, `aria-hidden`. A trailing count gets `ms-auto`.
- Wrap it in `<nav aria-label>` when the links are site navigation.

Custom properties: `--tree-fg --tree-chevron --tree-hover --tree-active-fg --tree-active-bg --tree-line --tree-radius --tree-h --tree-gutter --tree-indent --tree-text`.
