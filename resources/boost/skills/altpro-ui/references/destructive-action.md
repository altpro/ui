# Destructive action (pattern)

No class. A delete that cannot be undone asks first, in a [`.dialog`](dialog.md): the trigger opens it, the dialog's button sends `useForm().delete`, and while that runs the button shows it is busy. A 422 (a wrong password) keeps the dialog open with the error under its field; success closes it, and the browser returns focus to the trigger. Below is deleting your own account, confirmed with your password, as a settings page; `demo/app/recipe-settings.html` runs it (the demo user's password is `password`).

```vue
<!-- resources/js/pages/settings/Account.vue -->
<script setup>
import { nextTick, ref } from "vue";
import { Head, useForm } from "@inertiajs/vue3";
import { Trash2, X } from "@lucide/vue";
import Field from "@ui/Field.vue";
import AppLayout from "@/layouts/AppLayout.vue";

const dialog = ref();
const form = useForm({ password: "" });

const destroy = () => form.delete("/account", {
  preserveScroll: true,
  // the dialog closes and the browser puts focus back on the button that opened it
  onSuccess: () => dialog.value.close(),
  // a wrong password: stay open, with the error under the field and focus back in it
  onError: () => nextTick(() => dialog.value.querySelector("[name=password]").focus()),
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
    <div class="flex flex-col gap-gap">
      <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>

      <section class="card max-w-2xl" aria-labelledby="delete-account-heading">
        <h2 id="delete-account-heading" class="text-lg font-semibold">Delete account</h2>
        <p class="muted">Your account and everything in it are deleted straight away. This cannot be undone.</p>
        <div>
          <button type="button" class="btn outlined danger" command="show-modal" commandfor="delete-account"><Trash2 class="size-4" aria-hidden="true" /> Delete account</button>
        </div>
      </section>

      <dialog id="delete-account" ref="dialog" class="dialog" aria-labelledby="delete-account-title" @close="forget">
        <header>
          <hgroup>
            <h3 id="delete-account-title">Delete your account?</h3>
            <p>Everything in it is deleted straight away. Enter your password to confirm.</p>
          </hgroup>
          <button type="button" class="btn ghost sm" command="close" commandfor="delete-account" aria-label="Close"><X class="size-4" aria-hidden="true" /></button>
        </header>
        <form id="delete-account-form" class="contents" novalidate @submit.prevent="destroy">
          <Field v-model="form.password" name="password" type="password" autocomplete="current-password" :errors="form.errors" required autofocus />
        </form>
        <footer class="justify-end">
          <button type="button" class="btn ghost" command="close" commandfor="delete-account">Cancel</button>
          <button form="delete-account-form" class="btn danger" :class="{ loading: form.processing }" :disabled="form.processing" :aria-busy="form.processing">Delete account</button>
        </footer>
      </dialog>
    </div>
  </AppLayout>
</template>
```

```php
// routes/web.php
use App\Http\Controllers\AccountController;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::get('/settings', fn () => Inertia::render('settings/Account'))->name('settings');
    Route::delete('/account', [AccountController::class, 'destroy'])->name('account.destroy');
});
```

```php
// app/Http/Controllers/AccountController.php
namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    public function destroy(Request $request): RedirectResponse
    {
        // current_password checks it against the signed-in user's hash
        $request->validate(['password' => ['required', 'current_password']]);

        $user = $request->user();
        Auth::logout();
        $user->delete();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
```

What comes back:

| Request | Response | In the dialog |
|---------|----------|---------------|
| `DELETE /account` `{ password: "" }` | Back, with `errors.password` "The password field is required." | Stays open; the error is under the field, which is `aria-invalid` and has focus again. |
| `DELETE /account` `{ password: "wrong" }` | Back, with `errors.password` "The password is incorrect." | The same. |
| `DELETE /account` with the right password | Redirect to `/`, signed out | Inertia follows the redirect as a visit, so the page and the dialog go. |

- The dialog's own `<form>` wraps only the field (`class="contents"`), and the footer's Delete button submits it with `form="…"`, as dialog.md sets out; Enter in the field submits too. Cancel, the cross and Esc close it with no request.
- While the request runs, Delete is `loading`, `disabled` and `aria-busy`, and keeps its label ([button.md](button.md)). Disabling it drops focus from it, which is one reason `onError` puts focus back in the field: the error is read with the field, and the user can type again at once.
- `@close` runs however the dialog closes, so a reopened dialog starts empty, with no old error. The browser returns focus to the button that opened it.
- The confirm button names the action ("Delete account"), never "OK" or "Yes", and is `danger`; the trigger on the page is `outlined danger`. The heading asks the question and the text says what is lost.
- `novalidate` on the form, so an empty password reaches the server and comes back with Laravel's message rather than the browser's bubble.
- With Inertia's `<Form>` in place of `useForm`, as Laravel's starter kit writes forms, the footer's Delete sits outside the `<Form>` and cannot read its slot. Read the form through a template ref instead: `<Form id="delete-account-form" ref="form" …>` and `const form = useTemplateRef("form")`, then `form?.processing` on the button and `@close="form?.resetAndClearErrors()"` on the dialog. In TypeScript, type the ref as `FormComponentRef` from `@inertiajs/core`, because the component's own type leaves out what it exposes.

When the page stays, as with a row's Delete in a list: ``useForm({}).delete(`/products/${product.id}`, { preserveScroll: true, onSuccess: () => dialog.value.close() })``, and the controller flashes a toast and returns `back()`. With no password there is no field, so a 422 is rare; show `form.errors` in the dialog's body if the controller can refuse. The trigger goes with its row, so the browser has nowhere to return focus: focus the list's heading (`tabindex="-1"`) in `onSuccess` after closing.
