# TODO

Components the CMS, CRM and order-management apps are likely to need. Anything needing JavaScript is a Vue component only. Drawers (`.dialog.drawer`) and bulk actions (DataTable's `bulk-actions` slot) already exist.

## Next

In this order: `.dl` and the empty state are quick wins, then the combobox prototype.

- [x] **`.dl` description list**: label/value pairs for record pages (customer details, order summaries, addresses, publication metadata). Stacked and side-by-side layouts. CSS only. `demo/app/product.html` builds it by hand twice.
- [x] **Empty state pattern**: title, explanation and action for an empty relationship, attachment list or activity feed. A SKILL.md section, following DataTable's split between "nothing yet" and "nothing matches".
- [ ] **Combobox**: the one component for anything a native `<select>` can't do. A native `<select>` stays the answer for one pick from a short fixed list. For choosing the customer on an order, a product for a line item, tags, an author, supplier or assignee. Vue only. Filament's searchable select is a reference for behaviour, not API.
  - Prototype the accessibility first, with real VoiceOver on Safari: how the closed trigger announces its label and value, and keyboard behaviour in both single and multiple modes. VoiceOver's support for `aria-activedescendant` in comboboxes has been patchy.
  - Same API and look in every mode; the semantics may differ. A trigger button styled like `.input` shows the value and opens a popover. With search, the search box is the ARIA combobox controlling a listbox. `multiple` without search may stay a checkbox panel, as multiselect is now; `multiple` with search is a listbox with `aria-selected` options and checkmarks. Never checkboxes inside options. The prototype decides.
  - `options` alone: pick one. Over 12 options, the search box appears and filters locally; `searchable` overrides that either way.
  - `multiple`: the panel stays open while ticking; the trigger shows "Small, Medium…" and a count. The clear button sits beside the trigger, not in it, as would any chips (a button can't hold buttons).
  - `src`: search runs on the server and the search box always shows. A URL gets `GET src?q=acme` returning `[{value, label}]`, by plain `fetch` (not an Inertia visit) with Laravel's XSRF cookie value sent as the `X-XSRF-TOKEN` header. A function `(q) => Promise<[{value, label}]>` covers any other request or auth. Labels of selected records are kept apart from the current results, seeded from `options`, so "Acme Ltd" (not 42) shows before any search and stays after searching for something else.
  - `create`: turns search on. An "Add 'xyz'" option when no result matches exactly (ignoring case). `POST create` with `{label}` returns `{value, label}` and selects it; a 422 shows its error in the panel. The server decides whether to create or return an existing record, and owns permissions.
  - Async basics: debounce, drop stale responses, loading, no-results and error states, a server result limit. Decide what an empty query shows in the prototype.
  - `required` sets `aria-required` only; the server validates and `.field` shows its error. Keep `max`, `form=`, `disabled` (nothing submitted), and both resets: native form reset and Inertia's `reset()`, which write to inputs without events (see `domModel.js`).
  - Replaces multiselect. Move its behaviour tests to the combobox first, then delete `Multiselect.vue`, `multiselect.js`, the Blade component, its demo page and tests, keeping its summary and count CSS. DataTable's `multiple` filters switch to `Combobox multiple`. Field's Vue `type="multiselect"` becomes `type="combobox"`; Blade field loses `type="multiselect"`, leaving native selects and checkbox groups. Then update AGENTS.md's Layout, which still names `multiselect.js`.
  - Ruled out: `<datalist>` can't keep an ID separate from the label and can't be styled; `appearance: base-select` is Chrome-only and doesn't search a server.
- [x] **Date range DataTable filter**: orders placed, overdue tasks, scheduled content. A `daterange` filter type beside `select`, `multiple` and `boolean`: two native date inputs and a clear button, held in the URL view. Touches `dataTable.ts`, `TableQuery.php` and `tests/table-urls.json` together.
  - Named parameters `{key}_from` and `{key}_to`, not a `[]` pair: both readers drop empty `[]` values, so a pair loses which end was set. Either end works alone.
  - Add invalid dates, reversed ranges and clearing back to the default as `tests/table-urls.json` cases.
  - Document for timestamp columns: inclusive start, exclusive end at the start of the next day, both in the app's timezone. The app writes the query, as with other filters.
- [x] **Repeater**: order lines, contact methods, product attributes, CMS links. A Vue component around `v-for`, with a slot per row. Add and remove rows, move up/down buttons; drag reordering later, alongside the buttons, never instead of them. Focus moves sensibly after a row is removed or moved. Build it on an order edit page in `demo/app/`. Filament's repeater is a reference.
  - Row identity is not submission position. Each row gets a UI key kept outside the submitted data; `lines.0.qty` is only its position in the submitted array.
  - Server errors are mapped from position to row key when they arrive, then move with their row; removing a row drops its errors. Add, remove and move are disabled while the form is submitting.
  - The app supplies a function that makes a new row.
- [x] **File input and drop zone**: CMS images, CRM documents, invoices, delivery evidence. Style native `<input type="file">` first; a Vue component adds drag-and-drop and a list of chosen files with filenames, image previews, removal, progress (`.progress`) and per-file errors. The app owns uploading and storage.

## When an app asks

- [ ] **Activity feed**: extend the timeline examples with notes, attachments and before/after values.
- [ ] **Line item totals**: `.table` pattern with a `tfoot` for totals and tabular-nums for right-aligned money. Editing the lines is the repeater.
- [ ] **Record header**: title, status badge, action buttons. A SKILL.md pattern.
- [ ] **Save bar**: sticky save/discard bar for long edit screens. Layout pattern only; the app tracks unsaved changes and saving state (Inertia's `form.isDirty`, `form.processing`).
- [ ] **Tree**: nested `<details>` with links for page hierarchies and category trees. CSS only. Not the ARIA `tree` pattern; selection and reordering wait for a real requirement.
- [ ] **Copy button**: order numbers, tracking codes, emails. Small Vue component; the tooltip says "Copied".
- [ ] **Date range presets**: "Today", "Last 30 days" on the daterange filter.
- [ ] **Kanban**: CRM pipeline. Expensive, because drag-and-drop has to work from the keyboard too. Only if a CRM needs it.

## Not building

- **Rich text editor**: style the CMS's editor (Tiptap or similar) with the tokens, add a content style for the HTML it produces, and document one integration example.
- **Date picker**: native date inputs already work through `.field`.
- **Charts, calendars, command palette**: use a library, or leave them out.
