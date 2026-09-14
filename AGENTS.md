# nui

CSS-only component layer for Tailwind v4. Private library, consumed from GitHub via npm. Read `skills/nui/SKILL.md` first; it documents what exists.

## Layout

```
src/nui.css              entry, imports everything below
src/theme.css            @theme default tokens, all light-dark(); --radius knob on :root
src/scheme.css           color-scheme regions: .light .dark .inverse
src/components/*.css     one file per component (button, join, input, field, check, badge, avatar, nav, dropdown, tooltip)
demo/*.html              one page per component, plus index and theme
demo/demo.js             shared header (theme and radius switchers) and sidebar nav
skills/nui/SKILL.md      reference for agents in consuming projects
```

## Rules

- Naming: base class plus bare modifier words. `.btn.primary.lg`, never `.btn-primary` or `.btn-lg`.
- Before adding a modifier word, check it is not a Tailwind utility. `invert`, `contrast`, `flex`, `block`, `hidden` and similar are taken. That is why the region class is `inverse`.
- No JavaScript in `src/`. Use native HTML: `<dialog>`, `popover`, anchor positioning, `<details>`, `:has()`, style container queries.
- Browser target: current Chrome, Firefox, Safari. No Safari-only features. Chrome-only features need sign-off from Steve first.
- Colours come from tokens only. Never a literal colour inside a component.
- Everything in a component file sits in `@layer components` so Tailwind utilities override it.
- Nested CSS. One top-level block per component.
- Colour variants set `--x-*` custom properties only. Style modifiers (`outline`, `ghost`) set real properties from those vars. This keeps class order irrelevant. See `src/components/button.css`.
- Sizes set the size vars only.
- Any component that can sit inside `.join` sets `--join-divider` to the colour of the line between it and its neighbour (the button uses 30% currentColor, or its border colour when outlined). `.join` handles the radius and the 1px overlap.
- Accessibility is WCAG 2.2 AA. Every text-on-fill pairing, ghost and outline text on the page background, and every hover state must reach 4.5:1 in both schemes. Focus rings are 3px at half opacity, flush with the border, and a bordered control turns its border to the ring colour. Nothing interactive is smaller than 24px. `npm test` checks all of this with axe; a colour change that fails it is wrong, not the test.
- Do not reference Tailwind palette variables such as `--color-blue-600`. Tailwind v4 only emits theme variables that are used, so use oklch literals in `theme.css`.

## Adding a component

1. `src/components/<name>.css`, following the button file's shape.
2. Import it from `src/nui.css`.
3. `demo/<name>.html`. Copy the head and footer from `demo/button.html`. Add the page to the `components` array in `demo/demo.js` with a Lucide icon name.
4. Add a section to `skills/nui/SKILL.md` with the class table and one copy-paste example.
5. Add the page to `pages` in `tests/a11y.spec.js` and give it a hover-contrast loop if it has hover states.
6. `npm run build` and `npm test` must pass. Check the demo page in light, dark, pill and square.

## Commands

```
npm run dev      demo site with live reload
npm run build    production build of the demo into dist/
npm test         axe WCAG 2.2 AA scan of every demo page in light and dark, plus hover, focus and target-size checks
```
