// The Vue examples on repeater.html, one small app per section.
import { createApp, h, ref } from "vue";
import Field from "@ui/Field.vue";
import Repeater from "@ui/Repeater.vue";

const mount = (selector, lines, errors, props = {}) => createApp({
  setup() {
    const rows = ref(lines);
    return () => h("div", { class: "max-w-xl space-y-3" }, [
      h(Repeater, { modelValue: rows.value, "onUpdate:modelValue": (v) => (rows.value = v), name: "lines", item: "line", errors, make: () => ({ product: "", qty: 1 }), ...props },
        ({ row, index, errors }) => h("div", { class: "grid gap-3 sm:grid-cols-[1fr_8rem]" }, [
          h(Field, { modelValue: row.product, "onUpdate:modelValue": (v) => (row.product = v), name: `lines.${index}.product`, label: "Product", errors }),
          h(Field, { modelValue: row.qty, "onUpdate:modelValue": (v) => (row.qty = v), name: `lines.${index}.qty`, label: "Quantity", type: "number", errors }),
        ])),
      h("output", { class: "block text-sm" }, `v-model: ${JSON.stringify(rows.value)}`),
    ]);
  },
}).mount(selector);

mount("#repeater-lines", [{ product: "Studio headphones", qty: 1 }, { product: "Spare ear pads", qty: 2 }]);
mount("#repeater-errors", [{ product: "Bookshelf speakers", qty: 1 }, { product: "Speaker cable", qty: 0 }], {
  "lines.1.qty": ["The quantity must be at least 1."],
  lines: ["An order can have at most five lines."],
});
mount("#repeater-own", [{ product: "Gift card", qty: 1 }], ["Add at least two lines.", "A gift card cannot be the only item."], { headingLevel: 4 });
