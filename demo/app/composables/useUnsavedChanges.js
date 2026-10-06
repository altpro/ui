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
