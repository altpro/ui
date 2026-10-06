export function toast(message, type = "") {
  const el = Object.assign(document.createElement("div"), { className: `alert ${type}` });
  el.append(Object.assign(document.createElement("p"), { textContent: message }));
  el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
  document.getElementById("toaster").append(el);
}
