# Breadcrumb: `.breadcrumb`

The path to the current page. Put it on a `<nav>` with `aria-label="Breadcrumb"`. Children are styled by element; chevrons are drawn in CSS, so there is no separator markup.

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
  <span aria-current="page">Breadcrumb</span>
</nav>
```

| Child | Role |
|-------|------|
| `<a>` | A link, muted, full-strength on hover. |
| `<span aria-current="page">` | The current page, full-strength text, not a link. |
| `<button>` | Looks like a link. For collapsed levels: give it `aria-label`, `popovertarget`, an ellipsis icon, and put a `.dropdown` holding a `.nav` of the hidden links straight after it. |
| `<ol>` `<li>` | Optional list markup, flattened away. Renders the same as bare children. |

- An icon-only link (a house for home) needs `aria-label`. Icons are `size-4`.
- One row. A path wider than its container scrolls sideways; it never wraps.
- Text is `text-sm`; each link is at least 24px tall.

Custom properties: `--breadcrumb-fg --breadcrumb-active-fg --breadcrumb-gap --breadcrumb-text`.

## Where it goes in an app

Only on a page reached from another (a record's edit page, a create page, a record's sub-page), as the first line of the page's heading block, directly above the `h1`. Never in the app's top bar, and not on a page the main nav links to (a list, the dashboard, a settings tab), which the nav already marks. The trail is the list, then any parent record, then this page, whose `<span aria-current="page">` repeats the `h1`'s words. The list's link is the list as it was left, with its search, filters and page ([recipes.md](recipes.md#1-edit-page)).

### In an Inertia app: `PageBreadcrumb.vue`

```vue
<script setup>
import PageBreadcrumb from "@ui/PageBreadcrumb.vue";
</script>

<template>
  <div class="flex flex-col gap-1">
    <PageBreadcrumb :items="[{ label: 'Products', href: listHref }, { label: product.name }]" />
    <h1 tabindex="-1" class="text-2xl font-semibold tracking-tight wrap-anywhere">{{ product.name }}</h1>
  </div>
</template>
```

- `items` is `[{ label, href }]`; the last is this page and its `href` is not used. An earlier item with no `href` (a level with no page) shows as text. Links are Inertia's `Link`, so `href` takes a URL or a Wayfinder route.
- [`PageHeading`](page-heading.md) draws it from its `breadcrumb` prop, with the `h1` under it; use that.
- `print:hidden`: a printed page needs no way back.
