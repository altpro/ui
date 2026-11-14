// The line beside Save in a .save-bar: "Unsaved changes" while the form differs from its defaults, "No changes to save."
// after Save on a clean form (which sends nothing), and "Saved." after a save that worked. Save stays enabled on a
// clean form, so pressing it there says why nothing happened. See save-bar.md.
import { computed, ref, watch } from "vue";
import type { ComputedRef } from "vue";

export function useSaveStatus(form: { isDirty: boolean; recentlySuccessful: boolean }): {
  /** For the bar's `<p role="status">`. Empty when there is nothing to say, so the line takes no room. */
  saveStatus: ComputedRef<string>;
  /** Call it from Save when `form.isDirty` is false, instead of sending. */
  noteNothingToSave: () => void;
} {
  const nothingToSave = ref(false);
  watch(
    () => form.isDirty,
    () => (nothingToSave.value = false),
  );

  const saveStatus = computed(() => {
    if (form.isDirty) return "Unsaved changes";
    if (nothingToSave.value) return "No changes to save.";
    return form.recentlySuccessful ? "Saved." : "";
  });

  return { saveStatus, noteNothingToSave: () => (nothingToSave.value = true) };
}
