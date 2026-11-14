# Avatar: `.avatar`

A circle showing a photo or initials. Put the class on the `<img>` itself, or on a `<span>` holding initials (or wrapping an `<img>`). Always round, whatever `--radius` is; add `rounded-lg` to square one.

| Kind | Classes |
|------|---------|
| Hue | Any Tailwind hue name: `red` `orange` `amber` `yellow` `lime` `green` `emerald` `teal` `cyan` `sky` `blue` `indigo` `violet` `purple` `fuchsia` `pink` `rose`. No hue = neutral grey. |
| Size | `xs` `sm` `lg` `xl`. No size = 2.5rem. Initials are 0.4 of the size and never below `text-xs`. |

```html
<img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
<span class="avatar blue lg">LW</span>
```

Hues are a tint in light and a deep shade in dark; text colour is derived from the fill, so any hue is readable in both. An `<a>` or `<button>` avatar gets a focus ring. Give it an `aria-label` that starts with the initials and then says who or what, `aria-label="GH, Grace Hall's profile"`: initials alone are not a name, and a label that leaves them out fails WCAG 2.5.3 (Label in Name), because a voice-control user says what they see.

Groups: wrap avatars in `.join` and they overlap by a third with a 2px ring between them. A plain `<span class="avatar">+3</span>` at the end is the overflow count. On a non-page background set `--avatar-ring` on the group to the surface colour.

```html
<div class="join">
  <img class="avatar" src="/u/ada.jpg" alt="Ada Okafor">
  <span class="avatar green">BS</span>
  <span class="avatar">+3</span>
</div>
```

Custom properties: `--avatar-bg --avatar-fg --avatar-size --avatar-radius --avatar-ring`.

## A person: `UserAvatar.vue`

A person's photo, or their initials on a hue picked from their name, so the same person has the same colour on every screen.

```vue
<script setup>
import UserAvatar from "@ui/UserAvatar.vue";
</script>

<template>
  <UserAvatar :user="user" />
  <UserAvatar :user="user" size="lg" />
</template>
```

- `user` is `{ name, avatar }`, with `avatar` a photo URL or `null`. `size` is the class's (`xs sm lg xl`).
- It is decorative: the photo's `alt` is empty and the initials are `aria-hidden`, so put the name beside it in text. As a button's only content, name the button with the initials first: `:aria-label="`${getInitials(user.name)}, user menu`"`.
- `@ui/avatar` exports the two halves for anything else: `getInitials(name)` ("Sam Taylor" is "ST", "Cher" is "C") and `avatarHue(name)`, one of twelve hue words.
