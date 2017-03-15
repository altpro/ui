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

            pathMatches(regex) {
                return regex.test(window.location.pathname);
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
        width: var(--drawer);
        height: 100vh;
        max-height: 100vh;
        overflow: auto;
        position: fixed;
        z-index: 16;
        top: 0;
        left: 0;
        background: var(--background);
        padding: 16px 0;
        transition: 0.2s ease-in-out;
        transform: translateX(calc(-1 * var(--drawer)));
        box-shadow: var(--shadow-2dp);

        @media #{$desktop} {
            z-index: 14; // just under the toolbar
            padding: (16px + var(--toolbar)) 0 16px;
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

        a, details > summary {
            display: flex;
            align-items: center;
            width: 100%;
            font-size: 13px;
            color: var(--color);
            text-decoration: none;
            text-transform: uppercase;
            padding: 8px 36px 8px 62px;
            position: relative;
            transition: 0.3s ease-in-out;

            &:hover {
                background: var(--lightest);
                color: var(--primary);
            }

            &.active {
                font-weight: var(--font-highlight);
                color: var(--primary);
            }

            > i {
                margin-left: -40px;
                margin-right: 16px;
                opacity: .9;
            }
        }

        summary {
            &:after {
                font-size: 16px;
            }
            + * {
                margin-top: 0;
            }
        }

        details[open] summary {
            color: var(--color);
            > i {
                color: var(--primary);
            }
        }

        details {
            a {
                text-transform: none;
            }
            > details {
                > summary {
                    text-transform: none;
                    width: auto;
                    &:after {
                        content: 'arrow_drop_down';
                        margin-left: -24px;
                        margin-right: 8px;
                        order: -1;
                        transform: rotate(-90deg);
                    }
                }
                &[open] > summary:after {
                    transform: rotate(0deg)
                }
            }
        }

        h4 {
            font-size: 13px;
            font-weight: var(--font-highlight);
            padding: 16px 36px 8px 26px;
        }

        hr {
            margin: 4px 0;
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
