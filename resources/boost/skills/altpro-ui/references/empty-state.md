# Empty state (pattern)

No class. What a list, attachment panel, relationship or activity feed shows when it has nothing in it. There are two kinds, and they say different things, as DataTable's `empty-message` and `no-matches-message` do:

- **Nothing yet**: say what will appear here and how it gets there, and offer the action that adds the first one. If the user can't add one, say who can instead of showing a disabled button.
- **Nothing matches**: say that the search or filter found nothing and offer to clear it. Don't offer to create a record from here.

On a page or tab of its own, a centred block with a heading:

```html
<div class="card items-center py-3gap text-center">
  <h3 class="font-semibold">No attachments yet</h3>
  <p class="max-w-sm text-sm muted">Invoices, delivery notes and photos added to this order appear here.</p>
  <button class="btn primary sm">Add attachment</button>
</div>
```

Inside a card or section that already has a heading, one muted sentence and the action, no second heading:

```html
<section class="card divided">
  <header><h2>Contacts</h2><button class="btn sm">Add contact</button></header>
  <p class="text-sm muted">No contacts yet. Add the people you deal with at this company.</p>
</section>
```

- The heading level follows the page outline; it is not always `h3`.
- An icon above the heading is decoration: `aria-hidden="true"`, `size-8 muted`. The words carry the meaning.
- Not an `.alert`: an empty list is a normal state, not a problem.
- When the empty state replaces results after a search, a live status line elsewhere announces the count (DataTable's summary does this). Don't put `role="status"` on the empty block itself.
- While loading, show `.skeleton` rows, not the empty state, so "No orders yet" never flashes before the orders arrive.
