---
name: nui
description: Use nui component classes (btn, join, input, field, checkbox, radio, switch, badge, avatar, nav, dropdown, tooltip, card, and more as they land) when writing HTML in a project that imports "nui". Covers class composition, colour and size modifiers, theme tokens, and light/dark scheme regions.
---

# nui

nui is a CSS-only component layer on top of Tailwind v4. Tailwind handles layout and spacing. nui classes replace the long utility strings for common components.

Rule of thumb when writing markup:

1. Reach for a nui class first if one exists for the component.
2. Use Tailwind utilities for layout around it and for one-off tweaks on it.
3. Never rebuild a nui component out of utilities.

## Setup (already done if the project imports nui)

```css
@import "tailwindcss";
@import "nui";
```

## How classes compose

One base class, then bare modifier words in any order. No prefixes.

```html
<button class="btn primary lg">Save</button>
<a href="/x" class="btn outline danger sm">Delete</a>
<button class="btn primary w-full rounded-none">utilities still win</button>
```

Write `btn primary`, never `btn-primary` or `btn btn-primary`. Utilities always override component styles because components live in `@layer components`.

## Button: `.btn`

Works on `<button>`, `<a>`, `<input type="submit">`.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias of `danger`). No colour = neutral grey. |
| Style | `outline` (transparent fill, coloured border and text), `ghost` (transparent, coloured text, no border) |
| Size | `xs` `sm` `lg` `xl`. No size = default (2.25rem tall). |
| State | `disabled` attribute, or `aria-disabled="true"` on links. Focus ring appears on keyboard focus only. |

Icons: put an inline SVG inside the button, sized with `size-4`. The button has `gap-2` built in.

```html
<button class="btn primary">
  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
  New item
</button>
```

Custom properties every button reads. Set them on `.btn` in the app stylesheet for a global change, or inline for one element.

```
--btn-bg  --btn-fg  --btn-accent  --btn-outline  --btn-hover  --btn-radius  --btn-h  --btn-px  --btn-text
```

## Join: `.join`

Wraps buttons and inputs into one bar. The radius moves to the group. A one pixel line divides members.

```html
<div class="join">
  <button class="btn primary">Save</button>
  <button class="btn primary" aria-label="More options">▾</button>
</div>
```

- Members keep their own colour, style and size classes. Mixing is fine.
- Layout utilities go on the group (`flex w-full`), and `flex-1` on members to fill.
- `--join-radius` overrides the corner radius for one group. Defaults to `--radius`.
- Icon-only members need `aria-label`.

## Input: `.input`

One class for every text-like control: `<input>` of any text type, `<select>`, `<textarea>`. Not for checkboxes or radios. On its own it needs a name: a `<label for>` or an `aria-label`.

| Kind | Classes / attributes |
|------|----------------------|
| Size | `xs` `sm` `lg` `xl`. Heights match `.btn`, so the two line up in a join. |
| Invalid | `aria-invalid="true"`. Also automatic when native validation (`required`, `type="email"`, `pattern`) fails after the user has touched it. Border and focus ring turn red. |
| State | `disabled`, `readonly`. Focus ring on focus. |

```html
<input class="input" type="search" placeholder="Search" aria-label="Search">
<select class="input sm" aria-label="Sort by"><option>Newest</option></select>
<textarea class="input" rows="3" aria-label="Notes"></textarea>
```

A textarea grows with `rows`; the size is a minimum height. Width is the browser default; use `w-full` or `w-64`.

A `<select>` opts into `appearance: base-select` where the browser has it (Chrome 135+). The chevron is a Lucide stroke in muted text, the picker matches `.dropdown`, and `<option>`, `<optgroup>` and its `<legend>` are styled. Other browsers keep their native select.

Addons: put `.input` on a `<label>` wrapping the control. Anything else inside (a `<span>` symbol or unit, a `size-4` svg, a `kbd`) sits in the same border in muted text, and the focus ring goes round the whole box. Clicking an addon focuses the control. A `<select>` can be a second control inside the wrapper. A button next to an input is a `.join`, not an addon.

```html
<label class="input"><span>£</span><input type="number" aria-label="Price"></label>
<label class="input"><input type="number" aria-label="Weight"><span>kg</span></label>
<div class="join">
  <input class="input sm" type="search" aria-label="Search">
  <button class="btn primary sm">Go</button>
</div>
```

Custom properties: `--input-bg --input-fg --input-border --input-ring --input-radius --input-h --input-px --input-text`.

## Field: `.field`

Stacks a label, a control, an optional hint and optional errors. Children are styled by element and by the bare words `hint` and `error`; DOM order is display order. Put the `.input` directly inside, or inside a `.join` when it sits beside a button.

```html
<div class="field">
  <label for="email">Email</label>
  <input class="input" id="email" type="email" aria-invalid="true" aria-describedby="email-error">
  <p class="error" id="email-error">Enter a full email address.</p>
</div>
```

| Child | Role |
|-------|------|
| `<label for>` | The label. Bold. Dims when the control is disabled. |
| `.input` or `.join` | The control, bare or as a wrapper with addons. A join stretches to the column and the input inside takes the slack. |
| `.hint` | Help text, muted. Point `aria-describedby` at it. |
| `.error` | Error text, red. A `<p>` for one, a `<ul>` of `<li>` for several. Hidden when empty, so a template can always render it. |

The control turns red when the field holds a non-empty `.error`, when the control has `aria-invalid="true"`, or when native validation fails after interaction. Always set `aria-invalid` and `aria-describedby` alongside an `.error`; the colour alone does not reach screen readers.

Disabled: `disabled` on the control, or `<fieldset class="field" disabled>` to disable everything inside it natively.

## Checkbox, radio, switch: `.checkbox` `.radio` `.switch`

Restyled native inputs. Two ways to label, same result: the class on a `<label>` that wraps the input, or on the `<input>` when a `<label for>` sits beside it. Wrapped is shorter and makes the whole label the click target.

```html
<label class="checkbox"><input type="checkbox" name="remember"> Remember me</label>
<input class="checkbox" id="terms" type="checkbox"> <label for="terms">I agree</label>

<label class="radio"><input type="radio" name="plan" checked> Free</label>
<label class="radio"><input type="radio" name="plan"> Team</label>

<label class="switch"><input type="checkbox" role="switch" checked> Email me about updates</label>
```

| Kind | Classes / attributes |
|------|----------------------|
| Size | `xs` `sm` `lg` `xl`. No size = 1.5rem box, the 24px target minimum. A wrapping label stays 24px tall for the smaller sizes. |
| State | `checked`, `disabled`, `required`. A checkbox also shows the `indeterminate` DOM property. |
| Invalid | `aria-invalid="true"`, or native validation failing after interaction. Border and ring turn red. |

- A switch is a checkbox with `role="switch"`, so screen readers say on and off. Use it for a setting that applies at once; a checkbox for something submitted with a form.
- A radio is always round and a switch always a pill. A checkbox follows `--radius`, capped at a quarter of its size.
- A group goes in `<fieldset class="field">` with a `<legend>`, then `.hint` or `.error` as for any field. Point `aria-describedby` on the inputs at the message. `disabled` on the fieldset disables the lot.
- The checked fill is `--check-accent`, primary by default. For a green switch: `[--check-accent:var(--color-success)]`.

Custom properties, shared by all three: `--check-border --check-accent --check-fg --check-ring --check-size --check-radius --check-text`.

## Badge: `.badge`

Small label for status, counts and tags. Same modifier words as the button. A `<span>` is static. An `<a>` or `<button>` badge gets hover, a focus ring and a pointer, so a badge can open a popover or link somewhere.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). No colour = neutral grey. |
| Style | `outline`, `ghost` |
| Size | `sm` `lg`. No size = default (1.5rem tall, 24px, the minimum for a link or button badge). |

```html
<span class="badge success">Active</span>
<span class="badge outline danger sm">Overdue</span>
```

Icons inside a badge are `size-3`. Badges can sit inside `.join`.

Custom properties: `--badge-bg --badge-fg --badge-accent --badge-outline --badge-hover --badge-radius --badge-h --badge-px --badge-text`.

## Avatar: `.avatar`

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

## Nav: `.nav`

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

## Dropdown: `.dropdown`

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
- Popovers render in the top layer, outside any `.light` `.dark` `.inverse` region. Put the region class on the dropdown itself when the trigger is inside one.
- Add `autofocus` to the first item to move keyboard focus into the panel on open. Without it, Tab from the trigger enters the panel.

Custom properties: `--dropdown-x --dropdown-y --dropdown-gap --dropdown-radius --dropdown-shadow`.

## Tooltip: `data-tooltip`

One line of text in a bubble above an element, on hover and keyboard focus. An attribute, not a class, and no JavaScript. Works on any element; for something that is not focusable, add `tabindex="0"` so keyboard users can reach it.

```html
<button class="btn" data-tooltip="Saves and closes the editor">Save</button>
<button class="btn ghost" data-tooltip="Copy to clipboard" aria-label="Copy to clipboard">…</button>
```

- Screen readers do not read the tooltip. An icon-only control still needs `aria-label`; use the same words in both.
- One line, up to `20rem`, then an ellipsis. Anything longer, or anything with markup, is a `.dropdown`.
- Always above and centred. It does not flip or slide, and an ancestor with `overflow` clips it. Keep tooltips off the top edge of the page and out of scroll containers.
- The bubble inverts the region's colours (page foreground as fill), so it is correct inside `.light` `.dark` `.inverse` without extra classes.

Custom properties: `--tooltip-bg --tooltip-fg --tooltip-radius --tooltip-h --tooltip-px --tooltip-text --tooltip-gap --tooltip-tail`.

## Card: `.card`

A bordered box on `--color-card`. Children are styled by element, so no item classes exist.

| Child | Role |
|-------|------|
| `<header>` | Title row. A heading (`h2` to `h6`) sits left; the first thing after it is pushed to the far side. A `<p>` straight after the heading is a muted description on its own line. |
| `<hgroup>` | Groups the heading and its `<p>` description inside the header when a control shares the row. |
| `<footer>` | Action row. Flex, items centred, left-aligned; add `justify-end` to push buttons right. |
| anything else | Body. Stacks with the card gap. |
| first or last `<img>` `<picture>` `<video>` | Bleeds to the edges and takes the corner radius. |

```html
<div class="card">
  <header>
    <hgroup><h3>Billing</h3><p>Where invoices are sent.</p></hgroup>
    <button class="btn sm">Update address</button>
  </header>
  <p>Invoices go to accounts@example.com on the first of each month.</p>
  <footer><button class="btn primary">Save</button></footer>
</div>
```

| Kind | Classes |
|------|---------|
| Style | `divided`: a full-width line under the header and above the footer. |

- Which element: `div` for a box inside `main` or another sectioned area, `article` for a self-contained item in a list, `section` for a named region of the page. A `form` works too. A `header` or `footer` inside a `div` that has no `article`, `aside`, `main`, `nav` or `section` ancestor is announced as the page banner or contentinfo, so keep `div` cards inside one of those.
- Padding and the gap between children are `--card-p`, 1rem. Change it with `[--card-p:0.75rem]`, not `p-*`, so the media bleed and dividers follow. Gutters between cards are `gap-gap`.
- More than one control in the header goes in a `.join` or a `div class="flex gap-2"`.
- The radius is `--radius` capped at 1rem, so a pill theme does not round a card into an ellipse.

Custom properties: `--card-bg --card-fg --card-border --card-radius --card-p`.

## Theme tokens

All colours are Tailwind theme variables, so `bg-primary`, `text-muted-foreground`, `border-border` and the rest exist as utilities. Each `X` has an `X-foreground` for text placed on it.

```
background  foreground
card        card-foreground
muted       muted-foreground
border      ring
primary     secondary  info  success  warning  danger   (each with -foreground)
red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose
            (hue fills: a tint in light, a deep shade in dark; pair with text derived from them, as .avatar does)
```

Every token is `light-dark()`, so the same class is correct in both schemes. Do not write `dark:` variants for these colours.

Spacing: `--spacing-gap` is one responsive unit, 1rem, then 1.5rem from `md` and 2rem from `lg`. It gives `p-gap`, `m-gap`, `gap-gap`, `size-gap` and the rest, plus `2gap` and `3gap` multiples (`p-2gap`, `mt-3gap`). Use it for the padding of panels and the gutters between them so the whole page loosens together on wider screens.

Override in the app's stylesheet, after the nui import:

```css
@theme {
  --color-primary: oklch(0.6 0.2 30);
  --color-primary-foreground: white;
}
:root { --radius: 9999px; }   /* one knob for corner radius: 0 = square, 9999px = pill */
```

## Scheme regions

The page follows the OS. To pin it, set `data-theme="light"` or `data-theme="dark"` on `<html>`.

| Class | Effect on its subtree |
|-------|-----------------------|
| `light` | always light |
| `dark` | always dark |
| `inverse` | the opposite of the nearest region above it, at any nesting depth |

Regions paint their own background and text colour. Use `inverse` for things like a dark footer on a light site that should become light when the site is dark.

Tailwind's `dark:` variant follows the OS media query and ignores these regions. Prefer the tokens. If an app really needs `dark:` to follow regions, add to its stylesheet:

```css
@custom-variant dark (@container style(--scheme: dark));
```

## Demo

Run `npm run dev` inside the nui package to browse every component with a theme and radius switcher.
