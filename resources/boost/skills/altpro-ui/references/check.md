# Checkbox, radio, switch: `.checkbox` `.radio` `.switch`

Restyled native inputs. Two ways to label, same result: the class on a `<label>` that wraps the input, or on the `<input>` when a `<label for>` sits beside it. Wrapped is shorter and makes the whole label the click target.

```html
<label class="checkbox"><input type="checkbox" name="remember"> Remember me</label>
<input class="checkbox" id="terms" type="checkbox"> <label for="terms">I agree</label>

<label class="radio"><input type="radio" name="plan" checked> Free</label>
<label class="radio"><input type="radio" name="plan"> Team</label>

<label class="switch"><input type="checkbox" role="switch" checked> Email me about updates</label>
```

| Kind | Classes / attributes |
|------|----------------------|
| Size | `xs` `sm` `lg` `xl`. No size = 1.5rem box, the 24px target minimum. A wrapping label stays 24px tall for the smaller sizes. |
| State | `checked`, `disabled`, `required`. A checkbox also shows the `indeterminate` DOM property. |
| Invalid | `aria-invalid="true"`, or native validation failing after interaction outside a `novalidate` form. Border and ring turn red. |

- A switch is a checkbox with `role="switch"`, so screen readers say on and off. Use it for a setting that applies at once, saved as it is switched (below); a checkbox for something submitted with a form.
- A radio is always round and a switch always a pill. A checkbox follows `--radius`, capped at a quarter of its size.
- A group goes in `<fieldset class="field">` with a `<legend>`, then `.hint` or `.error` as for any field. Point `aria-describedby` on the inputs at the message. `disabled` on the fieldset disables the lot.
- The checked fill is `--check-accent`, primary by default. For a green switch: `[--check-accent:var(--color-success)]`.

Custom properties, shared by all three: `--check-border --check-accent --check-fg --check-ring --check-size --check-radius --check-text`.

## A switch that saves on toggle (Inertia)

A settings page of switches has no Save button: each switch saves itself. It moves at once, goes back if the save fails, and ignores clicks until the server answers.

```vue
<!-- resources/js/Pages/Settings/Notifications.vue -->
<script setup>
import { reactive } from "vue";
import { router } from "@inertiajs/vue3";

defineProps({ settings: { type: Object, required: true } });

const switches = [
  { name: "order_emails", label: "Email me when an order is placed" },
  { name: "weekly_report", label: "Send me a weekly sales report" },
];
const pending = reactive({});
const failed = reactive({});

function save(name, event) {
  // a click while this switch is saving: put the box back and wait
  if (pending[name]) {
    event.target.checked = !event.target.checked;
    return;
  }
  const value = event.target.checked;
  let saved = false;
  pending[name] = true;
  failed[name] = false;
  router.patch("/settings/notifications", { [name]: value }, {
    preserveScroll: true,
    // the new value shows at once; Inertia puts the saved one back if the request fails
    optimistic: (props) => ({ settings: { ...props.settings, [name]: value } }),
    onSuccess: () => (saved = true),
    onFinish: () => {
      pending[name] = false;
      failed[name] = !saved;
    },
  });
}
</script>

<template>
  <section class="flex max-w-xl flex-col gap-4" aria-labelledby="notifications-heading">
    <h2 id="notifications-heading" class="text-lg font-semibold">Notifications</h2>
    <div v-for="item in switches" :key="item.name" class="field">
      <label class="switch">
        <input type="checkbox" role="switch" :checked="settings[item.name]" :aria-disabled="pending[item.name] || undefined" :aria-invalid="failed[item.name] || undefined" :aria-describedby="`${item.name}-error`" @change="save(item.name, $event)">
        {{ item.label }}
      </label>
      <p :id="`${item.name}-error`" class="error" role="alert">{{ failed[item.name] ? ($page.props.errors[item.name] ?? "Not saved. Try again.") : "" }}</p>
    </div>
  </section>
</template>
```

```php
// routes/web.php
Route::get('/settings/notifications', [NotificationSettingsController::class, 'edit']);
Route::patch('/settings/notifications', [NotificationSettingsController::class, 'update']);
```

```php
// app/Http/Controllers/NotificationSettingsController.php
namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Settings/Notifications', [
            'settings' => $request->user()->only('order_emails', 'weekly_report'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $settings = $request->validate([
            'order_emails' => ['sometimes', 'boolean'],
            'weekly_report' => ['sometimes', 'boolean'],
        ]);
        $request->user()->forceFill($settings)->save();

        return back();
    }
}
```

Both columns are cast to `boolean` on the `User` model, so the props are `true` and `false`, not `1` and `0`.

- Inertia 3's `optimistic` changes the page's props before the request and restores them if it fails. It also makes the visit async, so saving one switch does not cancel another that is still saving.
- While saving, the switch is `aria-disabled`, not `disabled`: a control that becomes disabled drops keyboard focus.
- A failed save shows under the switch in a `.error` with `role="alert"`, read out as it appears: the server's validation message after a 422, "Not saved. Try again." after anything else. It clears on the next try.
- No toast on success: the switch has already moved, and a screen reader says on or off.
- Inside a form with a Save button, use a checkbox (`Field type="checkbox"`) instead; see [long-form.md](long-form.md).
