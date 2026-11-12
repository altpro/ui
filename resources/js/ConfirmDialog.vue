<!--
  <button class="btn outlined danger" command="show-modal" commandfor="delete-product">Delete</button>
  <ConfirmDialog id="delete-product" title="Delete Arc studio?" description="It goes from the shop at once. This can't be undone."
      confirm-label="Delete product" tone="danger" :busy="form.processing" @confirm="destroy" @close="form.clearErrors()" />

  A .dialog that asks before an action: a heading, an optional description, any body (a password Field), Cancel and one
  confirm button. Open it with command="show-modal" commandfor="<id>", or showModal() on the component; the browser
  returns focus to whatever opened it. While `busy`, nothing closes it: Esc, the cross and Cancel do nothing and the
  confirm button keeps focus as `loading` and aria-disabled. Focus starts on Cancel, or on a body field with autofocus.
  Enter in a body field confirms. `close()` closes it from code, busy or not, as after a success.
  With `form`, the body brings its own form (Inertia's <Form id="…">) and the confirm button submits it instead of
  sending `confirm`.
-->
<script setup lang="ts">
import { computed, ref, useSlots } from "vue";

const props = withDefaults(
  defineProps<{
    id: string;
    title: string;
    confirmLabel: string;
    description?: string;
    cancelLabel?: string;
    tone?: "primary" | "danger";
    busy?: boolean;
    form?: string;
  }>(),
  { description: undefined, cancelLabel: "Cancel", tone: "primary", busy: false, form: undefined },
);
const emit = defineEmits<{ confirm: []; close: [] }>();
defineSlots<{ default?: () => unknown; description?: () => unknown }>();

const dialog = ref<HTMLDialogElement>();
const slots = useSlots();
// the form the confirm button submits: the app's own, the one round the body, or none
const formId = computed(() => props.form ?? (slots.default ? `${props.id}-form` : undefined));

// While busy: closedby="none" stops Esc where the browser has it, cancel stops the first Esc elsewhere, and a close that
// still gets through (a Safari without closedby, a second Esc that fires no cancel) opens the dialog again.
let closing = false;
const cancel = (event: Event) => {
  if (props.busy) event.preventDefault();
};
const closed = () => {
  if (props.busy && !closing) return dialog.value?.showModal();
  closing = false;
  emit("close");
};
// the confirm button is aria-disabled, not disabled, so it keeps focus while busy; a second press does nothing, not even
// submit the app's form
const press = (event: MouseEvent) => {
  if (props.busy) event.preventDefault();
  else if (!formId.value) emit("confirm");
};
const submit = () => {
  if (!props.busy) emit("confirm");
};

defineExpose({
  showModal: () => dialog.value?.showModal(),
  close: () => {
    closing = true;
    dialog.value?.close();
  },
});
</script>

<template>
  <dialog
    :id="id"
    ref="dialog"
    class="dialog"
    :aria-labelledby="`${id}-title`"
    :aria-describedby="description || $slots.description ? `${id}-description` : undefined"
    :closedby="busy ? 'none' : undefined"
    @cancel="cancel"
    @close="closed"
  >
    <header>
      <hgroup v-if="description || $slots.description">
        <h2 :id="`${id}-title`">{{ title }}</h2>
        <p :id="`${id}-description`"><slot name="description">{{ description }}</slot></p>
      </hgroup>
      <h2 v-else :id="`${id}-title`">{{ title }}</h2>
      <button type="button" class="btn ghost sm" command="close" :commandfor="id" aria-label="Close" :disabled="busy">
        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
    </header>
    <slot v-if="form" />
    <form v-else-if="$slots.default" :id="formId" class="contents" novalidate @submit.prevent="submit"><slot /></form>
    <footer class="justify-end">
      <button type="button" class="btn outlined" command="close" :commandfor="id" :disabled="busy" autofocus>{{ cancelLabel }}</button>
      <button
        :type="formId ? 'submit' : 'button'"
        :form="formId"
        class="btn"
        :class="[tone, { loading: busy }]"
        :aria-disabled="busy || undefined"
        :aria-busy="busy || undefined"
        @click="press"
      >
        {{ confirmLabel }}
      </button>
    </footer>
  </dialog>
</template>
