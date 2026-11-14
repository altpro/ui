<!--
  <EmailAddress :email="user.email" />
  Invitation sent to <EmailAddress :email="user.email">.</EmailAddress>

  An email address that breaks at the @ when it must, never inside the domain: a long address wraps as
  "samantha.longname / @example.co.uk". Put it in a wrap-anywhere line. Punctuation that follows the address in a
  sentence goes in the default slot, inside the domain, so a full stop never wraps onto a line of its own.
  See email-address.md.
-->
<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ email: string }>();
defineSlots<{ default?: () => unknown }>();

const at = computed(() => Math.max(props.email.lastIndexOf("@"), 0));
</script>

<template>
  <span class="wrap-anywhere">{{ email.slice(0, at) }}<span class="inline-block w-max max-w-full align-bottom wrap-anywhere whitespace-normal">{{ email.slice(at) }}<slot /></span></span>
</template>
