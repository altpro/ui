# Forms, dialogs and drawers

Rules for anything that edits, creates or confirms. In `altpro-ui`, `dialog.md`, `validation-failure.md`, `unsaved-changes.md` and `destructive-action.md` have the code.

## Layout

- **`dialog divided`:** the header rule and the rule above the actions both run edge to edge. Put the actions in the dialog's own `<footer>` (the submit button takes `form="…"`). A footer inside the form bleeds the way the header does: `-mx-(--card-p) px-(--card-p) border-t border-border`.
- **One primary action,** last in the footer, with Cancel `outlined` before it.
- **A drawer's actions stay on screen.** Its `<footer>` is the last child of the dialog, not of the form, so it stays put while a long form scrolls.
- **A form fills its card.** A form in a full-width card runs the card's width, with its button at the end of the field row. Otherwise put the card in a column as narrow as the form. A `max-w-2xl` form inside a wide card looks unfinished.
- **A form asks in the order its table shows:** In stock then Price in both, or a figure learned for one field lands in the other.
- **A dialog's caption names the record.** When an `hgroup` puts a caption above a dialog's title, it reads "Arc headphones" over "Edit pricing", never a paraphrase of the title. Creating something has no record to name yet, so it has no caption.

## Behaviour

- **Creating a record opens it.** The new row may be on another page, or out of the current tab, and the next step is on the record anyway.
- **An editor opens on its first field,** or on the field the caller asked for, not on its close button.
- **Typing replaces a prefilled value.** Set the form's values, `await nextTick()`, then `showModal()` and `select()`: Vue's patch clears a selection made before it, and typing 50 over £120.40 gives `120.4050`.
- **Money is text.** An amount is a text field with `inputmode="decimal"`, checked on submit against `/^\d+(\.\d{1,2})?$/` (`decimal:0,2` in Laravel), because `type="number"` takes `1e1`, draws a spinner and drops the comma from `1,50`. A prefilled amount goes in as the string `"120.40"`, which keeps its pence, and `Number()` tells whether it changed. Whole quantities stay `type="number"`.
- **A form states nothing nobody entered.** No prefilled price or silent default cost, on every route that creates something: a figure on the record comes from a person.
- **Changes are never lost silently.** In a dirty dialog or drawer, Cancel, the cross and Escape all ask first, in a second dialog with "Keep editing" and "Discard changes". A dirty page asks with the browser's own prompt. `unsaved-changes.md` has both. An unchanged editor closes straight away. A filter drawer doesn't ask: it holds a query, not anyone's work.
- **A destructive change asks however it is reached.** A status menu that can archive goes through the same confirmation as the Archive button, and so does anything that takes a live record off sale altogether, such as moving it to draft or switching off its last channel. A reversible switch that leaves it on sale needs no dialog.
- **Saving nothing records nothing.** An unchanged save closes without a toast or a history entry. An entry says what really moved, in every editor: "Slate price changed from £249 to £259", "Chalk 28 → 32", "Alex Morgan changed the description and tags". On a record's own page it doesn't repeat the record's name.
- **Say what happens to this record.** "It leaves your store" is false for a draft, and false for a channel it was never in. Write a confirmation and its history entry from the record's actual state.

## Validation

- **One voice for errors.** Browser bubbles and inline messages on the same screen read as two products. Give a form `novalidate`, check its constraints on submit, and show each message on its field. Mark the optional fields, and put the required ones first.
- **Validate the same rule on every route.** Two forms that can set a SKU refuse the same values with the same words, and focus the field that failed.
- **Errors say what to enter** ("Enter £245.16 or less") and don't repeat the hint above them.
