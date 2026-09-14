---
name: nui
description: Use nui component classes (btn, and more as they land) when writing HTML in a project that imports "nui". Covers class composition, colour and size modifiers, theme tokens, and light/dark scheme regions.
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

Wraps buttons (and, later, inputs) into one bar. The radius moves to the group. A one pixel line divides members.

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

## Theme tokens

All colours are Tailwind theme variables, so `bg-primary`, `text-muted-foreground`, `border-border` and the rest exist as utilities. Each `X` has an `X-foreground` for text placed on it.

```
background  foreground
card        card-foreground
muted       muted-foreground
border      ring
primary     secondary  info  success  warning  danger   (each with -foreground)
```

Every token is `light-dark()`, so the same class is correct in both schemes. Do not write `dark:` variants for these colours.

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
