# Email address: `EmailAddress.vue`

An email address that breaks at the `@` when it must, never inside the domain, so a long one wraps as "samantha.okafor / @forma-industries.test" rather than mid-word. A pattern for anywhere a person's address is shown: a list row under their name, a record's facts line, a sentence in a toast or a card.

```vue
<script setup>
import EmailAddress from "@ui/EmailAddress.vue";
</script>

<template>
  <p class="text-sm wrap-anywhere muted"><EmailAddress :email="user.email" /></p>
  <p>We'll send the invitation to <EmailAddress :email="user.email">.</EmailAddress></p>
</template>
```

- Put it in a `wrap-anywhere` line: the part before the `@` may still break anywhere, as an address can be one long word.
- Punctuation after the address goes in its default slot, inside the domain's span, so a full stop never wraps onto a line of its own.
- It is text, not a link. A `mailto:` is an action of its own (`<a class="link" :href="`mailto:${email}`">`), with the component inside it.
- The only place an address truncates instead is a fixed-width menu, such as the [user menu](app-shell.md)'s name and email.
