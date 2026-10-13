// The Vue section of field.html. Its props match the Blade templates in
// tests/browsers.spec.js, which compares the two renders field by field, up to the Vue-only combobox.
import { createApp, h, reactive, ref } from "vue";
import { Form } from "@inertiajs/vue3";
import Field from "@ui/Field.vue";

createApp({
  setup() {
    // what a controller hands over: models, and Laravel's errors keyed by dot name
    const categories = [{ id: 1, name: "News" }, { id: 2, name: "Sport" }, { id: 3, name: "Culture" }];
    const tags = [{ id: 1, name: "Laravel", slug: "laravel" }, { id: 2, name: "Vue", slug: "vue" }, { id: 3, name: "Tailwind", slug: "tailwind" }];
    const errors = { "tags.1": ["The selected tag is invalid."], bio: ["At least 20 characters.", "Mention where you work."] };
    const form = reactive({ email: "", category_id: categories[1], tags: [tags[0], tags[2]], price: "12.50", size: "m", extras: ["gift"], newsletter: 1, bio: "Hi", published_on: null, available_from: "2026-10-13T09:30:00.000000Z", attachments: [], password: "" });
    const field = (key, props) => h(Field, { modelValue: form[key], "onUpdate:modelValue": (v) => (form[key] = v), errors, ...props });
    return () => h("div", { class: "grid max-w-3xl gap-6 md:grid-cols-2" }, [
      field("email", { name: "email", type: "email", required: true, autocomplete: "email", hint: "We never share it." }),
      field("category_id", { name: "category_id", type: "select", options: categories, placeholder: "Choose one" }),
      field("price", { name: "price", type: "number", prepend: "£", step: "0.01" }),
      field("size", { name: "size", type: "radio", options: { s: "Small", m: "Medium", l: "Large" } }),
      field("extras", { name: "extras[]", type: "checkbox", options: { gift: "Gift wrap", card: "Card" } }),
      field("newsletter", { name: "newsletter", type: "switch", label: "Send me the newsletter" }),
      field("bio", { name: "bio", type: "textarea", rows: 3 }),
      field("published_on", { name: "published_on", type: "date", now: true }),
      // a datetime cast as Inertia sends it; the field keeps the part the input takes
      field("available_from", { name: "available_from", type: "datetime-local" }),
      field("attachments", { name: "attachments", type: "file", multiple: true }),
      // Vue only, so they come after the fields the Blade parity test compares
      field("tags", { name: "tags", type: "combobox", multiple: true, options: tags, max: 2, hint: "Up to two." }),
      field("password", { name: "password", type: "password", reveal: true, autocomplete: "new-password" }),
      h("output", { class: "text-sm md:col-span-2" }, `v-model: ${JSON.stringify(form)}`),
    ]);
  },
}).mount("#vue-demo");

// Inside Inertia's <Form>: no v-model, the inputs hold the data, and reset() writes to them directly.
// A second app on the page counts useId() from v-0 again, so it needs its own prefix.
const inertia = createApp({
  setup() {
    const tags = [{ id: 1, name: "Laravel" }, { id: 2, name: "Vue" }, { id: 3, name: "Tailwind" }];
    // options that change under a live selection: Laravel goes, Svelte arrives
    const topics = ref(tags);
    const others = [tags[1], tags[2], { id: 4, name: "Svelte" }];
    return () => h(Form, { action: "#", method: "post", class: "grid max-w-3xl gap-6 md:grid-cols-2" }, {
      default: ({ errors, reset, setError }) => [
        h(Field, { name: "headline", value: "Hello", errors }),
        h(Field, { name: "topics", type: "combobox", multiple: true, options: topics.value, value: [tags[0]], max: 2, errors }),
        h(Field, { name: "featured", type: "switch", errors }),
        h("div", { class: "flex gap-2 md:col-span-2" }, [
          h("button", { type: "button", class: "btn", onClick: () => setError({ headline: "An error from setError." }) }, "Show an error"),
          h("button", { type: "button", class: "btn ghost", onClick: () => reset() }, "Reset"),
          h("button", { type: "button", class: "btn ghost", onClick: () => reset("topics[]") }, "Reset topics"),
          h("button", { type: "button", class: "btn ghost", onClick: () => (topics.value = others) }, "Other topics"),
        ]),
      ],
    });
  },
});
inertia.config.idPrefix = "form";
inertia.mount("#inertia-demo");
