<template>
    <transition name="modal">
        <div class="modal">
            <div class="dialog">
                <slot></slot>
                <div class="actions">
                    <slot name="actions">
                        <button class="flat">Cancel</button>
                        <button class="primary-colour">Ok</button>
                    </slot>
                </div>
            </div>
        </div>
    </transition>
</template>


<script>
    export default {
        methods: {
            close() {
                this.$emit('close');
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
        border-radius: 2px;
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

    .modal-enter .modal-container,
    .modal-leave-active .modal-container {
        transform: scale(1.1);
    }

</style>
