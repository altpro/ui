# Sample application

A demo store for Forma, a fictional audio shop, built from the altpro/ui components. Nothing here is part of the library: the screens' own classes are prefixed `demo-` and live in `app.css`, the shell's in `../demo.css`. An application built on altpro/ui writes its own.

Run `npm run dev` from the repository root and open `/app/dashboard.html`. Open a product from the Products list.

- **Overview:** one period (a preset or two dates, like the DataTable date filter) drives the sales figures, a chart that reads out each day, sales by category and top products, which all add up. Low stock and recent changes sit beside them.
- **Products:** search, category and stock filters, sorting, pagination, table/grid views, selection, CSV export and product creation. The list keeps its state in the URL.
- **Product:** a primary button that follows what the record is waiting for, editable information and image upload in a drawer, a pricing dialog, an inventory drawer with add/remove/reorder via Repeater, a status popover, per-finish editors and a storefront preview. Editors ask before discarding changes.
- **Activity:** product history, team notes and a workspace reset.
- **Recipes:** `recipe-products.html`, `recipe-product.html`, `recipe-media.html` and `recipe-settings.html` are the app shell's Inertia root view. They run the skill's app code as `references/` writes it (`recipes.md`, `app-shell.md`, `validation-failure.md`, `unsaved-changes.md`, `destructive-action.md`): `layouts/AppLayout.vue`, `components/UserMenu.vue`, `pages/` and `toast.js`, which `tests/skill-code.test.js` keeps identical to the reference files. `lucide.js` stands in for `@lucide/vue` and `.env` gives `VITE_APP_NAME`. `server.js` stands in for Laravel: it shares the signed-in user, answers Inertia visits, `useHttp` and the combobox's `fetch`, and keeps its data in sessionStorage. The settings page's password is `password`.

The screens were designed in the theme drawer's **Sol** preset and work in every preset.

`catalogue.json` supplies the starting data, and `store.js` makes up a daily sales history that is the same every time for a given day. Edits stay in sessionStorage in the current browser tab; Reset workspace restores the original data. There is no backend. Product illustrations are local SVGs that follow the theme.

Run `npm run build` and `npm test`. Each checkout tests on its own port; `UI_TEST_PORT` picks another.
