// A test page, not in the menu: lists whose search stays out of the URL, against a stand-in server that reads it from
// the header as TableQuery does. window.visits records each request's URL and header.
import { createInertiaApp, http, router } from "@inertiajs/vue3";
import { h } from "vue";
import { readSearchHeader, readView, SEARCH_HEADER } from "@ui/dataTable";
import PrivateSearch, { peopleOptions } from "./PrivateSearch.vue";

const people = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `${i % 3 ? "Sam" : "Alex"} ${String(i + 1).padStart(2, "0")}` }));
const perPage = 10;

const paginate = (query, header) => {
  const view = readView(query, peopleOptions);
  const term = (readSearchHeader(header).people_search ?? view.search).toLowerCase();
  const matching = people.filter((p) => p.name.toLowerCase().includes(term));
  if (view.direction === "desc") matching.reverse();
  const lastPage = Math.max(1, Math.ceil(matching.length / perPage));
  const page = Math.min(view.page, lastPage);
  const data = matching.slice((page - 1) * perPage, page * perPage);
  // withQueryString(): Laravel's paginator links carry the request's query string, a search in it included
  const first_page_url = `/app/private-search.html?${new URLSearchParams([...query].filter(([k]) => k !== "people_page"))}`;
  return { data, first_page_url, current_page: page, last_page: lastPage, per_page: perPage, total: matching.length, from: data.length ? (page - 1) * perPage + 1 : null, to: data.length ? (page - 1) * perPage + data.length : null };
};
const pageAt = (url, header, only) => {
  const record = url.searchParams.get("record");
  return {
    component: record ? "Person" : "PrivateSearch",
    props: { errors: {}, ...(record ? { person: people[Number(record) - 1] } : (!only || only.includes("people")) && { people: paginate(url.searchParams, header) }) },
    url: url.pathname + url.search,
    version: null,
    clearHistory: false,
    encryptHistory: false,
  };
};

window.visits = [];
// test hooks: the rows, to change one; a header value to answer slowly; the router, for a reload, a poll or a save
window.people = people;
window.slowFor = null;
// where the page was when each request left, which is what the browser sends as its Referer
window.referrers = [];
// the next answer's validation errors, and whether it clears the history, as a logout's does
window.errorsNext = null;
window.clearHistoryNext = false;
window.router = router;
// an app that asks for every page again after Back, as the unified CRM does (resources/js/lib/visitHandlers.ts there)
let lastUrl = null;
router.on("navigate", (event) => {
  const url = new URL(event.detail.page.url, location.href).href;
  if (window.reloadOnBack && event.detail.type === "history" && url !== lastUrl) router.reload();
  lastUrl = url;
});

http.setClient({
  async request(config) {
    const url = new URL(config.url, location.href);
    for (const [key, value] of Object.entries(config.params ?? {})) url.searchParams.append(key, value);
    const headers = Object.fromEntries(Object.entries(config.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
    const header = headers[SEARCH_HEADER.toLowerCase()] ?? null;
    const only = headers["x-inertia-partial-data"]?.split(",");
    const method = (config.method ?? "get").toLowerCase();
    window.visits.push({ url: url.pathname + url.search, header, ...(method !== "get" && { method }) });
    window.referrers.push(location.pathname + location.search);
    const slow = header !== null && window.slowFor !== null && header.includes(window.slowFor);
    // slowOnce: only the first request it matches is slow
    if (slow && window.slowOnce) window.slowFor = null;
    await new Promise((resolve) => setTimeout(resolve, slow ? 1500 : 50));
    // a save redirects back to the page it came from, which the browser follows with the same headers
    const answered = method === "get" ? url : new URL(location.href);
    const body = pageAt(answered, header, only);
    if (window.errorsNext) [body.props.errors, window.errorsNext] = [window.errorsNext, null];
    if (window.clearHistoryNext) [body.clearHistory, window.clearHistoryNext] = [true, false];
    return { status: 200, data: JSON.stringify(body), headers: { "x-inertia": "true", "content-type": "application/json" } };
  },
});

// a page reached from a row, to leave the list and come Back to it
const Person = { props: { person: Object }, setup: (props) => () => h("h2", { class: "text-xl font-semibold" }, props.person.name) };

createInertiaApp({ page: pageAt(new URL(location.href), null), resolve: (name) => (name === "Person" ? Person : PrivateSearch) });
