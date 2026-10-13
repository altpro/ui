# Unsaved changes (pattern)

No class. Asks before the user leaves a form with changes they have not saved: Inertia's `router.on("before")` for visits inside the app, and `beforeunload` for a reload, a closed tab or a typed URL. It goes with the [save bar](save-bar.md), whose status line already says "Unsaved changes" while `form.isDirty`. The edit page in [recipes.md](recipes.md) uses it, and `demo/app/recipe-product.html` in the altpro/ui repository runs it.

A composable the app keeps once:

```js
// resources/js/composables/useUnsavedChanges.js
import { onMounted, onUnmounted } from "vue";
import { router } from "@inertiajs/vue3";

// Asks before leaving while `form.isDirty`: Inertia visits with confirm(), and a reload, a closed tab or a typed URL
// with the browser's own prompt. Call it once in the page's setup with its useForm().
export function useUnsavedChanges(form, message = "You have unsaved changes. Leave this page and lose them?") {
  const onBeforeUnload = (event) => form.isDirty && event.preventDefault();
  let stop = () => {};

  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    stop = router.on("before", (event) => {
      const { method, prefetch, only, except } = event.detail.visit;
      // the form's own submit, a prefetch on hover and a partial reload of this page do not leave it
      const leaving = method === "get" && !prefetch && !only.length && !except.length;
      if (leaving && form.isDirty && !confirm(message)) event.preventDefault();
    });
  });
  onUnmounted(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    stop();
  });
}
```

and one line in each page with a form worth guarding:

```vue
<script setup>
import { useForm } from "@inertiajs/vue3";
import { useUnsavedChanges } from "@/composables/useUnsavedChanges";

const props = defineProps({ product: { type: Object, required: true } });
const form = useForm({ name: props.product.name });
useUnsavedChanges(form);
</script>
```

- In the app, the question is a native `confirm()`: the browser makes it modal, focuses it and reads it out, and it holds up the visit with no more code. OK goes, Cancel stays with the edits as they were.
- Leaving the app or reloading shows the browser's own prompt, with the browser's own wording; no page can change it. Browsers only show it after the user has interacted with the page, which anyone with unsaved changes has.
- Not leaving: the form's own submit (a `put`, `post` or `delete`), a link prefetching on hover, and a partial reload of this page (`only` or `except`, as a DataTable on the page sends). Everything else that is a `get` asks.
- A successful save makes the saved data the defaults, so `isDirty` is false again and the next visit goes without asking. Discard (`reset()`) does the same.
- Back and Forward restore the previous page from history without a visit, so neither event fires and nothing asks.
- A form that marks itself dirty on load (a `Field` turning models into ids, see [field.md](field.md)) asks on every visit; call `form.defaults()` on mount, as field.md says.
