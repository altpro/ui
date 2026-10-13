# Button: `.btn`

Works on `<button>`, `<a>`, `<input type="submit">`.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias of `danger`). No colour = neutral grey. |
| Style | `outlined` (transparent fill, coloured border and text), `ghost` (transparent, coloured text, no border) |
| Size | `xs` `sm` `lg` `xl`. No size = default (2.25rem tall). |
| Toggle | `<label class="btn outlined"><input type="checkbox"> Bold</label>`. The input is hidden over the label and the label takes the solid fill while checked. See [segmented.md](segmented.md). |
| State | Use the native `disabled` attribute on buttons. A disabled link has no `href` and uses `role="link"` with `aria-disabled="true"`; if an app must retain its `href`, the app must also cancel activation. `loading` draws a spinner; pair it with `disabled` and `aria-busy="true"`, and keep the label (`Save`, not `Saving`): the spinner and `aria-busy` say it is working, and a stable label neither changes the button's width nor gets announced again. Focus rings appear on keyboard focus only. |

Icons: put a Lucide icon inside the button, `size-4` and `aria-hidden="true"`. The button has `gap-2` built in.

```vue
<button class="btn primary">
  <Plus class="size-4" aria-hidden="true" />
  New item
</button>
```

Custom properties every button reads. Set them on `.btn` in the app stylesheet for a global change, or inline for one element.

```
--btn-bg  --btn-fg  --btn-accent  --btn-outline  --btn-hover  --btn-radius  --btn-h  --btn-px  --btn-text
```
