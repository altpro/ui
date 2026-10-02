// Types, helpers and URL state for DataTable.vue.
// A page imports the types to type its columns: `const columns: DataTableColumn<Brand>[] = [...]`.
// Without the annotation `key` widens to string and stops being checked against the row.
import { computed, onUnmounted, ref, watch } from "vue";
import { router, usePage } from "@inertiajs/vue3";

export type DataTableDirection = "asc" | "desc";

export type DataTableFormat = "date" | "datetime" | "currency" | "boolean";

interface DataTableColumnBase {
  label: string;
  sortable?: boolean;
  /** Data columns can be hidden unless this says false; virtual columns only when it says true. */
  hideable?: boolean;
  thClass?: string;
  tdClass?: string;
  /** Ignored when a `cell-<key>` slot is given. */
  format?: DataTableFormat;
  /** ISO 4217 code for `format: "currency"`. Defaults to GBP. */
  currency?: string;
}

export interface DataTableDataColumn<TRow> extends DataTableColumnBase {
  key: keyof TRow & string;
  virtual?: false;
}

/** No field behind it (actions, a status built from several fields): search skips it, and sorting needs `sortValue`. */
export interface DataTableVirtualColumn<TRow> extends DataTableColumnBase {
  key: string;
  virtual: true;
  sortValue?: (row: TRow) => string | number | boolean | null;
}

export type DataTableColumn<TRow> = DataTableDataColumn<TRow> | DataTableVirtualColumn<TRow>;

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter<TRow> {
  /** Also the query parameter, after the table's name prefix. */
  key: string;
  label: string;
  type: "select" | "multiple" | "boolean";
  options?: ReadonlyArray<DataTableFilterOption>;
  /** Applied when the URL says nothing. A select with a default needs its own catch-all option, since unset brings the default back. */
  default?: ReadonlyArray<string>;
  /** The field to compare client-side. Defaults to `key`. */
  field?: keyof TRow & string;
  /** Client-side matching for anything a field comparison cannot express. */
  match?: (row: TRow, values: string[]) => boolean;
}

export interface DataTablePaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/** A Laravel paginator: flat when handed straight to Inertia, under `meta` through a resource collection. */
export interface DataTablePaginated<TRow> extends Partial<DataTablePaginationMeta> {
  data: TRow[];
  meta?: DataTablePaginationMeta;
}

export type DataTableRows<TRow> = ReadonlyArray<TRow> | DataTablePaginated<TRow>;

/** `matching` carries the query, not the rows: they are on the server, and there may be forty thousand. */
export type DataTableSelection =
  | { mode: "ids"; ids: Array<string | number> }
  | { mode: "matching"; search: string; filters: Record<string, string[]>; count: number };

/** Keep in step with TableQuery::PAGE_SIZES, which is the list the server enforces. */
export const PAGE_SIZES: ReadonlyArray<number> = [10, 25, 50, 100];

export const DEFAULT_PAGE_SIZE = 25;

export const isPaginated = <TRow>(rows: DataTableRows<TRow>): rows is DataTablePaginated<TRow> => !Array.isArray(rows);

export const paginationMeta = <TRow>(rows: DataTablePaginated<TRow>): DataTablePaginationMeta => {
  const meta = rows.meta;
  return {
    current_page: meta?.current_page ?? rows.current_page ?? 1,
    last_page: meta?.last_page ?? rows.last_page ?? 1,
    per_page: meta?.per_page ?? rows.per_page ?? DEFAULT_PAGE_SIZE,
    total: meta?.total ?? rows.total ?? rows.data.length,
    from: meta?.from ?? rows.from ?? null,
    to: meta?.to ?? rows.to ?? null,
  };
};

// <html lang> is set by the app layout, so the server render and the browser agree
const locale = () => globalThis.document?.documentElement.lang || "en-GB";

/* oxlint-disable typescript/no-base-to-string -- cell values arrive as scalars */
export const formatCellValue = (value: unknown, format?: DataTableFormat, currency = "GBP"): string => {
  if (format === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "" || format === undefined) return value == null ? "" : String(value);
  if (format === "currency") {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat(locale(), { style: "currency", currency }).format(amount) : String(value);
  }
  const text = String(value);
  const date = new Date(text);
  // an unparseable date shows what it was given; "Invalid Date" would hide which record is wrong
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat(locale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(format === "datetime" && { hour: "2-digit", minute: "2-digit" }),
    // a bare date parses as UTC midnight, which is the previous day west of Greenwich
    ...(/^\d{4}-\d{2}-\d{2}$/.test(text) && { timeZone: "UTC" }),
  }).format(date);
};

// localStorage throws in private windows and during SSR; a lost preference never costs the table
export const readPreference = (key: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? undefined;
  } catch {
    return undefined;
  }
};

export const writePreference = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

/** Page numbers to show: all of them up to 7, else first, last and five around the current one, null for a gap. */
export const pageWindow = (current: number, last: number): Array<number | null> => {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
  const start = Math.min(Math.max(current - 2, 2), last - 5);
  const middle = Array.from({ length: 5 }, (_, i) => start + i);
  return [1, start > 2 ? null : [], middle, start + 4 < last - 1 ? null : [], last].flat();
};

export interface TableStatePatch {
  search?: string;
  sort?: string;
  direction?: DataTableDirection;
  page?: number;
  perPage?: number;
  filters?: Record<string, string[]>;
}

/**
 * Table state, held in the query string: search, sort, page and filters are the view,
 * the thing you would send somebody a link to. Client mode rewrites the URL with
 * `router.replace` and asks the server for nothing; server mode makes a real visit
 * with the same parameters, which TableQuery reads.
 */
export const useTableState = (options: {
  /** Prefixes every parameter, so two tables on one page do not share a page number. */
  name?: string;
  defaultSort: string;
  defaultDirection: DataTableDirection;
  filters: () => ReadonlyArray<{ key: string; multiple: boolean; defaults: string[] }>;
  server: () => boolean;
  /** Props a server visit reloads; empty reloads them all. */
  only: () => string[];
}) => {
  const page = usePage();
  const parameter = (key: string) => (options.name ? `${options.name}_${key}` : key);
  const query = computed(() => new URLSearchParams(page.url.split("?")[1] ?? ""));

  const urlSearch = computed(() => query.value.get(parameter("search")) ?? "");
  const sort = computed(() => query.value.get(parameter("sort")) ?? options.defaultSort);
  const direction = computed<DataTableDirection>(() => {
    const value = query.value.get(parameter("dir"));
    return value === "asc" || value === "desc" ? value : options.defaultDirection;
  });
  const pageNumber = computed(() => {
    const raw = Number(query.value.get(parameter("page")) ?? 1);
    return Number.isInteger(raw) && raw > 0 ? raw : 1;
  });

  const filters = computed(() => {
    const result: Record<string, string[]> = {};
    for (const filter of options.filters()) {
      const key = parameter(filter.key) + (filter.multiple ? "[]" : "");
      result[filter.key] = query.value.has(key) ? query.value.getAll(key).filter((v) => v !== "") : [...filter.defaults];
    }
    return result;
  });

  // a filter resting on its default is not the reader narrowing anything
  const activeFilterCount = computed(
    () =>
      options.filters().filter((f) => {
        const values = filters.value[f.key] ?? [];
        return values.length > 0 && values.join("\0") !== f.defaults.join("\0");
      }).length,
  );

  // the box answers each keystroke; the URL (a request, in server mode) catches up after a pause
  const searchInput = ref(urlSearch.value);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  // back button, or a clear from elsewhere: the URL wins unless the reader is mid-typing
  watch(urlSearch, (value) => {
    if (searchTimer === undefined) searchInput.value = value;
  });

  const buildUrl = (patch: TableStatePatch): string => {
    const next = new URLSearchParams(query.value);
    const set = (key: string, value: string) => (value === "" ? next.delete(parameter(key)) : next.set(parameter(key), value));

    if (patch.search !== undefined) set("search", patch.search.trim());
    if (patch.sort !== undefined || patch.direction !== undefined) {
      const s = patch.sort ?? sort.value, d = patch.direction ?? direction.value;
      // the default sort is what an empty URL means, so it is left out
      const isDefault = s === options.defaultSort && d === options.defaultDirection;
      set("sort", isDefault ? "" : s);
      set("dir", isDefault ? "" : d);
    }
    // page size is a device preference; only the server needs telling
    if (patch.perPage !== undefined && options.server()) set("per_page", String(patch.perPage));
    if (patch.filters !== undefined) {
      for (const filter of options.filters()) {
        const key = parameter(filter.key);
        next.delete(key);
        next.delete(`${key}[]`);
        for (const value of (patch.filters[filter.key] ?? []).filter((v) => v !== "").slice(0, filter.multiple ? undefined : 1)) {
          next.append(filter.multiple ? `${key}[]` : key, value);
        }
      }
    }
    // anything but a page change goes back to page one: the old page described another list
    const nextPage = patch.page ?? 1;
    set("page", nextPage > 1 ? String(nextPage) : "");

    const path = page.url.split("?")[0] ?? "", qs = next.toString();
    return qs === "" ? path : `${path}?${qs}`;
  };

  const apply = (patch: TableStatePatch) => {
    const url = buildUrl(patch);
    if (url === page.url) return;
    if (!options.server()) return router.replace({ url, preserveScroll: true, preserveState: true });
    const only = options.only();
    router.get(url, {}, { preserveScroll: true, preserveState: true, replace: true, only: only.length ? only : undefined });
  };

  const setSearch = (value: string) => {
    searchInput.value = value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTimer = undefined;
      apply({ search: value });
    }, 300);
  };

  const clearAll = () => {
    clearTimeout(searchTimer);
    searchTimer = undefined;
    searchInput.value = "";
    apply({ search: "", filters: {} });
  };

  // any visit dims the table, since a server-mode visit may come from elsewhere; one that leaves the page unmounts it
  const busy = ref(false);
  const offStart = router.on("start", () => (busy.value = true));
  const offFinish = router.on("finish", () => (busy.value = false));
  onUnmounted(() => {
    clearTimeout(searchTimer);
    offStart();
    offFinish();
  });

  return {
    searchInput,
    sort,
    direction,
    page: pageNumber,
    filters,
    activeFilterCount,
    busy,
    apply,
    setSearch,
    clearAll,
    hasParameter: (key: string) => query.value.has(parameter(key)),
  };
};
