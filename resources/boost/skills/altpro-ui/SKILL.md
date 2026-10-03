---
name: altpro-ui
description: Use altpro/ui component classes (btn, join, input, field, checkbox, radio, switch, segmented control, badge, avatar, nav, breadcrumb, dropdown, multiselect, tooltip, card, dialog, accordion, table, DataTable, alert, tabs, progress, meter, range, skeleton, spinner, steps, toast, drawer, and more as they land) and its Blade (<x-ui::…>) and Vue components when writing markup in a project that uses altpro/ui (Composer altpro/ui or npm @altpro/ui). Covers class composition, colour and size modifiers, theme tokens, and light/dark scheme regions.
---

# altpro/ui

altpro/ui is a CSS component layer on top of Tailwind v4. Tailwind handles layout and spacing. altpro/ui classes replace the long utility strings for common components. A few components that need repeated markup or state also come as a Blade component and a Vue component that render the same markup.

Rule of thumb when writing markup:

1. Reach for an altpro/ui class (or its Blade or Vue component) first if one exists for the component.
2. Use Tailwind utilities for layout around it and for one-off tweaks on it.
3. Never rebuild an altpro/ui component out of utilities.

## Setup (already done if the project uses altpro/ui)

Laravel installs it with Composer (`composer require altpro/ui`). The Blade components register themselves. In `resources/css/app.css`:

```css
@import "tailwindcss";
@import "../../vendor/altpro/ui/resources/css/ui.css";
```

Elsewhere it is the npm package `@altpro/ui`:

```css
@import "tailwindcss";
@import "@altpro/ui";
```

Components with a Blade or Vue version say so in their section. Their JavaScript is one small file per component in `resources/js/`. Vue components import it themselves. With Blade, import it once in `resources/js/app.js`, e.g. `import "../../vendor/altpro/ui/resources/js/multiselect.js";`.

Every scrollbar gets a muted thumb on no track, set once with the inherited `scrollbar-color`, and it follows `.light` `.dark` `.inverse`. Add `scrollbar-thin` (Tailwind) to a scroll area for the slim width that `.nav`, dropdown panels and dialogs already have.

## How classes compose

One base class, then bare modifier words in any order. No prefixes.

```html
<button class="btn primary lg">Save</button>
<a href="/x" class="btn outlined danger sm">Delete</a>
<button class="btn primary w-full rounded-none">utilities still win</button>
```

Write `btn primary`, never `btn-primary` or `btn btn-primary`. Utilities always override component styles because components live in `@layer components`.

## Button: `.btn`

Works on `<button>`, `<a>`, `<input type="submit">`.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias of `danger`). No colour = neutral grey. |
| Style | `outlined` (transparent fill, coloured border and text), `ghost` (transparent, coloured text, no border) |
| Size | `xs` `sm` `lg` `xl`. No size = default (2.25rem tall). |
| Toggle | `<label class="btn outlined"><input type="checkbox"> Bold</label>`. The input is hidden over the label and the label takes the solid fill while checked. See the segmented control below. |
| State | Use the native `disabled` attribute on buttons. A disabled link has no `href` and uses `role="link"` with `aria-disabled="true"`; if an app must retain its `href`, the app must also cancel activation. `loading` draws a spinner; pair it with `disabled`, `aria-busy="true"`, and a label saying what is happening (`Saving`). Focus rings appear on keyboard focus only. |

Icons: put an inline SVG inside the button, sized with `size-4`. The button has `gap-2` built in.

```html
<button class="btn primary">
  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
  New item
</button>
```

Custom properties every button reads. Set them on `.btn` in the app stylesheet for a global change, or inline for one element.

```
--btn-bg  --btn-fg  --btn-accent  --btn-outline  --btn-hover  --btn-radius  --btn-h  --btn-px  --btn-text
```

## Join: `.join`

Wraps buttons and inputs into one bar. The radius moves to the group. A one pixel line divides members.

```html
<div class="join">
  <button class="btn primary">Save</button>
  <button class="btn primary" aria-label="More options">▾</button>
</div>
```

- Members keep their own colour, style and size classes. Mixing is fine.
- Layout utilities go on the group (`flex w-full`), and `flex-1` on members to fill.
- `--join-radius` overrides the corner radius for one group. Defaults to `--radius`.
- Icon-only members need `aria-label`.

## Segmented control (pattern)

No class. A `.join` of `label.btn`, each wrapping a radio with the same `name`. The checked label takes the solid look. No script: arrow keys move between the radios and a form submits the value.

```html
<div class="join" role="radiogroup" aria-label="Sort">
  <label class="btn outlined"><input type="radio" name="sort" checked> Newest</label>
  <label class="btn outlined"><input type="radio" name="sort"> Oldest</label>
  <label class="btn outlined"><input type="radio" name="sort"> Top</label>
</div>
```

- Members are `outlined` or `ghost`, in any colour and size, so the checked one has somewhere to go. `outlined primary` fills primary when checked; plain `outlined` fills muted.
- The group is `role="radiogroup"` with an `aria-label`, or the `.join` sits in a `<fieldset class="field">` with a `<legend>`.
- Checkboxes instead of radios make a multi-select group (bold, italic, underline). Then it is `role="group"`.
- An icon-only member puts `aria-label` on the input, not the label.
- `disabled` on an input dims its label. `flex w-full` on the group and `flex-1` on members fills a column.
- Two options with a single on and off meaning are a `.switch`, not a segmented control.

## Input: `.input`

One class for every text-like control: `<input>` of any text type, `<select>`, `<textarea>`. Not for checkboxes or radios. On its own it needs a name: a `<label for>` or an `aria-label`.

| Kind | Classes / attributes |
|------|----------------------|
| Size | `xs` `sm` `lg` `xl`. Heights match `.btn`, so the two line up in a join. |
| Invalid | `aria-invalid="true"`. Also automatic when native validation (`required`, `type="email"`, `pattern`) fails after the user has touched it. Border and focus ring turn red. |
| State | `disabled`, `readonly`. Focus ring on focus. |

```html
<input class="input" type="search" placeholder="Search" aria-label="Search">
<select class="input sm" aria-label="Sort by"><option>Newest</option></select>
<textarea class="input" rows="3" aria-label="Notes"></textarea>
```

A textarea grows with `rows`; the size is a minimum height. Width is the browser default; use `w-full` or `w-64`.

A `<select>` opts into `appearance: base-select` where the browser has it (Chrome 135+). The chevron is a Lucide stroke in muted text, the picker matches `.dropdown`, and `<option>`, `<optgroup>` and its `<legend>` are styled. Other browsers keep their native select.

Addons: put `.input` on a `<label>` wrapping the control. Anything else inside (a `<span>` symbol or unit, a `size-4` svg, a `<kbd>` drawn as a key cap) sits in the same border in muted text, and the focus ring goes round the whole box. Clicking an addon focuses the control. A `<select>` can be a second control inside the wrapper. A button next to an input is a `.join`, not an addon.

```html
<label class="input"><span>£</span><input type="number" aria-label="Price"></label>
<label class="input"><input type="number" aria-label="Weight"><span>kg</span></label>
<div class="join">
  <input class="input sm" type="search" aria-label="Search">
  <button class="btn primary sm">Go</button>
</div>
```

Custom properties: `--input-bg --input-fg --input-border --input-ring --input-radius --input-h --input-px --input-text`.

## Field: `.field`

Stacks a label, a control, an optional hint and optional errors. Children are styled by element and by the bare words `hint` and `error`; DOM order is display order. Put the `.input` directly inside, or inside a `.join` when it sits beside a button.

```html
<div class="field">
  <label for="email">Email</label>
  <input class="input" id="email" type="email" aria-invalid="true" aria-describedby="email-error">
  <p class="error" id="email-error">Enter a full email address.</p>
</div>
```

| Child | Role |
|-------|------|
| `<label for>` | The label. Bold. Dims when the control is disabled. |
| `.input` or `.join` | The control, bare or as a wrapper with addons. A join stretches to the column and the input inside takes the slack. |
| `.hint` | Help text, muted. Point `aria-describedby` at it. |
| `.error` | Error text, red. A `<p>` for one, a `<ul>` of `<li>` for several. Hidden when empty, so a template can always render it. |

The control turns red when the field holds a non-empty `.error`, when the control has `aria-invalid="true"`, or when native validation fails after interaction. Always set `aria-invalid` and `aria-describedby` alongside an `.error`; the colour alone does not reach screen readers.

Disabled: `disabled` on the control, or `<fieldset class="field" disabled>` to disable everything inside it natively.

### Field component: `<x-ui::field>` and `Field.vue`

Writes the whole `.field` from a name and a type: the label, generated ids tying label, hint and errors to the control, and the errors for that name. Prefer it over hand-written fields in forms.

```blade
<x-ui::field name="email" type="email" required autocomplete="email" hint="We never share it." />
<x-ui::field name="category_id" type="select" :options="$categories" :value="$post->category" placeholder="Choose one" />
<x-ui::field name="tags" type="multiselect" :options="$tags" :value="$post->tags" max="3" hint="Up to three." />
<x-ui::field name="price" type="number" prepend="£" step="0.01" :value="$product->price" />
<x-ui::field name="published" type="switch" :value="$post->published" />
```

```vue
<script setup>
import Field from "../../vendor/altpro/ui/resources/js/Field.vue"; // or "@altpro/ui/js/Field.vue" from npm
const form = useForm({ category_id: props.post.category_id, tags: props.post.tags });
</script>

<Field v-model="form.tags" name="tags" type="multiselect" :options="tags" :errors="form.errors" :max="3" />
```

| Prop | Blade | Vue |
|------|-------|-----|
| `name` | Field name. Brackets work: `post[title]`, `tags[]`. | Same; optional, but the label guess and error lookup need it. |
| `type` | Any input type (`text` by default), or `textarea`, `select`, `multiselect`, `switch`. `radio`, or `checkbox` with options, renders a `<fieldset>` group. `checkbox` without options is one box. | Same. |
| `label` | Defaults to the name: `category_id`, `post[categoryId]` both read "Category". | Same. |
| `hint` | Text under the control, read with it. A `<x-slot:hint>` takes markup. | Same; `#hint` slot. |
| `prepend` / `append` | Text inside the input's border (`£`, `kg`). A slot goes in as written, for a select or an icon. Inputs only. | Same; `#prepend` / `#append` slots. |
| `options` | `value => label`, a list of strings (value is the string), or a collection of models or arrays: value from `id` (else `value`), label from `name` (else `label`). | `[{ value, label }]`, `{ value: label }`, strings, or models as above. |
| `value` / `v-model` | Current value. `old()` wins automatically. A model or collection of models becomes its ids. | `v-model` with `useForm`; models are handed straight back as ids. `value` without v-model, in Inertia's `<Form>`. `type="number"` emits a number, `file` a `File` (an array when `multiple`). |
| `errors` | Defaults to the page's `$errors`. Also takes a `MessageBag`, an array keyed by field (`tags.0` counts for `tags`), or a string or list for this field. `bag` picks a named error bag. | A string, an array, or Laravel's errors object keyed by field: Inertia's `form.errors`, or a 422 body's `errors`. |
| `id` | Generated when left off. | Same. |
| `now` | On a `date`, `time`, `datetime-local` or `month`, an empty value becomes the current one, in the app's timezone. | Same, in the browser's timezone; the value goes into v-model too. |

- `class` lands on the `.field`; every other attribute (`required`, `placeholder`, `min`, `rows`, `autocomplete`, `max`, `disabled`…) on the control. On a `multiselect` they go to `<x-ui::multiselect>` / `Multiselect.vue`.
- `placeholder` on a select adds an empty first option, so `required` works on it.
- After a failed submit, an unticked box or empty multiselect stays empty rather than falling back to `value`, since the browser sends nothing for it.
- Errors set `aria-invalid` and turn the control red; one shows as a `<p class="error">`, several as a `<ul>`.
- A single checkbox or switch submits `1`, which Laravel's `boolean` rule accepts. Unticked, it submits nothing: read it with `$request->boolean('name')`.

Inertia, Vue:

- `useForm`: `<Field v-model="form.title" name="title" :errors="form.errors" />`. Model ids and `now` are written into the form after `useForm` took its defaults, so `isDirty` starts true. Call `onMounted(() => form.defaults())` if you show it.
- `<Form>`: no v-model. Give the start as `value` and pass the slot's `errors`: `<Form #default="{ errors }"><Field name="title" :value="post.title" :errors="errors" /></Form>`. Values come from the inputs, so every field needs a `name`. `reset()` works, including the multiselect.
- Precognition: listeners land on the control, so `@change="form.validate('title')"` works. On a multiselect they land on the wrapper: use `@change` or `@focusout`, since `blur` does not bubble.

## Checkbox, radio, switch: `.checkbox` `.radio` `.switch`

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
| Invalid | `aria-invalid="true"`, or native validation failing after interaction. Border and ring turn red. |

- A switch is a checkbox with `role="switch"`, so screen readers say on and off. Use it for a setting that applies at once; a checkbox for something submitted with a form.
- A radio is always round and a switch always a pill. A checkbox follows `--radius`, capped at a quarter of its size.
- A group goes in `<fieldset class="field">` with a `<legend>`, then `.hint` or `.error` as for any field. Point `aria-describedby` on the inputs at the message. `disabled` on the fieldset disables the lot.
- The checked fill is `--check-accent`, primary by default. For a green switch: `[--check-accent:var(--color-success)]`.

Custom properties, shared by all three: `--check-border --check-accent --check-fg --check-ring --check-size --check-radius --check-text`.

## Badge: `.badge`

Small label for status, counts and tags. Same modifier words as the button. A `<span>` is static. An `<a>` or `<button>` badge gets hover, a focus ring and a pointer, so a badge can open a popover or link somewhere.

| Kind | Classes |
|------|---------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). No colour = neutral grey. |
| Hue | Any Tailwind hue name, the same set the avatar takes: `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`. |
| Style | `outlined`, `ghost` |
| Size | `sm` `lg`. No size = default (1.5rem tall, 24px, the minimum for a link or button badge). |

```html
<span class="badge success">Active</span>
<span class="badge outlined danger sm">Overdue</span>
```

Icons inside a badge are `size-3`. Badges can sit inside `.join`.

Use a semantic colour for status and a hue for a tag or category. Hues are a tint in light and a deep shade in dark; the text and outline colours are derived from the fill, so any hue is readable in both schemes and in all three styles.

Custom properties: `--badge-bg --badge-fg --badge-accent --badge-outline --badge-hover --badge-radius --badge-h --badge-px --badge-text`.

## Avatar: `.avatar`

A circle showing a photo or initials. Put the class on the `<img>` itself, or on a `<span>` holding initials (or wrapping an `<img>`). Always round, whatever `--radius` is; add `rounded-lg` to square one.

| Kind | Classes |
|------|---------|
| Hue | Any Tailwind hue name: `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`. No hue = neutral grey. |
| Size | `xs` `sm` `lg` `xl`. No size = 2.5rem. |

```html
<img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
<span class="avatar blue lg">LW</span>
```

Hues are a tint in light and a deep shade in dark; text colour is derived from the fill, so any hue is readable in both. An `<a>` avatar gets a focus ring; give it an `aria-label`, initials are not a name.

Groups: wrap avatars in `.join` and they overlap by a third with a 2px ring between them. A plain `<span class="avatar">+3</span>` at the end is the overflow count. On a non-page background set `--avatar-ring` on the group to the surface colour.

```html
<div class="join">
  <img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
  <span class="avatar green">BS</span>
  <span class="avatar">+3</span>
</div>
```

Custom properties: `--avatar-bg --avatar-fg --avatar-size --avatar-radius --avatar-ring`.

## Nav: `.nav`

Vertical menu for a sidebar or settings page. Put it on a `<nav>` with an `aria-label`. Children are styled by element, so no item classes exist.

| Element | Role |
|---------|------|
| `<a>` | A link. `aria-current="page"` marks the current one. |
| `<details><summary>…</summary>…</details>` | A collapsible section. `open` starts it expanded. Links inside are indented. No JS. |
| `<h2>` to `<h6>` | A small uppercase section label. |
| `<hr>` | A divider. |

```html
<nav class="nav" aria-label="Main">
  <a href="/" aria-current="page"><svg class="size-4" aria-hidden="true">…</svg> Home</a>
  <a href="/inbox">Inbox <span class="badge primary sm ml-auto">12</span></a>
  <details open>
    <summary><svg class="size-4" aria-hidden="true">…</svg> Projects</summary>
    <a href="/p/1">Website</a>
    <a href="/p/2">Mobile app</a>
  </details>
  <h2>Account</h2>
  <a href="/profile">Profile</a>
</nav>
```

Icons go first inside the link or summary, `size-4`, `aria-hidden`. Lucide fits. A trailing badge or count gets `ml-auto`. Width comes from the container or a utility (`w-56`). One level of `<details>` is supported.

A `<button type="button">` is an action item and looks like a link. For a list of actions rather than links, put `.nav` on a `<div>` so it is not a navigation landmark.

Custom properties: `--nav-fg --nav-active-fg --nav-hover --nav-active-bg --nav-radius --nav-h --nav-px --nav-text`.

## Breadcrumb: `.breadcrumb`

The path to the current page. Put it on a `<nav>` with `aria-label="Breadcrumb"`. Children are styled by element; chevrons are drawn in CSS, so there is no separator markup.

```html
<nav class="breadcrumb" aria-label="Breadcrumb">
  <a href="/">Home</a>
  <a href="/docs">Docs</a>
  <span aria-current="page">Breadcrumb</span>
</nav>
```

| Child | Role |
|-------|------|
| `<a>` | A link, muted, full-strength on hover. |
| `<span aria-current="page">` | The current page, full-strength text, not a link. |
| `<button>` | Looks like a link. For collapsed levels: give it `aria-label`, `popovertarget`, an ellipsis icon, and put a `.dropdown` holding a `.nav` of the hidden links straight after it. |
| `<ol>` `<li>` | Optional list markup, flattened away. Renders the same as bare children. |

- An icon-only link (a house for home) needs `aria-label`. Icons are `size-4`.
- One row. A path wider than its container scrolls sideways; it never wraps.
- Text is `text-sm`; each link is at least 24px tall.

Custom properties: `--breadcrumb-fg --breadcrumb-active-fg --breadcrumb-gap --breadcrumb-text`.

## Dropdown: `.dropdown`

A panel anchored to the button that opens it. Native `popover` plus CSS anchor positioning: the browser handles open, close, Esc, click-outside and placement. No JavaScript, no wrapper element. The trigger is any button with `popovertarget` pointing at the panel's `id`.

```html
<button class="btn" popovertarget="menu">Options</button>
<div id="menu" popover class="dropdown">
  <div class="nav">
    <a href="/edit">Edit</a>
    <button type="button">Duplicate</button>
    <hr>
    <button type="button" class="text-danger">Delete</button>
  </div>
</div>
```

| Kind | Classes |
|------|---------|
| Placement | None = down from the trigger, left edges aligned, flipping to right-aligned, then up, when the default would leave the viewport. `left` `right` `up` `down` pin one axis; the other still flips. Pin both and it never flips. |
| Width | `max-content`, at least 10rem, at most 24rem. Override with `w-56`, `w-72`. |
| Padding | 1rem. A lone `.nav` child gets 0.25rem, so a menu hugs its items. Override with `p-*`. |

- Menu: put a `.nav` inside, on a `<div>`. Links, buttons, `<hr>` and headings all work.
- Form: make the popover element a `<form>` (`<form id="x" popover class="dropdown w-56">`). Radios or a couple of inputs plus a `btn primary sm w-full`.
- Help: an icon button with `aria-label` opening a `w-72 text-sm` panel of prose. More room than a tooltip.
- If no placement fits, the panel keeps the default side and scrolls inside rather than leaving the screen.
- Popovers render in the top layer visually, but remain in their DOM position and inherit the scheme region around them. If a popover is mounted elsewhere in the DOM, put the appropriate `light`, `dark`, or `inverse` class on it.
- Add `autofocus` to the first item to move keyboard focus into the panel on open. Without it, Tab from the trigger enters the panel.

Custom properties: `--dropdown-x --dropdown-y --dropdown-gap --dropdown-radius --dropdown-shadow`.

## Multiselect: `.multiselect`

A button that opens a `.dropdown` of checkboxes, in place of `<select multiple>`. One click ticks a box and the panel stays open while you tick more. The button shows what is ticked, as a select shows its value: empty when nothing is, the items separated by commas, then an ellipsis and a count once they no longer fit its fixed width (`12rem`; a `w-*` utility on the wrapper changes it). The visible label goes outside, in a `.field`, as it would for a select. The form submits the same `name[]` values a multiple select would. Prefer the Blade or Vue component; they render exactly this markup.

```blade
<div class="field">
  <label>Size</label>
  <x-ui::multiselect name="size" label="Size"
      :options="['s' => 'Small', 'm' => 'Medium', 'l' => 'Large']"
      :selected="old('size', $product->sizes)"
      required max="2" />
  <p class="hint">Up to two.</p>
</div>
```

```vue
<script setup>
import Multiselect from "../../vendor/altpro/ui/resources/js/Multiselect.vue"; // or "@altpro/ui/js/Multiselect.vue" from npm
const sizes = ref(["m"]);
</script>

<Multiselect v-model="sizes" name="size" label="Size" :options="[{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }]" />
```

```html
<ui-multiselect class="multiselect">
  <button type="button" class="input" popovertarget="size" data-count="1">
    <span class="sr-only">Size</span><span><span hidden>Small</span><span>Medium</span></span>
  </button>
  <fieldset id="size" popover class="dropdown" aria-label="Size">
    <label class="checkbox"><input type="checkbox" name="size[]" value="s"> Small</label>
    <label class="checkbox"><input type="checkbox" name="size[]" value="m" checked> Medium</label>
  </fieldset>
</ui-multiselect>
```

| Prop | Blade | Vue |
|------|-------|-----|
| `label` | `sr-only` text in the button and the panel's accessible name. Required. It does not show: put the visible label outside. | Same. |
| `options` | `value => label` array or collection. | `[{ value, label }]`. |
| `name` | Field name; `[]` is added so PHP receives every value. | Same; leave it off when no real form submits it. |
| `selected` / `v-model` | Ticked values. Pass `old('name', $current)` to refill after a failed validation. | An array of ticked values. |
| `required` | Stops the submit while nothing is ticked, as a required select does. | Same. |
| `max` | Disables the unticked boxes once this many are ticked. Say so in a `.hint`. | Same; a number, `:max="2"`. |
| `form` | Id of a form elsewhere on the page that submits it. | Same. |
| `disabled` | Cannot open; nothing is submitted, as a disabled select. | Same. |
| `autofocus` | Focuses the button on page load. | Same. |

- Other attributes (`class="w-48"`) land on the wrapper, except `aria-*` (`aria-describedby` for a hint), which goes on the button.
- Hand-written markup: one `<span>` per box inside the button's last span, same order, no whitespace between them (it would show), `hidden` on the unticked ones, and `data-count` on the button.
- The visible label is plain text such as `<label>Size</label>` with no `for`. A `<label for>` pointing at the button becomes its whole accessible name, so screen readers would no longer hear the ticked items.
- `<ui-multiselect>` (`resources/js/multiselect.js`) keeps the items and `data-count` in step with the boxes and sets `:state(overflow)` when they do not fit, which shows the count. Without that script everything else still works but the button keeps the server's ticks and never shows the count. It also follows boxes ticked from code, such as Inertia's `reset("tags[]")`, which fire no event.
- Hand-written markup takes the same attributes, where a select would have them: `required`, `max` and `form` on `<ui-multiselect>`, `form` and `name` on each box as well, `disabled` on the button and the `<fieldset>`, `autofocus` on the button.
- `required` uses the browser's own validation: the message sits on the button, and `:state(touched):invalid` turns the button red once the user has changed it or tried to submit. `required` and `max` need the script. Validate on the server as well, and show its message in a `.field` with a `<p class="error">`; the button turns red like any `.input`.
- Override one component in an app by copying it to `resources/views/vendor/ui/components/multiselect.blade.php` (`php artisan vendor:publish --tag=ui-views` copies all of them). A copy stops receiving package updates.

## Tooltip: `data-tooltip`

One line of supplementary text in a bubble above an element, on hover and keyboard focus. An attribute, not a class, and no JavaScript. Works on any element; for something that is not focusable, add `tabindex="0"` so keyboard users can reach it.

```html
<button class="btn" data-tooltip="Saves and closes the editor">Save</button>
<button class="btn ghost" data-tooltip="Copy to clipboard" aria-label="Copy to clipboard">…</button>
```

- Screen readers do not read the tooltip. An icon-only control still needs `aria-label`; use the same words in both.
- Keep the tooltip redundant with a visible label or accessible name; never put essential instructions in it.
- One line, up to `20rem`, then an ellipsis. Anything longer, or anything with markup, is a `.dropdown`.
- Always above and centred. It does not flip, slide, or respond to Escape because CSS has no keyboard event handling. Use it only where the reserved space above means it cannot cover other content. Otherwise use a `.dropdown`, which has native Escape dismissal and viewport-aware placement.
- The bubble inverts the region's colours (page foreground as fill), so it is correct inside `.light` `.dark` `.inverse` without extra classes.

Custom properties: `--tooltip-bg --tooltip-fg --tooltip-radius --tooltip-h --tooltip-px --tooltip-text --tooltip-gap --tooltip-tail`.

## Card: `.card`

A bordered box on `--color-card`. Children are styled by element, so no item classes exist.

| Child | Role |
|-------|------|
| `<header>` | Title row. A heading (`h2` to `h6`) sits left; the first thing after it is pushed to the far side. A `<p>` straight after the heading is a muted description on its own line. |
| `<hgroup>` | Groups the heading and its `<p>` description inside the header when a control shares the row. |
| `<footer>` | Action row. Flex, items centred, left-aligned; add `justify-end` to push buttons right. |
| anything else | Body. Stacks with the card gap. |
| first or last `<img>` `<picture>` `<video>` | Bleeds to the edges and takes the corner radius. |

```html
<div class="card">
  <header>
    <hgroup><h3>Billing</h3><p>Where invoices are sent.</p></hgroup>
    <button class="btn sm">Update address</button>
  </header>
  <p>Invoices go to accounts@example.com on the first of each month.</p>
  <footer><button class="btn primary">Save</button></footer>
</div>
```

| Kind | Classes |
|------|---------|
| Style | `divided`: a full-width line under the header and above the footer. |

- Which element: `div` for a box inside `main` or another sectioned area, `article` for a self-contained item in a list, `section` for a named region of the page. A `form` works too. A `header` or `footer` inside a `div` that has no `article`, `aside`, `main`, `nav` or `section` ancestor is announced as the page banner or contentinfo, so keep `div` cards inside one of those.
- Padding and the gap between children are `--card-p`, 1rem. Change it with `[--card-p:0.75rem]`, not `p-*`, so the media bleed and dividers follow. Gutters between cards are `gap-gap`.
- More than one control in the header goes in a `.join` or a `div class="flex gap-2"`.
- The radius is `--radius` capped at 1rem, so a pill theme does not round a card into an ellipse.

Custom properties: `--card-bg --card-fg --card-border --card-radius --card-p`.

In a `divided` card, a first-child header and last-child footer extend to the outer border and inherit its inner corners. Their contents keep the `--card-p` inset, so `bg-muted` on either section fills the edge without a padding strip. This also applies to divided dialogs.

## Dialog: `.dialog`

A card in the top layer, on a native `<dialog>`. Everything in the Card section applies inside it: `header`, `hgroup`, `footer`, media bleed, `divided`, `--card-p`. Open and close with button commands, no JavaScript. The browser handles Esc, focus trapping, the backdrop and returning focus to the trigger.

```html
<button class="btn primary" command="show-modal" commandfor="confirm">Delete project</button>
<dialog id="confirm" class="dialog" aria-labelledby="confirm-title">
  <header>
    <hgroup><h3 id="confirm-title">Delete this project?</h3><p>This cannot be undone.</p></hgroup>
    <button class="btn ghost sm" command="close" commandfor="confirm" aria-label="Close">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  </header>
  <p>Members lose access as soon as you press delete.</p>
  <footer class="justify-end">
    <button class="btn ghost" command="close" commandfor="confirm">Cancel</button>
    <button class="btn danger" command="close" commandfor="confirm">Delete</button>
  </footer>
</dialog>
```

| Kind | Attributes |
|------|------------|
| Open | `command="show-modal" commandfor="id"` on any button. |
| Close | `command="close" commandfor="id"` on any button, inside or outside the dialog. |
| Non-modal | Add `popover="manual"` to the dialog and open it with `command="show-popover"`, close with `command="hide-popover"`. Same box, centred, no backdrop, the page stays usable. There is no non-modal dialog command. |
| Dismiss | Esc by default. `closedby="any"` on the dialog adds click on the backdrop. `closedby="none"` removes Esc, for a dialog that must end with a button. |
| Width | 32rem, capped at the viewport minus a `gap` each side. Narrower with `max-w-sm`, wider with `w-[48rem]`. |
| Height | Capped at the viewport minus a `gap` each side; taller content scrolls inside. The header and footer scroll with it. |
| Drawer | `drawer`: a full-height panel, 24rem wide, that slides in from the end edge. `drawer start` slides from the start edge. Everything else is unchanged. `mt-auto` on the footer pins it to the bottom. |

- The close cross is a `btn ghost sm` with `aria-label="Close"`, placed straight after the heading or `hgroup` so the header pushes it to the far side. The dialog pulls it onto the heading line.
- Put `aria-labelledby` on the dialog pointing at its heading. Without it the dialog has no name.
- Form: the `<header>` and `<footer>` stay direct children of the dialog. Wrap only the fields in `<form id="f" method="dialog" class="contents">` and give the footer's submit button `form="f"`. `method="dialog"` closes on submit. Cancel is a `command="close"` button.
- Focus goes to the first focusable thing, which is the close cross. Put `autofocus` on the first field of a form instead.
- Place the dialog where a `div` card would go: inside `main`, `section` or another sectioned element, so its `header` is not announced as the page banner. Not as a direct child of a `space-y-*` or `space-x-*` container: those set margins on every child, and the dialog centres with `margin: auto`.

```html
<button class="btn" command="show-modal" commandfor="filters">Filters</button>
<dialog id="filters" class="dialog drawer divided" closedby="any" aria-labelledby="filters-title">
  <header>
    <h3 id="filters-title">Filters</h3>
    <button class="btn ghost sm" command="close" commandfor="filters" aria-label="Close">…x…</button>
  </header>
  <div class="field">…</div>
  <footer class="mt-auto justify-end"><button class="btn primary" command="close" commandfor="filters">Apply</button></footer>
</dialog>
```

Custom properties: `--dialog-w --dialog-shadow --dialog-backdrop`, plus the card ones.

## Accordion: `.accordion`

A stack of native `<details>`, each a bordered row that slides open. The `<summary>` is the trigger and the one element after it is the panel. No JavaScript; the chevron is drawn in CSS.

```html
<div class="accordion">
  <details name="faq" open>
    <summary>Is it accessible?</summary>
    <div>Yes. A native disclosure.</div>
  </details>
  <details name="faq">
    <summary>Is it styled?</summary>
    <div>Yes.</div>
  </details>
</div>
```

| Kind | Attributes |
|------|------------|
| Exclusive | The same `name` on every `<details>` in the group. Opening one closes the rest. Omit it to let several stay open. |
| Start open | `open` on the `<details>`. |

- The panel is one element after the summary: a `<p>`, or a `<div>` holding several things. Two siblings after the summary break the slide.
- Items are divided by a line; the last has none. Wrap the accordion in a `.card` for an outer border.
- Width is the container's. Use `max-w-xl` or similar.
- The slide and the chevron turn stop under `prefers-reduced-motion`.

Custom properties: `--accordion-fg --accordion-border --accordion-py --accordion-text --accordion-duration`.

## Table: `.table`

A data table on a native `<table>`. Children are styled by element, so no cell classes exist.

```html
<table class="table hover">
  <caption>Invoices for the last quarter.</caption>
  <thead>
    <tr>
      <th><button type="button">Invoice</button></th>
      <th aria-sort="ascending"><button type="button">Date</button></th>
      <th class="text-right">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>INV-001</td><td>1 Jul 2026</td><td class="text-right tabular-nums">£250.00</td></tr>
  </tbody>
  <tfoot>
    <tr><th scope="row" colspan="2">Total</th><td class="text-right tabular-nums">£250.00</td></tr>
  </tfoot>
</table>
```

| Child | Role |
|-------|------|
| `thead th` | Column header, muted, medium weight, line underneath. |
| `tbody th` | Row header, give it `scope="row"`. |
| `tfoot` | Totals row, medium weight, line above. |
| `caption` | A muted note under the table. |
| `th > button` | A sort control. `aria-sort="ascending"` or `"descending"` on the `th` draws the arrow; the app sorts. |
| `tr[aria-selected="true"]` | A highlighted row. Also automatic when the row's first cell holds a checked checkbox. |

| Kind | Classes |
|------|---------|
| Style | `striped` (every other row tinted), `hover` (the row under the pointer tinted). |
| Size | `sm`. No size = 2.25rem rows, matching the default button. |

- Alignment is a utility on the cell: `text-right tabular-nums` for numbers. `w-px` on a header shrinks its column to the content, for a checkbox or action column.
- A checkbox column is a `label class="checkbox"` in every first cell with an `aria-label`. An action column is a `btn ghost sm` opening a `.dropdown right`.
- A table never wraps its width. Put it in an `overflow-x-auto` wrapper with `tabindex="0"` to scroll sideways; the tabindex lets keyboard users scroll it.
- As a direct child of a `.card` (or a scroll wrapper that is), it runs edge to edge and its cell padding becomes the card inset. The last row takes the card's bottom corners.
- Row backgrounds are on the cells, so `bg-*` goes on `td`, not `tr`.

Custom properties: `--table-fg --table-head-fg --table-border --table-stripe --table-hover --table-selected --table-px --table-py --table-text`.

## DataTable: `DataTable.vue` and `TableQuery`

A Vue component for Inertia apps: search, sortable columns, declared filters, page size, hideable columns, row selection with bulk actions, and empty states. Hand it an array and it does the work in the browser. Hand it a Laravel paginator and the server did it, through `Altpro\Ui\TableQuery`. Search, sort, page and filters live in the query string, so the view is a link you can send and the back button works; page size and hidden columns are kept in `localStorage`. It needs `@inertiajs/vue3`. There is no Blade version.

```vue
<script setup lang="ts">
import DataTable from "../../vendor/altpro/ui/resources/js/DataTable.vue"; // or "@altpro/ui/js/DataTable.vue" from npm
import type { DataTableColumn, DataTableFilter } from "../../vendor/altpro/ui/resources/js/dataTable";

defineProps<{ brands: Brand[] }>();

const columns: DataTableColumn<Brand>[] = [
  { key: "name", label: "Name", sortable: true, tdClass: "font-medium" },
  { key: "created_at", label: "Added", sortable: true, format: "date" },
  { key: "actions", label: "Actions", virtual: true, thClass: "w-px" },
];
const filters: DataTableFilter<Brand>[] = [
  { key: "featured", label: "Featured only", type: "boolean" },
];
</script>

<template>
  <DataTable caption="Brands" name="brands" :columns="columns" :rows="brands" :filters="filters" sort="name" empty-message="No brands yet.">
    <template #cell-actions="{ row }">
      <Link :href="`/brands/${row.id}/edit`" class="btn ghost sm">Edit <span class="sr-only">{{ row.name }}</span></Link>
    </template>
  </DataTable>
</template>
```

Type the columns (`DataTableColumn<Brand>[]`): without it `key` is any string and a typo is not caught.

| Prop | Meaning |
|------|---------|
| `columns` | `{ key, label, sortable?, hideable?, thClass?, tdClass?, format?, currency? }`. `format` is `date`, `datetime`, `currency` or `boolean`, in the page's `<html lang>`; `currency` is an ISO code, default `GBP`. A column with no field behind it (actions, a status built from several fields) sets `virtual: true`; search skips it, and `sortValue: (row) => …` makes it sortable. |
| `rows` | An array (client mode) or a Laravel paginator, flat or under `meta` (server mode). |
| `caption` | Required. Names the table (sr-only caption), the search box and the pagination. |
| `name` | Prefixes the query parameters (`brands_sort`) and the stored preferences. Required when two tables share a page. |
| `searchable` | Keys to search. Defaults to every data column. Client mode only; the server searches what `TableQuery` is given. |
| `filters` | `{ key, label, type: "select" \| "multiple" \| "boolean", options?: [{ value, label }], default?, field?, match? }`. `default` applies when the URL says nothing; a select with a default needs its own "All" option. `match(row, values)` covers what a field comparison cannot. |
| `sort`, `direction` | Default sort. Without `sort`, the first sortable column, ascending. |
| `paginate` | Rows per page until the user picks another (10, 25, 50, 100). Default 25. |
| `selectable` | Adds the checkbox column and the bulk bar. `@update:selection` gives `null`, `{ mode: "ids", ids }` or `{ mode: "matching", search, filters, count }`. |
| `row-key` | The field that identifies a row, and what `ids` holds. Default `id`. A selectable table throws on a row without it rather than hand over positions. |
| `empty-message`, `no-matches-message` | "Nothing yet" and "nothing matches", which show differently: the second offers to clear the search. |
| `unfiltered-total` | Server mode: the count before search and filters, so the table can say "filtered from" and pick the right empty message. |
| `only` | Server mode: the props a change reloads, e.g. `['brands']`. |
| `search-placeholder` | Defaults to "Search…". |

| Slot | Gets |
|------|------|
| `cell-<key>` | `{ row, value }`. Replaces the cell, and wins over `format`. |
| `bulk-actions` | `{ selection, count, clear }`. Buttons for the bar shown while rows are selected. |
| `filters` | Extra controls in the toolbar. Filtering in the parent works, but then the table cannot count what was hidden. |
| `empty` | Under `empty-message`, e.g. a "Create one" link. |

- The header checkbox ticks the visible page only. Once the page is ticked and more rows match, the bar offers "Select all N matching", which hands over the query instead of ids: run it again on the server with `TableQuery::search()`.
- Any change except a page change goes back to page one and clears the selection.
- Markup: `.datatable` wraps `.controls`, `.bulk`, a scrolling `.scroll` region holding a `.table.hover`, and `.foot` (count, page size, pagination). Utilities on `thClass`/`tdClass` handle alignment and wrapping (`text-right tabular-nums`, `whitespace-nowrap`).

Server mode, in the controller:

```php
use Altpro\Ui\TableQuery;

$filters = [
    ['key' => 'featured', 'label' => 'Featured only', 'type' => 'boolean'],
];
$values = TableQuery::filters($request, $filters, name: 'brands');
$query = Brand::query()->when($values['featured'], fn ($q) => $q->where('featured', true));

return Inertia::render('Brands/Index', [
    'brands' => TableQuery::paginate($query, $request, name: 'brands', searchable: ['name', 'slug'], sortable: ['name', 'added' => 'created_at'], defaultSort: 'name'),
    'filters' => $filters,
    'unfilteredTotal' => Brand::count(),
]);
```

- `sortable` is the allow-list: a sort column from the URL that is not on it falls back to `defaultSort`, so user input never reaches `order by`. `['added' => 'created_at']` maps the column key to a database column.
- `defaultSort` and `defaultDirection` must match the component's `sort` and `direction`: a bare URL sorts by the controller's, and the header arrow shows the component's.
- Declare the filters once and pass the same array to the page as the `filters` prop. `TableQuery::filters()` reads it the way the component writes it and returns each filter's values by key: `[]` for none, the `default` when the URL says nothing. A boolean is `['1']` when ticked. What a value means stays in the controller, as `when()` clauses.
- `per_page` is honoured only for `TableQuery::pageSizes()` (10, 25, 50, 100); `perPage:` defaults to 25. A page past the end shows the last page.
- Search is `LIKE %term%` on each `searchable` column, so case follows the collation (MySQL and SQLite ignore it, Postgres does not) and a typed `%` or `_` is a wildcard. Client mode matches a case-insensitive substring.

## Alert: `.alert`

A callout box. Children are styled by element and position.

```html
<div class="alert warning">
  <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">…</svg>
  <h4>Payment overdue</h4>
  <p>The invoice for March was due a week ago.</p>
</div>
```

| Child | Role |
|-------|------|
| leading `<svg>` | The icon, in the accent colour. `size-4`, `aria-hidden`. |
| `<h2>` to `<h6>`, `<strong>` | The title. |
| direct-child `<button>` | Pinned to the far side of the title row. For a dismiss cross: `btn ghost xs` with `aria-label="Dismiss"` and `onclick="this.closest('.alert').remove()"`. |
| anything else | Body, on its own line, indented past the icon. Paragraphs, a list, a `div class="flex gap-2"` of buttons. |

The first thing after the icon shares its row, so `<svg>` then `<p>` is a one-line alert.

| Kind | Classes |
|------|---------|
| Colour | `primary` `info` `success` `warning` `danger` (`error` is an alias). Tints the box and colours the border and icon. No colour = a bordered box on the card colour. Text is always the page foreground. |

- Content present at page load needs no role. Something that appears after an action gets `role="status"` (polite) or `role="alert"` (interrupts); the role goes on the box so screen readers announce it.
- The radius is `--radius` capped at 1rem, like a card.

Custom properties: `--alert-accent --alert-bg --alert-fg --alert-border --alert-radius --alert-p --alert-text --alert-icon`.

## Tabs: `.tabs`

A row of underlined tabs like GitHub's repository header. Two modes, no JavaScript.

Links, one page per tab:

```html
<nav class="tabs" aria-label="Repository">
  <a href="/code" aria-current="page"><svg class="size-4" aria-hidden="true">…</svg> Code</a>
  <a href="/pulls">Pull requests <span class="badge">1</span></a>
</nav>
```

Panels, switched in place:

```html
<div class="tabs">
  <label><input type="radio" name="repo" checked> Code</label>
  <label><input type="radio" name="repo"> Pull requests</label>
  <div>Code panel</div>
  <div>Pull requests panel</div>
</div>
```

| Kind | How |
|------|-----|
| Tab | A direct-child `<a>`, `<label>` or `<button>`. An `svg` before the text and a `.badge` after it are optional. |
| Active | `aria-current="page"` on a link, `checked` on the radio in a label, `aria-selected="true"` on a script-driven button. |
| Panels | Any elements after the labels, in the same order: the first non-label child belongs to the first label. Hidden until their radio is checked. Up to eight tabs. |

- One radio `name` per group. Arrow keys move between tabs like a tablist.
- Keep `display` utilities such as `grid` and `flex` on a child inside each panel. A display utility on the direct panel overrides its hidden state because Tailwind utilities win over component styles.
- Tabs wrap when the row is too narrow. Add `overflow-x-auto flex-nowrap` for a scrolling row instead.
- The active bar is `--tabs-active`, the primary colour by default. Text stays the page foreground.

Custom properties: `--tabs-fg --tabs-active-fg --tabs-active --tabs-hover --tabs-border --tabs-radius --tabs-h --tabs-px --tabs-text`.

## Progress and meter: `.progress` `.meter`

Native `<progress>` and `<meter>`, restyled. The browser owns the value and announces it, so no ARIA beyond a name. Both share one set of custom properties.

```html
<div class="field">
  <label for="upload" class="flex justify-between">Uploading <output for="upload">45%</output></label>
  <progress class="progress" id="upload" value="45" max="100"></progress>
</div>

<progress class="progress" aria-label="Loading"></progress>

<meter class="meter" value="45" min="0" max="64" low="32" high="52" optimum="0" aria-label="Disk used"></meter>
```

| Kind | Classes / attributes |
|------|----------------------|
| Colour | `primary` `secondary` `info` `success` `warning` `danger` (`error` is an alias). No colour = primary for a progress; the band colour for a meter. |
| Size | `sm` (0.25rem), `lg` (0.75rem). No size = 0.5rem tall. |
| Indeterminate | A `<progress>` with no `value` sweeps a stripe along the track. Still under `prefers-reduced-motion`. |
| Meter bands | `low`, `high` and `optimum` place the value in a band. Optimum band is success, the next is warning, the furthest is danger. `optimum="0"` means low is good (disk used); `optimum` equal to `max` means high is good (battery). A colour word pins one colour instead. |

- Name it: `<label for>` or `aria-label`. Put the number in an `<output for>` inside the label so sighted users see it too.
- Width is the container's. Use `w-48`, `max-w-md` or a grid column.
- Works inside `.field` and `.card`; a `label class="flex justify-between"` puts the value on the right.

Custom properties, shared by both: `--progress-bg --progress-fg --progress-h --progress-radius`.

## Range: `.range`

A restyled native `<input type="range">`. Keyboard, touch and `step` come from the browser.

```html
<div class="field">
  <label for="volume" class="flex justify-between">Volume <output for="volume">40</output></label>
  <input class="range" id="volume" type="range" min="0" max="100" value="40"
         oninput="this.previousElementSibling.lastElementChild.value = this.value">
</div>
```

| Kind | Classes / attributes |
|------|----------------------|
| Size | `sm`, `lg`. No size = 0.5rem track, 1.25rem thumb. |
| State | `disabled`. Focus ring on the thumb. |

- The input is at least 1.5rem tall, so the whole strip is a 24px target.
- CSS cannot read the value, so an `<output>` needs the one-line `oninput` above.
- No filled track left of the thumb, and `<datalist>` ticks are not drawn. The thumb is `--range-accent`; `[--range-accent:var(--color-success)]` for a green one.

Custom properties: `--range-track --range-accent --range-ring --range-h --range-thumb --range-radius`.

## Pagination (pattern)

No class. A `<nav aria-label="Pagination">` of `.btn` links, in a `.join` for a bar or `flex gap-1` with `ghost` buttons for a lighter row.

```html
<nav class="join" aria-label="Pagination">
  <a class="btn outlined" role="link" aria-label="Previous page" aria-disabled="true"><svg class="size-4" aria-hidden="true">…</svg></a>
  <a href="?page=1" class="btn primary" aria-current="page">1</a>
  <a href="?page=2" class="btn outlined">2</a>
  <a href="?page=3" class="btn outlined">3</a>
  <span class="btn outlined pointer-events-none">…</span>
  <a href="?page=12" class="btn outlined">12</a>
  <a href="?page=2" class="btn outlined" aria-label="Next page"><svg class="size-4" aria-hidden="true">…</svg></a>
</nav>
```

- Current page: `aria-current="page"` and the `primary` colour. The other pages are `outlined` (joined) or `ghost` (spaced).
- Arrows are icon-only, so each link has an `aria-label`. On the first or last page remove the disabled arrow's `href`, then add `role="link"` and `aria-disabled="true"`; a script-driven `<button>` uses `disabled`.
- Ellipsis: a `<span class="btn outlined pointer-events-none">…</span>`, so it lines up but is not a control.
- Previous and next only: two `btn outlined` links in a `flex justify-between`, with words instead of numbers.
- Table footer: a `div` (not a `nav`) holding the row count, a `select class="input sm"` for page size, a `p aria-live="polite"` saying "Page 2 of 12", and a `join` of `btn outlined sm` first, previous, next and last arrows.

## Loading: `.skeleton` `.spinner`

Skeleton: a muted block the shape of the content that has not arrived. 1em tall by default; size and round it with utilities. It shimmers unless motion is reduced. Give the region it fills `aria-busy="true"` and one `sr-only` "Loading".

```html
<div class="card" aria-busy="true">
  <span class="sr-only">Loading</span>
  <div class="flex items-center gap-3">
    <div class="skeleton size-10 rounded-full"></div>
    <div class="flex-1 space-y-2"><div class="skeleton h-4 w-2/5"></div><div class="skeleton h-3 w-1/4"></div></div>
  </div>
</div>
```

Spinner: a turning ring in `currentColor`, so `text-primary` colours it. It says nothing on its own: give it `role="status"` and `sr-only` text, or put it beside visible text.

```html
<span class="spinner" role="status"><span class="sr-only">Loading</span></span>
<p class="flex items-center gap-2" role="status"><span class="spinner sm"></span>Saving changes</p>
<button class="btn primary loading" disabled aria-busy="true">Saving</button>
```

| Kind | Classes |
|------|---------|
| Spinner size | `xs` `sm` `lg` `xl`. No size = 1.25rem. |
| Button | `loading` on `.btn`, see the Button section. |

- Match skeleton sizes to the real content (`h-9` for a `text-3xl` number) so nothing moves when data lands. In a table, one skeleton per cell for as many rows as usual.
- Reduced motion: the skeleton stops shimmering; the spinner keeps turning at a third of the speed, since it is the signal itself.

Custom properties: `--skeleton-bg --skeleton-shine --skeleton-radius`, `--spinner-size --spinner-width`.

## Steps: `.steps`

An `<ol>` of numbered markers joined by a line. Put `aria-current="step"` on the current `<li>`; steps before it are drawn done (primary marker and line), the current one is bold, later ones are muted. No done or todo classes.

```html
<ol class="steps">
  <li><a href="/cart">Cart</a></li>
  <li><a href="/delivery">Delivery</a></li>
  <li aria-current="step">Payment</li>
  <li>Review</li>
</ol>
```

| Kind | Classes |
|------|---------|
| Layout | Horizontal, each step an equal column. `vertical` stacks them. |

- Done steps can hold an `<a>` back to that step. Current and later steps are plain text.
- Vertical: a one-line label sits on the marker's centre line. A description goes in a `span class="block font-normal leading-normal muted"` after the label.
- Width is the container's: `max-w-2xl` or a card.

Custom properties: `--steps-fg --steps-marker-bg --steps-marker-fg --steps-active-bg --steps-active-fg --steps-line --steps-marker`.

## Timeline: `.timeline`

An `<ol>` of events, a dot each joined by a line. For an audit history or activity feed. Every event has happened, so there is no current or done state; use `.steps` for that.

```html
<ol class="timeline">
  <li>
    <span class="avatar blue">SR</span>
    <p><b>Steve Rayner</b> changed the price from £12.00 to £14.00</p>
    <time datetime="2026-09-15T09:30">Today, 09:30</time>
  </li>
  <li class="danger">
    <p><b>Ann Okafor</b> archived the product</p>
    <time datetime="2026-09-14T16:05">Yesterday, 16:05</time>
  </li>
</ol>
```

| Kind | Classes |
|------|---------|
| Dot colour, on the `<li>` | `primary` `info` `success` `warning` `danger` |

- An `.avatar` as the first child of an item replaces the dot and is sized to the marker.
- A `<time>` is drawn muted on its own line. Anything else inside the item is ordinary content.
- Width is the container's: `max-w-md` or a card.

Custom properties: `--timeline-dot --timeline-line --timeline-marker`.

## Toast: `.toaster`

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

## Stat (pattern)

No class. A `.card` with a muted label, a big number and an optional change line, several in a grid.

```html
<div class="grid gap-gap sm:grid-cols-2 lg:grid-cols-4">
  <div class="card">
    <p class="text-sm muted">Revenue</p>
    <p class="text-3xl font-semibold tabular-nums">£12,400</p>
    <p class="text-sm text-success">Up 12% on last month</p>
  </div>
</div>
```

- The label is a `p`, not a heading, so a dashboard of many stats is not many sections.
- The change line says the direction in words (`Up 12%`) and what it compares to, not colour alone. `text-success` up, `text-danger` down, `muted` for no change or a plain note.
- An icon on the right: a `<header>` holding the label `p` and the svg, so the card pushes the svg to the far side. A limit: a `.meter` under the number.
- Loading: a `.skeleton h-9 w-32` for the number and `h-5 w-40` for the change line, with `aria-busy="true"` on the card.

## Theme tokens

All colours are Tailwind theme variables, so `bg-primary`, `text-muted-foreground`, `border-border` and the rest exist as utilities. `muted` is short for `text-muted-foreground`. Each `X` has an `X-foreground` for text placed on it.

```
background  foreground
card        card-foreground
muted       muted-foreground
border      ring
primary     secondary  info  success  warning  danger   (each with -foreground)
red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose
            (hue fills: a tint in light, a deep shade in dark; pair with text derived from them, as .avatar does)
```

Every token is `light-dark()`, so the same class is correct in both schemes. Do not write `dark:` variants for these colours.

Spacing: `--spacing-gap` is one responsive unit, 1rem, then 1.5rem from `md` and 2rem from `lg`. It gives `p-gap`, `m-gap`, `gap-gap`, `size-gap` and the rest, plus `2gap` and `3gap` multiples (`p-2gap`, `mt-3gap`). Use it for the padding of panels and the gutters between them so the whole page loosens together on wider screens.

Override in the app's stylesheet, after the altpro/ui import:

```css
@theme {
  --color-primary: oklch(0.6 0.2 30);
  --color-primary-foreground: white;
}
:root { --radius: 9999px; }   /* one knob for corner radius: 0 = square, 9999px = pill */
```

## Scheme regions

The page follows the OS. To pin it, set `data-theme="light"` or `data-theme="dark"` on `<html>`.

| Class | Effect on its subtree |
|-------|-----------------------|
| `light` | always light |
| `dark` | always dark |
| `inverse` | the opposite of the nearest region above it, at any nesting depth |

Regions paint their own background and text colour. Use `inverse` for things like a dark footer on a light site that should become light when the site is dark.

Tailwind's `dark:` variant follows the OS media query and ignores these regions. Prefer the tokens. If an app really needs `dark:` to follow regions, add to its stylesheet:

```css
@custom-variant dark (@container style(--scheme: dark));
```

## Demo

Run `npm run dev` inside the altpro/ui repository to browse every component with a theme and radius switcher.
