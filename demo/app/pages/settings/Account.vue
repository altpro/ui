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
