# Range: `.range`

A restyled native `<input type="range">`. Keyboard, touch and `step` come from the browser.

```html
<div class="field">
  <label for="volume" class="flex justify-between">Volume <output for="volume">40</output></label>
  <input class="range" id="volume" type="range" min="0" max="100" value="40"
         oninput="this.previousElementSibling.lastElementChild.value = this.value">
</div>
```

| Kind | Classes / attributes |
|------|----------------------|
| Size | `sm`, `lg`. No size = 0.5rem track, 1.25rem thumb. |
| State | `disabled`. Focus ring on the thumb. |

- The input is at least 1.5rem tall, so the whole strip is a 24px target.
- CSS cannot read the value, so an `<output>` needs the one-line `oninput` above.
- No filled track left of the thumb, and `<datalist>` ticks are not drawn. The thumb is `--range-accent`; `[--range-accent:var(--color-success)]` for a green one.

Custom properties: `--range-track --range-accent --range-ring --range-h --range-thumb --range-radius`.
