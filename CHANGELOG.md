# Changelog

Apps pin `altpro/ui:^0.3` (npm `github:altpro/ui#v0.3.4`). On 0.x a breaking change bumps the minor version (0.3 to 0.4), which `^0.3` already stops at, so apps take it only when someone raises the constraint. Each release lists its breaking changes first, under **Breaking**, with what to change in the app.

## 0.3.4 (9 November 2026)

- A `DataTable` `multiple` filter keeps working once the server has replied. inertia-laravel builds the page URL with `fullUrl()`, which rewrites `category[]=food` as `category[0]=food`, and the table read and removed only `key[]`: the control went blank, offered no Clear and could not take the value off, and a filter with a `default` showed the default while the list showed something else. It now reads and replaces both forms. An app that set `Inertia::resolveUrlUsing` to work around this can remove it. Markup is unchanged.
- An empty `multiple` filter reads "All", as a select does. `Combobox` gains a `placeholder` prop for this.
- A `DataTable` date range's Clear button is inactive (`aria-disabled`) until the range differs from its default, and keeps its place, so the toolbar does not move and focus stays on it after a clear. A filter's `clearLabel` changes its words and accessible name: `{ type: "daterange", clearLabel: "Clear dates" }`. An app that relabels the button through the DOM should use this instead.
- `format: "date"` and `"datetime"` no longer zero-pad the day: "7 Dec 2016", not "07 Dec 2016", as the skill's date rule has it. An app that formats dates in `#cell-…` slots only to avoid the padding can go back to `format`.
- A `DataTable` dims only for a visit that reloads its rows: a GET of its own page, unless that visit names only other props. Saving one row's switch no longer fades every row, or marks the table `aria-busy`. An app that overrode the dim with `[&_tbody]:opacity-100!` can remove it.
- `app-shell.md`'s `<main>` shows focus for the keyboard, inset so the window's edge does not cut it off, instead of `outline-none`, which broke the skill's own rule that focus shows wherever it lands. An app that copied the layout should replace `outline-none` on `main` with `-outline-offset-3 focus-visible:outline-3 focus-visible:outline-ring/50`. Run `php artisan boost:update` to get the skill.

## 0.3.3 (7 November 2026)

- A click anywhere in a `Field` password `reveal` box lands in the input. The wrapper is a `<div>`, so its padding and the space above and below the input did nothing. This covers any `.input` wrapper that is not a `<label>`, including the `guest.js` sign-in pages in `app-shell.md`. An app that worked around it with its own rules on `div.input` must delete them in the same update: the input now pulls itself over the wrapper's padding, so a workaround that removes that padding leaves the text at the box's edge. Markup is unchanged. `.input` gains a `--input-gap` custom property.
- A `Field` password `reveal` hides again when its dialog closes, its form resets, or something other than the user empties it, so a dialog no longer reopens in "show" mode. It stays shown on blur and while the user clears the field to retype. Markup is unchanged.
- The README and `altpro-ui` skill now tell apps to set `build.cssTarget`. Without it, Vite 8 and vite-plus rewrite `light-dark()` in production builds, and `.dark`, `.light` and `.inverse` regions silently keep the page's colours. This package's CSS is unchanged: **add the setting to `vite.config.js`** and run the check in the README. Run `php artisan boost:update` to get the skill.
- The active tab no longer turns heavier, because the wider text moved every tab after it by 2px between pages. It keeps its colour and bar. Markup is unchanged.
- A tooltip takes `data-tooltip-align="start"` or `"end"`, which lines the bubble up with that edge of its host, so a dialog's or the screen's edge no longer clips it. `CopyButton` passes the attribute on. Apps that nudged a bubble with a `translate` utility can use this instead.
- `toast.md`'s `toast()` shows the message inside an open modal as well, above its footer, because a modal makes the toaster inert. To get this, copy the new function into `resources/js/toast.js`, and run `php artisan boost:update` to get the skill.
- This repo's demo now builds with Vite 8 and sets the same `build.cssTarget`, and `npm run test:unit` builds it and fails if `light-dark()` has been rewritten. Apps can stay on Vite 7 or move to 8.

## 0.3.2 (6 November 2026)

- The skills resolve what a fifth skills-only test found. `unsaved-changes.md`'s dirty dialog comes back and asks when a repeated Escape closes it with no `cancel` event, and its close cross lines up with the heading. `list-page.md` folds the total onto the code line, so a name takes the phone's whole row, and gives the row's link a focus ring. `altpro-ui-design` adds rules for a closed record that still owes money, a primary reached by a dialog's submit, ways down a long record, and emails that wrap. Run `php artisan boost:update` to get them. Markup is unchanged.
- The skills resolve what a fourth skills-only test found, several of them faults in the skills' own advice. Money is now a text field with `inputmode="decimal"` and `decimal:0,2` in `recipes.md`, `field.md`, `input.md` and `validation-failure.md`, because `type="number"` took `1e1`. `list-page.md` moves the count and Clear to a line under the title, so the toolbar keeps no empty slot, and `record-header.md`'s actions no longer move with the length of a name. `altpro-ui-design` corrects which laptops reach `@5xl`, fixes a focus ring that `outline-none` cancelled and draws it only for the keyboard, guards a held Enter as well as a double-click, and adds rules for what a filtering stat counts, a filter nobody can see, a record's latest update, tablet widths, tab order and reaching a note form on the phone. Run `php artisan boost:update` to get them. Markup is unchanged.
- A radio in a group with nothing selected no longer draws as selected. It matched `:indeterminate`, which only a checkbox should show. Markup is unchanged.
- The skills resolve what a third skills-only test found. `record-header.md` follows the design rules on a record's name, the breadcrumb and Overdue, and `altpro-ui-design` settles what a folded phone row holds, which container tiers a laptop reaches and how a dirty dialog asks. `list-page.md` is a new recipe for a list built without DataTable, `unsaved-changes.md` adds the dirty dialog, and `link.md` adds a list row's stretched title. New rules cover typed text wrapping, typing over a prefilled value, keeping pence, repeat clicks and showing focus wherever it lands. Run `php artisan boost:update` to get them. Markup is unchanged.
- `altpro-ui-design` is now only about building a screen right first time. It starts with a short plan (the next action, the states, the kinds of screen) and ends when the build and tests pass, with no screenshots, scores or review rounds. Its rules for lists, record pages, forms and dashboards moved to `references/`, so an agent reads the ones its screen needs. A new skill, `altpro-ui-review`, holds the review: it runs only when someone asks for it, drives the flows, shoots more widths and stops at a report. Run `php artisan boost:update` to install it. Markup is unchanged.
- An `.alert` with no icon keeps its message and dismiss cross on one row. The message took the whole row and the cross dropped below it. Markup is unchanged.
- A selected table row keeps its tint under the pointer. `.table.hover` left out rows with `aria-selected`, but not rows selected by a checked checkbox in their first cell, so hovering one looked like deselecting it. Markup is unchanged.
- A `.dialog.drawer` no longer squashes its children when the form is taller than the screen, and a `<footer>` as its last child stays on screen while the rest scrolls, so Save never drops below the fold. Put the actions in the drawer's own footer (the submit button takes `form="…"`) to get this.
- The sample app's Overview, Products and product screens are reworked over 29 rounds of review, with no change to the library's classes: every Overview figure follows one period control in the title row and adds up, a product's primary button follows what it is waiting for, and the screens measure themselves rather than the viewport, so a laptop beside the sidebar composes as a tablet does.
- `altpro-ui-design` adds what those reviews blocked on: one control for a page's period, a record's next action, figures that reconcile, unsaved changes, list state, screens that measure themselves, mixed selection, and product pictures that stay the same in both schemes.
- `Field.vue`: an empty string (or an empty item in an array) passed as `errors` is no error. `:errors="''"` marked the field invalid in red with no message.
- Avatar initials never drop below `text-xs`. An `xs` avatar, the size the timeline marker uses, drew them at 9.6px; they are now 12px.
- A neutral status badge (`soft`, or any style with `dot`, and no colour word) draws its text, dot and tint from `muted-foreground` instead of the foreground, so draft and archived are the quietest statuses in a column instead of the darkest. A neutral tag (`outlined`, no dot) is unchanged. Markup is unchanged.
- A card header holding only a label and a control (a stat's label and its icon) keeps them on one line, the control at the far side, as `stat.md` and the stat demo show. The label took the whole row and pushed the icon onto a line of its own. Markup is unchanged.
- In a table's `tfoot`, only the first row (closing the items) and the last (the total) get a rule; subtotal, delivery and VAT between them no longer do. `table.md`'s totals example puts `tabular-nums` on the number cells instead of the whole table and mutes the rows between. Markup is unchanged.
- Dialog Cancel buttons are `btn outlined` in `dialog.md`, `destructive-action.md` and the demos, as the design skill says. They were `ghost` there.
- `altpro-ui-design` adds the rules two independent reviewers blocked on when an agent built a new app's screens from the skills alone. A new Priority section covers task order, showing a finished action's result, and one control per choice. There are rules for record pages, footers under tables, tables that hold their columns, forms that fill their card, tabular figures on number cells only, totals, labelled values, counts, error wording, one colour per meaning, mapping a workflow to badges, stat cards that filter, and wrapping on the phone. The phone stat rule now keeps the label above the number, as `stat.md` and the demo do. A second test run added rules for a record's name, a list page's primary action, where history goes on a record page, phone row height, header buttons on the phone, a stat's scope and one date form, and a step-3 check that the user's next action shows in the first phone screenful. The review brief asks the reviewer to name the rule each issue breaks. `segmented.md` and `timeline.md` say how a neutral group reads in dark and how a feed shows each entry's type.

## 0.3.1 (5 November 2026)

- Badges take two new modifiers. `soft` is a tint of the colour under a deeper shade of it, mixed into the card colour so it reads the same on any surface. `dot` puts a status light before the label. A record's status is now written `badge soft success dot` (`soft dot` for draft, `outlined dot` for archived) in `badge.md`, `record-header.md` and the recipes, so a column of statuses in a table stays quiet. Solid status badges still work; change them to match when you next touch a screen.
- A second Boost skill, `altpro-ui-design`: the rules that take a screen built from altpro/ui to a shippable standard (rhythm, type, copy, status and severity, actions, charts, dialogs, phone and dark layouts), learned from five rounds of design review on the demo app, and a screenshot review loop with a brief for an independent reviewer. The guideline and the `altpro-ui` skill point agents to it when they build or review a screen. Run `php artisan boost:update` to install it.
- Card and dialog headers centre a control on the title's line (`align-items: center`); it sat on the title's top edge, so a `btn sm` beside a one-line title hung below it. Markup is unchanged.
- A `.btn` with `aria-pressed="true"` takes the solid fill a checked toggle has, so a script-driven toggle (a list/grid switch, the password reveal) shows its state. Before, only `:has(:checked)` filled.
- A table in a wrapper inside a card (`.card > .scroll > .table`) takes the card's inset as its cell padding, as a direct `.table` child already did; its first and last columns sat 1rem in, off the card's padding.
- `Combobox.vue`: the clear button sits inside the end of the trigger, after the chevron, instead of beside it, so a combobox in a `.field` is as wide as the fields around it. Markup is unchanged.

## 0.3.0 (5 November 2026)

- `CopyButton.vue`: after Escape, focus that leaves the button and comes straight back shows the tooltip again. It stayed hidden when both happened within one frame.

### Breaking

- Laravel 12 is no longer supported: `composer.json` requires Laravel 13 (`illuminate/*:^13.0`). An app on Laravel 12 stays on `^0.2`, or upgrades Laravel before raising the constraint.

## 0.2.0 (4 November 2026)

- A clickable avatar's `aria-label` starts with the initials it shows, then says who or what (`aria-label="GH, Grace Hall's profile"`). A label without them fails WCAG 2.5.3 (Label in Name), which axe 4.14 now checks: a voice-control user says what they see.

- `DataTable.vue` keeps focus in the table when the button pressed goes away (WCAG 2.4.3). Before, it fell to the page body. Next on the last page but one, and Previous on page two, hand it to the current page's button. Clear filters hands it to the search box, "Select all N matching" to the selected count, and the bulk bar's Clear, or a bulk action that clears the selection, to the header checkbox.
- `DataTable.vue` emits `update:selection` only when the selection changes. Before, a "matching" selection was emitted again on every parent render, and a parent that passed an inline array prop (`:searchable="['name']"`) looped until Vue stopped it with "Maximum recursive updates".
- `CopyButton.vue`: Escape hides its tooltip until the pointer and focus leave the button (WCAG 1.4.13).
- `FileInput.vue` types its v-model as `File | File[] | null`. vue-tsc inferred `null` from the default alone, so an app passing a `File` or `File[]` got a type error. An app that suppressed it (`@vue-expect-error`, `@vue-ignore`) can drop that; an `@vue-expect-error` now fails because the error has gone.

### Breaking

- The user menu labels its button with the initials: `aria-label="SR, user menu"`, was `"User menu"`. Copy `resources/js/components/UserMenu.vue` (or `resources/views/layouts/user-menu.blade.php`) from `references/app-shell.md` again. Any other `<a>` or `<button>` avatar in the app needs its initials at the start of its `aria-label` too. A test that finds the menu by the exact name `"User menu"` needs the initials as well; a substring match still finds it.

## 0.1.2 (27 October 2026)

- `TableQuery` searches a JSON-path column (`'data->postcode'`) without regard to case on MySQL too; it matched case-sensitively there, because `json_unquote()` returns a binary-collated string. An app that lowered the term itself to work around it can drop that.

### Breaking

- None.

## 0.1.1 (16 October 2026)

- Motion tokens: `--duration-fast` (150ms), `--duration-slow` (250ms) and `--ease-smooth` (also an `ease-smooth` utility). Every component transition reads them, so one override retimes the kit.
- `.dropdown` grows from its trigger's corner on open and shrinks back on close.
- Dialog and drawer open over 250ms on `--ease-smooth` and close over 150ms; they were 150ms and 200ms both ways. The accordion (was 200ms), a toast's entry (200ms) and the progress bar (300ms) now take 250ms on the same curve.

### Breaking

- None.

## 0.1.0 (13 October 2026)

First release.

### Breaking

- None: first release.
