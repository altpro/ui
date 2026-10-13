# TODO

The components the first CMS, CRM and order-management apps need are built, and the fourth review's findings (13 October 2026) are fixed. This list is what is left of the v0.1.0 release, and what waits until an app asks. Anything needing JavaScript stays a Vue component only.

## Release v0.1.0

- [x] **The kit as the real consumer** (13 October 2026): it builds and passes CI against this repo as a path repository. List and search, an invalid save, a successful save, an upload and a bulk archive all worked in an app made from the kit. The recipe PHP needed PHPDoc for Larastan (07f8d75). A path repository symlinks `vendor/altpro/ui`, so Vite bundled a second Inertia from `../ui/node_modules`; the kit dedupes `@inertiajs/vue3` until it installs from GitHub. The kit has no tables yet, so the `per-page` rename and default sort wait for its first one. Not tried: creating tags through the combobox.
- [x] **Date the changelog** and **tag `v0.1.0`** (13 October 2026).
- [x] **Switch the kit to the GitHub repository** at `^0.1` (kit 17c0a69), and drop its `dedupe` line.
- [ ] **The kit's `ALTPRO_UI_TOKEN` secret**: a fine-grained token with read access to this repo's contents. The kit's CI fails at `composer setup` until it is set.

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
