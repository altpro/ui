// The reader's local day, which changes at their midnight, so words such as "Today" don't go stale on a page left open.
// One clock is shared by everything on the page, and it stops once nothing uses it. LocalDate.vue reads it.
import { onScopeDispose, readonly, ref } from "vue";
import type { Ref } from "vue";

const localDay = (): string => new Date().toDateString();

const today = ref(localDay());
let users = 0;
let midnightTimer: ReturnType<typeof setTimeout> | undefined;

const refresh = (): void => {
  today.value = localDay();
};

function scheduleMidnight(): void {
  clearTimeout(midnightTimer);
  const midnight = new Date();
  midnight.setHours(24, 0, 1, 0);
  midnightTimer = setTimeout(() => {
    refresh();
    scheduleMidnight();
  }, midnight.getTime() - Date.now());
}

// a timer is held back while the tab sleeps, so coming back to it checks the day as well
const onVisibilityChange = (): void => {
  if (document.visibilityState !== "visible") return;
  refresh();
  scheduleMidnight();
};

/** The reader's day as `Date.toDateString()` gives it. Read it in a computed to work the words out again at midnight. */
export function useToday(): Readonly<Ref<string>> {
  // a server render draws no dates, so it needs no clock
  if (typeof document === "undefined") return readonly(today);

  if (users++ === 0) {
    refresh();
    scheduleMidnight();
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  onScopeDispose(() => {
    if (--users > 0) return;
    clearTimeout(midnightTimer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  });

  return readonly(today);
}
