<template>
    <transition name="modal">
        <div class="modal" v-if="isOpen">
            <div class="dialog">
                <slot></slot>
                <div class="actions">
                    <slot name="actions">
                        <button class="action" @click="close">Ok</button>
                    </slot>
                </div>
            </div>
        </div>
    </transition>
</template>


<script>
    export default {
        props: {
            open: Boolean
        },

        data() {
            return {
                isOpen: false
            }
        },

        watch: {
            open(value) {
                if (value === true) {
                    this.show();
                } else {
                    this.close();
                }
            }
        },

        methods: {
            show() {
                this.isOpen = true;
                this.$emit('open');
            },

            close() {
                this.isOpen = false;
                this.$emit('close');
            },

            toggle() {
                return this.isOpen ? this.close() : this.show();
            }
        }
    }
</script>

<style lang="scss" rel="stylesheet/scss">
    @import "../styles/_global.scss";

    .modal {
        position: fixed;
        z-index: 99;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: rgba(0, 0, 0, .4);
        display: flex;
        justify-content: center;
        align-items: center;
        transition: opacity .3s ease;
    }

    .dialog {
        background: #fff;
        border-radius: var(--radius);
        padding: 24px;
        width: 280px;

        > .actions {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 8px;
            margin: 24px -24px -24px;
        }
    }

    .modal-enter {
        opacity: 0;
    }

    .modal-leave-active {
        opacity: 0;
    }

</style>
