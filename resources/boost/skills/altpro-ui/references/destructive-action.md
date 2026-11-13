# Destructive action (pattern)

A delete that cannot be undone asks first, in a [`ConfirmDialog`](confirm-dialog.md): the trigger opens it, its confirm button sends `useForm().delete`, and while that runs nothing closes the dialog and the button shows it is busy. A 422 (a wrong password) keeps the dialog open with the error under its field; success closes it, and the browser returns focus to the trigger. Below is deleting your own account, confirmed with your password, as a settings page; `demo/app/recipe-settings.html` in the altpro/ui repository runs it (the demo user's password is `password`).

```vue
<!-- resources/js/pages/settings/Account.vue -->
<script setup>
import { nextTick, ref } from "vue";
import { Head, useForm } from "@inertiajs/vue3";
import { Trash2 } from "@lucide/vue";
import ConfirmDialog from "@ui/ConfirmDialog.vue";
import Field from "@ui/Field.vue";
import AppLayout from "@/layouts/AppLayout.vue";

const dialog = ref();
const form = useForm({ password: "" });

const destroy = () => form.delete("/account", {
  preserveScroll: true,
  // the dialog closes and the browser puts focus back on the button that opened it
  onSuccess: () => dialog.value.close(),
  // a wrong password: stay open, with the error under the field and focus back in it
  onError: () => nextTick(() => document.querySelector("#delete-account [name=password]").focus()),
});
// however the dialog closes (Cancel, Esc, the cross, a success), the password and its error go with it
const forget = () => {
  form.reset();
  form.clearErrors();
};
</script>

<template>
  <Head title="Settings" />
  <AppLayout :breadcrumb="[{ label: 'Settings' }]">
    <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>

    <section class="card max-w-2xl" aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading" class="text-lg font-semibold">Delete account</h2>
      <p class="muted">Your account and everything in it are deleted straight away. This cannot be undone.</p>
      <div>
        <button type="button" class="btn outlined danger" command="show-modal" commandfor="delete-account"><Trash2 class="size-4" aria-hidden="true" /> Delete account</button>
      </div>
    </section>

    <ConfirmDialog id="delete-account" ref="dialog" title="Delete your account?" description="Everything in it is deleted straight away. Enter your password to confirm."
        confirm-label="Delete account" tone="danger" :busy="form.processing" @confirm="destroy" @close="forget">
      <Field v-model="form.password" name="password" type="password" autocomplete="current-password" :errors="form.errors" required autofocus />
    </ConfirmDialog>
  </AppLayout>
</template>
```

The route and controller are the app's: `DELETE /account` behind `auth`, checking the password, signing out and deleting. What the dialog needs from them:

- A wrong or empty password is a validation error on `password` (Laravel's `current_password` rule), so it comes back as `errors.password` and the dialog stays open.
- Password attempts are limited: anyone at the page with a signed-in session, on a borrowed laptop or with a stolen cookie, could otherwise guess until one deletes the account. Past the limit, answer with a validation error on `password` too, not a bare `429`, which the dialog has nowhere to show. A rate limiter keyed by the user, counting only requests that carry a password, does this; so does every other request that asks for the current password.
- Success signs the user out and redirects.

What comes back:

| Request | Response | In the dialog |
|---------|----------|---------------|
| `DELETE /account` `{ password: "" }` | Back, with `errors.password` "The password field is required." | Stays open; the error is under the field, which is `aria-invalid` and has focus again. |
| `DELETE /account` `{ password: "wrong" }` | Back, with `errors.password` "The password is incorrect." | The same. |
| `DELETE /account`, past the limit | Back, with `errors.password` "Too many attempts. Try again in 60 seconds." | The same. |
| `DELETE /account` with the right password | Redirect to `/`, signed out | Inertia follows the redirect as a visit, so the page and the dialog go. |

- `ConfirmDialog` puts its body in a form of its own, so Enter in the field confirms as Delete does. Cancel, the cross and Esc close it with no request.
- While the request runs, `busy` holds the dialog open: Esc, the cross and Cancel do nothing, and Delete is `loading`, `aria-disabled` and `aria-busy`, keeping its label ([button.md](button.md)) and keeping focus. `onError` still puts focus back in the field, so the error is read with it and the user can type again at once.
- `onSuccess` calls the component's `close()`, which closes it even while busy. When the response is a redirect to another page, the page and the dialog go anyway.
- `@close` runs however the dialog closes, so a reopened dialog starts empty, with no old error. The browser returns focus to the button that opened it.
- The confirm button names the action ("Delete account"), never "OK" or "Yes", and `tone="danger"` makes it red; the trigger on the page is `outlined danger`. The title asks the question and the description says what is lost.
- With no field, focus starts on Cancel, so a stray Enter does not delete. With a field, `autofocus` on it puts focus there.
- An empty password reaches the server and comes back with Laravel's message rather than the browser's bubble, as the dialog's form is `novalidate`.
- With Inertia's `<Form>` in place of `useForm`, as Laravel's starter kit writes forms: put the `<Form id="…">` in the body and name it in `ConfirmDialog`'s `form` prop ([confirm-dialog.md](confirm-dialog.md#with-inertias-form)).

When the page stays, as with a row's Delete in a list: ``useForm({}).delete(`/products/${product.id}`, { preserveScroll: true, onSuccess: () => dialog.value.close() })``, and the controller flashes a toast and returns `back()`. With no password there is no field, so a 422 is rare; show `form.errors` in the dialog's body if the controller can refuse. The trigger goes with its row, so the browser has nowhere to return focus: focus the list's heading (`tabindex="-1"`) in `onSuccess` after closing.
