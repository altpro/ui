// Types, helpers and URL state for DataTable.vue.
// A page imports the types to type its columns: `const columns: DataTableColumn<Brand>[] = [...]`.
// Without the annotation `key` widens to string and stops being checked against the row.
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
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
  /** A daterange only: the words on its clear button, for when "Clear" alone says too little. It is the button's accessible name too. */
  clearLabel?: string;
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
    day: "numeric",
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

/** Whether a filter holds a choice of the reader's: neither empty nor its default. */
export const filterIsSet = (filter: { default?: ReadonlyArray<string> }, values: ReadonlyArray<string> = []): boolean =>
  values.length > 0 && values.join("\0") !== (filter.default ?? []).join("\0");

// a virtual column has no field, so searching it would compare undefined
const searchKeys = <TRow>(table: { columns?: ReadonlyArray<DataTableColumn<TRow>>; searchable?: ReadonlyArray<string> }): ReadonlyArray<string> =>
  table.searchable ?? (table.columns ?? []).filter((c) => !c.virtual).map((c) => c.key);

/** Why a list has no rows: nothing yet, or nothing that matches. */
export type DataListEmpty = "nothing-yet" | "no-matches" | null;

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
    /** Without columns, client-mode search needs `searchable` and client-mode sort reads the sort key from the row. */
    columns?: ReadonlyArray<DataTableColumn<TRow>>;
    filters?: ReadonlyArray<DataTableFilter<TRow>>;
    /** Keys to search. Defaults to every data column. */
    searchable?: ReadonlyArray<string>;
    /** Server mode only: client mode counts its own rows. */
    unfilteredTotal?: number;
    /** Without columns: what to compare for a sort key, if not the field itself. */
    sortValue?: (row: TRow, key: string) => unknown;
    /** False: a search in the URL is ignored, as there is no box to show or clear it. */
    search?: boolean;
  },
  view: DataTableView,
  pageSize: number,
) => {
  const value = (row: TRow, key: string): unknown => (row as Record<string, unknown>)[key];
  const filters = table.filters ?? [];
  // with nothing to search there is no box, so a term in the URL could only hide every row with no way of saying why
  const term = table.search === false || (!isPaginated(table.rows) && searchKeys(table).length === 0) ? "" : view.search.trim().toLowerCase();
  let rows: TRow[], meta: DataTablePaginationMeta | null = null, unfiltered: number | undefined;

  if (isPaginated(table.rows)) {
    meta = paginationMeta(table.rows);
    rows = table.rows.data;
    unfiltered = table.unfilteredTotal;
  } else {
    const keys = searchKeys(table);
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
    const column = table.columns?.find((c) => c.key === view.sort);
    const sortValue = column
      ? (row: TRow) => (column.virtual ? (column.sortValue?.(row) ?? null) : value(row, column.key))
      : !table.columns && view.sort
        ? (row: TRow) => (table.sortValue ? table.sortValue(row, view.sort) : value(row, view.sort))
        : null;
    if (sortValue) {
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
  const narrowed = term !== "" || filters.some((f) => filterIsSet(f, view.filters[f.key]));
  const empty: DataListEmpty = rows.length > 0 ? null : (unfiltered === undefined ? !narrowed : unfiltered === 0) ? "nothing-yet" : "no-matches";

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

// one value of a multiple filter: `key[]` as the table writes it, or `key[0]` once PHP has rebuilt the query string,
// as it has in the page URL inertia-laravel takes from fullUrl()
const isListOf = (candidate: string, key: string) => candidate.startsWith(`${key}[`) && /^\[\d*\]$/.test(candidate.slice(key.length));

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
    const key = parameter(options.name, filter.key);
    const given = filter.type === "multiple" ? [...query].filter(([k]) => isListOf(k, key)).map(([, v]) => v) : query.getAll(key).slice(-1);
    // present but empty means none; only an absent parameter brings the default back
    filters[filter.key] = given.length === 0 ? [...(filter.default ?? [])] : given.filter((v) => v !== "");
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
      for (const k of [...next.keys()]) if ([key, `${key}_from`, `${key}_to`].includes(k) || isListOf(k, key)) next.delete(k);
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
 * Whether an Inertia visit reloads this page's rows, so the table should dim. A GET of this page counts wherever
 * it came from, unless it names only other props. A save does not, even one that redirects back, nor does a prefetch or a poll: an async visit is not the reader waiting.
 */
export const visitReloadsTable = (visit: { method: string; url: URL; only: string[]; prefetch: boolean; async?: boolean }, pageUrl: string, only: ReadonlyArray<string>): boolean =>
  visit.method === "get" &&
  !visit.prefetch &&
  !visit.async &&
  visit.url.pathname === pageUrl.split("?")[0] &&
  (visit.only.length === 0 || only.length === 0 || visit.only.some((prop) => only.includes(prop)));

// The URL of the server visit on its way. The page's URL only moves when the response lands and a new visit cancels the
// one in flight, so a change made meanwhile must build on this or the first change is lost. One for the page, as lists share the URL.
const askedFor = shallowRef<string | null>(null);
// what that visit reloads, as a visit that cancels it has to reload the same or its rows go stale under their filters. Empty means everything.
let askedOnly: string[] = [];
// and whether it rewrites the history entry; if it adds one, a visit that cancels it has to add it instead
let askedReplace = false;
let latestVisit: object | null = null;

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
  const readUrl = (url: string) => readView(new URLSearchParams(url.split("?")[1] ?? ""), options.url());
  const read = computed(() => readUrl(page.url));
  const latest = computed(() => (askedFor.value === null ? read.value : readUrl(askedFor.value)));

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
    const from = askedFor.value ?? page.url;
    const url = viewUrl(from, patch, { ...options.url(), server: options.server() });
    if (url === from) return;
    const overtaking = askedFor.value !== null;
    // a list in the browser needs no server, unless a server's answer is coming that would put the URL back without this change
    if (!options.server() && !overtaking) return router[replace ? "replace" : "push"]({ url, preserveScroll: true, preserveState: true });
    const own = options.server() ? options.only() : askedOnly;
    const only = !overtaking ? own : own.length && askedOnly.length ? [...new Set([...askedOnly, ...own])] : [];
    const replaceEntry = replace && (!overtaking || askedReplace);
    const visit = (latestVisit = {});
    askedFor.value = url;
    askedOnly = only;
    askedReplace = replaceEntry;
    router.get(url, {}, {
      preserveScroll: true,
      preserveState: true,
      replace: replaceEntry,
      only: only.length ? only : undefined,
      // fails or is cancelled too; a later visit has taken over if this was not the latest
      onFinish: () => {
        if (latestVisit !== visit) return;
        askedFor.value = null;
        askedOnly = [];
      },
    });
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

  // the dim belongs to the visit that started it: a row's save finishing during a reload says nothing about the reload
  const busy = ref(false);
  let reloading: object | null = null;
  const offStart = router.on("start", ({ detail: { visit } }) => {
    if (!visitReloadsTable(visit, page.url, options.only())) return;
    // a list in the browser names no props to reload, so a partial visit is someone else's
    if (!options.server() && visit.only.length > 0) return;
    reloading = visit;
    busy.value = true;
  });
  const offFinish = router.on("finish", ({ detail: { visit } }) => {
    if (visit !== reloading) return;
    reloading = null;
    busy.value = false;
  });
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
    /** The filters as last asked for, ahead of `filters` while a visit is on its way: what the controls show and build on. */
    latestFilters: computed<Record<string, string[]>>((old) =>
      old && JSON.stringify(old) === JSON.stringify(latest.value.filters) ? old : latest.value.filters,
    ),
    /** The sort as last asked for, ahead of `sort` in the same way. */
    latestSort: computed(() => latest.value.sort),
    latestDirection: computed(() => latest.value.direction),
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

/**
 * A button that disables or removes itself drops focus to the body, and a keyboard or screen reader user loses their
 * place: once the list has redrawn without it, focus goes to `to`. Only if the focus went with it, so a click elsewhere
 * in the meantime keeps its own; and only from a focused button, which a mouse click in Safari never makes.
 */
export const handOff = (from: Element | null, to: () => HTMLElement | null | undefined, options?: FocusOptions): void => {
  if (!(from instanceof HTMLElement) || from === document.body) return;
  const gone = !from.isConnected || (from as HTMLButtonElement).disabled;
  if (gone && [document.body, from].includes(document.activeElement as HTMLElement)) to()?.focus(options);
};

/** A choice in a sort select, for a list with no column headers to click. */
export interface DataListSortOption {
  key: string;
  direction: DataTableDirection;
  label: string;
}

/** What a list is made from. Read afresh whenever it changes, so return props rather than copies of them. */
export interface DataListSource<TRow> {
  rows: DataTableRows<TRow>;
  filters?: ReadonlyArray<DataTableFilter<TRow>>;
  /** Prefixes the query parameters. Needed when two lists share a page. */
  name?: string;
  /** Names the stored page size, which needs one of this or `name`. */
  storageKey?: string;
  /** Rows per page until the reader picks another. */
  perPage?: number;
  /** Keys to search. Defaults to every data column of `columns`. */
  searchable?: ReadonlyArray<string>;
  /** False removes the search box. */
  search?: boolean;
  /** The default sort; a list with `sortOptions` defaults to the first of them. */
  sort?: string;
  direction?: DataTableDirection;
  /** Keys a URL may sort by, beyond those in `sortOptions`. */
  sortable?: ReadonlyArray<string>;
  sortOptions?: ReadonlyArray<DataListSortOption>;
  /** DataTable's: gives search its default keys and sort its virtual columns. */
  columns?: ReadonlyArray<DataTableColumn<TRow>>;
  /** Without columns: what to compare for a sort key, if not the field itself. */
  sortValue?: (row: TRow, key: string) => unknown;
  /** Server mode: the row count before any search or filter, so an empty list can say which kind of empty it is. */
  unfilteredTotal?: number;
  /** Server mode: the props a change reloads. */
  only?: string[];
}

/**
 * The state of one list: the view from the URL, what it shows and the page size kept on the device.
 * The component that renders the rows calls this and hands the result to <DataList :list>, so its script can read
 * the same view its template shows. Everything Inertia stays inside useTableState.
 */
export const useDataList = <TRow>(source: () => DataListSource<TRow>) => {
  const start = source();
  const storageKey = start.storageKey ?? start.name;
  const defaultSort = start.sort ?? start.sortOptions?.[0]?.key ?? start.sortable?.[0] ?? "";
  const defaultDirection = (): DataTableDirection => source().direction ?? start.sortOptions?.[0]?.direction ?? "asc";

  const server = computed(() => isPaginated(source().rows));
  const filters = computed(() => source().filters ?? []);
  const sortOptions = computed(() => source().sortOptions ?? []);
  const state = useTableState({
    url: () => {
      const { name, sortable = [], sortOptions: options = [] } = source();
      return { name, defaultSort, defaultDirection: defaultDirection(), sortable: [...new Set([...sortable, ...options.map((o) => o.key)])], filters: filters.value };
    },
    server: () => server.value,
    only: () => source().only ?? [],
  });

  // Page size is a preference, not the view: a link you send shows the rows, not your page size.
  // It is read on mount, so a server render and the hydrating browser start from the same list.
  const preferredSize = ref(start.perPage ?? DEFAULT_PAGE_SIZE);
  const sizeKey = storageKey === undefined ? null : `datatable:${storageKey}:per-page`;

  const setPageSize = (size: number) => {
    preferredSize.value = size;
    if (sizeKey) writePreference(sizeKey, size);
    state.apply({ perPage: size, page: 1 }, true);
  };

  const view = computed(() =>
    tableView(
      source(),
      { search: state.searchInput.value, filters: state.filters.value, sort: state.sort.value, direction: state.direction.value, page: state.page.value },
      preferredSize.value,
    ),
  );

  // ponytail: the first server visit does not carry a stored page size, so a changed one costs one extra request.
  // Store the preference on the user server-side if that ever matters.
  onMounted(() => {
    const stored = sizeKey ? readPreference(sizeKey) : undefined;
    if (typeof stored === "number" && PAGE_SIZES.includes(stored)) preferredSize.value = stored;
    if (server.value && view.value.perPage !== preferredSize.value && state.perPage.value === null) state.apply({ perPage: preferredSize.value }, true);
  });

  return {
    state,
    view,
    server,
    filters,
    sortOptions,
    /** Whether a search box would find anything: in server mode only the app knows, so only `search: false` removes it. */
    searchable: computed(() => source().search !== false && (server.value || searchKeys(source()).length > 0)),
    setFilter: (key: string, values: string[]) => state.apply({ filters: { ...state.latestFilters.value, [key]: values } }),
    setFilters: (values: Record<string, string[]>) => state.apply({ filters: values }),
    setPageSize,
  };
};

/**
 * How many filters the Filters button's badge counts, one per filter whatever it holds. `in-force` is every filter
 * narrowing the list, a default included; `changed` only those the reader has set to something other than the default.
 */
export type DataListFilterCount = "in-force" | "changed";

export const countFilters = (
  filters: ReadonlyArray<{ key: string; default?: ReadonlyArray<string> }>,
  values: Record<string, ReadonlyArray<string>>,
  count: DataListFilterCount = "in-force",
): number =>
  filters.filter((filter) => {
    const given = values[filter.key] ?? [];
    return count === "changed" ? filterIsSet(filter, given) : given.some((v) => v !== "");
  }).length;

/** What useDataList returns; DataList.vue's `list` prop. */
export type DataListController<TRow> = ReturnType<typeof useDataList<TRow>>;

/** The props every list component shares. */
export interface DataListProps<TRow> {
  rows: DataTableRows<TRow>;
  /** Names the list, its search box and its pagination. */
  caption: string;
  /** Prefixes the query parameters and the stored preferences. Needed when two lists share a page. */
  name?: string;
  /** Rows per page until the reader picks another; one of the page sizes on offer. */
  perPage?: number;
  /** Keys to search. */
  searchable?: ReadonlyArray<keyof TRow & string>;
  /** False removes the search box. */
  search?: boolean;
  filters?: ReadonlyArray<DataTableFilter<TRow>>;
  direction?: DataTableDirection;
  searchPlaceholder?: string;
  emptyMessage?: string;
  noMatchesMessage?: string;
  /** Server mode: the row count before any search or filter, so an empty list can say which kind of empty it is. */
  unfilteredTotal?: number;
  /** Server mode: the props a change reloads. */
  only?: string[];
  /** Formats dates and money. Defaults to `<html lang>` in the browser; pass it when the page is rendered on the server too. */
  locale?: string;
  /** `drawer` keeps the filters in a panel behind one Filters button. Default `inline`, in the toolbar. */
  filterDisplay?: "inline" | "drawer";
  /** What the Filters button's badge counts. Default `in-force`. */
  filterCount?: DataListFilterCount;
}

/** One calendar day of a timeline. `key` repeats if the rows come back to a day they left. */
export interface DataListDay<TRow> {
  key: string;
  label: string;
  rows: TRow[];
}

const bareDate = /^\d{4}-\d{2}-\d{2}$/;

const calendarDay = (date: Date, timeZone?: string): string => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};

// a bare date is that day wherever you read it; parsed, it is UTC midnight, which is the previous day west of Greenwich.
// null for anything that is no date: Intl throws on an invalid one, and one bad row must not take the page with it.
const dayOf = (value: unknown, timeZone?: string): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  if (bareDate.test(text)) return isDate(text) ? text : null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : calendarDay(date, timeZone);
};

const dayLabel = (day: string, today: string, locale: string): string => {
  const [year, month, date] = day.split("-").map(Number) as [number, number, number];
  const [thisYear, thisMonth, thisDate] = today.split("-").map(Number) as [number, number, number];
  if (day === today) return "Today";
  // by the calendar, not 24 hours back, so a clock change moves nothing
  if (day === new Date(Date.UTC(thisYear, thisMonth - 1, thisDate - 1)).toISOString().slice(0, 10)) return "Yesterday";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC", ...(year !== thisYear && { year: "numeric" }) }).format(Date.UTC(year, month - 1, date));
};

/** Consecutive rows that share a calendar day, in the browser's timezone unless given one. Rows with no usable date group as "No date". */
export const groupByDay = <TRow>(
  rows: ReadonlyArray<TRow>,
  dateOf: (row: TRow) => unknown,
  { now = new Date(), locale = pageLocale(), timeZone }: { now?: Date; locale?: string; timeZone?: string } = {},
): Array<DataListDay<TRow>> => {
  const today = calendarDay(now, timeZone);
  const days: Array<DataListDay<TRow>> = [];
  for (const row of rows) {
    const day = dayOf(dateOf(row), timeZone);
    const last = days.at(-1);
    if (last && last.key === (day ?? "none")) last.rows.push(row);
    else days.push({ key: day ?? "none", label: day ? dayLabel(day, today, locale) : "No date", rows: [row] });
  }
  return days;
};

/** A timeline row's `<time>`: the time of day, since the day is its heading. A bare date has none; what cannot be read shows as it came. */
export const timeOfDay = (value: unknown, { locale = pageLocale(), timeZone }: { locale?: string; timeZone?: string } = {}): { label: string; datetime?: string } | null => {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  if (isDate(text)) return null;
  const date = new Date(text);
  // 2026-02-30 parses, into March
  if (bareDate.test(text) || Number.isNaN(date.getTime())) return { label: text };
  return { label: new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone }).format(date), datetime: text };
};

/** A date as a moment, to sort by: strings compare wrongly once their offsets differ. */
export const instantOf = (value: unknown): number | null => {
  const time = value === null || value === undefined || value === "" ? Number.NaN : new Date(String(value)).getTime();
  return Number.isNaN(time) ? null : time;
};
