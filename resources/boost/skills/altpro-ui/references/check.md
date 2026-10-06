# Checkbox, radio, switch: `.checkbox` `.radio` `.switch`

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
