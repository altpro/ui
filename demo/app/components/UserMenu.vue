<script setup>
import { computed } from "vue";
import { Link, usePage } from "@inertiajs/vue3";
import { ChevronsUpDown, LogOut, Settings } from "@lucide/vue";

// the shell renders the menu twice, in the sidebar and in the drawer, so each copy needs its own popover id
defineProps({ id: { type: String, required: true } });

// auth.user is the signed-in user, which HandleInertiaRequests shares with every page
const user = computed(() => usePage().props.auth.user);
const initials = computed(() => user.value.name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase());
</script>

<template>
  <div>
    <button type="button" class="btn ghost w-full justify-start px-2" :popovertarget="id">
      <span class="avatar sm" aria-hidden="true">{{ initials }}</span>
      <span class="min-w-0 truncate">{{ user.name }}</span>
      <ChevronsUpDown class="ms-auto size-4" aria-hidden="true" />
    </button>
    <div :id="id" popover class="dropdown up w-56">
      <div class="nav">
        <p class="truncate px-3 py-2 text-sm text-muted-foreground">{{ user.email }}</p>
        <hr>
        <Link href="/settings"><Settings class="size-4" aria-hidden="true" /> Settings</Link>
        <Link href="/logout" method="post" as="button" type="button"><LogOut class="size-4" aria-hidden="true" /> Log out</Link>
      </div>
    </div>
  </div>
</template>
