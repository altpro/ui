<template>
    <div class="dropdown">
        <slot name="trigger" class="trigger"></slot>
        <div class="target" ref="target" v-show="opened">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            persist: Boolean
        },

        data() {
            return {
                opened: false
            }
        },

        mounted() {
            this.$el.firstChild.addEventListener('click', this.toggle);
        },

        methods: {
            toggle(e) {
                if (e) e.stopPropagation();
                if (this.opened) {
                    this.close();
                } else {
                    this.open();
                }
            },

            open() {
                this.opened = true;

                this.$nextTick(() => {
                    const target = this.$refs.target;
                    const rect = target.getBoundingClientRect();

                    // Force the drop to open up if specified
                    if (this.$el.classList.contains('up')) {
                        target.style.top = `-${rect.height}px`;
                    }

                    // Don't let it drop below the viewport
                    if (rect.bottom > window.innerHeight) {
                        target.style.height = `${(window.innerHeight - rect.top) - 16}px`;
                    }

                    document.addEventListener('click', this.close);
                    document.addEventListener('keydown', this.close);
                });
            },

            close(e) {
                if (e && e.type === 'keydown' && ! (e.which === 27 || e.keyCode === 27)) return;
                if (e && this.persist && this.$refs.target.contains(e.target)) return;

                this.opened = false;
                document.removeEventListener('click', this.close);
                document.removeEventListener('keydown', this.close);
            }
        },

        destroyed() {
            document.removeEventListener('click', this.close);
            document.removeEventListener('keydown', this.close);
        },
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .dropdown {
        position: relative;
        display: inline-flex;

        > .target {
            position: absolute;
            display: block;
            min-width: 96px;
            max-width: 300px;
            z-index: 9;
            background: #fff;
            overflow-y: auto;
            max-height: 50vh;
            top: 100%;
            @include shadow-4dp;
        }

        &.left > .target {
            left: 0;
        }

        &.right > .target {
            right: 0;
        }

        .menu {
            white-space: nowrap;
            padding: 8px 0;

            a, .link, button {
                display: flex;
                align-items: center;
                font-size: 14px;
                background: #fff;
                text-decoration: none;
                color: $text;
                padding: 8px 16px;
                margin: 0;

                &:hover, &:focus {
                    background: $grey-lightest;
                }

                &[disabled] {
                    opacity: .5;

                    &:hover, &:focus {
                        background: #fff;
                    }
                }
            }

            i {
                font-size: 18px;

                &:first-child {
                    margin-right: 8px;
                }
            }

            .no-icon {
                padding-left: 42px;
            }
        }
    }
</style>
