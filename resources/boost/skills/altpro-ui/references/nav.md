# Nav: `.nav`

Vertical menu for a sidebar or settings page. Put it on a `<nav>` with an `aria-label`. Children are styled by element, so no item classes exist.

| Element | Role |
|---------|------|
| `<a>` | A link. `aria-current="page"` marks the current one. |
| `<details><summary>…</summary>…</details>` | A collapsible section. `open` starts it expanded. Links inside are indented. No JS. |
| `<h2>` to `<h6>` | A small uppercase section label. |
| `<hr>` | A divider. |

```html
<nav class="nav" aria-label="Main">
  <a href="/" aria-current="page"><svg class="size-4" aria-hidden="true">…</svg> Home</a>
  <a href="/inbox">Inbox <span class="badge primary sm ml-auto">12</span></a>
  <details open>
    <summary><svg class="size-4" aria-hidden="true">…</svg> Projects</summary>
    <a href="/p/1">Website</a>
    <a href="/p/2">Mobile app</a>
  </details>
  <h2>Account</h2>
  <a href="/profile">Profile</a>
</nav>
```

Icons go first inside the link or summary, `size-4`, `aria-hidden`. Lucide fits. A trailing badge or count gets `ml-auto`. Width comes from the container or a utility (`w-56`). One level of `<details>` is supported.

A `<button type="button">` is an action item and looks like a link. For a list of actions rather than links, put `.nav` on a `<div>` so it is not a navigation landmark.

Custom properties: `--nav-fg --nav-active-fg --nav-hover --nav-active-bg --nav-radius --nav-h --nav-px --nav-text`.
