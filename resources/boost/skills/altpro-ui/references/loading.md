# Loading: `.skeleton` `.spinner`

Skeleton: a muted block the shape of the content that has not arrived. 1em tall by default; size and round it with utilities. It shimmers unless motion is reduced. Give the region it fills `aria-busy="true"` and one `sr-only` "Loading".

```html
<div class="card" aria-busy="true">
  <span class="sr-only">Loading</span>
  <div class="flex items-center gap-3">
    <div class="skeleton size-10 rounded-full"></div>
    <div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/5"></div><div class="skeleton h-3 w-1/4"></div></div>
  </div>
</div>
```

Spinner: a turning ring in `currentColor`, so `text-primary` colours it. It says nothing on its own: give it `role="status"` and `sr-only` text, or put it beside visible text.

```html
<span class="spinner" role="status"><span class="sr-only">Loading</span></span>
<p class="flex items-center gap-2" role="status"><span class="spinner sm"></span>Saving changes</p>
<button class="btn primary loading" disabled aria-busy="true">Saving</button>
```

| Kind | Classes |
|------|---------|
| Spinner size | `xs` `sm` `lg` `xl`. No size = 1.25rem. |
| Button | `loading` on `.btn`, see [button.md](button.md). |

- Match skeleton sizes to the real content (`h-9` for a `text-3xl` number) so nothing moves when data lands. In a table, one skeleton per cell for as many rows as usual.
- Reduced motion: the skeleton stops shimmering; the spinner keeps turning at a third of the speed, since it is the signal itself.

Custom properties: `--skeleton-bg --skeleton-shine --skeleton-radius`, `--spinner-size --spinner-width`.
