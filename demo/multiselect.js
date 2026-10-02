// The Vue section of multiselect.html. Its props match the Blade template in
// tests/browsers.spec.js, which compares the two renders.
import { createApp, h, ref } from "vue";
import Multiselect from "../resources/js/Multiselect.vue";

createApp({
  setup() {
    const sizes = ref(["m"]);
    const options = [{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }];
    const colours = [{ value: "b", label: "Black" }, { value: "w", label: "White" }];
    return () => h("div", { class: "flex flex-wrap items-end gap-3" }, [
      h("div", { class: "field" }, [
        h("label", "Size"),
        h(Multiselect, { modelValue: sizes.value, "onUpdate:modelValue": (v) => (sizes.value = v), name: "size", label: "Size", options, required: true, max: 2 }),
      ]),
      h("div", { class: "field" }, [
        h("label", "Colour"),
        h(Multiselect, { modelValue: ["b"], name: "colour", label: "Colour", options: colours, form: "elsewhere", disabled: true }),
      ]),
      h("button", { type: "button", class: "btn ghost", onClick: () => (sizes.value = []) }, "Clear"),
      h("output", { class: "text-sm" }, `v-model: ${JSON.stringify(sizes.value)}`),
    ]);
  },
}).mount("#vue-demo");
