# Input: `.input`

One class for every text-like control: `<input>` of any text type, `<select>`, `<textarea>`. Not for checkboxes or radios. On its own it needs a name: a `<label for>` or an `aria-label`.

| Kind | Classes / attributes |
|------|----------------------|
| Size | `xs` `sm` `lg` `xl`. Heights match `.btn`, so the two line up in a join. |
| Invalid | `aria-invalid="true"`. Also automatic when native validation (`required`, `type="email"`, `pattern`) fails after the user has touched it, except inside a `novalidate` form, where only the server's errors (`aria-invalid`) turn it red. Border and focus ring turn red. |
| State | `disabled`, `readonly`. Focus ring on focus. |

```html
<input class="input" type="search" placeholder="Search" aria-label="Search">
<select class="input sm" aria-label="Sort by"><option>Newest</option></select>
<textarea class="input" rows="3" aria-label="Notes"></textarea>
```

A textarea grows with `rows`; the size is a minimum height. Width is the browser default; use `w-full` or `w-64`.

`<input type="file" class="input">` draws the browser's file button as a muted button inside the border; sizes, invalid and disabled work as above. For a drop zone with a file list, see `FileInput.vue`.

A `<select>` opts into `appearance: base-select` where the browser has it (Chrome 135+). The chevron is a Lucide stroke in muted text, the picker matches `.dropdown`, and `<option>`, `<optgroup>` and its `<legend>` are styled. Other browsers keep their native select.

Addons: put `.input` on a `<label>` wrapping the control. Anything else inside (a `<span>` symbol or unit, a `size-4` svg, a `<kbd>` drawn as a key cap) sits in the same border in muted text, and the focus ring goes round the whole box. Clicking an addon focuses the control. A `<select>` can be a second control inside the wrapper. A button next to an input is a `.join`, not an addon.

```html
<label class="input"><span>£</span><input type="number" aria-label="Price"></label>
<label class="input"><input type="number" aria-label="Weight"><span>kg</span></label>
<div class="join">
  <input class="input sm" type="search" aria-label="Search">
  <button class="btn primary sm">Go</button>
</div>
```

Custom properties: `--input-bg --input-fg --input-border --input-ring --input-radius --input-h --input-px --input-text`.
