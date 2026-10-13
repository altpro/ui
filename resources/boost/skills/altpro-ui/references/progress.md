# Progress and meter: `.progress` `.meter`

Native `<progress>` and `<meter>`, restyled. The browser owns the value and announces it, so no ARIA beyond a name. Both share one set of custom properties.

```html
<div class="field">
  <label for="upload" class="flex justify-between">Uploading <output for="upload">45%</output></label>
  <progress class="progress" id="upload" value="45" max="100"></progress>
</div>

<progress class="progress" aria-label="Loading"></progress>

<meter class="meter" value="45" min="0" max="64" low="32" high="52" optimum="0" aria-label="Disk used"></meter>
```

| Kind | Classes / attributes |
|------|----------------------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). No colour = primary for a progress; the band colour for a meter. |
| Size | `sm` (0.25rem), `lg` (0.75rem). No size = 0.5rem tall. |
| Indeterminate | A `<progress>` with no `value` sweeps a stripe along the track. Still under `prefers-reduced-motion`. |
| Meter bands | `low`, `high` and `optimum` place the value in a band. Optimum band is success, the next is warning, the furthest is danger. `optimum="0"` means low is good (disk used); `optimum` equal to `max` means high is good (battery). A colour word pins one colour instead. |

- Name it: `<label for>` or `aria-label`. Put the number in an `<output for>` inside the label so sighted users see it too.
- Width is the container's. Use `w-48`, `max-w-md` or a grid column.
- Works inside `.field` and `.card`; a `label class="flex justify-between"` puts the value on the right.

Custom properties, shared by both: `--progress-bg --progress-fg --progress-h --progress-radius`. A `.meter` adds `--progress-warn` and `--progress-danger` for its warning and danger bands; `--progress-fg` is its optimum band.
