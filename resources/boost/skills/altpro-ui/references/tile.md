# Tile: `.tile`

A `<label>` drawn as a card round one checkbox or radio, for a choice that needs a sentence or a picture to explain it: a delivery option, a plan, a role, a colour scheme. The whole tile is the click target. The input stays visible, styled by [`.checkbox` or `.radio`](check.md), so a reader can tell "pick one" from "pick any", and forced colours still show which is chosen.

```html
<fieldset class="field">
  <legend>Roles</legend>
  <div class="grid gap-3 sm:grid-cols-2">
    <label class="tile">
      <input class="checkbox" type="checkbox" name="roles[]" value="viewer" checked>
      <span class="grid gap-0.5"><span class="font-medium">Viewer</span><span class="muted">Sees products and orders.</span></span>
    </label>
    <label class="tile">
      <input class="checkbox" type="checkbox" name="roles[]" value="editor">
      <span class="grid gap-0.5"><span class="font-medium">Editor</span><span class="muted">Changes products, prices and stock.</span></span>
    </label>
  </div>
</fieldset>
```

| Kind | Classes / attributes |
|------|----------------------|
| Input | One `<input class="checkbox">` or `<input class="radio">` inside the label, first by default; any size from check.md (`radio sm`). |
| State | `checked` draws the edge in the accent and tints the tile; `disabled` fades the whole tile. |
| Invalid | `aria-invalid="true"` on the input, or native validation failing after interaction outside a `novalidate` form. The edge and ring turn red. |
| Layout | A row by default, the input on the first line of text. `flex-col` stacks it: put a picture first and the input with its words below. |

- The group is a `<fieldset class="field">` with a `<legend>`, and `.hint` or `.error` under the tiles as for any field; point `aria-describedby` on every input at the message. A `disabled` fieldset disables every tile.
- Put the tiles in a grid (`grid gap-3`), with columns from the page's container (`@xl/page:grid-cols-2`) so they fold on a phone.
- The tile is the focus ring, not the input: Tab lands on the input and the tile draws the 3px ring round itself.
- A picture or preview inside is `aria-hidden="true"`. The label's words name the choice.
- Don't hide the input to make a picture-only tile: a reader then can't tell one choice from several, and forced colours lose the checked state, which the tile draws as a coloured edge and tint.
- A few short options in a row are a [segmented control](segmented.md), and a plain list of options is `.checkbox` or `.radio` labels. A tile earns its size with a description or a picture.
- The accent is `--tile-accent`, primary by default. Pair it with the input's `--check-accent` if you change one: `[--tile-accent:var(--color-success)] [--check-accent:var(--color-success)]`.

Custom properties: `--tile-accent --tile-border --tile-ring --tile-bg --tile-fg --tile-p --tile-gap --tile-radius`.

## A picture first

```html
<fieldset class="field">
  <legend>Colour scheme</legend>
  <div class="grid grid-cols-2 gap-3 @xl/page:grid-cols-3">
    <label class="tile flex-col">
      <span class="dark block aspect-[4/3] w-full rounded-md border border-border" aria-hidden="true"><!-- preview --></span>
      <span class="flex items-start gap-2"><input class="radio sm" type="radio" name="scheme" value="dark"> Dark</span>
    </label>
    <!-- one per option -->
  </div>
</fieldset>
```
