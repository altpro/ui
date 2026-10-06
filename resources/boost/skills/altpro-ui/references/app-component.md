# An app's own component (pattern)

When the app needs a component altpro/ui does not have, add it to the app's CSS the way the library writes its own, so it composes, themes and scales like the rest. First check the Components table in SKILL.md: a variation of an existing component is a utility or a custom property on it (`[--card-p:0.75rem]`, `[--check-accent:var(--color-success)]`), not a new component.

The worked example is a tile: a radio or checkbox drawn as a selectable card, for a delivery option or a plan.

```css
/* resources/css/components/tile.css */
@layer components {
  .tile {
    --tile-accent: var(--color-primary);
    --tile-border: var(--color-border);
    --tile-p: 1rem;
    --tile-radius: min(var(--radius), 1rem);
    --join-divider: var(--tile-border);

    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-height: 1.5rem;
    padding: var(--tile-p);
    border: 1px solid var(--tile-border);
    border-radius: var(--tile-radius);
    background: var(--color-card);
    color: var(--color-card-foreground);
    font-size: var(--text-sm, 0.875rem);
    line-height: 1.25;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;

    /* the input covers the tile: it is the click target and the focus stop */
    > input {
      position: absolute;
      inset: 0;
      margin: 0;
      opacity: 0;
      appearance: none;
      cursor: pointer;
    }

    &:hover {
      --tile-border: color-mix(in oklab, var(--tile-accent) 50%, var(--color-border));
    }
    /* checked: a 2px edge in the accent, so the state is not colour alone */
    &:has(> input:checked) {
      --tile-border: var(--tile-accent);
      box-shadow: inset 0 0 0 1px var(--tile-accent);
    }
    &:has(> input:disabled) {
      opacity: 0.5;
      pointer-events: none;
    }
    /* after checked, so the ring colour wins the border */
    &:has(> input:focus-visible) {
      border-color: var(--color-ring);
      outline: 3px solid color-mix(in oklab, var(--color-ring) 50%, transparent);
      outline-offset: 0;
    }

    /* colour variants set vars only */
    &.success { --tile-accent: var(--color-success); }
    &.danger { --tile-accent: var(--color-danger); }

    /* sizes set the size var only */
    &.sm { --tile-p: 0.75rem; }
    &.lg { --tile-p: 1.5rem; }
  }
}
```

Import it in `resources/css/app.css`, after the altpro/ui import:

```css
@import "./components/tile.css";
```

```html
<fieldset class="field">
  <legend>Delivery</legend>
  <div class="grid gap-3 sm:grid-cols-3">
    <label class="tile">
      <input type="radio" name="delivery" value="standard" checked>
      <strong class="font-semibold">Standard</strong>
      <span class="muted">3 to 5 working days · Free</span>
    </label>
    <label class="tile">
      <input type="radio" name="delivery" value="next-day">
      <strong class="font-semibold">Next day</strong>
      <span class="muted">Order by 2pm · £4.95</span>
    </label>
    <label class="tile">
      <input type="radio" name="delivery" value="collect" disabled>
      <strong class="font-semibold">Collect</strong>
      <span class="muted">Not available for this order</span>
    </label>
  </div>
</fieldset>

<div class="join w-full">
  <label class="tile sm flex-1"><input type="radio" name="plan" value="free" checked> Free</label>
  <label class="tile sm flex-1"><input type="radio" name="plan" value="team"> Team</label>
</div>
```

The rules, the same ones the library follows:

- **Name**: one bare word that is neither an altpro/ui class nor a Tailwind utility. `flex`, `table`, `hidden`, `collapse`, `invert`, `contrast` and the `select-*` family are taken.
- **Modifiers** are bare words nested under the base class (`.tile.danger`), never global and never hyphenated (`tile-danger`). Reuse the library's words: `primary` `secondary` `info` `success` `warning` `danger` for colour, `outlined` `ghost` for style, `xs` `sm` `lg` `xl` for size.
- **`@layer components`**, one nested block, so Tailwind utilities on the element still win.
- **Colours from tokens only**: `var(--color-…)`, never a literal. A colour the theme lacks becomes a token in `@theme`, written with `light-dark()` as in SKILL.md.
- **Custom properties carry the look.** The base sets `--tile-*`; a colour variant sets only those vars; a style modifier sets real properties from them; a size sets only the size vars. Class order then never matters, and a page can tune one with `[--tile-p:2rem]`.
- **Radius** comes from `--radius`, capped with `min(var(--radius), 1rem)` on anything taller than a control, so the square and pill themes reach it.
- **Join**: anything that can sit in a `.join` sets `--join-divider` to its border colour. The join does the rest.
- **Focus**: on `:focus-visible`, or `:has(:focus-visible)` when the element wraps its control, the border turns `var(--color-ring)` with a 3px outline of the ring at 50%, offset 0, as above.
- **Contrast**, in light and dark: 4.5:1 for text on every fill, including hover and the outlined and ghost styles; 3:1 for a border or edge that shows state. A `warning` accent used as text or a border needs darkening on a light page, as `.btn` does: `light-dark(oklch(from var(--color-warning) 0.5 c h), var(--color-warning))`.
- **Targets** are at least 24px in each direction.
- **Native HTML first**, and no JavaScript in the CSS file. If the component needs behaviour, write a Vue component in `resources/js/Components/` that renders this markup.

Check it in both schemes (`data-theme="light"` and `"dark"` on `<html>`) and with `:root { --radius: 0 }` and `9999px`.
