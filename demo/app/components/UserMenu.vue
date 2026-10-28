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
