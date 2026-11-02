# Changelog

Apps pin `altpro/ui:^0.1` (npm `github:altpro/ui#v0.1.2`). On 0.x a breaking change bumps the minor version (0.1 to 0.2), which `^0.1` already stops at, so apps take it only when someone raises the constraint. Each release lists its breaking changes first, under **Breaking**, with what to change in the app.

## Unreleased

- A clickable avatar's `aria-label` starts with the initials it shows, then says who or what (`aria-label="GH, Grace Hall's profile"`). A label without them fails WCAG 2.5.3 (Label in Name), which axe 4.14 now checks: a voice-control user says what they see.

- `DataTable.vue` keeps focus in the table when the button pressed goes away (WCAG 2.4.3). Before, it fell to the page body. Next on the last page but one, and Previous on page two, hand it to the current page's button. Clear filters hands it to the search box, "Select all N matching" to the selected count, and the bulk bar's Clear, or a bulk action that clears the selection, to the header checkbox.
- `DataTable.vue` emits `update:selection` only when the selection changes. Before, a "matching" selection was emitted again on every parent render, and a parent that passed an inline array prop (`:searchable="['name']"`) looped until Vue stopped it with "Maximum recursive updates".

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
