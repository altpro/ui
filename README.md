# altpro/ui

An HTML and CSS component layer for Tailwind v4. Tailwind does layout; altpro/ui does the components, so `<button class="btn primary lg">` replaces a line of utilities. Native `<dialog>`, popovers, `<details>` and friends do the interactive parts. Components that need JavaScript, such as the combobox and DataTable, are Vue components; a few Blade components, such as the field, save markup.

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

Vue components are imported from the package and bring their own JavaScript:

```js
import Combobox from "../../vendor/altpro/ui/resources/js/Combobox.vue";
```

`composer update` updates the CSS, Blade and Vue components together. To change one Blade component for one app, copy it to `resources/views/vendor/ui/components/`, or `php artisan vendor:publish --tag=ui-views` for all of them. A copied component no longer receives updates.

Laravel Boost picks up `resources/boost/skills/altpro-ui/SKILL.md` so agents in the app know the classes and components.

## Install anywhere else

```
npm install github:<owner>/ui
```

```css
@import "tailwindcss";
@import "@altpro/ui";
```

Vue components are at `@altpro/ui/js/Combobox.vue` and alongside. Copy `resources/boost/skills/altpro-ui/SKILL.md` into the project's `.claude/skills/altpro-ui/` for Claude.

## Develop

```
npm install
composer install
npx playwright install --with-deps chromium firefox webkit
npm run dev
npm test     # detailed Chromium checks plus Firefox/WebKit coverage; renders Blade through PHP
```

`AGENTS.md` has the conventions. `resources/boost/skills/altpro-ui/SKILL.md` is the class reference.
