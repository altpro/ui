# TODO

The components the first CMS, CRM and order-management apps need are built. This list is what is left before tagging v0.1.0, from a fourth review pass (13 October 2026: CSS, Vue and PHP, and the skill against the code, plus a second agent's review), and what waits until an app asks. Everything under "Before tagging" ships in v0.1.0. Anything needing JavaScript stays a Vue component only.

## Before tagging v0.1.0

### Bugs

The test suite passes with every one of these, so each fix brings its regression test.

- [ ] **Blade field crashes on a date**: `field.blade.php:44` runs `array_map('strval', (array) $value)`, which turns a Carbon (any `date` cast) into its properties and throws "Array to string conversion", a 500. Reproduced with `:value="now()"`. Without the crash a Carbon would print as `Y-m-d H:i:s`, which a date input rejects, so the field shows blank and saving writes null. Only build `$picked` when there are `$options`, and format a `DateTimeInterface` with the `$formats` table already there. Decide whether Vue Field trims Inertia's ISO strings (`…T00:00:00.000000Z`) to the input's format, and document it either way.
- [ ] **Vue boolean Field unticked for `1`**: `Field.vue:111` binds the checkbox with `v-model`, and `looseEqual(1, true)` is false. An uncast column (`is_active: 1` or `"1"`) shows unticked; Blade ticks it. In an Inertia `<Form>` without v-model, `useDomModel` reads the unticked box back, so saving turns the setting off.
- [ ] **FileInput out of step with the form**: the watch that writes the model into the native input (`FileInput.vue:64`) is not `immediate`, so a file passed in at mount is listed but the input is empty and a plain form post leaves it out. Setting `input.files` in code fires no event, so Inertia's `<Form>` stays clean after a drop and dirty after removing a picked file. Make the watch immediate and dispatch `change` after the component's own changes.
- [ ] **Multiple FileInput sends one file**: `name="photos" multiple`, as file-input.md documents, sends `photos` several times and PHP keeps the last (`FileInput.vue:100`, `Field.vue:136`). Append `[]` when `multiple`, as `Combobox.vue` does.
- [ ] **Combobox creates when creation is off**: with no results, ArrowUp clamps `active` to 0 (`Combobox.vue:207`), and `pick(0)` takes `0 === list.length` for the Add option and calls `add()`, which never checks `canCreate`: a POST to `/undefined` and "Could not add…". Guard `add()` with `canCreate`, and keep `active` at -1 while `count` is 0.
- [ ] **Combobox picks a stale result**: with `src`, typing and pressing Enter inside the 250 ms debounce picks the first result of the previous query, because the `[q, remote]` watcher (`Combobox.vue:161`) puts the old results forward. Barcode scanners and fast typists hit it. Pick nothing while `loading`.
- [ ] **Malformed table URLs throw**: `?page=9223372036854775807` overflows the offset ("The float … is not representable as an int"), as `TableQuery.php:122` accepts any run of digits; a date filter with `%00` throws a `ValueError` from `createFromFormat` (`TableQuery.php:212`). Both reproduced. Bound the page, check dates against `^\d{4}-\d{2}-\d{2}$` before parsing, and add both to `tests/table-urls.json` so `dataTable.ts` agrees.
- [ ] **Clear filters does nothing**: when a filter's default matches no rows, `clearAll` (`dataTable.ts:430`) writes the defaults back, the URL does not change and `apply` returns. Write each filter present but empty, or show the button only while the view is narrowed.
- [ ] **Step numbers are CSS counters**: `steps.css:23-53`, which WebKit miscounts and the rules ban. Put the number in the markup (a marker `<span>` or `content: attr(data-step)`) and update steps.md.
- [ ] **Focused button in a `.join`**: `.join > *:not(:first-child)` and `.btn:is(:focus-visible, …)` tie on specificity and `join.css` is imported after `button.css` (`ui.css:8-9`), so the start border keeps the divider colour instead of the ring. Import `join.css` first (avatar stays after it). The a11y test checks only the outline; make it check the border too.
- [ ] **Invalid dropzone turns grey on hover**: `dropzone.css:57` sets `border-color`, which beats the red that arrives through `--dropzone-border`. Set the var instead.
- [ ] **Timeline warning dot fails 3:1**: `timeline.css:79` uses the raw `--color-warning` (L 0.8), about 1.5:1 on white. Add a `--color-warning-accent` token in `theme.css`; it also replaces the five copies of `light-dark(oklch(from var(--color-warning) 0.5 c h), …)` in button, badge, alert and progress (twice).
- [ ] **Tooltip replaces the host's pseudo-elements**: `[data-tooltip]::before/::after` (`tooltip.css:21`) ties with `.btn.loading::before` and is imported later, so a loading button with a tooltip loses its spinner; breadcrumb, tabs, combobox, accordion, nav and tree draw their own `::before`/`::after` too. Say in tooltip.md that the tooltip goes on an element that draws none, or on a wrapper.
- [ ] **Reset timer after unmount**: `onFormReset` runs its handler in a `setTimeout` (`FileInput.vue:66`, `Field.vue:102`); a reset that unmounts the component throws on a null ref. Return early when the ref is gone.

### Skill fixes

The agent copies these as written. Paths are in `resources/boost/skills/altpro-ui/references/`.

- [ ] **PHP classes without a namespace**: `recipes.md` (Product 25, Photo 60, Tag 74, ProductPolicy 82, UpdateProductRequest 252, ProductController 369, ProductMediaController 569, TagController 635) and `destructive-action.md:78` start with no `namespace`, so a copied file is "Class not found". Tag shares Photo's block and its `use` lines; give it its own. `check.md:92` and `app-shell.md:505` are right.
- [ ] **Toast example uses `innerHTML`**: `toast.md:10`. Copied with a customer name or a server message, it is an XSS hole. Use `textContent`, as the later examples do.
- [ ] **Sign-in as Inertia**: `validation-failure.md:222-240` shows `<Form action="/login">` "as Laravel's starter kit does", but app-shell.md makes sign-in pages Blade. Use a profile form.
- [ ] **Small contradictions**:
  - `button.md:13-19` draws its icon as a hand-written path with no `aria-hidden`; use `<Plus class="size-4" aria-hidden="true" />`, and shorten `dialog.md:11`'s path to `<svg …>…</svg>`.
  - `loading.md:20` labels the busy button "Saving"; button.md keeps "Save".
  - The save bar in `long-form.md:184` has no `print:hidden`, which save-bar.md and SKILL.md promise.
  - The drawer in `app-shell.md:67,254` uses `w-72`; dialog.md says `[--dialog-w:18rem]`, never `w-*`.
  - `datatable.md:87` renders `'Brands/Index'` and `app-component.md:118` says `Components/`; the skill uses lowercase folders.
  - `datatable.md:106` calls `Date::parse` without importing the facade.
  - The Blade user menu (`app-shell.md:117`) does not uppercase the initials; the Vue one does.
- [ ] **Files the package does not ship**: `recipes.md:7-11`, `app-shell.md:27`, `destructive-action.md:3`, `unsaved-changes.md:3` and `validation-failure.md:175` point at `demo/app/` and `tests/recipes.spec.js`, which `.gitattributes` keeps out of the Composer download. Say "in the altpro/ui repository", as SKILL.md:237 does.
- [ ] **Value imports from `@ui/dataTable`**: the `./js/*` export adds no `.ts`, so only `import type` works on an npm install. The docs only use `import type`; say so, or add `"./js/dataTable": "./resources/js/dataTable.ts"` to the exports.

### API to settle

Renaming any of these after the tag is a **Breaking** entry.

- [ ] **DataTable selection**: it emits `update:selection` but has no `selection` prop (`DataTable.vue:55`), so `v-model:selection` is silently one-way and `selection` falls through to the root `<div>`. Add the prop, or rename the event (`@select`).
- [ ] **Page size has three names**: the `paginate` prop (`DataTable.vue:35`), `$perPage` in TableQuery, `per_page` in the URL. Settle on one, probably `per-page`.
- [ ] **Default sort differs**: DataTable sorts by the first sortable column when none is given; `TableQuery` (`TableQuery.php:55,100`) does not sort, so the header arrow and the rows disagree unless `defaultSort` is passed. Default `$defaultSort` to the first sortable key.
- [ ] **Repeater**: `errors` takes an object only (`Repeater.vue:17`) where Field and FileInput take a string, array or object; and its row heading is a hard-coded `<h3>` (`Repeater.vue:82`). Accept the same shapes, and add a heading level prop.

### Polish

None of it changes an app's markup.

- [ ] **Literal colours in components**: `oklch(0 0 0 / …)` shadows and backdrop (`dialog.css:23-24`, `dropdown.css:19`, `input.css:96`, `toast.css:16`) and `light-dark(black, white)` hover mixes (`button.css:16`, `badge.css:13`, `input.css:176`). Add `--color-shadow`, `--color-backdrop` and a hover-mix token.
- [ ] **One top-level block per component**: `check.css` has five, `progress.css` three.
- [ ] **Logical properties**: `dl.css:24,38` use `margin-top`.
- [ ] **Forced colours**: a selected table row (`table.css:67`) and a solid badge lose their fill, and with it the only sign of their state.
- [ ] **Firefox and Safari checks**: the dialog's exit transition animates `overlay` (`dialog.css:35,44,58`), which only Chromium supports; check a closing modal does not jump, and wrap it in `@supports (overlay: auto)` if it does. Safari has no `closedby`; say so in dialog.md. `.inverse` relies on style container queries and is only tested in Chromium (`a11y.spec.js:641`); add it to `browsers.spec.js`.
- [ ] **Variant gaps**: `.alert` and timeline items have no `secondary`; badge has `sm` and `lg` only where other sized components run `xs` to `xl`.
- [ ] **Undocumented custom properties**: `--dropzone-border`, `--dropzone-radius`, `--dropzone-ring` (file-input.md has no custom-properties line), `--card-inner`, `--progress-danger`, `--progress-warn`, `--drawer-from`. Document them or call them internal.

### Release

- [ ] **The kit as the real consumer**: build it against this repo as a path repository. Its CI covers install, Boost discovery, the type check and the build, so this repo needs no consumer fixture of its own. The recipes' list, bulk and upload controllers still only run against `demo/app/server.js`. Try each once in an app made from the kit (list and search, an invalid save, a successful save, an upload) before the first real app relies on them.
- [ ] **Date the changelog**: `CHANGELOG.md` says "0.1.0 (unreleased)".
- [ ] **Tag `v0.1.0`** once the kit installs and builds clean. The kit then pins `^0.1`.

## When an app asks

- [ ] **Kanban**: CRM pipeline. Expensive, because drag-and-drop has to work from the keyboard too. Only if a CRM needs it.
- [ ] **Repeater drag reordering**: beside the move buttons, never instead of them.

## Considered and left out

- llms.txt or an MCP server: the Boost skill does that job for a private library.
- RTL: mostly logical properties already. The switch thumb, drawer slide, and nav and breadcrumb chevrons are physical; `tree.css:115` shows the `:dir(rtl)` fix if an app ever needs it.
- Consumer-install checks in this repo's CI: the kit's CI is the consumer.
- Theme presets, an i18n system (English strings are fine for UK apps; keep them overridable by props as `searchPlaceholder` is), a standalone `kbd`.

## Not building

- **Rich text editor**: style the CMS's editor (Tiptap or similar) with the tokens, add a content style for the HTML it produces, and document one integration example.
- **Date picker**: native date inputs already work through `.field`.
- **Charts, calendars, command palette**: use a library, or leave them out.
