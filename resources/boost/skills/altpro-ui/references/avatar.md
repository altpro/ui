# Avatar: `.avatar`

A circle showing a photo or initials. Put the class on the `<img>` itself, or on a `<span>` holding initials (or wrapping an `<img>`). Always round, whatever `--radius` is; add `rounded-lg` to square one.

| Kind | Classes |
|------|---------|
| Hue | Any Tailwind hue name: `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`. No hue = neutral grey. |
| Size | `xs` `sm` `lg` `xl`. No size = 2.5rem. |

```html
<img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
<span class="avatar blue lg">LW</span>
```

Hues are a tint in light and a deep shade in dark; text colour is derived from the fill, so any hue is readable in both. An `<a>` avatar gets a focus ring; give it an `aria-label`, initials are not a name.

Groups: wrap avatars in `.join` and they overlap by a third with a 2px ring between them. A plain `<span class="avatar">+3</span>` at the end is the overflow count. On a non-page background set `--avatar-ring` on the group to the surface colour.

```html
<div class="join">
  <img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
  <span class="avatar green">BS</span>
  <span class="avatar">+3</span>
</div>
```

Custom properties: `--avatar-bg --avatar-fg --avatar-size --avatar-radius --avatar-ring`.
