<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import { Archive, Pencil } from "@lucide/vue";
import DataTable from "@ui/DataTable.vue";
import type { DataTableColumn, DataTableFilter, DataTablePaginated, DataTableSelection } from "@ui/dataTable";
import AppLayout from "@/Layouts/AppLayout.vue";

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
  <Head title="Products" />
  <AppLayout :breadcrumb="[{ label: 'Products' }]">
    <div class="flex flex-col gap-gap">
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
  </AppLayout>
</template>
