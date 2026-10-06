# Table: `.table`

A data table on a native `<table>`. Children are styled by element, so no cell classes exist.

```html
<table class="table hover">
  <caption>Invoices for the last quarter.</caption>
  <thead>
    <tr>
      <th><button type="button">Invoice</button></th>
      <th aria-sort="ascending"><button type="button">Date</button></th>
      <th class="text-right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>INV-001</td><td>1 Jul 2026</td><td class="text-right tabular-nums">£250.00</td></tr>
  </tbody>
  <tfoot>
    <tr><th scope="row" colspan="2">Total</th><td class="text-right tabular-nums">£250.00</td></tr>
  </tfoot>
</table>
```

| Child | Role |
|-------|------|
| `thead th` | Column header, muted, medium weight, line underneath. |
| `tbody th` | Row header, give it `scope="row"`. |
| `tfoot` | Totals, line above each row. One row is medium weight; with several, the last (the total) is semibold and the rest regular. |
| `caption` | A muted note under the table. |
| `th > button` | A sort control. `aria-sort="ascending"` or `"descending"` on the `th` draws the arrow; the app sorts. |
| `tr[aria-selected="true"]` | A highlighted row. Also automatic when the row's first cell holds a checked checkbox. |

| Kind | Classes |
|------|---------|
| Style | `striped` (every other row tinted), `hover` (the row under the pointer tinted). |
| Size | `sm`. No size = 2.25rem rows, matching the default button. |

- Alignment is a utility on the cell: `text-right tabular-nums` for numbers. `w-px` on a header shrinks its column to the content, for a checkbox or action column.
- A checkbox column is a `label class="checkbox"` in every first cell with an `aria-label`. An action column is a `btn ghost sm` opening a `.dropdown right`.
- A table never wraps its width. Put it in an `overflow-x-auto` wrapper with `tabindex="0"` to scroll sideways; the tabindex lets keyboard users scroll it.
- As a direct child of a `.card` (or a scroll wrapper that is), it runs edge to edge and its cell padding becomes the card inset. The last row takes the card's bottom corners.
- Row backgrounds are on the cells, so `bg-*` goes on `td`, not `tr`.

## Line items and totals (pattern)

The read-only order or invoice; editing the lines is `Repeater.vue`. `tabular-nums` on the table lines up the digits, `text-right` on the `tfoot` aligns labels and amounts, and each label is a `th scope="row"` spanning the columns before the amount.

```html
<table class="table tabular-nums">
  <thead>
    <tr>
      <th>Item</th><th class="text-right">Qty</th>
      <th class="text-right">Unit price</th><th class="text-right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Task chair</td><td class="text-right">2</td>
      <td class="text-right">£135.00</td><td class="text-right">£270.00</td>
    </tr>
  </tbody>
  <tfoot class="text-right">
    <tr><th scope="row" colspan="3">Subtotal</th><td>£270.00</td></tr>
    <tr><th scope="row" colspan="3">Delivery</th><td>£25.00</td></tr>
    <tr><th scope="row" colspan="3">VAT at 20%</th><td>£59.00</td></tr>
    <tr><th scope="row" colspan="3">Total</th><td>£354.00</td></tr>
  </tfoot>
</table>
```

Custom properties: `--table-fg --table-head-fg --table-border --table-stripe --table-hover --table-selected --table-px --table-py --table-text`.
