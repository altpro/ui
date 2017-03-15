<template>
    <div class="loader" v-if="loading">
        <svg class="spinner" width="32px" height="32px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
        </svg>
    </div>
</template>

<script>
    export default {
        props: {
            loading: Boolean
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    $offset: 187;
    $duration: 1.4s;

    .loader {
        display: flex;
        justify-content: center;
        padding: 24px;

        .spinner {
            animation: rotator $duration linear infinite;
        }

        @keyframes rotator {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(270deg);
            }
        }

        .path {
            stroke: var(--primary);
            stroke-dasharray: $offset;
            stroke-dashoffset: 0;
            transform-origin: center;
            animation: dash $duration ease-in-out infinite;
        }

        @keyframes dash {
            0% {
                stroke-dashoffset: $offset;
            }
            50% {
                stroke-dashoffset: $offset/4;
                transform: rotate(135deg);
            }
            100% {
                stroke-dashoffset: $offset;
                transform: rotate(450deg);
            }
        }
    }
</style>

