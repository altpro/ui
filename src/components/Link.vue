<template>
    <router-link v-if="to" :to="to" ref="rippleTrigger">
        <slot></slot>
        <app-ripple></app-ripple>
    </router-link>
    <a v-else ref="rippleTrigger">
        <slot></slot>
        <app-ripple></app-ripple>
    </a>
</template>

<script>
    import AppRipple from './Ripple.vue';

    export default {
        props: ['to'],

        components: {
            AppRipple
        }
    }
</script>
