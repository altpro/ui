// The Vue section of multiselect.html. Its props match the Blade template in
// tests/browsers.spec.js, which compares the two renders.
import { createApp, h, ref } from "vue";
import Multiselect from "../resources/js/Multiselect.vue";

createApp({
  setup() {
    const sizes = ref(["m"]);
    const options = [{ value: "s", label: "Small" }, { value: "m", label: "Medium" }, { value: "l", label: "Large" }];
    return () => h("div", { class: "flex flex-wrap items-center gap-3" }, [
      h(Multiselect, { modelValue: sizes.value, "onUpdate:modelValue": (v) => (sizes.value = v), name: "size", label: "Size", options }),
      h("button", { type: "button", class: "btn ghost", onClick: () => (sizes.value = []) }, "Clear"),
      h("output", { class: "text-sm" }, `v-model: ${JSON.stringify(sizes.value)}`),
    ]);
  },
}).mount("#vue-demo");
