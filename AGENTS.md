# altpro/ui

CSS component layer for Tailwind v4, with Vue components for anything that needs JavaScript and a few Blade components that save markup. Private library: Laravel apps install it with Composer (`altpro/ui`), anything else with npm (`@altpro/ui`), both from this GitHub repo. Read `resources/boost/skills/altpro-ui/SKILL.md` first; it lists what exists and links each component's reference file.

## Layout

```
resources/css/ui.css         entry, imports everything below; @source points Tailwind at the Blade and Vue templates
resources/css/theme.css      @theme default tokens, all light-dark(); --radius knob and responsive --spacing-gap on :root
resources/css/scheme.css     color-scheme regions: .light .dark .inverse
resources/css/components/    one file per component (button, join, input, field, dropzone, check, badge, dl, avatar, nav, breadcrumb, dropdown, combobox, tooltip, card, dialog, accordion, tree, table, datatable, alert, tabs, progress, range, loading, steps, timeline, toast, repeater)
resources/views/components/  Blade components, rendered as <x-ui::name>
resources/js/                Vue components (Name.vue); domModel.js lets Field.vue work without v-model inside a form; DataTable.vue is Vue only, TypeScript, and needs Inertia; dataTable.json holds the page sizes TableQuery reads too
resources/boost/skills/      reference for agents in consuming projects; Laravel Boost installs the whole directory. SKILL.md holds the rules and a component table; each component is a file in references/
resources/boost/guidelines/  core.blade.php, the few lines Boost writes into the app's AGENTS.md/CLAUDE.md on every run: load the skill, the naming rule
src/UiServiceProvider.php    registers the Blade components and the ui-views publish tag; Laravel discovers it from composer.json
src/TableQuery.php           server half of DataTable.vue: reads the view and filters from the query string as dataTable.ts does, then searches, sorts and pages
demo/*.html                  one page per component, plus index and theme
demo/app/                    sample store (Forma): one Vue app, Workspace.vue, behind four pages listed under Application in the menu; its screen styles are app.css. The recipe-*.html pages are the app shell's Inertia root view running the skill's app code (layouts/AppLayout.vue, components/UserMenu.vue, pages/, composables/, toast.js, written as references/*.md show them) against server.js, a stand-in for the Laravel side; vite.config.js maps `@` to demo/app and @lucide/vue to lucide.js for them
demo/demo.css                Tailwind, ui.css and the shell's styles
demo/demo.js                 shared shell: sidebar menu, header with breadcrumb, scheme switcher and a theme drawer for colour tokens and radius
tests/blade.php              renders a Blade string through Testbench, for the browser tests
tests/table-query.php        TableQuery against in-memory SQLite
tests/table-view.ts          tableView (what DataTable.vue shows for a view) and readView/viewUrl under plain Node
tests/table-urls.json        URL-to-view cases both of the above read, so the PHP and TS halves agree on the query-string format
tests/inventory.test.js      the "Adding a component" checklist below as a test; a component whose demo page or reference has another name goes in its aliases map
tests/skill-code.test.js     a reference code block headed with a resources/js/ path equals that file in demo/app/ where the demo has it, and every demo page, layout and composable is one, so the skill shows the code the browser tests run
tests/a11y.spec.js           axe and the hover, focus and target-size checks; its PNG reader reads pixels from screenshots, because getComputedStyle cannot see vendor pseudo-elements (::-webkit-progress-value, ::-webkit-slider-thumb), and it is a few lines over node:zlib rather than a dependency
```

## Rules

- Naming: base class plus bare modifier words. `.btn.primary.lg`, never `.btn-primary` or `.btn-lg`.
- Before adding a modifier word, check it is not a Tailwind utility. `invert`, `contrast`, `flex`, `block`, `hidden` and similar are taken. That is why the region class is `inverse`.
- No JavaScript in `resources/css/`. Use native HTML first: `<dialog>`, `popover`, anchor positioning, `<details>`, `:has()`, style container queries.
- When CSS cannot do it, the behaviour goes in a Vue component, `resources/js/<Name>.vue`. JavaScript components are Vue only: no custom elements and no Blade version of them. Blade pages get the CSS and native HTML.
- A Blade component only where it saves real markup and needs no JavaScript. A button does not need `<x-ui::button>`. Where a Blade component has a Vue twin (field), both render the same markup and `tests/browsers.spec.js` compares them.
- Browser target: current Chrome, Firefox, Safari. No Safari-only features. Chrome-only features need sign-off from Steve first. Signed off so far: `appearance: base-select` on selects in `input.css`, behind `@supports`, so other browsers keep the native select.
- Colours come from tokens only. Never a literal colour inside a component.
- Everything in a component file sits in `@layer components` so Tailwind utilities override it.
- Nested CSS. One top-level block per component.
- Colour variants set `--x-*` custom properties only. Style modifiers (`outlined`, `ghost`) set real properties from those vars. This keeps class order irrelevant. See `resources/css/components/button.css`.
- Sizes set the size vars only.
- Any component that can sit inside `.join` sets `--join-divider` to the colour of the line between it and its neighbour (the button uses 30% currentColor, or its border colour when outlined). `.join` handles the radius and the 1px overlap.
- Accessibility is WCAG 2.2 AA. Every text-on-fill pairing, text in the ghost and outlined variants, and every hover state must reach 4.5:1 in both schemes. Focus rings are 3px at half opacity, flush with the border, and a bordered control turns its border to the ring colour. Nothing interactive is smaller than 24px. `npm test` checks all of this with axe; a colour change that fails it is wrong, not the test.
- Do not reference Tailwind palette variables such as `--color-blue-600`. Tailwind v4 only emits theme variables that are used, so use oklch literals in `theme.css`.
- Do not use CSS counters for anything a user reads: WebKit miscounts them.
- A change an app must act on (a renamed class, modifier, prop or token, changed markup) goes under **Breaking** in `CHANGELOG.md` and bumps the minor version while on 0.x.
- Demo-only classes and custom properties are prefixed `demo-` and stay in `demo/` (`demo.css` for the shell, `demo/app/app.css` for the sample screens). They are scaffolding for the demo, not library API: never move one into `resources/` or document it in the skill.

## Adding a component

1. `resources/css/components/<name>.css`, following the button file's shape.
2. Import it from `resources/css/ui.css`.
3. `demo/<name>.html`. Copy the head and footer from `demo/button.html`. Add the page to the `components` array in `demo/demo.js` with a Lucide icon name, plus `js` as a fourth item if it has a Vue component.
4. Add `resources/boost/skills/altpro-ui/references/<name>.md` with the class table and one copy-paste example, and a row for it in the Components table in SKILL.md.
5. If it has hover states, give it a hover-contrast loop in `tests/a11y.spec.js`. The axe scan finds the page itself.
6. If it needs JavaScript: `resources/js/<Name>.vue` and a Vue instance on the demo page. A markup-only Blade component goes in `resources/views/components/<name>.blade.php`.
7. `npm run build` and `npm test` must pass. Check the demo page in light, dark, pill and square.

## Commands

```
composer install       Testbench, so the tests can render Blade (needs PHP 8.3+)
git config core.hooksPath .githooks   pre-commit and pre-merge-commit run npm run build
npm run dev            demo site with live reload
npm run build          production build of the demo into dist/
npm test               test:unit, then every Playwright spec: test:a11y and test:browsers below, and the rest in Chromium
npm run test:unit      vue-tsc type check, TableQuery, tableView, the inventory and skill-code tests; no browser
npm run test:a11y      axe WCAG 2.2 AA scan of every demo page in light and dark, plus hover, focus and target-size checks (Chromium)
npm run test:browsers  the Firefox/WebKit matrix
```
