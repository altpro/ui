export function toast(message, type = "") {
  const el = Object.assign(document.createElement("div"), { className: `alert ${type}` });
  el.append(Object.assign(document.createElement("p"), { textContent: message }));
  el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
  document.getElementById("toaster").append(el);

  // An open modal covers the toaster and makes it inert, so say it in the dialog as well. The toast stays too, as a
  // dialog that closes on success takes this copy with it.
  const dialog = [...document.querySelectorAll("dialog:modal")].at(-1);
  if (!dialog) return;
  dialog.querySelector("[data-toast]")?.remove();
  const inline = el.cloneNode(true);
  inline.setAttribute("role", "alert");
  inline.dataset.toast = "";
  const footer = dialog.querySelector("footer");
  footer ? footer.before(inline) : dialog.append(inline);
  dialog.addEventListener("close", () => inline.remove(), { once: true });
}
