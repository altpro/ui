<!--
  Type test for apps: vue-tsc checks these usages as an app's TypeScript would see them, so a component whose
  inferred prop types are narrower than its docs fails test:unit here. Never rendered.
  @vue-expect-error marks what must stay an error.
-->
<script setup lang="ts">
import { ref } from "vue";
import FileInput from "../resources/js/FileInput.vue";

const one = ref<File | null>(null);
const many = ref<File[]>([]);
</script>

<template>
  <FileInput v-model="one" name="photo" />
  <FileInput v-model="many" name="photos" multiple />
  <!-- @vue-expect-error a string is not a file -->
  <FileInput model-value="photo.jpg" />
</template>
