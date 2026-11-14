# Page heading: `PageHeading.vue`

The top of an app page, for Inertia apps: the breadcrumb on a page reached from another, the page's one `h1`, what sits before it (an avatar) and beside it (status badges), the lines under it, and the page's actions. The `h1` has `tabindex="-1"` and a focus ring, so the [app shell](app-shell.md)'s layout can move focus to it after a visit. A list page's title row is [`ListHeader.vue`](list-header.md), which is this with a count line and status cards.

```vue
<script setup>
import { Link } from "@inertiajs/vue3";
import { Upload } from "@lucide/vue";
import LocalDate from "@ui/LocalDate.vue";
import PageHeading from "@ui/PageHeading.vue";
</script>

<template>
  <PageHeading :title="product.name" :breadcrumb="[{ label: 'Products', href: listHref }, { label: product.name }]">
    <template #badges><span class="badge soft success dot">Active</span></template>
    <p class="mt-1 text-sm muted">SKU {{ product.sku }} · Updated <LocalDate :value="product.updated_at" in-sentence /></p>
    <template #actions>
      <Link :href="`/products/${product.id}/media`" class="btn outlined"><Upload class="size-4" aria-hidden="true" /> Tags and photos</Link>
    </template>
  </PageHeading>
</template>
```

| Prop or slot | What |
|--------------|------|
| `title` | The `h1`. On a page the nav links to, the nav item's label ("Products", "Settings"). On a record, the record's name: it wraps anywhere, as a name can be one long word. |
| `breadcrumb` | `[{ label, href }]`, the list then this page, drawn by [`PageBreadcrumb`](breadcrumb.md#in-an-inertia-app-pagebreadcrumbvue) as the first line, above the `h1`. Only on a page reached from another; leave it out on a page the nav links to. |
| `#before` | Before the title, centred on it: a person's [`UserAvatar`](avatar.md#a-person-useravatarvue) at `size="lg"`. |
| `#badges` | Beside the `h1`, wrapping under it when the name is long: the record's status badge, "You" on your own record. |
| default | Under the title: one muted facts line (`<p class="mt-1 text-sm muted">`), or a list's count line. |
| `#actions` | The page's actions, at the far end while there is room and under the title, each filling the row, on a phone. Two or three at most; see [record-header.md](record-header.md). |

- One `PageHeading` per page, so one `h1`. Its words are the `<Head title>`, and on a deeper page the breadcrumb's last item.
- The `h1` is the target of the layout's focus after a visit: a screen reader starts at the page's name and Tab goes on into the page. A page with its own `h1` instead gives it the same `tabindex="-1"` and focus classes: `text-2xl font-semibold tracking-tight wrap-anywhere focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring/50`.
- The breadcrumb is never in the app's top bar. A page the nav links to (a list, the dashboard, a settings tab) has none; a page reached from a list (create, edit, a record's sub-page) has the list, then any parent record, then itself. The list's link is the list as it was left: see [recipes.md](recipes.md#1-edit-page).
- It measures nothing itself; put it straight in the [page frame](app-shell.md), first.
