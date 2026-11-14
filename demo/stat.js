// StatLink on stat.html. There is no list here, so each card's link is the page with a hash, and a click marks it
// current as a list's filterLink would.
import { createApp, h, ref } from "vue";
import { Archive, CircleCheck, PencilLine } from "@lucide/vue";
import StatLink from "@ui/StatLink.vue";

const statuses = [
  { value: "Active", count: 1204, icon: CircleCheck, hue: "green" },
  { value: "Draft", count: 3, icon: PencilLine },
  { value: "Archived", count: 0, icon: Archive },
];

createApp({
  setup() {
    const current = ref("Draft");
    return () =>
      h("nav", { class: "grid grid-cols-3 gap-gap", "aria-label": "Filter by status" }, statuses.map((s) =>
        h(StatLink, {
          key: s.value, href: `#${s.value.toLowerCase()}`, label: s.value, count: s.count, icon: s.icon, hue: s.hue, current: current.value === s.value,
          onClick: (event) => {
            event.preventDefault();
            current.value = current.value === s.value ? "" : s.value;
          },
        })));
  },
}).mount("#stat-link");
