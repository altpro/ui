# App shell (pattern)

The frame every page sits in. No class of its own: a [`.nav`](nav.md) sidebar, a header with a [`.breadcrumb`](breadcrumb.md) and a [segmented](segmented.md) scheme switcher, `main`, and a [`.toaster`](toast.md). Utilities do the layout. Below `lg` the sidebar moves into a [`dialog drawer start`](dialog.md) behind a menu button. Copy one of the two versions below and change the links; build nothing else for it. This is the layout: the page recipes ([recipes.md](recipes.md)) and the patterns that build on them wrap themselves in this `AppLayout` and assume this root view.

- **Skip link** first in `body`: `sr-only` until focused, then a `btn primary` in the corner. It targets `<main id="main">`.
- **Sidebar**: from `lg` an `<aside>`, sticky and full height, scrolling on its own. Below `lg` the aside is `hidden` and the same `.nav` is in the drawer. The nav is written once (a Blade partial, a Vue `v-for`) and rendered in both; only one is ever displayed, so there is one `Main` landmark at a time.
- **Drawer**: the browser opens it, traps focus, closes it on Esc and returns focus to the menu button. `closedby="any"` closes it on a tap outside. Its top row is a `div`, not a `<header>`: the drawer sits at body level, where a `header` would be a second page banner.
- **Current link**: `aria-current="page"` on the nav link for this page or the section it is in, and on the last breadcrumb item, which is a `<span>`.
- **Scheme**: radios with `value` `""` (follow the OS), `light`, `dark`. The choice is kept in `localStorage.theme` and set as `data-theme` on `<html>` by a one-line script in `<head>` before the stylesheet, so a pinned scheme never flashes the other one first.
- **Toaster**: the last thing in `body`, empty, from the first response, at the top (`toaster top`) so a toast never covers a [save bar](save-bar.md)'s Save. `toast(message, type)` appends an `.alert` and removes it when it fades.
- **`scroll-pb-20` on `<html>`**: keeps a field the browser tabs to clear of a sticky save bar. Harmless on pages without one.
- **Focus after a visit** (Inertia): a visit to a new page focuses `main` (`tabindex="-1"`), so a screen reader starts at the new content instead of on `<body>`, where the clicked link left it. Not on the first load, where the skip link comes first.

Icons are Lucide, `size-4` with `aria-hidden="true"`. Blade uses `mallardduck/blade-lucide-icons` 2.x: `<x-lucide-{name}>`, where `{name}` is the kebab-case name on lucide.dev (`<x-lucide-shopping-cart>`). Vue uses `@lucide/vue` (not the deprecated `lucide-vue-next`): PascalCase exports, `import { ShoppingCart } from "@lucide/vue"`.

Change the drawer breakpoint by changing every `lg:` in the shell together. The demo page `demo/app/shell.html` is the Blade markup rendered as plain HTML; the recipe pages (`demo/app/recipe-*.html`) are the Inertia root view, and run the `AppLayout` below as it is written here.

## Blade

`resources/views/layouts/app.blade.php`:

```blade
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-pb-20">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title') · {{ config('app.name') }}</title>
  <script>if (localStorage.theme) document.documentElement.dataset.theme = localStorage.theme</script>
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-background text-foreground">
  <a href="#main" class="btn primary sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50">Skip to content</a>

  <div class="flex min-h-dvh">
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-e border-border bg-card p-3 lg:flex">
      <a href="{{ route('dashboard') }}" class="flex h-11 items-center px-3 font-semibold">{{ config('app.name') }}</a>
      @include('layouts.navigation')
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-gap">
        <button class="btn ghost sm -ms-2 px-2 lg:hidden" command="show-modal" commandfor="sidebar" aria-label="Open menu">
          <x-lucide-menu class="size-4" aria-hidden="true" />
        </button>
        <nav class="breadcrumb min-w-0" aria-label="Breadcrumb">@yield('breadcrumb')</nav>
        <div class="join ms-auto" role="radiogroup" aria-label="Colour scheme">
          <label class="btn outlined sm px-2"><input type="radio" name="scheme" value="" aria-label="System"><x-lucide-monitor class="size-4" aria-hidden="true" /></label>
          <label class="btn outlined sm px-2"><input type="radio" name="scheme" value="light" aria-label="Light"><x-lucide-sun class="size-4" aria-hidden="true" /></label>
          <label class="btn outlined sm px-2"><input type="radio" name="scheme" value="dark" aria-label="Dark"><x-lucide-moon class="size-4" aria-hidden="true" /></label>
        </div>
      </header>

      <main id="main" class="flex-1 p-gap">
        @yield('content')
      </main>
    </div>
  </div>

  <dialog id="sidebar" class="dialog drawer start w-72" closedby="any" aria-label="Menu">
    <div class="flex items-center justify-between">
      <a href="{{ route('dashboard') }}" class="px-3 font-semibold">{{ config('app.name') }}</a>
      <button class="btn ghost sm px-2" command="close" commandfor="sidebar" aria-label="Close menu">
        <x-lucide-x class="size-4" aria-hidden="true" />
      </button>
    </div>
    @include('layouts.navigation')
  </dialog>

  <div id="toaster" class="toaster top" role="region" aria-label="Notifications" aria-live="polite"></div>
  <script>
    // scheme switcher: "" follows the OS; the script in <head> applies a saved choice before paint
    for (const radio of document.querySelectorAll("[name=scheme]")) {
      radio.checked = radio.value === (localStorage.theme ?? "");
      radio.onchange = () => {
        localStorage.theme = radio.value;
        if (radio.value) document.documentElement.dataset.theme = radio.value;
        else delete document.documentElement.dataset.theme;
      };
    }

    // toast("Saved.", "success"): any alert colour, see toast.md
    function toast(message, type = "") {
      const el = Object.assign(document.createElement("div"), { className: `alert ${type}` });
      el.append(Object.assign(document.createElement("p"), { textContent: message }));
      el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
      document.getElementById("toaster").append(el);
    }
    @if (session('toast')) toast(@js(session('toast.message')), @js(session('toast.type'))); @endif
  </script>
</body>
</html>
```

`resources/views/layouts/navigation.blade.php`, the nav both places include:

```blade
<nav class="nav" aria-label="Main">
  <a href="{{ route('dashboard') }}" @if (request()->routeIs('dashboard')) aria-current="page" @endif>
    <x-lucide-house class="size-4" aria-hidden="true" /> Dashboard
  </a>
  <a href="{{ route('products.index') }}" @if (request()->routeIs('products.*')) aria-current="page" @endif>
    <x-lucide-package class="size-4" aria-hidden="true" /> Products
  </a>
  <a href="{{ route('orders.index') }}" @if (request()->routeIs('orders.*')) aria-current="page" @endif>
    <x-lucide-shopping-cart class="size-4" aria-hidden="true" /> Orders
  </a>
  <a href="{{ route('settings') }}" @if (request()->routeIs('settings')) aria-current="page" @endif>
    <x-lucide-settings class="size-4" aria-hidden="true" /> Settings
  </a>
</nav>
```

A page:

```blade
@extends('layouts.app')

@section('title', 'Order 1042')

@section('breadcrumb')
  <a href="{{ route('orders.index') }}">Orders</a>
  <span aria-current="page">Order 1042</span>
@endsection

@section('content')
  <h1 class="text-2xl font-semibold tracking-tight">Order 1042</h1>
@endsection
```

A controller's `->with('toast', ['type' => 'success', 'message' => 'Order saved.'])` on the redirect shows as a toast on the next page, the same payload an Inertia controller flashes ([toast.md](toast.md)).

## Inertia (Vue)

The root view, `resources/views/app.blade.php`, carries the scheme script, `scroll-pb-20` and the toaster, so all three are in place before Vue mounts and the toaster survives every visit:

```blade
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="scroll-pb-20">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script>if (localStorage.theme) document.documentElement.dataset.theme = localStorage.theme</script>
  @vite(['resources/css/app.css', 'resources/js/app.js'])
  @inertiaHead
</head>
<body class="bg-background text-foreground">
  @inertia
  <div id="toaster" class="toaster top" role="region" aria-label="Notifications" aria-live="polite"></div>
</body>
</html>
```

The layout. `VITE_APP_NAME` is in Laravel's `.env` from the start; `@` is `resources/js`, as Laravel's Vite plugin sets it.

```vue
<!-- resources/js/Layouts/AppLayout.vue -->
<script>
// module scope, shared by every mount: the first is the page load, each later one a visit to a new page
let loaded = false;
</script>

<script setup>
import { onMounted, ref, watch } from "vue";
import { Link, usePage } from "@inertiajs/vue3";
import { House, Menu, Monitor, Moon, Package, Settings, ShoppingCart, Sun, X } from "@lucide/vue";

defineProps({
  // [{ label: "Orders", href: "/orders" }, { label: "Order 1042" }]: the last item is this page
  breadcrumb: { type: Array, default: () => [] },
});

const appName = import.meta.env.VITE_APP_NAME;
const menu = [
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/products", label: "Products", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

// the link for this URL or a page under it
const page = usePage();
const current = (href) => {
  const path = page.url.split("?")[0];
  return path === href || path.startsWith(href + "/") ? "page" : undefined;
};

// Each page wraps itself in this layout, so a visit to a new page mounts it again, drawer closed. The link that was
// clicked has gone with the old page: move focus to main, where a screen reader starts reading and the next Tab
// goes into the page. Not on the page load, where the skip link comes first.
const main = ref();
onMounted(() => {
  if (loaded) main.value.focus({ preventScroll: true });
  loaded = true;
});

// "" follows the OS; app.blade.php applies the saved choice before paint
const schemes = [
  { value: "", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];
const scheme = ref("");
onMounted(() => (scheme.value = localStorage.theme ?? ""));
watch(scheme, (value) => {
  localStorage.theme = value;
  if (value) document.documentElement.dataset.theme = value;
  else delete document.documentElement.dataset.theme;
});
</script>

<template>
  <a href="#main" class="btn primary sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50">Skip to content</a>

  <div class="flex min-h-dvh">
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-e border-border bg-card p-3 lg:flex">
      <Link href="/dashboard" class="flex h-11 items-center px-3 font-semibold">{{ appName }}</Link>
      <nav class="nav" aria-label="Main">
        <Link v-for="item in menu" :key="item.href" :href="item.href" :aria-current="current(item.href)">
          <component :is="item.icon" class="size-4" aria-hidden="true" /> {{ item.label }}
        </Link>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-gap">
        <button class="btn ghost sm -ms-2 px-2 lg:hidden" command="show-modal" commandfor="sidebar" aria-label="Open menu">
          <Menu class="size-4" aria-hidden="true" />
        </button>
        <nav class="breadcrumb min-w-0" aria-label="Breadcrumb">
          <template v-for="(crumb, i) in breadcrumb" :key="i">
            <span v-if="i === breadcrumb.length - 1" aria-current="page">{{ crumb.label }}</span>
            <Link v-else :href="crumb.href">{{ crumb.label }}</Link>
          </template>
        </nav>
        <div class="join ms-auto" role="radiogroup" aria-label="Colour scheme">
          <label v-for="s in schemes" :key="s.value" class="btn outlined sm px-2">
            <input v-model="scheme" type="radio" name="scheme" :value="s.value" :aria-label="s.label">
            <component :is="s.icon" class="size-4" aria-hidden="true" />
          </label>
        </div>
      </header>

      <main id="main" ref="main" tabindex="-1" class="flex-1 p-gap outline-none">
        <slot />
      </main>
    </div>
  </div>

  <dialog id="sidebar" class="dialog drawer start w-72" closedby="any" aria-label="Menu">
    <div class="flex items-center justify-between">
      <Link href="/dashboard" class="px-3 font-semibold">{{ appName }}</Link>
      <button class="btn ghost sm px-2" command="close" commandfor="sidebar" aria-label="Close menu">
        <X class="size-4" aria-hidden="true" />
      </button>
    </div>
    <nav class="nav" aria-label="Main">
      <Link v-for="item in menu" :key="item.href" :href="item.href" :aria-current="current(item.href)">
        <component :is="item.icon" class="size-4" aria-hidden="true" /> {{ item.label }}
      </Link>
    </nav>
  </dialog>
</template>
```

A page wraps itself in the layout and passes its breadcrumb:

```vue
<script setup>
import { Head } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";
defineProps({ order: Object });
</script>

<template>
  <Head :title="`Order ${order.number}`" />
  <AppLayout :breadcrumb="[{ label: 'Orders', href: '/orders' }, { label: `Order ${order.number}` }]">
    <h1 class="text-2xl font-semibold tracking-tight">Order {{ order.number }}</h1>
  </AppLayout>
</template>
```

- Not a persistent layout (`defineOptions({ layout: AppLayout })`): that one takes no props from the page, so it could not draw the page's breadcrumb, and it never mounts again, so it would not move focus after a visit.
- A visit that keeps the page (a save, which redirects back, a DataTable change, any `preserveState` visit) keeps the layout too: nothing moves focus, and the page decides, as [validation-failure.md](validation-failure.md) does.
- Give pages a `<Head :title>`; in `createInertiaApp`, ``title: (title) => `${title} · ${import.meta.env.VITE_APP_NAME}` `` adds the app's name.

Toasts: `resources/js/toast.js`, which any component can import ([toast.md](toast.md)):

```js
// resources/js/toast.js
export function toast(message, type = "") {
  const el = Object.assign(document.createElement("div"), { className: `alert ${type}` });
  el.append(Object.assign(document.createElement("p"), { textContent: message }));
  el.addEventListener("animationend", (e) => e.animationName === "toast-life" && el.remove());
  document.getElementById("toaster").append(el);
}
```

From the server: `Inertia::flash('toast', ['type' => 'success', 'message' => 'Order saved.'])` in the controller, and in `resources/js/app.js`, before `createInertiaApp`:

```js
import { router } from "@inertiajs/vue3";
import { toast } from "./toast";

router.on("flash", (event) => {
  const t = event.detail.flash.toast;
  if (t) toast(t.message, t.type);
});
```
