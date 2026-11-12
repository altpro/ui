---
name: altpro-ui-design
description: Compose screens and features built with altpro/ui so they're right first time. Use when building or reworking a page, dashboard, list, record page, form, dialog or user-facing feature.
---

# Screen design with altpro/ui

The `altpro-ui` skill says how each component is written. This one says how a screen and its behaviour come together, so it ships right on the first build: a screen a seasoned product designer would ship with only nitpicks.

Most of what holds a screen back is not any single component. It is **drift**: two cards padded differently, three styles of badge for one meaning, a phone layout that wrapped the desktop one instead of composing its own, copy that sold instead of informed. Read each rule as a guard against drift.

## Steps

1. **Plan the screen.** Before any markup, write a few lines: the user's next action and the fact they need for it, both of which belong in the first phone screenful; what the screen shows when it is empty, just created and after a failed save; and which kinds of screen it contains. Open each matching reference. Done when those lines exist and the references are open.

   | The screen has | Read |
   |----------------|------|
   | A list, table or grid of records | [lists.md](references/lists.md) |
   | One record's page | [records.md](references/records.md) |
   | A form, dialog, drawer or confirmation | [forms.md](references/forms.md) |
   | Stats, a chart or a period control | [dashboards.md](references/dashboards.md) |

2. **Build to the rules.** Write the screen with the rules below, the references from step 1 and the component references from `altpro-ui` in force. Done when the screen works with real data, every state from step 1 exists in the code, and the project's build passes, with its existing tests if it has any.

That is the whole check: the project's own build and tests, as they stand. A passing build is enough where there are no tests. Browser runs, screenshots and throwaway test scripts come only when the user or the project asks for them, and a design review only when the user asks, through the `altpro-ui-review` skill.

## Screen rules

### Priority

- **Order by the task.** What the user acts on next goes at the top. On a list it is what needs attention today; `records.md` says what it is on a record.
- **A control sits above everything it changes.** A period that drives the stats goes in the title row, not inside the chart under them. Say the range and what it is compared with once, in the subtitle, instead of "vs. previous 7 days" on each stat.
- **One control per choice.** Stat cards that filter the list and a sidebar of saved views that filter it the same way are two navigations for one decision. Keep one.

### Rhythm

- **One gutter.** `gap-gap` goes between every card and every row on a screen, and between items in a grid.
- **One card inset.** Use the default `--card-p`, or one value set once in the app's stylesheet. Never pad cards differently on the same screen.
- **Shared splits.** Rows of cards share their column split, so the gutters line up down the page. For example, two rows that are both `@4xl/page:grid-cols-3` with the wide card `@4xl/page:col-span-2`.
- **Cards end level.** Two cards side by side should end level because their content balances. Move a list, a group of facts or the tags to the shorter card. Don't spread a short list to fill the height (`justify-between`, `space-evenly`), and don't leave a hole with `self-start`. A record's sticky fact stack is the one exception (`records.md`).
- **Footers.** When a card still has spare height, give it a footer line with a fact in it, built the same way on every card of the screen:

  ```html
  <p class="mt-auto border-t border-border pt-3 text-sm muted">2 of 6 active products under 10 units</p>
  ```
- **One rule style per card.** If the table's row rules run edge to edge, the footer's rule does too and closes the last row. Inset rules belong to controls, such as the tab underline.
- **A footer straight after a table** pulls up by the card's gap (`-mt-(--card-p)`), so its rule sits where the next row's would. Otherwise the gap reads as an empty row.
- **A screen measures itself.** A sidebar takes width a viewport query can't see, so a laptop can have less room than a tablet. The [app shell](../altpro-ui/references/app-shell.md)'s `main` is `@container/page` (a page outside it puts it on its own root); compose the side-by-side rows, filters and table columns with its variants (`@4xl/page:grid-cols-3`), leaving `md:` for what really depends on the device. Beside the app shell's sidebar a page is 71rem wide at 1440, 61rem at 1280, and 45rem at both 1024 and 768, so `@4xl` (56rem) is the tier every laptop reaches, and `@5xl` (64rem) arrives at 1440 but not at 1280.
- **Repeated items share one structure at every width.** Cards in a grid and rows in a list keep the same order, with the price or status in the same place, whether a name wraps or not.

### Type and numbers

- **Nothing below `text-xs` (12px).** That includes chart axes, legends, captions and badges.
- **Headings follow the scale in `altpro-ui`.** A heading inside a `.card` or `.dialog` header takes no classes.
- **Big numbers.** Use `tabular-nums`, with `tracking-tight` on the figure only. A unit after it (`84 <span class="text-sm muted tracking-normal">available</span>`) resets the tracking. Say the unit once: `£249`, not `£249 GBP`.
- **Tabular figures go on number cells:** the price, quantity and total columns and the totals rows, never a whole table. They space the hyphen in "6-speed" as they do in a code.
- **Codes.** SKUs, order numbers and references use the body font with case forms (`[font-feature-settings:'case']`), which centre the hyphens on the capitals. Tabular figures leave gaps around the hyphens, and a system monospace falls back to Courier on Linux.
- **Typed text wraps.** A note, a reference or anything else a user typed takes `wrap-anywhere`, plus `whitespace-pre-line` where they can type line breaks. `break-words` doesn't lower the minimum width, so a pasted URL still widens the page. An email address keeps its domain whole, with `whitespace-nowrap` on `@example.com`, so it breaks at the `@`.
- **`text-pretty` on paragraphs,** so no line ends on one word.
- **One label style.** Sentence-case muted labels, as `.dl` draws them. An uppercase tracked eyebrow appears only where it carries information, such as a record's category above its name.
- **One bundled typeface.** Install one (for example `@fontsource-variable/inter`) and set it as `--font-sans` in `@theme`, so the app looks the same on every OS. System stacks fall back to Arial lookalikes on Linux, and then the screenshots lie.

### Copy

Write **operational** copy, the words of a working tool, never brochure copy.

- **Headings name what the card holds:** "Description", "Details", "Low stock", "Recent activity". Not "The details", "A little attention" or "Your space to try things".
- **A page's `h1` matches its label** in the nav and the breadcrumb. A saved view or filter that is a nav item is a page: it sets both ("Jobs › Overdue"). A record is the exception: its `h1` is its full name, and its breadcrumb uses the code or a short name that fits a phone header.
- **A subtitle says what the page covers** ("Sales, stock and changes across your store") or is left out. Leave out taglines, motivational lines, reassurance notes ("Your collection is looking good"), decorative punctuation on headings, and eyebrows that restate the heading.
- **Every figure reconciles, history included.** A count of 7 last week can't stand beside 8 sold since and 7 left today. Stats, the chart, the category split and the top products come from one set of rows for one period, so their totals match and their percentages add to 100. Margin is on the price without VAT, since a cost has none. A stock total is the sum of its variants, and a price that varies reads "From £249".
- **Each fact once per screen,** except a figure labelling its own mark, such as a bar on a one-day chart, and a record's latest update, which leads the page and stays in its history. A percentage on a stat card is not repeated in the chart footer. A count on a tab is not repeated in a summary strip.
- **One word for one state across screens:** "Out of stock" everywhere, never "0 in stock" in one view. The same goes for a figure: "In stock" in the table and the dialog, not "Available units" in one of them; "Sales" on every card, not "Revenue" on some.
- **Every value has a label** unless its form says what it is, as a date or a price does. A bare name in a facts line needs its role: "mechanic Marek Nowak".
- **Dates take one form across screens:** "Today", "Yesterday", then "4 Nov", with the weekday everywhere or nowhere. A chart is the exception: "Sat 31 Oct" explains the shape of the sales.

### Status and severity

- **One badge vocabulary.** Each meaning (status, warning, tag) gets one treatment, used on every screen and at every width.
- **Status is quiet,** because a column of solid fills shouts. A status is `badge soft dot` in its semantic colour, with the same classes everywhere it appears: `soft success dot` for live, `soft dot` for draft, `outlined dot` for archived.
- **The worst state is the loudest.** Out of stock is `soft danger`, low is `soft warning`, and fine has no badge. Show the scale only where it matters: an archived or draft record needs no stock warning. Use the same scale in the table, the grid, the phone layout, the record page and the dashboard.
- **One colour, one meaning.** A colour that marks a status isn't reused on the same screen for a deadline or a warning. Write a date in words ("Today" in `font-medium`) and keep colour for the one flag that needs it, such as Overdue in `soft danger`.
- **Map a workflow by what it asks of the reader.** Not started is `soft dot`. Under way is `soft info dot`. Blocked or waiting is `soft warning dot`. Done but waiting on someone else is `soft success dot`. Closed is `outlined dot`.
- **A state that changes what a status means** (Active, but off in every channel; Collected, with £80.78 owing in `soft warning`) is a badge beside the status, wherever the status appears; on a grid card, with the stock instead of over the picture.
- **Tags are `outlined` and neutral.**
- **On an image or a tinted surface,** use a `soft` badge, whose tint is mixed into the card colour, or give any other badge `bg-card`, so it stays visible.

### Actions and links

- **A card's own action is quiet:** `btn ghost sm text-muted-foreground hover:text-foreground`, text only. Every card action on the screen takes the same form.
- **Ghost buttons line up by their label,** not their padding. At the end of a header row add `-me-3`; at the start of a column add `-ms-3` (`-me-4` and `-ms-4` at the default size). The label then meets the card's inset.
- **`→` or a chevron-right means "go there in the app".** `↗` means an external site.
- **Anything that looks like a link is one.** Coloured text with an arrow that does nothing is a lie: make it a link, or plain text.
- **A toggle shows its value in both schemes.** A `.btn` with `aria-pressed="true"` takes the checked fill. In a `.join` of view switches, give the pressed one the `secondary` fill so it still reads in dark.
- **Focus never falls to the page.** Close a menu before opening a dialog from it, so the dialog returns focus to the menu's button. When an action removes its own control, as a finished bulk action or a next action does, move focus to what takes its place, and on touch not into a text field, where the keyboard would cover the result. A hand-built pager's last Next stays focusable: `aria-disabled` with a guarded click, because `disabled` drops the focus. `DataTable.vue` already moves focus to the current page. Whatever takes focus shows it: a results region with `tabindex="-1"` carries `focus-visible:outline-3 focus-visible:outline-ring/50`, and no `outline-none`, which cancels those classes.
- **A button that changes under the pointer counts once.** When the primary follows the record, a double-click or a held Enter fires the next step too, and a dialog that returns focus to it passes a second Enter straight on. Start `let last = -Infinity`, set `last = performance.now()` in every action that changes the primary, dialog submits included, and ignore a press of the primary within 500ms (`if (performance.now() - last < 500) return;`). Confirm the change with a toast, so a skipped step can't pass unseen.
- **Icons mean what they show.** A square check reads as a checkbox. A feed entry shows its type instead: a package for a product, a tag for a price, a speech bubble for a note.

### Phone (390px)

Compose each screen for the phone. Don't let the desktop layout wrap.

- **Stat strips** become a compact grid of equal columns. Each stat keeps its label above the number, as on the desktop, and the next card starts in the top half of the screen.
- **Tabs stay on one line,** with tighter padding (`[--tabs-px:0.5rem]`).
- **Tables fold.** Status, inventory and category columns hide (`max-md:hidden`). The lines under the name (`md:hidden`) carry what the user acts on: the status badge, any warning, the date that matters and who it is with. Every row takes the same lines, four at most: name, what identifies it, badges, then short facts joined with ` · ` ("Due yesterday · mechanic Lucy Hart"), each phrase `whitespace-nowrap`. The name takes the row's whole width, so a list's total folds too, onto the identifying line ("J-1041 · £231.00"). A value kept only for reference, such as a booked-in date, stays on the record one tap away.
- **A table of line items keeps its number columns, narrow on the phone** (`w-12 md:w-20` for a quantity), so item names get the width, with `max-md:px-1` on their cells and their `tfoot` cells so the padding doesn't take the figure's room. The price column stays. The thumbnail sits beside the name and code, and that line runs across the row beneath them.
- **Wrap names; never truncate them.** A model, a customer or a product name that tells two rows apart wraps. Move a short fact such as the date to its own line instead of cutting the name with an ellipsis.
- **Keep phrases together** in text that wraps. Put `whitespace-nowrap` on a status, a date or an amount inside a sentence, such as `<del>` and `<ins>` in a feed, so "In progress" never splits across lines.
- **Toolbars:** search goes full width, then one row of controls. Secondary labels become icon-only (`max-md:sr-only` on the label text).
- **Header controls drop under the title** (`max-md:basis-full`) instead of squeezing it onto two lines, and fill that row: two buttons in `max-md:grid max-md:grid-cols-2`, and a label too long for half the row takes the whole of it (`col-span-2`).
- **Grid cards stack** name, category and price in one column, so every card reads the same.
- **Galleries shrink** so the record's facts come up the page. Hide a decorative caption that would cover the image.
- **Page footers stack.** Nothing is clipped or runs off the edge.

### Dark scheme

- **Check every screen in dark.** Two surfaces that look alike in light can read as hovered or selected in dark. Give repeated items one surface colour.
- **Selected and pressed states need a fill that reads on `card` in dark.** `secondary` does; `muted` barely does.

### Imagery

- **Every item has its own picture.** Two identical images side by side read as placeholder content.
- **Product images sit on one stage colour,** drawn from the tokens, and don't invert in dark. A product is the same object in both schemes: a photograph doesn't change, so give an illustration's stage `color-scheme: light`. In dark, veil the stage so it isn't the brightest thing on the screen, and veil a small thumbnail less, so its object stays recognisable.
