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
- On a page with a save bar, put the toaster at the top (`toaster top`): in the bottom corner a toast covers Save. The [app shell](app-shell.md)'s root view does, on every page.
- Toasts are polite. Something that must interrupt is a dialog, not a toast.

## Flash messages (Laravel)

The controller flashes a `toast` with a `type` (any alert colour: `success`, `info`, `warning`, `danger` or `error`) and a `message`, and redirects:

```php
use Inertia\Inertia;

public function update(UpdateOrderRequest $request, Order $order)
{
    $order->update($request->validated());

    Inertia::flash('toast', ['type' => 'success', 'message' => "Order {$order->number} saved."]);

    return to_route('orders.edit', $order);
}
```

In an Inertia app, the toaster goes in the root Blade view (`app.blade.php`) beside the app root, not in a layout component, so it exists before the first page renders. Keep the `toast` function in its own module:

```js
// resources/js/toast.js
export function toast(message, type = "") {
  const el = Object.assign(document.createElement("div"), { className: `alert ${type}` });
  el.append(Object.assign(document.createElement("p"), { textContent: message }));
  el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
  document.getElementById("toaster").append(el);
}
```

and listen for Inertia's `flash` event once, in `resources/js/app.js`:

```js
import { createInertiaApp, router } from "@inertiajs/vue3";
import { toast } from "./toast";

router.on("flash", (event) => {
  const t = event.detail.flash.toast;
  if (t) toast(t.message, t.type);
});

createInertiaApp({ /* … */ });
```

- Use the `flash` event, not a watcher on a shared `flash` prop. Inertia fires it once per flash, including on first load, and keeps flash data out of history, so Back does not replay an old toast.
- The message goes in with `textContent`. It often contains user input (an order reference, a customer's name), so never put it in `innerHTML`.
- A component toasts with `import { toast } from "@/toast"`, or with `router.flash("toast", { type: "info", message: "Link copied." })`, which goes through the same listener.

On a Blade page without Inertia, flash with `->with('toast', [...])` on the redirect instead, and after the region, put the same function in a classic `<script>` (without `export`), then:

```blade
@if (session('toast'))
  <script>toast(@js(session('toast.message')), @js(session('toast.type')))</script>
@endif
```

Custom properties: `--toaster-w --toaster-gap --toaster-shadow --toast-life`.
