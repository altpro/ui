// The Vue section of file.html. Upload stands in for the app: it fills progress
// as a real upload's onUploadProgress would, then sets errors as a 422 would.
import { createApp, h, ref } from "vue";
import FileInput from "@ui/FileInput.vue";

createApp({
  setup() {
    const photos = ref([]), progress = ref([]), errors = ref({});
    const contract = ref(null);
    const upload = () => {
      errors.value = {};
      progress.value = photos.value.map(() => 0);
      const tick = setInterval(() => {
        progress.value = progress.value.map((p, i) => Math.min(100, p + 10 + i * 5));
        if (progress.value.every((p) => p === 100)) {
          clearInterval(tick);
          progress.value = [];
          errors.value = photos.value.length > 1 ? { "photos.1": ["The photo may not be larger than 5 MB."] } : {};
        }
      }, 200);
    };
    return () => h("form", { class: "grid max-w-3xl gap-6" }, [
      h("div", { class: "field" }, [
        h("label", { for: "photos" }, "Photos"),
        h(FileInput, { modelValue: photos.value, "onUpdate:modelValue": (v) => (photos.value = v), id: "photos", name: "photos", accept: "image/*", multiple: true, errors: errors.value, progress: progress.value },
          () => h("span", "PNG or JPEG, up to 5 MB each.")),
        h("div", { class: "flex gap-2" }, [
          h("button", { type: "button", class: "btn primary", disabled: !photos.value.length, onClick: upload }, "Upload"),
          h("button", { type: "button", class: "btn ghost", onClick: () => (errors.value = { photos: ["Add no more than 10 photos."] }) }, "Show a field error"),
          h("button", { type: "reset", class: "btn ghost" }, "Reset"),
        ]),
        h("output", { class: "text-sm" }, `v-model: [${photos.value.map((f) => f.name).join(", ")}]`),
      ]),
      h("div", { class: "field" }, [
        h("label", { for: "contract" }, "Signed contract"),
        h(FileInput, { modelValue: contract.value, "onUpdate:modelValue": (v) => (contract.value = v), id: "contract", name: "contract", accept: ".pdf,.docx" }),
        h("output", { class: "text-sm" }, `v-model: ${contract.value?.name ?? "null"}`),
      ]),
      h("div", { class: "field" }, [
        h("label", { for: "archived" }, "Archived attachments"),
        h(FileInput, { id: "archived", multiple: true, disabled: true }),
      ]),
    ]);
  },
}).mount("#vue-demo");
