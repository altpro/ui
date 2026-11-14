<!--
  <UserAvatar :user="user" />                 photo, or initials on the person's own hue
  <UserAvatar :user="user" size="lg" />

  A person's .avatar: their photo when `user.avatar` is a URL, otherwise their initials on a hue picked from the name,
  so the same person has the same colour on every screen. It is decorative (an empty alt, aria-hidden initials): put
  the name beside it in text, or name the button it sits in ("ST, user menu"). See avatar.md.
-->
<script setup lang="ts">
import { avatarHue, getInitials } from "./avatar";

defineProps<{
  user: { name: string; avatar?: string | null };
  size?: "xs" | "sm" | "lg" | "xl";
}>();
</script>

<template>
  <img v-if="user.avatar" :src="user.avatar" alt="" class="avatar shrink-0 object-cover" :class="size" />
  <span v-else class="avatar shrink-0" :class="[size, avatarHue(user.name)]" aria-hidden="true">{{ getInitials(user.name) }}</span>
</template>
