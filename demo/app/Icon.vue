<script setup>
import { icon } from '../demo.js';
defineProps({ name: { type: String, default: 'blocks' } });
</script>
<template><span class="demo-icon" aria-hidden="true" v-html="icon(name)"></span></template>
