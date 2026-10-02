# altpro/ui

An HTML and CSS component layer for Tailwind v4. Tailwind does layout; altpro/ui does the components, so `<button class="btn primary lg">` replaces a line of utilities. Native `<dialog>`, popovers, `<details>` and friends do the interactive parts. The few components that need repeated markup or state, such as the multiselect, also come as Blade and Vue components.

## Install in Laravel

Add the repository to the app's `composer.json`, then require it:

```json
"repositories": [{ "type": "vcs", "url": "git@github.com:<owner>/ui.git" }]
```

```
composer require altpro/ui
```

The service provider is discovered automatically, so `<x-ui::multiselect>` works straight away. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "../../vendor/altpro/ui/resources/css/ui.css";

/* optional */
@theme {
  --color-primary: oklch(0.6 0.2 30);
  --color-primary-foreground: white;
}
:root { --radius: 9999px; }
```

For the Blade components, load their JavaScript once in `resources/js/app.js`:

```js
import "../../vendor/altpro/ui/resources/js/multiselect.js";
```

Vue components are imported from the same folder and bring their own JavaScript:

```js
import Multiselect from "../../vendor/altpro/ui/resources/js/Multiselect.vue";
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

Vue components are at `@altpro/ui/js/Multiselect.vue`. Copy `resources/boost/skills/altpro-ui/SKILL.md` into the project's `.claude/skills/altpro-ui/` for Claude.

## Develop

```
npm install
composer install
npx playwright install --with-deps chromium firefox webkit
npm run dev
npm test     # detailed Chromium checks plus Firefox/WebKit coverage; renders Blade through PHP
```

`AGENTS.md` has the conventions. `resources/boost/skills/altpro-ui/SKILL.md` is the class reference.
