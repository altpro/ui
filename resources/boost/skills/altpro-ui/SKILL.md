---
name: altpro-ui
description: Use altpro/ui component classes (btn, join, input, field, file input, drop zone, checkbox, radio, switch, segmented control, badge, description list, avatar, nav, breadcrumb, dropdown, combobox, tooltip, card, dialog, accordion, table, DataTable, repeater, alert, tabs, progress, meter, range, skeleton, spinner, steps, toast, drawer, and more as they land) and its Blade (<x-ui::…>) and Vue components when writing markup in a project that uses altpro/ui (Composer altpro/ui or npm @altpro/ui). Covers class composition, colour and size modifiers, theme tokens, and light/dark scheme regions.
---

# altpro/ui

altpro/ui is a CSS component layer on top of Tailwind v4. Tailwind handles layout and spacing. altpro/ui classes replace the long utility strings for common components. A few components that need repeated markup or state also come as a Blade component and a Vue component that render the same markup.

Rule of thumb when writing markup:

1. Reach for an altpro/ui class (or its Blade or Vue component) first if one exists for the component.
2. Use Tailwind utilities for layout around it and for one-off tweaks on it.
3. Never rebuild an altpro/ui component out of utilities.
4. For a component altpro/ui does not have, write a CSS component in the app the way the library writes its own: [app-component.md](references/app-component.md).

## Setup (already done if the project uses altpro/ui)

An app made from the altpro Vue starter kit has all of this. Laravel installs it with Composer from the private GitHub repository (`"repositories": [{ "type": "vcs", "url": "git@github.com:altpro/ui.git" }]` in `composer.json`), with Lucide for icons:

```
composer require altpro/ui:^0.1
composer require mallardduck/blade-lucide-icons
npm install @lucide/vue
```

The Blade components register themselves. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "../../vendor/altpro/ui/resources/css/ui.css";
```

Elsewhere it is the npm package `@altpro/ui` (`npm install github:altpro/ui#v0.1.0 @lucide/vue`):

```css
@import "tailwindcss";
@import "@altpro/ui";
```

Vue components bring their own JavaScript; Blade components need none. Import Vue components through a `@ui` alias in the app's `vite.config.js`, so the import does not depend on where the importing file lives. Every example in this skill uses it:

```js
// Composer install
resolve: { alias: { "@ui": `${import.meta.dirname}/vendor/altpro/ui/resources/js` } },
// npm install
resolve: { alias: { "@ui": "@altpro/ui/js" } },
```

```js
import Field from "@ui/Field.vue";
```

A TypeScript app also maps it in `tsconfig.json`, and needs `allowJs` because most of the Vue components are plain JavaScript. An npm install also adds the package to `include`, or a strict `vue-tsc` fails with missing declarations for Field.vue and Combobox.vue:

```jsonc
// Composer install
"compilerOptions": {
  "allowJs": true,
  "paths": { "@ui/*": ["./vendor/altpro/ui/resources/js/*"] }
}
// npm install
"compilerOptions": {
  "allowJs": true,
  "paths": { "@ui/*": ["./node_modules/@altpro/ui/resources/js/*"] }
},
"include": [/* the app's own entries, then */ "node_modules/@altpro/ui/resources/js"]
```

Every scrollbar gets a muted thumb on no track, set once with the inherited `scrollbar-color`, and it follows `.light` `.dark` `.inverse`. Add `scrollbar-thin` (Tailwind) to a scroll area for the slim width that `.nav`, dropdown panels and dialogs already have.

## How classes compose

One base class, then bare modifier words in any order. No prefixes.

```html
<button class="btn primary lg">Save</button>
<a href="/x" class="btn outlined danger sm">Delete</a>
<button class="btn primary w-full rounded-none">utilities still win</button>
```

Write `btn primary`, never `btn-primary` or `btn btn-primary`. Utilities always override component styles because components live in `@layer components`.

Every `<a>` that is not already a component (a `.btn`, a `.nav` or `.tabs` item and so on) takes `class="link"`: a link in a sentence, a `.dl` value, an `.alert`, a table cell. Tailwind's reset makes a bare `<a>` look like plain text.

### Not daisyUI

`btn`, `badge`, `card`, `join`, `link`, `tabs`, `steps` and `alert` are daisyUI names too, but nothing else carries over. There are no hyphenated modifiers and no part classes: write the modifier word, or the plain element the component already styles.

| daisyUI | altpro/ui |
|---------|-----------|
| `btn-primary btn-outline btn-sm`, `badge-success`, `alert-error` | `btn primary outlined sm`, `badge success`, `alert danger` |
| `btn-error`, `text-error`, `bg-error` | `danger`, `text-danger`, `bg-danger` |
| `bg-base-100`, `bg-base-200`, `text-base-content`, `text-primary-content` | `bg-background` (`bg-card` in a panel), `bg-muted`, `text-foreground`, `text-primary-foreground` |
| `card-body`, `card-title`, `card-actions` | Children of `.card`: a `<header>` holding the heading, the body as plain children, a `<footer>` for actions |
| `join-item` | Nothing: every direct child of `.join` is a member |
| `modal`, `modal-box`, `modal-action` | `<dialog class="dialog">` with a `<header>` and `<footer>`, opened by `command="show-modal"` |
| `tab`, `tab-active` | Bare `<a>` children of `.tabs`, `aria-current="page"` on the active one |
| `step`, `step-primary` | `<li>` children of `<ol class="steps">`, `aria-current="step"` on the current one |
| `stats`, `stat-title`, `stat-value` | The [stat](references/stat.md) pattern: a `.card` of `<p>`s |
| `input-bordered`, `select`, `textarea`, `input-error` | `class="input"` on `<input>`, `<select>` and `<textarea>`; `aria-invalid="true"` |
| `form-control`, `label-text`, `fieldset-legend` | `.field`, or `<x-ui::field>` / `Field.vue` |
| `toggle`, `checkbox-primary` | `<label class="switch">` round an `<input type="checkbox" role="switch">`; `checkbox` |
| `menu`, `dropdown-content` | `.nav`; `<div popover class="dropdown">` |
| `collapse` | `.accordion` on `<details>` |
| `loading loading-spinner` | `spinner`, or `loading` on a `.btn` |
| `tooltip` with `data-tip` | `data-tooltip="…"` on the element |
| `breadcrumbs`, `table-zebra` | `breadcrumb`, `table striped` |
| `link-primary`, `link-hover` | `link` |

Check your markup with this grep; it should print nothing. An `id` or `for` that starts with one of these words is a false alarm.

```sh
grep -rnE '(^|[^[:alnum:]_/:-])(btn|badge|alert|card|join|link|tabs?|steps?|stats?|input|textarea|modal|menu|dropdown|collapse|toggle|loading|checkbox|radio|range|progress|avatar|tooltip|label|form)-[a-z$]|-(base-[0-9c]|[a-z]+-content[^-[:alnum:]])|class="([^"]*[[:space:]])?(modal|toggle|menu|navbar|tab|stats)[[:space:]"]' resources/js resources/views
```

## Icons

Lucide, never hand-written paths: `@lucide/vue` in Vue (`<Plus class="size-4" aria-hidden="true" />`), `mallardduck/blade-lucide-icons` in Blade (`<x-lucide-plus class="size-4" aria-hidden="true" />`). An `<svg>…</svg>` in a reference file stands for one of these. Icons are `size-4` and `aria-hidden="true"`; an icon-only button gets its name from `aria-label`.

## Headings

One scale for page content, the same on every page. Pick the level from the page's outline, never for its size.

| Heading | Classes | For |
|---------|---------|-----|
| `h1` | `text-2xl font-semibold tracking-tight`, plus `break-words` when it shows a record's name | The page title, one per page, in the [record header](references/record-header.md) |
| `h2` | `text-lg font-semibold` | A section of the page, or of a [long form](references/long-form.md) |
| `h3` | `font-semibold` | A group inside a section |

Inside a `.card` or `.dialog` header, an `.alert` or a `.nav`, write the heading with no classes: the component sizes it.

## Components

One line each: what it is for, and what it ships as. **CSS** is classes on native HTML, usable from Blade and Vue alike. **Vue** needs the Vue component. **Blade** has an `<x-ui::…>` component that saves markup. A *pattern* has no class of its own; it composes others. Read the reference file before writing the component's markup: it has the class table, the rules and a copy-paste example.

| Component | For | Ships as | Reference |
|-----------|-----|----------|-----------|
| App shell | The page frame: sidebar nav, header with breadcrumb and user menu, main, toaster; the sign-in layout; the colour scheme setting | pattern | [app-shell.md](references/app-shell.md) |
| Page recipes | Whole Inertia screens: list page, edit page, tags and photo uploads, with controllers and endpoint responses | pattern | [recipes.md](references/recipes.md) |
| Validation failure | A failed save: an error summary that is announced and takes focus; where focus goes after a visit | pattern | [validation-failure.md](references/validation-failure.md) |
| Destructive action | A delete confirmed in a dialog: pending state, a 422 shown in it, focus back to the trigger | pattern | [destructive-action.md](references/destructive-action.md) |
| Unsaved changes | Ask before leaving a form with unsaved changes, in the app and in the browser | pattern | [unsaved-changes.md](references/unsaved-changes.md) |
| Button `.btn` | Actions and links that look like buttons | CSS | [button.md](references/button.md) |
| Join `.join` | Buttons and inputs fused into one bar | CSS | [join.md](references/join.md) |
| Segmented control | One choice from a few, as a bar of buttons | pattern | [segmented.md](references/segmented.md) |
| Input `.input` | Text inputs, selects, textareas | CSS | [input.md](references/input.md) |
| Field `.field` | Label, control, hint and errors stacked | CSS, Blade, Vue | [field.md](references/field.md) |
| File input `.dropzone` | Drop zone and file list with previews and progress | CSS, Vue | [file-input.md](references/file-input.md) |
| Checkbox, radio, switch | Restyled native checkboxes and radios | CSS | [check.md](references/check.md) |
| Badge `.badge` | Status, counts, tags | CSS | [badge.md](references/badge.md) |
| Link `.link` | A link in a sentence, a `.dl` value, an `.alert` or a table cell | CSS | [link.md](references/link.md) |
| Avatar `.avatar` | A person's photo or initials | CSS | [avatar.md](references/avatar.md) |
| Nav `.nav` | Vertical sidebar or settings menu | CSS | [nav.md](references/nav.md) |
| Breadcrumb `.breadcrumb` | The path to the current page | CSS | [breadcrumb.md](references/breadcrumb.md) |
| Dropdown `.dropdown` | A menu or panel anchored to a button | CSS | [dropdown.md](references/dropdown.md) |
| Combobox | Searchable, server-backed or multiple select | Vue | [combobox.md](references/combobox.md) |
| Tooltip `data-tooltip` | One line of help on hover and focus | CSS | [tooltip.md](references/tooltip.md) |
| Copy button | Copy a value to the clipboard | Vue | [copy-button.md](references/copy-button.md) |
| Card `.card` | A bordered box for a panel or list item | CSS | [card.md](references/card.md) |
| Description list `.dl` | Label and value pairs on record pages | CSS | [dl.md](references/dl.md) |
| Dialog `.dialog` | Modal or drawer on native `<dialog>` | CSS | [dialog.md](references/dialog.md) |
| Accordion `.accordion` | Collapsible rows on `<details>` | CSS | [accordion.md](references/accordion.md) |
| Tree `.tree` | Page hierarchies and category trees | CSS | [tree.md](references/tree.md) |
| Table `.table` | A static data table; line items and totals | CSS | [table.md](references/table.md) |
| DataTable | Search, sort, filter, page and select rows; with `TableQuery` on the server | Vue (Inertia) | [datatable.md](references/datatable.md) |
| Repeater | Rows the user adds, removes and reorders | Vue | [repeater.md](references/repeater.md) |
| Alert `.alert` | A callout box | CSS | [alert.md](references/alert.md) |
| Tabs `.tabs` | Underlined tabs, as links or radio panels | CSS | [tabs.md](references/tabs.md) |
| Progress, meter | Native `<progress>` and `<meter>` | CSS | [progress.md](references/progress.md) |
| Range `.range` | A slider | CSS | [range.md](references/range.md) |
| Pagination | Page links under a list | pattern | [pagination.md](references/pagination.md) |
| Loading `.skeleton` `.spinner` | Placeholders and spinners | CSS | [loading.md](references/loading.md) |
| Steps `.steps` | Numbered progress through a process | CSS | [steps.md](references/steps.md) |
| Timeline `.timeline` | Audit history and activity feeds | CSS | [timeline.md](references/timeline.md) |
| Toast `.toaster` | Short notices in a corner, and flash messages | CSS | [toast.md](references/toast.md) |
| Stat | A big number in a card | pattern | [stat.md](references/stat.md) |
| Empty state | What an empty list or panel says | pattern | [empty-state.md](references/empty-state.md) |
| Record header | The top of a record page | pattern | [record-header.md](references/record-header.md) |
| Save bar | Sticky Save and Discard on a long form | pattern | [save-bar.md](references/save-bar.md) |
| Long form | A form split into `<fieldset>` sections with headings | pattern | [long-form.md](references/long-form.md) |

## Theme tokens

All colours are Tailwind theme variables, so `bg-primary`, `text-muted-foreground`, `border-border` and the rest exist as utilities. `muted` is short for `text-muted-foreground`. Each `X` has an `X-foreground` for text placed on it.

```
background  foreground
card        card-foreground
muted       muted-foreground
border      input       ring
primary     secondary  info  success  warning  danger   (each with -foreground)
red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose
            (hue fills: a tint in light, a deep shade in dark; pair with text derived from them, as .avatar does)
```

`border` is for dividers and card edges and is too faint to be the only sign of a control. `input` is the edge of a control known by its border (an empty input, select, unticked checkbox, drop zone): 3:1 on `background`, `card` and `muted` in both schemes (WCAG 1.4.11). `.input`, the checks and `.dropzone` already use it; use `border-input` on anything of your own that works the same way, and keep 3:1 if you override it.

Every token is `light-dark()`, so the same class is correct in both schemes. Do not write `dark:` variants for these colours.

Spacing: `--spacing-gap` is one responsive unit, 1rem, then 1.5rem from `md` and 2rem from `lg`. It gives `p-gap`, `m-gap`, `gap-gap`, `size-gap` and the rest, plus `2gap` and `3gap` multiples (`p-2gap`, `mt-3gap`). Use it for the padding of panels and the gutters between them so the whole page loosens together on wider screens.

Override in the app's stylesheet, after the altpro/ui import:

```css
@theme {
  --color-primary: light-dark(oklch(0.55 0.2 30), oklch(0.72 0.15 30));
  --color-primary-foreground: light-dark(white, oklch(0.145 0 0));
}
:root { --radius: 9999px; }   /* one knob for corner radius: 0 = square, 9999px = pill */
```

## Scheme regions

The page follows the OS. To pin it, set `data-theme="light"` or `data-theme="dark"` on `<html>`.

| Class | Effect on its subtree |
|-------|-----------------------|
| `light` | always light |
| `dark` | always dark |
| `inverse` | the opposite of the nearest region above it, at any nesting depth |

Regions paint their own background and text colour. Use `inverse` for things like a dark footer on a light site that should become light when the site is dark.

Tailwind's `dark:` variant follows the OS media query and ignores these regions. Prefer the tokens. If an app really needs `dark:` to follow regions, add to its stylesheet:

```css
@custom-variant dark (@container style(--scheme: dark));
```

## Print

Printing is always light: every region, `.dark` and `.inverse` included, prints in the light scheme, and the toaster is hidden. Anything else that only makes sense on screen takes Tailwind's `print:hidden`: the [app shell](references/app-shell.md)'s sidebar and header and the [save bar](references/save-bar.md) already have it; add it to record-header actions, filters and pagination on a page people print, such as an invoice or a packing slip. Other `print:` utilities adjust the printed layout.

## Demo

Run `npm run dev` inside the altpro/ui repository to browse every component with a theme and radius switcher.
