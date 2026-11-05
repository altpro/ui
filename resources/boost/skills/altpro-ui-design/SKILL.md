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
3. **Review against the rules.** Take every screenshot through every rule section below and score it out of 10. A blocking issue is a broken rule, or anything a product designer would send back. Done when each screenshot has a score and a list of its blocking issues, each with the rule it breaks and the fix.
4. **Fix and go again** from step 2. Done when every screenshot scores 9 and no rule is broken.
5. **Get an independent read** for a new screen, a redesign or a release. Send a fresh reviewer the screenshots and the brief in [review.md](references/review.md), with no access to your reasoning, because you will grade your own work kindly. Fix what it blocks on, repeat, and stop when it scores the set 9 with no blocking issues. Record the items you decline, with the reason for each.

## Screen rules

### Rhythm

- **One gutter.** `gap-gap` goes between every card and every row on a screen, and between items in a grid.
- **One card inset.** Use the default `--card-p`, or one value set once in the app's stylesheet. Never pad cards differently on the same screen.
- **Shared splits.** Rows of cards share their column split, so the gutters line up down the page. For example, two rows that are both `lg:grid-cols-3` with the wide card `lg:col-span-2`.
- **Cards end level.** Two cards side by side should end level because their content balances. Move a list, a group of facts or the tags to the shorter card. Don't spread a short list to fill the height (`justify-between`, `space-evenly`), and don't leave a hole with `self-start`.
- **Footers.** When a card still has spare height, give it a footer line with a fact in it, built the same way on every card of the screen:

  ```html
  <p class="mt-auto border-t border-border pt-3 text-sm muted">2 of 6 active products under 10 units</p>
  ```
- **One rule style per card.** If the table's row rules run edge to edge, the footer's rule does too and closes the last row. Inset rules belong to controls, such as the tab underline.
- **Repeated items share one structure at every width.** Cards in a grid and rows in a list keep the same order, with the price or status in the same place, whether a name wraps or not.

### Type and numbers

- **Nothing below `text-xs` (12px).** That includes chart axes, legends, captions and badges.
- **Headings follow the scale in `altpro-ui`.** A heading inside a `.card` or `.dialog` header takes no classes. When an `hgroup` puts a caption above a dialog's title, the caption names the record ("Arc headphones" over "Edit pricing", "New product" when creating), never a paraphrase of the title.
- **Big numbers.** Use `tabular-nums`, with `tracking-tight` on the figure only. A unit after it (`84 <span class="text-sm muted tracking-normal">available</span>`) resets the tracking. Say the unit once: `£249`, not `£249 GBP`.
- **Codes.** SKUs, order numbers and references use the body font with case forms (`[font-feature-settings:'case']`), which centre the hyphens on the capitals. Tabular figures leave gaps around the hyphens, and a system monospace falls back to Courier on Linux.
- **`text-pretty` on paragraphs,** so no line ends on one word.
- **One label style.** Sentence-case muted labels, as `.dl` draws them. An uppercase tracked eyebrow appears only where it carries information, such as a record's category above its name.
- **One bundled typeface.** Install one (for example `@fontsource-variable/inter`) and set it as `--font-sans` in `@theme`, so the app looks the same on every OS. System stacks fall back to Arial lookalikes on Linux, and then the screenshots lie.

### Copy

Write **operational** copy, the words of a working tool, never brochure copy.

- **Headings name what the card holds:** "Description", "Details", "Low stock", "Recent activity". Not "The details", "A little attention" or "Your space to try things".
- **A page's `h1` matches its label** in the nav and the breadcrumb.
- **A subtitle says what the page covers** ("Sales, stock and changes across your store") or is left out. Leave out taglines, motivational lines, reassurance notes ("Your collection is looking good"), decorative punctuation on headings, and eyebrows that restate the heading.
- **Each fact once per screen.** A percentage on a stat card is not repeated in the chart footer. A count on a tab is not repeated in a summary strip.
- **One word for one state across screens:** "Out of stock" everywhere, never "0 in stock" in one view.

### Status and severity

- **One badge vocabulary.** Each meaning (status, warning, tag) gets one treatment, used on every screen and at every width.
- **Status is quiet,** because a column of solid fills shouts. A status is `badge soft dot` in its semantic colour, with the same classes everywhere it appears: `soft success dot` for live, `soft dot` for draft, `outlined dot` for archived.
- **The worst state is the loudest.** Out of stock is `soft danger`, low is `soft warning`, and fine has no badge. Show the scale only where it matters: an archived or draft record needs no stock warning. Use the same scale in the table, the grid, the phone layout, the record page and the dashboard.
- **Tags are `outlined` and neutral.**
- **On an image or a tinted surface,** use a `soft` badge, whose tint is mixed into the card colour, or give any other badge `bg-card`, so it stays visible.

### Actions and links

- **A card's own action is quiet:** `btn ghost sm text-muted-foreground hover:text-foreground`, text only. Every card action on the screen takes the same form.
- **Ghost buttons line up by their label,** not their padding. At the end of a header row add `-me-3`; at the start of a column add `-ms-3` (`-me-4` and `-ms-4` at the default size). The label then meets the card's inset.
- **`→` or a chevron-right means "go there in the app".** `↗` means an external site.
- **Anything that looks like a link is one.** Coloured text with an arrow that does nothing is a lie: make it a link, or plain text.
- **A row's title is its link.** Drop a repeated "Open" button on every row.
- **A toggle shows its value in both schemes.** A `.btn` with `aria-pressed="true"` takes the checked fill. In a `.join` of view switches, give the pressed one the `secondary` fill so it still reads in dark.
- **Icons mean what they show.** A square check reads as a checkbox. A feed entry shows its type instead: a package for a product, a tag for a price, a speech bubble for a note.

### Data and charts

- **Stats share their furniture.** A sparkline on one stat and not the others reads as an accident.
- **Chart legends draw each series as the plot does:** a solid line beside a dashed one, not two dots.
- **The axis fits the data in round steps:** £1.5k steps to £4.5k for a £4.3k peak. Zero reads "£0".
- **Strokes keep their weight at any width** (`vector-effect: non-scaling-stroke`). A comparison series is muted, never faded with opacity.
- **A chart footer adds a fact,** such as the previous period's total, never a repeat of a stat card.
- **Period controls:** a preset `select`, with a "Custom range" option that reveals the two date inputs.
- **A list of shares packs from the top** with a total above it. It is never spread to fill the card.

### Dialogs and drawers

- **`dialog divided`:** the header rule and the rule above the actions both run edge to edge. Put the actions in the dialog's own `<footer>` (the submit button takes `form="…"`). A footer inside the form bleeds the way the header does: `-mx-(--card-p) px-(--card-p) border-t border-border`.
- **One primary action,** last in the footer, with Cancel `outlined` before it.

### Phone (390px)

Compose each screen for the phone. Don't let the desktop layout wrap.

- **Stat strips** become a grid of equal columns, each number above its label.
- **Tabs stay on one line,** with tighter padding (`[--tabs-px:0.5rem]`).
- **Tables fold.** Status, inventory and category columns hide (`max-md:hidden`). A line under the name (`md:hidden`) carries the status badge, the stock and any warning, so the phone loses nothing. The price column stays. The thumbnail sits beside the name and code, and that line runs across the row beneath them.
- **Toolbars:** search goes full width, then one row of controls. Secondary labels become icon-only (`max-md:sr-only` on the label text).
- **Header controls drop under the title** (`max-md:basis-full`) instead of squeezing it onto two lines.
- **Grid cards stack** name, category and price in one column, so every card reads the same.
- **Galleries shrink** so the record's facts come up the page. Hide a decorative caption that would cover the image.
- **Page footers stack.** Nothing is clipped or runs off the edge.

### Dark scheme

- **Check every screen in dark.** Two surfaces that look alike in light can read as hovered or selected in dark. Give repeated items one surface colour.
- **Selected and pressed states need a fill that reads on `card` in dark.** `secondary` does; `muted` barely does.

### Imagery

- **Every item has its own picture.** Two identical images side by side read as placeholder content.
- **Product images sit on one stage colour,** drawn from the tokens so they follow the scheme.
