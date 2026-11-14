# Local date: `LocalDate.vue`

A date as the reader's calendar has it: "Today", "Yesterday", then "4 Nov", with the year once it is not this year ("4 Nov 2025"). The words are [`DataTimeline`](datatimeline.md)'s day headings, so a list, a record and a timeline say a date the same way.

```vue
<script setup>
import LocalDate from "@ui/LocalDate.vue";
</script>

<template>
  <LocalDate :value="order.created_at" />
  <p class="text-sm muted">Last login <LocalDate :value="user.last_login_at" with-time in-sentence>never</LocalDate></p>
</template>
```

| Prop or slot | What |
|--------------|------|
| `value` | An ISO timestamp as Laravel sends one, or a bare date (`2026-11-04`), which is that day wherever it is read. |
| `with-time` | Adds the time: "Today, 14:05". For record facts and history, where the time matters. A list shows the day only. |
| `in-sentence` | "today" and "yesterday" in lower case, mid-sentence. |
| `locale`, `time-zone` | Default to `<html lang>` and the browser's timezone. Set the app's locale to `en_GB` (so `<html lang="en-GB">`) for "4 Nov", or pass `locale="en-GB"`. |
| default slot | Shown when `value` is empty: a word ("Never", "Not set up yet"), never a dash or a blank. |

- It renders `<time datetime>`, so the exact value is there for software and the title of a hover.
- The words need the reader's clock and timezone, which a server render does not know, so it draws them after mount (a non-breaking space until then), and works them out again at the reader's midnight, on a page left open, through `useToday()` from `@ui/useToday`: one clock for the whole page, which stops when nothing uses it. Read it in a `computed` of your own for other words that depend on the day.
- Not for a relative time ("3 hours ago"): a day word keeps its meaning in a screenshot, an email or a page left open.
- Not for a date the user typed or picks: that is a date [`Field`](field.md).
