// tableView against plain arrays and paginators, and the URL format through readView and viewUrl.
// npm test runs it with Node, no browser.
import { test } from "node:test";
import assert from "node:assert/strict";
import fixture from "./table-urls.json" with { type: "json" };
import {
  datePresets,
  keyOf,
  readView,
  tableView,
  viewUrl,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableUrlOptions,
  type DataTableView,
} from "../resources/js/dataTable.ts";

type Row = { id: number; name: string; price: number | null; active: boolean; brand: string };
const rows: Row[] = [
  { id: 1, name: "Item 10", price: 5, active: true, brand: "acme" },
  { id: 2, name: "item 2", price: null, active: false, brand: "bolt" },
  { id: 3, name: "Widget", price: 12, active: true, brand: "acme" },
];
const columns: DataTableColumn<Row>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "price", label: "Price", sortable: true },
  { key: "status", label: "Status", virtual: true, sortValue: (r) => (r.active ? 0 : 1) },
  { key: "actions", label: "", virtual: true },
];
const at = (patch: Partial<DataTableView> = {}): DataTableView => ({ search: "", filters: {}, sort: "", direction: "asc", page: 1, ...patch });
const ids = (result: { rows: Row[] }) => result.rows.map((r) => r.id);

test("search is case-insensitive over data columns, or only the searchable ones", () => {
  assert.deepEqual(ids(tableView({ rows, columns }, at({ search: "  ITEM " }), 25)), [1, 2]);
  assert.deepEqual(ids(tableView({ rows, columns }, at({ search: "12" }), 25)), [3]);
  assert.deepEqual(ids(tableView({ rows, columns, searchable: ["name"] }, at({ search: "12" }), 25)), []);
});

test("filters compare as strings, booleans as 1, and a match function wins", () => {
  const filters: DataTableFilter<Row>[] = [
    { key: "brand", label: "Brand", type: "multiple" },
    { key: "on", label: "Active", type: "boolean", field: "active" },
    { key: "cheap", label: "Cheap", type: "select", match: (r, [max]) => (r.price ?? 0) <= Number(max) },
  ];
  const run = (f: Record<string, string[]>) => ids(tableView({ rows, columns, filters }, at({ filters: f }), 25));
  assert.deepEqual(run({ brand: ["acme"] }), [1, 3]);
  assert.deepEqual(run({ brand: ["acme", "bolt"] }), [1, 2, 3]);
  assert.deepEqual(run({ on: ["1"] }), [1, 3]);
  assert.deepEqual(run({ cheap: ["5"] }), [1, 2]);
  assert.deepEqual(run({ brand: ["acme"], cheap: ["5"] }), [1]);
});

test("sorting puts nulls first, counts numbers in text, ignores case, and uses sortValue for virtual columns", () => {
  const sorted = (sort: string, direction: "asc" | "desc" = "asc") => ids(tableView({ rows, columns }, at({ sort, direction }), 25));
  assert.deepEqual(sorted("name"), [2, 1, 3]);
  assert.deepEqual(sorted("name", "desc"), [3, 1, 2]);
  assert.deepEqual(sorted("price"), [2, 1, 3]);
  assert.deepEqual(sorted("status"), [1, 3, 2]);
  assert.deepEqual(sorted("actions"), [1, 2, 3]);
  assert.deepEqual(rows.map((r) => r.id), [1, 2, 3], "the caller's rows keep their order");
});

test("client paging slices, clamps past the last page and summarises", () => {
  const many = Array.from({ length: 23 }, (_, i) => ({ ...rows[0]!, id: i + 1 }));
  const second = tableView({ rows: many, columns }, at({ page: 2 }), 10);
  assert.deepEqual([second.page, second.lastPage, second.from, second.to, second.rows.length], [2, 3, 11, 20, 10]);
  const past = tableView({ rows: many, columns }, at({ page: 9 }), 10);
  assert.deepEqual([past.page, past.from, past.to, past.summary], [3, 21, 23, "Showing 21–23 of 23"]);
  const narrowed = tableView({ rows: many, columns }, at({ search: "zzz" }), 10);
  assert.deepEqual([narrowed.lastPage, narrowed.summary], [1, "Showing 0 of 0, filtered from 23"]);
  assert.equal(tableView({ rows, columns }, at({ search: "widget" }), 10).summary, "Showing 1–1 of 1, filtered from 3");
});

test("server mode shows the paginator's page as it came, flat or under meta", () => {
  const flat = { data: rows, current_page: 2, last_page: 4, per_page: 3, total: 12, from: 4, to: 6 };
  const shown = tableView({ rows: flat, columns }, at({ search: "widget", sort: "name", page: 1 }), 25);
  assert.deepEqual(ids(shown), [1, 2, 3]);
  assert.deepEqual([shown.page, shown.lastPage, shown.perPage, shown.summary], [2, 4, 3, "Showing 4–6 of 12"]);
  const nested = { data: rows, meta: { current_page: 1, last_page: 1, per_page: 50, total: 3, from: 1, to: 3 } };
  const withTotal = tableView({ rows: nested, columns, unfilteredTotal: 40 }, at(), 25);
  assert.deepEqual([withTotal.perPage, withTotal.summary], [50, "Showing 1–3 of 3, filtered from 40"]);
});

test("an empty table says whether there is nothing yet or nothing matches", () => {
  const filters: DataTableFilter<Row>[] = [{ key: "brand", label: "Brand", type: "select", default: ["acme"] }];
  const page = { data: [] as Row[], total: 0 };
  const empty = (unfilteredTotal: number | undefined, view = at()) => tableView({ rows: page, columns, filters, unfilteredTotal }, view, 25).empty;
  assert.equal(tableView({ rows, columns }, at(), 25).empty, null);
  assert.equal(tableView({ rows: [], columns }, at(), 25).empty, "nothing-yet");
  assert.equal(tableView({ rows, columns }, at({ search: "zzz" }), 25).empty, "no-matches");
  assert.equal(empty(0, at({ search: "x" })), "nothing-yet");
  assert.equal(empty(5), "no-matches");
  // without an unfiltered total, a filter on its default is not the reader narrowing anything
  assert.equal(empty(undefined, at({ filters: { brand: ["acme"] } })), "nothing-yet");
  assert.equal(empty(undefined, at({ filters: { brand: ["bolt"] } })), "no-matches");
  assert.equal(empty(undefined, at({ search: " x " })), "no-matches");
});

// the URL format, case by case, from the fixture tests/table-query.php reads too
const table = fixture.table as DataTableUrlOptions;
for (const c of fixture.cases as Array<{ what: string; url: string; name?: string; view: Partial<DataTableView> & { perPage?: number } }>) {
  test(`URL: ${c.what}`, () => {
    const expected = { ...fixture.view, ...c.view, filters: { ...fixture.view.filters, ...c.view.filters } };
    assert.deepEqual(readView(new URLSearchParams(c.url.split("?")[1] ?? ""), { ...table, name: c.name }), expected);
  });
}

test("viewUrl leaves the defaults out and goes back to page one on any change but the page", () => {
  const url = (from: string, patch: Parameters<typeof viewUrl>[1], server = false) => viewUrl(from, patch, { ...table, server });
  assert.equal(url("/t?page=3", { sort: "price" }), "/t?sort=price&dir=asc");
  assert.equal(url("/t?sort=price&dir=desc&page=3", { sort: "name", direction: "asc" }), "/t");
  assert.equal(url("/t?sort=price", { direction: "desc" }), "/t?sort=price&dir=desc");
  assert.equal(url("/t?search=x", { page: 2 }), "/t?search=x&page=2");
  assert.equal(url("/t?search=x&page=2", { search: "  " }), "/t");
  assert.equal(url("/t", { perPage: 50 }), "/t", "client mode keeps page size out of the URL");
  assert.equal(url("/t", { perPage: 50 }, true), "/t?per_page=50");
  assert.equal(
    url("/t?brand%5B%5D=old&status=draft", { filters: { brand: ["acme", "", "bolt"], status: ["live", "draft"], featured: [] } }),
    "/t?brand%5B%5D=acme&brand%5B%5D=bolt",
    "a select keeps one value, and its default stays out of the URL",
  );
  assert.equal(viewUrl("/t?other=1", { search: "x", page: 2 }, { ...table, name: "brands", server: false }), "/t?other=1&brands_search=x&brands_page=2");
  assert.equal(url("/t?placed_from=2026-03-01", { filters: { placed: ["", "2026-03-31"] } }), "/t?placed_to=2026-03-31");
  // the clear button: neither end left in the URL, so the range is back to its default
  const cleared = url("/t?placed_from=2026-03-01&placed_to=2026-03-31", { filters: { placed: [] } });
  assert.equal(cleared, "/t");
  assert.deepEqual(readView(new URLSearchParams(), table).filters.placed, ["2026-01-01", ""]);
});

test("viewUrl: clearing a filter with a default keeps it clear, and leaving one out brings its default back", () => {
  const withDefaults = { ...table, filters: [...table.filters, { key: "tags", type: "multiple" as const, default: ["new"] }, { key: "live", type: "boolean" as const, default: ["1"] }] };
  const url = (from: string, filters: Record<string, string[]>) => viewUrl(from, { filters }, { ...withDefaults, server: false });
  const read = (u: string) => readView(new URLSearchParams(u.split("?")[1] ?? ""), withDefaults).filters;
  const cleared = url("/t", { status: [""], tags: [], live: [] });
  assert.equal(cleared, "/t?status=&tags%5B%5D=&live=");
  assert.deepEqual([read(cleared).status, read(cleared).tags, read(cleared).live], [[], [], []]);
  assert.equal(url(cleared, { status: ["live"], tags: ["new"], live: ["1"] }), "/t", "a value equal to the default is left out");
  assert.equal(url("/t?status=draft&live=", {}), "/t", "a patch without a filter restores its default");
});

test("a daterange keeps rows whose day falls inside it, both ends included", () => {
  type Dated = { id: number; at: string | null };
  const dated: Dated[] = [
    { id: 1, at: "2026-03-01" },
    { id: 2, at: "2026-03-31 23:59:59" },
    { id: 3, at: null },
    { id: 4, at: "2026-04-01T00:00:00" },
  ];
  const filters: DataTableFilter<Dated>[] = [{ key: "at", label: "At", type: "daterange" }];
  const run = (range: string[]) => ids(tableView({ rows: dated, columns: [{ key: "at", label: "At" }], filters }, at({ filters: { at: range } }), 25));
  assert.deepEqual(run(["2026-03-01", "2026-03-31"]), [1, 2]);
  assert.deepEqual(run(["2026-03-02", ""]), [2, 4]);
  assert.deepEqual(run(["", "2026-03-01"]), [1]);
  assert.deepEqual(run([]), [1, 2, 3, 4]);
});

test("date presets count calendar days in local time, across month ends and clock changes", () => {
  const tz = process.env.TZ;
  process.env.TZ = "Europe/London";
  try {
    const ranges = (...at: number[]) => Object.fromEntries(datePresets(new Date(...(at as [number, number, number, number, number]))).map((p) => [p.label, p.range]));
    assert.deepEqual(ranges(2026, 2, 31, 12, 0), {
      Today: ["2026-03-31", "2026-03-31"],
      "Last 7 days": ["2026-03-25", "2026-03-31"],
      "Last 30 days": ["2026-03-02", "2026-03-31"],
      "This month": ["2026-03-01", "2026-03-31"],
    });
    // the clocks went forward on 29 March: 00:30 BST is still the 29th in UTC, and six days of hours back is a day short
    const spring = ranges(2026, 2, 30, 0, 30);
    assert.deepEqual([spring.Today, spring["Last 7 days"]], [["2026-03-30", "2026-03-30"], ["2026-03-24", "2026-03-30"]]);
    // and back on 25 October
    assert.deepEqual(ranges(2026, 9, 26, 23, 30)["Last 7 days"], ["2026-10-20", "2026-10-26"]);
    // a short month, a leap year, and a range that starts in the year before
    assert.deepEqual(ranges(2028, 1, 10, 9, 0)["This month"], ["2028-02-01", "2028-02-29"]);
    assert.deepEqual(ranges(2026, 0, 5, 9, 0)["Last 30 days"], ["2025-12-07", "2026-01-05"]);
  } finally {
    if (tz === undefined) delete process.env.TZ;
    else process.env.TZ = tz;
  }
});

test("readView reads back what viewUrl wrote", () => {
  const options = { ...table, name: "brands" };
  const url = viewUrl("/t", { search: "red shoe", sort: "price", direction: "desc", filters: { brand: ["a&b"], status: ["draft"], placed: ["", "2026-03-31"] } }, { ...options, server: true });
  const view = readView(new URLSearchParams(url.split("?")[1]), options);
  assert.deepEqual(view, { search: "red shoe", sort: "price", direction: "desc", page: 1, perPage: null, filters: { brand: ["a&b"], status: ["draft"], featured: [], placed: ["", "2026-03-31"] } });
});

test("keyOf: a selectable row needs its key, a plain one falls back to its position", () => {
  assert.equal(keyOf({ id: 7 }, "id", 0, true), 7);
  assert.equal(keyOf({ sku: "A-1" }, "sku", 0, true), "A-1");
  assert.equal(keyOf({ name: "No id" }, "id", 3), 3);
  // an index in { mode: "ids" } would send a bulk action at the wrong records
  assert.throws(() => keyOf({ name: "No id" }, "id", 3, true), /needs "id"/);
});
