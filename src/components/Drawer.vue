<template>
    <div>
        <nav class="drawer" :class="{ open }">
            <slot></slot>
        </nav>
        <div class="drawer-fader" :class="{ open }" @click="close"></div>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                open: false
            }
        },

        mounted() {
            if (this.$router) {
                this.$router.beforeEach((to, from, next) => {
                    if (this.open) {
                        this.close();
                    }

                    next();
                });
            }
        },

        methods: {
            show() {
                document.addEventListener('keydown', this.closeOnEscape);
                this.open = true;
            },

            close() {
                this.open = false;
                document.removeEventListener('keydown', this.closeOnEscape);
            },

            toggle() {
                if (this.open) {
                    this.close();
                } else {
                    this.show();
                }
            },

            closeOnEscape(e) {
                if (e.which === 27 || e.keyCode === 27) {
                    this.close();
                }
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .drawer {
        width: $drawer-width;
        height: 100vh;
        max-height: 100vh;
        overflow: auto;
        position: fixed;
        z-index: 16;
        top: 0;
        left: 0;
        background: $drawer-background;
        padding: 16px 0;
        transition: 0.2s ease-in-out;
        transform: translateX(-$drawer-width);
        @include shadow-2dp;

        @media #{$desktop} {
            z-index: 14; // just under the toolbar
            padding: (16px + $toolbar-large) 0 16px;
            overflow: hidden;

            &:hover {
                overflow: auto;
            }
        }

        @media #{$xl} {
            transform: translateX(0);
        }

        &.open {
            transform: translateX(0);
        }

        a {
            color: $link;
            border-left: 4px solid $drawer-background;
            text-decoration: none;
            display: block;
            padding: 8px 36px;
            position: relative;
            transition: 0.3s ease-in-out;

            &:hover {
                color: $drawer-hover;
            }

            > i {
                font-size: 18px;
            }

            &.active {
                font-weight: $font-highlight;
                color: $hover;
                border-left: 4px solid $drawer-hover;
            }
        }
    }

    .drawer-fader {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 15;
        background: rgba(0,0,0,0.4);

        @media #{$desktop} {
            z-index: 13;
        }

        &.open {
            display: block;
            @media #{$xl} {
                display: none;
            }
        }
    }
</style>
