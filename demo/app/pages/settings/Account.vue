<script setup>
import { nextTick, ref } from "vue";
import { Head, useForm } from "@inertiajs/vue3";
import { Trash2, X } from "@lucide/vue";
import Field from "@ui/Field.vue";
import AppLayout from "@/Layouts/AppLayout.vue";

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
