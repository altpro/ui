// The Vue examples on confirm.html, one small app per section. The requests are timers standing in for the server.
import { createApp, h, nextTick, ref } from "vue";
import ConfirmDialog from "@ui/ConfirmDialog.vue";
import Field from "@ui/Field.vue";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const mount = (selector, setup) => createApp({ setup }).mount(selector);

mount("#confirm-delete", () => {
  const dialog = ref(), busy = ref(false), said = ref("");
  const destroy = async () => {
    busy.value = true;
    await wait(1500);
    busy.value = false;
    said.value = "Arc studio deleted.";
    dialog.value.close();
  };
  return () => [
    h("div", { class: "flex flex-wrap items-center gap-3" }, [
      h("button", { type: "button", class: "btn outlined danger", command: "show-modal", commandfor: "delete-product" }, "Delete product"),
      h("p", { class: "text-sm muted", role: "status" }, said.value),
    ]),
    h(ConfirmDialog, {
      ref: dialog, id: "delete-product", title: "Delete Arc studio?", description: "It goes from the shop at once. This can't be undone.",
      confirmLabel: "Delete product", tone: "danger", busy: busy.value, onConfirm: destroy,
    }),
  ];
});

mount("#confirm-password", () => {
  const dialog = ref(), busy = ref(false), password = ref(""), errors = ref({});
  const destroy = async () => {
    busy.value = true;
    await wait(800);
    busy.value = false;
    if (password.value !== "password") {
      errors.value = { password: password.value ? "The password is incorrect." : "The password field is required." };
      await nextTick();
      return document.querySelector("#delete-account [name=password]").focus();
    }
    dialog.value.close();
  };
  const forget = () => {
    password.value = "";
    errors.value = {};
  };
  return () => [
    h("button", { type: "button", class: "btn outlined danger", command: "show-modal", commandfor: "delete-account" }, "Delete account"),
    h(ConfirmDialog, {
      ref: dialog, id: "delete-account", title: "Delete your account?", description: "Everything in it is deleted straight away. Enter your password to confirm.",
      confirmLabel: "Delete account", tone: "danger", busy: busy.value, onConfirm: destroy, onClose: forget,
    }, () => h(Field, {
      modelValue: password.value, "onUpdate:modelValue": (v) => (password.value = v),
      name: "password", type: "password", autocomplete: "current-password", errors: errors.value, required: true, autofocus: true,
    })),
  ];
});

mount("#confirm-send", () => {
  const dialog = ref(), busy = ref(false);
  const send = async () => {
    busy.value = true;
    await wait(800);
    busy.value = false;
    dialog.value.close();
  };
  return () => [
    h("button", { type: "button", class: "btn primary", command: "show-modal", commandfor: "send-invoice" }, "Send invoice"),
    h(ConfirmDialog, { ref: dialog, id: "send-invoice", title: "Send invoice INV-2026-0091?", confirmLabel: "Send invoice", busy: busy.value, onConfirm: send }, {
      description: () => ["It goes to ", h("strong", "accounts@example.com"), " with the PDF attached."],
    }),
  ];
});
