# Sample application

A demo store for Forma, a fictional audio shop, built from the altpro/ui components. Nothing here is part of the library: the screens' own classes are prefixed `demo-` and live in `app.css`, the shell's in `../demo.css`. An application built on altpro/ui writes its own.

Run `npm run dev` from the repository root and open `/app/dashboard.html`.

- **Overview:** sales figures and a chart for any period (a preset or two dates, like the DataTable date filter), sales by category, popular products, recent changes and low-stock links.
- **Products:** search, category and stock filters, sorting, pagination, table/grid views, selection, CSV export and product creation.
- **Product detail:** editable information and image upload in a drawer, a pricing dialog, an inventory drawer with add/remove/reorder via Repeater, status popovers, per-finish editors and a storefront preview.
- **Activity:** product history, team notes and a workspace reset.

The screens were designed in the theme drawer's **Sol** preset and work in every preset.

`catalogue.json` supplies the starting data, and `store.js` makes up a daily sales history that is the same every time for a given day. Edits stay in sessionStorage in the current browser tab; Reset workspace restores the original data. There is no backend. Product illustrations are local SVGs that follow the theme.

Run `npm run build` and `npm test`. To test an isolated checkout alongside another preview, set `UI_TEST_PORT` (for example `UI_TEST_PORT=5201 npm test`).
