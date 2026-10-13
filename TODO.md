# TODO

The components the first CMS, CRM and order-management apps need are built, and the fourth review's findings (13 October 2026) are fixed. This list is what is left before tagging v0.1.0, and what waits until an app asks. Anything needing JavaScript stays a Vue component only.

## Before tagging v0.1.0

- [x] **The kit as the real consumer** (13 October 2026): it builds and passes CI against this repo as a path repository. List and search, an invalid save, a successful save, an upload and a bulk archive all worked in an app made from the kit. The recipe PHP needed PHPDoc for Larastan (07f8d75). A path repository symlinks `vendor/altpro/ui`, so Vite bundled a second Inertia from `../ui/node_modules`; the kit dedupes `@inertiajs/vue3` until it installs from GitHub. The kit has no tables yet, so the `per-page` rename and default sort wait for its first one. Not tried: creating tags through the combobox.
- [ ] **Date the changelog**: `CHANGELOG.md` says "0.1.0 (unreleased)".
- [ ] **Tag `v0.1.0`** once the kit installs and builds clean. The kit then pins `^0.1`.

## When an app asks

- [ ] **Kanban**: CRM pipeline. Expensive, because drag-and-drop has to work from the keyboard too. Only if a CRM needs it.
- [ ] **Repeater drag reordering**: beside the move buttons, never instead of them.

## Considered and left out

- llms.txt or an MCP server: the Boost skill does that job for a private library.
- RTL: mostly logical properties already. The switch thumb, drawer slide, and nav and breadcrumb chevrons are physical; `tree.css:115` shows the `:dir(rtl)` fix if an app ever needs it.
- Consumer-install checks in this repo's CI: the kit's CI is the consumer.
- Theme presets, an i18n system (English strings are fine for UK apps; keep them overridable by props as `searchPlaceholder` is), a standalone `kbd`.
- An `@supports (overlay: auto)` guard on the dialog's exit transition: Firefox and WebKit close it at once rather than fade, but it does not jump (`browsers.spec.js` checks).

## Not building

- **Rich text editor**: style the CMS's editor (Tiptap or similar) with the tokens, add a content style for the HTML it produces, and document one integration example.
- **Date picker**: native date inputs already work through `.field`.
- **Charts, calendars, command palette**: use a library, or leave them out.
