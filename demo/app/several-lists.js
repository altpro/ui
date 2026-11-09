// A test page, not in the menu: server-mode lists sharing a URL, against a stand-in server slow enough for changes to overlap.
// window.delay is how long it takes to answer, window.fail makes it give up, and window.visits records what it was asked.
import { createInertiaApp, http } from "@inertiajs/vue3";
import { HttpCancelledError } from "@inertiajs/core";
import { readView } from "@ui/dataTable";
import SeveralLists, { listNames, listOptions } from "./SeveralLists.vue";

const records = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Record ${String(i + 1).padStart(2, "0")}`, type: i % 2 ? "x" : "y" }));
const perPage = 10;

const paginate = (name, query) => {
  const view = readView(query, listOptions(name));
  const [type] = view.filters.type;
  const matching = records.filter((r) => !type || r.type === type);
  if (view.sort === "name" && view.direction === "desc") matching.reverse();
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const page = Math.min(view.page, lastPage);
  const data = matching.slice((page - 1) * perPage, page * perPage);
  return { data, current_page: page, last_page: lastPage, per_page: perPage, total: matching.length, from: data.length ? (page - 1) * perPage + 1 : null, to: data.length ? (page - 1) * perPage + data.length : null };
};
const pageAt = (url, only) => ({
  component: "SeveralLists",
  props: { errors: {}, ...Object.fromEntries(listNames.filter((name) => !only || only.includes(name)).map((name) => [name, paginate(name, url.searchParams)])) },
  url: url.pathname + url.search,
  version: null,
  clearHistory: false,
  encryptHistory: false,
});

window.delay = 200;
window.fail = false;
window.visits = [];

const wait = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new HttpCancelledError()); });
});
http.setClient({
  async request(config) {
    const url = new URL(config.url, location.href);
    for (const [key, value] of Object.entries(config.params ?? {})) url.searchParams.append(key, value);
    const headers = Object.fromEntries(Object.entries(config.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
    const only = headers["x-inertia-partial-data"]?.split(",");
    window.visits.push({ search: url.search, only: only ?? null });
    await wait(window.delay, config.signal);
    if (window.fail) throw new HttpCancelledError();
    return { status: 200, data: JSON.stringify(pageAt(url, only)), headers: { "x-inertia": "true", "content-type": "application/json" } };
  },
});

createInertiaApp({ page: pageAt(new URL(location.href)), resolve: () => SeveralLists });
