// The Vue section of field.html. Its props match the Blade templates in
// tests/browsers.spec.js, which compares the two renders field by field, up to the Vue-only combobox.
import { createApp, h, reactive, ref } from "vue";
import { Form, useForm } from "@inertiajs/vue3";
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

// Three ways a password field gets emptied: a dialog over Inertia's <Form> resets on close, useForm's reset() only
// changes the model, and a native reset only tells the form. The dialog is the same shape as an app's confirm-password one.
const reveal = createApp({
  setup() {
    const confirm = ref();
    const change = useForm({ current_password: "" });
    const plain = ref("");
    return () => h("div", { class: "grid max-w-3xl gap-6 md:grid-cols-2" }, [
      h("div", { class: "flex items-end" }, h("button", { type: "button", class: "btn outlined", command: "show-modal", commandfor: "reveal-dialog" }, "Confirm with a password")),
      h("dialog", { id: "reveal-dialog", class: "dialog", "aria-label": "Confirm your password", onClose: () => confirm.value.resetAndClearErrors() }, [
        h(Form, { ref: confirm, action: "#", method: "post", class: "contents" }, {
          default: ({ errors, reset, setError }) => [
            h(Field, { name: "password", label: "Current password", type: "password", reveal: true, autocomplete: "current-password", errors }),
            h("footer", { class: "justify-end" }, [
              // reset-on-error and reset-on-success with field names go this way: the input is written, and no event fires
              h("button", { type: "button", class: "btn ghost", onClick: () => { reset("password"); setError({ password: "That password is wrong." }); } }, "Wrong password"),
              h("button", { type: "button", class: "btn outlined", command: "close", commandfor: "reveal-dialog" }, "Cancel"),
            ]),
          ],
        }),
      ]),
      h("form", { class: "grid gap-2" }, [
        h(Field, { modelValue: change.current_password, "onUpdate:modelValue": (v) => (change.current_password = v), name: "current_password", label: "With useForm", type: "password", reveal: true, autocomplete: "off" }),
        h("button", { type: "button", class: "btn outlined justify-self-start", onClick: () => change.reset() }, "Reset with useForm"),
      ]),
      h("form", { class: "grid gap-2" }, [
        h(Field, { modelValue: plain.value, "onUpdate:modelValue": (v) => (plain.value = v), name: "pin", label: "PIN", type: "password", reveal: true, prepend: "#", autocomplete: "off" }),
        h("button", { type: "reset", class: "btn outlined justify-self-start" }, "Native reset"),
      ]),
    ]);
  },
});
reveal.config.idPrefix = "reveal";
reveal.mount("#reveal-demo");
