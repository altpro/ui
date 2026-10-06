# Dropdown: `.dropdown`

A panel anchored to the button that opens it. Native `popover` plus CSS anchor positioning: the browser handles open, close, Esc, click-outside and placement. No JavaScript, no wrapper element. The trigger is any button with `popovertarget` pointing at the panel's `id`.

```html
<button class="btn" popovertarget="menu">Options</button>
<div id="menu" popover class="dropdown">
  <div class="nav">
    <a href="/edit">Edit</a>
    <button type="button">Duplicate</button>
    <hr>
    <button type="button" class="text-danger">Delete</button>
  </div>
</div>
```

| Kind | Classes |
|------|---------|
| Placement | None = down from the trigger, left edges aligned, flipping to right-aligned, then up, when the default would leave the viewport. `left` `right` `up` `down` pin one axis; the other still flips. Pin both and it never flips. |
| Width | `max-content`, at least 10rem, at most 24rem. Override with `w-56`, `w-72`. |
| Padding | 1rem. A lone `.nav` child gets 0.25rem, so a menu hugs its items. Override with `p-*`. |

- Menu: put a `.nav` inside, on a `<div>`. Links, buttons, `<hr>` and headings all work.
- Form: make the popover element a `<form>` (`<form id="x" popover class="dropdown w-56">`). Radios or a couple of inputs plus a `btn primary sm w-full`.
- Help: an icon button with `aria-label` opening a `w-72 text-sm` panel of prose. More room than a tooltip.
- If no placement fits, the panel keeps the default side and scrolls inside rather than leaving the screen.
- Popovers render in the top layer visually, but remain in their DOM position and inherit the scheme region around them. If a popover is mounted elsewhere in the DOM, put the appropriate `light`, `dark`, or `inverse` class on it.
- Add `autofocus` to the first item to move keyboard focus into the panel on open. Without it, Tab from the trigger enters the panel.

Custom properties: `--dropdown-x --dropdown-y --dropdown-gap --dropdown-radius --dropdown-shadow`.
