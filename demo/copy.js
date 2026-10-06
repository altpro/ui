// The Vue examples on copy.html, one small app per section.
import { createApp, h } from "vue";
import CopyButton from "@ui/CopyButton.vue";

const mount = (selector, render) => createApp({ setup: () => render }).mount(selector);

mount("#copy-inline", () => h("p", { class: "text-sm" }, [
  "Order ", h("span", { class: "font-mono" }, "ORD-1042"), " ",
  h(CopyButton, { value: "ORD-1042", label: "Copy order number" }),
]));

mount("#copy-join", () => h("div", { class: "field max-w-sm" }, [
  h("label", { for: "tracking" }, "Tracking code"),
  h("div", { class: "join flex" }, [
    h("input", { class: "input flex-1 font-mono", id: "tracking", readonly: true, value: "JD014600006281234567" }),
    h(CopyButton, { class: "outlined", value: "JD014600006281234567", label: "Copy tracking code" }),
  ]),
]));

mount("#copy-dl", () => h("dl", { class: "dl horizontal max-w-xl" }, [
  h("div", [h("dt", "Order"), h("dd", ["ORD-1042 ", h(CopyButton, { value: "ORD-1042", label: "Copy order number" })])]),
  h("div", [h("dt", "Email"), h("dd", ["ann@example.com ", h(CopyButton, { value: "ann@example.com", label: "Copy email" })])]),
  h("div", [h("dt", "Reference"), h("dd", ["INV-2026-0091 ", h(CopyButton, { class: "outlined xs", value: "INV-2026-0091", label: "Copy reference" }, () => "Copy")])]),
]));
