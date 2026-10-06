# Toast: `.toaster`

A region fixed in a corner, in the page from load and empty. The app appends an `.alert` to it; screen readers announce each one as it lands. Each toast slides in, lives for `--toast-life` (6s), then fades. Hover or focus pauses the clock.

```html
<div id="toaster" class="toaster" role="region" aria-label="Notifications" aria-live="polite"></div>

<script>
  const toast = (html, cls = "") => {
    const el = Object.assign(document.createElement("div"), { className: `alert ${cls}`, innerHTML: html });
    el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
    toaster.append(el);
  };
  toast("<p>Your changes have been saved.</p>", "success");
</script>
```

| Kind | Classes |
|------|---------|
| Corner (on the region) | Bottom end by default. `top`, `start`, or both. |
| Toast (on the alert) | Any alert colour. `pinned` turns the clock off: it stays until the user closes it. |

- One region per page, at the end of `body`. Keep the `role`, `aria-label` and `aria-live` attributes; the region must exist before the first toast so the announcement fires. Alerts inside carry no `role` of their own.
- The app removes the element: listen for `animationend` with the name `toast-life`, as above. Without that listener a faded toast stays in the DOM.
- Anything with an action, or that the user must read, is `pinned` with a dismiss cross (`btn ghost xs`, `aria-label="Dismiss"`, `onclick="this.closest('.alert').remove()"`), same as a dismissible alert. Never make a toast the only way to reach an action.
- Toasts are polite. Something that must interrupt is a dialog, not a toast.

Custom properties: `--toaster-w --toaster-gap --toaster-shadow --toast-life`.
