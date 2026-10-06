# Timeline: `.timeline`

An `<ol>` of events, a dot each joined by a line. For an audit history or activity feed. Every event has happened, so there is no current or done state; use `.steps` for that.

```html
<ol class="timeline">
  <li>
    <span class="avatar blue">SR</span>
    <p><b>Steve Rayner</b> changed the price from £12.00 to £14.00</p>
    <time datetime="2026-09-15T09:30">Today, 09:30</time>
  </li>
  <li class="danger">
    <p><b>Ann Okafor</b> archived the product</p>
    <time datetime="2026-09-14T16:05">Yesterday, 16:05</time>
  </li>
</ol>
```

| Kind | Classes |
|------|---------|
| Dot colour, on the `<li>` | `primary` `info` `success` `warning` `danger` |

- An `.avatar` as the first child of an item replaces the dot and is sized to the marker.
- A `<time>` is drawn muted on its own line. Anything else inside the item is ordinary content.
- Width is the container's: `max-w-md` or a card.

Activity feed on a record: a `<blockquote>` in an item is a note (indented behind a rule), `<del>`/`<ins>` show a field change (old muted and struck through, new bold), and an attachment is a link with its size in `.muted`.

```html
<li><p><b>Steve Rayner</b> changed Status <del>Pending</del> → <ins>Paid</ins></p><time>Today, 09:30</time></li>
<li><p><b>Ann Okafor</b> left a note</p><blockquote>Courier left it with a neighbour.</blockquote><time>Yesterday</time></li>
<li><p><b>Steve Rayner</b> attached <a class="underline" href="…">invoice-1042.pdf</a> <span class="muted">84 KB</span></p><time>12 Sep</time></li>
```

Custom properties: `--timeline-dot --timeline-line --timeline-marker`.
