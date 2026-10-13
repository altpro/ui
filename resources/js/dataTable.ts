// Types, helpers and URL state for DataTable.vue.
// A page imports the types to type its columns: `const columns: DataTableColumn<Brand>[] = [...]`.
// Without the annotation `key` widens to string and stops being checked against the row.
import { computed, onUnmounted, ref, watch } from "vue";
import { router, usePage } from "@inertiajs/vue3";
import pageSizes from "./dataTable.json" with { type: "json" };

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
  /** A daterange is `{key}_from` and `{key}_to` in the URL, and `[from, to]` here, either of which may be "". */
  type: "select" | "multiple" | "boolean" | "daterange";
  options?: ReadonlyArray<DataTableFilterOption>;
  /** Applied when the URL says nothing. Clearing a filter that has one writes it present but empty, so it stays clear; a daterange's Clear brings it back. */
  default?: ReadonlyArray<string>;
  /** The field to compare client-side. Defaults to `key`. */
  field?: keyof TRow & string;
  /** Client-side matching for anything a field comparison cannot express. */
  match?: (row: TRow, values: string[]) => boolean;
  /** A daterange only: offer Today, Last 7 days, Last 30 days and This month, which fill in both dates. */
  presets?: boolean;
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

/** TableQuery reads the same file, so the picker offers what the server enforces. */
export const PAGE_SIZES: ReadonlyArray<number> = pageSizes.pageSizes;

export const DEFAULT_PAGE_SIZE: number = pageSizes.defaultPageSize;

export const isPaginated = <TRow>(rows: DataTableRows<TRow>): rows is DataTablePaginated<TRow> => !Array.isArray(rows);

const paginationMeta = <TRow>(rows: DataTablePaginated<TRow>): DataTablePaginationMeta => {
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

// <html lang>, set by the app layout, when the table is not given a locale. A server render has no document,
// so it needs the locale prop to agree with the browser.
const pageLocale = () => globalThis.document?.documentElement.lang || "en-GB";

/* oxlint-disable typescript/no-base-to-string -- cell values arrive as scalars */
export const formatCellValue = (value: unknown, format?: DataTableFormat, currency = "GBP", locale = pageLocale()): string => {
  if (format === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined || value === "" || format === undefined) return value == null ? "" : String(value);
  if (format === "currency") {
    const amount = Number(value);
    return Number.isFinite(amount) ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount) : String(value);
  }
  const text = String(value);
  const date = new Date(text);
  // an unparseable date shows what it was given; "Invalid Date" would hide which record is wrong
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat(locale, {
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

// a day as a date input writes it, from the local date parts: toISOString is UTC, which is another day near midnight
const localDay = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n, i) => String(n).padStart(i ? 2 : 4, "0")).join("-");

/** A daterange's presets as `[from, to]` around `today`, both ends included. Days are counted by the calendar, not in hours, so a clock change moves nothing. */
export const datePresets = (today = new Date()): Array<{ label: string; range: [string, string] }> => {
  const [y, m, d] = [today.getFullYear(), today.getMonth(), today.getDate()];
  const day = (month: number, date: number) => localDay(new Date(y, month, date));
  return [
    { label: "Today", range: [day(m, d), day(m, d)] },
    { label: "Last 7 days", range: [day(m, d - 6), day(m, d)] },
    { label: "Last 30 days", range: [day(m, d - 29), day(m, d)] },
    { label: "This month", range: [day(m, 1), day(m + 1, 0)] },
  ];
};

/** A row's `key` field. Selection hands these to a bulk action, so there a missing one throws rather than fall back to the position. */
export const keyOf = (row: object, key: string, index: number, required = false): string | number => {
  const value = (row as Record<string, unknown>)[key];
  if (typeof value === "string" || typeof value === "number") return value;
  if (required) throw new Error(`DataTable: a selectable table needs "${key}" on every row. Set row-key to the field that identifies the record.`);
  return index;
};

/** The view as the table reads it: search is the box as typed, ahead of the URL. */
export interface DataTableView {
  search: string;
  filters: Record<string, string[]>;
  sort: string;
  direction: DataTableDirection;
  page: number;
}

const compare = (a: unknown, b: unknown): number => {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
};

/**
 * What the table shows for a view. Client mode searches, filters, sorts and pages the rows here;
 * server mode shows the paginator's page as it came. `pageSize` is the preference, which a paginator overrides.
 */
export const tableView = <TRow>(
  table: {
    rows: DataTableRows<TRow>;
    columns: ReadonlyArray<DataTableColumn<TRow>>;
    filters?: ReadonlyArray<DataTableFilter<TRow>>;
    /** Keys to search. Defaults to every data column. */
    searchable?: ReadonlyArray<string>;
    /** Server mode only: client mode counts its own rows. */
    unfilteredTotal?: number;
  },
  view: DataTableView,
  pageSize: number,
) => {
  const value = (row: TRow, key: string): unknown => (row as Record<string, unknown>)[key];
  const filters = table.filters ?? [];
  const term = view.search.trim().toLowerCase();
  let rows: TRow[], meta: DataTablePaginationMeta | null = null, unfiltered: number | undefined;

  if (isPaginated(table.rows)) {
    meta = paginationMeta(table.rows);
    rows = table.rows.data;
    unfiltered = table.unfilteredTotal;
  } else {
    // a virtual column has no field, so searching it would compare undefined
    const keys = table.searchable ?? table.columns.filter((c) => !c.virtual).map((c) => c.key);
    rows = table.rows.filter(
      (row) =>
        (term === "" || keys.some((key) => String(value(row, key) ?? "").toLowerCase().includes(term))) &&
        filters.every((filter) => {
          const values = view.filters[filter.key] ?? [];
          if (values.length === 0) return true;
          if (filter.match) return filter.match(row, values);
          const v = value(row, filter.field ?? filter.key);
          if (filter.type === "daterange") {
            // ponytail: compares the date part as the row gives it, so a timestamp must arrive in the app's timezone; `match` covers others
            const day = v == null ? "" : String(v).slice(0, 10);
            const [from = "", to = ""] = values;
            return day !== "" && (from === "" || day >= from) && (to === "" || day <= to);
          }
          return filter.type === "boolean" ? Boolean(v) === (values[0] === "1") : values.includes(String(v));
        }),
    );
    const column = table.columns.find((c) => c.key === view.sort);
    if (column) {
      const sortValue = (row: TRow) => (column.virtual ? (column.sortValue?.(row) ?? null) : value(row, column.key));
      const sign = view.direction === "asc" ? 1 : -1;
      rows.sort((a, b) => sign * compare(sortValue(a), sortValue(b)));
    }
    unfiltered = table.rows.length;
  }

  const perPage = meta?.per_page ?? pageSize;
  const total = meta?.total ?? rows.length;
  const lastPage = meta?.last_page ?? Math.max(1, Math.ceil(total / perPage));
  const page = meta?.current_page ?? Math.min(view.page, lastPage);
  if (!meta) rows = rows.slice((page - 1) * perPage, page * perPage);
  const from = meta?.from ?? (total === 0 ? 0 : (page - 1) * perPage + 1);
  const to = meta?.to ?? Math.min(page * perPage, total);

  // The status is always the count and the empty cell always the message, so neither repeats the other.
  const filtered = unfiltered !== undefined && unfiltered !== total ? `, filtered from ${unfiltered}` : "";
  const summary = total === 0 ? `Showing 0 of 0${filtered}` : `Showing ${from}–${to} of ${total}${filtered}`;

  // "nothing yet" offers a way to create, "nothing matches" a way to clear. Without an unfiltered total,
  // the reader having searched or moved a filter off its default is the only clue.
  const narrowed =
    term !== "" ||
    filters.some((f) => {
      const values = view.filters[f.key] ?? [];
      return values.length > 0 && values.join("\0") !== (f.default ?? []).join("\0");
    });
  const empty = rows.length > 0 ? null : (unfiltered === undefined ? !narrowed : unfiltered === 0) ? "nothing-yet" : "no-matches";

  return { rows, total, page, lastPage, perPage, from, to, summary, empty };
};

/** What reading and writing a table's URL needs. A server-mode controller hands TableQuery the same. */
export interface DataTableUrlOptions {
  /** Prefixes every parameter, so two tables on one page do not share a page number. */
  name?: string;
  defaultSort: string;
  defaultDirection: DataTableDirection;
  /** Column keys a URL may sort by; any other falls back to the default sort. */
  sortable: ReadonlyArray<string>;
  filters: ReadonlyArray<{ key: string; type: DataTableFilter<unknown>["type"]; default?: ReadonlyArray<string> }>;
}

const parameter = (name: string | undefined, key: string) => (name ? `${name}_${key}` : key);

// a page number as TableQuery accepts it: digits, no sign, no leading zero, and no further than it goes
const pageNumber = /^[1-9]\d*$/;
const MAX_PAGE = 1_000_000_000;

// a day as a date input writes it; 2026-02-30 rolls over into March, so it is not one
const isDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

/**
 * The view a query string asks for, plus the page size it asks the server for (null if none on offer).
 * TableQuery::view() and ::filters() read it the same way; tests/table-urls.json holds both sides to that.
 */
export const readView = (query: URLSearchParams, options: DataTableUrlOptions): DataTableView & { perPage: number | null } => {
  // a repeated parameter means its last value, as PHP reads it
  const read = (key: string) => query.getAll(key).at(-1) ?? "";
  const at = (key: string) => read(parameter(options.name, key));
  const filters: Record<string, string[]> = {};
  for (const filter of options.filters) {
    if (filter.type === "daterange") {
      const ends = ["_from", "_to"].map((end) => parameter(options.name, filter.key) + end);
      // either end present speaks for the range; an invalid date is dropped and a reversed range turned round
      let [from = "", to = ""] = ends.map((end) => (isDate(read(end)) ? read(end) : ""));
      if (from !== "" && to !== "" && from > to) [from, to] = [to, from];
      filters[filter.key] = !ends.some((end) => query.has(end)) ? [...(filter.default ?? [])] : from || to ? [from, to] : [];
      continue;
    }
    const key = parameter(options.name, filter.key) + (filter.type === "multiple" ? "[]" : "");
    // present but empty means none; only an absent parameter brings the default back
    filters[filter.key] = !query.has(key)
      ? [...(filter.default ?? [])]
      : (filter.type === "multiple" ? query.getAll(key) : [read(key)]).filter((v) => v !== "");
  }
  const sort = at("sort"), direction = at("dir"), page = at("page"), perPage = at("per_page");
  return {
    search: at("search").trim(),
    filters,
    sort: options.sortable.includes(sort) ? sort : options.defaultSort,
    direction: direction === "asc" || direction === "desc" ? direction : options.defaultDirection,
    page: pageNumber.test(page) ? Math.min(Number(page), MAX_PAGE) : 1,
    perPage: PAGE_SIZES.map(String).includes(perPage) ? Number(perPage) : null,
  };
};

export interface TableStatePatch {
  search?: string;
  sort?: string;
  direction?: DataTableDirection;
  page?: number;
  perPage?: number;
  filters?: Record<string, string[]>;
}

/** The URL after a change to the view. `server` says whether the page size goes in too: only the server needs telling. */
export const viewUrl = (url: string, patch: TableStatePatch, options: DataTableUrlOptions & { server: boolean }): string => {
  const [path = "", search = ""] = url.split("?");
  const next = new URLSearchParams(search);
  const current = readView(next, options);
  const set = (key: string, value: string) =>
    value === "" ? next.delete(parameter(options.name, key)) : next.set(parameter(options.name, key), value);

  if (patch.search !== undefined) set("search", patch.search.trim());
  if (patch.sort !== undefined || patch.direction !== undefined) {
    const s = patch.sort ?? current.sort, d = patch.direction ?? current.direction;
    // the default sort is what an empty URL means, so it is left out
    const isDefault = s === options.defaultSort && d === options.defaultDirection;
    set("sort", isDefault ? "" : s);
    set("dir", isDefault ? "" : d);
  }
  // page size is a device preference; only the server needs telling
  if (patch.perPage !== undefined && options.server) set("per_page", String(patch.perPage));
  // a filter left out of the patch, or set to its default, leaves the URL, and the default applies
  if (patch.filters !== undefined) {
    for (const filter of options.filters) {
      const key = parameter(options.name, filter.key), multiple = filter.type === "multiple";
      for (const k of [key, `${key}[]`, `${key}_from`, `${key}_to`]) next.delete(k);
      const given = patch.filters[filter.key];
      if (given === undefined) continue;
      if (filter.type === "daterange") {
        // a cleared range writes neither end, so its default comes back: a default range is one the table should never be without
        const [from = "", to = ""] = given;
        if (from) next.set(`${key}_from`, from);
        if (to) next.set(`${key}_to`, to);
        continue;
      }
      const values = given.filter((v) => v !== "").slice(0, multiple ? undefined : 1);
      if (values.join("\0") === (filter.default ?? []).join("\0")) continue;
      // none, over a default, has to be said: an absent parameter would bring the default straight back
      if (values.length === 0) next.set(multiple ? `${key}[]` : key, "");
      for (const value of values) next.append(multiple ? `${key}[]` : key, value);
    }
  }
  // anything but a page change goes back to page one: the old page described another list
  const nextPage = patch.page ?? 1;
  set("page", nextPage > 1 ? String(nextPage) : "");

  const qs = next.toString();
  return qs === "" ? path : `${path}?${qs}`;
};

/**
 * Table state, held in the query string: search, sort, page and filters are the view,
 * the thing you would send somebody a link to. Client mode rewrites the URL with a
 * client-side visit and asks the server for nothing; server mode makes a real visit
 * with the same parameters, which TableQuery reads.
 */
export const useTableState = (options: {
  url: () => DataTableUrlOptions;
  server: () => boolean;
  /** Props a server visit reloads; empty reloads them all. */
  only: () => string[];
}) => {
  const page = usePage();
  const read = computed(() => readView(new URLSearchParams(page.url.split("?")[1] ?? ""), options.url()));

  // the box answers each keystroke; the URL (a request, in server mode) catches up after a pause
  const searchInput = ref(read.value.search);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  // back button, or a clear from elsewhere: the URL wins unless the reader is mid-typing,
  // or the box differs only by the spaces the URL trims, which would eat the one between two words
  watch(
    () => read.value.search,
    (value) => {
      if (searchTimer === undefined && value !== searchInput.value.trim()) searchInput.value = value;
    },
  );

  // a sort, page or filter is a step Back undoes; a search rewrites its entry as it is typed, and page size is a preference
  const apply = (patch: TableStatePatch, replace = false) => {
    const url = viewUrl(page.url, patch, { ...options.url(), server: options.server() });
    if (url === page.url) return;
    if (!options.server()) return router[replace ? "replace" : "push"]({ url, preserveScroll: true, preserveState: true });
    const only = options.only();
    router.get(url, {}, { preserveScroll: true, preserveState: true, replace, only: only.length ? only : undefined });
  };

  const setSearch = (value: string) => {
    searchInput.value = value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTimer = undefined;
      apply({ search: value }, true);
    }, 300);
  };

  const clearAll = () => {
    clearTimeout(searchTimer);
    searchTimer = undefined;
    searchInput.value = "";
    // every filter present but empty, as clearing one does: a default that matches nothing would come straight back
    apply({ search: "", filters: Object.fromEntries(options.url().filters.map((f) => [f.key, []])) });
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
    sort: computed(() => read.value.sort),
    direction: computed(() => read.value.direction),
    page: computed(() => read.value.page),
    // the same object until a value changes: every URL change reads afresh, and another table's sort is not a change to these
    filters: computed<Record<string, string[]>>((old) =>
      old && JSON.stringify(old) === JSON.stringify(read.value.filters) ? old : read.value.filters,
    ),
    /** The search the URL holds, which in server mode is the one the rows on screen answer; the box may be ahead of it. */
    search: computed(() => read.value.search),
    /** The page size the URL asks the server for, if any. */
    perPage: computed(() => read.value.perPage),
    busy,
    apply,
    setSearch,
    clearAll,
  };
};
