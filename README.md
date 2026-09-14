# nui

An HTML and CSS component layer for Tailwind v4. Tailwind does layout; nui does the components, so `<button class="btn primary lg">` replaces a line of utilities. No JavaScript. Native `<dialog>`, popovers, `<details>` and friends do the interactive parts.

## Install

```
npm install github:<owner>/nui
```

```css
@import "tailwindcss";
@import "nui";

/* optional */
@theme {
  --color-primary: oklch(0.6 0.2 30);
  --color-primary-foreground: white;
}
:root { --radius: 9999px; }
```

Copy or symlink `skills/nui/SKILL.md` into the consuming project's `.claude/skills/nui/` so Claude knows the classes.

## Develop

```
npm install
npm run dev
npm test     # WCAG 2.2 AA checks with axe, light and dark
```

`AGENTS.md` has the conventions. `skills/nui/SKILL.md` is the class reference.
