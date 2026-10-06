# TODO

The components the first CMS, CRM and order-management apps need are built. This list is about making an app quicker to build with them, from two review passes (October 2026). Anything needing JavaScript stays a Vue component only.

## Fix first

- [x] **FileInput reset**: a native form reset empties the input's files but leaves the list and v-model populated. `FileInput.vue` never listens for the form's `reset` event (`domModel.js` does, for the other field types, but returns the model unchanged for `file`). Clear the model on reset, so `<Field type="file">` follows, and add a regression test to `tests/browsers.spec.js`.
- [x] **Theme example fails contrast**: the `--color-primary: oklch(0.6 0.2 30)` override in `README.md`, `demo/index.html` and SKILL.md measures 4.34:1 against white. Darken it until it passes 4.5:1 and use the same value in all three; examples meet the same bar as the defaults.
- [x] **DataTable selection wording**: SKILL.md says "any change to this table's view except a page change goes back to page one and clears the selection", but a page change clears the selection too (`DataTable.vue` watches the page). Two sentences: what resets the page, what clears the selection.
- [x] **Repeater error caveat**: the comment in `Repeater.vue` (an in-place `setError` or a partial `clearErrors` after a move maps stale positions; fine while errors come from responses) belongs in the skill's Repeater section, not only in the source.

## Make an app quicker to build

In this order: the shell and recipes save the most time on the first app; the split and setup notes save it on every one after.

- [x] **App shell (pattern)**: the first thing every app needs and the one thing the skill does not have. A copy-paste Blade layout and an Inertia layout: sidebar `.nav`, header with `.breadcrumb` and a scheme switcher, `main` with `p-gap`, and how the sidebar collapses on a phone. `demo/demo.js` builds one in JavaScript; the recipe is the HTML it produces.
- [x] **Page recipes**: two screens that chain the patterns already documented. List page: breadcrumb, record header, DataTable. Edit page: breadcrumb, record header, form of `Field`s, save bar. Each with every import and the controller beside it.
- [x] **Complete, runnable recipes**: the component sections are thorough but assembling a screen still takes inference, and some snippets assume `useForm` is imported or a variable exists. Three end-to-end examples with every import, prop, endpoint response and submission handler: a Laravel/Inertia edit form (defaults, validation errors, save, discard); a server-driven DataTable (controller, filter declaration, `only`, a bulk action endpoint re-running `TableQuery::search()`); a combobox with `src` and `create` endpoints plus a FileInput upload handler with progress. Build them as `demo/app/` pages with a simulated server, as `Order.vue` does, so the browser tests cover them.
- [x] **Icons**: every svg in the skill is `…`. One line naming the icon package per stack (Lucide for Vue and Blade) and the `size-4 aria-hidden="true"` convention, so an app does not hand-write paths.
- [x] **Flash to toast**: the Toast section is a vanilla script. Add the Inertia form: a watcher on the page's flash prop that appends an `.alert` to the toaster, and the controller side (`->with('success', …)`).
- [x] **Vite alias for vendor imports**: `README.md` imports `../../vendor/altpro/ui/resources/js/Field.vue`, which depends on where the importing file lives. Document a `@ui` alias in the app's `vite.config.js` and use it in every example after.
- [x] **Dependency matrix in README**: three rows, CSS only, Vue components, DataTable (Vue and Inertia), with the packages and Vite plugins each needs and the versions supported.
- [x] **Lifecycle notes per Vue component**: under each component's props table, a short list of what happens when v-model, `options`, `errors` or the form's defaults change after mount. These matter more in an app than another modifier example. Start with Repeater (above), then Field, Combobox, FileInput.
- [x] **Split the skill**: SKILL.md is 82KB, about 20k tokens, and loads whole. Keep the rules, class composition, a component decision table (one line each: what it is for, CSS or Vue or Blade), tokens and scheme regions in SKILL.md; move each component section to a reference file beside it. Check first that Laravel Boost installs the whole skill directory, not the one file. Update AGENTS.md step 4.

## Make mistakes cheaper to catch

- [x] **Inventory test**: a `node --test` file asserting every `resources/css/components/*.css` is imported in `ui.css`, has a demo page, is in the `components` array in `demo/demo.js`, is in `pages` in `tests/a11y.spec.js`, and has a heading in SKILL.md; and that every `demo/**/*.html` is in the a11y scan. Turns the seven-step checklist in AGENTS.md into a failing test, and stops the hand-kept page lists drifting.
- [x] **Type check**: `vue-tsc --noEmit` over `resources/js` and `tests/table-view.ts`, run first in `npm test`. The TypeScript in `DataTable.vue` and `dataTable.ts` is never checked today.
- [x] **Focused test commands**: `test:unit` (PHP and Node), `test:a11y`, `test:browsers`, so a CSS change does not wait for the three-browser matrix. Note them in AGENTS.md.
- [x] **Tag `v0.1.0`**: with no tags a Composer VCS install can only track `dev-main`. Tag now, bump on breaking changes, and apps pin `^0.1` once adoption starts.

## Housekeeping

- [x] `CONTEXT.md` is a glossary for DataTable only. Kept as the glossary; it grows as terms arrive.
- [x] AGENTS.md: record that the Chrome-only `appearance: base-select` in `input.css` was signed off, and point the test description at the hand-rolled PNG reader in `tests/a11y.spec.js` so the next reader knows why it is there.
- [x] Delete the stray `undefined/` directory at the repo root (two gitignored screenshots from a tool mishap).

## When an app asks

- [ ] **Kanban**: CRM pipeline. Expensive, because drag-and-drop has to work from the keyboard too. Only if a CRM needs it.
- [ ] **Repeater drag reordering**: beside the move buttons, never instead of them.

## Not building

- **Rich text editor**: style the CMS's editor (Tiptap or similar) with the tokens, add a content style for the HTML it produces, and document one integration example.
- **Date picker**: native date inputs already work through `.field`.
- **Charts, calendars, command palette**: use a library, or leave them out.
