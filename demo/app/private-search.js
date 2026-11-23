// A test page, not in the menu: lists whose search stays out of the URL, against a stand-in server that reads it from
// the header as TableQuery does. window.visits records each request's URL and header.
import { createInertiaApp, http } from "@inertiajs/vue3";
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

http.setClient({
  async request(config) {
    const url = new URL(config.url, location.href);
    for (const [key, value] of Object.entries(config.params ?? {})) url.searchParams.append(key, value);
    const headers = Object.fromEntries(Object.entries(config.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
    const header = headers[SEARCH_HEADER.toLowerCase()] ?? null;
    const only = headers["x-inertia-partial-data"]?.split(",");
    window.visits.push({ url: url.pathname + url.search, header });
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { status: 200, data: JSON.stringify(pageAt(url, header, only)), headers: { "x-inertia": "true", "content-type": "application/json" } };
  },
});

// a page reached from a row, to leave the list and come Back to it
const Person = { props: { person: Object }, setup: (props) => () => h("h2", { class: "text-xl font-semibold" }, props.person.name) };

createInertiaApp({ page: pageAt(new URL(location.href), null), resolve: (name) => (name === "Person" ? Person : PrivateSearch) });
