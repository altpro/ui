# App shell (pattern)

The frame every page sits in. No class of its own: a [`.nav`](nav.md) sidebar, a header with a [`.breadcrumb`](breadcrumb.md) and the user menu, `main`, and a [`.toaster`](toast.md). Utilities do the layout. Below `lg` the sidebar moves into a [`dialog drawer start`](dialog.md) behind a menu button. Start the app from one of the two versions below, with your own links in place of the sample ones.

Once copied, the layout is the app's own. Moving the user menu into the sidebar, putting the nav along the top or adding a search box are all fine. When the app's layout differs from this file, follow the app's code and don't move things back to match this file. The page recipes ([recipes.md](recipes.md)) and the patterns that build on them depend only on these parts, so keep them:

- the root view: `scroll-pb-20` on `<html>`, the scheme script in `<head>`, and `<div id="toaster" class="toaster top">` last in `body`;
- `AppLayout` takes a `breadcrumb` prop, each page wraps itself in it (not a persistent layout), and on each visit to a new page it focuses `<main id="main" tabindex="-1">`;
- `main` keeps its `p-gap` padding;
- the skip link, landmarks and `aria-current` rules below.

The welcome and sign-in pages are Blade views in a [layout of their own](#sign-in-pages), and the colour scheme switcher goes on a [settings page](#colour-scheme-setting), not in the header.

- **Skip link** first in `body`: `sr-only` until focused, then a `btn primary` in the corner. It targets `<main id="main">`.
- **Sidebar**: from `lg` an `<aside>`, sticky and full height, scrolling on its own. Below `lg` the aside is `hidden` and the same `.nav` is in the drawer. The nav is written once (a Blade partial, a Vue `v-for`) and rendered in both; only one is ever displayed, so there is one `Main` landmark at a time.
- **User menu**: the signed-in user's initials in an [`.avatar`](avatar.md) at the end of the header (`ms-auto`), a round ghost button labelled with the initials and "user menu" ("SR, user menu"), so a voice-control user can say what they see. It opens a [`dropdown right`](dropdown.md), lined up with the avatar's right edge, with their name and email, Settings and Log out. The header is on every screen size, so the menu is rendered once, not in the drawer. Log out is a POST, as Laravel's `logout` route expects.
- **Print**: the sidebar and header are `print:hidden`, so a printed page is just `main`; the toaster hides itself.
- **Drawer**: the browser opens it, traps focus, closes it on Esc and returns focus to the menu button. `closedby="any"` closes it on a tap outside. Its top row is a `div`, not a `<header>`: the drawer sits at body level, where a `header` would be a second page banner.
- **Current link**: `aria-current="page"` on the nav link for this page or the section it is in, and on the last breadcrumb item, which is a `<span>`.
- **Scheme**: the choice is kept in `localStorage.theme` (`""` follows the OS, or `light`, `dark`) and set as `data-theme` on `<html>` by a one-line script in `<head>` before the stylesheet, so a pinned scheme never flashes the other one first. The control that changes it is on a settings page: [Colour scheme setting](#colour-scheme-setting).
- **Toaster**: the last thing in `body`, empty, from the first response, at the top (`toaster top`) so a toast never covers a [save bar](save-bar.md)'s Save. `toast(message, type)` appends an `.alert` and removes it when it fades.
- **`scroll-pb-20` on `<html>`**: keeps a field the browser tabs to clear of a sticky save bar. Harmless on pages without one.
- **Focus after a visit** (Inertia): a visit to a new page focuses `main` (`tabindex="-1"`), so a screen reader starts at the new content instead of on `<body>`, where the clicked link left it. Not on the first load, where the skip link comes first.

Icons are Lucide, `size-4` with `aria-hidden="true"`. Blade uses `mallardduck/blade-lucide-icons` 2.x: `<x-lucide-{name}>`, where `{name}` is the kebab-case name on lucide.dev (`<x-lucide-shopping-cart>`). Vue uses `@lucide/vue` (not the deprecated `lucide-vue-next`): PascalCase exports, `import { ShoppingCart } from "@lucide/vue"`.

Change the drawer breakpoint by changing every `lg:` in the shell together. In the altpro/ui repository, the demo page `demo/app/shell.html` is the Blade markup rendered as plain HTML; the recipe pages (`demo/app/recipe-*.html`) are the Inertia root view, and run the `AppLayout` below as it is written here.

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
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-e border-border bg-card p-3 lg:flex print:hidden">
      <a href="{{ route('dashboard') }}" class="flex h-11 items-center px-3 font-semibold">{{ config('app.name') }}</a>
      @include('layouts.navigation')
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-gap print:hidden">
        <button class="btn ghost sm -ms-2 px-2 lg:hidden" command="show-modal" commandfor="sidebar" aria-label="Open menu">
          <x-lucide-menu class="size-4" aria-hidden="true" />
        </button>
        <nav class="breadcrumb min-w-0" aria-label="Breadcrumb">@yield('breadcrumb')</nav>
        @include('layouts.user-menu')
      </header>

      <main id="main" class="flex-1 p-gap">
        @yield('content')
      </main>
    </div>
  </div>

  <dialog id="sidebar" class="dialog drawer start [--dialog-w:18rem]" closedby="any" aria-label="Menu">
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

`resources/views/layouts/user-menu.blade.php`:

```blade
@php($user = auth()->user())
@php($initials = Str::of($user->name)->explode(' ')->map(fn ($word) => mb_strtoupper(mb_substr($word, 0, 1)))->take(2)->implode(''))
<div class="ms-auto">
  <button type="button" class="btn ghost rounded-full p-0.5" popovertarget="user-menu" aria-label="{{ $initials }}, user menu">
    <span class="avatar sm" aria-hidden="true">{{ $initials }}</span>
  </button>
  <div id="user-menu" popover class="dropdown right w-56">
    <div class="nav">
      <div class="px-3 py-2 text-sm">
        <p class="truncate font-medium">{{ $user->name }}</p>
        <p class="truncate text-muted-foreground">{{ $user->email }}</p>
      </div>
      <hr>
      <a href="{{ route('settings') }}"><x-lucide-settings class="size-4" aria-hidden="true" /> Settings</a>
      <form method="POST" action="{{ route('logout') }}" class="contents">
        @csrf
        <button><x-lucide-log-out class="size-4" aria-hidden="true" /> Log out</button>
      </form>
    </div>
  </div>
</div>
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
  <h1 class="text-2xl font-semibold tracking-tight break-words">Order 1042</h1>
@endsection
```

A controller's `->with('toast', ['type' => 'success', 'message' => 'Order saved.'])` on the redirect shows as a toast on the next page, the same payload an Inertia controller flashes ([toast.md](toast.md)).

## Inertia (Vue)

The root view, `resources/views/app.blade.php`, carries the scheme script, `scroll-pb-20` and the toaster, so all three are in place before Vue mounts and the toaster survives every visit. Keep whatever else the app's root view already has, such as favicons, `@fonts`, or the page entry Laravel's starter kit adds to `@vite`.

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

The layout. `VITE_APP_NAME` is in Laravel's `.env` from the start; `@` is `resources/js`, as Laravel's Vite plugin sets it. With [Wayfinder](https://github.com/laravel/wayfinder), write `href: dashboard().url` in place of each string; `current()` compares URLs either way.

```vue
<!-- resources/js/layouts/AppLayout.vue -->
<script>
// module scope, shared by every mount: the first is the page load, each later one a visit to a new page
let loaded = false;
</script>

<script setup>
import { onMounted, ref } from "vue";
import { Link, usePage } from "@inertiajs/vue3";
import { House, Menu, Package, Settings, ShoppingCart, X } from "@lucide/vue";
import UserMenu from "@/components/UserMenu.vue";

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
</script>

<template>
  <a href="#main" class="btn primary sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50">Skip to content</a>

  <div class="flex min-h-dvh">
    <aside class="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-2 overflow-y-auto border-e border-border bg-card p-3 lg:flex print:hidden">
      <Link href="/dashboard" class="flex h-11 items-center px-3 font-semibold">{{ appName }}</Link>
      <nav class="nav" aria-label="Main">
        <Link v-for="item in menu" :key="item.href" :href="item.href" :aria-current="current(item.href)">
          <component :is="item.icon" class="size-4" aria-hidden="true" /> {{ item.label }}
        </Link>
      </nav>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b border-border px-gap print:hidden">
        <button class="btn ghost sm -ms-2 px-2 lg:hidden" command="show-modal" commandfor="sidebar" aria-label="Open menu">
          <Menu class="size-4" aria-hidden="true" />
        </button>
        <nav class="breadcrumb min-w-0" aria-label="Breadcrumb">
          <template v-for="(crumb, i) in breadcrumb" :key="i">
            <span v-if="i === breadcrumb.length - 1" aria-current="page">{{ crumb.label }}</span>
            <Link v-else :href="crumb.href">{{ crumb.label }}</Link>
          </template>
        </nav>
        <UserMenu class="ms-auto" />
      </header>

      <main id="main" ref="main" tabindex="-1" class="flex-1 p-gap outline-none">
        <slot />
      </main>
    </div>
  </div>

  <dialog id="sidebar" class="dialog drawer start [--dialog-w:18rem]" closedby="any" aria-label="Menu">
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

The user menu. `auth.user` is the signed-in user, which Laravel's `HandleInertiaRequests` middleware shares with every page.

```vue
<!-- resources/js/components/UserMenu.vue -->
<script setup>
import { computed } from "vue";
import { Link, usePage } from "@inertiajs/vue3";
import { LogOut, Settings } from "@lucide/vue";

// auth.user is the signed-in user, which HandleInertiaRequests shares with every page
const user = computed(() => usePage().props.auth.user);
const initials = computed(() => user.value.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase());
</script>

<template>
  <div>
    <button type="button" class="btn ghost rounded-full p-0.5" popovertarget="user-menu" :aria-label="`${initials}, user menu`">
      <span class="avatar sm" aria-hidden="true">{{ initials }}</span>
    </button>
    <div id="user-menu" popover class="dropdown right w-56">
      <div class="nav">
        <div class="px-3 py-2 text-sm">
          <p class="truncate font-medium">{{ user.name }}</p>
          <p class="truncate text-muted-foreground">{{ user.email }}</p>
        </div>
        <hr>
        <Link href="/settings"><Settings class="size-4" aria-hidden="true" /> Settings</Link>
        <Link href="/logout" method="post" as="button" type="button"><LogOut class="size-4" aria-hidden="true" /> Log out</Link>
      </div>
    </div>
  </div>
</template>
```

A page wraps itself in the layout and passes its breadcrumb:

```vue
<script setup>
import { Head } from "@inertiajs/vue3";
import AppLayout from "@/layouts/AppLayout.vue";
defineProps({ order: Object });
</script>

<template>
  <Head :title="`Order ${order.number}`" />
  <AppLayout :breadcrumb="[{ label: 'Orders', href: '/orders' }, { label: `Order ${order.number}` }]">
    <h1 class="text-2xl font-semibold tracking-tight break-words">Order {{ order.number }}</h1>
  </AppLayout>
</template>
```

- Not a persistent layout (`defineOptions({ layout: AppLayout })`, or a `layout` callback in `createInertiaApp`): that one takes no props from the page, so it could not draw the page's breadcrumb, and it never mounts again, so it would not move focus after a visit.
- A visit that keeps the page (a save, which redirects back, a DataTable change, any `preserveState` visit) keeps the layout too: nothing moves focus, and the page decides, as [validation-failure.md](validation-failure.md) does.

A section with several pages, such as settings, wraps `AppLayout` in a layout of its own. It adds the section's heading and a [`.tabs`](tabs.md) row of links, and each page in the section wraps itself in that layout instead:

```vue
<!-- resources/js/layouts/settings/Layout.vue -->
<script setup>
import { Link, usePage } from "@inertiajs/vue3";
import AppLayout from "@/layouts/AppLayout.vue";

// the page's tab, for the breadcrumb
defineProps({ title: { type: String, required: true } });

const tabs = [
  { label: "Profile", href: "/settings/profile" },
  { label: "Security", href: "/settings/security" },
  { label: "Appearance", href: "/settings/appearance" },
];
const page = usePage();
const current = (href) => (page.url.split("?")[0] === href ? "page" : undefined);
</script>

<template>
  <AppLayout :breadcrumb="[{ label: 'Settings', href: '/settings' }, { label: title }]">
    <div class="flex max-w-2xl flex-col gap-gap">
      <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
      <nav class="tabs" aria-label="Settings">
        <Link v-for="tab in tabs" :key="tab.href" :href="tab.href" :aria-current="current(tab.href)">{{ tab.label }}</Link>
      </nav>
      <slot />
    </div>
  </AppLayout>
</template>
```

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

From the server: `Inertia::flash('toast', ['type' => 'success', 'message' => 'Order saved.'])` in the controller. In `resources/js/app.js`, the flash listener goes before `createInertiaApp`, which also names each page's `<Head :title>` and gives the progress bar the theme's colour:

```js
import { createInertiaApp, router } from "@inertiajs/vue3";
import { toast } from "./toast";

router.on("flash", (event) => {
  const t = event.detail.flash.toast;
  if (t) toast(t.message, t.type);
});

createInertiaApp({
  title: (title) => `${title} · ${import.meta.env.VITE_APP_NAME}`,
  progress: { color: "var(--color-primary)" },
  // resolve, setup: as the app already has them
});
```

## Colour scheme setting

The switcher goes on the app's appearance or profile settings page. It reads and writes `localStorage.theme`, which the root view's script applies before paint. Three radios in a [`.join`](join.md), each a `btn outlined` with an icon and its name:

```vue
<script setup>
import { onMounted, ref, watch } from "vue";
import { Monitor, Moon, Sun } from "@lucide/vue";

// "" follows the OS; the root view applies the saved choice before paint
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
  <div class="join" role="radiogroup" aria-label="Colour scheme">
    <label v-for="s in schemes" :key="s.value" class="btn outlined">
      <input v-model="scheme" type="radio" name="scheme" :value="s.value">
      <component :is="s.icon" class="size-4" aria-hidden="true" /> {{ s.label }}
    </label>
  </div>
</template>
```

In Blade, the same radios with a script after them:

```blade
<div class="join" role="radiogroup" aria-label="Colour scheme">
  <label class="btn outlined"><input type="radio" name="scheme" value=""><x-lucide-monitor class="size-4" aria-hidden="true" /> System</label>
  <label class="btn outlined"><input type="radio" name="scheme" value="light"><x-lucide-sun class="size-4" aria-hidden="true" /> Light</label>
  <label class="btn outlined"><input type="radio" name="scheme" value="dark"><x-lucide-moon class="size-4" aria-hidden="true" /> Dark</label>
</div>
<script>
  // "" follows the OS; the layout's head script applies a saved choice before paint
  for (const radio of document.querySelectorAll("[name=scheme]")) {
    radio.checked = radio.value === (localStorage.theme ?? "");
    radio.onchange = () => {
      localStorage.theme = radio.value;
      if (radio.value) document.documentElement.dataset.theme = radio.value;
      else delete document.documentElement.dataset.theme;
    };
  }
</script>
```

## Sign-in pages

The welcome page and the sign-in pages are Blade views: log in, register, password reset, email verification, password confirmation and the two-factor challenge. Fortify's `loginView()` and its siblings return `view(...)`. Vue and Inertia start only after sign-in, on the first page in `AppLayout`. Each sign-in page is a centred [`.card`](card.md) whose header holds the page's `h1`, in a layout of its own. The layout loads the CSS and one small script, and no Vue:

```blade
{{-- resources/views/layouts/guest.blade.php --}}
<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@yield('title') · {{ config('app.name') }}</title>
  <script>if (localStorage.theme) document.documentElement.dataset.theme = localStorage.theme</script>
  @vite(['resources/css/app.css', 'resources/js/guest.js'])
</head>
<body class="bg-background text-foreground">
  <main id="main" class="flex min-h-dvh flex-col items-center justify-center gap-gap p-gap">
    <a href="{{ url('/') }}" class="font-semibold">{{ config('app.name') }}</a>
    <div class="card w-full max-w-sm [--card-p:1.5rem]">
      <header>
        <h1 class="text-2xl font-semibold tracking-tight">@yield('title')</h1>
        @hasSection('description')<p>@yield('description')</p>@endif
      </header>
      @yield('content')
    </div>
  </main>

  {{-- guest.js puts a copy beside every password field --}}
  <template id="reveal">
    <button type="button" class="btn ghost sm -me-2 px-2" aria-label="Show password" aria-pressed="false">
      <x-lucide-eye class="size-4" aria-hidden="true" />
      <x-lucide-eye-off class="hidden size-4" aria-hidden="true" />
    </button>
  </template>
</body>
</html>
```

A page posts an ordinary form to Fortify's route. A failed post loads the page again with the errors and the old input, and `<x-ui::field>` shows both. Each page load honours `autofocus`, so the first field with an error takes it, or the first field when there are none:

```blade
@extends('layouts.guest')

@section('title', 'Log in')

@section('content')
  @session('status')
    <div class="alert success" role="status"><p>{{ $value }}</p></div>
  @endsession
  <form method="POST" action="{{ route('login') }}" novalidate class="flex flex-col gap-4">
    @csrf
    <x-ui::field name="email" type="email" required autocomplete="email" :autofocus="! $errors->any() || $errors->has('email')" />
    <x-ui::field name="password" type="password" required autocomplete="current-password" :autofocus="$errors->has('password') && ! $errors->has('email')" />
    <x-ui::field name="remember" type="checkbox" label="Remember me" />
    <button class="btn primary w-full">Log in</button>
  </form>
@endsection
```

An Inertia visit that ends on one of these pages must load it in full, or Inertia shows the Blade page's HTML in an error modal. That happens when the user logs out, when the session has expired, and when a route behind `password.confirm` sends the user to confirm their password. Inertia follows the redirect with its `X-Inertia` header, so a middleware on the Blade pages answers that request with `Inertia::location()`:

```php
// app/Http/Middleware/LoadInFull.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/** A Blade page reached from the Inertia app loads in full, not inside Inertia's error modal. */
class LoadInFull
{
    public function handle(Request $request, Closure $next): Response
    {
        return $request->isMethod('GET') && $request->header('X-Inertia')
            ? Inertia::location($request->fullUrl())
            : $next($request);
    }
}
```

Put it on the welcome route and on Fortify's routes (`'middleware' => ['web', LoadInFull::class]` in `config/fortify.php`). It only acts on an Inertia `GET`, so the JSON routes that the two-factor settings call with `fetch` are not affected. The browser's console logs each hand-over as a failed request (`409 Conflict`). That is how `Inertia::location()` works, not an error.

In the Vue app, a password field gets [`Field`](field.md)'s `reveal`. The Blade field has no reveal, because it needs JavaScript, so `guest.js` gives every password field on these pages the same button. The button is the `<template>` at the end of the guest layout, so its icons come from Blade:

```js
// resources/js/guest.js
// Show and hide a password, as Field.vue's reveal does: an aria-pressed button inside a div.input
for (const input of document.querySelectorAll("input[type=password]")) {
  const wrapper = Object.assign(document.createElement("div"), { className: "input" });
  const toggle = document.getElementById("reveal").content.firstElementChild.cloneNode(true);
  input.classList.remove("input");
  input.replaceWith(wrapper);
  wrapper.append(input, toggle);
  // moving the input drops the focus autofocus gave it
  if (input.autofocus) input.focus();
  toggle.addEventListener("click", () => {
    const shown = input.type === "password";
    input.type = shown ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(shown));
    for (const icon of toggle.children) icon.classList.toggle("hidden");
  });
}
```

Passkey sign-in on these pages goes in the same script. Laravel's starter kit does it with `@laravel/passkeys`.
