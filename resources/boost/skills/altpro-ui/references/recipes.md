# Recipes: whole screens in a Laravel/Inertia app

Three screens built from the documented components, each with the Vue page and what every endpoint must return. Copy them and rename. They share one product record, so together they are a small products area: a list, an edit form, and a tags-and-photos page.

The server side is the app's: its routes, controllers, models and policies follow the app's own conventions, and no recipe gives them. Each recipe gives what the screen needs from the server instead: the props, a table of requests and responses, and the rules a screen breaks without. The list page's index is the exception, as `TableQuery` is this package's.

| Recipe | Chains | Demo page, in the altpro/ui repository |
|--------|--------|-----------|
| [1. Edit page](#1-edit-page) | breadcrumb, record header, `Field`s, save bar; defaults, server errors, save, discard | `demo/app/recipe-product.html` |
| [2. List page](#2-list-page) | title row with count and Clear, status cards that filter, server-mode `DataTable` in a frame with title-link rows, columns that fit, filters in a drawer, `only` and a bulk action | `demo/app/recipe-products.html` |
| [3. Tags and photos](#3-tags-and-photos) | `Combobox` with `src` and `create` endpoints; `FileInput` uploading each file with progress | `demo/app/recipe-media.html` |

The demo pages run this Vue code as written against a stand-in for the server, and `tests/recipes.spec.js` drives them; both are in the altpro/ui repository, not in the installed package. Run `npm run dev` there and open them under Application.

## What the recipes assume

- Inertia 3 with `@inertiajs/vue3`, Laravel with `inertiajs/inertia-laravel`, and the `@ui` alias from SKILL.md's setup.
- Pages resolve from `resources/js/pages/`, so `Inertia::render('products/Edit')` is `resources/js/pages/products/Edit.vue`: lowercase folders, as Laravel's starter kit has them.
- The app shell from [app-shell.md](app-shell.md): its root view (`scroll-pb-28` on `<html>`, the toaster at the top) and `resources/js/layouts/AppLayout.vue`, which each page wraps itself in with its breadcrumb. The layout's `<main>` is the page frame: `p-gap`, which the save bar's `-mx-gap px-gap` matches, `@container/page` for the page's container queries, and a column with `gap-gap` between the page's sections, so a page puts its content straight inside `<AppLayout>`. It draws the only breadcrumb.
- Saves confirm with a toast: the controller calls `Inertia::flash('toast', ['type' => 'success', 'message' => '…'])` and redirects, and `app.js` shows it, as [toast.md](toast.md) sets up.
- Icons are Lucide, from `@lucide/vue`: `<Pencil class="size-4" aria-hidden="true" />`.
- Laravel's default validation messages; the browser tests read them.

The endpoints behind all three, every one behind `auth`:

| Endpoint | Used by |
|----------|---------|
| `GET /products` | the list page |
| `GET /products/create` | Add product, the app's own create page |
| `POST /products/bulk` | the list's bulk action |
| `GET /products/{id}/edit`, `PUT /products/{id}` | the edit page |
| `GET /products/{id}/media`, `PUT /products/{id}/tags` | the tags-and-photos page |
| `POST /products/{id}/photos`, `DELETE /photos/{id}` | each photo, as it is added or removed |
| `GET /tags`, `POST /tags` | the tags combobox |

A product has `id`, `name`, `sku`, `category`, `price`, `stock`, `status`, `description` and `updated_at`; tags and photos belong to it. Every action authorises in its own code, as route model binding finds any record by its id, whoever asks.

## 1. Edit page

Record header, a grid of `Field`s bound to `useForm`, and the save bar, in the layout with its breadcrumb. The form's defaults are the saved record: Discard puts them back, and Inertia makes the saved data the new defaults after a successful save, so `isDirty` goes false by itself. A failed save shows and focuses an error summary ([validation-failure.md](validation-failure.md)), and leaving with unsaved changes asks first ([unsaved-changes.md](unsaved-changes.md)).

```vue
<!-- resources/js/pages/products/Edit.vue -->
<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import { CircleAlert, Upload } from "@lucide/vue";
import Field from "@ui/Field.vue";
import { useUnsavedChanges } from "@ui/useUnsavedChanges";
import AppLayout from "@/layouts/AppLayout.vue";

const props = defineProps({
  product: { type: Object, required: true },
  categories: { type: Array, required: true },
  statuses: { type: Array, required: true },
});

// the defaults are the saved record; Discard goes back to them, and a successful save makes the saved data the new defaults
const form = useForm({
  name: props.product.name,
  sku: props.product.sku,
  category: props.product.category,
  price: props.product.price,
  stock: props.product.stock,
  status: props.product.status,
  description: props.product.description,
});
useUnsavedChanges(form);

// the way back is the list as it was left: its search, filters, sort and page, which the list page keeps for the tab
const listHref = ref("/products");
onMounted(() => {
  try {
    listHref.value += sessionStorage.getItem("products:list-query") ?? "";
  } catch {
    // the list as it starts
  }
});

// a failed save focuses the error summary: it is read out, and Tab goes on to the first field
const summary = ref();
// Save on an unchanged form sends nothing and says so, as Save stays enabled
const unchanged = ref(false);
watch(() => form.isDirty, () => (unchanged.value = false));
const save = () => {
  if (!form.isDirty) return (unchanged.value = true);
  const sent = form.data();
  form.put(`/products/${props.product.id}`, {
    preserveScroll: true,
    // what was sent is what was saved: anything typed while the save was under way stays unsaved
    onSuccess: () => JSON.stringify(form.data()) !== JSON.stringify(sent) && form.defaults(sent),
    onError: () => nextTick(() => summary.value.focus()),
  });
};
const status = computed(() => (form.isDirty ? "Unsaved changes" : unchanged.value ? "No changes to save." : form.recentlySuccessful ? "Saved." : ""));
const discard = () => {
  form.reset();
  form.clearErrors();
};
const statusClass = { Active: "soft success dot", Draft: "soft dot", Archived: "outlined dot" };
const updated = (timestamp) => new Date(timestamp).toLocaleDateString(document.documentElement.lang, { day: "numeric", month: "short", year: "numeric" });
</script>

<template>
  <Head :title="product.name" />
  <AppLayout :breadcrumb="[{ label: 'Products', href: listHref }, { label: product.name }]">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 class="text-2xl font-semibold tracking-tight break-words">{{ product.name }}</h1>
          <span class="badge" :class="statusClass[product.status]">{{ product.status }}</span>
        </div>
        <p class="mt-1 text-sm muted">SKU {{ product.sku }} · {{ product.category }} · Updated <time :datetime="product.updated_at">{{ updated(product.updated_at) }}</time></p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Link :href="`/products/${product.id}/media`" class="btn outlined"><Upload class="size-4" aria-hidden="true" /> Tags and photos</Link>
      </div>
    </div>

    <form class="grid max-w-3xl gap-x-gap gap-y-4 sm:grid-cols-2" novalidate @submit.prevent="save">
      <div v-if="form.hasErrors" ref="summary" class="alert danger col-span-full" role="alert" tabindex="-1">
        <CircleAlert class="size-4" aria-hidden="true" />
        <h2>The product was not saved</h2>
        <ul class="list-disc ps-5">
          <li v-for="(message, field) in form.errors" :key="field">{{ message }}</li>
        </ul>
      </div>
      <Field v-model="form.name" name="name" :errors="form.errors" required class="sm:col-span-2" />
      <Field v-model="form.sku" name="sku" label="SKU" :errors="form.errors" required />
      <Field v-model="form.category" name="category" type="select" :options="categories" :errors="form.errors" required />
      <Field v-model="form.price" name="price" inputmode="decimal" prepend="£" :errors="form.errors" required />
      <Field v-model="form.stock" name="stock" type="number" step="1" min="0" hint="Units on the shelf." :errors="form.errors" required />
      <Field v-model="form.status" name="status" type="select" :options="statuses" :errors="form.errors" />
      <Field v-model="form.description" name="description" type="textarea" rows="4" :errors="form.errors" class="sm:col-span-2" />

      <div class="save-bar col-span-full -mx-gap px-gap">
        <p role="status">{{ status }}</p>
        <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="discard">Discard</button>
        <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
      </div>
    </form>
  </AppLayout>
</template>
```

What the server does:

- `edit` authorises `update` on the product and renders `products/Edit` with `product` (the fields above), `categories` and `statuses`.
- `update` authorises the same, validates, saves, flashes `toast` ("Product saved.") and redirects to the edit page. The rules: `name` required, at most 120; `sku` required, at most 20, unique but for this product; `category` and `status` one of their lists; `price` at least 0 with at most two decimals; `stock` a whole number, at least 0; `description` optional, at most 2000.

What comes back:

| Request | Response | On the page |
|---------|----------|-------------|
| `GET /products/{id}/edit` | Inertia page `products/Edit` with `product`, `categories`, `statuses` | The form, clean. |
| `PUT /products/{id}`, invalid | Laravel redirects back with the errors; Inertia receives the edit page with `errors: { name: "The name field is required.", price: "The price field must be at least 0." }` | The summary lists them and takes focus; each `Field` shows its message and sets `aria-invalid`. The form keeps what was typed (`put` preserves state) and stays dirty. |
| `PUT /products/{id}`, valid | Redirect to the edit page, `errors: {}`, flash `toast` | Errors clear, the header shows the saved name, the status line says "Saved.", the toast shows, Discard disables. |

- `novalidate` lets the server answer every field in one round trip, so the browser's own bubbles never disagree with Laravel's messages. Drop it to get the browser's checks first as well.
- Errors stay until the next response. To clear a field's error as it is fixed, add `@input="form.clearErrors('name')"` to that `Field`.
- Discard is `reset()` then `clearErrors()`: errors belong to values that are no longer there.
- After a valid save the props change under the form. `useForm` ignores that (its defaults came from the save itself), which is why the form is not rebuilt from `product`.

## 2. List page

A list that does more than list: the title row with its count and Clear, a card per status that filters the rows and counts what its link would show, rows whose name is the link to the record, and columns that appear as the page has room for them, with the row folding their facts under the name until it does. It is a server-mode `DataTable`: search, sort, filters and pages come from `TableQuery`, a table change reloads only `products` and `statusCounts`, the filters wait in a drawer, and the selection drives a bulk action. The bulk endpoint gets either ids or, after "Select all N matching", the search and filters the table showed, reads them back with `TableQuery::selection()`, and re-runs them through the same `filter()` and `TableQuery::search()` as the index.

```vue
<!-- resources/js/pages/products/Index.vue -->
<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import { Archive, ChevronRight, CircleCheck, PencilLine, Plus, X } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import { formatCellValue } from "@ui/dataTable";
import type { DataListSortOption, DataTableColumn, DataTableFilter, DataTablePaginated, DataTableSelection } from "@ui/dataTable";
import AppLayout from "@/layouts/AppLayout.vue";

type Status = "Active" | "Draft" | "Archived";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: Status;
  updated_at: string;
}

defineProps<{
  products: DataTablePaginated<Product>;
  filters: DataTableFilter<Product>[];
  unfilteredTotal: number;
  statusCounts: Record<Status, number>;
}>();

// A column shows once the page has room for it beside the name's 16rem; below that, the name's cell folds its facts under it
const wide = "@max-4xl/page:hidden";
const widest = "@max-5xl/page:hidden";

const columns: DataTableColumn<Product>[] = [
  { key: "name", label: "Name", sortable: true, hideable: false },
  { key: "category", label: "Category", sortable: true, hideable: false, thClass: `${wide} @4xl/page:w-36`, tdClass: wide },
  { key: "status", label: "Status", hideable: false, thClass: `${wide} @4xl/page:w-30`, tdClass: wide },
  { key: "stock", label: "Stock", sortable: true, hideable: false, thClass: `${wide} @4xl/page:w-32 text-right`, tdClass: `${wide} text-right tabular-nums` },
  { key: "price", label: "Price", sortable: true, hideable: false, format: "currency", thClass: `${wide} @4xl/page:w-26 text-right`, tdClass: `${wide} text-right tabular-nums` },
  { key: "updated_at", label: "Updated", sortable: true, hideable: false, format: "date", thClass: `${widest} @5xl/page:w-34`, tdClass: `${widest} whitespace-nowrap` },
  { key: "open", label: "Open", srOnlyLabel: true, virtual: true, thClass: "w-10" },
];

// the headers sort once Updated, the last of them, has room; until then this select does
const sortOptions: DataListSortOption[] = [
  { key: "name", direction: "asc", label: "Name, A to Z" },
  { key: "name", direction: "desc", label: "Name, Z to A" },
  { key: "price", direction: "asc", label: "Price, low to high" },
  { key: "price", direction: "desc", label: "Price, high to low" },
  { key: "stock", direction: "asc", label: "Stock, lowest first" },
  { key: "updated_at", direction: "desc", label: "Updated, newest first" },
];

const statuses: Status[] = ["Active", "Draft", "Archived"];
const statusClass: Record<Status, string> = { Active: "soft success dot", Draft: "soft dot", Archived: "outlined dot" };
const statusIcon = { Active: CircleCheck, Draft: PencilLine, Archived: Archive };
const statusHue: Record<Status, string> = { Active: "green", Draft: "", Archived: "" };
const only = ["products", "statusCounts"];

// the edit page's way back returns to the list as it was left: its search, filters, sort and page
const rememberList = () => {
  try {
    sessionStorage.setItem("products:list-query", location.search);
  } catch {
    // the way back is then the list as it starts
  }
};

// the selection is ids, or the search and filters behind "Select all N matching": the server runs either
const archive = (selection: DataTableSelection, clear: () => void) =>
  router.post("/products/bulk", { action: "archive", selection }, { preserveScroll: true, onSuccess: clear });
</script>

<template>
  <Head title="Products" />
  <AppLayout :breadcrumb="[{ label: 'Products' }]">
    <DataTable caption="Products" class="framed" table-class="table-fixed" :columns="columns" :rows="products" :filters="filters"
        :unfiltered-total="unfilteredTotal" :only="only" sort="name" :per-page="10" selectable filter-display="drawer"
        :sort-options="sortOptions" sort-select-class="@5xl/page:hidden" search-placeholder="Search name or SKU"
        empty-message="No products yet." no-matches-message="No products match.">
      <template #header="{ total, unfilteredTotal: all, narrowed, clear, values, filterLink }">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
            <div class="mt-1 flex min-h-8 items-center gap-2 text-sm muted">
              <p>{{ narrowed ? `${total} of ${all}` : all }} {{ all === 1 ? "product" : "products" }}</p>
              <button v-if="narrowed" type="button" class="btn ghost sm" @click="clear">Clear</button>
            </div>
          </div>
          <Link href="/products/create" class="btn primary max-md:w-full" @click="rememberList"><Plus class="size-4" aria-hidden="true" /> Add product</Link>
        </div>

        <!-- each card counts the rows its link shows: the search and category apply, its own status replaces any other -->
        <nav class="grid grid-cols-3 gap-gap" aria-label="Filter by status">
          <a v-for="status in statuses" :key="status" v-bind="filterLink('status', values.status?.[0] === status ? [] : [status])"
              :aria-current="values.status?.[0] === status ? 'true' : undefined"
              class="card group flex-row items-center gap-3 transition-colors hover:border-input focus-visible:outline-3 focus-visible:outline-ring/50 aria-[current=true]:bg-secondary aria-[current=true]:text-secondary-foreground">
            <span class="avatar max-md:hidden" :class="statusHue[status]" aria-hidden="true"><component :is="statusIcon[status]" class="size-4" /></span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm muted group-aria-[current=true]:text-secondary-foreground">{{ status }}</span>
              <span class="block text-2xl font-semibold tracking-tight tabular-nums">{{ statusCounts[status] }}</span>
            </span>
            <!-- the current card takes its status off again, without opening the filters -->
            <span v-if="values.status?.[0] === status" class="sr-only">, remove this filter</span>
            <component :is="values.status?.[0] === status ? X : ChevronRight" class="size-4 shrink-0 muted group-aria-[current=true]:text-secondary-foreground" aria-hidden="true" />
          </a>
        </nav>
      </template>

      <template #cell-name="{ row }">
        <Link :href="`/products/${row.id}/edit`" class="font-medium wrap-anywhere after:absolute after:inset-0 hover:underline focus-visible:underline focus-visible:outline-3 focus-visible:outline-ring/50" @click="rememberList">{{ row.name }}</Link>
        <p class="text-sm muted [font-feature-settings:'case']">{{ row.sku }}<span class="@4xl/page:hidden"> · {{ row.category }}</span></p>
        <!-- until the columns have room -->
        <p class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm @4xl/page:hidden">
          <span class="badge sm" :class="statusClass[row.status]">{{ row.status }}</span>
          <span class="tabular-nums">{{ formatCellValue(row.price, "currency") }}</span>
          <span v-if="row.stock === 0" class="badge sm soft danger">Out of stock</span>
          <span v-else class="muted">{{ row.stock }} in stock</span>
        </p>
      </template>
      <template #cell-status="{ row }">
        <span class="badge sm" :class="statusClass[row.status]">{{ row.status }}</span>
      </template>
      <template #cell-stock="{ row }">
        <span v-if="row.stock === 0" class="badge sm soft danger">Out of stock</span>
        <template v-else>{{ row.stock }}</template>
      </template>
      <template #cell-open>
        <ChevronRight class="ms-auto block size-4 muted" aria-hidden="true" />
      </template>
      <template #bulk-actions="{ selection, clear }">
        <button type="button" class="btn outlined sm" @click="archive(selection, clear)"><Archive class="size-4" aria-hidden="true" /> Archive</button>
      </template>
    </DataTable>
  </AppLayout>
</template>
```

```php
// app/Http/Controllers/ProductController.php: the index; the rest of the controller is the app's
namespace App\Http\Controllers;

use Altpro\Ui\TableQuery;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const SEARCHABLE = ['name', 'sku'];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $filters = $this->filters();
        $values = TableQuery::filters($request, $filters);
        $query = $this->filter(Product::visibleTo($request->user()), $values)
            ->select('id', 'name', 'sku', 'category', 'price', 'stock', 'status', 'updated_at');

        // closures, so a table change (`only: ['products']`) runs the table's query and nothing else
        return Inertia::render('products/Index', [
            'products' => fn () => TableQuery::paginate($query, $request,
                searchable: self::SEARCHABLE,
                sortable: ['name', 'sku', 'category', 'price', 'stock', 'updated_at'],
                defaultSort: 'name',
                perPage: 10,
            ),
            'filters' => $filters,
            'unfilteredTotal' => fn () => Product::visibleTo($request->user())->count(),
            'statusCounts' => fn () => $this->statusCounts($request, $values),
        ]);
    }

    /**
     * Each status card's count: the search and the other filters, with no status, so a card reading 4 leads to 4 rows.
     *
     * @param  array<string, array<int, string>>  $values
     * @return array<string, int>
     */
    private function statusCounts(Request $request, array $values): array
    {
        $query = $this->filter(Product::visibleTo($request->user()), [...$values, 'status' => []]);
        TableQuery::search($query, self::SEARCHABLE, TableQuery::view($request)['search']);
        $counts = $query->toBase()->selectRaw('status, count(*) as aggregate')->groupBy('status')->pluck('aggregate', 'status');

        return array_map(fn (string $status): int => (int) ($counts[$status] ?? 0), array_combine(Product::STATUSES, Product::STATUSES));
    }

    /**
     * Declared once: DataTable's `filters` prop, and what TableQuery::filters() reads.
     *
     * @return list<array<string, mixed>>
     */
    private function filters(): array
    {
        // Product::STATUSES and Product::CATEGORIES are the app's lists of allowed values
        $options = fn (array $values) => array_map(fn ($v) => ['value' => $v, 'label' => $v], $values);

        return [
            ['key' => 'status', 'label' => 'Status', 'type' => 'select', 'options' => $options(Product::STATUSES)],
            ['key' => 'category', 'label' => 'Category', 'type' => 'multiple', 'options' => $options(Product::CATEGORIES)],
        ];
    }

    /**
     * What each filter means, for the index and for the bulk action over everything matching.
     *
     * @param  Builder<Product>  $query
     * @param  array<string, array<int, string>>  $values
     * @return Builder<Product>
     */
    private function filter(Builder $query, array $values): Builder
    {
        return $query
            ->when($values['status'] ?? [], fn ($q, $status) => $q->where('status', $status[0]))
            ->when($values['category'] ?? [], fn ($q, $categories) => $q->whereIn('category', $categories));
    }
}
```

What comes back:

| Request | Response |
|---------|----------|
| `GET /products?search=loop&status=Active&category[]=Turntables&sort=price&dir=desc&page=2&per_page=25` | Inertia page `products/Index`. `products` is the paginator: `{ data: [{ id, name, sku, … }], current_page, last_page, per_page, total, from, to, … }`; `filters` the array above; `unfilteredTotal` a number; `statusCounts` `{ Active: 2, Draft: 1, Archived: 0 }`, here the products matching "loop" in Turntables, whatever their status. |
| The same, from a table change or a status card | DataTable sends `only: ['products', 'statusCounts']`, so the response carries those two and the closures for the rest never run. |
| `POST /products/bulk` with `{ action: "archive", selection: { mode: "ids", ids: [2, 9] } }` | Redirect back to the list URL it came from, flash `toast` "2 products archived.". |
| `POST /products/bulk` with `{ action: "archive", selection: { mode: "matching", search: "", filters: { status: [], category: ["Speakers"] }, count: 5 } }` | The same, over every product the query matches now. `count` is what the table saw; the server counts again. |
| `POST /products/bulk` from a user who is not a manager | `403`, and nothing changes. |

- `defaultSort` and `perPage` match the component's `sort` and `:per-page`, so a bare URL and the header agree. `sortable` is the allow-list for `order by`, and holds every key the column headers and `sortOptions` sort by.
- `statusCounts` starts from the same `Product::visibleTo()`, `filter()` and search as the rows, with the status filter left out, so each card counts the rows its link would show. A search for "loop" makes the cards count loop products.
- The `#header` slot holds the title row and the cards, above the toolbar. It gets the count (`total` of `unfilteredTotal`), whether anything narrows the list, `clear`, the filters as last asked for (`values`), and `filterLink(key, values)`, which a card binds with `v-bind` on its `<a>`: the link is the list with that status, for a new tab, and a plain click changes the filter as the drawer would. With a header the empty table drops its own Clear filters, as the one under the title does the job. The current card takes its status off again, so the filter needs no trip to the drawer.
- A column takes the same container query on its `thClass` and `tdClass`, and the name cell shows what the hidden columns would with the opposite one (`@4xl/page:hidden`). `table-class="table-fixed"` with a width on each `th` keeps the columns still as the rows change, and `hideable: false` leaves out the Columns menu, as the page decides what fits. Until the last sortable header appears, `sort-options` puts a sort select in the toolbar, and `sort-select-class` hides it from there on.
- The row's name is its link, stretched over the row with `after:absolute after:inset-0`; DataTable positions each row and keeps the checkbox above the link. The chevron says the row opens. A click stores the list's query for the tab, which the edit and tags-and-photos pages read for their breadcrumb, so the way back is the list as it was left.
- `framed` draws the table in a card. On a phone the search takes the toolbar's first row, and the Filters button and the sort select share the next.
- Add product goes to the app's create page, which no recipe gives: recipe 1's form with empty defaults, posting to `POST /products`.
- The bulk action authorises (`archive` here, whether this user may archive at all), validates `action`, `selection.mode` and the ids, and starts from the same `Product::visibleTo()` as the index. For `ids` it takes those ids. For `matching` it reads the search and filters with `TableQuery::selection($request, $this->filters())`, which returns `['search' => …, 'filters' => …]`, runs `filter()` with the filters and `TableQuery::search()` with `self::SEARCHABLE` and the search, and the one `filter()` serves the index and the bulk action. It updates, flashes `toast` ("2 products archived.") and returns `back()`.
- Read `selection.search` and `selection.filters` only through `TableQuery::selection()`, never straight from the request. It checks the body as `TableQuery::filters()` checks the URL, so a nested array, a NUL byte or invalid UTF-8 in it reads as absent instead of reaching the database as a 500, and an empty search, which Laravel turns into null, reads as no search. Do not also check filter values against their options: a daterange or boolean has none, and the index does not either.
- `onSuccess: clear` empties the selection once the server has answered. The page's new props show the archived rows; the rows that no longer match a filter drop out.
- A destructive bulk action (delete) asks first: a `.dialog` that says how many, built as [destructive-action.md](destructive-action.md) builds one.
- `Product::visibleTo()`, the app's scope for the products this user may see, starts the index, its count and the bulk action. The endpoint takes whatever ids and filters it is sent, so a bulk query starting from `Product::query()` would reach rows the list never showed.

## 3. Tags and photos

Two ways to send data from one page. Tags are an ordinary form: `Field type="combobox"` searches `GET /tags`, creates through `POST /tags`, and Save submits the ids. Photos upload as they are added, one `useHttp` request per file, so each file has its own progress bar and its own errors, and removing a file cancels its upload or deletes it on the server. A file removed after its last byte has gone may already be stored, so it is deleted once the server answers.

```vue
<!-- resources/js/pages/products/Media.vue -->
<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Head, useForm, useHttp } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";
import FileInput from "@ui/FileInput.vue";
import { useUnsavedChanges } from "@ui/useUnsavedChanges";
import AppLayout from "@/layouts/AppLayout.vue";

const props = defineProps({
  product: { type: Object, required: true },
  // the selected tags as [{ value, label }], so the combobox can name them before any search
  tags: { type: Array, required: true },
});

// Tags: a form like any other. The combobox searches /tags and creates through POST /tags.
const form = useForm({ tag_ids: props.product.tag_ids });

// the way back is the list as it was left: its search, filters, sort and page, which the list page keeps for the tab
const listHref = ref("/products");
onMounted(() => {
  try {
    listHref.value += sessionStorage.getItem("products:list-query") ?? "";
  } catch {
    // the list as it starts
  }
});

function saveTags() {
  const sent = form.data();
  form.put(`/products/${props.product.id}/tags`, {
    preserveScroll: true,
    // what was sent is what was saved: a tag picked while the save was under way stays unsaved
    onSuccess: () => JSON.stringify(form.data()) !== JSON.stringify(sent) && form.defaults(sent),
  });
}

// Photos: each file uploads as it is added, one request per file, so each has its own progress and errors.
const photos = ref([]);
const uploads = reactive(new Map()); // File → { percent, id, error, request, added }
let added = 0;

watch(photos, (now, before = []) => {
  for (const file of now) if (!uploads.has(file)) upload(file);
  for (const file of before) if (!now.includes(file)) remove(file);
});

function upload(file) {
  const state = reactive({ percent: 0, id: null, error: null, request: useHttp({ photo: file }), added: added++, removed: false });
  uploads.set(file, state);
  state.request.post(`/products/${props.product.id}/photos`, {
    onProgress: (event) => (state.percent = event.percentage),
    onSuccess: (photo) => {
      state.id = photo.id;
      // removed while the server was storing it: delete what it stored
      if (state.removed) destroy(file, state);
    },
    onError: (errors) => (state.error = errors.photo),
    onFinish: () => (state.percent = null),
  }).catch(() => (state.error ??= "The upload failed. Remove the file and try again.")); // a 422 resolves; this is a 500 or no network (or a cancel, whose file has gone)
}

// A file still sending is cancelled. Once every byte has gone the server may have stored it already, so it leaves the
// list and is deleted when the server answers. A stored photo leaves the list at once, and comes back in its place with
// an error if the server did not delete it. Its place is the order the files were added in, which holds however many
// other removals are under way.
function remove(file) {
  const state = uploads.get(file);
  uploads.delete(file);
  if (!state) return;
  if (state.id) return destroy(file, state);
  if (state.percent === 100) state.removed = true;
  else state.request.cancel();
}
function destroy(file, state) {
  const failed = () => {
    state.error = "The photo was not removed. Try again.";
    uploads.set(file, state);
    photos.value = [...photos.value, file].sort((a, b) => uploads.get(a).added - uploads.get(b).added);
  };
  useHttp({}).delete(`/photos/${state.id}`, { onError: failed }).catch(failed); // a 422 calls onError; a 403, 500 or no network rejects
}

// FileInput takes progress by position, and errors as `photos.0`, `photos.1`… by position
const progress = computed(() => photos.value.map((file) => uploads.get(file)?.percent ?? null));
const errors = computed(() => Object.fromEntries(
  photos.value.flatMap((file, i) => (uploads.get(file)?.error ? [[`photos.${i}`, uploads.get(file).error]] : [])),
));
const uploading = computed(() => progress.value.filter((p) => p != null).length);

// unsaved tags, which Log out would lose as well; with no draft, as a tag added since has no label to show by
useUnsavedChanges(form, { remember: false });
// a photo still uploading, which leaving would cut off; an object, not a function, so Log out asks too
useUnsavedChanges({ get isDirty() { return uploading.value > 0; } });
</script>

<template>
  <Head :title="`Tags and photos · ${product.name}`" />
  <AppLayout :breadcrumb="[{ label: 'Products', href: listHref }, { label: product.name, href: `/products/${product.id}/edit` }, { label: 'Tags and photos' }]">
    <div class="min-w-0">
      <h1 class="text-2xl font-semibold tracking-tight break-words">Tags and photos</h1>
      <p class="mt-1 text-sm muted">{{ product.name }} · SKU {{ product.sku }}</p>
    </div>

    <div class="grid items-start gap-gap lg:grid-cols-2">
      <form class="card" @submit.prevent="saveTags">
        <h2 class="text-lg font-semibold">Tags</h2>
        <Field v-model="form.tag_ids" name="tag_ids" label="Tags" type="combobox" multiple :max="5"
            src="/tags" create="/tags" :options="tags" :errors="form.errors" hint="Up to five. Type to search, or add a new one." />
        <div class="flex items-center justify-end gap-2">
          <p class="me-auto text-sm" role="status">{{ form.recentlySuccessful ? "Saved." : "" }}</p>
          <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save tags</button>
        </div>
      </form>

      <section class="card" aria-labelledby="photos-heading">
        <h2 id="photos-heading" class="text-lg font-semibold">Photos</h2>
        <div class="field">
          <label for="photos">Add photos</label>
          <FileInput v-model="photos" id="photos" name="photos" accept="image/*" multiple :progress="progress" :errors="errors">
            <span>PNG or JPEG, up to 5 MB each. Each one uploads as you add it.</span>
          </FileInput>
        </div>
        <p class="text-sm muted" role="status">{{ uploading ? `Uploading ${uploading} of ${photos.length}…` : "" }}</p>
      </section>
    </div>
  </AppLayout>
</template>
```

What the server does:

- `GET /products/{id}/media` renders `products/Media` with `product` (`id`, `name`, `sku` and `tag_ids`) and `tags`, the product's tags as `{ value, label }`.
- `PUT /products/{id}/tags` takes `tag_ids`, at most 5, each an existing tag, syncs them, flashes `toast` ("Tags saved.") and returns `back()`.
- `POST /products/{id}/photos` takes one file, `photo`: an image, at most 5120 KB. It stores it and answers JSON, so each file has its own progress and its own 422.
- `DELETE /photos/{id}` deletes the stored file and the record and answers `204`.
- `GET /tags` matches `q` anywhere in the name, at most 20, in name order. `POST /tags` returns an existing tag with that name, ignoring case, rather than making a second one.

What comes back:

| Request | Sent by | Response |
|---------|---------|----------|
| `GET /tags?q=vin` | Combobox, on open (`q=` empty) and as the user types | `[{ "value": 3, "label": "Vintage" }]`, at most 20. |
| `POST /tags` `{ "label": "Vinyl" }` | Combobox's "Add “Vinyl”" | `201 { "value": 9, "label": "Vinyl" }`, which is selected. A 422 `{ "message": …, "errors": { "label": ["The label field is required."] } }` shows in the panel. |
| `PUT /products/{id}/tags` `{ "tag_ids": [1, 9] }` | Save tags (`useForm`) | Redirect back with flash `toast`; or back with `errors.tag_ids`, which the `Field` shows. |
| `POST /products/{id}/photos`, multipart `photo` | `useHttp`, one per file | `201 { "id": 14, "name": "front.png" }`; or `422 { "errors": { "photo": ["The photo field must not be greater than 5120 kilobytes."] } }`, which `onError` gets as `{ photo: "…" }`. |
| `DELETE /photos/{id}` | Removing an uploaded file | `204`. Anything else (a `403`, a `500`, no network) puts the file back in its place with "The photo was not removed. Try again.", as the photo is still stored. |

- Both JSON endpoints answer JSON errors because the requests send `Accept: application/json`; the combobox and `useHttp` both do, and both send the `XSRF-TOKEN` cookie back as `X-XSRF-TOKEN`, which Laravel's CSRF check accepts.
- `useHttp` reports progress from the browser's upload events, so the bar measures the bytes sent; the server's work after the last byte shows as 100%. `onFinish` takes the bar away.
- `FileInput` reads per-file errors by position (`photos.1`); the `errors` computed builds them from the file, so they stay with their file when another is removed.
- Two `useUnsavedChanges` guards, one question between them: the tags form, so Log out and every other way out ask while tags are unsaved, and an object whose `isDirty` says uploads are still running, which leaving would cut off (an object rather than a function, so Log out asks too). The tags guard keeps no draft (`remember: false`): a tag added since would come back on Back and Forward with no label to show ([unsaved-changes.md](unsaved-changes.md)).
- `accept="image/*"` refuses other files in the browser before any request; `image` in the rules is the check that counts.
- Saved photos are the app's to show (a grid of thumbnails above the drop zone, each with a delete button that calls `DELETE /photos/{id}`). The drop zone lists only this visit's uploads.
- Each action authorises `update` on the product, the photo's delete `update` on the photo's product: route model binding alone would let anyone signed in delete any photo. A `403` on an upload lands in the `catch`, so the file says the upload failed.
