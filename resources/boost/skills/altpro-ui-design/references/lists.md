# List pages

Rules for a page whose job is a list of records: a table or a grid, with its search, filters, tabs and selection. In `altpro-ui`, `datatable.md` and `recipes.md` have the code for an Inertia app, and `list-page.md` has it for a list built by hand.

## Structure

- **A list page has its primary action** when the app can create a record: "New job", "Add product", a `btn primary` at the end of the title row. Creating a record is the most common thing done from a list.
- **Lists hold still.** A table that filters, sorts or pages is `table-fixed` with a `<colgroup>` of widths, so its columns don't jump when the rows change. The count and Clear sit in the toolbar's row, so the table doesn't drop when a filter starts.
- **Columns appear when they fit.** Add up the fixed columns and keep at least 16rem for the name, and fold the row until the page is that wide, with the same threshold on the `col`, `th` and `td`. Between the phone and the full table a row of cramped columns scans worse than the folded one.
- **A stat that filters the list is a link.** The whole card is the link, with a chevron at every width. The current one takes `aria-current="true"` and the `secondary` fill.
- **A row's title is its link.** It is the name the record's `h1` uses, not its code. Drop a repeated "Open" button on every row, and write it `font-medium hover:underline focus-visible:underline`, because a column of `.link` is the loudest thing on the list. Stretch the link's hit area over the row (`::after` with `inset-0` on a `relative` row), with checkboxes above it. A row that opens an editor instead of a page shows a quiet pencil, because a plain value doesn't say it can be edited.

## Filtering and state

- **A list's state lives in its URL.** Search, filters, sort, page and view survive a reload, and a record's way back (its link and its breadcrumb) returns to the list as it was left. A link that arrives to act on a queue sorts the worst first.
- **Search finds what the placeholder promises.** "Search products or SKU" reaches every variant's SKU, and the row then names the variant it found and shows that variant's stock and price, not the product's total.
- **Counts name their base,** counted against what the filters allow: "4 of 14 open jobs", not "4 of 18 jobs" when 4 are collected and hidden. A filter means what the column it filters says: if drafts can read "Out of stock", a stock filter that leaves them out says so by moving to the Active tab. Show a list's count only when a filter narrows it; unfiltered, it repeats the stat above.
- **An empty list isn't always a failed filter.** With nothing filtered, say what belongs there ("No draft products. New and duplicated products start here.") and offer no Clear button.
- **Clear means one thing.** Every Clear and Reset on a list leaves it in the same state.

## Selection

- **Selection shows its state and moves nothing.** A header checkbox is mixed (`:indeterminate.prop`) when some rows are selected. In a hand-built list the bulk bar lies over the header row, absolutely positioned in the header cell, so ticking a row can't move the next one under the pointer; `DataTable.vue` shows its own bar above the table. A bulk action counts only the rows it will change.
