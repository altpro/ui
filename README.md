# altpro/ui

An HTML and CSS component layer for Tailwind v4. Tailwind does layout; altpro/ui does the components, so `<button class="btn primary lg">` replaces a line of utilities. Native `<dialog>`, popovers, `<details>` and friends do the interactive parts. Components that need JavaScript, such as the combobox and DataTable, are Vue components; a few Blade components, such as the field, save markup.

## What each part needs

| Using | Packages | Vite plugins | Supported |
|-------|----------|--------------|-----------|
| CSS only (any HTML, Blade) | `tailwindcss` | `@tailwindcss/vite` | Tailwind 4.1+, Vite 7+. Blade components: PHP 8.3+, Laravel 13 |
| Vue components (Field, FileInput, Combobox, Repeater, CopyButton) | the above, plus `vue` | the above, plus `@vitejs/plugin-vue` | Vue 3.5+, plugin-vue 6+ |
| DataTable | the above, plus `@inertiajs/vue3`; `TableQuery` on the server | the above | Inertia 3+ (client and `inertiajs/inertia-laravel`), Laravel 13. Written in TypeScript, which Vite compiles without extra setup |

### Browsers

| Browser | Minimum | What sets it |
|---------|---------|--------------|
| Chrome, Edge | 135 | `command`/`commandfor` buttons, which open every dialog and drawer |
| Firefox | 147 | anchor positioning, which places every dropdown under its button |
| Safari, on Mac, iPhone and iPad | 26.2 | `command`/`commandfor` buttons |

Below these, buttons that open a dialog or drawer (Delete, Filters, the phone menu) do nothing, and dropdowns open away from their button. altpro/ui ships no polyfill for them. Safari 26.2 needs iOS 26.2, so an iPhone that stops at iOS 18 (an XS or XR) is below it; so is Firefox ESR 140.

Inside the range, two things degrade rather than break: the open `<select>` picker is styled in Chrome only (`appearance: base-select`) and is the native control elsewhere, and `.inverse` regions flip the scheme from Firefox 151, keeping the surrounding scheme in Firefox 147 to 150.

## Install in Laravel

New apps start from the altpro Vue starter kit, which already requires altpro/ui and ships everything below: `boost.json`, the `@ui` alias, the tsconfig entries, Lucide and the pinned version. Do not start from Laravel's own `laravel new --vue`: its shadcn tokens in `app.css` override altpro/ui's. The rest of this section is for an app that did not start from the kit.

Add the repository to the app's `composer.json`, then require it, with Lucide for icons:

```json
"repositories": [{ "type": "vcs", "url": "https://github.com/altpro/ui.git" }]
```

```
composer require altpro/ui:^0.4
composer require mallardduck/blade-lucide-icons   # icons in Blade: <x-lucide-plus />
npm install @lucide/vue                           # icons in Vue: <Plus />
```

On 0.x a breaking change bumps the minor version, so `^0.4` never installs one; read [CHANGELOG.md](CHANGELOG.md) before raising the constraint.

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

The package ships three Boost skills and a short guideline that tells agents when to load the first two. `altpro-ui` (SKILL.md and its `references/`) is how to write each component; agents load it before writing markup. `altpro-ui-design` is how to compose a screen and its behaviour so they're right on the first build; agents load it when building a screen or a feature. `altpro-ui-review` is an optional UI and UX review of an app's screens: it runs only when someone asks for it (`/altpro-ui-review` in Claude Code), makes one pass and reports what it finds. `boost:list-skills` finds them, but Boost installs a third-party package's files only once the app opts in: `boost:install -n` and `boost:update -n` skip altpro/ui until the app's `boost.json` lists it. The kit's `boost.json` already does. Elsewhere, add it and update:

```json
"packages": ["altpro/ui"]
```

```
php artisan boost:update
```

The skills land in the agents' skills directory (`.claude/skills/altpro-ui/`, `altpro-ui-design/` and `altpro-ui-review/` for Claude Code) and the guideline in each agent's guideline file (`CLAUDE.md`, `AGENTS.md`) under `=== altpro/ui/core rules ===`. Ticking altpro/ui at the interactive `php artisan boost:install` prompt writes the same `packages` entry.

## Install anywhere else

```
npm install github:altpro/ui#v0.4.1
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

Keep the app's own `include` entries and add the last one. Copy the `altpro-ui`, `altpro-ui-design` and `altpro-ui-review` directories from `resources/boost/skills/` into the project's `.claude/skills/` for Claude.

## Production builds

Set `build.cssTarget` in `vite.config.js`:

```js
build: { cssTarget: ["chrome123", "firefox120", "safari17.5"] },
```

These versions are where Lightning CSS stops rewriting `light-dark()`, not the browsers altpro/ui supports, which are newer (see Browsers).

Every colour token is a `light-dark()` value on `:root`, and a `.dark`, `.light` or `.inverse` region sets `color-scheme` so the tokens resolve differently inside it. Vite 8 and vite-plus minify CSS with Lightning CSS, as does any build with `cssMinify: "lightningcss"`. For browsers older than those three, Lightning CSS rewrites `light-dark()` into `--lightningcss-light` and `--lightningcss-dark` variables, which resolve once on `:root`. A region then gets `color-scheme: dark` with the page's light colours. Nothing warns you, and `npm run dev` does not show it. Lower any of the three versions and the rewrite comes back.

To check an app, build it and search the CSS. A match means regions are broken:

```
grep -l lightningcss-dark public/build/assets/*.css
```

Vite 7's default minifier leaves `light-dark()` alone, and the setting does no harm there. Tailwind's `optimize` option has no effect on this.

## Develop

```
npm install
composer install
npx playwright install --with-deps chromium firefox webkit
npm run dev
npm test     # detailed Chromium checks plus Firefox/WebKit coverage; renders Blade through PHP
```

`AGENTS.md` has the conventions. `resources/boost/skills/altpro-ui/` is the class reference: SKILL.md, then a file per component in `references/`.
