# altpro/ui

An HTML and CSS component layer for Tailwind v4. Tailwind does layout; altpro/ui does the components, so `<button class="btn primary lg">` replaces a line of utilities. Native `<dialog>`, popovers, `<details>` and friends do the interactive parts. Components that need JavaScript, such as the combobox and DataTable, are Vue components; a few Blade components, such as the field, save markup.

## What each part needs

| Using | Packages | Vite plugins | Supported |
|-------|----------|--------------|-----------|
| CSS only (any HTML, Blade) | `tailwindcss` | `@tailwindcss/vite` | Tailwind 4.1+, Vite 7+. Blade components: PHP 8.3+, Laravel 12 or 13 |
| Vue components (Field, FileInput, Combobox, Repeater, CopyButton) | the above, plus `vue` | the above, plus `@vitejs/plugin-vue` | Vue 3.5+, plugin-vue 6+ |
| DataTable | the above, plus `@inertiajs/vue3`; `TableQuery` on the server | the above | Inertia 3+ (client and `inertiajs/inertia-laravel`), Laravel 12 or 13. Written in TypeScript, which Vite compiles without extra setup |

Current Chrome, Firefox and Safari. Some styling (the open `<select>` picker) is Chrome-only and falls back to the native control elsewhere.

## Install in Laravel

Add the repository to the app's `composer.json`, then require it:

```json
"repositories": [{ "type": "vcs", "url": "git@github.com:<owner>/ui.git" }]
```

```
composer require altpro/ui
```

The service provider is discovered automatically, so `<x-ui::field>` works straight away. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "../../vendor/altpro/ui/resources/css/ui.css";

/* optional */
@theme {
  --color-primary: light-dark(oklch(0.55 0.2 30), oklch(0.72 0.15 30));
  --color-primary-foreground: light-dark(white, oklch(0.145 0 0));
}
:root { --radius: 9999px; }
```

Vue components are imported from the package and bring their own JavaScript. Add a `@ui` alias to `vite.config.js` so the import does not depend on where the importing file lives:

```js
resolve: { alias: { "@ui": `${import.meta.dirname}/vendor/altpro/ui/resources/js` } },
```

```js
import Combobox from "@ui/Combobox.vue";
```

`composer update` updates the CSS, Blade and Vue components together. To change one Blade component for one app, copy it to `resources/views/vendor/ui/components/`, or `php artisan vendor:publish --tag=ui-views` for all of them. A copied component no longer receives updates.

Laravel Boost picks up `resources/boost/skills/altpro-ui/` (SKILL.md and its `references/`) so agents in the app know the classes and components.

## Install anywhere else

```
npm install github:<owner>/ui
```

```css
@import "tailwindcss";
@import "@altpro/ui";
```

Vue components are at `@altpro/ui/js/Combobox.vue` and alongside; alias `"@ui": "@altpro/ui/js"` to use the skill's examples as written. Copy the `resources/boost/skills/altpro-ui/` directory into the project's `.claude/skills/altpro-ui/` for Claude.

## Develop

```
npm install
composer install
npx playwright install --with-deps chromium firefox webkit
npm run dev
npm test     # detailed Chromium checks plus Firefox/WebKit coverage; renders Blade through PHP
```

`AGENTS.md` has the conventions. `resources/boost/skills/altpro-ui/` is the class reference: SKILL.md, then a file per component in `references/`.
