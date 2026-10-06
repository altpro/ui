// Demo only: the Laravel half of the recipe pages (recipe-*.html), so they run with no backend.
// It plays the controllers in references/recipes.md, answers Inertia visits through a stand-in
// HTTP client and the Combobox's fetch() calls through a stand-in fetch, and boots the Inertia app
// as an app's app.js would. The page components in Pages/ are the code the recipes show.
import { createInertiaApp, http, router } from "@inertiajs/vue3";
import { HttpCancelledError, HttpResponseError } from "@inertiajs/core";
import { readView } from "@ui/dataTable";

// ---- the database, kept for the tab so an edit shows on the list ----
const today = () => new Date().toISOString();
const seed = () => ({
  products: [
    ["Arc headphones", "ARC-SL", "Headphones", 249, 42, "Active"],
    ["Arc studio", "ASP-CL", "Headphones", 349, 0, "Draft"],
    ["Dot earbuds", "DOT-CH", "Headphones", 129, 64, "Active"],
    ["Dot earbuds sport", "DOT-SP", "Headphones", 149, 21, "Active"],
    ["Halo over-ear", "HAL-SL", "Headphones", 199, 9, "Active"],
    ["Mono speaker", "MON-CH", "Speakers", 179, 32, "Active"],
    ["Mono mini", "MIN-CL", "Speakers", 99, 0, "Archived"],
    ["Duo stereo set", "DUO-SL", "Speakers", 329, 7, "Active"],
    ["Field portable", "FLD-CL", "Speakers", 119, 26, "Draft"],
    ["Tower floorstander", "TWR-SL", "Speakers", 899, 3, "Active"],
    ["Orbit turntable", "ORB-SL", "Turntables", 399, 18, "Active"],
    ["Loop turntable", "LOP-CH", "Turntables", 279, 4, "Active"],
    ["Loop deluxe", "LOP-DX", "Turntables", 459, 0, "Draft"],
    ["Groove preamp", "GRV-SL", "Turntables", 89, 40, "Active"],
  ].map(([name, sku, category, price, stock, status], i) => ({
    id: i + 1, name, sku, category, price, stock, status, tag_ids: [1],
    description: `${name}, from the Forma ${category.toLowerCase()} range.`,
    updated_at: `2026-0${1 + (i % 9)}-1${i % 10}T09:30:00.000000Z`,
  })),
  tags: ["Wireless", "Bestseller", "Analog", "New arrival", "Studio", "Coming soon", "Gift idea", "Limited"].map((name, i) => ({ id: i + 1, name })),
  photos: [],
});
let db;
try { db = JSON.parse(sessionStorage.getItem("demo-recipes")); } catch {}
db ||= seed();
const commit = () => sessionStorage.setItem("demo-recipes", JSON.stringify(db));
const find = (id) => db.products.find((p) => p.id === Number(id));

// ---- what a Laravel response would be ----
class Back { constructor(extra) { Object.assign(this, extra); } }
const page = (component, props) => ({ component, props });
const json = (body, status = 200) => ({ json: body, status });
// redirect()->back(): the page the request came from, with the session's errors and flash
const back = (extra = {}) => new Back(extra);
const lower = (s) => s.toLowerCase();

// ---- ProductController ----
const categories = ["Headphones", "Speakers", "Turntables"];
const statuses = ["Active", "Draft", "Archived"];
const options = (values) => values.map((value) => ({ value, label: value }));
const filters = [
  { key: "status", label: "Status", type: "select", options: options(statuses) },
  { key: "category", label: "Category", type: "multiple", options: options(categories) },
];
const searchable = ["name", "sku"];
const sortable = ["name", "sku", "category", "price", "stock", "updated_at"];

// the controller's when() clauses, shared by index and bulk
const applyFilters = (rows, values) => rows.filter((p) =>
  (!values.status?.length || p.status === values.status[0]) &&
  (!values.category?.length || values.category.includes(p.category)));
// TableQuery::search(): LIKE %term% on each searchable column, case-insensitive as MySQL and SQLite are
const search = (rows, term) => {
  const t = lower(term.trim());
  return t ? rows.filter((p) => searchable.some((k) => lower(String(p[k])).includes(t))) : rows;
};
const compare = (a, b) => (typeof a === "number" ? a - b : String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));

function index(query) {
  // TableQuery::filters() and ::paginate(), read the same way through readView()
  const view = readView(query, { defaultSort: "name", defaultDirection: "asc", sortable, filters });
  const dir = view.direction === "desc" ? -1 : 1;
  const rows = search(applyFilters(db.products, view.filters), view.search)
    .sort((a, b) => (compare(a[view.sort], b[view.sort]) || a.id - b.id) * dir);
  const perPage = view.perPage ?? 10;
  const last = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(view.page, last);
  const data = rows.slice((current - 1) * perPage, current * perPage)
    .map(({ id, name, sku, category, price, stock, status, updated_at }) => ({ id, name, sku, category, price, stock, status, updated_at }));
  const from = data.length ? (current - 1) * perPage + 1 : null;
  return page("Products/Index", {
    products: { data, current_page: current, last_page: last, per_page: perPage, total: rows.length, from, to: from && from + data.length - 1 },
    filters,
    unfilteredTotal: db.products.length,
  });
}

function bulk(body) {
  const { action, selection } = body;
  if (action !== "archive" || !selection) return back({ errors: { action: "The selected action is invalid." } });
  const rows = selection.mode === "ids"
    ? db.products.filter((p) => selection.ids.includes(p.id))
    : search(applyFilters(db.products, selection.filters ?? {}), selection.search ?? "");
  for (const p of rows) Object.assign(p, { status: "Archived", updated_at: today() });
  commit();
  return back({ flash: { toast: { type: "success", message: `${rows.length} ${rows.length === 1 ? "product" : "products"} archived.` } } });
}

const productProps = (p) => ({ product: { ...p, tag_ids: undefined }, categories, statuses });
const edit = (id) => page("Products/Edit", productProps(find(id)));

// UpdateProductRequest: the rules, with Laravel's default messages
const blank = (v) => v == null || String(v).trim() === "";
function validateProduct(data, product) {
  const errors = {};
  const rule = (key, failed, message) => { if (!errors[key] && failed) errors[key] = message; };
  rule("name", blank(data.name), "The name field is required.");
  rule("name", String(data.name).length > 120, "The name field must not be greater than 120 characters.");
  rule("sku", blank(data.sku), "The sku field is required.");
  rule("sku", db.products.some((p) => p.id !== product.id && lower(p.sku) === lower(String(data.sku))), "The sku has already been taken.");
  rule("category", !categories.includes(data.category), "The selected category is invalid.");
  rule("price", blank(data.price), "The price field is required.");
  rule("price", Number.isNaN(Number(data.price)), "The price field must be a number.");
  rule("price", Number(data.price) < 0, "The price field must be at least 0.");
  rule("stock", blank(data.stock), "The stock field is required.");
  rule("stock", !Number.isInteger(Number(data.stock)), "The stock field must be an integer.");
  rule("stock", Number(data.stock) < 0, "The stock field must be at least 0.");
  rule("status", !statuses.includes(data.status), "The selected status is invalid.");
  rule("description", String(data.description ?? "").length > 2000, "The description field must not be greater than 2000 characters.");
  return errors;
}
function update(id, data) {
  const product = find(id);
  const errors = validateProduct(data, product);
  if (Object.keys(errors).length) return back({ errors });
  const { name, sku, category, price, stock, status, description } = data;
  Object.assign(product, { name, sku, category, price: Number(price), stock: Number(stock), status, description: description ?? "", updated_at: today() });
  commit();
  return back({ flash: { toast: { type: "success", message: "Product saved." } } });
}

// ---- tags and photos ----
const tagOption = (t) => ({ value: t.id, label: t.name });
function media(id) {
  const p = find(id);
  return page("Products/Media", {
    product: { id: p.id, name: p.name, sku: p.sku, status: p.status, tag_ids: p.tag_ids },
    tags: db.tags.filter((t) => p.tag_ids.includes(t.id)).map(tagOption),
  });
}
function updateTags(id, data) {
  const ids = Array.isArray(data.tag_ids) ? data.tag_ids : [];
  if (ids.length > 5) return back({ errors: { tag_ids: "The tag ids field must not have more than 5 items." } });
  if (ids.some((t) => !db.tags.some((tag) => tag.id === t))) return back({ errors: { tag_ids: "The selected tag ids is invalid." } });
  find(id).tag_ids = ids;
  commit();
  return back({ flash: { toast: { type: "success", message: "Tags saved." } } });
}
// TagController@index: what Combobox `src` asks for, as `?q=`
const searchTags = (query) => json(db.tags
  .filter((t) => lower(t.name).includes(lower(query.get("q") ?? "")))
  .sort((a, b) => compare(a.name, b.name)).slice(0, 20).map(tagOption));
// TagController@store: what Combobox `create` posts, as `{ label }`
function storeTag(data) {
  const label = String(data?.label ?? "").trim();
  if (!label) return json({ message: "The label field is required.", errors: { label: ["The label field is required."] } }, 422);
  if (label.length > 30) return json({ message: "The label field must not be greater than 30 characters.", errors: { label: ["The label field must not be greater than 30 characters."] } }, 422);
  let tag = db.tags.find((t) => lower(t.name) === lower(label));
  if (!tag) db.tags.push(tag = { id: Math.max(0, ...db.tags.map((t) => t.id)) + 1, name: label });
  commit();
  return json(tagOption(tag), 201);
}
// PhotoController@store: one file per request, validated as `photo`
function storePhoto(id, data) {
  const file = data instanceof FormData ? data.get("photo") : null;
  const fail = (message) => json({ message, errors: { photo: [message] } }, 422);
  if (!(file instanceof File)) return fail("The photo field is required.");
  if (!file.type.startsWith("image/")) return fail("The photo field must be an image.");
  if (file.size > 5120 * 1024) return fail("The photo field must not be greater than 5120 kilobytes.");
  const photo = { id: Math.max(0, ...db.photos.map((p) => p.id)) + 1, product_id: Number(id), name: file.name };
  db.photos.push(photo);
  commit();
  return json({ id: photo.id, name: photo.name }, 201);
}
function destroyPhoto(id) {
  db.photos = db.photos.filter((p) => p.id !== Number(id));
  commit();
  return json(null, 204);
}

// ---- routes/web.php ----
const routes = [
  ["GET", /^\/products$/, (m, q) => index(q)],
  ["POST", /^\/products\/bulk$/, (m, q, body) => bulk(body)],
  ["GET", /^\/products\/(\d+)\/edit$/, ([, id]) => edit(id)],
  ["PUT", /^\/products\/(\d+)$/, ([, id], q, body) => update(id, body)],
  ["GET", /^\/products\/(\d+)\/media$/, ([, id]) => media(id)],
  ["PUT", /^\/products\/(\d+)\/tags$/, ([, id], q, body) => updateTags(id, body)],
  ["POST", /^\/products\/(\d+)\/photos$/, ([, id], q, body) => storePhoto(id, body)],
  ["DELETE", /^\/photos\/(\d+)$/, ([, id]) => destroyPhoto(id)],
  ["GET", /^\/tags$/, (m, q) => searchTags(q)],
  ["POST", /^\/tags$/, (m, q, body) => storeTag(body)],
];

// the app's URLs live in static demo pages: /products is recipe-products.html, /products/3/edit recipe-product.html?id=3
const demoPages = [
  [/^\/products$/, () => "/app/recipe-products.html"],
  [/^\/products\/(\d+)\/edit$/, (id) => `/app/recipe-product.html?id=${id}`],
  [/^\/products\/(\d+)\/media$/, (id) => `/app/recipe-media.html?id=${id}`],
];
const toDemo = (url) => {
  for (const [re, to] of demoPages) {
    const m = url.pathname.match(re);
    if (m) {
      const demo = new URL(to(m[1]), location.origin);
      url.searchParams.forEach((v, k) => demo.searchParams.append(k, v));
      return demo.pathname + demo.search;
    }
  }
  return url.pathname + url.search;
};
const toApp = (url) => {
  const id = url.searchParams.get("id") ?? "1";
  const app = new URL(url);
  app.searchParams.delete("id");
  const path = { "/app/recipe-products.html": "/products", "/app/recipe-product.html": `/products/${id}/edit`, "/app/recipe-media.html": `/products/${id}/media` }[url.pathname];
  if (path) app.pathname = path;
  return app;
};

const route = (method, url) => {
  for (const [m, re, handler] of routes) {
    const match = method === m && url.pathname.match(re);
    if (match) return (body) => handler(match, url.searchParams, body);
  }
};

// the page object for an Inertia visit. A Back is Laravel's redirect to the page the browser is on, so that page
// renders again with the errors or flash. A partial reload (DataTable's `only`) gets just the props it asked for,
// as Laravel skips the closures for the rest.
function visit(result, url, only) {
  const here = new URL(location.href);
  const res = result instanceof Back ? route("GET", toApp(here))() : result;
  const props = { ...res.props, errors: result.errors ?? {} };
  if (only) for (const key of Object.keys(props)) if (key !== "errors" && !only.includes(key)) delete props[key];
  return {
    component: res.component, props, flash: result.flash ?? {},
    url: result instanceof Back ? here.pathname + here.search : toDemo(url),
    version: null, clearHistory: false, encryptHistory: false,
  };
}

// ---- the stand-in for Inertia's XHR client: visits and useHttp() land here ----
const wait = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); reject(new HttpCancelledError()); });
});
http.setClient({
  async request(config) {
    const url = toApp(new URL(config.url, location.href));
    for (const [k, v] of Object.entries(config.params ?? {})) url.searchParams.append(k, v);
    const method = config.method.toUpperCase();
    const headers = Object.fromEntries(Object.entries(config.headers ?? {}).map(([k, v]) => [lower(k), v]));
    const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    // a file upload reports progress as XHR would, a tenth at a time
    if (body instanceof FormData && config.onUploadProgress) {
      for (let p = 1; p <= 10; p++) {
        await wait(150, config.signal);
        config.onUploadProgress({ progress: p / 10, percentage: p * 10, loaded: p, total: 10 });
      }
    } else await wait(200, config.signal);
    const handler = route(method, url);
    // not one of these routes (the breadcrumb's home link): answer as Laravel does for a non-Inertia page, with a full page load
    if (!handler) throw new HttpResponseError("Conflict", { status: 409, data: "", headers: { "x-inertia-location": new URL(config.url, location.href).href } }, config.url);
    const result = handler(body);
    if (headers["x-inertia"]) {
      const data = visit(result, url, headers["x-inertia-partial-data"]?.split(","));
      return { status: 200, data: JSON.stringify(data), headers: { "x-inertia": "true", "content-type": "application/json" } };
    }
    const response = { status: result.status, data: result.json == null ? "" : JSON.stringify(result.json), headers: { "content-type": "application/json" } };
    if (result.status >= 400) throw new HttpResponseError(`Request failed with status ${result.status}`, response, config.url);
    return response;
  },
});

// ---- the stand-in for fetch(): Combobox's `src` and `create` URLs land here ----
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url, location.href);
  const handler = url.origin === location.origin && route((init.method ?? "GET").toUpperCase(), url);
  if (!handler) return realFetch(input, init);
  await wait(200);
  const result = handler(init.body ? JSON.parse(init.body) : null);
  return new Response(result.status === 204 ? null : JSON.stringify(result.json), { status: result.status, headers: { "Content-Type": "application/json" } });
};

// ---- app.js: flash to toast (see references/toast.md), then boot on the page the URL names ----
const toaster = document.getElementById("toaster");
router.on("flash", ({ detail: { flash } }) => {
  if (!flash.toast) return;
  const el = Object.assign(document.createElement("div"), { className: `alert ${flash.toast.type}` });
  el.append(Object.assign(document.createElement("p"), { textContent: flash.toast.message }));
  el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
  toaster.append(el);
});

const pages = import.meta.glob("./Pages/**/*.vue", { eager: true });
const first = route("GET", toApp(new URL(location.href)))();
createInertiaApp({
  page: { ...first, props: { ...first.props, errors: {} }, url: location.pathname + location.search, version: null, clearHistory: false, encryptHistory: false },
  resolve: (name) => pages[`./Pages/${name}.vue`],
});
