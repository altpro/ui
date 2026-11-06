# Dashboards, stats and charts

Rules for a screen of figures, or any stat or chart on another screen. `stat.md` in `altpro-ui` has the stat card's markup.

## Stats

- **Stats share their furniture.** A sparkline on one stat and not the others reads as an accident.
- **A stat's label says its scope.** If "Due today" leaves out jobs that are ready for collection, it reads "Work due today".
- **A rate moves in points.** Conversion falls from 4.0% to 3.6%: "Down 0.4 pts", not "Down 9.0%". A change that rounds to nothing reads "No change" in `muted`, not "Up 0.0".

## Charts

- **Chart legends draw each series as the plot does:** a solid line beside a dashed one, not two dots.
- **The axis fits the data in round steps:** £1.5k steps to £4.5k for a £4.3k peak. Zero reads "£0".
- **Strokes keep their weight at any width** (`vector-effect: non-scaling-stroke`). A comparison series is muted, never faded with opacity.
- **A chart footer adds a fact,** such as the previous period's total, never a repeat of a stat card.
- **A list of shares packs from the top** with a total above it, unless a stat on the screen already shows that total. It is never spread to fill the card.
- **A chart reads out a day.** Point at it, or tab to it and use the arrow keys, and a tip names the day and both figures, with the comparison's own date.
- **Axis labels thin out on the phone.** Keep the ends, drop every other label in between, so a month's dates never touch.

## Period controls and ranges

- **A preset `select`,** with a "Custom range" option that reveals the two date inputs. Give the range a lower bound, and name the year once the range runs over a year.
- **A date field commits at every digit.** Apply a complete valid date at once, and refuse only on blur, restoring what the field held on focus, because typing can pass through a valid date on the way to a refused one. While the field has focus, leave what's typed alone.
- **A refusal moves nothing beside it on a wide screen** (a phone gives the message its own line), and its message outlives the focus moving to the next field.
- **A range that shrinks to one day stops being a line.** Two flat lines over a filled block read as sales holding constant all day. Draw the day and its comparison as two labelled bars, with each figure over its bar, a key of swatches, a label under each bar, and a footer fact that isn't on the bars: the same day last week.
- **A long range groups its days.** Past three months plot the daily average for each week, past a year for each calendar month, and say so in the tip and the footer: a daily line over years is a wall of noise.
