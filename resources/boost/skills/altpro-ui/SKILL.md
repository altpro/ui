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

## Setup (already done if the project uses altpro/ui)

Laravel installs it with Composer (`composer require altpro/ui`). The Blade components register themselves. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "../../vendor/altpro/ui/resources/css/ui.css";
```

Elsewhere it is the npm package `@altpro/ui`:

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

A TypeScript app also maps it in `tsconfig.json`: `"paths": { "@ui/*": ["./vendor/altpro/ui/resources/js/*"] }`.

Every scrollbar gets a muted thumb on no track, set once with the inherited `scrollbar-color`, and it follows `.light` `.dark` `.inverse`. Add `scrollbar-thin` (Tailwind) to a scroll area for the slim width that `.nav`, dropdown panels and dialogs already have.

## How classes compose

One base class, then bare modifier words in any order. No prefixes.

```html
<button class="btn primary lg">Save</button>
<a href="/x" class="btn outlined danger sm">Delete</a>
<button class="btn primary w-full rounded-none">utilities still win</button>
```

Write `btn primary`, never `btn-primary` or `btn btn-primary`. Utilities always override component styles because components live in `@layer components`.

## Icons

Lucide, never hand-written paths: `@lucide/vue` in Vue (`<Plus class="size-4" aria-hidden="true" />`), `mallardduck/blade-lucide-icons` in Blade (`<x-lucide-plus class="size-4" aria-hidden="true" />`). An `<svg>…</svg>` in a reference file stands for one of these. Icons are `size-4` and `aria-hidden="true"`; an icon-only button gets its name from `aria-label`.

## Components

One line each: what it is for, and what it ships as. **CSS** is classes on native HTML, usable from Blade and Vue alike. **Vue** needs the Vue component. **Blade** has an `<x-ui::…>` component that saves markup. A *pattern* has no class of its own; it composes others. Read the reference file before writing the component's markup: it has the class table, the rules and a copy-paste example.

| Component | For | Ships as | Reference |
|-----------|-----|----------|-----------|
| Button `.btn` | Actions and links that look like buttons | CSS | [button.md](references/button.md) |
| Join `.join` | Buttons and inputs fused into one bar | CSS | [join.md](references/join.md) |
| Segmented control | One choice from a few, as a bar of buttons | pattern | [segmented.md](references/segmented.md) |
| Input `.input` | Text inputs, selects, textareas | CSS | [input.md](references/input.md) |
| Field `.field` | Label, control, hint and errors stacked | CSS, Blade, Vue | [field.md](references/field.md) |
| File input `.dropzone` | Drop zone and file list with previews and progress | CSS, Vue | [file-input.md](references/file-input.md) |
| Checkbox, radio, switch | Restyled native checkboxes and radios | CSS | [check.md](references/check.md) |
| Badge `.badge` | Status, counts, tags | CSS | [badge.md](references/badge.md) |
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

## Theme tokens

All colours are Tailwind theme variables, so `bg-primary`, `text-muted-foreground`, `border-border` and the rest exist as utilities. `muted` is short for `text-muted-foreground`. Each `X` has an `X-foreground` for text placed on it.

```
background  foreground
card        card-foreground
muted       muted-foreground
border      ring
primary     secondary  info  success  warning  danger   (each with -foreground)
red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose
            (hue fills: a tint in light, a deep shade in dark; pair with text derived from them, as .avatar does)
```

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

## Demo

Run `npm run dev` inside the altpro/ui repository to browse every component with a theme and radius switcher.
