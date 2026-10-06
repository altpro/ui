# Segmented control (pattern)

No class. A `.join` of `label.btn`, each wrapping a radio with the same `name`. The checked label takes the solid look. No script: arrow keys move between the radios and a form submits the value.

```html
<div class="join" role="radiogroup" aria-label="Sort">
  <label class="btn outlined"><input type="radio" name="sort" checked> Newest</label>
  <label class="btn outlined"><input type="radio" name="sort"> Oldest</label>
  <label class="btn outlined"><input type="radio" name="sort"> Top</label>
</div>
```

- Members are `outlined` or `ghost`, in any colour and size, so the checked one has somewhere to go. `outlined primary` fills primary when checked; plain `outlined` fills muted.
- The group is `role="radiogroup"` with an `aria-label`, or the `.join` sits in a `<fieldset class="field">` with a `<legend>`.
- Checkboxes instead of radios make a multi-select group (bold, italic, underline). Then it is `role="group"`.
- An icon-only member puts `aria-label` on the input, not the label.
- `disabled` on an input dims its label. `flex w-full` on the group and `flex-1` on members fills a column.
- Two options with a single on and off meaning are a `.switch`, not a segmented control.
