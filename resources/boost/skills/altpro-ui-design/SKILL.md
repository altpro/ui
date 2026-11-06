---
name: altpro-ui-design
description: Design and polish screens built with altpro/ui to a shippable standard. Use when building or reworking a page, dashboard, list, record page, form or dialog, and when reviewing, polishing or screenshotting an app's UI.
---

# Screen design with altpro/ui

The `altpro-ui` skill says how each component is written. This one says how a screen built from them reaches a **9**: a screen a seasoned product designer would ship with only nitpicks. It comes from five rounds of design review on the library's own sample store (`demo/app/` in the altpro/ui repository), which took the screens from 7 to 9. Every rule below is something a reviewer blocked on. Building to them from the start skips most of those rounds.

Most of what held the screens back was not any single component. It was **drift**: two cards padded differently, three styles of badge for one meaning, a phone layout that wrapped the desktop one instead of composing its own, copy that sold instead of informed. Read each rule as a guard against drift.

## Steps

1. **Build to the rules.** Write the screen with every rule in [Screen rules](#screen-rules) in force, and the component references from `altpro-ui` open. Done when the screen works with real data, including its empty and phone states.
2. **Screenshot the set.** Every screen you touched at 1440 wide in light and dark, at 390 wide, and once with each dialog and drawer open. [review.md](references/review.md) has the script and the tall-viewport trick. Done when every PNG exists and you have opened each one.
3. **Review against the rules.** Take every screenshot through every rule section below, starting with [Priority](#priority), and score it out of 10. Before scoring a screen, write down the user's next action and the fact they need for it, and find both in the 390 shot: if either is below the first screenful, that is a blocking issue. Score as a stranger would: when an agent built two screens from this skill, its own scores ran 1 to 1.5 points above two independent reviewers' on the same shots. A blocking issue is a broken rule, or anything a product designer would send back. Done when each screenshot has a score and a list of its blocking issues, each with the rule it breaks and the fix.
4. **Fix and go again** from step 2. Done when every screenshot scores 9 and no rule is broken.
5. **Get an independent read** for a new screen, a redesign or a release. Don't skip it because your own scores reached 9. Send a fresh reviewer the screenshots and the brief in [review.md](references/review.md), with no access to your reasoning, because you will grade your own work kindly. Fix what it blocks on, repeat, and stop when it scores the set 9 with no blocking issues. Record the items you decline, with the reason for each.

## Screen rules

### Priority

- **Order by the task.** What the user acts on next goes at the top. On a record that is its state, the latest update or blocker, and the next action. On a list it is what needs attention today. Ledgers, contact details and the full history go lower, and lower still on the phone.
- **Show the result where the action was.** When finishing a task removes its button (the balance is paid, the order is shipped), the header says so: a badge in the row beside the title, for example `badge soft success` reading "Paid in full". It has no dot, because the dot marks the record's workflow status and this is a fact beside it, as Overdue is. Nobody should have to find a zero in a table to learn it.
- **Creating a record opens it.** The new row may be on another page, or out of the current tab, and the next step is on the record anyway. So a record's empty state is on the main path: a blank field says so ("No description yet."), not nothing.
- **A list page has its primary action:** "New job", "Add product", a `btn primary` at the end of the title row. Creating a record is the most common thing done from a list.
- **A record is named the way its users name it.** The `h1` is the customer, the item or both ("Niamh Gallagher's Ribble CGR AL"); a code such as J-1047 is the caption above it in an `hgroup`. A bare code tells nobody at the counter which job it is.
- **The primary button follows what the record is waiting for.** A list page's primary action is fixed; a record's is not. Stock low: "Adjust inventory". A draft: "Publish". Archived: "Make active". Off in every channel: "Choose channels", with those switches first on the phone. A primary that moves focus shows where it went, for a pointer too, with a ring on the card that goes once the change is made or focus leaves the card. Only a record waiting for nothing gets "Edit". The card that holds the same action drops its copy of the button while the header has it.
- **A control sits above everything it changes.** A period that drives the stats goes in the title row, not inside the chart under them. Say the range and what it is compared with once, in the subtitle, instead of "vs. previous 7 days" on each stat.
- **One control per choice.** Stat cards that filter the list and a sidebar of saved views that filter it the same way are two navigations for one decision. Keep one.

### Rhythm

- **One gutter.** `gap-gap` goes between every card and every row on a screen, and between items in a grid.
- **One card inset.** Use the default `--card-p`, or one value set once in the app's stylesheet. Never pad cards differently on the same screen.
- **Shared splits.** Rows of cards share their column split, so the gutters line up down the page. For example, two rows that are both `lg:grid-cols-3` with the wide card `lg:col-span-2`.
- **Cards end level.** Two cards side by side should end level because their content balances. Move a list, a group of facts or the tags to the shorter card. Don't spread a short list to fill the height (`justify-between`, `space-evenly`), and don't leave a hole with `self-start`.
- **Record pages** are a main column (`lg:col-span-2`) beside a stack of fact cards. The main column holds the record's working content: its items and, under them, its history and note form. Never run the history full width below both columns, where its lines grow too long and it falls below the fold. When the two columns don't end level, move a card between them; don't stretch the shorter one. On the phone, reorder with `max-lg:order-*` so a blocker, the latest update and the facts that identify the record come before the ledger.
- **Footers.** When a card still has spare height, give it a footer line with a fact in it, built the same way on every card of the screen:

  ```html
  <p class="mt-auto border-t border-border pt-3 text-sm muted">2 of 6 active products under 10 units</p>
  ```
- **One rule style per card.** If the table's row rules run edge to edge, the footer's rule does too and closes the last row. Inset rules belong to controls, such as the tab underline.
- **A footer straight after a table** pulls up by the card's gap (`-mt-(--card-p)`), so its rule sits where the next row's would. Otherwise the gap reads as an empty row.
- **A screen measures itself.** A sidebar takes width a viewport query can't see, so a laptop can have less room than a tablet. Put `container: page / inline-size` on the page and compose the side-by-side rows, filters and table columns with `@container`, leaving `md:` for what really depends on the device.
- **A long record's facts stay in view.** A main column of history can't end level with the fact stack on every record, because history length varies. Make the stack sticky (`sticky top-gap self-start`) rather than stretching a card, and rearrange cards only for the typical record.
- **Lists hold still.** A table that filters, sorts or pages is `table-fixed` with a `<colgroup>` of widths, so its columns don't jump when the rows change.
- **A form fills its card.** A form in a full-width card runs the card's width, with its button at the end of the field row. Otherwise put the card in a column as narrow as the form. A `max-w-2xl` form inside a wide card looks unfinished.
- **Repeated items share one structure at every width.** Cards in a grid and rows in a list keep the same order, with the price or status in the same place, whether a name wraps or not. A form asks in the order its table shows: In stock then Price in both, or a figure learned for one field lands in the other.

### Type and numbers

- **Nothing below `text-xs` (12px).** That includes chart axes, legends, captions and badges.
- **Headings follow the scale in `altpro-ui`.** A heading inside a `.card` or `.dialog` header takes no classes. When an `hgroup` puts a caption above a dialog's title, the caption names the record ("Arc headphones" over "Edit pricing"), never a paraphrase of the title. Creating something has no record to name yet, so it has no caption.
- **Big numbers.** Use `tabular-nums`, with `tracking-tight` on the figure only. A unit after it (`84 <span class="text-sm muted tracking-normal">available</span>`) resets the tracking. Say the unit once: `£249`, not `£249 GBP`.
- **Tabular figures go on number cells:** the price, quantity and total columns and the totals rows, never a whole table. They space the hyphen in "6-speed" as they do in a code.
- **Totals.** A rule closes the items and another sits over the total, and `.table` draws just those two in a `tfoot`. Subtotal, delivery and VAT are `muted` and the total is bold. Paid and balance due describe the payments, so they go with the payments, not under the work.
- **Codes.** SKUs, order numbers and references use the body font with case forms (`[font-feature-settings:'case']`), which centre the hyphens on the capitals. Tabular figures leave gaps around the hyphens, and a system monospace falls back to Courier on Linux.
- **`text-pretty` on paragraphs,** so no line ends on one word.
- **One label style.** Sentence-case muted labels, as `.dl` draws them. An uppercase tracked eyebrow appears only where it carries information, such as a record's category above its name.
- **One bundled typeface.** Install one (for example `@fontsource-variable/inter`) and set it as `--font-sans` in `@theme`, so the app looks the same on every OS. System stacks fall back to Arial lookalikes on Linux, and then the screenshots lie.

### Copy

Write **operational** copy, the words of a working tool, never brochure copy.

- **Headings name what the card holds:** "Description", "Details", "Low stock", "Recent activity". Not "The details", "A little attention" or "Your space to try things".
- **A page's `h1` matches its label** in the nav and the breadcrumb. A saved view or filter that is a nav item is a page: it sets both ("Jobs › Overdue").
- **A subtitle says what the page covers** ("Sales, stock and changes across your store") or is left out. Leave out taglines, motivational lines, reassurance notes ("Your collection is looking good"), decorative punctuation on headings, and eyebrows that restate the heading.
- **Every figure reconciles, history included.** A count of 7 last week can't stand beside 8 sold since and 7 left today. Stats, the chart, the category split and the top products come from one set of rows for one period, so their totals match and their percentages add to 100. Margin is on the price without VAT, since a cost has none. A stock total is the sum of its variants, and a price that varies reads "From £249".
- **A rate moves in points.** Conversion falls from 4.0% to 3.6%: "Down 0.4 pts", not "Down 9.0%". A change that rounds to nothing reads "No change" in `muted`, not "Up 0.0".
- **Each fact once per screen,** except a figure labelling its own mark, such as a bar on a one-day chart. A percentage on a stat card is not repeated in the chart footer. A count on a tab is not repeated in a summary strip.
- **One word for one state across screens:** "Out of stock" everywhere, never "0 in stock" in one view. The same goes for a figure: "In stock" in the table and the dialog, not "Available units" in one of them; "Sales" on every card, not "Revenue" on some.
- **A record's header holds what no card shows,** apart from the record's own name and when it last changed, which the Priority section puts at the top. Its facts line doesn't repeat details (an email, a frame number) that a card below holds.
- **Every value has a label** unless its form says what it is, as a date or a price does. A bare name in a facts line needs its role: "mechanic Marek Nowak".
- **Counts name their base,** counted against what the filters allow: "4 of 14 open jobs", not "4 of 18 jobs" when 4 are collected and hidden. A filter means what the column it filters says: if drafts can read "Out of stock", a stock filter that leaves them out says so by moving to the Active tab. Show a list's count only when a filter narrows it; unfiltered, it repeats the stat above.
- **A stat's label says its scope.** If "Due today" leaves out jobs that are ready for collection, it reads "Work due today".
- **Dates take one form across screens:** "Today", "Yesterday", then "4 Nov", with the weekday everywhere or nowhere. A chart is the exception: "Sat 31 Oct" explains the shape of the sales.
- **Errors say what to enter** ("Enter £245.16 or less") and don't repeat the hint above them.

### Status and severity

- **One badge vocabulary.** Each meaning (status, warning, tag) gets one treatment, used on every screen and at every width.
- **Status is quiet,** because a column of solid fills shouts. A status is `badge soft dot` in its semantic colour, with the same classes everywhere it appears: `soft success dot` for live, `soft dot` for draft, `outlined dot` for archived.
- **The worst state is the loudest.** Out of stock is `soft danger`, low is `soft warning`, and fine has no badge. Show the scale only where it matters: an archived or draft record needs no stock warning. Use the same scale in the table, the grid, the phone layout, the record page and the dashboard.
- **One colour, one meaning.** A colour that marks a status isn't reused on the same screen for a deadline or a warning. Write a date in words ("Today" in `font-medium`) and keep colour for the one flag that needs it, such as Overdue in `soft danger`.
- **Map a workflow by what it asks of the reader.** Not started is `soft dot`. Under way is `soft info dot`. Blocked or waiting is `soft warning dot`. Done but waiting on someone else is `soft success dot`. Closed is `outlined dot`.
- **Tags are `outlined` and neutral.**
- **On an image or a tinted surface,** use a `soft` badge, whose tint is mixed into the card colour, or give any other badge `bg-card`, so it stays visible.

### Actions and links

- **A card's own action is quiet:** `btn ghost sm text-muted-foreground hover:text-foreground`, text only. Every card action on the screen takes the same form.
- **Ghost buttons line up by their label,** not their padding. At the end of a header row add `-me-3`; at the start of a column add `-ms-3` (`-me-4` and `-ms-4` at the default size). The label then meets the card's inset.
- **`→` or a chevron-right means "go there in the app".** `↗` means an external site.
- **Anything that looks like a link is one.** Coloured text with an arrow that does nothing is a lie: make it a link, or plain text.
- **A row's title is its link.** Drop a repeated "Open" button on every row. Stretch the link's hit area over the row (`::after` with `inset-0` on a `relative` row), with checkboxes above it. A row that opens an editor instead of a page shows a quiet pencil, because a plain value doesn't say it can be edited.
- **Search finds what the placeholder promises.** "Search products or SKU" reaches every variant's SKU, and the row then names the variant it found and shows that variant's stock and price, not the product's total.
- **An empty list isn't always a failed filter.** With nothing filtered, say what belongs there ("No draft products. New and duplicated products start here.") and offer no Clear button.
- **A list's state lives in its URL.** Search, filters, sort, page and view survive a reload, and a record's way back (its link and its breadcrumb) returns to the list as it was left. A link that arrives to act on a queue sorts the worst first.
- **Selection shows its state and moves nothing.** A header checkbox is mixed (`:indeterminate.prop`) when some rows are selected. The bulk bar lies over the header row, so ticking a row can't move the next one under the pointer. A bulk action counts only the rows it will change.
- **A stat that filters the list is a link.** The whole card is the link, with a chevron at every width. The current one takes `aria-current="true"` and the `secondary` fill.
- **A toggle shows its value in both schemes.** A `.btn` with `aria-pressed="true"` takes the checked fill. In a `.join` of view switches, give the pressed one the `secondary` fill so it still reads in dark.
- **Icons mean what they show.** A square check reads as a checkbox. A feed entry shows its type instead: a package for a product, a tag for a price, a speech bubble for a note.

### Data and charts

- **Stats share their furniture.** A sparkline on one stat and not the others reads as an accident.
- **Chart legends draw each series as the plot does:** a solid line beside a dashed one, not two dots.
- **The axis fits the data in round steps:** £1.5k steps to £4.5k for a £4.3k peak. Zero reads "£0".
- **Strokes keep their weight at any width** (`vector-effect: non-scaling-stroke`). A comparison series is muted, never faded with opacity.
- **A chart footer adds a fact,** such as the previous period's total, never a repeat of a stat card.
- **Period controls:** a preset `select`, with a "Custom range" option that reveals the two date inputs. A date field commits while it's typed in, so `0002` and `0202` on the way to `2025` aren't errors: wait for a four-digit year, and give the range a lower bound.
- **A list of shares packs from the top** with a total above it, unless a stat on the screen already shows that total. It is never spread to fill the card.
- **A range that shrinks to one day stops being a line.** Two flat lines over a filled block read as sales holding constant all day. Draw the day and its comparison as two labelled bars, with each figure over its bar, a key of swatches, a label under each bar, and a footer fact that isn't on the bars: the same day last week.
- **Axis labels thin out on the phone.** Keep the ends, drop every other label in between, so a month's dates never touch.
- **A chart reads out a day.** Point at it, or tab to it and use the arrow keys, and a tip names the day and both figures, with the comparison's own date.

### Dialogs and drawers

- **`dialog divided`:** the header rule and the rule above the actions both run edge to edge. Put the actions in the dialog's own `<footer>` (the submit button takes `form="…"`). A footer inside the form bleeds the way the header does: `-mx-(--card-p) px-(--card-p) border-t border-border`.
- **One primary action,** last in the footer, with Cancel `outlined` before it.
- **A drawer's actions stay on screen.** Its `<footer>` is the last child of the dialog, not of the form, so it stays put while a long form scrolls.
- **Changes are never lost silently.** Cancel, the cross, Escape and leaving the page all ask first when the editor is dirty, with "Keep editing" and "Discard changes". An unchanged editor closes straight away.
- **A destructive change asks however it is reached.** A status menu that can archive goes through the same confirmation as the Archive button, and so does anything that takes a live record off sale altogether, such as moving it to draft or switching off its last channel. A reversible switch that leaves it on sale needs no dialog.
- **Focus never falls to the page.** Close a menu before opening a dialog from it, so the dialog returns focus to the menu's button. When an action removes its own control, as a finished bulk action or a next action does, move focus to what takes its place, and on touch not into a text field, where the keyboard would cover the result. A hand-built pager's last Next stays focusable: `aria-disabled` with a guarded click, because `disabled` drops the focus. `DataTable.vue` already moves focus to the current page.
- **A form states nothing nobody entered.** No prefilled price or silent default cost, on every route that creates something: a figure on the record comes from a person.
- **Say what happens to this record.** "It leaves your store" is false for a draft, and false for a channel it was never in. Write a confirmation and its history entry from the record's actual state, and show a state that changes what a status means (Active, but off in every channel) as a badge beside the status, wherever the status appears; on a grid card, with the stock instead of over the picture.
- **Clear means one thing.** Every Clear and Reset on a list leaves it in the same state.
- **An editor opens on its first field,** or on the field the caller asked for, not on its close button.
- **Saving nothing records nothing.** An unchanged save closes without a toast or a history entry. An entry says what really moved, in every editor: "Slate price changed from £249 to £259", "Chalk 28 → 32", "Alex Morgan changed the description and tags". On a record's own page it doesn't repeat the record's name.
- **Validate the same rule on every route.** Two forms that can set a SKU refuse the same values with the same words, and focus the field that failed.
- **One voice for errors.** Browser bubbles and inline messages on the same screen read as two products. Give a form `novalidate`, check its constraints on submit, and show each message on its field. Mark the optional fields, and put the required ones first.

### Phone (390px)

Compose each screen for the phone. Don't let the desktop layout wrap.

- **Stat strips** become a compact grid of equal columns. Each stat keeps its label above the number, as on the desktop, and the next card starts in the top half of the screen.
- **Tabs stay on one line,** with tighter padding (`[--tabs-px:0.5rem]`).
- **Tables fold.** Status, inventory and category columns hide (`max-md:hidden`). A line under the name (`md:hidden`) carries the value of every hidden column, so the phone loses nothing: the status badge, the stock and any warning, and who a job is assigned to. A folded row runs to three lines at most: join short facts on one line with ` · ` ("Due yesterday · mechanic Lucy Hart"), each phrase `whitespace-nowrap`.
- **Number columns stay narrow on the phone** (`w-12 md:w-20` for a quantity), so item names get the width. The price column stays. The thumbnail sits beside the name and code, and that line runs across the row beneath them.
- **Wrap names; never truncate them.** A model, a customer or a product name that tells two rows apart wraps. Move a short fact such as the date to its own line instead of cutting the name with an ellipsis.
- **Keep phrases together** in text that wraps. Put `whitespace-nowrap` on a status, a date or an amount inside a sentence, such as `<del>` and `<ins>` in a feed, so "In progress" never splits across lines.
- **Toolbars:** search goes full width, then one row of controls. Secondary labels become icon-only (`max-md:sr-only` on the label text).
- **Header controls drop under the title** (`max-md:basis-full`) instead of squeezing it onto two lines, and fill that row: two buttons in `max-md:grid max-md:grid-cols-2`.
- **Grid cards stack** name, category and price in one column, so every card reads the same.
- **Galleries shrink** so the record's facts come up the page. Hide a decorative caption that would cover the image.
- **Page footers stack.** Nothing is clipped or runs off the edge.

### Dark scheme

- **Check every screen in dark.** Two surfaces that look alike in light can read as hovered or selected in dark. Give repeated items one surface colour.
- **Selected and pressed states need a fill that reads on `card` in dark.** `secondary` does; `muted` barely does.

### Imagery

- **Every item has its own picture.** Two identical images side by side read as placeholder content.
- **Product images sit on one stage colour,** drawn from the tokens, and don't invert in dark. A product is the same object in both schemes: a photograph doesn't change, so give an illustration's stage `color-scheme: light`. In dark, veil the stage so it isn't the brightest thing on the screen, and veil a small thumbnail less, so its object stays recognisable.
