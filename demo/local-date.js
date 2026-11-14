// LocalDate on local-date.html. The dates are worked out from the reader's clock, so "Today" is always today.
import { createApp, h } from "vue";
import LocalDate from "@ui/LocalDate.vue";

const ago = (days, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();
const day = (date) => date.toISOString().slice(0, 10);
const lastYear = new Date();
lastYear.setFullYear(lastYear.getFullYear() - 1, 2, 9);

const rows = [
  ["A timestamp from an hour ago", { value: ago(0, 1) }],
  ["Yesterday's", { value: ago(1) }],
  ["Four days ago", { value: ago(4) }],
  ["Last year", { value: lastYear.toISOString() }],
  ["A bare date, the same day everywhere", { value: day(new Date()) }],
  ["with-time", { value: ago(0, 1), withTime: true }],
  ["with-time, last week", { value: ago(6), withTime: true }],
];

createApp({
  render: () => [
    h("dl", { class: "dl" }, rows.flatMap(([label, props]) => [h("dt", label), h("dd", [h(LocalDate, props)])])),
    h("p", { class: "text-sm" }, ["Last login ", h(LocalDate, { value: ago(0, 3), inSentence: true, withTime: true }), "."]),
    h("p", { class: "text-sm" }, ["Last login ", h(LocalDate, { value: null }, () => "never"), "."]),
  ],
}).mount("#local-date");
