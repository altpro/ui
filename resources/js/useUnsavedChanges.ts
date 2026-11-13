// Ask before leaving a form with unsaved changes: Inertia visits with confirm(), and a reload, a closed tab or a typed
// URL with the browser's own prompt. Call it once in the page's setup, with its useForm() or a function that says
// whether there is anything to lose. See unsaved-changes.md.
import { nextTick, onMounted, onUnmounted, toRaw, watch } from "vue";
import { router } from "@inertiajs/vue3";

let leavingAnyway = false;
let stopLeaving: VoidFunction | undefined;

/**
 * Leave without asking, from anywhere in the app: a logout for inactivity, say, where a prompt would keep the page, and
 * whatever it shows, on screen for whoever comes to the computer next. The guards are back once the next page has
 * landed in the app (the login page the logout went to), so the next reader's forms ask again.
 */
export function leaveWithoutAsking(): void {
  leavingAnyway = true;
  stopLeaving ??= router.on("navigate", () => {
    leavingAnyway = false;
    stopLeaving?.();
    stopLeaving = undefined;
  });
}

// The reader's answer to the leave question, by the visit's `before` event, which every guard is handed: the first
// guard with unsaved changes asks, and the others on the page take its answer rather than asking again.
const answers = new WeakMap<Event, boolean>();

// A guarded form's own submit is under way. Inertia's `before` event fires inside it, so a put, post or delete that
// starts meanwhile is a form on the page saving, not the reader leaving. It counts for every guard: a save that comes
// back (`back()`, the usual answer) keeps the page and the other forms' edits, and one that lands on another page leaves
// their drafts in this history entry, for Back to bring.
let ownSubmits = 0;

type Data = Record<string, unknown>;
type RememberingForm = {
  isDirty: boolean;
  processing: boolean;
  data: () => Data;
  defaults: (fields?: Data | string, value?: unknown) => unknown;
};
// `at` orders a draft against the last time its group was cleared (see cleared below)
type Draft = { data: Data; defaults: Data; at: number };
type Stored = { group?: string; url?: string; draft?: Draft | null };

// A copy of the form's data to keep in history, which the form's later changes cannot reach: never Vue's proxy, which
// history cannot store, and a File as it is, as nothing changes one.
const copy = (value: unknown): unknown => {
  const raw = toRaw(value);
  if (Array.isArray(raw)) return raw.map(copy);
  if (raw instanceof Set) return new Set([...raw].map(copy));
  if (raw instanceof Map) return new Map([...raw].map(([key, v]) => [key, copy(v)]));
  if (raw instanceof Date) return new Date(raw);
  if (raw !== null && typeof raw === "object" && Object.getPrototypeOf(raw) === Object.prototype) {
    return Object.fromEntries(Object.entries(raw).map(([key, v]) => [key, copy(v)]));
  }
  return raw;
};

// Laravel's dontFlash: never kept in a draft, as history state outlives the page, the session and a logout. At any
// depth (`user.password`, `accounts.0.password`), and left empty rather than left out, so the draft keeps the form's
// shape and the field comes back empty.
const secret = new Set(["password", "password_confirmation", "current_password"]);
const hide = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(hide);
  if (value === null || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) return value;
  return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, secret.has(key) ? "" : hide(v)]));
};
const keepable = (data: Data) => hide(copy(data)) as Data;
const sameFields = (a: Data, b: Data) => Object.keys(a).sort().join() === Object.keys(b).sort().join();
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
// a time that only goes forward, so a draft and a clearing in the same millisecond still come in order
let last = 0;
const clock = () => (last = Math.max(Date.now(), last + 1));

// When each group's draft was last cleared (a save, a Discard, an OK to leaving), kept for the tab in sessionStorage.
// Only the entry in view hears of it, and the group's other entries keep the draft they hold: within the document
// `latest` speaks for them, and after a reload, a page outside the app or a duplicated tab this does, so a draft from
// before the clearing never comes back. The newest 200 groups are kept.
const clearedKey = "altpro-ui:cleared-drafts";
const readCleared = (): Record<string, number> => {
  try {
    return JSON.parse(sessionStorage.getItem(clearedKey) ?? "{}");
  } catch {
    return {};
  }
};
const markCleared = (group: string) => {
  const cleared = { ...readCleared(), [group]: clock() };
  try {
    sessionStorage.setItem(clearedKey, JSON.stringify(Object.fromEntries(Object.entries(cleared).sort(([, a], [, b]) => b - a).slice(0, 200))));
  } catch {
    // storage full or blocked: within the document `latest` still knows
  }
};
// The page each key's form was on when the document went (a reload, a link out of the app), so a reload the reader
// agreed to can clear its group: a reload starts that entry afresh, and the group's other entries must not bring back
// what the reader agreed to lose.
const lastPage = (key: string) => `altpro-ui:draft-page:${key}`;
const reloadsChecked = new Set<string>();
const isReload = () => (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";

// A field of the defaults by its dotted name, as useForm's defaults("items.0.name", value) takes it: an array stays an
// array, and a missing step becomes an array when the next key is a number.
const setPath = (target: unknown, keys: string[], value: unknown): unknown => {
  const [key, ...rest] = keys as [string, ...string[]];
  const base = target !== null && typeof target === "object" ? target : /^\d+$/.test(key) ? [] : {};
  const out = (Array.isArray(base) ? [...base] : { ...base }) as Record<string, unknown>;
  out[key] = rest.length ? setPath(out[key], rest, value) : hide(copy(value));
  return out;
};
const withField = (data: Data, path: string, value: unknown): Data => {
  // items[0].name as items.0.name, as Inertia's setter reads both
  const keys = path.replace(/\[(\w+)\]/g, ".$1").split(".");
  return keys.some((key) => secret.has(key)) ? data : (setPath(data, keys, value) as Data);
};

// Each draft as it is now, by the id of the history entries it belongs to. History writes trail the typing by up to
// 200ms and an entry may be left in between, so a return within the document reads this. A new document starts it
// empty: a reload, which also drops the reloaded entry's remembered state, but not the other entries'.
const latest = new Map<string, Draft | null>();
// the keys of the drafts the mounted pages keep, as two forms under one key would take each other's draft
const keysInUse = new Set<string>();

/**
 * Back and Forward bring a page back from history with no visit, so nothing can ask before they leave it. Instead, a
 * form's unsaved draft rides in the page's history entries with the defaults it differs from, and comes back still
 * unsaved when the reader returns. Inertia's own remember key would bring the draft back as the defaults, so the form
 * would look saved and Save would have nothing to send. A reload or a fresh visit to the page starts from the server's
 * data.
 *
 * One draft serves every history entry the page makes while it stays mounted (a sort, a filter, a search on a list
 * beside the form), so Back through them keeps the latest edits, and a save or a Discard leaves none of them a draft.
 * A save of this form that lands at another URL (a create page redirecting to the record) starts a new draft there.
 */
function rememberDraft(form: RememberingForm, key: string) {
  // The data the draft differs from. The form starts clean, so it starts as the form's data, and the form is clean again
  // whenever isDirty turns false: after the page takes its defaults again on mount (a Field writing ids into the form),
  // a save and Discard.
  let defaults = keepable(form.data());
  watch(
    () => form.isDirty,
    (dirty) => {
      if (!dirty) defaults = keepable(form.data());
    },
  );
  // and whatever the page makes the defaults itself: what a save sent while the reader kept typing, say
  const setDefaults = form.defaults;
  form.defaults = function (this: RememberingForm, fields?: Data | string, value?: unknown) {
    const result = setDefaults.call(this, fields, value);
    defaults =
      fields === undefined ? keepable(form.data()) : typeof fields === "string" ? withField(defaults, fields, value) : { ...defaults, ...keepable(fields) };
    // a draft already kept differs from these defaults now
    record();
    return result;
  };

  // The URL of the page's own history entry. Writes go only there, as location.href moves before the page does: Back
  // changes it, then cancels the visits in flight and only then swaps the page.
  let pageUrl = "";
  const here = () => location.href.split("#")[0]!;
  let group: string | null = null;
  let mounted = false;
  let saving = false;
  // the reader has agreed to leave, or the page has said the form no longer matters: nothing records it again
  let leaving = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let written = 0;
  const write = () => {
    clearTimeout(timer);
    timer = undefined;
    written = Date.now();
    if (group && mounted && here() === pageUrl) {
      router.remember({ group, url: pageUrl, draft: latest.get(group) ?? null } satisfies Stored, key);
    }
  };
  // The draft is held at once. History gets it at once after a quiet spell, and otherwise at most five times a second,
  // as Safari throws after a hundred history writes in ten seconds.
  const record = () => {
    if (!group || !mounted || leaving) return;
    if (!form.isDirty && latest.get(group) !== null) markCleared(group);
    latest.set(group, form.isDirty ? { data: keepable(form.data()), defaults, at: clock() } : null);
    if (timer) return;
    const wait = written + 200 - Date.now();
    if (wait <= 0) write();
    else timer = setTimeout(write, wait);
  };
  // Nothing to bring back: the reader has agreed to leave, or this form is being saved. Written at once, so it lands
  // in this entry before the visit's answer pushes the next one.
  const forget = () => {
    if (!group) return;
    latest.set(group, null);
    markCleared(group);
    write();
  };
  watch([() => form.isDirty, () => form.data()], record, { deep: true });

  // A visit that keeps the page mounted at another URL, pushed or replaced, carries the draft to it: Inertia copies the
  // remembered state into the new entry, and it is written again with the new URL. A save of this form landing there
  // is another record, or a new one, so it starts a draft of its own.
  const follow = () => {
    if (!group || !mounted || here() === pageUrl) return;
    pageUrl = here();
    if (saving) group = newId();
    written = 0;
    record();
  };
  const stop = [
    router.on("success", follow),
    router.on("navigate", follow),
    router.on("finish", (event) => {
      const { method, cancelled, interrupted } = event.detail.visit;
      // A failed save is still unsaved, and so is one Back cut short: held for this entry, though Back has already
      // moved the location, so only a return within the document finds it. A get cut short (a leave the reader said
      // OK to) has nothing to add.
      if (method !== "get" || !(cancelled || interrupted)) record();
      if (method !== "get") saving = false;
    }),
  ];
  // A full page load (a typed URL, a link out of the app) takes the draft as it is now, not as it was 200ms ago, and
  // notes the page for a reload to find.
  const onPageHide = () => {
    if (timer) write();
    if (!group) return;
    try {
      sessionStorage.setItem(lastPage(key), JSON.stringify({ group, url: pageUrl, at: Date.now() }));
    } catch {
      // storage blocked: a reload then leaves the group's other entries their drafts
    }
  };

  // after the page's own mount, which may take the form's defaults again
  onMounted(() =>
    nextTick(() => {
      mounted = true;
      if (keysInUse.has(key)) {
        console.warn(`useUnsavedChanges: two forms keep a draft under "${key}". Give each its own { remember: "…" }.`);
        return;
      }
      keysInUse.add(key);
      addEventListener("pagehide", onPageHide);
      pageUrl = here();
      // The first page of a document that a reload of this page started: the reader agreed to lose its draft. Only a
      // note the page left as this document's navigation began will do (the old document goes after the new one
      // starts), not one from an earlier departure: a reload of another page has nothing to say about this one. Read
      // once, then gone.
      if (!reloadsChecked.has(key)) {
        reloadsChecked.add(key);
        try {
          const left = JSON.parse(sessionStorage.getItem(lastPage(key)) ?? "null") as { group?: string; url?: string; at?: number } | null;
          sessionStorage.removeItem(lastPage(key));
          if (isReload() && left?.group && left.url === pageUrl && (left.at ?? 0) >= performance.timeOrigin) markCleared(left.group);
        } catch {
          // nothing noted, or storage blocked
        }
      }
      const stored = router.restore(key) as Stored | undefined;
      // an entry another URL left (a copy Inertia made before this page could write its own) is not this page's
      const ours = stored?.group !== undefined && stored.url === pageUrl;
      group = ours ? stored.group! : newId();
      // within the document the latest draft; from history, one made since the group was last cleared
      const fromHistory = stored?.draft && stored.draft.at > (readCleared()[group] ?? 0) ? stored.draft : null;
      const draft = !ours ? null : latest.has(group) ? latest.get(group) : fromHistory;
      // a draft another form left under this key (a page that has changed shape since) is not this form's
      if (!draft || !sameFields(draft.data, keepable(form.data()))) return;
      try {
        setDefaults.call(form, draft.defaults);
      } catch {
        return; // a form whose data is a function has no defaults to set, so its draft cannot come back
      }
      defaults = draft.defaults;
      Object.assign(form, draft.data);
    }),
  );
  onUnmounted(() => {
    mounted = false;
    clearTimeout(timer);
    stop.forEach((off) => off());
    removeEventListener("pagehide", onPageHide);
    if (group) keysInUse.delete(key);
  });

  return {
    /** The reader has agreed to leave, or the form no longer matters: no draft, now or after. */
    leave: () => {
      forget();
      leaving = true;
    },
    /** The visit that was leaving failed or was stopped, so the page and its form stay, and so does their draft. */
    stay: () => {
      if (!leaving) return;
      leaving = false;
      record();
    },
    /** A non-GET visit has started. This form's own submit leaves no draft behind; another form's leaves it alone. */
    submitting: () => {
      if (!form.processing) return;
      saving = true;
      forget();
    },
  };
}

export function useUnsavedChanges(
  source: { isDirty: boolean } | (() => boolean),
  options: string | { message?: string; remember?: string | false } = {},
): { allowLeaving: () => void } {
  const { message = "Leave this page? Your changes won't be saved.", remember = "unsavedChanges" } =
    typeof options === "string" ? { message: options } : options;
  const dirty = typeof source === "function" ? source : () => source.isDirty;
  // useForm's get, post, put, patch and delete all go through its submit
  const form = source as { submit?: (...args: unknown[]) => unknown };
  if (typeof source !== "function" && typeof form.submit === "function") {
    const submit = form.submit;
    form.submit = function (this: unknown, ...args: unknown[]) {
      ownSubmits++;
      try {
        return submit.apply(this, args);
      } finally {
        ownSubmits--;
      }
    };
  }
  const draft =
    remember !== false && typeof source !== "function" && typeof (source as Partial<RememberingForm>).data === "function"
      ? rememberDraft(source as RememberingForm, remember)
      : null;

  // Set once the user has said they will leave, or the page has said the form no longer matters (allowLeaving), so a
  // visit that ends in a full page load (a Blade page, an external redirect) is not asked about a second time
  let agreed = false;
  const stay = () => {
    agreed = false;
    draft?.stay();
  };

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (dirty() && !agreed && !leavingAnyway) event.preventDefault();
  };

  let stop: VoidFunction[] = [];
  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
    stop = [
      router.on("before", (event) => {
        const { method, prefetch, only, except, url, preserveState, async } = event.detail.visit;
        // Acts once every listener has had its say, and only if none cancelled the visit (another page's guard, a
        // second form's question). The visit has started by then (useForm's processing is set) and its answer has
        // not yet pushed the next history entry, prefetched or not.
        const ifGoing = (then: () => void) => queueMicrotask(() => event.defaultPrevented || then());
        // a visit allowLeaving let go that another guard's Cancel stopped: the page stays, and so does this guard
        if (agreed && !prefetch) queueMicrotask(() => event.defaultPrevented && stay());
        // A save may land on another page (a create page redirecting to the record), which would leave the draft
        // behind as unsaved, inviting a second save; a failed one brings it back when it finishes.
        if (method !== "get") ifGoing(() => draft?.submitting());
        // A prefetch on hover and a partial reload of this page do not leave it. A put, post or delete may (Log out, a
        // Duplicate that lands on the copy) unless it is a guarded form saving or runs in the background (`async`, as
        // an optimistic switch does). A function source cannot tell its own form's save from the rest, so lets them all go.
        const sending = method !== "get";
        const leaving =
          !prefetch && !only.length && !except.length &&
          (!sending || (typeof source !== "function" && !ownSubmits && !async));
        if (!leaving || agreed || leavingAnyway || !dirty()) return;

        if (!sending && url.href === window.location.href) {
          // a reload that keeps the page's state brings fresh props and leaves the draft alone
          if (preserveState === true) return;
          // anything else here would remount the page and drop the draft: a link to this page does nothing
          event.preventDefault();
          return;
        }

        // OK: the reader was told the changes would not be saved, so Back does not bring them back either
        if (!answers.has(event)) answers.set(event, confirm(message));
        if (answers.get(event))
          ifGoing(() => {
            agreed = true;
            draft?.leave();
          });
        else event.preventDefault();
      }),
      // a visit that stayed in the app has landed or failed, so no full page load is coming after all
      router.on("success", stay),
      router.on("error", stay),
      router.on("httpException", stay),
      router.on("networkError", stay),
      // a visit cancelled on its way (its cancel token) fires none of those
      router.on("finish", (event) => event.detail.visit.cancelled && stay()),
    ];
  });
  onUnmounted(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
    stop.forEach((off) => off());
  });

  return {
    /**
     * Call in the `onBefore` of a visit that ends the page's need for the form, such as deleting the record it edits
     * (`onStart` comes after the guard has asked). If the visit fails, the guard is back.
     */
    allowLeaving: () => {
      agreed = true;
      draft?.leave();
    },
  };
}
