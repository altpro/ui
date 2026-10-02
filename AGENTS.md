# altpro/ui

CSS component layer for Tailwind v4, with Blade and Vue versions of the components that need markup or state. Private library: Laravel apps install it with Composer (`altpro/ui`), anything else with npm (`@altpro/ui`), both from this GitHub repo. Read `resources/boost/skills/altpro-ui/SKILL.md` first; it documents what exists.

## Layout

```
resources/css/ui.css         entry, imports everything below; @source points Tailwind at the Blade and Vue templates
resources/css/theme.css      @theme default tokens, all light-dark(); --radius knob and responsive --spacing-gap on :root
resources/css/scheme.css     color-scheme regions: .light .dark .inverse
resources/css/components/    one file per component (button, join, input, field, check, badge, avatar, nav, breadcrumb, dropdown, multiselect, tooltip, card, dialog, accordion, table, alert, tabs, progress, range, loading, steps, timeline, toast)
resources/views/components/  Blade components, rendered as <x-ui::name>
resources/js/                Vue components (Name.vue) and the custom elements they share with Blade (name.js)
resources/boost/skills/      reference for agents in consuming projects; Laravel Boost installs it
src/UiServiceProvider.php    registers the Blade components and the ui-views publish tag; Laravel discovers it from composer.json
demo/*.html                  one page per component, plus index and theme
demo/app/*.html              e-commerce sample pages; same skeleton and demo.js, listed under Application in the menu
demo/demo.js                 shared shell: sidebar menu, header with breadcrumb, scheme switcher and a theme drawer for colour tokens and radius
tests/blade.php              renders a Blade string through Testbench, for the browser tests
```

## Rules

- Naming: base class plus bare modifier words. `.btn.primary.lg`, never `.btn-primary` or `.btn-lg`.
- Before adding a modifier word, check it is not a Tailwind utility. `invert`, `contrast`, `flex`, `block`, `hidden` and similar are taken. That is why the region class is `inverse`.
- No JavaScript in `resources/css/`. Use native HTML first: `<dialog>`, `popover`, anchor positioning, `<details>`, `:has()`, style container queries.
- When CSS cannot do it, the behaviour goes in a custom element in `resources/js/<name>.js` (`<ui-name>`, light DOM). Blade and Vue both use it, so it lives once. It must never change DOM that Vue renders; setting an attribute Vue binds to the same value is fine.
- A Blade component and its Vue component render the same markup. `tests/browsers.spec.js` compares them; extend that test for each new pair. Only add them where they save real markup or hold state. A button does not need `<x-ui::button>`.
- Browser target: current Chrome, Firefox, Safari. No Safari-only features. Chrome-only features need sign-off from Steve first.
- Colours come from tokens only. Never a literal colour inside a component.
- Everything in a component file sits in `@layer components` so Tailwind utilities override it.
- Nested CSS. One top-level block per component.
- Colour variants set `--x-*` custom properties only. Style modifiers (`outlined`, `ghost`) set real properties from those vars. This keeps class order irrelevant. See `resources/css/components/button.css`.
- Sizes set the size vars only.
- Any component that can sit inside `.join` sets `--join-divider` to the colour of the line between it and its neighbour (the button uses 30% currentColor, or its border colour when outlined). `.join` handles the radius and the 1px overlap.
- Accessibility is WCAG 2.2 AA. Every text-on-fill pairing, text in the ghost and outlined variants, and every hover state must reach 4.5:1 in both schemes. Focus rings are 3px at half opacity, flush with the border, and a bordered control turns its border to the ring colour. Nothing interactive is smaller than 24px. `npm test` checks all of this with axe; a colour change that fails it is wrong, not the test.
- Do not reference Tailwind palette variables such as `--color-blue-600`. Tailwind v4 only emits theme variables that are used, so use oklch literals in `theme.css`.
- Do not use CSS counters for anything a user reads: WebKit miscounts them.

## Adding a component

1. `resources/css/components/<name>.css`, following the button file's shape.
2. Import it from `resources/css/ui.css`.
3. `demo/<name>.html`. Copy the head and footer from `demo/button.html`. Add the page to the `components` array in `demo/demo.js` with a Lucide icon name, or to `scripted` if it has a custom element in `resources/js/`.
4. Add a section to `resources/boost/skills/altpro-ui/SKILL.md` with the class table and one copy-paste example.
5. Add the page to `pages` in `tests/a11y.spec.js` and give it a hover-contrast loop if it has hover states.
6. If it gets Blade and Vue versions: `resources/views/components/<name>.blade.php`, `resources/js/<Name>.vue`, any shared `resources/js/<name>.js`, a Vue instance on the demo page, and a parity test in `tests/browsers.spec.js`. See multiselect.
7. `npm run build` and `npm test` must pass. Check the demo page in light, dark, pill and square.

## Commands

```
composer install  Testbench, so the tests can render Blade (needs PHP 8.3+)
npm run dev       demo site with live reload
npm run build     production build of the demo into dist/
npm test          axe WCAG 2.2 AA scan of every demo page in light and dark, plus hover, focus and target-size checks, and the Firefox/WebKit matrix
```
