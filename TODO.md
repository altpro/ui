# TODO

The components the first CMS, CRM and order-management apps need are built. This list is about making an app quicker to build with them, from two review passes (October 2026). Anything needing JavaScript stays a Vue component only.

## Before tagging v0.1.0

From a third pass (6 October 2026), before an agent builds the first app: a fresh `laravel new --vue --boost` app with this repo as a Composer path repository, a dry run of the skill as that agent, a code review, a comparison with daisyUI, Flux, shadcn and Nuxt UI, and a second agent's review. Everything below was checked against the source or the test app.

Apps will start from our own Vue starter kit, a separate repo that requires altpro/ui and replaces shadcn with it. The kit therefore deals with shadcn and the app-side setup, and it is the real consumer. Build it against this repo as a Composer path repository, and tag `v0.1.0` once it installs and builds clean.

### Installation

An app cannot install altpro/ui as documented yet, and when it does, the agent may never load the skill. The kit ships the app side of each item below (`boost.json`, alias, tsconfig, Lucide, the pinned version), so the README covers apps that do not start from it.

- [x] **Publish the repo**: private at `altpro/ui`; README and SKILL.md name it.
- [x] **Boost opt-in**: `boost:list-skills` finds `altpro-ui`, but `boost:install -n` and `boost:update -n` never install it. It only lands (SKILL.md and all of `references/`) once the app's `boost.json` has `"packages": ["altpro/ui"]`, or someone ticks it at the interactive prompt. The kit ships that `boost.json`; say so in the README install steps for everything else.
- [x] **Boost guideline**: Boost writes guidelines into the app's AGENTS.md on every run but loads skills only when one triggers, and the test app's AGENTS.md never mentions altpro. Boost's own `tailwindcss-development` skill claims "cards, tables, navbars, forms, inputs, badges", so it can trigger first. Add `resources/boost/guidelines/core.blade.php`, 5–10 lines: use altpro/ui classes, load the altpro-ui skill before writing markup, `btn primary` not `btn-primary`, `danger` not `destructive`. Add one more line for apps made with Laravel's own `laravel new --vue`: shadcn's `@theme inline` tokens in `app.css` override altpro's (in the test build, `--color-primary` became `#171717` and `--radius` `.5rem`), so start from our kit instead. Removing shadcn is the kit's job, so the skill needs no starter-kit section. Check that the guideline reaches the app's AGENTS.md.
- [x] **TypeScript setup for both installs**: SKILL.md:45 gives only the Composer `paths` entry. With that entry, the Composer test app type-checks clean. A packed npm install fails a strict `vue-tsc` with missing declarations for Field.vue and Combobox.vue until the package's `resources/js` is in the app's tsconfig `include`. Document the full tsconfig for npm and for Composer.
- [x] **Lucide in the install steps**: SKILL.md:63 makes `@lucide/vue` and `mallardduck/blade-lucide-icons` the icon rule, but neither is installed anywhere. Add the two install commands to Setup and the README.
- [x] **Version-pinned install commands**: README and SKILL.md show `composer require altpro/ui` with no constraint. Use `altpro/ui:^0.1` (npm: `github:<owner>/ui#v0.1.0`).
- [x] **Changelog**: `CHANGELOG.md` with a **Breaking** heading per release. On 0.x a breaking change bumps the minor, which `^0.1` already stops at.
- [x] **Package contents**: `.claude/settings.local.json` is tracked and ships in the Composer download; untrack it and gitignore it. Add `export-ignore` for `TODO.md`, `CONTEXT.md`, `.claude`, `.github` and `tsconfig.json`.

### Bugs

- [x] **Forced colours**: no file has a `forced-colors` rule. The checkbox tick, radio dot and switch thumb are `background: currentColor` on `::before` (`check.css:55`), which forced colours removes, so checked and unchecked look the same. Check the progress and range fills too. Add a Playwright case with `forcedColors: 'active'`.
- [x] **Control boundary contrast**: the light `--color-border` (`oklch(0.9 0 0)`) is about 1.35:1 on white. An empty input or checkbox identified only by its border needs 3:1 (WCAG 1.4.11). Add a control-border token for inputs, checks and the dropzone; keep `--color-border` for dividers. Test the 3:1 in `a11y.spec.js`.
- [x] **Combobox create guards**: `add()` (`Combobox.vue:162`) checks neither `creating` nor `capped`. Pressing Enter twice quickly sends two create requests, and at `max` "Add…" still creates a server record, then leaves it unselected. Guard inside `add()`, not just on the option. Add regression tests.
- [x] **Search is case-sensitive on Postgres**: `TableQuery.php:189` uses `orWhere($column, 'like', …)`. SQLite and MySQL ignore case, Postgres does not, and client mode does. Use `orWhereLike` (ILIKE on Postgres).
- [x] **Combobox in a Field is 12rem**: `combobox.css:22` fixes the width, `field.css` only stretches a `.join`, and `Field.vue` puts `class` on the `.field`. Customer and product pickers come out narrower than the inputs around them. Stretch `.field > .combobox`.
- [x] **CI on both Laravel versions**: composer.json allows Laravel 12 and 13, but with `composer.lock` gitignored CI only ever installs 13. Add a matrix with `--prefer-lowest` for 12.

### Skill fixes

The agent will copy these as written.

- [x] **One flash payload**: `app-shell.md:286-292` flashes a string and toasts `event.detail.flash.toast`; `toast.md` and `recipes.md` flash `['type' => …, 'message' => …]`. Mixed, the toast reads "[object Object]". The Blade side differs as well: `session('status')` in app-shell.md, `session('toast')` in toast.md. Use toast.md's shape and listener everywhere.
- [x] **DataTable sort key**: `datatable.md:14` names the column `created_at`, but `sortable: ['name', 'added' => 'created_at']` allows `added`. Sorting by "Added" quietly falls back to name while the arrow says otherwise. Make them agree.
- [x] **Authorization in the copied code**: the bulk and media controllers in `recipes.md` (around 325 and the photo actions) authorise only in the notes beneath (387, 588). Put `Gate::authorize` in the code. Show the app's permitted-record query, for example a scope, applied to both the index and `bulk()`, so "matching" selections cannot reach rows the list hides.
- [x] **One shell, matching the kit**: recipe pages do not use `AppLayout` though recipes.md:17 says the layout wraps them. Each draws its own breadcrumb while the shell draws one from a prop, so following both gives two. `scroll-pb-20` and the toaster's position are page-level instructions that live in the root view. The kit will have a real `AppLayout` too; if it differs from app-shell.md the agent gets two answers. Make app-shell.md describe the kit's layout and root view (with `scroll-pb-20` and the toaster), and wrap the recipes in it.
- [x] **Dialogs in `space-y-*`**: dialog.md:36 warns against a `space-y-*` parent, and every recipe page uses `space-y-gap`, so a dialog placed on the page sits off-centre. Use `flex flex-col gap-gap` in the recipes.
- [x] **Complete snippets**: `field.md`, `repeater.md`, `file-input.md` and `combobox.md` use `useForm`, `form` or `props` without a `<script setup>`; `datatable.md` uses `Link` without importing it and never declares `Brand`. Make each a complete SFC.
- [x] **Small contradictions**: `button.md:11` says a loading button names what is happening ("Saving"), while `save-bar.md:13` and the recipes keep "Save"; pick one. `app-shell.md:271` says a persistent layout reads the breadcrumb from `usePage().props`, but the code takes a prop.

### Patterns

Each one a reference file with complete code, and where there is behaviour, a `demo/app/` recipe page so the browser tests cover it.

- [x] **Validation failure**: an error summary announced on a failed save, focus on the summary or the first invalid field. Also where focus goes after an Inertia visit.
- [x] **Destructive action**: a confirm dialog with `useForm().delete`, a pending state, staying open on a 422 (wrong password) with the error in the dialog, closing on success, focus returned to the trigger. The kit's delete-account setting is the first real use; build it from this pattern.
- [x] **Unsaved changes**: a navigation guard to go with the save bar (`router.on('before')` plus `beforeunload` while `form.isDirty`). save-bar.md:25 calls it the app's job.
- [x] **Links**: Tailwind's reset leaves an `<a>` in text, `.dl` or `.alert` looking like plain text (WCAG 1.4.1). A link style for content, and a rule in SKILL.md.
- [x] **Headings and long forms**: one heading scale (the `h1` is written two ways, in app-shell.md:126 and record-header.md:9), form sections with `<fieldset>`, and switches that save on toggle (check.md:21 recommends them with no code).
- [x] **Print**: `@media print` forcing the light scheme and hiding nav, header, toaster and save bar, for invoices and packing slips.
- [x] **Not daisyUI**: the class names overlap (btn, badge, card, join, tabs, steps, stat), so an agent will write `card-body`, `join-item`, `badge-success`, `alert-error`, `modal`. A short table of what to write instead, and a grep for `\b(btn|badge|alert|card|join|tabs?|input)-[a-z]`.
- [x] **An app's own component**: how to add one in the app (`@layer components`, tokens, `--x-*` vars, bare modifier words). SKILL.md says never rebuild one but not how to add one.

### If the kit ships SSR

Laravel's Vue kit ships `build:ssr`; decide whether ours does. Fixed anyway, since they cost nothing without SSR, but not yet tried under a real SSR render.

- [x] `DataTable.vue:81-84` reads page size and hidden columns from `localStorage` in setup, so server and client render differently. Read them in `onMounted`.
- [x] `dataTable.ts:103` takes the locale from `document.documentElement.lang`, so the server formats dates as en-GB. Take it from a prop or page props.
- [x] `CopyButton.vue:39` teleports to `body` during hydration. Mount the Teleport after `onMounted`.

### Then

- [ ] **The kit as the real consumer**: build it against this repo as a path repository. Its CI covers install, Boost discovery, the type check and the build, so this repo needs no consumer fixture of its own. The recipes' list, bulk and upload controllers still only run against `demo/app/server.js`. Try each once in an app made from the kit (list and search, an invalid save, a successful save, an upload) before the first real app relies on them.
- [ ] **Tag `v0.1.0`** (moved from below), once the kit installs and builds clean. The kit then pins `^0.1`.

Considered and left out: llms.txt or an MCP server (the Boost skill does that job for a private library), RTL (mostly logical properties already; only `tooltip.css` uses left/right), theme presets, an i18n system (English strings are fine for UK apps; keep them overridable by props as `searchPlaceholder` is), a standalone `kbd`.

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
- [ ] **Tag `v0.1.0`**: moved to "Before tagging v0.1.0" above. With no tags a Composer VCS install can only track `dev-main`. Bump on breaking changes; apps pin `^0.1`.

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
