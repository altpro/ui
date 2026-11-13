# Changelog

Apps pin `altpro/ui:^0.4` (npm `github:altpro/ui#v0.4.1`). On 0.x a breaking change bumps the minor version (0.4 to 0.5), which `^0.4` already stops at, so apps take it only when someone raises the constraint. Each release lists its breaking changes first, under **Breaking**, with what to change in the app.

## Unreleased

Fixes from a council review before production use. Run `php artisan boost:update` for the references.

**Breaking** (a minor version, 0.5.0):

- `useUnsavedChanges` asks before a `put`, `post` or `delete` that may leave the page, such as Log out (`<Link method="post">`); in 0.4 none asked, so edits were dropped without a question. Not asked: a guarded form's own save, a partial reload (`only`/`except`) and a request in the background (`async`). What to change: an action of your own that comes back to the page with a guarded form on it (a row's Delete, Send test email) gets `only: [...]` or `async: true`, or it now asks "Leave this page?". A page that guards two forms through one function (`() => a.isDirty || b.isDirty`) guards each form instead, as a function lets every `put`, `post` and `delete` go.
- `allowLeaving` goes in the visit's `onBefore`, not `onStart`: the guard now asks before `onStart` runs, so `onStart: allowLeaving` asks a second question after your confirm dialog, and its Cancel stops the delete.
- `Repeater`: each row's header now starts with the drag grip (`span[data-handle]`), before the title. What to change: only CSS of the app's own that picks out the first child of a row's header (`header > :first-child`, `h3:first-child`).
- A "Select all N matching" bulk action reads its search and filters through `TableQuery::selection($request, $filters)` (below). An empty search arrived as `null` and made `TableQuery::search()` throw, and filter values in the body were never checked.

Fixes and additions:

- A list page that does more than list, after the altpro starter kit's users list. `DataTable`, `DataList` and `DataTimeline` take a `#header` slot above the toolbar, for the page's title row and stat cards that filter the rows. It gets the count (`total`, `unfilteredTotal`), `narrowed` (a search or filter in force), `clear`, the filter `values`, and `filterLink(key, values)`, an `href` and click handler for an `<a>` that sets a filter as the controls do, so a card clicked while a search is on its way keeps it. With a header, the empty state leaves Clear to it. `useDataList` returns `narrowed` and `filterLink` too, `view.unfiltered`, and `state.href(patch)`. See `datatable.md`, "A list page".
- `DataTable`: `sort-options` puts a sort select in the toolbar for a page too narrow for the headers that sort, and `sort-select-class` hides it once they have room (`@5xl/page:hidden`). `table-class` puts classes on the `<table>`, such as `table-fixed`. `class="framed"` draws the table in a card. Each body row is positioned, so a link in the row can stretch over it (`after:absolute after:inset-0`), with the checkbox cell above it. The toolbar's search box now fills the room the other controls leave, rather than stopping at 24rem; on a phone it takes a row of its own and the buttons and selects share the next. An app that wants the old cap adds `[&>.controls>.search]:max-w-96` to the list.
- Recipes: the list page (`recipes.md` §2) is rebuilt on these, as the starter kit's users list is: the count and Clear under the title, a card per status that filters and counts the rows its link would show (a new `statusCounts` prop from the index), the name as the row's link with a chevron instead of an Edit button, columns that appear as the page has room and fold under the name until they do, filters in a drawer, Add product, and a way back from the edit and tags-and-photos pages to the list as it was left. `stat.md` has the stat card that filters.

- `Repeater`: rows can be dragged by a grip at the start of each row's header, as well as moved with the arrows. The other rows slide aside to show where it will land, Escape puts it back, and the list scrolls near the edge of the page or drawer. A drop is a move like the arrows', so errors go with the row and the live region announces it, and focus stays where it was (or, as with the arrows, goes to the row's other arrow when the drop disables its own). A drag is put back when `disabled` turns on, when the rows are replaced under it, or when the Repeater unmounts, and a disabled `<fieldset>` around the Repeater makes the grip inert as it does the arrows. The grip is pointer-only (hidden from screen readers, not focusable); the arrows stay for the keyboard and screen readers, and as the single-pointer alternative WCAG 2.5.7 asks of a drag. The grip comes first in the header: see Breaking.
- Browsers: the README and the skill now state the minimum versions, Chrome and Edge 135, Firefox 147 and Safari 26.2 (iOS 26.2). Below them, `command`/`commandfor` buttons, which open every dialog and drawer, do nothing, and dropdowns lose their anchoring. There is no polyfill. `.inverse` regions need Firefox 151.
- `DataTable`: on a phone, a table whose cells hold an `sr-only` span (an Edit link's row name, as `datatable.md` shows) no longer makes the whole page scroll sideways; the scroll box is positioned, so it clips the span. A hand-built table wrapper wants `relative overflow-x-auto`, as `table.md` now says.
- Date-range filters: in Chrome, which commits a date field at every digit, typing a date no longer scrambles the range (a half-typed year read as 0002 was earlier than the start, so the two dates were swapped while being typed). A date is sent once its year has four digits, and a reversed range turns round when the reader leaves the field.
- `useUnsavedChanges(form)` keeps an unsaved draft in the page's history entry. Back, then Forward, used to bring the page back as the server sent it, and the edits were lost without a question; now the latest draft comes back, still unsaved. A reload, a new visit, a Discard, a successful save (including one that redirects to another page) and an OK to the leave question all start from the server's data; a failed save, and one Back cut short, keep the draft. A list on the page that changes its URL shares the draft across its history entries. Passwords (`password`, `password_confirmation`, `current_password`) are never kept. `allowLeaving()` drops the draft too. `{ remember: "key" }` names the slot for a second guarded form on one page, and `{ remember: false }` turns it off, as a form edited in a dialog or drawer should; the message can also be given as `{ message }`. The draft's notes for the tab (when each was last cleared, and the page a reload left) live in `sessionStorage` under `altpro-ui:`. Don't give `useForm` a remember key of its own: Inertia brings that draft back as the defaults, so the form looks saved and Save sends nothing.
- `useUnsavedChanges`: two guarded forms with unsaved changes on one page ask one question between them, and both take the answer; they used to ask once each. `leaveWithoutAsking()` lasts until the next page has landed in the app (the login page an inactivity logout goes to), so the next reader's forms are guarded again; it used to last for the rest of the document.
- `Field` with `now`, and a date `Field` given a Laravel timestamp (`2026-10-13T09:30:00.000000Z`): after an Inertia visit to the page the input showed empty while the form held the date, so a reader who left it "blank" sent today's date. The input now shows what the form holds, on a visit as on a page load, and `onMounted(() => form.defaults())` still takes the value.
- `TableQuery` and the list's URL reading: a search, sort, page, page size, filter value or date holding a NUL byte or invalid UTF-8 is read as absent, as a wrongly shaped parameter already was, on the server and in the browser alike (`U+FFFD` too, which is how the browser reads invalid UTF-8). Postgres refused such values, so a made-up URL was a 500. A date range whose ends both hold such bytes now takes the filter's default rather than reading as no range.
- Date-range filters in client mode compare each row's day as the reader's calendar shows it: a timestamp as Laravel sends one (`…T23:30:00.000000Z`) counts on the local day, a bare date never moves, and a value that is no date matches no range. They used to compare the first ten characters, so an order at 00:30 BST counted as the day before, and a non-date could match. `DataTimeline`'s `time-zone` now sets the filter's days too, as it does the headings'.
- The skill's recipes no longer give routes, controllers, models or policies: those are the app's, follow its own conventions, and were never run by the package's tests. `recipes.md`, `destructive-action.md` and `check.md` now give the Vue page, what each endpoint must return, and the rules a screen breaks without. Two rules are new. A bulk action over "everything matching" reads its search and filters through `TableQuery::selection()` (below). A request that asks for the current password (deleting an account) limits the attempts and answers past the limit with a validation error on `password`, so the dialog shows it. The list page keeps its index, as `TableQuery` is this package's.
- `TableQuery::selection($request, $filters)` reads a "Select all N matching" bulk request's `selection.search` and `selection.filters` from the body, with the checks `view()` and `filters()` give the URL, and returns `['search' => …, 'filters' => …]` in `filters()`'s shape. A nested array, a NUL byte or invalid UTF-8 reads as absent, as in the URL; they reached the database as a 500 before. `TableQuery::search()` now takes a null search as none: Laravel turns the table's empty `""` into `null`, so a bulk action with nothing typed was a TypeError. An app with a bulk action should switch to `selection()`; see `datatable.md`.
- `useUnsavedChanges`: a password field nested in the form (`user.password`, `accounts.0.current_password`), or handed to `form.defaults()` inside an object, no longer goes into the history draft; only top-level ones were kept out. A form holding any other secret passes `{ remember: false }`. A visit that `allowLeaving` let go, then stopped by another guard's Cancel or its own cancel token, puts the guard back, and the form's draft with it; the guard used to stay off, so the next leave went unasked, and Back and Forward lost the edits. A guard can take `{ get isDirty() { … } }` for a test with no save of its own, which asks on a `put`, `post` or `delete` too, as the tags-and-photos page's uploads guard now does.
- `Combobox`: an Add whose answer comes after the reader picked another value no longer replaces that value; the new record exists, and a search finds it.
- Recipes: the tags-and-photos page saves tags as the edit page saves, so a tag picked while the save is under way stays unsaved; it used to be taken as saved, and lost on leaving. A photo removed after its last byte has been sent is deleted once the server answers, rather than cancelled, as the server may already have stored it; it used to stay stored.
- A list visit cancelled before it starts, as an unsaved-changes guard cancels one when the reader stays, is forgotten. It used to ride along in the next change's URL: a cancelled Status = Draft came back with the next sort.
- Recipes: the edit page's save gives the form's defaults what was sent, so text typed while the save is under way stays unsaved (Inertia would otherwise take it as saved); `save-bar.md` does the same. The tags-and-photos page asks before leaving with unsaved tags or a photo still uploading, Log out included, and a photo whose delete fails (a `403`, a `500`, no network) comes back in its place with "The photo was not removed. Try again.", as it is still stored. Two that fail together come back in the order they were added.

## 0.4.1 (12 November 2026)

- `ConfirmDialog` takes `form`, the id of a form its body brings itself, such as Inertia's `<Form>` as Laravel's starter kit writes forms. The confirm button submits that form instead of sending `@confirm`, and while `busy` a press submits nothing. See `confirm-dialog.md`.

## 0.4.0 (12 November 2026)

**Breaking**:

- Two new component classes, `.tile` and `.save-bar`, take over any class of the same name an app has. **An app with its own `.tile` (the altpro starter kit has one, in `resources/css/components/tile.css`, with `TileCheck.vue`) must delete it** and move its tiles to the library's markup: a visible `<input class="checkbox">` or `<input class="radio">` inside `<label class="tile">`, with no `group`, `TileCheck` or `has-[input:checked]:bg-primary/5`, as `tile.md` shows. An app with its own `.save-bar` must rename it or delete it.

New:

- `.tile`: a checkbox or radio drawn as a card, for a choice with a description or a picture. The input stays visible, so a reader can tell one choice from several and forced colours still show the state; the tile draws the focus ring, the checked edge and tint, disabled and invalid. See `tile.md`.
- `.save-bar`: the sticky status, Discard and Save of a long form, which `save-bar.md` used to build from utilities. Its `role="status"` line is muted, keeps its height so text arriving does not move the buttons, takes a line of its own above the buttons in a bar narrower than 30rem, and takes no line while empty. Replace `sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background py-3 print:hidden` with `save-bar` (keep `-mx-gap px-gap` and `col-span-full` where you had them), and drop the classes on the status `<p>`. On a card: `[--save-bar-bg:var(--color-card)]`.
- `ConfirmDialog.vue`: a `.dialog` that asks before an action and holds itself open while its request runs. While `busy`, Esc, the cross and Cancel do nothing, a close that gets through anyway (a Safari without `closedby`, a repeated Esc) opens it again, and the confirm button keeps focus as `loading` and `aria-disabled`. Focus starts on Cancel, or on a body field with `autofocus`; Enter in the body confirms. A hand-written confirm dialog with `:closedby`, `@cancel` and `disabled` bound to its form's `processing` can become one. See `confirm-dialog.md`; `destructive-action.md` now uses it.
- `useUnsavedChanges` is now in the library, `import { useUnsavedChanges } from "@ui/useUnsavedChanges"`, instead of code each app copies. It takes the form or a function (`() => a.isDirty || b.isDirty`), returns `allowLeaving()` for a visit that ends the form's need (deleting its record), and comes with `leaveWithoutAsking()` for a logout for inactivity. Once the user has said OK to leaving, a full page load after it no longer asks a second time; a visit to the page's own URL keeps the draft instead of remounting the page. The default question is now "Leave this page? Your changes won't be saved." An app can delete its `resources/js/composables/useUnsavedChanges.js` and change the imports; the call is the same.

Skills (run `php artisan boost:update` to get them):

- The app shell's `<main>` is the page frame: `@container/page flex flex-1 flex-col gap-gap p-gap`. Pages put their content straight inside `<AppLayout>`, without their own `<div class="flex flex-col gap-gap">` or `@container/page` wrapper. An app that copied the layout can add the classes to its `main` and drop the wrappers page by page; a page that keeps one still works. To cap every page's width on very wide screens, add `mx-auto w-full max-w-[100rem]` to `main` once.
- `scroll-pb-28` on `<html>`, up from `scroll-pb-20`: on a phone the save bar's status takes its own line, and a field tabbed to could sit behind the taller bar. Change it in the app's root view.
- Save on an unchanged form sends nothing and the status says "No changes to save.", in `save-bar.md` and the edit page in `recipes.md`.

## 0.3.7 (11 November 2026)

- The page keeps room for its scrollbar on every page (`scrollbar-gutter: stable` on `:root`), so content no longer jumps sideways between a short page and a long one with classic scrollbars (Windows, Linux). On a short page the strip shows the page background. Overlay scrollbars (macOS, mobile) are unaffected. An app that set `scrollbar-gutter` itself, or padded the page to make up for a missing scrollbar, can remove that. Markup is unchanged.

## 0.3.6 (11 November 2026)

- A `DataTable` column can name its header for screen readers only: `srOnlyLabel: true` keeps `label` in an sr-only span, for a column whose cells say what it is, such as a chevron linking to each row. An app that left such a header's `label` empty, so it had no name, should give it one and set this. A sortable column ignores it. Run `php artisan boost:update` to get the reference.

## 0.3.5 (9 November 2026)

- `DataList` is the frame `DataTable` is now built on: search, filters, the count, page size and pagination round whatever you render, such as a card grid. Call `useDataList` from `@ui/dataTable` and hand it to `<DataList :list>`. `sort-options` gives a list with no headers a sort select. See `datalist.md`. `DataTable`'s rendered markup is unchanged.
- `DataTimeline` is a searchable, filterable, paged `.timeline` grouped by calendar day, taking the same `TableQuery` paginator. See `datatimeline.md`. `.timeline` gains `trailing`, which moves each `<time>` to a right-hand column when there is room.
- `filter-display="drawer"` on `DataTable`, `DataTimeline` or `DataList` keeps the filters, and any sort select, in a drawer behind one Filters button, with Apply. Its badge counts the filters in force, or with `filter-count="changed"` only those the reader changed.
- A `#filter-<key>` slot draws a declared filter yourself, and it is counted, cleared and drafted like the rest. `:search="false"` removes the search box.
- A change made while a server visit is on its way builds on it. Two quick ticks in a `multiple` filter, or a filter and a search, lost the first because the next visit cancelled it. Markup is unchanged. `useTableState` gains `latestFilters`, which an app building its own controls on it should bind them to.
- A poll no longer dims the list every time it reloads the rows, and another list's partial reload no longer dims a list held in the browser.
- A long list's pager no longer makes a phone's page scroll sideways. Below 28rem, with six pages or more, it shows Previous, the current page and Next. Markup is unchanged.
- A second click on a column header before the first has been answered turns the sort round again, instead of doing nothing.
- Run `php artisan boost:update` to get the new references.

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
