// The examples on combobox.html, one Vue app per section. Each app counts useId() from 0, so each gets its own prefix.
import { createApp, h, ref } from "vue";
import { Form } from "@inertiajs/vue3";
import Combobox from "../resources/js/Combobox.vue";

const mount = (selector, render) => {
  const app = createApp({ setup: () => render });
  app.config.idPrefix = selector.slice(1);
  app.mount(selector);
};
const list = (...labels) => labels.map((label, i) => ({ value: i + 1, label }));
// a labelled combobox with its v-model shown beside it
const field = (label, value, props, hint) => {
  const id = hint && `hint${hint.replace(/\W+/g, "-")}`;
  return h("div", { class: "field" }, [
    h("label", label),
    h(Combobox, { label, modelValue: value.value, "onUpdate:modelValue": (v) => (value.value = v), "aria-describedby": id, ...props }),
    hint && h("p", { class: "hint", id }, hint),
    h("output", { class: "text-xs muted" }, `v-model: ${JSON.stringify(value.value)}`),
  ]);
};
const row = (...children) => h("div", { class: "flex flex-wrap items-start gap-4" }, children);

const statuses = list("Draft", "In review", "Published", "Archived");
const people = list("Aisha Khan", "Ben Carter", "Chloe Evans", "Daniel Hughes", "Ella Morgan", "Finn Walsh", "Grace Lee", "Harry Patel", "Isla Brown", "Jack Wilson", "Kate Murphy", "Leo Turner", "Mia Davies", "Noah Clarke", "Olivia Price");
const sizes = list("Small", "Medium", "Large", "Extra large");
const tags = list("Laravel", "Vue", "Tailwind", "Inertia", "PHP", "JavaScript", "CSS", "HTML", "MySQL", "Redis", "Docker", "Testing", "Accessibility", "Design");

{
  const status = ref(2), locked = ref(4);
  mount("#single", () => row(
    field("Status", status, { name: "status", options: statuses, required: true }),
    field("Locked status", locked, { options: statuses, disabled: true }),
  ));
}
{
  const assignee = ref(null), short = ref(null);
  mount("#long", () => row(
    field("Assignee", assignee, { name: "assignee_id", options: people }, "15 options: the search box appears."),
    field("Status", short, { options: statuses, searchable: true }, "searchable on a short list."),
  ));
}
{
  const picked = ref([2]), days = ref([]);
  mount("#multiple", () => row(
    field("Sizes", picked, { name: "sizes", options: sizes, multiple: true }),
    field("Delivery days", days, { name: "days", options: list("Monday", "Wednesday", "Friday"), multiple: true, max: 2, required: true }, "Up to two."),
  ));
}
{
  const picked = ref([1, 3]);
  mount("#multiple-search", () => row(field("Tags", picked, { name: "tags", options: tags, multiple: true, max: 5 }, "Up to five.")));
}

// a pretend server: answers after a delay, at most 20 rows, and fails on "fail" so the error state can be seen
const companies = ["Acme Ltd", "Birchwood Joinery", "Cobalt & Co", "Driftline Marine", "Ember Foods", "Fieldhouse Farms", "Granite Works", "Harbour Lights", "Ironbark Timber", "Juniper Gin", "Kestrel Couriers", "Lowland Dairies", "Meridian Print", "Northgate Motors", "Oakleaf Nursery", "Pebble Bay Hotel", "Quarry Lane Bakery", "Riverside Vets", "Saltmarsh Brewing", "Thistle Textiles", "Upland Outdoor", "Vale Pharmacy", "Willow Interiors", "Yardley Tools", "Zephyr Cycles"]
  .map((label, i) => ({ value: 42 + i, label }));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const searchCompanies = async (q) => {
  await delay(400 + Math.random() * 400);
  if (q === "fail") throw new Error("Server error");
  return companies.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
};
{
  const customer = ref(42);
  mount("#server", () => row(field("Customer", customer, { name: "customer_id", src: searchCompanies, options: [{ value: 42, label: "Acme Ltd" }] }, "Type “fail” to see an error.")));
}

const created = [];
const createTag = async (label) => {
  await delay(400);
  if (label.length < 3) throw new Error("The label must be at least 3 characters.");
  const tag = { value: 100 + created.length, label };
  created.push(tag);
  return tag;
};
const searchTags = async (q) => {
  await delay(200);
  return [...tags, ...created].filter((t) => t.label.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
};
{
  const picked = ref([1]), author = ref(null);
  mount("#create", () => row(
    field("Tags", picked, { name: "tags", src: searchTags, create: createTag, multiple: true, options: tags }, "Add one that is not there."),
    field("Author", author, { name: "author_id", options: people, create: createTag }),
  ));
}

// URLs: this page has no server, so these show the error state until something answers them (the tests do)
{
  const customer = ref(null);
  mount("#urls", () => row(field("Supplier", customer, { name: "supplier_id", src: "api/suppliers", create: "api/suppliers" })));
}

// a plain form that owns its data: no v-model, and its Reset button puts the starting values back
mount("#native", () => h("form", { class: "flex flex-wrap items-start gap-4", onSubmit: (e) => e.preventDefault() }, [
  h("div", { class: "field" }, [h("label", "Status"), h(Combobox, { label: "Status", name: "status", options: statuses, modelValue: 1 })]),
  h("div", { class: "field" }, [h("label", "Sizes"), h(Combobox, { label: "Sizes", name: "sizes", options: sizes, multiple: true, modelValue: [1, 2] })]),
  h("div", { class: "field" }, [h("label", "Tags"), h(Combobox, { label: "Tags", name: "tags", options: tags, multiple: true, modelValue: [3] })]),
  h("button", { type: "reset", class: "btn ghost mt-6" }, "Reset"),
]));

// Inertia's <Form>: reset() writes the inputs and fires reset
mount("#inertia", () => h(Form, { action: "#", method: "post", class: "flex flex-wrap items-start gap-4" }, {
  default: ({ reset, isDirty }) => [
    h("div", { class: "field" }, [h("label", "Assignee"), h(Combobox, { label: "Assignee", name: "assignee_id", options: people, modelValue: 3 })]),
    h("div", { class: "field" }, [h("label", "Tags"), h(Combobox, { label: "Tags", name: "tags", options: tags, multiple: true, modelValue: [1] })]),
    h("button", { type: "button", class: "btn ghost mt-6", onClick: () => reset() }, "Reset"),
    h("output", { class: "mt-8 text-xs muted" }, isDirty ? "Changed" : "Unchanged"),
  ],
}));
