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
