// The line beside Save in a .save-bar: "Unsaved changes" while the form differs from its defaults, "No changes to save."
// after Save on a clean form (which sends nothing), and "Saved." after a save that worked. Save stays enabled on a
// clean form, so pressing it there says why nothing happened. See save-bar.md.
import { computed, ref, watch } from "vue";
import type { ComputedRef } from "vue";

export function useSaveStatus(
  form: { isDirty: boolean; recentlySuccessful: boolean; processing?: boolean },
  options: {
    /** What a save that worked says, for a form whose saves differ: "Draft saved." or "Published.". Default "Saved.". */
    saved?: () => string;
  } = {},
): {
  /** For the bar's `<p role="status">`. Empty when there is nothing to say, so the line takes no room. */
  saveStatus: ComputedRef<string>;
  /**
   * Call it from Save when `form.isDirty` is false, instead of sending. A second button that also has nothing to send
   * names its own reason: `noteNothingToSave("No changes to publish.")`.
   */
  noteNothingToSave: (message?: string) => void;
} {
  const nothingToSave = ref<string | null>(null);
  // the note goes once there is something to save again, or a save starts (another button's, with nothing changed)
  watch([() => form.isDirty, () => form.processing], ([dirty, processing]) => {
    if (dirty || processing) nothingToSave.value = null;
  });

  const saveStatus = computed(() => {
    if (form.isDirty) return "Unsaved changes";
    if (nothingToSave.value) return nothingToSave.value;
    return form.recentlySuccessful ? (options.saved?.() ?? "Saved.") : "";
  });

  return { saveStatus, noteNothingToSave: (message = "No changes to save.") => (nothingToSave.value = message) };
}
