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

New apps start from the altpro Vue starter kit, which already requires altpro/ui and ships everything below: `boost.json`, the `@ui` alias, the tsconfig entries, Lucide and the pinned version. Do not start from Laravel's own `laravel new --vue`: its shadcn tokens in `app.css` override altpro/ui's. The rest of this section is for an app that did not start from the kit.

Add the repository to the app's `composer.json`, then require it, with Lucide for icons:

```json
"repositories": [{ "type": "vcs", "url": "https://github.com/altpro/ui.git" }]
```

```
composer require altpro/ui:^0.1
composer require mallardduck/blade-lucide-icons   # icons in Blade: <x-lucide-plus />
npm install @lucide/vue                           # icons in Vue: <Plus />
```

On 0.x a breaking change bumps the minor version, so `^0.1` never installs one; read [CHANGELOG.md](CHANGELOG.md) before raising the constraint.

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

A TypeScript app maps the alias in `tsconfig.json` too. Most of the Vue components are plain JavaScript, so `vue-tsc` also needs `allowJs`, which Laravel's Vue starter kit already sets:

```json
"compilerOptions": {
  "allowJs": true,
  "paths": { "@ui/*": ["./vendor/altpro/ui/resources/js/*"] }
}
```

`composer update` updates the CSS, Blade and Vue components together. To change one Blade component for one app, copy it to `resources/views/vendor/ui/components/`, or `php artisan vendor:publish --tag=ui-views` for all of them. A copied component no longer receives updates.

### Laravel Boost

The package ships a Boost skill, `altpro-ui` (SKILL.md and its `references/`), and a short guideline that tells agents to load the skill before writing markup. `boost:list-skills` finds them, but Boost installs a third-party package's files only once the app opts in: `boost:install -n` and `boost:update -n` skip altpro/ui until the app's `boost.json` lists it. The kit's `boost.json` already does. Elsewhere, add it and update:

```json
"packages": ["altpro/ui"]
```

```
php artisan boost:update
```

The skill lands in the agents' skills directory (`.claude/skills/altpro-ui/` for Claude Code) and the guideline in each agent's guideline file (`CLAUDE.md`, `AGENTS.md`) under `=== altpro/ui/core rules ===`. Ticking altpro/ui at the interactive `php artisan boost:install` prompt writes the same `packages` entry.

## Install anywhere else

```
npm install github:altpro/ui#v0.1.0
npm install @lucide/vue   # icons
```

```css
@import "tailwindcss";
@import "@altpro/ui";
```

Vue components are at `@altpro/ui/js/Combobox.vue` and alongside; alias `"@ui": "@altpro/ui/js"` to use the skill's examples as written. A TypeScript app needs three `tsconfig.json` entries: the path, `allowJs`, and the package in `include`, because TypeScript never reads a JavaScript file under `node_modules` it was not told to, and a strict `vue-tsc` then fails with missing declarations for Field.vue and Combobox.vue:

```json
"compilerOptions": {
  "allowJs": true,
  "paths": { "@ui/*": ["./node_modules/@altpro/ui/resources/js/*"] }
},
"include": ["resources/js/**/*.ts", "resources/js/**/*.vue", "node_modules/@altpro/ui/resources/js"]
```

Keep the app's own `include` entries and add the last one. Copy the `resources/boost/skills/altpro-ui/` directory into the project's `.claude/skills/altpro-ui/` for Claude.

## Develop

```
npm install
composer install
npx playwright install --with-deps chromium firefox webkit
npm run dev
npm test     # detailed Chromium checks plus Firefox/WebKit coverage; renders Blade through PHP
```

`AGENTS.md` has the conventions. `resources/boost/skills/altpro-ui/` is the class reference: SKILL.md, then a file per component in `references/`.
