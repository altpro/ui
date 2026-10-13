# TODO

The components the first CMS, CRM and order-management apps need are built, and the fourth review's findings (13 October 2026) are fixed. This list is what is left before tagging v0.1.0, and what waits until an app asks. Anything needing JavaScript stays a Vue component only.

## Before tagging v0.1.0

- [ ] **The kit as the real consumer**: build it against this repo as a path repository. Its CI covers install, Boost discovery, the type check and the build, so this repo needs no consumer fixture of its own. The recipes' list, bulk and upload controllers still only run against `demo/app/server.js`. Try each once in an app made from the kit (list and search, an invalid save, a successful save, an upload) before the first real app relies on them. The DataTable `paginate` prop is now `per-page`, and TableQuery sorts by the first sortable key when no `defaultSort` is given; check the kit's tables for both.
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
