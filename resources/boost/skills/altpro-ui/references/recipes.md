# Recipes: whole screens in a Laravel/Inertia app

Three screens built from the documented components, each with the Vue page, the controller, the routes and what every endpoint returns. Copy them and rename. They share one `Product` model, so together they are a small products area: a list, an edit form, and a tags-and-photos page.

| Recipe | Chains | Demo page |
|--------|--------|-----------|
| [1. Edit page](#1-edit-page) | breadcrumb, record header, `Field`s, save bar; defaults, server errors, save, discard | `demo/app/recipe-product.html` |
| [2. List page](#2-list-page) | breadcrumb, record header, server-mode `DataTable` with filters, `only` and a bulk action | `demo/app/recipe-products.html` |
| [3. Tags and photos](#3-tags-and-photos) | `Combobox` with `src` and `create` endpoints; `FileInput` uploading each file with progress | `demo/app/recipe-media.html` |

The demo pages run this Vue code (with the demo's own icon helper in place of `@lucide/vue`) against a stand-in for the server; `tests/recipes.spec.js` drives them. Run `npm run dev` in the altpro/ui repository and open them under Application.

## What the recipes assume

- Inertia 3 with `@inertiajs/vue3`, Laravel with `inertiajs/inertia-laravel`, and the `@ui` alias from SKILL.md's setup.
- Pages resolve from `resources/js/Pages/`, so `Inertia::render('Products/Edit')` is `resources/js/Pages/Products/Edit.vue`.
- The layout wraps each page in `<main class="p-gap">`, which the save bar's `-mx-gap px-gap` matches, and puts `class="scroll-pb-20"` on `<html>` (see [save-bar.md](save-bar.md)).
- Saves confirm with a toast: the controller calls `Inertia::flash('toast', ['type' => 'success', 'message' => '…'])` and redirects, and `app.js` shows it, as [toast.md](toast.md) sets up. With a save bar on the page, put the toaster at the top (`class="toaster top"`): in the bottom corner a toast covers Save.
- Icons are Lucide, from `@lucide/vue`: `<Pencil class="size-4" aria-hidden="true" />`.
- Laravel's default validation messages; the browser tests read them.

The model and tables behind all three:

```php
// app/Models/Product.php
// products: id, team_id, name, sku (unique), category, price decimal(8,2), stock unsigned int, status, description text null, timestamps
// tags: id, name; product_tag: product_id, tag_id; photos: id, product_id, name, path, timestamps
// users: the usual columns, plus team_id and is_manager boolean
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    public const CATEGORIES = ['Headphones', 'Speakers', 'Turntables'];
    public const STATUSES = ['Active', 'Draft', 'Archived'];

    protected $fillable = ['name', 'sku', 'category', 'price', 'stock', 'status', 'description'];

    /** The products this user may see. The list and every bulk action start from it. */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->where('team_id', $user->team_id);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }
}
```

```php
// app/Models/Photo.php
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    protected $fillable = ['name', 'path'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

// app/Models/Tag.php
class Tag extends Model
{
    protected $fillable = ['name'];
}
```

```php
// app/Policies/ProductPolicy.php: Laravel finds it by the model's name
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    // the list itself; which rows it holds is Product::visibleTo()
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function update(User $user, Product $product): bool
    {
        return $product->team_id === $user->team_id;
    }

    // whether a bulk action may run at all; the rows it reaches are Product::visibleTo() again
    public function archive(User $user): bool
    {
        return $user->is_manager;
    }
}
```

Every action authorises in its own code: route model binding finds any record by its id.

```php
// routes/web.php
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductMediaController;
use App\Http\Controllers\TagController;

Route::middleware('auth')->group(function () {
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products/bulk', [ProductController::class, 'bulk'])->name('products.bulk');
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');

    Route::get('/products/{product}/media', [ProductMediaController::class, 'edit'])->name('products.media');
    Route::put('/products/{product}/tags', [ProductMediaController::class, 'updateTags']);
    Route::post('/products/{product}/photos', [ProductMediaController::class, 'storePhoto']);
    Route::delete('/photos/{photo}', [ProductMediaController::class, 'destroyPhoto']);

    Route::get('/tags', [TagController::class, 'index']);
    Route::post('/tags', [TagController::class, 'store']);
});
```

## 1. Edit page

Breadcrumb, record header, a grid of `Field`s bound to `useForm`, and the save bar. The form's defaults are the saved record: Discard puts them back, and Inertia makes the saved data the new defaults after a successful save, so `isDirty` goes false by itself.

```vue
<!-- resources/js/Pages/Products/Edit.vue -->
<script setup>
import { Link, useForm } from "@inertiajs/vue3";
import { Upload } from "@lucide/vue";
import Field from "@ui/Field.vue";

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

const save = () => form.put(`/products/${props.product.id}`, { preserveScroll: true });
const discard = () => {
  form.reset();
  form.clearErrors();
};
const statusClass = { Active: "success", Draft: "", Archived: "outlined" };
const updated = (timestamp) => new Date(timestamp).toLocaleDateString(document.documentElement.lang, { day: "numeric", month: "short", year: "numeric" });
</script>

<template>
  <div class="space-y-gap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Dashboard</Link>
      <Link href="/products">Products</Link>
      <span aria-current="page">{{ product.name }}</span>
    </nav>

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
      <Field v-model="form.name" name="name" :errors="form.errors" required class="sm:col-span-2" />
      <Field v-model="form.sku" name="sku" label="SKU" :errors="form.errors" required />
      <Field v-model="form.category" name="category" type="select" :options="categories" :errors="form.errors" required />
      <Field v-model="form.price" name="price" type="number" prepend="£" step="0.01" min="0" :errors="form.errors" required />
      <Field v-model="form.stock" name="stock" type="number" step="1" min="0" hint="Units on the shelf." :errors="form.errors" required />
      <Field v-model="form.status" name="status" type="select" :options="statuses" :errors="form.errors" />
      <Field v-model="form.description" name="description" type="textarea" rows="4" :errors="form.errors" class="sm:col-span-2" />

      <div class="sticky bottom-0 z-10 col-span-full -mx-gap flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-gap py-3">
        <p class="me-auto text-sm" role="status">{{ form.isDirty ? "Unsaved changes" : form.recentlySuccessful ? "Saved." : "" }}</p>
        <button type="button" class="btn outlined" :disabled="!form.isDirty || form.processing" @click="discard">Discard</button>
        <button class="btn primary" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Save</button>
      </div>
    </form>
  </div>
</template>
```

```php
// app/Http/Controllers/ProductController.php (edit and update; index and bulk are in recipe 2)
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

public function edit(Product $product): Response
{
    Gate::authorize('update', $product);

    return Inertia::render('Products/Edit', [
        'product' => $product->only('id', 'name', 'sku', 'category', 'price', 'stock', 'status', 'description', 'updated_at'),
        'categories' => Product::CATEGORIES,
        'statuses' => Product::STATUSES,
    ]);
}

// UpdateProductRequest::authorize() checks the same `update` ability before this runs
public function update(UpdateProductRequest $request, Product $product): RedirectResponse
{
    $product->update($request->validated());
    Inertia::flash('toast', ['type' => 'success', 'message' => 'Product saved.']);

    return to_route('products.edit', $product);
}
```

```php
// app/Http/Requests/UpdateProductRequest.php
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'sku' => ['required', 'string', 'max:20', Rule::unique('products')->ignore($this->route('product'))],
            'category' => ['required', Rule::in(Product::CATEGORIES)],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'status' => ['required', Rule::in(Product::STATUSES)],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
```

What comes back:

| Request | Response | On the page |
|---------|----------|-------------|
| `GET /products/{id}/edit` | Inertia page `Products/Edit` with `product`, `categories`, `statuses` | The form, clean. |
| `PUT /products/{id}`, invalid | Laravel redirects back with the errors; Inertia receives the edit page with `errors: { name: "The name field is required.", price: "The price field must be at least 0." }` | Each `Field` shows its message and sets `aria-invalid`. The form keeps what was typed (`put` preserves state) and stays dirty. |
| `PUT /products/{id}`, valid | Redirect to the edit page, `errors: {}`, flash `toast` | Errors clear, the header shows the saved name, the status line says "Saved.", the toast shows, Discard disables. |

- `novalidate` lets the server answer every field in one round trip, so the browser's own bubbles never disagree with Laravel's messages. Drop it to get the browser's checks first as well.
- Errors stay until the next response. To clear a field's error as it is fixed, add `@input="form.clearErrors('name')"` to that `Field`.
- Discard is `reset()` then `clearErrors()`: errors belong to values that are no longer there.
- After a valid save the props change under the form. `useForm` ignores that (its defaults came from the save itself), which is why the form is not rebuilt from `product`.

## 2. List page

Breadcrumb, a record-header-shaped title, and a server-mode `DataTable`: search, sort, filters and pages come from `TableQuery`, a table change reloads only `products`, and the selection drives a bulk action. The bulk endpoint gets either ids or, after "Select all N matching", the search and filters the table showed, and re-runs them through the same `filter()` and `TableQuery::search()` as the index.

```vue
<!-- resources/js/Pages/Products/Index.vue -->
<script setup lang="ts">
import { Link, router } from "@inertiajs/vue3";
import { Archive, Pencil } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import type { DataTableColumn, DataTableFilter, DataTablePaginated, DataTableSelection } from "@ui/dataTable";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft" | "Archived";
  updated_at: string;
}

defineProps<{
  products: DataTablePaginated<Product>;
  filters: DataTableFilter<Product>[];
  unfilteredTotal: number;
}>();

const columns: DataTableColumn<Product>[] = [
  { key: "name", label: "Name", sortable: true, tdClass: "font-medium" },
  { key: "sku", label: "SKU", sortable: true, tdClass: "whitespace-nowrap" },
  { key: "category", label: "Category", sortable: true },
  { key: "status", label: "Status" },
  { key: "stock", label: "Stock", sortable: true, thClass: "text-right", tdClass: "text-right tabular-nums" },
  { key: "price", label: "Price", sortable: true, format: "currency", thClass: "text-right", tdClass: "text-right tabular-nums" },
  { key: "updated_at", label: "Updated", sortable: true, format: "date" },
  { key: "actions", label: "Actions", virtual: true, thClass: "w-px" },
];
const statusClass: Record<Product["status"], string> = { Active: "success", Draft: "", Archived: "outlined" };

// the selection is ids, or the search and filters behind "Select all N matching": the server runs either
const archive = (selection: DataTableSelection, clear: () => void) =>
  router.post("/products/bulk", { action: "archive", selection }, { preserveScroll: true, onSuccess: clear });
</script>

<template>
  <div class="space-y-gap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Dashboard</Link>
      <span aria-current="page">Products</span>
    </nav>

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight">Products</h1>
        <p class="mt-1 text-sm muted">{{ unfilteredTotal }} products in the catalogue</p>
      </div>
    </div>

    <DataTable caption="Products" :columns="columns" :rows="products" :filters="filters" :unfiltered-total="unfilteredTotal"
        :only="['products']" sort="name" :paginate="10" selectable
        empty-message="No products yet." no-matches-message="No products match.">
      <template #cell-status="{ row }">
        <span class="badge sm" :class="statusClass[row.status]">{{ row.status }}</span>
      </template>
      <template #cell-actions="{ row }">
        <Link :href="`/products/${row.id}/edit`" class="btn ghost sm"><Pencil class="size-4" aria-hidden="true" /> Edit <span class="sr-only">{{ row.name }}</span></Link>
      </template>
      <template #bulk-actions="{ selection, clear }">
        <button type="button" class="btn outlined sm" @click="archive(selection, clear)"><Archive class="size-4" aria-hidden="true" /> Archive</button>
      </template>
    </DataTable>
  </div>
</template>
```

```php
// app/Http/Controllers/ProductController.php (index and bulk)
use Altpro\Ui\TableQuery;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const SEARCHABLE = ['name', 'sku'];

    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Product::class);

        $filters = $this->filters();
        $query = $this->filter(Product::visibleTo($request->user()), TableQuery::filters($request, $filters))
            ->select('id', 'name', 'sku', 'category', 'price', 'stock', 'status', 'updated_at');

        // closures, so a table change (`only: ['products']`) runs the table's query and nothing else
        return Inertia::render('Products/Index', [
            'products' => fn () => TableQuery::paginate($query, $request,
                searchable: self::SEARCHABLE,
                sortable: ['name', 'sku', 'category', 'price', 'stock', 'updated_at'],
                defaultSort: 'name',
                perPage: 10,
            ),
            'filters' => $filters,
            'unfilteredTotal' => fn () => Product::visibleTo($request->user())->count(),
        ]);
    }

    public function bulk(Request $request): RedirectResponse
    {
        Gate::authorize('archive', Product::class);

        $data = $request->validate([
            'action' => ['required', Rule::in(['archive'])],
            'selection.mode' => ['required', Rule::in(['ids', 'matching'])],
            'selection.ids' => ['required_if:selection.mode,ids', 'array'],
            'selection.ids.*' => ['integer'],
            'selection.search' => ['nullable', 'string'],
            'selection.filters' => ['array'],
            'selection.filters.*' => ['array'],
        ]);
        $selection = $data['selection'];

        // the index's starting point, so neither ids nor "matching" reach a row the list would hide
        $query = Product::visibleTo($request->user());
        if ($selection['mode'] === 'ids') {
            $query->whereKey($selection['ids']);
        } else {
            // the query the table showed, run the same way: the index's filters, then TableQuery's search
            $this->filter($query, $selection['filters'] ?? []);
            TableQuery::search($query, self::SEARCHABLE, $selection['search'] ?? '');
        }

        $count = $query->update(['status' => 'Archived']);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$count} ".Str::plural('product', $count).' archived.']);

        return back();
    }

    /** Declared once: DataTable's `filters` prop, and what TableQuery::filters() reads. */
    private function filters(): array
    {
        $options = fn (array $values) => array_map(fn ($v) => ['value' => $v, 'label' => $v], $values);

        return [
            ['key' => 'status', 'label' => 'Status', 'type' => 'select', 'options' => $options(Product::STATUSES)],
            ['key' => 'category', 'label' => 'Category', 'type' => 'multiple', 'options' => $options(Product::CATEGORIES)],
        ];
    }

    /** What each filter means, for the index and for a bulk action over everything matching. */
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
| `GET /products?search=loop&status=Active&category[]=Turntables&sort=price&dir=desc&page=2&per_page=25` | Inertia page `Products/Index`. `products` is the paginator: `{ data: [{ id, name, sku, … }], current_page, last_page, per_page, total, from, to, … }`; `filters` the array above; `unfilteredTotal` a number. |
| The same, from a table change | DataTable sends `only: ['products']`, so the response carries `products` alone and the closures for the rest never run. |
| `POST /products/bulk` with `{ action: "archive", selection: { mode: "ids", ids: [2, 9] } }` | Redirect back to the list URL it came from, flash `toast` "2 products archived.". |
| `POST /products/bulk` with `{ action: "archive", selection: { mode: "matching", search: "", filters: { status: [], category: ["Speakers"] }, count: 5 } }` | The same, over every product the query matches now. `count` is what the table saw; the server counts again. |
| `POST /products/bulk` from a user who is not a manager | `403`, and nothing changes. |

- `defaultSort` and `perPage` match the component's `sort` and `:paginate`, so a bare URL and the header agree. `sortable` is the allow-list for `order by`.
- `selection.filters` has the shape `TableQuery::filters()` returns, so the one `filter()` serves both.
- `onSuccess: clear` empties the selection once the server has answered. The page's new props show the archived rows; the rows that no longer match a filter drop out.
- A destructive bulk action (delete) asks first: open a `.dialog` that says how many, and post from its confirm button.
- `Product::visibleTo()` starts the index, its count and `bulk()`. The endpoint takes whatever ids and filters it is sent, so a bulk query starting from `Product::query()` would reach rows the list never showed. `Gate::authorize('archive', …)` is the other half: whether this user may archive at all.

## 3. Tags and photos

Two ways to send data from one page. Tags are an ordinary form: `Field type="combobox"` searches `GET /tags`, creates through `POST /tags`, and Save submits the ids. Photos upload as they are added, one `useHttp` request per file, so each file has its own progress bar and its own errors, and removing a file cancels its upload or deletes it on the server.

```vue
<!-- resources/js/Pages/Products/Media.vue -->
<script setup>
import { computed, reactive, ref, watch } from "vue";
import { Link, useForm, useHttp } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";
import FileInput from "@ui/FileInput.vue";

const props = defineProps({
  product: { type: Object, required: true },
  // the selected tags as [{ value, label }], so the combobox can name them before any search
  tags: { type: Array, required: true },
});

// Tags: a form like any other. The combobox searches /tags and creates through POST /tags.
const form = useForm({ tag_ids: props.product.tag_ids });
const saveTags = () => form.put(`/products/${props.product.id}/tags`, { preserveScroll: true });

// Photos: each file uploads as it is added, one request per file, so each has its own progress and errors.
const photos = ref([]);
const uploads = reactive(new Map()); // File → { percent, id, error, request }

watch(photos, (now, before = []) => {
  for (const file of now) if (!uploads.has(file)) upload(file);
  for (const file of before) if (!now.includes(file)) remove(file);
});

function upload(file) {
  const state = reactive({ percent: 0, id: null, error: null, request: useHttp({ photo: file }) });
  uploads.set(file, state);
  state.request.post(`/products/${props.product.id}/photos`, {
    onProgress: (event) => (state.percent = event.percentage),
    onSuccess: (photo) => (state.id = photo.id),
    onError: (errors) => (state.error = errors.photo),
    onFinish: () => (state.percent = null),
  }).catch(() => (state.error ??= "The upload failed. Remove the file and try again.")); // a 422 resolves; this is a 500 or no network (or a cancel, whose file has gone)
}

function remove(file) {
  const state = uploads.get(file);
  uploads.delete(file);
  if (state?.id) useHttp({}).delete(`/photos/${state.id}`);
  else state?.request.cancel();
}

// FileInput takes progress by position, and errors as `photos.0`, `photos.1`… by position
const progress = computed(() => photos.value.map((file) => uploads.get(file)?.percent ?? null));
const errors = computed(() => Object.fromEntries(
  photos.value.flatMap((file, i) => (uploads.get(file)?.error ? [[`photos.${i}`, uploads.get(file).error]] : [])),
));
const uploading = computed(() => progress.value.filter((p) => p != null).length);
</script>

<template>
  <div class="space-y-gap">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Dashboard</Link>
      <Link href="/products">Products</Link>
      <Link :href="`/products/${product.id}/edit`">{{ product.name }}</Link>
      <span aria-current="page">Tags and photos</span>
    </nav>

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
  </div>
</template>
```

```php
// app/Http/Controllers/ProductMediaController.php
use App\Models\Photo;
use App\Models\Product;
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductMediaController extends Controller
{
    public function edit(Product $product): Response
    {
        Gate::authorize('update', $product);

        return Inertia::render('Products/Media', [
            'product' => [...$product->only('id', 'name', 'sku'), 'tag_ids' => $product->tags->modelKeys()],
            'tags' => $product->tags->map(fn (Tag $tag) => ['value' => $tag->id, 'label' => $tag->name]),
        ]);
    }

    public function updateTags(Request $request, Product $product): RedirectResponse
    {
        Gate::authorize('update', $product);

        $data = $request->validate([
            'tag_ids' => ['array', 'max:5'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
        ]);
        $product->tags()->sync($data['tag_ids'] ?? []);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Tags saved.']);

        return back();
    }

    // one file per request, so each has its own progress and its own 422
    public function storePhoto(Request $request, Product $product): JsonResponse
    {
        Gate::authorize('update', $product);

        $request->validate(['photo' => ['required', 'image', 'max:5120']]);
        $file = $request->file('photo');
        $photo = $product->photos()->create([
            'name' => $file->getClientOriginalName(),
            'path' => $file->store('photos', 'public'),
        ]);

        return response()->json(['id' => $photo->id, 'name' => $photo->name], 201);
    }

    public function destroyPhoto(Photo $photo): \Illuminate\Http\Response
    {
        Gate::authorize('update', $photo->product);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->noContent();
    }
}
```

```php
// app/Http/Controllers/TagController.php: the combobox's `src` and `create`
use App\Models\Tag;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Tag::query()
            ->where('name', 'like', '%'.$request->string('q').'%')
            ->orderBy('name')
            ->limit(20)
            ->get()
            ->map(fn (Tag $tag) => ['value' => $tag->id, 'label' => $tag->name]));
    }

    // an existing tag with that name, ignoring case, is returned rather than duplicated
    public function store(Request $request): JsonResponse
    {
        $label = $request->validate(['label' => ['required', 'string', 'max:30']])['label'];
        $tag = Tag::query()->whereRaw('lower(name) = ?', [mb_strtolower($label)])->first()
            ?? Tag::create(['name' => $label]);

        return response()->json(['value' => $tag->id, 'label' => $tag->name], $tag->wasRecentlyCreated ? 201 : 200);
    }
}
```

What comes back:

| Request | Sent by | Response |
|---------|---------|----------|
| `GET /tags?q=vin` | Combobox, on open (`q=` empty) and as the user types | `[{ "value": 3, "label": "Vintage" }]`, at most 20. |
| `POST /tags` `{ "label": "Vinyl" }` | Combobox's "Add “Vinyl”" | `201 { "value": 9, "label": "Vinyl" }`, which is selected. A 422 `{ "message": …, "errors": { "label": ["The label field is required."] } }` shows in the panel. |
| `PUT /products/{id}/tags` `{ "tag_ids": [1, 9] }` | Save tags (`useForm`) | Redirect back with flash `toast`; or back with `errors.tag_ids`, which the `Field` shows. |
| `POST /products/{id}/photos`, multipart `photo` | `useHttp`, one per file | `201 { "id": 14, "name": "front.png" }`; or `422 { "errors": { "photo": ["The photo field must not be greater than 5120 kilobytes."] } }`, which `onError` gets as `{ photo: "…" }`. |
| `DELETE /photos/{id}` | Removing an uploaded file | `204`. |

- Both JSON endpoints answer JSON errors because the requests send `Accept: application/json`; the combobox and `useHttp` both do, and both send the `XSRF-TOKEN` cookie back as `X-XSRF-TOKEN`, which Laravel's CSRF check accepts.
- `useHttp` reports progress from the browser's upload events, so the bar measures the bytes sent; the server's work after the last byte shows as 100%. `onFinish` takes the bar away.
- `FileInput` reads per-file errors by position (`photos.1`); the `errors` computed builds them from the file, so they stay with their file when another is removed.
- `accept="image/*"` refuses other files in the browser before any request; `image` in the rules is the check that counts.
- Saved photos are the app's to show (a grid of thumbnails above the drop zone, each with a delete button that calls `DELETE /photos/{id}`). The drop zone lists only this visit's uploads.
- Each action authorises `update` on the product, `destroyPhoto` on the photo's product: route model binding alone would let anyone signed in delete any photo. A `403` on an upload lands in the `catch`, so the file says the upload failed.
