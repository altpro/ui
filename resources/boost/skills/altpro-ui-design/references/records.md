# Record pages

Rules for a page about one record: an order, a job, a product, a customer. `record-header.md` and `recipes.md` in `altpro-ui` have the code.

## What it leads with

- **Order by the task.** On a record, the top holds its state, the latest update or blocker, and the next action. Ledgers, contact details and the full history go lower, and lower still on the phone.
- **The latest update is the newest event of any kind:** a note, a status change, a payment. Read it from the rows the history draws, so it can't contradict the status.
- **A record is named the way its users name it.** The `h1` is the customer, the item or both ("Niamh Gallagher's Ribble CGR AL"); a code such as J-1047 is the caption above it in an `hgroup`. A bare code tells nobody at the counter which job it is.
- **The primary button follows what the record is waiting for.** A list page's primary action is fixed; a record's is not. Stock low: "Adjust inventory". A draft: "Publish". Archived: "Make active". Off in every channel: "Choose channels", with those switches first on the phone. A primary that moves focus shows where it went, for a pointer too, with a ring on the card that goes once the change is made or focus leaves the card. Only a record waiting for nothing gets "Edit". The card that holds the same action drops its copy of the button while the header has it.
- **Show the result where the action was.** When finishing a task removes its button (the balance is paid, the order is shipped), the header says so: a badge in the row beside the title, for example `badge soft success` reading "Paid in full". It has no dot, because the dot marks the record's workflow status and this is a fact beside it, as Overdue is. Nobody should have to find a zero in a table to learn it.
- **A record's header holds what no card shows,** apart from the record's own name and when it last changed. Its facts line doesn't repeat details (an email, a frame number) that a card below holds.
- **A blank field says so** ("No description yet."), not nothing. Creating a record opens it, so a record's empty state is on the main path.

## Layout

- **Two columns.** A main column (`@4xl/page:col-span-2`) beside a stack of fact cards. The main column holds the record's working content: its items and, under them, its history and note form. The history stays in that column, where its lines keep a readable length and it comes up the page.
- **Balance for the typical record.** When the two columns don't end level, move a card between them rather than stretching the shorter one. History length varies, so a record with a long history keeps its facts in view with a sticky stack (`sticky top-gap self-start`).
- **Between the phone and two columns,** the fact cards sit two across (`@xl/page:grid-cols-2 @4xl/page:grid-cols-1` on the stack). A page is 45rem wide on a tablet and on a 1024 laptop, too wide for a phone's single column.
- **On the phone,** reorder with `@max-4xl/page:order-*` so a blocker, the latest update and the facts that identify the record come before the ledger. `order` moves what is seen and leaves the tab order where it was, so reorder cards with nothing focusable in them, and write a card with controls in the source where the phone shows it.
- **A form low on a long record has a way down.** A note form can sit 1,500px down the phone's page. Put a quiet "Add note" (`btn ghost sm @4xl/page:hidden`) beside the latest update, which scrolls to the form and focuses its field.

## Figures

- **Totals.** A rule closes the items and another sits over the total, and `.table` draws just those two in a `tfoot`. Subtotal, delivery and VAT are `muted` and the total is bold. Paid and balance due describe the payments, so they go with the payments, not under the work.
