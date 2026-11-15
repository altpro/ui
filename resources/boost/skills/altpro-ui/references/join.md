# Join: `.join`

Wraps buttons and inputs into one bar. The radius moves to the group. A one pixel line divides members.

```html
<div class="join">
  <button class="btn primary">Save</button>
  <button class="btn primary" aria-label="More options">▾</button>
</div>
```

- Members keep their own colour, style and size classes. Mixing is fine.
- Layout utilities go on the group (`flex w-full`), and `flex-1` on members to fill.
- `--join-radius` overrides the corner radius for one group. Defaults to `--radius`, or to the buttons' `--button-radius` when the group starts and ends with a `.btn`, so pill buttons make a pill group.
- Icon-only members need `aria-label`.
