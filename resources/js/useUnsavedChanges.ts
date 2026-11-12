// Ask before leaving a form with unsaved changes: Inertia visits with confirm(), and a reload, a closed tab or a typed
// URL with the browser's own prompt. Call it once in the page's setup, with its useForm() or a function that says
// whether there is anything to lose. See unsaved-changes.md.
import { onMounted, onUnmounted } from "vue";
import { router } from "@inertiajs/vue3";

let leavingAnyway = false;

/**
 * Leave without asking, from anywhere in the app: a logout for inactivity, say, where a prompt would keep the page, and
 * whatever it shows, on screen for whoever comes to the computer next.
 */
export function leaveWithoutAsking(): void {
  leavingAnyway = true;
}

export function useUnsavedChanges(
  source: { isDirty: boolean } | (() => boolean),
  message = "Leave this page? Your changes won't be saved.",
): { allowLeaving: () => void } {
  const dirty = typeof source === "function" ? source : () => source.isDirty;

  // Set once the user has said they will leave, or the page has said the form no longer matters (allowLeaving), so a
  // visit that ends in a full page load (a Blade page, an external redirect) is not asked about a second time
  let agreed = false;
  const stay = () => {
    agreed = false;
  };

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (dirty() && !agreed && !leavingAnyway) event.preventDefault();
  };

  let stop: VoidFunction[] = [];
  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    stop = [
      router.on("before", (event) => {
        const { method, prefetch, only, except, url, preserveState } = event.detail.visit;
        // the form's own submit, a prefetch on hover and a partial reload of this page do not leave it
        const leaving = method === "get" && !prefetch && !only.length && !except.length;
        if (!leaving || agreed || leavingAnyway || !dirty()) return;

        if (url.href === window.location.href) {
          // a reload that keeps the page's state brings fresh props and leaves the draft alone
          if (preserveState === true) return;
          // anything else here would remount the page and drop the draft: a link to this page does nothing
          event.preventDefault();
          return;
        }

        if (confirm(message)) agreed = true;
        else event.preventDefault();
      }),
      // a visit that stayed in the app has landed or failed, so no full page load is coming after all
      router.on("success", stay),
      router.on("error", stay),
      router.on("httpException", stay),
      router.on("networkError", stay),
    ];
  });
  onUnmounted(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    stop.forEach((off) => off());
  });

  return {
    /**
     * Call as a visit starts that ends the page's need for the form, such as deleting the record it edits. If the visit
     * fails, the guard is back.
     */
    allowLeaving: () => {
      agreed = true;
    },
  };
}
